import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  displayName: text("display_name").notNull().default(""),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  language: text("language").notNull().default("so"),
  learningGoals: text("learning_goals").notNull().default("[]"),
  level: text("level").notNull().default("beginner"),
  ageGroup: text("age_group").notNull().default("adult"),
  dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(15),
  preferredQari: text("preferred_qari").notNull().default("Alafasy_128kbps"),
  teacherPreference: text("teacher_preference").notNull().default("any"),
  xp: integer("xp").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  lastStudyDate: text("last_study_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
