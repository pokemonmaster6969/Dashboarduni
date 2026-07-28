import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { servicesTable } from "./services";
import { scientistsTable } from "./scientists";
import { salesPersonsTable } from "./salesPersons";
import { territoriesTable } from "./territories";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  projectCode: text("project_code").notNull().unique(),
  date: text("date").notNull(),
  month: text("month"),
  labSubmissionDate: text("lab_submission_date"),
  scientistId: integer("scientist_id").references(() => scientistsTable.id),
  clientId: integer("client_id").references(() => clientsTable.id),
  billingClientId: integer("billing_client_id").references(() => clientsTable.id),
  serviceId: integer("service_id").references(() => servicesTable.id),
  sampleType: text("sample_type"),
  withAnalysis: text("with_analysis"),
  noOfSamples: integer("no_of_samples"),
  dataRequirement: text("data_requirement"),
  gbPerSample: real("gb_per_sample"),
  totalGb: real("total_gb"),
  ratePerSample: real("rate_per_sample"),
  totalAmount: real("total_amount"),
  gst: real("gst"),
  totalProjectCost: real("total_project_cost"),
  quotationNo: text("quotation_no"),
  salesPersonId: integer("sales_person_id").references(() => salesPersonsTable.id),
  territoryId: integer("territory_id").references(() => territoriesTable.id),
  city: text("city"),
  status: text("status").notNull().default("Active"),
  remark: text("remark"),
  quotationFileId: integer("quotation_file_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
