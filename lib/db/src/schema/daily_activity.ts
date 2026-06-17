import { pgTable, text, serial, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyActivityTable = pgTable("daily_activity", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  xp: integer("xp").notNull().default(0),
  minutes: integer("minutes").notNull().default(0),
  recordings: integer("recordings").notNull().default(0),
});

export const insertDailyActivitySchema = createInsertSchema(dailyActivityTable).omit({ id: true });
export type InsertDailyActivity = z.infer<typeof insertDailyActivitySchema>;
export type DailyActivity = typeof dailyActivityTable.$inferSelect;
