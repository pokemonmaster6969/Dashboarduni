import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const qcRecordsTable = pgTable("qc_records", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }).unique(),
  qcPass: integer("qc_pass"),
  qcFail: integer("qc_fail"),
  qcReportDate: text("qc_report_date"),
  qcTatDays: integer("qc_tat_days"),
  qcTatStatus: text("qc_tat_status"),
  runNo: text("run_no"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertQcRecordSchema = createInsertSchema(qcRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQcRecord = z.infer<typeof insertQcRecordSchema>;
export type QcRecord = typeof qcRecordsTable.$inferSelect;
