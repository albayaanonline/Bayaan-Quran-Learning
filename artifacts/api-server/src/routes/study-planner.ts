import { Router } from "express";
import { db, profilesTable, recordingsTable, hifdhProgressTable, surahProgressTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";
const HF_API = "https://api-inference.huggingface.co/v1/chat/completions";

router.post("/study-planner/generate", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;

    const [profileRows, recentRecs, hifdhRows, progressRows] = await Promise.all([
      db.select().from(profilesTable).where(eq(profilesTable.clerkId, userId)).limit(1),
      db.select().from(recordingsTable).where(eq(recordingsTable.userId, userId)).orderBy(desc(recordingsTable.createdAt)).limit(10),
      db.select().from(hifdhProgressTable).where(eq(hifdhProgressTable.userId, userId)),
      db.select().from(surahProgressTable).where(eq(surahProgressTable.userId, userId)),
    ]);

    const profile = profileRows[0];
    const dailyGoal = profile?.dailyGoalMinutes ?? 20;
    const level = profile?.level ?? "beginner";

    let goals: string[] = [];
    try { goals = typeof profile?.learningGoals === "string" ? JSON.parse(profile.learningGoals) : (profile?.learningGoals ?? []); } catch {}

    const avgScore = recentRecs.length > 0
      ? Math.round(recentRecs.map(r => ((r.feedback as any)?.overallScore ?? 0) as number).filter(s => s > 0).reduce((a, b) => a + b, 0) / Math.max(recentRecs.length, 1))
      : 0;

    const dueHifdh = hifdhRows.filter(r => !r.nextRevision || r.nextRevision <= new Date());
    const surahsStarted = progressRows.filter(s => s.completedAyahs > 0).length;

    const contextPrompt = `Create a personalized 7-day Quran study plan for this student:

Student Profile:
- Level: ${level}
- Daily time available: ${dailyGoal} minutes
- Learning goals: ${goals.join(", ") || "general Quran learning"}
- Recent average score: ${avgScore}% (from ${recentRecs.length} recordings)
- Surahs started: ${surahsStarted}
- Hifdh surahs being memorized: ${hifdhRows.length} (${dueHifdh.length} due for review today)

Create a detailed 7-day study plan with:
1. Daily time allocation (total: ${dailyGoal} minutes/day)
2. Specific activities for each day (recitation practice, Tajweed rules, Hifdh review, Tafsir reading)
3. Beginner-friendly Tajweed focus areas based on their level
4. Hifdh revision schedule
5. Weekly goals and milestones
6. Motivational advice

Format each day clearly with time allocations and specific tasks.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (!HF_TOKEN) {
      const fallback = `# 7-Day Quran Study Plan\n\n**Note**: Add your HuggingFace token (HF_TOKEN) for an AI-personalized plan. Here is a default plan:\n\n**Daily Schedule (${dailyGoal} minutes)**\n- Recitation practice: ${Math.round(dailyGoal * 0.4)} min\n- Tajweed study: ${Math.round(dailyGoal * 0.3)} min\n- Hifdh review: ${Math.round(dailyGoal * 0.2)} min\n- Tafsir reading: ${Math.round(dailyGoal * 0.1)} min`;
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
            { role: "system", content: "You are an expert Quran study coach. Create detailed, practical study plans. Use markdown formatting with headers, bullet points, and time allocations." },
            { role: "user", content: contextPrompt },
          ],
          max_tokens: 2048,
          stream: true,
          temperature: 0.6,
        }),
      });
    } catch (fetchErr) {
      logger.error({ fetchErr }, "HF API error in study planner");
      res.write(`data: ${JSON.stringify({ error: "AI service unavailable", done: true })}\n\n`);
      res.end();
      return;
    }

    if (!hfResponse.ok) {
      logger.warn({ status: hfResponse.status }, "HF API error in study planner");
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
    logger.error({ err }, "Study planner error");
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    else { res.write(`data: ${JSON.stringify({ error: "Error", done: true })}\n\n`); res.end(); }
  }
});

export default router;
