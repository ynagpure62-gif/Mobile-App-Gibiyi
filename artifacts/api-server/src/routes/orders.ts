import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  ordersTable,
  orderItemsTable,
  productsTable,
} from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
}

router.get("/", requireAuth, async (req: any, res) => {
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, req.userId))
      .orderBy(sql`${ordersTable.createdAt} DESC`);

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
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
          .where(eq(orderItemsTable.orderId, order.id));

        return { ...order, items };
      }),
    );

    res.json(ordersWithItems);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.post("/", requireAuth, async (req: any, res) => {
  try {
    const { items } = req.body as {
      items: Array<{ productId: number; price: number }>;
    };

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Items are required" });
    }

    const totalAmount = items
      .reduce((sum: number, item: { price: number }) => sum + item.price, 0)
      .toFixed(2);

    const [order] = await db
      .insert(ordersTable)
      .values({
        userId: req.userId,
        status: "completed",
        totalAmount,
      })
      .returning();

    await db.insert(orderItemsTable).values(
      items.map((item: { productId: number; price: number }) => ({
        orderId: order.id,
        productId: item.productId,
        price: item.price.toString(),
      })),
    );

    const orderItems = await db
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
      .where(eq(orderItemsTable.orderId, order.id));

    res.status(201).json({ ...order, items: orderItems });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.get("/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params["id"] ?? "0");
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .limit(1);

    if (orders.length === 0 || orders[0].userId !== req.userId) {
      return res.status(404).json({ error: "Order not found" });
    }

    const items = await db
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
      .where(eq(orderItemsTable.orderId, orders[0].id));

    res.json({ ...orders[0], items });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

export default router;
