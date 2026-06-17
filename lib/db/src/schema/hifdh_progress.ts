import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hifdhProgressTable = pgTable("hifdh_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  surahId: integer("surah_id").notNull(),
  surahName: text("surah_name").notNull().default(""),
  ayahStart: integer("ayah_start").notNull().default(1),
  ayahEnd: integer("ayah_end").notNull().default(1),
  status: text("status").notNull().default("learning"),
  strengthScore: integer("strength_score").notNull().default(0),
  lastRevised: timestamp("last_revised", { withTimezone: true }),
  nextRevision: timestamp("next_revision", { withTimezone: true }),
  revisionCount: integer("revision_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHifdhProgressSchema = createInsertSchema(hifdhProgressTable).omit({ id: true, createdAt: true });
export type InsertHifdhProgress = z.infer<typeof insertHifdhProgressSchema>;
export type HifdhProgress = typeof hifdhProgressTable.$inferSelect;
