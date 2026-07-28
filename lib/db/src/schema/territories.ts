import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const territoriesTable = pgTable("territories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTerritorySchema = createInsertSchema(territoriesTable).omit({ id: true, createdAt: true });
export type InsertTerritory = z.infer<typeof insertTerritorySchema>;
export type Territory = typeof territoriesTable.$inferSelect;
