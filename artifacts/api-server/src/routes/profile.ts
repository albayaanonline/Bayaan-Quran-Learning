import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db, profilesTable } from "@workspace/db";
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

function buildTrialDates() {
  const now = new Date();
  const end = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days
  return { trialStartDate: now, trialEndDate: end, trialStatus: "active" };
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
  } else if (!rows[0].trialStartDate) {
    // Existing profile without trial — backfill
    const trial = buildTrialDates();
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
  try { goals = typeof p.learningGoals === "string" ? JSON.parse(p.learningGoals) : p.learningGoals; } catch {}
  return {
    id: p.id,
    clerkId: p.clerkId,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl ?? null,
    onboardingComplete: p.onboardingComplete,
    language: p.language,
    learningGoals: goals,
    level: p.level,
    ageGroup: p.ageGroup,
    dailyGoalMinutes: p.dailyGoalMinutes,
    preferredQari: p.preferredQari,
    teacherPreference: p.teacherPreference,
    xp: p.xp,
    streakDays: p.streakDays,
    createdAt: p.createdAt,
    // Trial fields
    trialStartDate: p.trialStartDate ?? null,
    trialEndDate: p.trialEndDate ?? null,
    trialStatus: p.trialStatus ?? "active",
    // Subscription fields
    subscriptionPlan: p.subscriptionPlan ?? null,
    subscriptionStatus: p.subscriptionStatus ?? null,
    subscriptionStartDate: p.subscriptionStartDate ?? null,
    subscriptionEndDate: p.subscriptionEndDate ?? null,
    subscriptionBilling: p.subscriptionBilling ?? null,
  };
}

router.get("/profile", requireAuth, async (req: any, res) => {
  try {
    const profile = await getOrCreateProfile(req.userId);
    res.json(formatProfile(profile));
  } catch (err) {
    logger.error({ err }, "Failed to get profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/profile", requireAuth, async (req: any, res) => {
  try {
    const { displayName, avatarUrl, language, learningGoals, level, ageGroup, dailyGoalMinutes, preferredQari, teacherPreference } = req.body;
    const updates: any = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (language !== undefined) updates.language = language;
    if (learningGoals !== undefined) updates.learningGoals = JSON.stringify(learningGoals);
    if (level !== undefined) updates.level = level;
    if (ageGroup !== undefined) updates.ageGroup = ageGroup;
    if (dailyGoalMinutes !== undefined) updates.dailyGoalMinutes = dailyGoalMinutes;
    if (preferredQari !== undefined) updates.preferredQari = preferredQari;
    if (teacherPreference !== undefined) updates.teacherPreference = teacherPreference;
    const rows = await db.update(profilesTable).set(updates).where(eq(profilesTable.clerkId, req.userId)).returning();
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatProfile(rows[0]));
  } catch (err) {
    logger.error({ err }, "Failed to update profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/profile/onboarding", requireAuth, async (req: any, res) => {
  try {
    const { displayName, learningGoals, level, ageGroup, dailyGoalMinutes, preferredQari, language, teacherPreference } = req.body;
    const existing = await db.select().from(profilesTable).where(eq(profilesTable.clerkId, req.userId)).limit(1);
    let row;
    if (existing.length === 0) {
      const trial = buildTrialDates();
      const inserted = await db.insert(profilesTable).values({
        clerkId: req.userId,
        displayName: displayName ?? "Student",
        learningGoals: JSON.stringify(learningGoals ?? []),
        level: level ?? "beginner",
        ageGroup: ageGroup ?? "adult",
        dailyGoalMinutes: dailyGoalMinutes ?? 15,
        preferredQari: preferredQari ?? "Alafasy_128kbps",
        language: language ?? "en",
        teacherPreference: teacherPreference ?? "any",
        onboardingComplete: true,
        ...trial,
      }).returning();
      row = inserted[0];
    } else {
      // Preserve trial dates if they exist
      const trialUpdates: any = {};
      if (!existing[0].trialStartDate) {
        Object.assign(trialUpdates, buildTrialDates());
      }
      const updated = await db.update(profilesTable).set({
        displayName: displayName ?? existing[0].displayName,
        learningGoals: JSON.stringify(learningGoals ?? []),
        level: level ?? "beginner",
        ageGroup: ageGroup ?? "adult",
        dailyGoalMinutes: dailyGoalMinutes ?? 15,
        preferredQari: preferredQari ?? "Alafasy_128kbps",
        language: language ?? "en",
        teacherPreference: teacherPreference ?? "any",
        onboardingComplete: true,
        ...trialUpdates,
      }).where(eq(profilesTable.clerkId, req.userId)).returning();
      row = updated[0];
    }
    res.json(formatProfile(row));
  } catch (err) {
    logger.error({ err }, "Failed to complete onboarding");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
