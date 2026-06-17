---
name: Clerk React version compatibility
description: @clerk/react version matrix — which react version works with which shared version, and the pnpm override needed
---

## Rule

Always use `@clerk/react@^6.x` (not `5.x`) alongside `@clerk/shared@^4.18.0`.
Add a workspace-level override in `pnpm-workspace.yaml` to force `@clerk/shared` to `^4.18.0`.

```yaml
overrides:
  "@clerk/shared": "^4.18.0"
```

**Why:** `@clerk/react@5.54.0` was published with `"@clerk/shared": "^3.33.0"` in its declared deps, but its dist was actually built against `@clerk/shared@4.x` APIs (e.g. `loadClerkUIScript` renamed from `loadClerkUiScript`, `SessionContext` moved). This means v5 breaks with both `3.x` and `4.x`. `@clerk/react@6.x` properly declares `"@clerk/shared": "^4.18.0"` and works correctly.

**How to apply:** Any time Clerk React is installed in a pnpm monorepo, pin `@clerk/react` to `^6.x`, pin `@clerk/themes` to `^2.4.x`, and add the `@clerk/shared` override above. `@clerk/express@2.1.27` also uses `@clerk/shared@^4.18.0` so they coexist cleanly.
