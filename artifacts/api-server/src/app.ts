import express, { type Express } from "express";
// Import the Express framework to build the web server
import cors from "cors";
// Import CORS to allow other websites to talk to this server
import helmet from "helmet";
// Import Helmet to add security protections to the server
import { rateLimit } from "express-rate-limit";
// Import rateLimit to prevent users from sending too many requests quickly
import path from "path";
// Import path to help with finding files on the computer
import fs from "fs";
// Import fs to work with the computer's file system (like creating folders)
import { fileURLToPath } from "url";
// Import fileURLToPath to convert file URLs into normal file paths
import router from "./routes";
// Import the routes which define where the server links go
import { logger } from "./lib/logger";
// Import the logger to record important events

const app: Express = express();
// Create a new Express application instance

// 1. Helmet security middleware (crossOriginResourcePolicy: "cross-origin" is required so Expo Web can load static assets)
app.use(helmet({
  // Use Helmet for security
  crossOriginResourcePolicy: { policy: "cross-origin" }
  // Allow images and files to be shared across different domains
}));
// End of Helmet setup

// 2. Rate Limiter to guard against DDoS and automated script spams
const limiter = rateLimit({
  // Setup a rule for how many requests a user can make
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Set the time window to 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  // Allow a maximum of 300 requests in that time
  standardHeaders: true,
  // Send back standard rate limit info in the headers
  legacyHeaders: false,
  // Disable old style rate limit headers
  message: { error: "Too many requests from this IP, please try again later." }
  // The message to show when someone sends too many requests
});
// End of rate limiter configuration

app.use(limiter);
// Apply the rate limit rule to all incoming requests

// 3. Secure production CORS: uses ALLOWED_ORIGINS env if defined, otherwise allows dynamic wildcard in development
const allowedOrigins = process.env.ALLOWED_ORIGINS
  // Check if there is a list of allowed websites in the environment
  ? process.env.ALLOWED_ORIGINS.split(",")
  // If yes, split that list into individual website addresses
  : true;
  // If no list is found, allow all (mostly for development)

app.use(cors({ credentials: true, origin: allowedOrigins }));
// Apply the CORS rules to allow connections from the specified websites

const __filename = fileURLToPath(import.meta.url);
// Get the full path of the current file
const __dirname = path.dirname(__filename);
// Get the name of the folder where the current file is located
const assetsPath = path.resolve(__dirname, "../../logo-store/assets");
// Find the location of the assets folder in the logo-store directory
app.use("/api/assets", express.static(assetsPath, {
  // Make the assets folder available at the /api/assets URL
  maxAge: "1d",
  // Tell the browser to save these files for 1 day
  immutable: true,
  // Tell the browser these files won't change
}));
// End of assets folder setup

const uploadsPath = path.resolve(__dirname, "../../uploads");
// Find the location of the uploads folder
if (!fs.existsSync(uploadsPath)) {
  // Check if the uploads folder does not exist yet
  fs.mkdirSync(uploadsPath, { recursive: true });
  // Create the uploads folder if it is missing
}
// End of uploads folder check

app.use("/api/uploads", express.static(uploadsPath));
// Make the uploads folder available at the /api/uploads URL

app.use(express.json());
// Tell the app to understand data sent in JSON format
app.use(express.urlencoded({ extended: true }));
// Tell the app to understand data sent from HTML forms

app.use("/api", router);
// Connect all the defined routes starting with the /api prefix

process.on("unhandledRejection", (reason, promise) => {
  // Catch any errors from "promises" that were not handled
  console.error("UNHANDLED REJECTION:", reason);
  // Log the reason why the promise failed
});
// End of unhandled rejection handler

process.on("uncaughtException", (err) => {
  // Catch any regular errors that were not caught by other code
  console.error("UNCAUGHT EXCEPTION:", err);
  // Log the error details
});
// End of uncaught exception handler

app.use((err: any, req: any, res: any, next: any) => {
  // A global handler for any errors that happen during requests
  console.error("GLOBAL ERROR HANDLER:", err);
  // Log the error to the console
  res.status(500).json({ error: "Internal Server Error", details: err.message });
  // Send a 500 error response to the user with the error message
});
// End of global error handler

export default app;
// Export the app so it can be used in other files (like index.ts)

