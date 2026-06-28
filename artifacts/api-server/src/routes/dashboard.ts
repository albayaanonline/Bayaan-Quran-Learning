import { Router, type IRouter } from "express";
import { db, profilesTable, recordingsTable, surahProgressTable, bookmarksTable, achievementsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { SURAHS } from "./surahs";

const router: IRouter = Router();

function buildTrialDates(referenceTime?: Date | null) {
  const start = referenceTime instanceof Date && !isNaN(referenceTime.getTime())
    ? referenceTime
    : new Date();
  const end = new Date(start.getTime() + 48 * 60 * 60 * 1000);
  return { trialStartDate: start, trialEndDate: end };
}

async function getOrCreateProfile(userId: string) {
  let rows = await db.select().from(profilesTable).where(eq(profilesTable.clerkId, userId)).limit(1);
  if (rows.length === 0) {
    const trial = buildTrialDates();
    const inserted = await db.insert(profilesTable).values({
      clerkId: userId,
      displayName: "Student",
      ...trial,
    }).returning();
    rows = inserted;
  } else if (!rows[0].trialStartDate || !rows[0].trialEndDate) {
    // Backfill — anchor trial to the account's creation time
    const trial = buildTrialDates(rows[0].createdAt ? new Date(rows[0].createdAt) : null);
    const updated = await db
      .update(profilesTable)
      .set(trial)
      .where(eq(profilesTable.clerkId, userId))
      .returning();
    rows = updated;
  }
  return rows[0];
}

function formatProfile(p: any) {
  let goals: string[] = [];
  try { goals = typeof p.learningGoals === "string" ? JSON.parse(p.learningGoals) : (p.learningGoals ?? []); } catch {}
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

    const [profile, allRecordings, surahRows, bookmarks, achievements] = await Promise.all([
      getOrCreateProfile(userId),
      db.select().from(recordingsTable).where(eq(recordingsTable.userId, userId)).orderBy(desc(recordingsTable.createdAt)),
      db.select().from(surahProgressTable).where(eq(surahProgressTable.userId, userId)),
      db.select().from(bookmarksTable).where(eq(bookmarksTable.userId, userId)),
      db.select().from(achievementsTable).where(eq(achievementsTable.userId, userId)),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const todayRecs = allRecordings.filter(r => new Date(r.createdAt).toISOString().split("T")[0] === today);
    const thisWeekRecs = allRecordings.filter(r => new Date(r.createdAt) >= oneWeekAgo);
    const lastWeekRecs = allRecordings.filter(r => {
      const t = new Date(r.createdAt);
      return t >= twoWeeksAgo && t < oneWeekAgo;
    });

    const minutesStudiedToday = Math.round(todayRecs.reduce((s, r) => s + r.durationSeconds, 0) / 60);

    const getAvgScore = (recs: typeof allRecordings) => {
      const scores = recs.map(r => ((r.feedback as any)?.overallScore ?? 0) as number).filter(s => s > 0);
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    };

    const thisWeekAvg = getAvgScore(thisWeekRecs);
    const lastWeekAvg = getAvgScore(lastWeekRecs);
    const improvement = lastWeekAvg > 0 ? thisWeekAvg - lastWeekAvg : 0;

    const weeklyXp = thisWeekRecs.reduce((sum, r) => {
      const score = ((r.feedback as any)?.overallScore ?? 0) as number;
      return sum + 10 + (score >= 90 ? 20 : score >= 75 ? 10 : 0);
    }, 0);

    const recentRecordings = allRecordings.slice(0, 5);
    const scores = recentRecordings.map(r => ((r.feedback as any)?.overallScore as number) ?? 0).filter(s => s > 0);
    const avgAccuracy = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const tajweedScores = recentRecordings.map(r => ((r.feedback as any)?.tajweedScore as number) ?? 0).filter(s => s > 0);
    const avgTajweed = tajweedScores.length > 0 ? Math.round(tajweedScores.reduce((a, b) => a + b, 0) / tajweedScores.length) : 0;

    const totalAyahs = surahRows.reduce((sum, s) => sum + s.completedAyahs, 0);
    const surahsInProgress = surahRows.filter(s => s.completedAyahs > 0).length;
    const surahsCompleted = surahRows.filter(s => {
      const surah = SURAHS.find(su => su.number === s.surahId);
      return surah && s.completedAyahs >= surah.ayahCount;
    }).length;

    const xpLevel = Math.floor(profile.xp / 500) + 1;
    const xpToNextLevel = (xpLevel * 500) - profile.xp;

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
        minutesStudiedToday,
      },
      todayMinutes: minutesStudiedToday,
      weeklyXp,
      totalAyahs,
      recentRecordings: recentRecordings.map(r => ({
        id: r.id, userId: r.userId, surahId: r.surahId, ayahId: r.ayahId, ayahNumber: r.ayahNumber,
        audioUrl: r.audioUrl ?? null, durationSeconds: r.durationSeconds, createdAt: r.createdAt, feedback: r.feedback ?? null,
      })),
      recentAchievements: achievements.filter(a => a.isUnlocked).slice(0, 4).map(a => ({
        id: a.id, slug: a.slug, title: a.title, description: a.description,
        iconType: a.iconType, xpReward: a.xpReward, isUnlocked: a.isUnlocked,
        unlockedAt: a.unlockedAt ?? null, progress: a.progress ?? null,
      })),
      quickStats: {
        avgAccuracy, avgTajweed, totalRecordings: allRecordings.length,
        totalBookmarks: bookmarks.length, surahsInProgress, surahsCompleted, improvement,
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
    const allRecs = await db.select().from(recordingsTable).where(eq(recordingsTable.userId, userId));

    const days: any[] = [];
    let totalXp = 0, totalMinutes = 0, totalRecordings = 0, totalScore = 0, scoreCount = 0;

    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekRecs = allRecs.filter(r => new Date(r.createdAt) >= oneWeekAgo);
    const lastWeekRecs = allRecs.filter(r => {
      const t = new Date(r.createdAt);
      return t >= twoWeeksAgo && t < oneWeekAgo;
    });

    const getAvg = (recs: typeof allRecs) => {
      const s = recs.map(r => ((r.feedback as any)?.overallScore ?? 0) as number).filter(x => x > 0);
      return s.length > 0 ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : 0;
    };

    const thisWeekAvg = getAvg(thisWeekRecs);
    const lastWeekAvg = getAvg(lastWeekRecs);
    const improvement = lastWeekAvg > 0 ? thisWeekAvg - lastWeekAvg : 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const dayRecs = allRecs.filter(r => new Date(r.createdAt).toISOString().split("T")[0] === dateStr);
      const xp = dayRecs.reduce((sum, r) => {
        const score = ((r.feedback as any)?.overallScore ?? 0) as number;
        return sum + 10 + (score >= 90 ? 20 : score >= 75 ? 10 : 0);
      }, 0);
      const minutes = Math.round(dayRecs.reduce((s, r) => s + r.durationSeconds, 0) / 60);
      const dayScores = dayRecs.map(r => ((r.feedback as any)?.overallScore as number) ?? 0).filter(s => s > 0);
      if (dayScores.length > 0) { totalScore += dayScores.reduce((a, b) => a + b, 0); scoreCount += dayScores.length; }

      totalXp += xp; totalMinutes += minutes; totalRecordings += dayRecs.length;
      days.push({ date: dateStr, xp, minutes, recordings: dayRecs.length });
    }

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const bestDayIdx = days.reduce((best, d, i) => d.xp > days[best].xp ? i : best, 0);
    const bestDayDate = new Date(days[bestDayIdx].date);

    res.json({
      days, totalXp, totalMinutes, totalRecordings,
      avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
      bestDay: dayNames[bestDayDate.getDay()],
      improvement,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get weekly report");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
