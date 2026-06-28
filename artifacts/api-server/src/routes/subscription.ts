import { Router } from "express";
import { db, profilesTable, paymentRecordsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

export const PLAN_PERMISSIONS: Record<string, { features: string[]; aiCallsPerDay: number; label: string; description: string }> = {
  trial: {
    label: "Free Trial",
    description: "2-day free access to all features",
    features: ["all"],
    aiCallsPerDay: 10,
  },
  starter: {
    label: "Starter",
    description: "Basic courses & limited AI",
    features: [
      "dashboard", "learn", "hifdh", "progress", "bookmarks",
      "achievements", "leaderboard", "library", "study-planner",
      "teacher", "analytics", "payments", "messages", "parent",
    ],
    aiCallsPerDay: 20,
  },
  standard: {
    label: "Standard",
    description: "More courses, AI & certificates",
    features: [
      "dashboard", "learn", "hifdh", "muraajacah", "mushaf", "progress",
      "bookmarks", "achievements", "leaderboard", "library", "study-planner",
      "teacher", "tajweed-teacher", "voice-teacher", "certificates", "exams",
      "analytics", "payments", "messages", "parent", "ai-assistant",
    ],
    aiCallsPerDay: 100,
  },
  premium: {
    label: "Premium",
    description: "Full platform access",
    features: ["all"],
    aiCallsPerDay: -1,
  },
};

export const PREMIUM_FEATURES = [
  "learn", "teacher", "ai-assistant", "tajweed-teacher", "voice-teacher",
  "video-teacher", "hifdh", "muraajacah", "mushaf", "certificates", "exams",
  "library", "analytics", "study-planner", "content-generator", "live-classroom",
];

/**
 * Build trial dates for a new/backfilled profile.
 * Uses referenceTime (e.g. profile.createdAt) as the trial start so the
 * 48-hour window is always anchored to when the account was actually created,
 * not when this function happens to be called.
 */
function buildTrialDates(referenceTime?: Date | null) {
  const start = referenceTime instanceof Date && !isNaN(referenceTime.getTime())
    ? referenceTime
    : new Date();
  const end = new Date(start.getTime() + 48 * 60 * 60 * 1000);
  return { trialStartDate: start, trialEndDate: end };
}

function computeSubscriptionStatus(profile: any) {
  const now = new Date();

  // ── Resolve trial window ────────────────────────────────────────────────
  // Priority:
  //   1. Explicit trialStartDate / trialEndDate stored on the profile.
  //   2. Fallback: compute from profile.createdAt so a user is never
  //      accidentally blocked because trial columns were null.
  const trialStart: Date = profile.trialStartDate
    ? new Date(profile.trialStartDate)
    : profile.createdAt
      ? new Date(profile.createdAt)
      : now;

  const trialEnd: Date = profile.trialEndDate
    ? new Date(profile.trialEndDate)
    : new Date(trialStart.getTime() + 48 * 60 * 60 * 1000);

  const msLeft = trialEnd.getTime() - now.getTime();
  const trialActive = msLeft > 0;
  const trialExpired = !trialActive;

  let trialDaysLeft = 0;
  let trialHoursLeft = 0;
  let trialMinutesLeft = 0;
  let trialSecondsLeft = 0;

  if (trialActive) {
    trialDaysLeft    = Math.floor(msLeft / (1000 * 60 * 60 * 24));
    trialHoursLeft   = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    trialMinutesLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
    trialSecondsLeft = Math.floor((msLeft % (1000 * 60)) / 1000);
  }

  // ── Subscription status ─────────────────────────────────────────────────
  const hasActiveSubscription =
    profile.subscriptionStatus === "active" &&
    profile.subscriptionPlan &&
    (!profile.subscriptionEndDate || new Date(profile.subscriptionEndDate) > now);

  // ── Overall access ──────────────────────────────────────────────────────
  const hasAccess = trialActive || hasActiveSubscription;

  let effectivePlan: string | null = null;
  let permissions: string[] = [];

  if (hasActiveSubscription && profile.subscriptionPlan) {
    effectivePlan = profile.subscriptionPlan;
    permissions = PLAN_PERMISSIONS[effectivePlan as string]?.features ?? [];
  } else if (trialActive) {
    effectivePlan = "trial";
    permissions = PLAN_PERMISSIONS.trial.features;
  }

  const hasFeature = (feature: string) => {
    if (!hasAccess) return false;
    if (permissions.includes("all")) return true;
    return permissions.includes(feature);
  };

  return {
    trialStatus: trialActive ? "active" : trialExpired ? "expired" : "none",
    trialStartDate: trialStart,
    trialEndDate: trialEnd,
    trialDaysLeft,
    trialHoursLeft,
    trialMinutesLeft,
    trialSecondsLeft,
    trialActive,
    subscriptionPlan: profile.subscriptionPlan ?? null,
    subscriptionStatus: profile.subscriptionStatus ?? null,
    subscriptionStartDate: profile.subscriptionStartDate ?? null,
    subscriptionEndDate: profile.subscriptionEndDate ?? null,
    subscriptionBilling: profile.subscriptionBilling ?? null,
    hasActiveSubscription,
    hasAccess,
    effectivePlan,
    permissions,
    planLabel: effectivePlan ? (PLAN_PERMISSIONS[effectivePlan]?.label ?? effectivePlan) : null,
    displayName: profile.displayName,
  };
}

/**
 * Ensure a profile has explicit trial dates persisted.
 * Always anchors the trial to the profile's createdAt timestamp so the
 * 48-hour window is deterministic regardless of when this runs.
 */
async function ensureTrialDates(profile: any): Promise<any> {
  if (profile.trialStartDate && profile.trialEndDate) return profile;

  const trial = buildTrialDates(profile.createdAt ? new Date(profile.createdAt) : null);
  const updated = await db
    .update(profilesTable)
    .set(trial)
    .where(eq(profilesTable.clerkId, profile.clerkId))
    .returning();
  return updated[0] ?? profile;
}

// GET /api/subscription/status
router.get("/subscription/status", requireAuth, async (req: any, res) => {
  try {
    let rows = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.clerkId, req.userId))
      .limit(1);

    if (!rows[0]) {
      // Brand-new user — create profile with trial starting now
      const trial = buildTrialDates();
      const inserted = await db
        .insert(profilesTable)
        .values({ clerkId: req.userId, displayName: "Student", ...trial })
        .returning();
      rows = inserted;
    } else {
      // Ensure trial dates are persisted (backfills null dates using createdAt)
      rows[0] = await ensureTrialDates(rows[0]);
    }

    const status = computeSubscriptionStatus(rows[0]);
    res.json(status);
  } catch (err) {
    logger.error({ err }, "Failed to get subscription status");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/subscription/check/:feature
router.get("/subscription/check/:feature", requireAuth, async (req: any, res) => {
  try {
    const { feature } = req.params;
    let rows = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.clerkId, req.userId))
      .limit(1);

    if (!rows[0]) {
      const trial = buildTrialDates();
      const inserted = await db
        .insert(profilesTable)
        .values({ clerkId: req.userId, displayName: "Student", ...trial })
        .returning();
      rows = inserted;
    } else {
      rows[0] = await ensureTrialDates(rows[0]);
    }

    const status = computeSubscriptionStatus(rows[0]);

    if (!status.hasAccess) {
      res.json({ allowed: false, reason: "subscription_required", status });
      return;
    }

    const allowed =
      status.permissions.includes("all") ||
      status.permissions.includes(feature) ||
      !PREMIUM_FEATURES.includes(feature);

    res.json({ allowed, reason: allowed ? "ok" : "plan_upgrade_required", status });
  } catch (err) {
    logger.error({ err }, "Failed to check feature access");
    res.status(500).json({ error: "Internal server error" });
  }
});

export { computeSubscriptionStatus, buildTrialDates };
export default router;
