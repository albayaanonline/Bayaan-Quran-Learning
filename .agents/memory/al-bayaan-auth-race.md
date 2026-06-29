---
name: Al Bayaan auth race condition
description: SetupApiAuth useEffect runs after child page effects — authFetch calls on mount get 401 without token
---

**The rule:** Call `setApiTokenGetter` / `setAuthTokenGetter` synchronously in the render body of `SetupApiAuth`, not only in `useEffect`.

**Why:** React effects run bottom-up (children first, parents last). `SetupApiAuth` is an ancestor of all page components. When a page mounts and calls `authFetch()` in its own `useEffect`, `_getToken` is still null because `SetupApiAuth`'s effect hasn't fired yet → 401 on all auth-gated API calls on first page load.

**How to apply:** In `SetupApiAuth` (App.tsx), use a ref to always read the latest `getToken` and call the setters synchronously during render. Keep the `useEffect` only for the cleanup (setting null on unmount). Never move back to effect-only initialization.

**Also related:** `voice-teacher.tsx` and `video-teacher.tsx` used plain `fetch()` instead of `authFetch()` for voice-teacher/message and video-teacher/message routes — those routes use `requireAuth` which needs a Bearer token. Always use `authFetch()` for any route that has `requireAuth` middleware. The `authFetch` function in `lib/api.ts` reads `_getToken` set by `SetupApiAuth`.

**Muraajacah revise:** Frontend must send `method: "PATCH"` (not POST) and must convert numeric quality (1/3/5) to string ("poor"/"good"/"excellent") to match the backend route handler.
