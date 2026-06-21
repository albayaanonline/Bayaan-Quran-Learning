---
name: Al Bayaan trial + subscription system
description: 2-day free trial, plan-based access control, subscription activation on payment approval
---

# Trial + Subscription System

## DB columns added to profiles table
- `trial_start_date` TIMESTAMPTZ — set on first profile creation
- `trial_end_date` TIMESTAMPTZ — trial_start_date + 2 days
- `trial_status` TEXT default 'active' — 'active' | 'expired' | 'converted'
- `subscription_plan` TEXT — null | 'starter' | 'standard' | 'premium'
- `subscription_status` TEXT — null | 'active' | 'cancelled' | 'expired'
- `subscription_start_date` TIMESTAMPTZ
- `subscription_end_date` TIMESTAMPTZ
- `subscription_billing` TEXT — null | 'monthly' | 'annual'

## Key files
- `lib/db/src/schema/profiles.ts` — schema with trial/subscription columns
- `artifacts/api-server/src/routes/subscription.ts` — GET /api/subscription/status, GET /api/subscription/check/:feature
- `artifacts/api-server/src/routes/payments.ts` — activateSubscription() called on admin approve OR auto-approve
- `artifacts/api-server/src/routes/profile.ts` — buildTrialDates() auto-sets trial on getOrCreateProfile
- `artifacts/al-bayaan/src/hooks/useSubscription.ts` — React hook fetching /api/subscription/status
- `artifacts/al-bayaan/src/components/TrialCountdown.tsx` — real-time countdown timer (compact + full)
- `artifacts/al-bayaan/src/components/SubscriptionGate.tsx` — premium content gate with plan cards
- `artifacts/al-bayaan/src/App.tsx` — PremiumRoute HOC wraps premium routes

## Plan permissions (PLAN_PERMISSIONS in subscription.ts)
- trial: features: ["all"], aiCallsPerDay: 10
- starter: limited set of features, aiCallsPerDay: 20
- standard: more features + certificates, aiCallsPerDay: 100
- premium: features: ["all"], aiCallsPerDay: -1 (unlimited)

**Why:** The trial gives full access for 2 days to let users experience the platform. After expiry, PremiumRoute shows SubscriptionGate with plan options and a link to /payments.

**How to apply:** When adding new premium routes, use `<PremiumRoute component={X} feature="feature-name" />` in App.tsx. Add the feature name to PLAN_PERMISSIONS arrays in subscription.ts.
