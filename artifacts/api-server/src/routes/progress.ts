import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db, surahProgressTable, recordingsTable, profilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { SURAHS } from "./surahs";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

router.get("/progress", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const surahRows = await db.select().from(surahProgressTable).where(eq(surahProgressTable.userId, userId));
    const recordingRows = await db.select().from(recordingsTable).where(eq(recordingsTable.userId, userId));

    const totalAyahsRecited = surahRows.reduce((sum, s) => sum + s.completedAyahs, 0);
    const totalSurahsStarted = surahRows.filter(s => s.completedAyahs > 0).length;
    const totalSurahsCompleted = surahRows.filter(s => {
      const surah = SURAHS.find(su => su.number === s.surahId);
      return surah && s.completedAyahs >= surah.ayahCount;
    }).length;

    const scores = recordingRows.map(r => {
      const fb = r.feedback as any;
      return fb?.overallScore ?? 0;
    }).filter(s => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const tajweedScores = recordingRows.map(r => (r.feedback as any)?.tajweedScore ?? 0).filter(s => s > 0);
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

    const xpLevel = Math.floor(profile.xp / 500) + 1;
    const xpToNextLevel = (xpLevel * 500) - profile.xp;
    const today = new Date().toISOString().split("T")[0];

    res.json({
      currentStreak: profile.streakDays,
      longestStreak: profile.streakDays,
      xp: profile.xp,
      level: xpLevel,
      xpToNextLevel,
      dailyGoalMinutes: profile.dailyGoalMinutes,
      dailyGoalCompletedToday: profile.lastStudyDate === today,
      minutesStudiedToday: 0,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get streak");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/progress/surah/:surahId", requireAuth, async (req: any, res) => {
  try {
    const surahId = parseInt(req.params.surahId);
    const rows = await db.select().from(surahProgressTable)
      .where(and(eq(surahProgressTable.userId, req.userId), eq(surahProgressTable.surahId, surahId)))
      .limit(1);
    const surah = SURAHS.find(s => s.number === surahId);
    if (rows.length === 0) {
      res.json({
        surahId,
        surahName: surah?.name ?? "",
        completedAyahs: 0,
        totalAyahs: surah?.ayahCount ?? 0,
        lastStudied: null,
        averageScore: null,
      });
      return;
    }
    const s = rows[0];
    res.json({
      surahId: s.surahId,
      surahName: s.surahName,
      completedAyahs: s.completedAyahs,
      totalAyahs: surah?.ayahCount ?? s.totalAyahs,
      lastStudied: s.lastStudied ?? null,
      averageScore: s.averageScore ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get surah progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/progress/surah/:surahId", requireAuth, async (req: any, res) => {
  try {
    const surahId = parseInt(req.params.surahId);
    const { completedAyahs } = req.body;
    const surah = SURAHS.find(s => s.number === surahId);
    const existing = await db.select().from(surahProgressTable)
      .where(and(eq(surahProgressTable.userId, req.userId), eq(surahProgressTable.surahId, surahId)))
      .limit(1);
    let row;
    if (existing.length === 0) {
      const inserted = await db.insert(surahProgressTable).values({
        userId: req.userId,
        surahId,
        surahName: surah?.name ?? "",
        completedAyahs: completedAyahs ?? 0,
        totalAyahs: surah?.ayahCount ?? 7,
        lastStudied: new Date(),
      }).returning();
      row = inserted[0];
    } else {
      const updated = await db.update(surahProgressTable).set({
        completedAyahs: completedAyahs ?? existing[0].completedAyahs,
        lastStudied: new Date(),
      }).where(and(eq(surahProgressTable.userId, req.userId), eq(surahProgressTable.surahId, surahId))).returning();
      row = updated[0];
    }
    res.json({
      surahId: row.surahId,
      surahName: row.surahName,
      completedAyahs: row.completedAyahs,
      totalAyahs: surah?.ayahCount ?? row.totalAyahs,
      lastStudied: row.lastStudied ?? null,
      averageScore: row.averageScore ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to update surah progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
