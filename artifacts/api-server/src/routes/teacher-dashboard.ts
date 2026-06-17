import { Router } from "express";
import { db, profilesTable, recordingsTable, surahProgressTable, hifdhProgressTable, conversationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { SURAHS } from "./surahs";

const router = Router();

router.get("/teacher-dashboard/students", requireAuth, async (req: any, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"))));
    const offset = (page - 1) * limit;

    const [profiles, allRecordings, allProgress, allHifdh] = await Promise.all([
      db.select().from(profilesTable).orderBy(desc(profilesTable.xp)).limit(limit).offset(offset),
      db.select().from(recordingsTable),
      db.select().from(surahProgressTable),
      db.select().from(hifdhProgressTable),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const students = profiles.map(p => {
      const userRecs = allRecordings.filter(r => r.userId === p.clerkId);
      const userProgress = allProgress.filter(pr => pr.userId === p.clerkId);
      const userHifdh = allHifdh.filter(h => h.userId === p.clerkId);

      const scores = userRecs.map(r => ((r.feedback as any)?.overallScore ?? 0) as number).filter(s => s > 0);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      const thisWeekRecs = userRecs.filter(r => new Date(r.createdAt) >= oneWeekAgo);
      const todayRecs = userRecs.filter(r => new Date(r.createdAt).toISOString().split("T")[0] === today);

      const surahsCompleted = userProgress.filter(sp => {
        const surah = SURAHS.find(s => s.number === sp.surahId);
        return surah && sp.completedAyahs >= surah.ayahCount;
      }).length;

      const tajweedScores = userRecs.map(r => ((r.feedback as any)?.tajweedScore ?? 0) as number).filter(s => s > 0);
      const avgTajweed = tajweedScores.length > 0 ? Math.round(tajweedScores.reduce((a, b) => a + b, 0) / tajweedScores.length) : 0;

      return {
        id: p.id,
        clerkId: p.clerkId,
        displayName: p.displayName || "Student",
        avatarUrl: p.avatarUrl ?? null,
        level: p.level ?? "beginner",
        xp: p.xp,
        streakDays: p.streakDays,
        lastStudyDate: p.lastStudyDate ?? null,
        isActiveToday: todayRecs.length > 0,
        weeklyRecordings: thisWeekRecs.length,
        totalRecordings: userRecs.length,
        avgScore,
        avgTajweed,
        surahsStarted: userProgress.filter(sp => sp.completedAyahs > 0).length,
        surahsCompleted,
        hifdhSurahs: userHifdh.length,
        hifdhMemorized: userHifdh.filter(h => h.status === "memorized").length,
        onboardingComplete: p.onboardingComplete,
      };
    });

    res.json({ students, page, limit, total: students.length });
  } catch (err) {
    logger.error({ err }, "Failed to get teacher dashboard students");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/teacher-dashboard/student/:clerkId", requireAuth, async (req: any, res) => {
  try {
    const { clerkId } = req.params;
    const [profileRows, recordings, progress, hifdh, conversations] = await Promise.all([
      db.select().from(profilesTable).where(eq(profilesTable.clerkId, clerkId)).limit(1),
      db.select().from(recordingsTable).where(eq(recordingsTable.userId, clerkId)).orderBy(desc(recordingsTable.createdAt)).limit(20),
      db.select().from(surahProgressTable).where(eq(surahProgressTable.userId, clerkId)),
      db.select().from(hifdhProgressTable).where(eq(hifdhProgressTable.userId, clerkId)),
      db.select().from(conversationsTable).where(eq(conversationsTable.userId, clerkId)),
    ]);

    if (!profileRows[0]) { res.status(404).json({ error: "Student not found" }); return; }
    const profile = profileRows[0];

    const scores = recordings.map(r => ((r.feedback as any)?.overallScore ?? 0) as number).filter(s => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const thisWeekRecs = recordings.filter(r => new Date(r.createdAt) >= oneWeekAgo);
    const lastWeekRecs = recordings.filter(r => { const t = new Date(r.createdAt); return t >= twoWeeksAgo && t < oneWeekAgo; });

    const getAvg = (recs: typeof recordings) => {
      const s = recs.map(r => ((r.feedback as any)?.overallScore ?? 0) as number).filter(x => x > 0);
      return s.length > 0 ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : 0;
    };
    const improvement = getAvg(lastWeekRecs) > 0 ? getAvg(thisWeekRecs) - getAvg(lastWeekRecs) : 0;

    const tajweedErrors: Record<string, number> = {};
    for (const rec of recordings) {
      const fb = rec.feedback as any;
      if (!fb?.tajweedRules) continue;
      for (const rule of fb.tajweedRules) {
        if (!rule.found) tajweedErrors[rule.name] = (tajweedErrors[rule.name] ?? 0) + 1;
      }
    }
    const weakAreas = Object.entries(tajweedErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ rule: name, count }));

    res.json({
      profile: {
        clerkId: profile.clerkId, displayName: profile.displayName, avatarUrl: profile.avatarUrl,
        level: profile.level, xp: profile.xp, streakDays: profile.streakDays,
        lastStudyDate: profile.lastStudyDate, dailyGoalMinutes: profile.dailyGoalMinutes,
      },
      stats: {
        totalRecordings: recordings.length,
        avgScore,
        improvement,
        surahsStarted: progress.filter(sp => sp.completedAyahs > 0).length,
        surahsCompleted: progress.filter(sp => {
          const surah = SURAHS.find(s => s.number === sp.surahId);
          return surah && sp.completedAyahs >= surah.ayahCount;
        }).length,
        hifdhSurahs: hifdh.length,
        hifdhMemorized: hifdh.filter(h => h.status === "memorized").length,
        aiConversations: conversations.length,
      },
      weakAreas,
      recentRecordings: recordings.slice(0, 5).map(r => ({
        id: r.id, surahId: r.surahId, ayahNumber: r.ayahNumber,
        overallScore: ((r.feedback as any)?.overallScore ?? 0),
        tajweedScore: ((r.feedback as any)?.tajweedScore ?? 0),
        createdAt: r.createdAt,
      })),
      surahProgress: progress.map(sp => ({
        surahId: sp.surahId, surahName: sp.surahName,
        completedAyahs: sp.completedAyahs,
        totalAyahs: SURAHS.find(s => s.number === sp.surahId)?.ayahCount ?? sp.totalAyahs,
        averageScore: sp.averageScore, lastStudied: sp.lastStudied,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Failed to get student detail");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/teacher-dashboard/class-report", requireAuth, async (req: any, res) => {
  try {
    const [profiles, allRecordings] = await Promise.all([
      db.select().from(profilesTable),
      db.select().from(recordingsTable),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const totalStudents = profiles.length;
    const activeToday = new Set(
      allRecordings.filter(r => new Date(r.createdAt).toISOString().split("T")[0] === today).map(r => r.userId)
    ).size;
    const activeThisWeek = new Set(
      allRecordings.filter(r => new Date(r.createdAt) >= oneWeekAgo).map(r => r.userId)
    ).size;

    const allScores = allRecordings.map(r => ((r.feedback as any)?.overallScore ?? 0) as number).filter(s => s > 0);
    const avgClassScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

    const tajweedErrors: Record<string, number> = {};
    for (const rec of allRecordings) {
      const fb = rec.feedback as any;
      if (!fb?.tajweedRules) continue;
      for (const rule of fb.tajweedRules) {
        if (!rule.found) tajweedErrors[rule.name] = (tajweedErrors[rule.name] ?? 0) + 1;
      }
    }
    const classWeakAreas = Object.entries(tajweedErrors)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, count]) => ({ rule: name, count }));

    const levelDist: Record<string, number> = {};
    for (const p of profiles) { const l = p.level || "beginner"; levelDist[l] = (levelDist[l] ?? 0) + 1; }

    res.json({
      totalStudents, activeToday, activeThisWeek, avgClassScore,
      totalRecordingsThisWeek: allRecordings.filter(r => new Date(r.createdAt) >= oneWeekAgo).length,
      levelDistribution: levelDist,
      classWeakAreas,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get class report");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
