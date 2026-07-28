import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const dataDeliveriesTable = pgTable("data_deliveries", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }).unique(),
  rawDataSentDate: text("raw_data_sent_date"),
  finalDataDate: text("final_data_date"),
  rawDataDays: integer("raw_data_days"),
  finalDataDays: integer("final_data_days"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDataDeliverySchema = createInsertSchema(dataDeliveriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDataDelivery = z.infer<typeof insertDataDeliverySchema>;
export type DataDelivery = typeof dataDeliveriesTable.$inferSelect;
