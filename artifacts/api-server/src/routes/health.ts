import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  // DB check
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ err }, "Health check: DB failed");
    checks.database = { ok: false, detail: msg };
  }

  // AI provider availability (Pollinations — always available, no key)
  checks.ai_provider = { ok: true, detail: "Pollinations (free, no key required)" };

  const allOk = Object.values(checks).every(c => c.ok);

  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.npm_package_version ?? "1.0.0",
    env: process.env.NODE_ENV ?? "development",
  });
});

// Detailed diagnostic endpoint (dev + internal use)
router.get("/diagnostics", async (_req, res) => {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    providers: {
      groq: !!process.env.GROQ_API_KEY,
      huggingface_token: !!process.env.HF_TOKEN,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      smtp: !!process.env.SMTP_HOST,
      pollinations: true,
    },
  };

  // DB tables check
  try {
    const result = await db.execute(sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    diagnostics.db_tables = (result.rows as any[]).map((r: any) => r.table_name);
    diagnostics.db_ok = true;
  } catch (err: unknown) {
    diagnostics.db_ok = false;
    diagnostics.db_error = err instanceof Error ? err.message : String(err);
  }

  res.json(diagnostics);
});

export default router;
