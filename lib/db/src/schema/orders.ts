import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id),
  teamName: text("team_name").notNull(),
  customerName: text("customer_name").notNull(),
  jerseyNumber: text("jersey_number").notNull(),
  size: text("size").notNull(),
  color: text("color").notNull(),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: real("total_price").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerCity: text("customer_city").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  playerName: text("player_name"),
  frontImageUrl: text("front_image_url"),
  backImageUrl: text("back_image_url"),
  jerseyColorName: text("jersey_color_name"),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
