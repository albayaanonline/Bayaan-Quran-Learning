---
name: Al Bayaan trial + subscription system
description: 2-day free trial, plan-based access control, subscription activation on payment approval; known bugs and fixes
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
- `artifacts/api-server/src/routes/dashboard.ts` — ALSO has getOrCreateProfile, must call buildTrialDates (fixed June 2026)
- `artifacts/al-bayaan/src/hooks/useSubscription.ts` — React hook fetching /api/subscription/status
- `artifacts/al-bayaan/src/components/TrialCountdown.tsx` — real-time countdown timer (compact + full)
- `artifacts/al-bayaan/src/components/SubscriptionGate.tsx` — premium content gate with plan cards
- `artifacts/al-bayaan/src/App.tsx` — PremiumRoute HOC wraps premium routes; SetupApiAuth registers Bearer token

## Plan permissions (PLAN_PERMISSIONS in subscription.ts)
- trial: features: ["all"], aiCallsPerDay: 10
- starter: limited set of features, aiCallsPerDay: 20
- standard: more features + certificates, aiCallsPerDay: 100
- premium: features: ["all"], aiCallsPerDay: -1 (unlimited)

**Why:** The trial gives full access for 2 days to let users experience the platform. After expiry, PremiumRoute shows SubscriptionGate with plan options and a link to /payments.

**How to apply:** When adding new premium routes, use `<PremiumRoute component={X} feature="feature-name" />` in App.tsx. Add the feature name to PLAN_PERMISSIONS arrays in subscription.ts.

---

# CRITICAL BUG FIXED (June 2026): Trial not working for new users

## Root Cause
`dashboard.ts` had its own `getOrCreateProfile()` that inserted profiles WITHOUT trial dates:
```js
{ clerkId: userId, displayName: "Student" }  // ← no trialStartDate/trialEndDate!
```
New users hit `/api/dashboard` first → profile created without trial → `computeSubscriptionStatus`
sees `trialEndDate = null` → `trialExpired = true` → `hasAccess = false` → payment wall immediately.

## Fix
`dashboard.ts`'s `getOrCreateProfile` now calls `buildTrialDates()` on insert AND backfills
existing profiles where `trialStartDate = null`.

## Rule
Every route file that calls `getOrCreateProfile` (or inserts into `profiles`) MUST call
`buildTrialDates()`. Check any new routes that create profiles.

---

# CRITICAL BUG FIXED (June 2026): Cross-origin auth (Dashboard "Failed to load")

## Root Cause
Frontend (Vercel `albayaanquraan.xyz`) → API (Replit `...riker.replit.dev`) is cross-origin.
Clerk session cookies are domain-specific. `customFetch` (generated API client) doesn't send
cookies cross-origin. Result: 401 on all API calls from Vercel → dashboard error.

## Fix
1. `SetupApiAuth` component in `App.tsx` (inside ClerkProvider/QueryClientProvider) calls:
   `setAuthTokenGetter(() => getToken())` from `@workspace/api-client-react`
   → All `customFetch`-based hooks (useGetDashboard, etc.) auto-include Bearer token.
2. `useSubscription.ts` direct `fetch` call: manually calls `getToken()` and sets
   `Authorization: Bearer <token>` header.

## Remaining gap
Other pages using bare `fetch(..., { credentials: "include" })` (admin, analytics, book-course,
etc.) still need individual Bearer-token fixes. Long-term: create a shared `authFetch` utility.
