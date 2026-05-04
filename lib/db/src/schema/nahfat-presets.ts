import { pgTable, serial, text, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nahfatPresetsTable = pgTable("nahfat_presets", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  category: text("category").notNull().default("عربي"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertNahfatPresetSchema = createInsertSchema(nahfatPresetsTable).omit({ id: true });
export type InsertNahfatPreset = z.infer<typeof insertNahfatPresetSchema>;
export type NahfatPreset = typeof nahfatPresetsTable.$inferSelect;
