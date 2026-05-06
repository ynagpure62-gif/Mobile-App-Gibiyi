import { Router } from "express";
import { db } from "@workspace/db";
import {
  productsTable,
  categoriesTable,
  type InsertProduct,
} from "@workspace/db/schema";
import { eq, ilike, or, sql } from "drizzle-orm";

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
    tags: ["geometric", "tech", "modern", "triangles", "gradient"],
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
    tags: ["lettermark", "luxury", "gold", "minimal", "elegant"],
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
    tags: ["hexagon", "network", "tech", "blockchain", "neon"],
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
    tags: ["infinity", "flow", "energy", "gradient", "motion"],
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
    tags: ["mountain", "peak", "ambition", "angular", "gradient"],
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
    tags: ["rings", "luxury", "rose gold", "elegant", "premium"],
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
  const existing = await db.select().from(productsTable).limit(1);
  if (existing.length > 0) return;

  await db.insert(categoriesTable).values(SEED_CATEGORIES).onConflictDoNothing();
  await db.insert(productsTable).values(SEED_PRODUCTS);
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
    res.json(products);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch featured products" });
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
          ilike(productsTable.title, `%${search}%`),
          ilike(productsTable.description, `%${search}%`),
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
    res.json(products);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
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
    res.json(products[0]);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

export default router;
