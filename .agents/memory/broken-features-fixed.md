---
name: Broken Features Fixed
description: Summary of previously broken/placeholder features that were made functional, and remaining known limitations.
---

## Fixed (this session)

### Live Classroom — was in-memory, now DB-backed
- New table: `live_classroom_sessions` in `lib/db/src/schema/live_classroom_sessions.ts`
- Sessions now survive server restarts. Route: `artifacts/api-server/src/routes/live-classroom.ts`

### Payments — history was always `[]`, now DB-backed
- New table: `payment_records` in `lib/db/src/schema/payment_records.ts`
- Payment records saved on every initiation (Zaad/EVC/eDahab/Stripe/PayPal)
- History endpoint returns real DB rows
- Frontend (`artifacts/al-bayaan/src/pages/payments.tsx`) now shows a Payment History section

### Certificates — text-file download → real PDF + QR code
- Added `pdfkit` + `qrcode` packages to `artifacts/api-server`
- New endpoint: `GET /api/certificates/:id/pdf` — returns A4 landscape PDF with QR code
- Frontend Download button now calls the PDF endpoint; shows spinner during generation

### TypeScript errors (all resolved — typecheck passes 4/4)
- `whisperTranscribe.ts`: `new Blob([audioBuffer])` → `new Blob([new Uint8Array(audioBuffer)])`
- `analytics-reports.ts`: `s.completionPercentage` → `s.completedAyahs > 0`
- `leaderboard.tsx`: removed invalid `query` property from `useGetLeaderboard()`
- `voice-teacher.tsx` / `video-teacher.tsx`: `SpeechRecognition` → `any` for SR_CLASS and recognitionRef

## Known remaining limitations (by design / acceptable)
- Tajweed scoring is text/pattern-based, not audio phonetic ML (requires heavy ML infra)
- Stripe/PayPal payments show "coming soon" — no keys configured
- Email/push notifications not implemented (in-app DB notifications work)
- Live Classroom links out to Jitsi/Meet/Zoom (not embedded)
- Video Teacher lip sync is CSS animation only

## How to push new DB schema tables
`pnpm --filter @workspace/db run push` — runs from workspace root. If drizzle-kit not found, use `cd lib/db && node_modules/.bin/drizzle-kit push --config ./drizzle.config.ts`

**Why:** The `push` script works when node_modules are installed in lib/db. After pnpm install failures use the direct path.
