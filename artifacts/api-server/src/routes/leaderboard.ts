import { Router, type IRouter } from "express";
import { db, profilesTable, surahProgressTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { SURAHS } from "./surahs";

const router: IRouter = Router();

router.get("/leaderboard", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const [profiles, allProgress] = await Promise.all([
      db.select().from(profilesTable).orderBy(desc(profilesTable.xp)).limit(20),
      db.select().from(surahProgressTable),
    ]);

    const completedByUser = new Map<string, number>();
    for (const row of allProgress) {
      const surah = SURAHS.find(s => s.number === row.surahId);
      if (surah && row.completedAyahs >= surah.ayahCount) {
        completedByUser.set(row.userId, (completedByUser.get(row.userId) ?? 0) + 1);
      }
    }

    const entries = profiles.map((p, idx) => ({
      rank: idx + 1,
      userId: p.clerkId,
      displayName: p.displayName || "Student",
      avatarUrl: p.avatarUrl ?? null,
      xp: p.xp,
      streakDays: p.streakDays,
      surahsCompleted: completedByUser.get(p.clerkId) ?? 0,
      isCurrentUser: p.clerkId === userId,
    }));

    res.json(entries);
  } catch (err) {
    logger.error({ err }, "Failed to get leaderboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
