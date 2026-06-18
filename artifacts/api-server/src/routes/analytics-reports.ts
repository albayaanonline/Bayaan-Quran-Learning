import { Router } from "express";
import { db, recordingsTable, surahProgressTable, hifdhProgressTable, conversationsTable } from "@workspace/db";
import { eq, desc, gte, sql, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function weekStart(d: Date): Date {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  s.setHours(0, 0, 0, 0);
  return s;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

router.get("/analytics/daily-report", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayRecs, todayConvs] = await Promise.all([
      db.select().from(recordingsTable).where(and(eq(recordingsTable.userId, userId), gte(recordingsTable.createdAt, today))),
      db.select().from(conversationsTable).where(and(eq(conversationsTable.userId, userId), gte(conversationsTable.createdAt, today))),
    ]);

    const avgScore = todayRecs.length > 0
      ? Math.round(todayRecs.map(r => ((r.feedback as any)?.overallScore ?? 0)).reduce((a, b) => a + b, 0) / todayRecs.length)
      : 0;

    const tajweedRulesHit = new Set<string>();
    todayRecs.forEach(r => {
      const rules = (r.feedback as any)?.tajweedRules ?? [];
      rules.filter((ru: any) => ru.found).forEach((ru: any) => tajweedRulesHit.add(ru.name));
    });

    res.json({
      date: today.toISOString().split("T")[0],
      recordings: todayRecs.length,
      aiConversations: todayConvs.length,
      avgScore,
      tajweedRulesHit: [...tajweedRulesHit],
      studyMinutes: todayRecs.length * 5 + todayConvs.length * 3,
      summary: todayRecs.length === 0
        ? "No recitations today yet. Open Quran Learn to start."
        : `You completed ${todayRecs.length} recitation${todayRecs.length > 1 ? "s" : ""} today${avgScore > 0 ? ` with an average score of ${avgScore}%` : ""}.`,
    });
  } catch (err) {
    logger.error({ err }, "Failed to generate daily report");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/weekly-report", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [recs, convs] = await Promise.all([
      db.select().from(recordingsTable).where(and(eq(recordingsTable.userId, userId), gte(recordingsTable.createdAt, sevenDaysAgo))).orderBy(desc(recordingsTable.createdAt)),
      db.select().from(conversationsTable).where(and(eq(conversationsTable.userId, userId), gte(conversationsTable.createdAt, sevenDaysAgo))),
    ]);

    const dayBuckets: Record<string, { recordings: number; score: number; count: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dayBuckets[key] = { recordings: 0, score: 0, count: 0 };
    }

    const tajweedErrors: Record<string, number> = {};
    recs.forEach(r => {
      if (!r.createdAt) return;
      const key = new Date(r.createdAt).toISOString().split("T")[0];
      if (dayBuckets[key]) {
        dayBuckets[key].recordings++;
        const score = (r.feedback as any)?.overallScore ?? 0;
        if (score > 0) { dayBuckets[key].score += score; dayBuckets[key].count++; }
      }
      const rules = (r.feedback as any)?.tajweedRules ?? [];
      rules.filter((ru: any) => !ru.found).forEach((ru: any) => {
        tajweedErrors[ru.name] = (tajweedErrors[ru.name] ?? 0) + 1;
      });
    });

    const dailyBreakdown = Object.entries(dayBuckets).map(([date, d]) => ({
      date,
      day: new Date(date).toLocaleDateString("en", { weekday: "short" }),
      recordings: d.recordings,
      avgScore: d.count > 0 ? Math.round(d.score / d.count) : 0,
    }));

    const totalScore = recs.map(r => ((r.feedback as any)?.overallScore ?? 0)).filter(s => s > 0);
    const avgScore = totalScore.length > 0 ? Math.round(totalScore.reduce((a, b) => a + b, 0) / totalScore.length) : 0;

    const activeDays = Object.values(dayBuckets).filter(d => d.recordings > 0).length;
    const topMistakes = Object.entries(tajweedErrors).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([rule, count]) => ({ rule, count }));

    res.json({
      weekStart: sevenDaysAgo.toISOString().split("T")[0],
      totalRecordings: recs.length,
      aiConversations: convs.length,
      avgScore,
      activeDays,
      studyMinutes: recs.length * 5 + convs.length * 3,
      dailyBreakdown,
      topMistakes,
      improvement: avgScore > 75 ? "excellent" : avgScore > 60 ? "good" : avgScore > 40 ? "fair" : "needs_work",
      encouragement: activeDays >= 5 ? "Excellent consistency! You studied 5+ days this week." : activeDays >= 3 ? "Good effort! Aim for 5+ days per week." : "Try to study at least 3 days per week for best results.",
    });
  } catch (err) {
    logger.error({ err }, "Failed to generate weekly report");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/monthly-report", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recs, surahProgress, hifdhProgress] = await Promise.all([
      db.select().from(recordingsTable).where(and(eq(recordingsTable.userId, userId), gte(recordingsTable.createdAt, thirtyDaysAgo))).orderBy(desc(recordingsTable.createdAt)),
      db.select().from(surahProgressTable).where(eq(surahProgressTable.userId, userId)),
      db.select().from(hifdhProgressTable).where(eq(hifdhProgressTable.userId, userId)),
    ]);

    const weeklyData: Record<string, { recordings: number; scoreSum: number; count: number }> = {};
    recs.forEach(r => {
      if (!r.createdAt) return;
      const ws = weekStart(new Date(r.createdAt)).toISOString().split("T")[0];
      if (!weeklyData[ws]) weeklyData[ws] = { recordings: 0, scoreSum: 0, count: 0 };
      weeklyData[ws].recordings++;
      const s = (r.feedback as any)?.overallScore ?? 0;
      if (s > 0) { weeklyData[ws].scoreSum += s; weeklyData[ws].count++; }
    });

    const weeklyTrend = Object.entries(weeklyData).sort((a, b) => a[0].localeCompare(b[0])).map(([week, d]) => ({
      week,
      recordings: d.recordings,
      avgScore: d.count > 0 ? Math.round(d.scoreSum / d.count) : 0,
    }));

    const tajweedRulesLearned = new Set<string>();
    recs.forEach(r => {
      const rules = (r.feedback as any)?.tajweedRules ?? [];
      rules.filter((ru: any) => ru.found).forEach((ru: any) => tajweedRulesLearned.add(ru.name));
    });

    const surahsStudied = surahProgress.filter(s => s.completedAyahs > 0).length;
    const mastered = hifdhProgress.filter(h => h.status === "mastered").length;

    const totalScore = recs.map(r => ((r.feedback as any)?.overallScore ?? 0)).filter(s => s > 0);
    const avgScore = totalScore.length > 0 ? Math.round(totalScore.reduce((a, b) => a + b, 0) / totalScore.length) : 0;

    const daysActive = new Set(recs.filter(r => r.createdAt).map(r => new Date(r.createdAt!).toISOString().split("T")[0])).size;

    res.json({
      month: monthKey(new Date()),
      totalRecordings: recs.length,
      daysActive,
      avgScore,
      surahsStudied,
      hifdhMastered: mastered,
      tajweedRulesLearned: [...tajweedRulesLearned],
      weeklyTrend,
      studyMinutes: recs.length * 5,
      certificate: recs.length >= 30 && avgScore >= 70 ? "eligible" : "not_eligible",
      certificateMsg: recs.length >= 30 && avgScore >= 70 ? "You're eligible for a monthly excellence certificate!" : `Complete ${Math.max(0, 30 - recs.length)} more recitations with avg score 70%+ to earn your monthly certificate.`,
    });
  } catch (err) {
    logger.error({ err }, "Failed to generate monthly report");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
