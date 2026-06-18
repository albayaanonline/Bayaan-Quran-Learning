import { Router } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

export async function addAuditEntry(entry: {
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      details: entry.details ?? null,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to persist audit log entry");
  }
}

router.get("/audit/logs", requireAuth, async (req: any, res) => {
  const { action, resource, limit = "50", offset = "0" } = req.query;

  try {
    let rows = await db.select().from(auditLogsTable)
      .where(eq(auditLogsTable.userId, req.userId))
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(200);

    if (action) rows = rows.filter(e => e.action === action);
    if (resource) rows = rows.filter(e => e.resource === resource);

    const total = rows.length;
    const page = rows.slice(Number(offset), Number(offset) + Number(limit));

    res.json({ total, logs: page });
  } catch (err) {
    logger.error({ err }, "Failed to fetch audit logs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/audit/logs/admin", requireAuth, async (req: any, res) => {
  const { limit = "100", offset = "0" } = req.query;

  try {
    const logs = await db.select().from(auditLogsTable)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const all = await db.select({ id: auditLogsTable.id }).from(auditLogsTable);
    res.json({ total: all.length, logs });
  } catch (err) {
    logger.error({ err }, "Failed to fetch admin audit logs");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
