import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const examsTable = pgTable("exams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("written"),
  subject: text("subject").notNull().default("quran"),
  surahId: integer("surah_id"),
  fromAyah: integer("from_ayah"),
  toAyah: integer("to_ayah"),
  totalMarks: integer("total_marks").notNull().default(100),
  passingMarks: integer("passing_marks").notNull().default(60),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  questions: jsonb("questions"),
  isPublished: boolean("is_published").notNull().default(false),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const examResultsTable = pgTable("exam_results", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => examsTable.id),
  userId: text("user_id").notNull(),
  answers: jsonb("answers"),
  score: integer("score"),
  totalMarks: integer("total_marks"),
  passed: boolean("passed"),
  feedback: jsonb("feedback"),
  aiEvaluation: text("ai_evaluation"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  gradedAt: timestamp("graded_at", { withTimezone: true }),
  gradedBy: text("graded_by"),
});
