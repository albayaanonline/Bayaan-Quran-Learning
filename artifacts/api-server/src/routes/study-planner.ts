import { Router } from "express";
import { db, profilesTable, recordingsTable, hifdhProgressTable, surahProgressTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { streamToResponse, setSSEHeaders } from "../lib/aiProvider";

const router = Router();

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

    const messages = [
      {
        role: "system" as const,
        content: "You are an expert Quran study coach at Al Bayaan Islamic Academy. Create detailed, practical, personalized study plans. Use markdown formatting with headers, bullet points, and time allocations. Be encouraging and motivating.",
      },
      { role: "user" as const, content: contextPrompt },
    ];

    setSSEHeaders(res);
    await streamToResponse(res, messages, { maxTokens: 2048, temperature: 0.6 });
  } catch (err) {
    logger.error({ err }, "Study planner error");
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    else { res.write(`data: ${JSON.stringify({ error: "Error", done: true })}\n\n`); res.end(); }
  }
});

export default router;
