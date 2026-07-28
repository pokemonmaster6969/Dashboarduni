import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attachmentsTable = pgTable("attachments", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileData: text("file_data").notNull(), // base64 encoded file string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAttachmentSchema = createInsertSchema(attachmentsTable).omit({ id: true, createdAt: true });
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachmentsTable.$inferSelect;
