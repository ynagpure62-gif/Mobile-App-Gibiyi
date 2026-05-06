import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { wishlistItemsTable, productsTable } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";

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
    const items = await db
      .select({ product: productsTable })
      .from(wishlistItemsTable)
      .innerJoin(
        productsTable,
        eq(wishlistItemsTable.productId, productsTable.id),
      )
      .where(eq(wishlistItemsTable.userId, req.userId));

    res.json(items.map((i) => i.product));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

router.post("/", requireAuth, async (req: any, res) => {
  try {
    const { productId } = req.body as { productId: number };

    const existing = await db
      .select()
      .from(wishlistItemsTable)
      .where(
        and(
          eq(wishlistItemsTable.userId, req.userId),
          eq(wishlistItemsTable.productId, productId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(201).json(existing[0]);
    }

    const [item] = await db
      .insert(wishlistItemsTable)
      .values({ userId: req.userId, productId })
      .returning();

    res.status(201).json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
});

router.delete("/:productId", requireAuth, async (req: any, res) => {
  try {
    const productId = parseInt(req.params["productId"] ?? "0");

    await db
      .delete(wishlistItemsTable)
      .where(
        and(
          eq(wishlistItemsTable.userId, req.userId),
          eq(wishlistItemsTable.productId, productId),
        ),
      );

    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to remove from wishlist" });
  }
});

export default router;
