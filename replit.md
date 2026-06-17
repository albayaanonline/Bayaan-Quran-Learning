# Al Bayaan AI Quran

A premium AI-powered Islamic Quran Learning Platform — Duolingo meets Tarteel AI. Students learn Quran recitation with audio, voice recording, AI scoring (simulated), streaks, XP, achievements, and a community leaderboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/al-bayaan run dev` — run the frontend (port 24923, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Auth env: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — provisioned automatically by Replit Auth

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7 + Tailwind CSS v4 + shadcn/ui + Framer Motion + wouter
- API: Express 5 + `@clerk/express@2.1.27`
- Auth: Clerk (Replit-managed, `@clerk/react@6.x` + `@clerk/shared@4.x`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth for the API contract
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas
- `lib/db/src/schema/` — Drizzle table definitions
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/al-bayaan/src/` — React frontend
- `artifacts/al-bayaan/src/pages/` — all page components
- `artifacts/al-bayaan/src/components/layout/` — AppLayout (sidebar + mobile nav)

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas; server validates with Zod schemas
- Clerk auth proxy at `/api/__clerk` mounted before body parsers; frontend uses `@clerk/react/internal` `publishableKeyFromHost` for multi-domain support
- All 114 Quran surahs served statically from the API; ayah text proxied from `api.alquran.cloud`; audio served from EveryAyah CDN
- AI scoring is client-side simulation (random 70–100 score breakdown) — no external AI API required
- XP/streak/achievements stored in PostgreSQL; achievement unlocks evaluated on-demand at query time

## Product

- Landing page (public) → Sign Up/Sign In (Clerk) → Onboarding wizard (7 steps) → Dashboard
- Dashboard: daily goal ring, streak counter, XP bar, weekly bar chart, recent recordings, achievements
- Learn: browse all 114 surahs → ayah-by-ayah flow with Arabic text, audio player (5 qaris), hold-to-record mic, AI feedback card
- Progress page: accuracy/tajweed charts (Recharts)
- Bookmarks, Achievements, Leaderboard pages

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `@clerk/react@6.x` is required (not `5.x`) — v5 dist was built against `@clerk/shared@3.x` internals but had wrong peer dep declared; v6 properly requires `@clerk/shared@^4.18.0`
- `pnpm-workspace.yaml` has `"@clerk/shared": "^4.18.0"` in overrides to force consistent resolution
- Do NOT use `console.log` in server code — use `req.log` in route handlers and the `logger` singleton elsewhere
- DB push: `pnpm --filter @workspace/db run push` (dev only; run after any schema change)
- Codegen: run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change, then `pnpm run typecheck:libs`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Replit-managed Clerk configuration and auth pane
