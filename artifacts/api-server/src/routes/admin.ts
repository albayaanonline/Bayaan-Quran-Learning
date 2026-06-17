import { Router } from "express";
import { db, profilesTable, recordingsTable, conversationsTable } from "@workspace/db";
import { desc, count } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const ADMIN_IDS = (process.env.ADMIN_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);

function requireAdmin(req: any, res: any, next: any) {
  if (ADMIN_IDS.length > 0 && !ADMIN_IDS.includes(req.userId)) {
    res.status(403).json({ error: "Forbidden: admin access required" });
    return;
  }
  next();
}

router.get("/admin/stats", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [profiles, allRecordings, totalConvs] = await Promise.all([
      db.select().from(profilesTable).orderBy(desc(profilesTable.createdAt)),
      db.select().from(recordingsTable),
      db.select({ count: count() }).from(conversationsTable),
    ]);

    const todayRecs = allRecordings.filter(r => new Date(r.createdAt).toISOString().split("T")[0] === today);
    const activeToday = new Set(todayRecs.map(r => r.userId)).size;
    const totalXp = profiles.reduce((sum, p) => sum + p.xp, 0);
    const avgXp = profiles.length > 0 ? Math.round(totalXp / profiles.length) : 0;
    const avgScore = (() => {
      const scores = allRecordings.map(r => ((r.feedback as any)?.overallScore ?? 0) as number).filter(s => s > 0);
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    })();

    const levelDist: Record<string, number> = {};
    for (const p of profiles) {
      const l = p.level || "beginner";
      levelDist[l] = (levelDist[l] ?? 0) + 1;
    }

    res.json({
      totalUsers: profiles.length,
      activeToday,
      totalRecordings: allRecordings.length,
      totalConversations: totalConvs[0]?.count ?? 0,
      avgXp,
      avgScore,
      levelDistribution: levelDist,
      newUsersToday: profiles.filter(p => new Date(p.createdAt).toISOString().split("T")[0] === today).length,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get admin stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/users", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
    const limit = Math.min(50, parseInt(String(req.query.limit ?? "20")));
    const offset = (page - 1) * limit;

    const [profiles, allRecordings] = await Promise.all([
      db.select().from(profilesTable).orderBy(desc(profilesTable.xp)).limit(limit).offset(offset),
      db.select().from(recordingsTable),
    ]);

    const recsByUser = new Map<string, number>();
    for (const r of allRecordings) {
      recsByUser.set(r.userId, (recsByUser.get(r.userId) ?? 0) + 1);
    }

    res.json({
      users: profiles.map(p => ({
        id: p.id,
        clerkId: p.clerkId,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        level: p.level,
        xp: p.xp,
        streakDays: p.streakDays,
        totalRecordings: recsByUser.get(p.clerkId) ?? 0,
        onboardingComplete: p.onboardingComplete,
        createdAt: p.createdAt,
        lastStudyDate: p.lastStudyDate,
      })),
      page,
      limit,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get admin users");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
