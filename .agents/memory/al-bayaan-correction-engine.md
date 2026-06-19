---
name: Al Bayaan correction engine — full audio-driven pipeline
description: Architecture of the real audio-driven Quran correction engine and lessons learned.
---

## Provider Chain (4 providers, automatic fallback)
1. **Groq Whisper-large-v3** — fastest, needs GROQ_API_KEY env secret
2. **HF tarteel-ai/whisper-large-v2-ar** — Quran-specialised, uses x-wait-for-model header
3. **HF openai/whisper-large-v3** — general Arabic, uses x-wait-for-model header
4. **Local faster-whisper-tiny** — runs on CPU, no key needed, model cached at /tmp/fw_model

**Critical**: HuggingFace (api-inference.huggingface.co) is BLOCKED by Replit's network firewall (curl returns 000). Provider 4 (local) is the reliable fallback without GROQ_API_KEY.

## Python Script Location
- Source: `artifacts/api-server/src/scripts/transcribe_local.py`
- Runtime: `artifacts/api-server/scripts/transcribe_local.py` (manually copied — __dirname in dist/ resolves to `../scripts/`)
- Model cache: `/tmp/fw_model/models--Systran--faster-whisper-tiny` (~39MB, auto-downloaded on first run)

**Why:** esbuild banner sets `__dirname = dist/` so `path.resolve(__dirname, "../scripts/")` = `api-server/scripts/` NOT `src/scripts/`. Keep copy in both places.

## Hard Gate (CRITICAL requirement)
`recordings.ts` returns `{ transcriptionFailed: true, reason, providerErrors, diagnostics }` immediately if all 4 providers return empty text. No scores, no correction, no DB write happens. Frontend shows red "Speech Recognition Failed" panel with full provider error log.

## Normalization Bug Fixed
U+0670 (superscript alef ٰ in الرَّحْمَٰنِ) is NOT in the diacritic range U+064B-U+065F. Must explicitly add `.replace(/\u0670/g, "")` or "الرحمن" won't match "الرَّحْمَٰنِ".

## Three-Recording Proof (proven different outputs)
All tested with Alafasy MP3s against Al-Fatiha:1 reference:
- A (correct recitation): 100% word match, confidence 82%
- B (wrong verse played): 25% match, confidence 64%, 3 missing + 3 extra words
- C (completely wrong): 0% match, confidence 34%, 4 missing + 2 extra words

## Seed for pick() variation
Seed = refText[:12] | transText[:12] | refText[-8:] | attemptKey (timestamp + bytes + ayahNumber). Different recordings → different transcribed text → different seed → different message variant.
