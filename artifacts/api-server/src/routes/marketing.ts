import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const leads: Array<{ email: string; ip?: string; ts: string; source?: string }> = [];

router.post("/marketing/lead", async (req: any, res) => {
  try {
    const { email, source } = req.body;

    if (!email || !email.includes("@")) {
      res.status(400).json({ error: "Valid email required" });
      return;
    }

    if (leads.find(l => l.email === email)) {
      res.json({ success: true, message: "Already subscribed" });
      return;
    }

    const entry = {
      email: email.toLowerCase().trim(),
      ip: req.ip,
      ts: new Date().toISOString(),
      source: source || "website",
    };

    leads.push(entry);
    logger.info({ email: entry.email, source: entry.source }, "New marketing lead captured");

    res.json({ success: true, message: "Subscribed successfully" });
  } catch (err) {
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
  res.json({ total: leads.length, leads });
});

router.get("/marketing/stats", async (req: any, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);

  res.json({
    totalLeads: leads.length,
    todayLeads: leads.filter(l => new Date(l.ts) >= today).length,
    weekLeads: leads.filter(l => new Date(l.ts) >= thisWeek).length,
    sources: leads.reduce((acc: Record<string, number>, l) => {
      const s = l.source || "website";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {}),
  });
});

export default router;
