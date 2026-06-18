import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const marketingLeadsTable = pgTable("marketing_leads", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("website"),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
