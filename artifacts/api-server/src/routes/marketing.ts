import { Router } from "express";
import { db, marketingLeadsTable } from "@workspace/db";
import { eq, desc, gte, count } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

router.post("/marketing/lead", async (req: any, res) => {
  try {
    const { email, source } = req.body;

    if (!email || !email.includes("@")) {
      res.status(400).json({ error: "Valid email required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db.select().from(marketingLeadsTable)
      .where(eq(marketingLeadsTable.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      res.json({ success: true, message: "Already subscribed" });
      return;
    }

    await db.insert(marketingLeadsTable).values({
      email: normalizedEmail,
      source: source || "website",
      ip: req.ip ?? null,
    });

    logger.info({ email: normalizedEmail, source: source || "website" }, "New marketing lead captured");
    res.json({ success: true, message: "Subscribed successfully" });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.json({ success: true, message: "Already subscribed" });
      return;
    }
    logger.error({ err }, "Failed to capture lead");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/marketing/leads", async (req: any, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const leads = await db.select().from(marketingLeadsTable)
      .orderBy(desc(marketingLeadsTable.createdAt))
      .limit(500);
    res.json({ total: leads.length, leads });
  } catch (err) {
    logger.error({ err }, "Failed to fetch leads");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/marketing/stats", async (_req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const [all, todayLeads, weekLeads] = await Promise.all([
      db.select().from(marketingLeadsTable),
      db.select().from(marketingLeadsTable).where(gte(marketingLeadsTable.createdAt, today)),
      db.select().from(marketingLeadsTable).where(gte(marketingLeadsTable.createdAt, thisWeek)),
    ]);

    const sources = all.reduce((acc: Record<string, number>, l) => {
      acc[l.source] = (acc[l.source] ?? 0) + 1;
      return acc;
    }, {});

    res.json({
      totalLeads: all.length,
      todayLeads: todayLeads.length,
      weekLeads: weekLeads.length,
      sources,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get marketing stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
