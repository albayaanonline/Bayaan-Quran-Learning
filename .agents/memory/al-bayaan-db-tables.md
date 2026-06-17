---
name: Al Bayaan DB tables
description: Database schema additions made in Phase 2 for Hifdh tracking and AI Teacher chat
---

## New tables (Phase 2)
- `hifdh_progress` — tracks Quran memorization per surah with spaced repetition (strengthScore, nextRevision, status)
- `conversations` — AI Teacher chat sessions (userId, title)
- `messages` — AI Teacher chat messages (conversationId, role, content)

## Migration
Run `pnpm --filter @workspace/db run push` after any schema changes.

## Schema location
`lib/db/src/schema/` — each table in its own file, exported from `index.ts`

## Spaced repetition logic
Strength 0-20 → review in 1 day; 21-40 → 3 days; 41-60 → 7 days; 61-80 → 14 days; 81-100 → 30 days.
PATCH `/api/hifdh/:id/revise` with `quality: "excellent"|"good"|"poor"` to update strength.

## Key bug fixed
`achievements.ts` syncAchievements had missing `userId` filter on UPDATE — fixed with `and(eq(userId), eq(slug))`.
XP increment fixed from raw SQL injection to `sql\`${profilesTable.xp} + ${xpGain}\`` (Drizzle safe pattern).
