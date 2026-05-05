import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const visitorsTable = pgTable("visitors", {
  id:    serial("id").primaryKey(),
  date:  text("date").notNull().unique(),
  count: integer("count").notNull().default(0),
});
