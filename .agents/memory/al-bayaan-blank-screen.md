---
name: Al Bayaan blank screen root cause
description: Why Al Bayaan shows a blank page / all API routes return 500 — and how to fix it permanently
---

# Root Cause: Missing Clerk Authentication Keys

## The Rule
When `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are not set as Replit secrets, the `clerkMiddleware` in `app.ts` throws on EVERY incoming request (including public routes like `/api/healthz` and `/api/surahs`). All routes return 500. Frontend shows a blank white page.

**Why:** The `clerkMiddleware` call uses `publishableKeyFromHost(host, process.env.CLERK_PUBLISHABLE_KEY)`. If the key is `undefined`, Clerk middleware crashes before any route handler runs.

## How to Apply (Fix)
Run this once in `code_execution`:
```javascript
const result = await setupClerkWhitelabelAuth();
console.log(result);
```
Then restart both workflows. Verify with:
```bash
curl http://localhost:8080/api/healthz
curl http://localhost:8080/api/surahs
```

## Other Fixes Applied (June 2026)
- `main.tsx`: Added `RootErrorBoundary` class component — prevents white screen on any React crash
- `App.tsx`: Removed `throw new Error(...)` for missing Clerk key; replaced with graceful `MissingConfigError` UI component
- `health.ts`: Enhanced to check DB connectivity and AI provider status; added `/api/diagnostics` endpoint
- `tajweedAnalysis.ts`: Removed artificial +10 base bonus from tajweed score formula
- DB: `pnpm --filter @workspace/db run push` — all 22 tables confirmed present

## Diagnosis Commands
```bash
# Check running server env for Clerk keys
cat /proc/$(pgrep -f "dist/index.mjs" | head -1)/environ | tr '\0' '\n' | grep CLERK

# Health check
curl http://localhost:8080/api/healthz

# Full diagnostics
curl http://localhost:8080/api/diagnostics
```
