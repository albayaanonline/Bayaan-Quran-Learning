---
name: Al Bayaan correction engine seed fix
description: Why the recitation correction engine gave identical feedback for the same ayah on every attempt, and how it was fixed.
---

## The Problem
`pick()` used only `referenceText.slice(0,15)` as seed → same ayah always selected the same feedback variant. When STT failed (no GROQ_API_KEY), `transcribedText=""` on every attempt → identical score 0 + identical messages every time.

## The Fix
Seed is now `refText[:12] | transText[:12] | refText[-8:] | attemptKey` where `attemptKey = Date.now() + audioBytes + ayahNumber`. Different recordings → different transcription → different seed → different message variant. If transcription fails, the timestamp still changes the seed.

**Why:** The feedback pick must depend on both the reference AND the student's actual output, not just the reference. Otherwise same ayah = same message forever.

**How to apply:** Any `pick()` call for feedback should include the student's transcription (or a time-based token if transcription fails) in the seed.

## Diagnostics Added
- `feedback.diagnostics.scoreFormula` — exact formula shown in collapsible UI
- `feedback.diagnostics.analysisLog` — LCS length, error pattern, word counts, normalized texts
- `feedback.diagnostics.audioBytes` / `audioDurationSeconds`
- `feedback.transcriptionError` — set when STT fails
- Frontend shows amber banner when transcription failed, with "GROQ_API_KEY needed" message

## STT Status
- No GROQ_API_KEY set → Groq Whisper skipped
- HuggingFace models cold-start frequently → fail with 503
- When both fail, `transcribedText=""` and analysis is text-only (tajweed rules from reference text only)
- Setting GROQ_API_KEY secret will unlock real audio-driven analysis
