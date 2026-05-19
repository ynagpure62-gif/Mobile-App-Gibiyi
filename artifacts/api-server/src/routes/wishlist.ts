import { Router } from "express";
import { db } from "@workspace/db";
import { wishlistItemsTable, productsTable } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const items = await db
      .select({ product: productsTable })
      .from(wishlistItemsTable)
      .innerJoin(
        productsTable,
        eq(wishlistItemsTable.productId, productsTable.id),
      )
      .where(eq(wishlistItemsTable.userId, req.userId!));

    return res.json(items.map((i) => i.product));
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { productId } = req.body as { productId: number };

    const existing = await db
      .select()
      .from(wishlistItemsTable)
      .where(
        and(
          eq(wishlistItemsTable.userId, req.userId!),
          eq(wishlistItemsTable.productId, productId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(201).json(existing[0]);
    }

    const [item] = await db
      .insert(wishlistItemsTable)
      .values({ userId: req.userId!, productId })
      .returning();

    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to add to wishlist" });
  }
});

router.delete("/:productId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const productIdParam = req.params["productId"];
    const productId = parseInt(typeof productIdParam === 'string' ? productIdParam : "0");

    await db
      .delete(wishlistItemsTable)
      .where(
        and(
          eq(wishlistItemsTable.userId, req.userId!),
          eq(wishlistItemsTable.productId, productId),
        ),
      );

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to remove from wishlist" });
  }
});

export default router;
