import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db, profilesTable, recordingsTable, surahProgressTable, bookmarksTable, achievementsTable } from "@workspace/db";
import { eq, gte, desc } from "drizzle-orm";
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

async function getOrCreateProfile(userId: string) {
  let rows = await db.select().from(profilesTable).where(eq(profilesTable.clerkId, userId)).limit(1);
  if (rows.length === 0) {
    const inserted = await db.insert(profilesTable).values({ clerkId: userId, displayName: "Student" }).returning();
    rows = inserted;
  }
  return rows[0];
}

function formatProfile(p: any) {
  let goals: string[] = [];
  try { goals = typeof p.learningGoals === "string" ? JSON.parse(p.learningGoals) : p.learningGoals; } catch {}
  return {
    id: p.id, clerkId: p.clerkId, displayName: p.displayName, avatarUrl: p.avatarUrl ?? null,
    onboardingComplete: p.onboardingComplete, language: p.language, learningGoals: goals,
    level: p.level, ageGroup: p.ageGroup, dailyGoalMinutes: p.dailyGoalMinutes,
    preferredQari: p.preferredQari, teacherPreference: p.teacherPreference,
    xp: p.xp, streakDays: p.streakDays, createdAt: p.createdAt,
  };
}

router.get("/dashboard", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const [profile, recordings, surahRows, bookmarks, achievements] = await Promise.all([
      getOrCreateProfile(userId),
      db.select().from(recordingsTable).where(eq(recordingsTable.userId, userId)).orderBy(desc(recordingsTable.createdAt)).limit(5),
      db.select().from(surahProgressTable).where(eq(surahProgressTable.userId, userId)),
      db.select().from(bookmarksTable).where(eq(bookmarksTable.userId, userId)),
      db.select().from(achievementsTable).where(eq(achievementsTable.userId, userId)),
    ]);

    const xpLevel = Math.floor(profile.xp / 500) + 1;
    const xpToNextLevel = (xpLevel * 500) - profile.xp;
    const today = new Date().toISOString().split("T")[0];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const scores = recordings.map(r => ((r.feedback as any)?.overallScore as number) ?? 0).filter((s: number) => s > 0);
    const avgAccuracy = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
    const tajweedScores = recordings.map(r => ((r.feedback as any)?.tajweedScore as number) ?? 0).filter((s: number) => s > 0);
    const avgTajweed = tajweedScores.length > 0 ? Math.round(tajweedScores.reduce((a: number, b: number) => a + b, 0) / tajweedScores.length) : 0;

    const totalAyahs = surahRows.reduce((sum: number, s) => sum + s.completedAyahs, 0);
    const surahsInProgress = surahRows.filter(s => s.completedAyahs > 0).length;
    const surahsCompleted = surahRows.filter(s => {
      const surah = SURAHS.find(su => su.number === s.surahId);
      return surah && s.completedAyahs >= surah.ayahCount;
    }).length;

    res.json({
      profile: formatProfile(profile),
      streak: {
        currentStreak: profile.streakDays,
        longestStreak: profile.streakDays,
        xp: profile.xp,
        level: xpLevel,
        xpToNextLevel,
        dailyGoalMinutes: profile.dailyGoalMinutes,
        dailyGoalCompletedToday: profile.lastStudyDate === today,
        minutesStudiedToday: 0,
      },
      todayMinutes: 0,
      weeklyXp: Math.round(profile.xp * 0.3),
      totalAyahs,
      recentRecordings: recordings.map(r => ({
        id: r.id, userId: r.userId, surahId: r.surahId, ayahId: r.ayahId, ayahNumber: r.ayahNumber,
        audioUrl: r.audioUrl ?? null, durationSeconds: r.durationSeconds, createdAt: r.createdAt, feedback: r.feedback ?? null,
      })),
      recentAchievements: achievements.filter(a => a.isUnlocked).slice(0, 4).map(a => ({
        id: a.id, slug: a.slug, title: a.title, description: a.description,
        iconType: a.iconType, xpReward: a.xpReward, isUnlocked: a.isUnlocked,
        unlockedAt: a.unlockedAt ?? null, progress: a.progress ?? null,
      })),
      quickStats: {
        avgAccuracy, avgTajweed, totalRecordings: recordings.length,
        totalBookmarks: bookmarks.length, surahsInProgress, surahsCompleted,
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to get dashboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/weekly-report", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const days: any[] = [];
    let totalXp = 0, totalMinutes = 0, totalRecordings = 0, totalScore = 0, scoreCount = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayStart = new Date(dateStr + "T00:00:00Z");
      const dayEnd = new Date(dateStr + "T23:59:59Z");

      const allRecs = await db.select().from(recordingsTable).where(eq(recordingsTable.userId, userId));
      const dayRecs = allRecs.filter(r => {
        const t = new Date(r.createdAt);
        return t >= dayStart && t <= dayEnd;
      });

      const xp = dayRecs.length * 10;
      const minutes = Math.round(dayRecs.reduce((s: number, r) => s + r.durationSeconds, 0) / 60);
      const dayScore = dayRecs.map(r => ((r.feedback as any)?.overallScore as number) ?? 0).filter((s: number) => s > 0);
      if (dayScore.length > 0) { totalScore += dayScore.reduce((a: number, b: number) => a + b, 0); scoreCount += dayScore.length; }

      totalXp += xp; totalMinutes += minutes; totalRecordings += dayRecs.length;
      days.push({ date: dateStr, xp, minutes, recordings: dayRecs.length });
    }

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const bestDayIdx = days.reduce((best, d, i) => d.xp > days[best].xp ? i : best, 0);
    const bestDayDate = new Date(days[bestDayIdx].date);

    res.json({
      days,
      totalXp,
      totalMinutes,
      totalRecordings,
      avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
      bestDay: dayNames[bestDayDate.getDay()],
      improvement: 12,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get weekly report");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
