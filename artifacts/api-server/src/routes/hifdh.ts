import { Router } from "express";
import { db, hifdhProgressTable, recordingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { streamToResponse, setSSEHeaders } from "../lib/aiProvider";
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
    const rows = await db.select().from(hifdhProgressTable).where(eq(hifdhProgressTable.userId, req.userId));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list hifdh");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/hifdh", requireAuth, async (req: any, res) => {
  try {
    const { surahId, ayahStart, ayahEnd } = req.body;
    const surah = SURAHS.find(s => s.number === surahId);
    if (!surah) { res.status(404).json({ error: "Surah not found" }); return; }

    const existing = await db.select().from(hifdhProgressTable)
      .where(and(eq(hifdhProgressTable.userId, req.userId), eq(hifdhProgressTable.surahId, surahId)))
      .limit(1);
    if (existing.length > 0) { res.status(409).json({ error: "Already in hifdh" }); return; }

    const nextRev = new Date();
    nextRev.setDate(nextRev.getDate() + 1);

    const [row] = await db.insert(hifdhProgressTable).values({
      userId: req.userId, surahId, surahName: surah.name,
      ayahStart: ayahStart ?? 1, ayahEnd: ayahEnd ?? surah.ayahCount,
      status: "learning", strengthScore: 0, nextRevision: nextRev,
    }).returning();

    res.status(201).json(row);
  } catch (err) {
    logger.error({ err }, "Failed to add hifdh entry");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/hifdh/:id/revise", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { quality } = req.body;

    const rows = await db.select().from(hifdhProgressTable)
      .where(and(eq(hifdhProgressTable.id, id), eq(hifdhProgressTable.userId, req.userId)))
      .limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }

    const entry = rows[0];
    const strengthGain = quality === "excellent" ? 25 : quality === "good" ? 15 : 5;
    const newStrength = Math.min(100, entry.strengthScore + strengthGain);
    const newStatus = getStatus(newStrength);
    const nextRev = getNextRevisionDate(newStrength);

    const [updated] = await db.update(hifdhProgressTable).set({
      strengthScore: newStrength, status: newStatus, lastRevised: new Date(),
      nextRevision: nextRev, revisionCount: entry.revisionCount + 1,
    }).where(eq(hifdhProgressTable.id, id)).returning();

    res.json(updated);
  } catch (err) {
    logger.error({ err }, "Failed to update hifdh revision");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/hifdh/plan", requireAuth, async (req: any, res) => {
  try {
    const now = new Date();
    const allRows = await db.select().from(hifdhProgressTable).where(eq(hifdhProgressTable.userId, req.userId));

    const due = allRows.filter(r => !r.nextRevision || r.nextRevision <= now);
    const upcoming = allRows
      .filter(r => r.nextRevision && r.nextRevision > now)
      .sort((a, b) => (a.nextRevision?.getTime() ?? 0) - (b.nextRevision?.getTime() ?? 0))
      .slice(0, 5);

    const stats = {
      totalSurahs: allRows.length,
      memorized: allRows.filter(r => r.status === "memorized").length,
      reviewing: allRows.filter(r => r.status === "reviewing").length,
      learning: allRows.filter(r => r.status === "learning").length,
      dueToday: due.length,
    };

    res.json({ due, upcoming, stats });
  } catch (err) {
    logger.error({ err }, "Failed to get hifdh plan");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/hifdh/ai-coach", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const [allRows, recentRecs] = await Promise.all([
      db.select().from(hifdhProgressTable).where(eq(hifdhProgressTable.userId, userId)),
      db.select().from(recordingsTable).where(eq(recordingsTable.userId, userId)).limit(10),
    ]);

    const now = new Date();
    const dueToday = allRows.filter(r => !r.nextRevision || r.nextRevision <= now);
    const memorized = allRows.filter(r => r.status === "memorized");
    const reviewing = allRows.filter(r => r.status === "reviewing");
    const learning = allRows.filter(r => r.status === "learning");

    const scoreList = recentRecs
      .map(r => ((r.feedback as any)?.overallScore ?? 0) as number)
      .filter(s => s > 0);
    const avgScore = scoreList.length > 0
      ? Math.round(scoreList.reduce((a, b) => a + b, 0) / scoreList.length)
      : 0;

    const prompt = `Create a personalized Hifdh (Quran memorization) coaching plan for this student:

Current Hifdh Status:
- Total surahs in program: ${allRows.length}
- Memorized (strength ≥80%): ${memorized.map(r => r.surahName).join(", ") || "None yet"}
- Reviewing (40-79%): ${reviewing.map(r => `${r.surahName} (${r.strengthScore}%)`).join(", ") || "None"}
- Learning (<40%): ${learning.map(r => r.surahName).join(", ") || "None"}
- Due for revision today: ${dueToday.map(r => r.surahName).join(", ") || "None — all up to date!"}
- Recent recitation accuracy: ${avgScore > 0 ? `${avgScore}%` : "No recitations yet"}

Please provide:
1. **Today's Revision Plan** — what to review and in what order
2. **This Week's Memorization Target** — realistic new ayahs to add
3. **Strength Analysis** — which surahs need the most attention
4. **Technique Tips** — practical memorization methods for their level
5. **Motivation** — an Islamic reminder about the virtue of Quran memorization

Use markdown formatting. Be encouraging and specific.`;

    const messages = [
      {
        role: "system" as const,
        content: "You are an expert Hifdh coach with deep knowledge of the Quran and memorization science. You give warm, practical, personalized coaching. Always include a relevant hadith or Quranic verse about the virtue of Hifdh."
      },
      { role: "user" as const, content: prompt },
    ];

    const fallback = `# Your Hifdh Coaching Report\n\n**Today's Review**: ${
      dueToday.length > 0 ? dueToday.map(r => r.surahName).join(", ") : "No surahs due today — excellent progress!"
    }\n\n**Status**: ${memorized.length} memorized · ${reviewing.length} reviewing · ${learning.length} learning\n\n**Tip**: The Prophet ﷺ said: *"The best of you are those who learn the Quran and teach it."* (Bukhari)\n\n**General Advice**: Revise each surah daily. New memorization is best done in the morning after Fajr. Focus on 5–10 new lines per day and review at least one full page from recent memory.`;

    setSSEHeaders(res);
    await streamToResponse(res, messages, { maxTokens: 2048, temperature: 0.65, fallback });
  } catch (err) {
    logger.error({ err }, "Hifdh AI coach error");
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/hifdh/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(hifdhProgressTable)
      .where(and(eq(hifdhProgressTable.id, id), eq(hifdhProgressTable.userId, req.userId)));
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Failed to delete hifdh entry");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
