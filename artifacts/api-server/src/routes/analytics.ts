import { Router } from "express";
import { db, recordingsTable, profilesTable, surahProgressTable, hifdhProgressTable, conversationsTable, messagesTable } from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/analytics/overview", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recordings, profile, surahProgress, hifdhProgress, conversations] = await Promise.all([
      db.select().from(recordingsTable)
        .where(eq(recordingsTable.userId, userId))
        .orderBy(desc(recordingsTable.createdAt)),
      db.select().from(profilesTable).where(eq(profilesTable.clerkId, userId)).limit(1),
      db.select().from(surahProgressTable).where(eq(surahProgressTable.userId, userId)),
      db.select().from(hifdhProgressTable).where(eq(hifdhProgressTable.userId, userId)),
      db.select().from(conversationsTable).where(eq(conversationsTable.userId, userId)),
    ]);

    const profileData = profile[0];

    const recentRecordings = recordings.filter(r => r.createdAt && r.createdAt >= thirtyDaysAgo);

    const avgScore = recentRecordings.length > 0
      ? Math.round(recentRecordings.map(r => ((r.feedback as any)?.overallScore ?? 0)).filter(s => s > 0).reduce((a, b) => a + b, 0) / Math.max(recentRecordings.filter(r => ((r.feedback as any)?.overallScore ?? 0) > 0).length, 1))
      : 0;

    const tajweedErrors: Record<string, number> = {};
    const weeklyScores: { week: string; score: number; count: number }[] = [];

    for (const rec of recordings.slice(0, 50)) {
      const fb = rec.feedback as any;
      if (!fb) continue;
      for (const rule of (fb.tajweedRules ?? [])) {
        if (!rule.found) tajweedErrors[rule.name] = (tajweedErrors[rule.name] ?? 0) + 1;
      }

      if (rec.createdAt) {
        const weekStart = new Date(rec.createdAt);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split("T")[0];
        const existing = weeklyScores.find(w => w.week === weekKey);
        if (existing) { existing.score += fb.overallScore ?? 0; existing.count++; }
        else weeklyScores.push({ week: weekKey, score: fb.overallScore ?? 0, count: 1 });
      }
    }

    const weakAreas = Object.entries(tajweedErrors)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([rule, count]) => ({ rule, count, percentage: recordings.length > 0 ? Math.round((count / recordings.length) * 100) : 0 }));

    const scoresByWeek = weeklyScores
      .sort((a, b) => a.week.localeCompare(b.week)).slice(-8)
      .map(w => ({ week: w.week, avgScore: w.count > 0 ? Math.round(w.score / w.count) : 0 }));

    const surahs = surahProgress.filter(s => s.completedAyahs > 0);
    const completionRates = surahs.map(s => ({
      surahId: s.surahId,
      surahName: s.surahName,
      completion: Math.min(100, Math.round((s.completedAyahs / (s.totalAyahs || 1)) * 100)),
      avgScore: s.averageScore ?? 0,
    }));

    const hifdhStats = {
      total: hifdhProgress.length,
      mastered: hifdhProgress.filter(h => (h.strengthScore ?? 0) >= 80).length,
      reviewing: hifdhProgress.filter(h => h.nextRevision && h.nextRevision <= new Date()).length,
    };

    res.json({
      overview: {
        totalRecordings: recordings.length,
        recentRecordings: recentRecordings.length,
        avgScore,
        streakDays: profileData?.streakDays ?? 0,
        totalXp: profileData?.xp ?? 0,
        level: Math.floor((profileData?.xp ?? 0) / 500) + 1,
        surahsStudied: surahs.length,
        hifdhSurahs: hifdhProgress.length,
        aiConversations: conversations.length,
      },
      weakAreas,
      scoresByWeek,
      surahCompletion: completionRates.slice(0, 10),
      hifdh: hifdhStats,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get analytics");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/tajweed", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const recordings = await db.select().from(recordingsTable)
      .where(eq(recordingsTable.userId, userId))
      .orderBy(desc(recordingsTable.createdAt))
      .limit(50);

    const ruleData: Record<string, { found: number; missed: number; total: number }> = {};

    for (const rec of recordings) {
      const fb = rec.feedback as any;
      if (!fb?.tajweedRules) continue;
      for (const rule of fb.tajweedRules) {
        if (!ruleData[rule.name]) ruleData[rule.name] = { found: 0, missed: 0, total: 0 };
        ruleData[rule.name].total++;
        if (rule.found) ruleData[rule.name].found++;
        else ruleData[rule.name].missed++;
      }
    }

    const rules = Object.entries(ruleData).map(([name, data]) => ({
      name,
      accuracy: data.total > 0 ? Math.round((data.found / data.total) * 100) : 0,
      ...data,
    })).sort((a, b) => a.accuracy - b.accuracy);

    res.json({ rules, totalRecordings: recordings.length });
  } catch (err) {
    logger.error({ err }, "Failed to get Tajweed analytics");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
