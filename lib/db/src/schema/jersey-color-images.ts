import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { jerseyColorsTable } from "./jersey-colors";

export const jerseyColorImagesTable = pgTable("jersey_color_images", {
  id: serial("id").primaryKey(),
  jerseyColorId: integer("jersey_color_id")
    .notNull()
    .references(() => jerseyColorsTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type JerseyColorImage = typeof jerseyColorImagesTable.$inferSelect;
