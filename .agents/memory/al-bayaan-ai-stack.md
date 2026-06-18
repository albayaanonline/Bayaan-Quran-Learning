---
name: Al Bayaan AI stack
description: AI provider chain, voice transcription strategy, and key architectural decisions for the Al Bayaan platform.
---

## AI Text Generation Chain (aiProvider.ts)
Priority order — all automatic, no user config needed:
1. Groq (llama3-8b-8192 / mixtral-8x7b) — fastest, needs GROQ_API_KEY
2. Pollinations streaming POST (`https://text.pollinations.ai/openai`) — free, no key
3. Pollinations simple GET (`https://text.pollinations.ai/{prompt}?model=openai&system=...`) — reliable fallback, returns plain text
4. HuggingFace (Mistral-7B, Llama3-8B) — free, rate-limited, no key needed
5. Contextual static fallback — varies by topic (Tajweed/Hifdh/Arabic/Quran/default)

**Why GET Pollinations added:** Streaming POST can fail silently on SSE parsing edge cases. GET endpoint is always plain text, simpler.

## Voice Transcription Strategy
**Frontend PRIMARY (voice-teacher.tsx, video-teacher.tsx):** Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) — free, instant, works in Chrome/Edge/Safari, no API key needed. Language toggle EN/AR/SO.

**Backend FALLBACK chain (whisperTranscribe.ts):**
1. Groq Whisper-large-v3 — needs GROQ_API_KEY
2. HF tarteel-ai/whisper-large-v2-ar — Quran-specialized, retries once on 503 (waits estimated_time+3s)
3. HF openai/whisper-large-v3 — general Arabic, same retry logic

**Why Web Speech API first:** Without GROQ_API_KEY, HF free tier gets 503 (model loading) causing "couldn't hear you" messages. Web Speech API works instantly in Chrome with no API key.

## Voice Teacher (voice-teacher.tsx)
- Language toggle: EN/AR/SO switches SpeechRecognition lang
- Text input fallback always visible
- Status messages show each pipeline stage (Listening… / Processing speech… / Thinking… / Receiving response…)
- Diagnostic error messages (not generic) when speech fails
- Badge shows "Browser Speech ✓" or "Whisper Mode"

## Video Teacher (video-teacher.tsx)
- Same Web Speech API primary + MediaRecorder fallback
- Uses BASE_PATH const for all fetch calls (avoids base path routing issues)

## Tajweed / Quran Recitation Analysis
- Real audio → Whisper transcription → LCS comparison vs reference text
- Tajweed rules detected by regex on reference text (not waveform analysis — this is by design)
- Scoring: accuracy (LCS) + tajweed (rule presence) + pronunciation/fluency derived scores

## Payments
- Zaad/EVC/eDahab: real instructions, real references (Somalia regional)
- Stripe/PayPal: requires STRIPE_SECRET_KEY / PAYPAL_CLIENT_ID env vars to activate
