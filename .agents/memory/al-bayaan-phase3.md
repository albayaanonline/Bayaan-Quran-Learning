---
name: Al Bayaan Phase 3 features
description: All Phase 3 and 4 features built — routes, pages, PWA config, admin guard, voice teacher architecture
---

## Routes registered (api-server/src/routes/index.ts)
All routers imported and mounted: health, profile, surahs, progress, recordings, bookmarks, achievements, dashboard, leaderboard, transcribe, teacher, hifdh, voice-teacher, study-planner, admin, teacher-dashboard.

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
