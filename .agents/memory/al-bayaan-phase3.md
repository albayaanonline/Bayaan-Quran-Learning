---
name: Al Bayaan Phase 3-5 features
description: All major features built across Phases 3, 4, and 5 of the Al Bayaan AI Academy project
---

## Routes registered (api-server/src/routes/index.ts)
All routers imported and mounted: health, profile, surahs, progress, recordings, bookmarks, achievements, dashboard, leaderboard, transcribe, teacher, hifdh, voice-teacher, study-planner, admin, teacher-dashboard, library, exams, certificates, cms, parent, analytics.

## Admin guard
ADMIN_USER_IDS env var (comma-separated Clerk user IDs). If env var is empty in dev, all authenticated users pass (dev convenience). Set it in production via environment-secrets skill.

## Voice Teacher architecture
HTTP SSE (not WebSocket) — POST /api/voice-teacher/message with { audioBase64, mimeType, conversationId, messages }. Server pipes: base64 decode → Whisper (tarteel-ai/whisper-large-v2-ar) → Mistral SSE stream. Client uses SpeechSynthesis API for TTS playback.

## PWA
vite-plugin-pwa added to artifacts/al-bayaan. devOptions.enabled=false (no SW in dev). Uses SVG icons. Workbox caches /api/surahs (StaleWhileRevalidate 24h) and /api/progress (NetworkFirst 5min).

## Teacher Dashboard
No teacher-student schema — shows all users. Three endpoints: /students (paginated list with score/activity), /student/:clerkId (detail + weak areas + surah progress), /class-report (aggregate stats). No ADMIN_USER_IDS guard — any authenticated user can view.

## Why no WebSocket for Voice Teacher
Replit's proxy layer does not reliably pass WebSocket upgrade headers in this monorepo setup; HTTP SSE + chunked response works cleanly through the proxy.

## Library system
Static book catalog (22 books across 7 categories) defined in artifacts/api-server/src/routes/library.ts as LIBRARY_BOOKS constant. No CMS yet — admin must edit the constant to add books. DB table library_progress tracks per-user per-book lesson completion. Migrated with `pnpm --filter @workspace/db run push`.

## Onboarding smart routing
10 subjects in onboarding. Each GOAL entry has a `dashboard` field that sets the post-onboarding redirect route. AI voice guide uses browser SpeechSynthesis (free, no API). Speaks STEP_VOICE_PROMPTS on each step change when enabled.

## Advanced recording in surah.tsx
State machine: idle → recording → preview → submitting. Web Audio API (AudioContext + AnalyserNode) for live waveform bars on canvas. Preview state shows pre-submit playback with Delete / Re-record / Submit buttons. Tap-to-toggle (not hold). previewUrl cleaned up with URL.revokeObjectURL on reset.

## Qari player in surah.tsx
6 Qaris defined with real metadata (name, nameAr, country, style). Dropdown Qari picker anchored below the selector button. Audio URL uses selectedQariId for everyayah.com path.

## Phase 5 new pages (June 2026)
All added to App.tsx router + AppLayout.tsx navigation:
- /exams — Exam Centre (timer, MCQ + short answer, AI evaluation SSE stream)
- /certificates — view/download/share + public verify-by-code panel
- /analytics — score trends, Tajweed accuracy chart, surah completion, hifdh stats
- /cms — Islamic Library (search/filter, add content dialog, file links)
- /parent — Parent Dashboard (link children by Clerk ID, per-child progress + weak areas)

## Phase 5 new DB tables
exams, exam_results, certificates, cms_content, parent_profiles, student_analytics — all migrated. Schema files in lib/db/src/schema/.

## Phase 5 new API routes
exams.ts, certificates.ts, cms.ts, parent.ts, analytics.ts — all in artifacts/api-server/src/routes/.
