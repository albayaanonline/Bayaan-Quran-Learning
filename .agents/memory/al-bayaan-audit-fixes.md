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

### FIXES IMPLEMENTED (Phase A session)
1. **DB exports**: Added `payment_records` and `live_classroom_sessions` to `lib/db/src/schema/index.ts`. Fixed + pushed.
2. **Payment persistence**: Now saves every payment initiation to `payment_records` table.
3. **Live Classroom persistence**: Fully migrated from in-memory array to `live_classroom_sessions` DB table.
4. **Certificate PDF + QR Code**: Replaced `.txt` download with real jsPDF landscape PDF + QR code.
5. **Parent auto-notifications**: After each recording with score > 0, auto-notifies linked parents.

### FIXES IMPLEMENTED (June 2026 full audit session)
6. **audit_logs table**: `routes/audit.ts` — was in-memory array. Now PostgreSQL `audit_logs` table. `addAuditEntry()` is now async.
7. **marketing_leads table**: `routes/marketing.ts` — was in-memory array. Now PostgreSQL `marketing_leads` table with UNIQUE constraint.
8. **Quran API 3-source failover**: `routes/surahs.ts` — was returning fake Bismillah on failure. Now 3-source chain (AlQuran.cloud → quranapi.pages.dev → jsDelivr CDN). HTTP 503 on total failure, no fake text.
9. **Stripe real checkout**: `routes/payments.ts` — was "coming soon" stub. Now creates real Stripe Checkout Session. Webhook at POST /payments/stripe-webhook.
10. **Email notifications**: Added `lib/emailNotifications.ts` (nodemailer). Requires SMTP_HOST/PORT/USER/PASS/FROM env vars. Silent skip if not configured.
11. **profiles.email column**: Added optional `email TEXT` column to profiles table. Migrated.
12. **notifications.ts**: Now calls `sendNotificationEmail` for cert/exam/achievement events via setImmediate (non-blocking).

### DB Tables Added June 2026
- `audit_logs`, `marketing_leads` — both exported from schema/index.ts, migrated to prod DB.
- `profiles.email` — optional column, migrated June 18 2026.

### 11 Final Reports Generated
Location: `.local/reports/01-ai-stack-report.md` through `11-full-audit-summary.md`

### Math.random() uses that are LEGITIMATE (not fake data)
- `surah.tsx:31` — genBars() for waveform visualization (UI animation)
- `video-teacher.tsx:44,50,490` — blink timer, mouth animation, sound bar heights (UI animation)
- `aiProvider.ts:197` — Pollinations image seed (legitimate randomness)
- `exams.ts:13` — exam verification code generation (legitimate)
- `audit.ts:29` — old audit entry ID suffix (now removed, uses DB serial)
- `exam-builder.tsx:186` — local question UID (client-side only, not persisted)
