import { pgTable, serial, text, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const branchesTable = pgTable("branches", {
  id:             serial("id").primaryKey(),
  username:       text("username").notNull().unique(),
  passwordHash:   text("password_hash").notNull(),
  governorate:    text("governorate").notNull(),
  commissionRate: real("commission_rate").notNull().default(0.1),
  active:         boolean("active").notNull().default(true),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

export const insertBranchSchema = createInsertSchema(branchesTable).omit({ id: true, createdAt: true });
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branchesTable.$inferSelect;
