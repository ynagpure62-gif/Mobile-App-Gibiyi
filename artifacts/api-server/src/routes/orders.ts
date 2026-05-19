// Import the Router module from the express framework to handle route paths
import { Router } from "express";
// Import the database connection instance
import { db } from "@workspace/db";
// Import specific tables from the database schema
import {
  ordersTable,
  orderItemsTable,
  productsTable,
} from "@workspace/db/schema";
// Import specific operators and functions from drizzle-orm for database queries
import { eq, sql } from "drizzle-orm";
// Import authentication middleware and the custom AuthRequest type
import { requireAuth, type AuthRequest } from "../middlewares/authMiddleware";

// Create a new router object to define order-related routes
const router = Router();

// Define a GET route to retrieve orders for the currently authenticated user
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    // Fetch all orders from the ordersTable that belong to the logged-in user
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, req.userId!)) // Filter by userId
      .orderBy(sql`${ordersTable.createdAt} DESC`); // Order by newest first

    // If the user has no orders, return an empty array
    if (orders.length === 0) return res.json([]);

    // Extract just the order IDs into an array
    const orderIds = orders.map(o => o.id);

    // Single query to fetch all items for all retrieved orders to avoid N+1 query performance issue
    const allItems = await db
      .select({
        id: orderItemsTable.id,
        orderId: orderItemsTable.orderId,
        productId: orderItemsTable.productId,
        price: orderItemsTable.price,
        product: productsTable, // Include the associated product details
      })
      .from(orderItemsTable)
      // Join the products table to get product info for each order item
      .innerJoin(
        productsTable,
        eq(orderItemsTable.productId, productsTable.id),
      )
      // Only get items that belong to the user's orders
      .where(sql`${orderItemsTable.orderId} IN ${orderIds}`);

    // Map through each order and attach its corresponding items
    const ordersWithItems = orders.map(order => ({
      ...order,
      // Filter the allItems array to find items matching the current order's ID
      items: allItems.filter(item => item.orderId === order.id)
    }));

    // Send the combined orders and items data back to the client as JSON
    return res.json(ordersWithItems);
  } catch (err: any) {
    // Log the error to the server console if something goes wrong
    console.error(err);
    // Send a 500 Internal Server Error response to the client
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Define a POST route to create a new order
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    // Log debugging information to the console when an order creation is attempted
    console.log("----------------- CREATE ORDER DEBUG -----------------");
    console.log("Body received:", JSON.stringify(req.body, null, 2));
    console.log("User ID:", req.userId);
    console.log("------------------------------------------------------");

    // Destructure required fields from the request body
    const { items, utr, screenshotUrl } = req.body as {
      items: Array<{ productId: number; price: number }>;
      utr?: string;
      screenshotUrl?: string;
    };

    // Check if the items array exists and is not empty
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Items are required" }); // Return Bad Request error
    }

    // Check if the UTR (Transaction ID) string exists and is not empty
    if (!utr || !utr.trim()) {
      return res.status(400).json({ error: "UTR / Transaction ID is required" }); // Return Bad Request error
    }

    // Clean up the UTR by removing any leading or trailing whitespace
    const cleanUtr = utr.trim();
    // Define a regular expression to validate the UTR format (12 to 22 alphanumeric characters)
    const utrRegex = /^[A-Za-z0-9]{12,22}$/;
    // Test the cleaned UTR against the regex
    if (!utrRegex.test(cleanUtr)) {
      return res.status(400).json({ error: "Invalid UTR / Transaction ID format. Must be 12-22 alphanumeric characters." });
    }

    // Check for duplicate UTRs in the database to prevent double submission
    const existingUtr = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.utr, cleanUtr))
      .limit(1);

    // If the UTR already exists in another order, return an error
    if (existingUtr.length > 0) {
      return res.status(400).json({ error: "This UTR / Transaction ID has already been used for another order. Duplicate payment proof is invalid." });
    }

    // Calculate the total amount for the order by summing up the price of all items
    const totalAmount = items
      .reduce((sum: number, item: { price: number }) => sum + item.price, 0)
      .toFixed(2); // Format the total to 2 decimal places

    // Insert the new order into the ordersTable
    const [order] = await db
      .insert(ordersTable)
      .values({
        userId: req.userId!, // Associate the order with the user
        userEmail: req.userEmail, // Save user email for reference
        status: "pending", // Initial status is pending payment verification
        totalAmount, // Calculated total amount
        utr: cleanUtr, // Validated Transaction ID
        screenshotUrl: screenshotUrl || null, // Payment screenshot URL, if provided
      })
      .returning(); // Return the inserted order record

    // Insert the individual items of the order into the orderItemsTable
    await db.insert(orderItemsTable).values(
      // Map through the items array and format them for insertion
      items.map((item: { productId: number; price: number }) => ({
        orderId: order.id, // Link to the newly created order
        productId: item.productId,
        price: item.price.toString(), // Store price as a string
      })),
    );

    // Fetch the newly inserted order items to return in the response
    const orderItems = await db
      .select({
        id: orderItemsTable.id,
        orderId: orderItemsTable.orderId,
        productId: orderItemsTable.productId,
        price: orderItemsTable.price,
        product: productsTable, // Join the product details again
      })
      .from(orderItemsTable)
      .innerJoin(
        productsTable,
        eq(orderItemsTable.productId, productsTable.id),
      )
      .where(eq(orderItemsTable.orderId, order.id)); // Filter by the new order's ID

    // Return a 201 Created status and the order data including its items
    return res.status(201).json({ ...order, items: orderItems });
  } catch (err: any) {
    // If anything fails during order creation, return a 500 Internal Server Error
    return res.status(500).json({ error: "Failed to create order" });
  }
});

// Export the router so it can be used in the main application file
export default router;
