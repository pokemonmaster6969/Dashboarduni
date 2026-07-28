import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { territoriesTable } from "./territories";

export const salesPersonsTable = pgTable("sales_persons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  territoryId: integer("territory_id").references(() => territoriesTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSalesPersonSchema = createInsertSchema(salesPersonsTable).omit({ id: true, createdAt: true });
export type InsertSalesPerson = z.infer<typeof insertSalesPersonSchema>;
export type SalesPerson = typeof salesPersonsTable.$inferSelect;
