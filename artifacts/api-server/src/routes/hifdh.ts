import { Router } from "express";
import { db, hifdhProgressTable } from "@workspace/db";
import { eq, and, lte } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { SURAHS } from "./surahs";

const router = Router();

function getNextRevisionDate(strengthScore: number): Date {
  const now = new Date();
  let daysToAdd = 1;
  if (strengthScore >= 80) daysToAdd = 30;
  else if (strengthScore >= 60) daysToAdd = 14;
  else if (strengthScore >= 40) daysToAdd = 7;
  else if (strengthScore >= 20) daysToAdd = 3;
  now.setDate(now.getDate() + daysToAdd);
  return now;
}

function getStatus(strength: number): string {
  if (strength >= 80) return "memorized";
  if (strength >= 40) return "reviewing";
  return "learning";
}

router.get("/hifdh", requireAuth, async (req: any, res) => {
  try {
    const rows = await db
      .select()
      .from(hifdhProgressTable)
      .where(eq(hifdhProgressTable.userId, req.userId));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list hifdh");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/hifdh", requireAuth, async (req: any, res) => {
  try {
    const { surahId, ayahStart, ayahEnd } = req.body;
    const surah = SURAHS.find((s) => s.number === surahId);
    if (!surah) {
      res.status(404).json({ error: "Surah not found" });
      return;
    }

    const existing = await db
      .select()
      .from(hifdhProgressTable)
      .where(and(eq(hifdhProgressTable.userId, req.userId), eq(hifdhProgressTable.surahId, surahId)))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Already in hifdh" });
      return;
    }

    const nextRev = new Date();
    nextRev.setDate(nextRev.getDate() + 1);

    const [row] = await db
      .insert(hifdhProgressTable)
      .values({
        userId: req.userId,
        surahId,
        surahName: surah.name,
        ayahStart: ayahStart ?? 1,
        ayahEnd: ayahEnd ?? surah.ayahCount,
        status: "learning",
        strengthScore: 0,
        nextRevision: nextRev,
      })
      .returning();

    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "Failed to add hifdh entry");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/hifdh/:id/revise", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { quality } = req.body;

    const rows = await db
      .select()
      .from(hifdhProgressTable)
      .where(and(eq(hifdhProgressTable.id, id), eq(hifdhProgressTable.userId, req.userId)))
      .limit(1);

    if (!rows[0]) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const entry = rows[0];
    const strengthGain = quality === "excellent" ? 25 : quality === "good" ? 15 : 5;
    const newStrength = Math.min(100, entry.strengthScore + strengthGain);
    const newStatus = getStatus(newStrength);
    const nextRev = getNextRevisionDate(newStrength);

    const [updated] = await db
      .update(hifdhProgressTable)
      .set({
        strengthScore: newStrength,
        status: newStatus,
        lastRevised: new Date(),
        nextRevision: nextRev,
        revisionCount: entry.revisionCount + 1,
      })
      .where(eq(hifdhProgressTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    logger.error({ err }, "Failed to update hifdh revision");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/hifdh/plan", requireAuth, async (req: any, res) => {
  try {
    const now = new Date();
    const allRows = await db
      .select()
      .from(hifdhProgressTable)
      .where(eq(hifdhProgressTable.userId, req.userId));

    const due = allRows.filter((r) => !r.nextRevision || r.nextRevision <= now);
    const upcoming = allRows
      .filter((r) => r.nextRevision && r.nextRevision > now)
      .sort((a, b) => (a.nextRevision?.getTime() ?? 0) - (b.nextRevision?.getTime() ?? 0))
      .slice(0, 5);

    const stats = {
      totalSurahs: allRows.length,
      memorized: allRows.filter((r) => r.status === "memorized").length,
      reviewing: allRows.filter((r) => r.status === "reviewing").length,
      learning: allRows.filter((r) => r.status === "learning").length,
      dueToday: due.length,
    };

    res.json({ due, upcoming, stats });
  } catch (err) {
    logger.error({ err }, "Failed to get hifdh plan");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/hifdh/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db
      .delete(hifdhProgressTable)
      .where(and(eq(hifdhProgressTable.id, id), eq(hifdhProgressTable.userId, req.userId)));
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Failed to delete hifdh entry");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
