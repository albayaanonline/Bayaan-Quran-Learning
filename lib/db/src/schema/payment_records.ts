import { pgTable, serial, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";

export const paymentRecordsTable = pgTable("payment_records", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  planId: text("plan_id").notNull(),
  planName: text("plan_name").notNull(),
  billing: text("billing").notNull().default("monthly"),
  method: text("method").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  reference: text("reference").notNull(),
  status: text("status").notNull().default("pending"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
