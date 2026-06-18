import { pgTable, text, serial, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const libraryProgressTable = pgTable(
  "library_progress",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    bookId: text("book_id").notNull(),
    completedLessons: integer("completed_lessons").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [unique("library_progress_user_book").on(t.userId, t.bookId)],
);

export const insertLibraryProgressSchema = createInsertSchema(libraryProgressTable).omit({
  id: true,
  startedAt: true,
  updatedAt: true,
});
export type InsertLibraryProgress = z.infer<typeof insertLibraryProgressSchema>;
export type LibraryProgress = typeof libraryProgressTable.$inferSelect;
