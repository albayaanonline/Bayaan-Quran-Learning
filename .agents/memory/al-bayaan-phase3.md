---
name: Al Bayaan Phase 3-6 features
description: All major features built across Phases 3, 4, 5, and 6 of the Al Bayaan AI Academy project
---

## Routes registered (api-server/src/routes/index.ts)
All routers imported and mounted: health, profile, surahs, progress, recordings, bookmarks, achievements, dashboard, leaderboard, transcribe, teacher, hifdh, voice-teacher, study-planner, admin, teacher-dashboard, library, exams, certificates, cms, parent, analytics, notifications.

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

## Phase 6 features (June 2026)
### 1. Exam Builder UI (/exam-builder)
New teacher page with full CRUD — create/edit/publish/delete exams. Tabs: Details / Questions / Settings. Supports MCQ (radio correct answer), Short Answer, Recitation question types. Auto-calc marks from individual question marks. PATCH /api/exams/:id + DELETE /api/exams/:id added.

### 2. Auto-certificate on exam pass
In exams.ts submit endpoint: on `passed=true`, auto-inserts into certificates table with unique verification code. Returns `certificate` in response body. Also fires 2 notifications (exam_passed + certificate_earned).

### 3. Notifications system
DB table: notifications (userId, type, title, message, data jsonb, isRead, createdAt). Migrated.
API: GET /notifications, POST /notifications, PATCH /notifications/:id/read, PATCH /notifications/read-all, DELETE /notifications/:id.
Internal helper: createNotification() in routes/notifications.ts — used from exams.ts.
Frontend: NotificationBell component with animated dropdown, unread badge, mark-read, delete, auto-polls every 30s.

### 4. Security hardening
helmet + express-rate-limit added to app.ts.
- General: 300 req/15min per IP
- AI routes (teacher, voice-teacher, study-planner, hifdh/ai-coach, exams/evaluate): 20 req/min
- Request body limit: 10mb JSON, 2mb urlencoded

### 5. Multi-language (i18n)
I18nProvider context at artifacts/al-bayaan/src/lib/i18n.tsx.
Languages: EN (English), AR (العربية, RTL), SO (Somali).
Translations: ~40 keys covering all nav items + common UI strings.
Stored in localStorage. Updates document.dir = "rtl" for Arabic.
Language switcher (globe icon + select) in AppLayout.tsx sidebar bottom.
NotificationBell in sidebar top (desktop) and mobile header.
