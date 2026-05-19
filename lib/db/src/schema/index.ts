import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: text("price").notNull(),
  category: text("category").notNull(),
  style: text("style").notNull(),
  imageUrl: text("image_url").notNull(),
  previewUrls: text("preview_urls").notNull().default("[]"),
  featured: boolean("featured").notNull().default(false),
  popularity: integer("popularity").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index("products_category_idx").on(table.category),
  styleIdx: index("products_style_idx").on(table.style),
  featuredIdx: index("products_featured_idx").on(table.featured),
  popularityIdx: index("products_popularity_idx").on(table.popularity),
}));

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  iconName: text("icon_name").notNull(),
  productCount: integer("product_count").notNull().default(0),
});

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  userEmail: text("user_email"),
  status: text("status").notNull().default("completed"),
  totalAmount: text("total_amount").notNull(),
  utr: text("utr").unique(),
  screenshotUrl: text("screenshot_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("orders_user_id_idx").on(table.userId),
}));

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
  price: text("price").notNull(),
}, (table) => ({
  orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
}));

export const wishlistItemsTable = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
}, (table) => ({
  userIdIdx: index("wishlist_user_id_idx").on(table.userId),
}));

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  previewUrls: z.array(z.string()).optional(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
});
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({
  id: true,
});
export const insertWishlistItemSchema = createInsertSchema(
  wishlistItemsTable,
).omit({ id: true });

export type Product = typeof productsTable.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type WishlistItem = typeof wishlistItemsTable.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;

export const customLogoRequestsTable = pgTable("custom_logo_requests", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  slogan: text("slogan"),
  description: text("description").notNull(),
  industry: text("industry").notNull(),
  targetAudience: text("target_audience").notNull(),
  top3Things: text("top_3_things").notNull(),
  ideas: text("ideas"),
  colors: text("colors").notNull(),
  styles: text("styles").notNull(),
  sliders: text("sliders").notNull(),
  paymentId: text("payment_id").notNull(),
  uploadLinks: text("upload_links").default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomLogoRequestSchema = createInsertSchema(customLogoRequestsTable).omit({ id: true, createdAt: true });
export type CustomLogoRequest = typeof customLogoRequestsTable.$inferSelect;
export type InsertCustomLogoRequest = z.infer<typeof insertCustomLogoRequestSchema>;
