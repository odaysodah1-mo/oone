import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";

export const jerseyColorsTable = pgTable("jersey_colors", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  hexCode: text("hex_code").notNull().default("#ffffff"),
  isDefault: boolean("is_default").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertJerseyColorSchema = createInsertSchema(jerseyColorsTable).omit({ id: true });
export type InsertJerseyColor = z.infer<typeof insertJerseyColorSchema>;
export type JerseyColor = typeof jerseyColorsTable.$inferSelect;
