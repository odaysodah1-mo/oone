import { pgTable, serial, text, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stickersTable = pgTable("stickers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull().default("عام"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertStickerSchema = createInsertSchema(stickersTable).omit({ id: true });
export type InsertSticker = z.infer<typeof insertStickerSchema>;
export type Sticker = typeof stickersTable.$inferSelect;
