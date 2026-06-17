import { Router } from "express";
import { db, achievementsTable, recordingsTable, surahProgressTable, profilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

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
  const existingSlugs = new Set(existing.map((a) => a.slug));

  const newAchievements = ALL_ACHIEVEMENTS.filter((a) => !existingSlugs.has(a.slug));
  if (newAchievements.length > 0) {
    await db.insert(achievementsTable).values(
      newAchievements.map((a) => ({
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

  const [recordings, surahProgress, profileRows] = await Promise.all([
    db.select().from(recordingsTable).where(eq(recordingsTable.userId, userId)),
    db.select().from(surahProgressTable).where(eq(surahProgressTable.userId, userId)),
    db.select().from(profilesTable).where(eq(profilesTable.clerkId, userId)).limit(1),
  ]);

  const profile = profileRows[0];
  const recCount = recordings.length;
  const surahsStarted = surahProgress.filter((s) => s.completedAyahs > 0).length;
  const hasFatihahComplete = surahProgress.some((s) => s.surahId === 1 && s.completedAyahs >= 7);
  const hasPerfectScore = recordings.some((r) => ((r.feedback as any)?.overallScore ?? 0) >= 100);
  const hasHighTajweed = recordings.some((r) => ((r.feedback as any)?.tajweedScore ?? 0) >= 90);

  const unlockMap: Record<string, { isUnlocked: boolean; progress: number }> = {
    first_recitation: { isUnlocked: recCount > 0, progress: recCount > 0 ? 100 : 0 },
    streak_3: { isUnlocked: (profile?.streakDays ?? 0) >= 3, progress: Math.min(100, Math.round(((profile?.streakDays ?? 0) / 3) * 100)) },
    streak_7: { isUnlocked: (profile?.streakDays ?? 0) >= 7, progress: Math.min(100, Math.round(((profile?.streakDays ?? 0) / 7) * 100)) },
    streak_30: { isUnlocked: (profile?.streakDays ?? 0) >= 30, progress: Math.min(100, Math.round(((profile?.streakDays ?? 0) / 30) * 100)) },
    surah_fatihah: { isUnlocked: hasFatihahComplete, progress: hasFatihahComplete ? 100 : 0 },
    surah_5: { isUnlocked: surahsStarted >= 5, progress: Math.min(100, Math.round((surahsStarted / 5) * 100)) },
    perfect_score: { isUnlocked: hasPerfectScore, progress: hasPerfectScore ? 100 : 0 },
    recordings_10: { isUnlocked: recCount >= 10, progress: Math.min(100, Math.round((recCount / 10) * 100)) },
    recordings_50: { isUnlocked: recCount >= 50, progress: Math.min(100, Math.round((recCount / 50) * 100)) },
    xp_500: { isUnlocked: (profile?.xp ?? 0) >= 500, progress: Math.min(100, Math.round(((profile?.xp ?? 0) / 500) * 100)) },
    xp_1000: { isUnlocked: (profile?.xp ?? 0) >= 1000, progress: Math.min(100, Math.round(((profile?.xp ?? 0) / 1000) * 100)) },
    tajweed_master: { isUnlocked: hasHighTajweed, progress: hasHighTajweed ? 100 : 0 },
  };

  const allRows = await db.select().from(achievementsTable).where(eq(achievementsTable.userId, userId));

  for (const row of allRows) {
    const update = unlockMap[row.slug];
    if (!update) continue;
    await db
      .update(achievementsTable)
      .set({
        isUnlocked: update.isUnlocked,
        progress: update.progress,
        unlockedAt: update.isUnlocked && !row.unlockedAt ? new Date() : row.unlockedAt,
      })
      .where(and(eq(achievementsTable.userId, userId), eq(achievementsTable.slug, row.slug)));
  }
}

router.get("/achievements", requireAuth, async (req: any, res) => {
  try {
    await syncAchievements(req.userId);
    const rows = await db.select().from(achievementsTable).where(eq(achievementsTable.userId, req.userId));
    res.json(
      rows.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        description: a.description,
        iconType: a.iconType,
        xpReward: a.xpReward,
        isUnlocked: a.isUnlocked,
        unlockedAt: a.unlockedAt ?? null,
        progress: a.progress ?? null,
      }))
    );
  } catch (err) {
    logger.error({ err }, "Failed to list achievements");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
