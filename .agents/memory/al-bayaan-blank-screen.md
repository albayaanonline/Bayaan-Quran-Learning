---
name: Al Bayaan blank screen root cause
description: Why Al Bayaan shows a blank page / all API routes return 500 — and how to fix it permanently
---

# Root Cause: Missing Clerk Authentication Keys (Replit Dev)

## The Rule
When `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are not set as Replit secrets, the `clerkMiddleware` in `app.ts` throws on EVERY incoming request. All routes return 500. Frontend shows a blank white page.

**Why:** The `clerkMiddleware` call uses `publishableKeyFromHost(host, process.env.CLERK_PUBLISHABLE_KEY)`. If the key is `undefined`, Clerk middleware crashes before any route handler runs.

## How to Apply (Fix)
Run this once in `code_execution`:
```javascript
const result = await setupClerkWhitelabelAuth();
console.log(result);
```
Then restart both workflows.

---

# Root Cause: Vercel Production White Screen (June 2026)

## Bug 1 — publishableKeyFromHost destroys live production keys

`publishableKeyFromHost(hostname, fallbackKey)` in `@clerk/shared/keys` has this behavior:
- If `fallbackKey` is a **test key** (`pk_test_...`) → returns it as-is ✓
- If `fallbackKey` is a **live key** (`pk_live_...`) → **IGNORES IT** and constructs a fake key `buildPublishableKey('clerk.' + hostname)`

The constructed key (e.g. `clerk.albayaanquraan.xyz`) is invalid. Clerk fails to initialize **asynchronously** — meaning React error boundaries don't catch it. The app is stuck forever in `<ClerkLoading>`, which shows a dark/blank screen with a spinner that never stops.

**Fix:** Remove `publishableKeyFromHost` entirely. Use `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` directly in App.tsx. The key is already set correctly in the env var; no hostname mapping is needed.

**NEVER use `publishableKeyFromHost` in the frontend for single-domain apps. It is meant for Clerk satellite/multi-domain setups only.**

## Bug 2 — Root vercel.json missing SPA rewrites

The root `vercel.json` (the one Vercel actually reads) had no `rewrites`. Any sub-route (`/sign-in`, `/dashboard`, `/learn`, etc.) returned Vercel's 404 page instead of `index.html`.

**Fix:** Add to root `vercel.json`:
```json
"rewrites": [
  { "source": "/api/:path*", "destination": "https://...replit.dev/api/:path*" },
  { "source": "/((?!api/).*)", "destination": "/index.html" }
]
```

## Diagnosis Commands
```bash
# Check running server env for Clerk keys
cat /proc/$(pgrep -f "dist/index.mjs" | head -1)/environ | tr '\0' '\n' | grep CLERK

# Health check
curl http://localhost:8080/api/healthz
```

## Required Vercel Environment Variables
- `VITE_CLERK_PUBLISHABLE_KEY` = your Clerk publishable key (`pk_live_...`)
- Clerk dashboard must have the production domain authorized under Configure → Domains
