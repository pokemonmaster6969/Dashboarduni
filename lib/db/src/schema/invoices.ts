import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  invoiceNo: text("invoice_no"),
  invoiceDate: text("invoice_date"),
  qcPassSamples: integer("qc_pass_samples"),
  subtotal: real("subtotal"),
  gst: real("gst"),
  totalAmount: real("total_amount"),
  invoiceTatDays: integer("invoice_tat_days"),
  paymentStatus: text("payment_status").notNull().default("Pending"),
  invoiceFileId: integer("invoice_file_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
