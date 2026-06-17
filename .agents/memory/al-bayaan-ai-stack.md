---
name: Al Bayaan AI stack
description: AI provider decisions for Whisper STT and AI Teacher in Al Bayaan app
---

## Speech-to-Text (Whisper)
- **Primary**: `tarteel-ai/whisper-large-v2-ar` via HuggingFace Inference API (Quran-specialized)
- **Fallback**: `openai/whisper-large-v3` via HuggingFace
- **Auth**: `HF_TOKEN` env var (already set in this project); optional but required for reliable access
- **Endpoint**: `POST https://api-inference.huggingface.co/models/{model}` with raw audio bytes
- **File**: `artifacts/api-server/src/lib/whisperTranscribe.ts`

## AI Teacher
- **Model**: `mistralai/Mistral-7B-Instruct-v0.2`
- **Endpoint**: `https://api-inference.huggingface.co/v1/chat/completions` (OpenAI-compatible, supports streaming)
- **Streaming**: SSE stream piped from HF to client via Express `text/event-stream`
- **Auth**: Same `HF_TOKEN` env var
- **File**: `artifacts/api-server/src/routes/teacher.ts`

## Why HuggingFace (not OpenRouter)
OpenRouter requires account upgrade (setupReplitAIIntegrations returned `awaiting_account_upgrade`). HuggingFace free tier covers both STT and LLM with the same token.

## Graceful fallback
- Without `HF_TOKEN`: transcription returns `success: false`, frontend shows "text analysis only" badge
- AI Teacher without token: returns helpful message instructing user to set HF_TOKEN
