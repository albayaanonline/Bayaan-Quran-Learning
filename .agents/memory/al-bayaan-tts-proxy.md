---
name: Al Bayaan TTS proxy
description: How TTS audio works in Al Bayaan — Google TTS proxy, AudioContext lip sync, and rate limiter trust proxy fix
---

## TTS Proxy
- Endpoint: `GET /api/tts?text=TEXT&lang=ar`
- File: `artifacts/api-server/src/routes/tts.ts`
- Source: `https://translate.google.com/translate_tts?...&client=tw-ob&ttsspeed=0.9` — confirmed HTTP 200, real MPEG audio from Replit server
- In-memory cache with 10-min TTL, max 200 entries (LRU eviction)
- Rate limited 30/min via express-rate-limit on `/api/tts`

## AudioContext Lip Sync (Video Teacher)
- Frontend fetches `/api/tts` → gets ArrayBuffer → `AudioContext.decodeAudioData()` → `BufferSourceNode → AnalyserNode → destination`
- `requestAnimationFrame` loop reads `getByteTimeDomainData()` to compute RMS amplitude → drives `mouthAmount` (0.0–1.0)
- Exponential smoothing: `smoothed = smoothed * 0.7 + rms * 0.3`
- Falls back to browser `speechSynthesis` with `onboundary` word-timing events if TTS fetch fails

## Express Rate Limiter + Trust Proxy
- Must set `app.set("trust proxy", 1)` before any `rateLimit()` middleware
- Without it: `ValidationError: ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` spams every request

**Why:** Replit's reverse proxy sets X-Forwarded-For header; Express must trust it for IP-based rate limiting to work correctly.
