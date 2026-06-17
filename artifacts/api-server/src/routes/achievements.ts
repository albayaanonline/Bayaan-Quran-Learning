import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db, achievementsTable, recordingsTable, surahProgressTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

const ALL_ACHIEVEMENTS = [
  { slug: "first_recitation", title: "First Recitation", description: "Complete your first ayah recitation", iconType: "mic", xpReward: 50 },
  { slug: "streak_3", title: "3-Day Streak", description: "Study for 3 consecutive days", iconType: "flame", xpReward: 75 },
  { slug: "streak_7", title: "Week Warrior", description: "Maintain a 7-day streak", iconType: "flame", xpReward: 150 },
  { slug: "streak_30", title: "Monthly Master", description: "Keep a 30-day streak", iconType: "crown", xpReward: 500 },
  { slug: "surah_fatihah", title: "Al-Fatihah Complete", description: "Complete Surah Al-Fatihah", iconType: "book", xpReward: 100 },
  { slug: "surah_5", title: "5 Surahs Started", description: "Begin learning 5 different surahs", iconType: "book", xpReward: 100 },
  { slug: "perfect_score", title: "Perfect Score", description: "Get 100% on a recitation", iconType: "star", xpReward: 200 },
  { slug: "recordings_10", title: "10 Recitations", description: "Complete 10 recitation sessions", iconType: "mic", xpReward: 100 },
  { slug: "recordings_50", title: "50 Recitations", description: "Complete 50 recitation sessions", iconType: "trophy", xpReward: 300 },
  { slug: "xp_500", title: "500 XP", description: "Earn 500 XP points", iconType: "star", xpReward: 50 },
  { slug: "xp_1000", title: "1000 XP", description: "Earn 1000 XP points", iconType: "medal", xpReward: 100 },
  { slug: "tajweed_master", title: "Tajweed Master", description: "Achieve 90%+ Tajweed score", iconType: "moon", xpReward: 250 },
];

async function syncAchievements(userId: string) {
  const existing = await db.select().from(achievementsTable).where(eq(achievementsTable.userId, userId));
  const existingSlugs = new Set(existing.map(a => a.slug));

  const recordings = await db.select().from(recordingsTable).where(eq(recordingsTable.userId, userId));
  const surahProgress = await db.select().from(surahProgressTable).where(eq(surahProgressTable.userId, userId));

  const newAchievements = ALL_ACHIEVEMENTS.filter(a => !existingSlugs.has(a.slug));
  if (newAchievements.length > 0) {
    await db.insert(achievementsTable).values(
      newAchievements.map(a => ({
        userId,
        slug: a.slug,
        title: a.title,
        description: a.description,
        iconType: a.iconType,
        xpReward: a.xpReward,
        isUnlocked: false,
        progress: 0,
      }))
    );
  }

  const updates: Array<{ slug: string; isUnlocked: boolean; progress: number }> = [];
  const recCount = recordings.length;
  const surahsStarted = surahProgress.filter(s => s.completedAyahs > 0).length;
  const hasFatihahComplete = surahProgress.some(s => s.surahId === 1 && s.completedAyahs >= 7);
  const hasRecording = recCount > 0;
  const hasPerfectScore = recordings.some(r => (r.feedback as any)?.overallScore >= 100);
  const hasHighTajweed = recordings.some(r => (r.feedback as any)?.tajweedScore >= 90);

  updates.push({ slug: "first_recitation", isUnlocked: hasRecording, progress: hasRecording ? 100 : 0 });
  updates.push({ slug: "surah_fatihah", isUnlocked: hasFatihahComplete, progress: hasFatihahComplete ? 100 : 0 });
  updates.push({ slug: "surah_5", isUnlocked: surahsStarted >= 5, progress: Math.min(100, Math.round(surahsStarted / 5 * 100)) });
  updates.push({ slug: "perfect_score", isUnlocked: hasPerfectScore, progress: hasPerfectScore ? 100 : 0 });
  updates.push({ slug: "recordings_10", isUnlocked: recCount >= 10, progress: Math.min(100, Math.round(recCount / 10 * 100)) });
  updates.push({ slug: "recordings_50", isUnlocked: recCount >= 50, progress: Math.min(100, Math.round(recCount / 50 * 100)) });
  updates.push({ slug: "tajweed_master", isUnlocked: hasHighTajweed, progress: hasHighTajweed ? 100 : 0 });

  for (const u of updates) {
    const row = await db.select().from(achievementsTable)
      .where(eq(achievementsTable.userId, userId))
      .limit(1);
    if (row.length > 0) {
      await db.update(achievementsTable).set({
        isUnlocked: u.isUnlocked,
        progress: u.progress,
        unlockedAt: u.isUnlocked && !row[0].unlockedAt ? new Date() : row[0].unlockedAt,
      }).where(eq(achievementsTable.slug, u.slug));
    }
  }
}

router.get("/achievements", requireAuth, async (req: any, res) => {
  try {
    await syncAchievements(req.userId);
    const rows = await db.select().from(achievementsTable).where(eq(achievementsTable.userId, req.userId));
    res.json(rows.map(a => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      description: a.description,
      iconType: a.iconType,
      xpReward: a.xpReward,
      isUnlocked: a.isUnlocked,
      unlockedAt: a.unlockedAt ?? null,
      progress: a.progress ?? null,
    })));
  } catch (err) {
    logger.error({ err }, "Failed to list achievements");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
