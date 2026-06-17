import { Router } from "express";
import { db, hifdhProgressTable, recordingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { SURAHS } from "./surahs";

const router = Router();

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";
const HF_API = "https://api-inference.huggingface.co/v1/chat/completions";

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

    const avgScore = recentRecs.length > 0
      ? Math.round(recentRecs.map(r => ((r.feedback as any)?.overallScore ?? 0) as number).filter(s => s > 0).reduce((a, b) => a + b, 0) / Math.max(recentRecs.length, 1))
      : 0;

    const contextPrompt = `Create a personalized Hifdh (Quran memorization) coaching plan for this student:

Current Hifdh Status:
- Total surahs in program: ${allRows.length}
- Memorized (strength ≥80%): ${memorized.map(r => r.surahName).join(", ") || "None"}
- Currently reviewing (40-79%): ${reviewing.map(r => `${r.surahName} (strength: ${r.strengthScore}%)`).join(", ") || "None"}
- Currently learning (<40%): ${learning.map(r => r.surahName).join(", ") || "None"}
- Due for revision today: ${dueToday.map(r => r.surahName).join(", ") || "None"}
- Recent recitation accuracy: ${avgScore}%

Please provide:
1. **Today's Revision Plan** — what to review in what order (priority: due items first)
2. **This Week's New Memorization Target** — realistic new ayahs based on their level
3. **Strength Analysis** — weak spots and how to improve them
4. **Technique Recommendations** — specific techniques for their current surahs
5. **Motivation & Tips** — Islamic wisdom about Quran memorization`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (!HF_TOKEN) {
      const fallback = `# Your Hifdh Coaching Report\n\n**Today's Review**: ${dueToday.length > 0 ? dueToday.map(r => r.surahName).join(", ") : "No surahs due today — great job!"}\n\n**Status**: ${memorized.length} memorized, ${reviewing.length} reviewing, ${learning.length} learning.\n\n**Tip**: Add your HuggingFace token (HF_TOKEN) for AI-personalized coaching advice!\n\n**General Advice**: Review each surah at least once daily. Use the 20-page method: memorize 5 new lines and review 1 page from recent memory every day.`;
      res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    let hfResponse: Response;
    try {
      hfResponse = await fetch(HF_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${HF_TOKEN}` },
        body: JSON.stringify({
          model: HF_MODEL,
          messages: [
            { role: "system", content: "You are an expert Hifdh coach with 20 years of experience helping students memorize the Quran. Give practical, personalized advice. Use markdown formatting." },
            { role: "user", content: contextPrompt },
          ],
          max_tokens: 2048,
          stream: true,
          temperature: 0.6,
        }),
      });
    } catch (fetchErr) {
      logger.error({ fetchErr }, "HF API error in hifdh coach");
      res.write(`data: ${JSON.stringify({ error: "AI service unavailable", done: true })}\n\n`);
      res.end();
      return;
    }

    if (!hfResponse.ok) {
      logger.warn({ status: hfResponse.status }, "HF API error in hifdh coach");
      res.write(`data: ${JSON.stringify({ error: "AI error", done: true })}\n\n`);
      res.end();
      return;
    }

    const reader = hfResponse.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
          } catch {}
        }
      }
    } finally {
      reader.releaseLock();
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    logger.error({ err }, "Hifdh AI coach error");
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    else { res.write(`data: ${JSON.stringify({ error: "Error", done: true })}\n\n`); res.end(); }
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
