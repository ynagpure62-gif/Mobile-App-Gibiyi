// Import the Router module from express to create route handlers
import { Router } from "express";
// Import the database connection instance
import { db } from "@workspace/db";
// Import the categories table schema for database queries
import { categoriesTable } from "@workspace/db/schema";

// Initialize a new Express router for category routes
const router = Router();

// Define a GET route to fetch all categories
router.get("/", async (req, res) => {
  try {
    // Query the database to select all records from the categories table
    const categories = await db.select().from(categoriesTable);
    // Send the retrieved categories back as a JSON response
    res.json(categories);
  } catch (err) {
    // Log the error using the standard console if fetching fails
    console.error(err);
    // Return a 500 Internal Server Error status with an error message
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Export the router to be used in the main application setup
export default router;
