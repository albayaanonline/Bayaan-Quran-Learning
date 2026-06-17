import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const surahProgressTable = pgTable("surah_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  surahId: integer("surah_id").notNull(),
  surahName: text("surah_name").notNull().default(""),
  completedAyahs: integer("completed_ayahs").notNull().default(0),
  totalAyahs: integer("total_ayahs").notNull().default(7),
  averageScore: integer("average_score"),
  lastStudied: timestamp("last_studied", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSurahProgressSchema = createInsertSchema(surahProgressTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSurahProgress = z.infer<typeof insertSurahProgressSchema>;
export type SurahProgressRow = typeof surahProgressTable.$inferSelect;
