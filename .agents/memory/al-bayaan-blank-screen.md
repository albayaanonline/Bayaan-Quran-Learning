---
name: Al Bayaan blank screen root cause
description: Why Al Bayaan shows a blank page / all API routes return 500 — and how to fix it permanently
---

# Root Cause: Missing Clerk Authentication Keys (Replit Dev)

## The Rule
When `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are not set as Replit secrets, the `clerkMiddleware` in `app.ts` throws on EVERY incoming request. All routes return 500. Frontend shows a blank white page.

**How to Fix**: Run `setupClerkWhitelabelAuth()` in code_execution. This provisions a Replit-managed Clerk tenant and sets all three keys automatically: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`.

---

# publishableKeyFromHost — Correct vs Wrong Usage

## The Rule
**For Replit-managed Clerk**, `publishableKeyFromHost` from `@clerk/react/internal` IS the canonical pattern and MUST be used. The skill mandates it verbatim. Do NOT replace it with the raw env var.

How the function behaves:
- Test key (`pk_test_...`) → returns the test key as-is (dev shortcut)
- Live key (`pk_live_...`) → constructs a key from `clerk.${hostname}` (Replit-managed multi-domain feature — this IS the correct live key for Replit-managed tenants)

**The "blank screen" caused by publishableKeyFromHost** only happens when `VITE_CLERK_PUBLISHABLE_KEY` is NOT set at all in the build environment. In that case, publishableKeyFromHost constructs a key from the hostname which points to a non-existent Clerk instance → Clerk hangs asynchronously → blank screen.

**The real fix**: Always set `VITE_CLERK_PUBLISHABLE_KEY` in every deployment environment (Replit secrets AND Vercel env vars).

---

# Root Cause: Vercel Production White Screen

## Bug 1 — VITE_CLERK_PUBLISHABLE_KEY missing from Vercel
`setupClerkWhitelabelAuth()` sets Replit secrets, but Vercel env vars must be set manually.

**Fix**: In Vercel → Project → Settings → Environment Variables, add:
- `VITE_CLERK_PUBLISHABLE_KEY` = test key from this Replit environment (run `echo $VITE_CLERK_PUBLISHABLE_KEY` in bash to get it)
- Set for: Production, Preview, Development

With the test key set, `publishableKeyFromHost` returns it as-is and Clerk initializes correctly.

## Bug 2 — Root vercel.json missing SPA rewrites (fixed June 2026)
Root `vercel.json` must have:
```json
"rewrites": [
  { "source": "/api/:path*", "destination": "https://...riker.replit.dev/api/:path*" },
  { "source": "/((?!api/).*)", "destination": "/index.html" }
]
```

## proxyUrl canonical pattern
`const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL` — unconditional, no hostname gating.
The env var is empty in dev (intentional) and auto-set in Replit prod. Never set `VITE_CLERK_PROXY_URL` in Vercel.

---

# Diagnosis Commands
```bash
# Check Clerk keys are set
echo $VITE_CLERK_PUBLISHABLE_KEY
echo $CLERK_PUBLISHABLE_KEY

# Re-provision if missing
# In code_execution: await setupClerkWhitelabelAuth()
```
