import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scientistsTable = pgTable("scientists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  designation: text("designation"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScientistSchema = createInsertSchema(scientistsTable).omit({ id: true, createdAt: true });
export type InsertScientist = z.infer<typeof insertScientistSchema>;
export type Scientist = typeof scientistsTable.$inferSelect;
