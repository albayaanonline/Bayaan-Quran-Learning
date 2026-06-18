import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const certificatesTable = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject"),
  issuedBy: text("issued_by").notNull().default("Al Bayaan AI Academy"),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  verificationCode: text("verification_code").notNull().unique(),
  metadata: jsonb("metadata"),
  pdfUrl: text("pdf_url"),
  isRevoked: boolean("is_revoked").notNull().default(false),
  examResultId: integer("exam_result_id"),
});
