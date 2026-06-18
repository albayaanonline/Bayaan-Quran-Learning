import { Router } from "express";
import { db, parentProfilesTable, profilesTable, recordingsTable, surahProgressTable, hifdhProgressTable, achievementsTable } from "@workspace/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/parent/profile", requireAuth, async (req: any, res) => {
  try {
    const [profile] = await db.select().from(parentProfilesTable)
      .where(eq(parentProfilesTable.parentClerkId, req.userId))
      .limit(1);
    res.json(profile ?? null);
  } catch (err) {
    logger.error({ err }, "Failed to get parent profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/parent/profile", requireAuth, async (req: any, res) => {
  try {
    const { displayName, email, phone, childClerkIds, notificationPrefs } = req.body;
    const existing = await db.select().from(parentProfilesTable)
      .where(eq(parentProfilesTable.parentClerkId, req.userId)).limit(1);

    if (existing.length > 0) {
      const [updated] = await db.update(parentProfilesTable)
        .set({ displayName, email, phone, childClerkIds: childClerkIds ?? [], notificationPrefs, updatedAt: new Date() })
        .where(eq(parentProfilesTable.parentClerkId, req.userId))
        .returning();
      res.json(updated);
    } else {
      const [created] = await db.insert(parentProfilesTable).values({
        parentClerkId: req.userId, displayName, email, phone,
        childClerkIds: childClerkIds ?? [], notificationPrefs,
      }).returning();
      res.status(201).json(created);
    }
  } catch (err) {
    logger.error({ err }, "Failed to update parent profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/parent/children", requireAuth, async (req: any, res) => {
  try {
    const [parentProfile] = await db.select().from(parentProfilesTable)
      .where(eq(parentProfilesTable.parentClerkId, req.userId)).limit(1);

    if (!parentProfile || !parentProfile.childClerkIds?.length) {
      res.json([]);
      return;
    }

    const childIds = parentProfile.childClerkIds;
    const children = await db.select().from(profilesTable)
      .where(inArray(profilesTable.clerkId, childIds));

    const childrenWithStats = await Promise.all(children.map(async (child) => {
      const [recentRecs, hifdhRows, progressRows] = await Promise.all([
        db.select().from(recordingsTable)
          .where(eq(recordingsTable.userId, child.clerkId))
          .orderBy(desc(recordingsTable.createdAt)).limit(5),
        db.select().from(hifdhProgressTable)
          .where(eq(hifdhProgressTable.userId, child.clerkId)),
        db.select().from(surahProgressTable)
          .where(eq(surahProgressTable.userId, child.clerkId)),
      ]);

      const avgScore = recentRecs.length > 0
        ? Math.round(recentRecs.map(r => ((r.feedback as any)?.overallScore ?? 0)).reduce((a, b) => a + b, 0) / recentRecs.length)
        : 0;

      return {
        ...child,
        stats: {
          avgScore,
          totalRecordings: recentRecs.length,
          hifdhSurahs: hifdhRows.length,
          surahsStudied: progressRows.length,
          streakDays: child.streakDays,
          xp: child.xp,
          level: Math.floor((child.xp ?? 0) / 500) + 1,
          lastStudied: recentRecs[0]?.createdAt ?? null,
        },
      };
    }));

    res.json(childrenWithStats);
  } catch (err) {
    logger.error({ err }, "Failed to get children");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/parent/children/:childId/progress", requireAuth, async (req: any, res) => {
  try {
    const { childId } = req.params;

    const [parentProfile] = await db.select().from(parentProfilesTable)
      .where(eq(parentProfilesTable.parentClerkId, req.userId)).limit(1);

    if (!parentProfile || !parentProfile.childClerkIds?.includes(childId)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const [recordings, hifdh, progress, profile] = await Promise.all([
      db.select().from(recordingsTable)
        .where(eq(recordingsTable.userId, childId))
        .orderBy(desc(recordingsTable.createdAt)).limit(20),
      db.select().from(hifdhProgressTable)
        .where(eq(hifdhProgressTable.userId, childId)),
      db.select().from(surahProgressTable)
        .where(eq(surahProgressTable.userId, childId)),
      db.select().from(profilesTable)
        .where(eq(profilesTable.clerkId, childId)).limit(1),
    ]);

    const tajweedErrors: Record<string, number> = {};
    let totalScore = 0, scoredCount = 0;

    for (const rec of recordings) {
      const fb = rec.feedback as any;
      if (!fb) continue;
      if (fb.overallScore > 0) { totalScore += fb.overallScore; scoredCount++; }
      for (const rule of (fb.tajweedRules ?? [])) {
        if (!rule.found) tajweedErrors[rule.name] = (tajweedErrors[rule.name] ?? 0) + 1;
      }
    }

    const weakAreas = Object.entries(tajweedErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([rule, count]) => ({ rule, count, percentage: Math.round((count / recordings.length) * 100) }));

    res.json({
      profile: profile[0] ?? null,
      recordings: recordings.slice(0, 10),
      hifdh,
      surahProgress: progress,
      summary: {
        avgScore: scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0,
        totalRecordings: recordings.length,
        hifdhSurahs: hifdh.length,
        weakAreas,
        streakDays: profile[0]?.streakDays ?? 0,
        xp: profile[0]?.xp ?? 0,
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to get child progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
