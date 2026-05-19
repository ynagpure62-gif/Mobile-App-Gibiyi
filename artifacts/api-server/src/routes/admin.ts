import { Router } from "express";
import { db } from "@workspace/db";
import {
  productsTable,
  ordersTable,
  orderItemsTable,
  customLogoRequestsTable,
} from "@workspace/db/schema";
import { sql, eq } from "drizzle-orm";

const router = Router();

// GET all live statistics from Drizzle tables
router.get("/stats", async (req, res) => {
  try {
    const [prodCount] = await db.select({ count: sql<number>`count(*)` }).from(productsTable);
    const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable);
    
    // Sum of overall revenue across all completed orders
    const orders = await db.select({ totalAmount: ordersTable.totalAmount }).from(ordersTable);
    const revenueSum = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);

    // Fetch custom logo orders
    const logoRequests = await db.select().from(customLogoRequestsTable).orderBy(sql`${customLogoRequestsTable.createdAt} DESC`);

    return res.json({
      totalProducts: Number(prodCount?.count || 0),
      totalOrders: Number(orderCount?.count || 0),
      totalRevenue: revenueSum,
      logoRequests: logoRequests || [],
    });
  } catch (err: any) {
    console.error("GET /api/admin/stats error:", err);
    return res.status(500).json({ error: "Failed to fetch admin statistics", details: err.message });
  }
});

// GET all orders from the database
router.get("/orders", async (req, res) => {
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .orderBy(sql`${ordersTable.createdAt} DESC`);

    if (orders.length === 0) return res.json([]);

    const orderIds = orders.map(o => o.id);

    const allItems = await db
      .select({
        id: orderItemsTable.id,
        orderId: orderItemsTable.orderId,
        productId: orderItemsTable.productId,
        price: orderItemsTable.price,
        product: productsTable,
      })
      .from(orderItemsTable)
      .innerJoin(
        productsTable,
        eq(orderItemsTable.productId, productsTable.id),
      )
      .where(sql`${orderItemsTable.orderId} IN ${orderIds}`);

    const ordersWithItems = orders.map(order => ({
      ...order,
      items: allItems.filter(item => item.orderId === order.id)
    }));

    return res.json(ordersWithItems);
  } catch (err: any) {
    console.error("GET /api/admin/orders error:", err);
    return res.status(500).json({ error: "Failed to fetch all orders", details: err.message });
  }
});

// PUT update order status (e.g. approve or reject)
router.put("/orders/:id", async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const [updatedOrder] = await db
      .update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, orderId))
      .returning();

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json(updatedOrder);
  } catch (err: any) {
    console.error("PUT /api/admin/orders/:id error:", err);
    return res.status(500).json({ error: "Failed to update order status", details: err.message });
  }
});

// GET all unique database users from orders table
router.get("/users", async (req, res) => {
  try {
    const users = await db
      .select({
        userId: ordersTable.userId,
        userEmail: ordersTable.userEmail,
        createdAt: sql<string>`min(${ordersTable.createdAt})`,
      })
      .from(ordersTable)
      .groupBy(ordersTable.userId, ordersTable.userEmail);

    return res.json(users);
  } catch (err: any) {
    console.error("GET /api/admin/users error:", err);
    return res.status(500).json({ error: "Failed to fetch unique users", details: err.message });
  }
});

export default router;
