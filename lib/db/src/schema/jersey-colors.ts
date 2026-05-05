import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";

export const jerseyColorsTable = pgTable("jersey_colors", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  frontImageUrl: text("front_image_url").notNull(),
  backImageUrl: text("back_image_url"),
  hexCode: text("hex_code").notNull().default("#ffffff"),
  secondaryHexCode: text("secondary_hex_code").notNull().default("#000000"),
  isDefault: boolean("is_default").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  isSoldOut: boolean("is_sold_out").notNull().default(false),
  priceWithCustomization: integer("price_with_customization"),
  priceWithoutCustomization: integer("price_without_customization"),
});

export const insertJerseyColorSchema = createInsertSchema(jerseyColorsTable).omit({ id: true });
export type InsertJerseyColor = z.infer<typeof insertJerseyColorSchema>;
export type JerseyColor = typeof jerseyColorsTable.$inferSelect;
