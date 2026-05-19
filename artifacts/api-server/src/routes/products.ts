import { Router } from "express";
import { db } from "@workspace/db";
import {
  productsTable,
  categoriesTable,
  orderItemsTable,
  wishlistItemsTable,
  type InsertProduct,
} from "@workspace/db/schema";
import { eq, like, or, sql } from "drizzle-orm";

const router = Router();

const BASE_IMAGE_URL = "/api/assets/images";

const SEED_PRODUCTS: Omit<InsertProduct, "createdAt">[] = [
  {
    title: "Nexus Geometric",
    description:
      "Bold interlocking triangles in electric blue and white gradient. Perfect for tech startups, fintech, and SaaS companies seeking a modern, cutting-edge identity.",
    price: "49.00",
    category: "Technology",
    style: "Geometric",
    imageUrl: `${BASE_IMAGE_URL}/logo-1.png`,
    previewUrls: [`${BASE_IMAGE_URL}/logo-1.png`],
    featured: true,
    popularity: 342,
  },
  {
    title: "Aurum Lettermark",
    description:
      "Elegant minimalist letter A design with golden lines on near-black. Exudes luxury and sophistication — ideal for premium brands, consultancies, and high-end services.",
    price: "79.00",
    category: "Lettermark",
    style: "Minimal",
    imageUrl: `${BASE_IMAGE_URL}/logo-2.png`,
    previewUrls: [`${BASE_IMAGE_URL}/logo-2.png`],
    featured: true,
    popularity: 518,
  },
  {
    title: "Hexnode Network",
    description:
      "Interconnected hexagon nodes forming a dynamic network pattern. Neon teal and purple palette. Suits blockchain, data analytics, and network infrastructure brands.",
    price: "59.00",
    category: "Technology",
    style: "Abstract",
    imageUrl: `${BASE_IMAGE_URL}/logo-3.png`,
    previewUrls: [`${BASE_IMAGE_URL}/logo-3.png`],
    featured: true,
    popularity: 276,
  },
  {
    title: "Infiniti Flow",
    description:
      "A circular infinity/flame loop in warm orange and magenta gradient. Conveys motion, energy, and perpetual momentum — great for fitness, media, and lifestyle brands.",
    price: "39.00",
    category: "Abstract",
    style: "Fluid",
    imageUrl: `${BASE_IMAGE_URL}/logo-4.png`,
    previewUrls: [`${BASE_IMAGE_URL}/logo-4.png`],
    featured: false,
    popularity: 189,
  },
  {
    title: "Summit Peak",
    description:
      "Sharp angular lines forming a stylized mountain peak with purple and electric blue gradient. Symbolizes ambition, growth, and reaching the top — perfect for finance and consulting.",
    price: "45.00",
    category: "Abstract",
    style: "Geometric",
    imageUrl: `${BASE_IMAGE_URL}/logo-5.png`,
    previewUrls: [`${BASE_IMAGE_URL}/logo-5.png`],
    featured: false,
    popularity: 224,
  },
  {
    title: "Eternum Rings",
    description:
      "Sophisticated interlocking circles in rose gold and white. Represents unity, luxury, and timeless connection. Ideal for jewelry, wellness, and premium lifestyle brands.",
    price: "69.00",
    category: "Luxury",
    style: "Minimal",
    imageUrl: `${BASE_IMAGE_URL}/logo-6.png`,
    previewUrls: [`${BASE_IMAGE_URL}/logo-6.png`],
    featured: true,
    popularity: 401,
  },
];

const SEED_CATEGORIES = [
  { name: "Technology", slug: "technology", iconName: "cpu", productCount: 2 },
  { name: "Lettermark", slug: "lettermark", iconName: "type", productCount: 1 },
  { name: "Abstract", slug: "abstract", iconName: "hexagon", productCount: 2 },
  { name: "Luxury", slug: "luxury", iconName: "star", productCount: 1 },
  {
    name: "Minimal",
    slug: "minimal",
    iconName: "minus-circle",
    productCount: 2,
  },
  {
    name: "Geometric",
    slug: "geometric",
    iconName: "triangle",
    productCount: 2,
  },
];

async function seedIfEmpty() {
  try {
    const existing = await db.select().from(productsTable);
    console.log("Checking DB: Found", existing.length, "products");

    // Only seed if the database is completely empty to prevent overwriting user modifications
    if (existing.length === 0) {
      console.log("Cleaning and re-seeding database...");
      await db.delete(orderItemsTable); // Delete children first
      await db.delete(wishlistItemsTable);
      await db.delete(productsTable);
      await db.delete(categoriesTable);

      console.log("Seeding categories...");
      await db.insert(categoriesTable).values(SEED_CATEGORIES).onConflictDoNothing();

      console.log("Seeding products...");
      const productsToInsert = SEED_PRODUCTS.map(p => ({
        ...p,
        previewUrls: JSON.stringify(p.previewUrls)
      }));

      await db.insert(productsTable).values(productsToInsert as any);
      console.log("Seeding completed successfully!");
    }

    // Always synchronize auto-increment sequences to prevent "duplicate key value violates unique constraint" errors
    console.log("Synchronizing PostgreSQL sequences...");
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1))`);
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1))`);
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('orders', 'id'), COALESCE((SELECT MAX(id) FROM orders), 1))`);
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('order_items', 'id'), COALESCE((SELECT MAX(id) FROM order_items), 1))`);
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('wishlist_items', 'id'), COALESCE((SELECT MAX(id) FROM wishlist_items), 1))`);
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('custom_logo_requests', 'id'), COALESCE((SELECT MAX(id) FROM custom_logo_requests), 1))`);
    console.log("All PostgreSQL sequences synchronized successfully!");
  } catch (err: any) {
    console.error("SEEDING/SYNC ERROR:", err.message);
  } finally {
    console.log("seedIfEmpty finished");
  }
}

seedIfEmpty().catch(console.error);

router.get("/featured", async (req, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.featured, true))
      .orderBy(sql`${productsTable.popularity} DESC`)
      .limit(6);

    const parseArray = (val: any) => {
      if (typeof val !== 'string') return val;
      if (val.startsWith('{')) {
        return val.slice(1, -1).split(',').map(s => s.replace(/"/g, '').trim());
      }
      try { return JSON.parse(val); } catch { return []; }
    };

    const parsedProducts = products.map(p => ({
      ...p,
      previewUrls: parseArray(p.previewUrls)
    }));

    return res.json(parsedProducts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch featured products" });
  }
});

router.get("/", async (req, res) => {
  try {
    const {
      category,
      style,
      sort = "popular",
      search,
      limit = "20",
      offset = "0",
    } = req.query as Record<string, string>;

    let query = db.select().from(productsTable).$dynamic();

    if (category) {
      query = query.where(eq(productsTable.category, category));
    }
    if (style) {
      query = query.where(eq(productsTable.style, style));
    }
    if (search) {
      query = query.where(
        or(
          like(productsTable.title, `%${search}%`),
          like(productsTable.description, `%${search}%`),
        ),
      );
    }

    switch (sort) {
      case "newest":
        query = query.orderBy(sql`${productsTable.createdAt} DESC`);
        break;
      case "price_asc":
        query = query.orderBy(sql`${productsTable.price} ASC`);
        break;
      case "price_desc":
        query = query.orderBy(sql`${productsTable.price} DESC`);
        break;
      default:
        query = query.orderBy(sql`${productsTable.popularity} DESC`);
    }

    query = query.limit(parseInt(limit)).offset(parseInt(offset));

    const products = await query;
    console.log(`Fetched ${products.length} products`);
    const parsedProducts = products.map(p => {
      try {
        return {
          ...p,
          previewUrls: typeof p.previewUrls === 'string' ? (p.previewUrls.startsWith('{') ? p.previewUrls.slice(1, -1).split(',').map(s => s.replace(/"/g, '').trim()) : JSON.parse(p.previewUrls)) : p.previewUrls
        };
      } catch (parseErr: any) {
        console.error(`Error parsing product ${p.id}:`, parseErr.message);
        return {
          ...p,
          previewUrls: []
        };
      }
    });

    return res.json(parsedProducts);
  } catch (err: any) {
    console.error("GET /api/products ERROR:", err);
    return res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] ?? "0");
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .limit(1);

    if (products.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const p = products[0];
    const parsedProduct = {
      ...p,
      previewUrls: typeof p.previewUrls === 'string' ? (p.previewUrls.startsWith('{') ? p.previewUrls.slice(1, -1).split(',').map(s => s.replace(/"/g, '').trim()) : JSON.parse(p.previewUrls)) : p.previewUrls
    };

    return res.json(parsedProduct);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, price, category, style, imageUrl, featured, popularity } = req.body;
    
    if (!title || !price || !category) {
      return res.status(400).json({ error: "Title, Price, and Category are required." });
    }

    const [inserted] = await db
      .insert(productsTable)
      .values({
        title,
        description: description || "No description provided.",
        price: price.toString(),
        category,
        style: style || "Minimalist",
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80",
        previewUrls: JSON.stringify([imageUrl || "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=400&q=80"]),
        featured: !!featured,
        popularity: popularity ? parseInt(popularity) : 0,
      })
      .returning();

    const parsed = {
      ...inserted,
      previewUrls: typeof inserted.previewUrls === 'string' ? JSON.parse(inserted.previewUrls) : inserted.previewUrls
    };

    return res.status(201).json(parsed);
  } catch (err: any) {
    console.error("POST /api/products ERROR:", err);
    return res.status(500).json({ error: "Failed to create product", details: err.message });
  }
});

export default router;
