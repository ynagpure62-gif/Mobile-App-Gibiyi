import "./load-env";
// Load the configuration settings from the .env file
import app from "./app";
// Import the server application setup from the app file
import { logger } from "./lib/logger";
// Import the logger to keep track of what the server is doing

const rawPort = process.env["PORT"];
// Get the port number from the system's environment variables

if (!rawPort) {
  // Check if the port number was not found
  throw new Error(
    // If not found, stop everything and show an error message
    "PORT environment variable is required but was not provided.",
    // The specific error message for a missing port
  );
  // End of the error throwing process
}
// End of the check for the raw port

const port = Number(rawPort);
// Convert the port string into a real number

if (Number.isNaN(port) || port <= 0) {
  // Check if the port is not a valid number or is zero or less
  throw new Error(`Invalid PORT value: "${rawPort}"`);
  // If the port is invalid, show an error message with the bad value
}
// End of the check for a valid port number

app.listen(port, "0.0.0.0", (err) => {
  // Tell the app to start listening for requests on the given port
  if (err) {
    // If there is an error while starting the server
    logger.error({ err }, "Error listening on port");
    // Record the error in the logs
    process.exit(1);
    // Shut down the program because it cannot start properly
  }
  // End of the error check

  logger.info({ port }, "Server listening on 0.0.0.0");
  // If it starts correctly, log a message saying the server is running
});
// End of the server listen function

