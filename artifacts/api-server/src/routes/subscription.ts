import { Router } from "express";
import { db, profilesTable, paymentRecordsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

// Plan permission definitions
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

// Features that require at minimum an active trial or subscription
export const PREMIUM_FEATURES = [
  "learn", "teacher", "ai-assistant", "tajweed-teacher", "voice-teacher",
  "video-teacher", "hifdh", "muraajacah", "mushaf", "certificates", "exams",
  "library", "analytics", "study-planner", "content-generator", "live-classroom",
];

function computeSubscriptionStatus(profile: any) {
  const now = new Date();

  // Determine trial status
  let trialActive = false;
  let trialExpired = false;
  let trialDaysLeft = 0;
  let trialHoursLeft = 0;
  let trialMinutesLeft = 0;
  let trialSecondsLeft = 0;

  if (profile.trialEndDate) {
    const end = new Date(profile.trialEndDate);
    const msLeft = end.getTime() - now.getTime();
    if (msLeft > 0) {
      trialActive = true;
      trialDaysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
      trialHoursLeft = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      trialMinutesLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
      trialSecondsLeft = Math.floor((msLeft % (1000 * 60)) / 1000);
    } else {
      trialExpired = true;
    }
  } else {
    // No trial set — treat as expired (shouldn't happen after migration)
    trialExpired = true;
  }

  // Determine subscription status
  const hasActiveSubscription =
    profile.subscriptionStatus === "active" &&
    profile.subscriptionPlan &&
    (!profile.subscriptionEndDate || new Date(profile.subscriptionEndDate) > now);

  // Determine overall access
  const hasAccess = trialActive || hasActiveSubscription;

  // Determine effective plan & permissions
  let effectivePlan: string | null = null;
  let permissions: string[] = [];

  if (hasActiveSubscription && profile.subscriptionPlan) {
    effectivePlan = profile.subscriptionPlan;
    permissions = PLAN_PERMISSIONS[effectivePlan]?.features ?? [];
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
    // Trial info
    trialStatus: trialActive ? "active" : trialExpired ? "expired" : "none",
    trialStartDate: profile.trialStartDate ?? null,
    trialEndDate: profile.trialEndDate ?? null,
    trialDaysLeft,
    trialHoursLeft,
    trialMinutesLeft,
    trialSecondsLeft,
    trialActive,

    // Subscription info
    subscriptionPlan: profile.subscriptionPlan ?? null,
    subscriptionStatus: profile.subscriptionStatus ?? null,
    subscriptionStartDate: profile.subscriptionStartDate ?? null,
    subscriptionEndDate: profile.subscriptionEndDate ?? null,
    subscriptionBilling: profile.subscriptionBilling ?? null,
    hasActiveSubscription,

    // Overall access
    hasAccess,
    effectivePlan,
    permissions,
    planLabel: effectivePlan ? (PLAN_PERMISSIONS[effectivePlan]?.label ?? effectivePlan) : null,

    // Display name
    displayName: profile.displayName,
  };
}

function buildTrialDates() {
  const now = new Date();
  const end = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  return { trialStartDate: now, trialEndDate: end };
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
      // Auto-create profile with trial so new users are never blocked
      const trial = buildTrialDates();
      const inserted = await db
        .insert(profilesTable)
        .values({ clerkId: req.userId, displayName: "Student", ...trial })
        .returning();
      rows = inserted;
    } else if (!rows[0].trialStartDate) {
      // Backfill: existing profile has no trial — grant 2 days starting now
      const trial = buildTrialDates();
      const updated = await db
        .update(profilesTable)
        .set(trial)
        .where(eq(profilesTable.clerkId, req.userId))
        .returning();
      rows = updated;
    }

    const status = computeSubscriptionStatus(rows[0]);
    res.json(status);
  } catch (err) {
    logger.error({ err }, "Failed to get subscription status");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/subscription/check/:feature — backend access guard
router.get("/subscription/check/:feature", requireAuth, async (req: any, res) => {
  try {
    const { feature } = req.params;
    const rows = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.clerkId, req.userId))
      .limit(1);

    if (!rows[0]) {
      res.status(403).json({ allowed: false, reason: "Profile not found" });
      return;
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

export { computeSubscriptionStatus };
export default router;
