---
name: Al Bayaan codebase audit + fixes (June 2026)
description: Full audit findings and what was fixed vs what remains outstanding
---

## Audit Summary

### FULLY FUNCTIONAL (no changes needed)
- Voice Teacher: browser STT + Whisper chain (Groq→tarteel→openai/whisper-large-v3) + Pollinations/Groq LLM + Web Speech TTS
- Video Teacher: same AI chain + animated SVG avatar + browser TTS
- Recitation scoring: real audio → Whisper → LCS word diff → tajweed text analysis → DB
- Tajweed Analysis Engine: rule-based text analysis (10 rules + Makharij + Waqf) — REAL, not fake
- Content Generator: real LLM via provider chain
- Exams CRUD + auto-grade + auto-cert
- In-app Notifications (DB-backed)
- Teacher Dashboard, Admin Stats, Leaderboard, Dashboard, Progress, Bookmarks, Hifdh
- Messages (direct messaging)

### FIXES IMPLEMENTED THIS SESSION
1. **DB exports**: Added `payment_records` and `live_classroom_sessions` to `lib/db/src/schema/index.ts` — they existed as files but were never exported or pushed to DB. Fixed + `pnpm --filter @workspace/db run push` ran successfully.

2. **Payment persistence** (`artifacts/api-server/src/routes/payments.ts`): Now saves every payment initiation to `payment_records` table. `GET /api/payments/history` now returns real DB rows.

3. **Live Classroom persistence** (`artifacts/api-server/src/routes/live-classroom.ts`): Fully migrated from in-memory array to `live_classroom_sessions` DB table. Sessions survive server restarts. Added PATCH status update + DELETE endpoints.

4. **Certificate PDF + QR Code** (`artifacts/al-bayaan/src/pages/certificates.tsx`): Replaced `.txt` download with real jsPDF landscape PDF with Islamic design, QR code embedded (via `qrcode` library). Added separate "Download QR Code" button. Both libraries installed: `jspdf`, `qrcode`.

5. **Parent auto-notifications** (`artifacts/api-server/src/routes/recordings.ts`): After each recording with overallScore > 0, asynchronously queries `parent_profiles` for parents who have the student as a child and inserts a notification for each. Non-blocking (setImmediate).

### STILL OUTSTANDING (not fixed — require external services or significant infra)
- **Web/Push Notifications**: No service worker + VAPID keys. Only in-app notifications. Would need `web-push` npm package + VAPID key generation.
- **Email Notifications**: No SMTP/SendGrid configured. No env vars for it.
- **Stripe/PayPal**: Returns "coming soon" unless `STRIPE_SECRET_KEY`/`PAYPAL_CLIENT_ID` env vars are set. Code is ready to wire up.
- **Audit log persistence**: In-memory ring buffer (10k entries), lost on restart. Would need a DB table.
- **Marketing leads**: In-memory array, lost on restart. Minor.

### Math.random() uses that are LEGITIMATE (not fake data)
- `surah.tsx:31` — genBars() for waveform visualization (UI animation)
- `video-teacher.tsx:44,50,490` — blink timer, mouth animation, sound bar heights (UI animation)
- `aiProvider.ts:197` — Pollinations image seed (legitimate randomness)
- `exams.ts:13` — exam verification code generation (legitimate)
- `audit.ts:29` — audit entry ID suffix (legitimate)
- `exam-builder.tsx:186` — local question UID (client-side only, not persisted)
