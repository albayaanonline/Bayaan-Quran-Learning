import { Router } from "express";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const auditLog: Array<{
  id: string;
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}> = [];

const MAX_AUDIT_ENTRIES = 10000;

export function addAuditEntry(entry: {
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}) {
  auditLog.unshift({
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...entry,
    timestamp: new Date().toISOString(),
  });
  if (auditLog.length > MAX_AUDIT_ENTRIES) auditLog.splice(MAX_AUDIT_ENTRIES);
}

router.get("/audit/logs", requireAuth, async (req: any, res) => {
  const { action, resource, limit = "50", offset = "0" } = req.query;

  let filtered = auditLog.filter(e => e.userId === req.userId);
  if (action) filtered = filtered.filter(e => e.action === action);
  if (resource) filtered = filtered.filter(e => e.resource === resource);

  const total = filtered.length;
  const page = filtered.slice(Number(offset), Number(offset) + Number(limit));

  res.json({ total, logs: page });
});

router.get("/audit/logs/admin", requireAuth, async (req: any, res) => {
  const { limit = "100", offset = "0" } = req.query;
  res.json({ total: auditLog.length, logs: auditLog.slice(Number(offset), Number(offset) + Number(limit)) });
});

export default router;
