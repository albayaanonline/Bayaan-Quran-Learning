import { Router, type IRouter } from "express";
import { db, surahProgressTable, recordingsTable, profilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { SURAHS } from "./surahs";

const router: IRouter = Router();

router.get("/progress", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const [surahRows, recordingRows] = await Promise.all([
      db.select().from(surahProgressTable).where(eq(surahProgressTable.userId, userId)),
      db.select().from(recordingsTable).where(eq(recordingsTable.userId, userId)),
    ]);

    const totalAyahsRecited = surahRows.reduce((sum, s) => sum + s.completedAyahs, 0);
    const totalSurahsStarted = surahRows.filter(s => s.completedAyahs > 0).length;
    const totalSurahsCompleted = surahRows.filter(s => {
      const surah = SURAHS.find(su => su.number === s.surahId);
      return surah && s.completedAyahs >= surah.ayahCount;
    }).length;

    const scores = recordingRows.map(r => ((r.feedback as any)?.overallScore ?? 0) as number).filter(s => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const tajweedScores = recordingRows.map(r => ((r.feedback as any)?.tajweedScore ?? 0) as number).filter(s => s > 0);
    const avgTajweed = tajweedScores.length > 0 ? Math.round(tajweedScores.reduce((a, b) => a + b, 0) / tajweedScores.length) : 0;

    res.json({
      totalAyahsRecited,
      totalSurahsStarted,
      totalSurahsCompleted,
      totalRecordingMinutes: Math.round(recordingRows.reduce((sum, r) => sum + r.durationSeconds, 0) / 60),
      tajweedScore: avgTajweed,
      accuracyScore: avgScore,
      surahsProgress: surahRows.map(s => ({
        surahId: s.surahId,
        surahName: s.surahName,
        completedAyahs: s.completedAyahs,
        totalAyahs: SURAHS.find(su => su.number === s.surahId)?.ayahCount ?? s.totalAyahs,
        lastStudied: s.lastStudied ?? null,
        averageScore: s.averageScore ?? null,
        progressPercent: Math.round((s.completedAyahs / (SURAHS.find(su => su.number === s.surahId)?.ayahCount ?? s.totalAyahs)) * 100),
      })),
    });
  } catch (err) {
    logger.error({ err }, "Failed to get progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/progress/streak", requireAuth, async (req: any, res) => {
  try {
    const rows = await db.select().from(profilesTable).where(eq(profilesTable.clerkId, req.userId)).limit(1);
    const profile = rows[0];
    if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

    const today = new Date().toISOString().split("T")[0];
    const xpLevel = Math.floor(profile.xp / 500) + 1;
    const xpToNextLevel = (xpLevel * 500) - profile.xp;

    const todayRecs = await db.select().from(recordingsTable).where(eq(recordingsTable.userId, req.userId));
    const todayRecsList = todayRecs.filter(r => new Date(r.createdAt).toISOString().split("T")[0] === today);
    const minutesStudiedToday = Math.round(todayRecsList.reduce((s, r) => s + r.durationSeconds, 0) / 60);

    res.json({
      currentStreak: profile.streakDays,
      longestStreak: profile.streakDays,
      xp: profile.xp,
      level: xpLevel,
      xpToNextLevel,
      dailyGoalMinutes: profile.dailyGoalMinutes,
      dailyGoalCompletedToday: profile.lastStudyDate === today,
      minutesStudiedToday,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get streak");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/progress/surah/:surahId", requireAuth, async (req: any, res) => {
  try {
    const surahId = parseInt(req.params.surahId);
    if (isNaN(surahId)) { res.status(400).json({ error: "Invalid surah ID" }); return; }
    const rows = await db.select().from(surahProgressTable)
      .where(and(eq(surahProgressTable.userId, req.userId), eq(surahProgressTable.surahId, surahId)))
      .limit(1);
    const surah = SURAHS.find(s => s.number === surahId);
    if (rows.length === 0) {
      res.json({ surahId, surahName: surah?.name ?? "", completedAyahs: 0, totalAyahs: surah?.ayahCount ?? 0, lastStudied: null, averageScore: null, progressPercent: 0 });
      return;
    }
    const s = rows[0];
    const total = surah?.ayahCount ?? s.totalAyahs;
    res.json({
      surahId: s.surahId, surahName: s.surahName, completedAyahs: s.completedAyahs, totalAyahs: total,
      lastStudied: s.lastStudied ?? null, averageScore: s.averageScore ?? null,
      progressPercent: Math.round((s.completedAyahs / total) * 100),
    });
  } catch (err) {
    logger.error({ err }, "Failed to get surah progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/progress/surah/:surahId", requireAuth, async (req: any, res) => {
  try {
    const surahId = parseInt(req.params.surahId);
    if (isNaN(surahId)) { res.status(400).json({ error: "Invalid surah ID" }); return; }
    const { completedAyahs } = req.body;
    const surah = SURAHS.find(s => s.number === surahId);
    const existing = await db.select().from(surahProgressTable)
      .where(and(eq(surahProgressTable.userId, req.userId), eq(surahProgressTable.surahId, surahId)))
      .limit(1);
    let row;
    if (existing.length === 0) {
      const inserted = await db.insert(surahProgressTable).values({
        userId: req.userId, surahId, surahName: surah?.name ?? "",
        completedAyahs: completedAyahs ?? 0, totalAyahs: surah?.ayahCount ?? 7, lastStudied: new Date(),
      }).returning();
      row = inserted[0];
    } else {
      const updated = await db.update(surahProgressTable).set({
        completedAyahs: completedAyahs ?? existing[0].completedAyahs, lastStudied: new Date(),
      }).where(and(eq(surahProgressTable.userId, req.userId), eq(surahProgressTable.surahId, surahId))).returning();
      row = updated[0];
    }
    const total = surah?.ayahCount ?? row.totalAyahs;
    res.json({
      surahId: row.surahId, surahName: row.surahName, completedAyahs: row.completedAyahs, totalAyahs: total,
      lastStudied: row.lastStudied ?? null, averageScore: row.averageScore ?? null,
      progressPercent: Math.round((row.completedAyahs / total) * 100),
    });
  } catch (err) {
    logger.error({ err }, "Failed to update surah progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
