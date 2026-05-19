import { pgTable, serial, text, boolean, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shopsTable = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  logo: text("logo"),
  contactPhone: text("contact_phone"),
  commissionPercent: real("commission_percent").notNull().default(15),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const marketplaceDesignsTable = pgTable("marketplace_designs", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull().references(() => shopsTable.id),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  price: real("price").notNull(),
  category: text("category").notNull().default("عام"),
  tags: text("tags"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const marketplaceOrdersTable = pgTable("marketplace_orders", {
  id: serial("id").primaryKey(),
  designId: integer("design_id").notNull().references(() => marketplaceDesignsTable.id),
  shopId: integer("shop_id").notNull().references(() => shopsTable.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerCity: text("customer_city").notNull(),
  governorate: text("governorate").notNull().default("عمان"),
  address: text("address"),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: real("total_price").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShopSchema = createInsertSchema(shopsTable).omit({ id: true, createdAt: true });
export const insertMarketplaceDesignSchema = createInsertSchema(marketplaceDesignsTable).omit({ id: true, createdAt: true });
export const insertMarketplaceOrderSchema = createInsertSchema(marketplaceOrdersTable).omit({ id: true, createdAt: true });

export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shopsTable.$inferSelect;
export type InsertMarketplaceDesign = z.infer<typeof insertMarketplaceDesignSchema>;
export type MarketplaceDesign = typeof marketplaceDesignsTable.$inferSelect;
export type InsertMarketplaceOrder = z.infer<typeof insertMarketplaceOrderSchema>;
export type MarketplaceOrder = typeof marketplaceOrdersTable.$inferSelect;
