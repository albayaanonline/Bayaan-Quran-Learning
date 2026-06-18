import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const liveClassroomSessionsTable = pgTable("live_classroom_sessions", {
  id: serial("id").primaryKey(),
  sessionKey: text("session_key").notNull().unique(),
  title: text("title").notNull(),
  createdBy: text("created_by").notNull(),
  subject: text("subject").notNull().default("General"),
  description: text("description").notNull().default(""),
  date: text("date").notNull(),
  time: text("time").notNull(),
  duration: integer("duration").notNull().default(60),
  maxStudents: integer("max_students").notNull().default(20),
  enrolledCount: integer("enrolled_count").notNull().default(0),
  meetingUrl: text("meeting_url").notNull(),
  platform: text("platform").notNull().default("jitsi"),
  status: text("status").notNull().default("upcoming"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
