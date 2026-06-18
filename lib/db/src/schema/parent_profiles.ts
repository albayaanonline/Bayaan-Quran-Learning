import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const parentProfilesTable = pgTable("parent_profiles", {
  id: serial("id").primaryKey(),
  parentClerkId: text("parent_clerk_id").notNull().unique(),
  displayName: text("display_name"),
  email: text("email"),
  phone: text("phone"),
  childClerkIds: text("child_clerk_ids").array().notNull().default([]),
  notificationPrefs: jsonb("notification_prefs"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studentAnalyticsTable = pgTable("student_analytics", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(),
  studyMinutes: text("study_minutes").notNull().default("0"),
  recitationsCount: integer("recitations_count").notNull().default(0),
  avgScore: text("avg_score").notNull().default("0"),
  tajweedErrors: jsonb("tajweed_errors"),
  hifdhVerses: integer("hifdh_verses").notNull().default(0),
  aiInteractions: integer("ai_interactions").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
