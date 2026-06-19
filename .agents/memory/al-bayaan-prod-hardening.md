---
name: Al Bayaan production hardening
description: Key fixes applied in production hardening session — Vite config, DB indexes, Tajweed confidence, Voice Teacher errors
---

## Vite Config — Never Throw on Missing Env Vars
- Original code: `throw new Error("PORT...")` — caused blank page in preview
- Fix: `const port = Number(rawPort || "5173")` and `const basePath = process.env.BASE_PATH || "/"`
- **Why:** Replit preview iframe proxies the app; PORT is only injected at workflow start. Throwing prevents vite from starting.

## DB Indexes — Applied via Direct psql
- 21 indexes added across all tables on user_id columns (recordings, surah_progress, hifdh_progress, notifications, bookmarks, achievements, daily_activity, conversations, messages, exam_results, certificates, library_progress, payment_records, direct_messages, audit_logs)
- Compound indexes added for high-frequency queries: user_id+surah_id, user_id+is_read, sender_id/receiver_id, created_at DESC on audit_logs
- Applied via `CREATE INDEX CONCURRENTLY IF NOT EXISTS` — safe to run multiple times

## Tajweed Engine — Confidence Levels
- Added `confidence: RuleConfidence` field to every `TajweedRule`: "detected_in_text" | "estimated_from_accuracy" | "cannot_measure"
- Added `analysisMode: "text_based"` and `disclaimer` to result
- Tafkhim marked `cannot_measure` — cannot verify heavy pronunciation without audio
- All other rules marked `detected_in_text` — letters confirmed in Unicode text
- **Why:** Honest reporting — do not claim to verify pronunciation quality without audio waveform access

## Voice Teacher — Specific Error Messages
- Every error code from Web Speech API mapped to user-friendly message
- `not-allowed` → click lock icon in address bar
- `no-speech` → speak louder / hold button while speaking
- `network` → check internet connection
- `audio-capture` → microphone in use by another app
- Whisper transcription errors use `describeTranscriptionError()` which maps error strings to user messages
- `micStatus` state drives UI: "idle" | "recording" | "denied" | "error"
