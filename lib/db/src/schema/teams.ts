import { pgTable, serial, text, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const teamsTable = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  league: text("league").notNull(),
  country: text("country").notNull(),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color").notNull(),
  availableColors: text("available_colors").notNull(),
  availableSizes: text("available_sizes").notNull(),
  basePrice: real("base_price").notNull().default(89),
  logoUrl: text("logo_url"),
  orderCount: integer("order_count").notNull().default(0),
  isPopular: boolean("is_popular").notNull().default(false),
});

export const insertTeamSchema = createInsertSchema(teamsTable).omit({ id: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teamsTable.$inferSelect;
