import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  style: text("style").notNull(),
  tags: text("tags").array().notNull().default([]),
  imageUrl: text("image_url").notNull(),
  previewUrls: text("preview_urls").array().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  popularity: integer("popularity").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  status: text("status").notNull().default("completed"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
});

export const wishlistItemsTable = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
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
