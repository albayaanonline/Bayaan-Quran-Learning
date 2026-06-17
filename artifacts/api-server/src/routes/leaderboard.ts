import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db, profilesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

router.get("/leaderboard", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const profiles = await db.select().from(profilesTable).orderBy(desc(profilesTable.xp)).limit(20);

    const entries = profiles.map((p, idx) => ({
      rank: idx + 1,
      userId: p.clerkId,
      displayName: p.displayName || "Student",
      avatarUrl: p.avatarUrl ?? null,
      xp: p.xp,
      streakDays: p.streakDays,
      surahsCompleted: 0,
      isCurrentUser: p.clerkId === userId,
    }));

    res.json(entries);
  } catch (err) {
    logger.error({ err }, "Failed to get leaderboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
