/**
 * Al Bayaan Audio Transcription
 *
 * Provider chain — automatic fallback, zero student-visible errors:
 *   1. Groq Whisper-large-v3          (fast, free tier — needs GROQ_API_KEY)
 *   2. HF tarteel-ai/whisper-large-v2-ar  (Quran-specialised, free, no token needed)
 *   3. HF openai/whisper-large-v3         (general Arabic, free, no token needed)
 *   4. Graceful empty-string fallback     (never crashes the student)
 */

import { logger } from "./logger";

export interface TranscriptionResult {
  text: string;
  success: boolean;
  model: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// 1. Groq Whisper  (free tier, ~10x faster than HF — needs GROQ_API_KEY)
// ---------------------------------------------------------------------------
async function transcribeGroq(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { text: "", success: false, model: "groq-whisper", error: "No GROQ_API_KEY" };

  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  formData.append("file", blob, "audio.webm");
  formData.append("model", "whisper-large-v3");
  formData.append("language", "ar");
  formData.append("response_format", "json");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const resp = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const err = await resp.text();
      return { text: "", success: false, model: "groq-whisper", error: `Groq ${resp.status}: ${err}` };
    }
    const data = await resp.json() as any;
    const text = (data?.text ?? "").trim();
    return { text, success: text.length > 0, model: "groq-whisper-large-v3" };
  } catch (err: any) {
    clearTimeout(timeout);
    return { text: "", success: false, model: "groq-whisper", error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// 2 & 3. HuggingFace Whisper  (free, HF_TOKEN optional for higher rate limits)
// ---------------------------------------------------------------------------
async function transcribeHuggingFace(
  model: string,
  audioBuffer: Buffer,
  mimeType: string
): Promise<TranscriptionResult> {
  const hfToken = process.env.HF_TOKEN;
  const headers: Record<string, string> = { "Content-Type": mimeType };
  if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);

  try {
    const resp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers,
      body: audioBuffer,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (resp.status === 503) {
      const body = await resp.json().catch(() => ({})) as any;
      const wait = body?.estimated_time ?? 20;
      return { text: "", success: false, model, error: `Model loading (~${wait}s), try again shortly` };
    }

    if (!resp.ok) {
      const err = await resp.text();
      return { text: "", success: false, model, error: `HF ${resp.status}: ${err}` };
    }

    const data = await resp.json() as any;
    const text: string = (
      data?.text ??
      data?.[0]?.generated_text ??
      data?.[0]?.text ??
      ""
    ).trim();

    return { text, success: text.length > 0, model };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") {
      return { text: "", success: false, model, error: "Transcription timed out" };
    }
    return { text: "", success: false, model, error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Public API — used by transcribe.ts and voice-teacher.ts
// ---------------------------------------------------------------------------
export async function transcribeAudio(
  audioBase64: string,
  mimeType = "audio/webm"
): Promise<TranscriptionResult> {
  if (!audioBase64 || audioBase64.length === 0) {
    return { text: "", success: false, model: "none", error: "No audio data provided" };
  }

  // Strip data-URL prefix if present
  const base64Data = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
  const audioBuffer = Buffer.from(base64Data, "base64");

  if (audioBuffer.length < 1000) {
    return { text: "", success: false, model: "none", error: "Audio too short" };
  }

  logger.info({ bytes: audioBuffer.length }, "Starting transcription chain");

  // 1. Groq (fast, free tier)
  const groqResult = await transcribeGroq(audioBuffer, mimeType);
  if (groqResult.success) {
    logger.info({ model: groqResult.model }, "Transcribed via Groq");
    return groqResult;
  }
  if (groqResult.error !== "No GROQ_API_KEY") {
    logger.warn({ err: groqResult.error }, "Groq transcription failed");
  }

  // 2. HF tarteel (Quran-specialised, best for Arabic recitation)
  const tarteelResult = await transcribeHuggingFace(
    "tarteel-ai/whisper-large-v2-ar",
    audioBuffer,
    mimeType
  );
  if (tarteelResult.success) {
    logger.info({ model: tarteelResult.model }, "Transcribed via HF tarteel");
    return tarteelResult;
  }
  logger.warn({ err: tarteelResult.error }, "tarteel failed, trying whisper-large-v3");

  // 3. HF openai/whisper-large-v3 (general Arabic)
  const whisperResult = await transcribeHuggingFace(
    "openai/whisper-large-v3",
    audioBuffer,
    mimeType
  );
  if (whisperResult.success) {
    logger.info({ model: whisperResult.model }, "Transcribed via HF whisper-large-v3");
    return whisperResult;
  }
  logger.warn({ err: whisperResult.error }, "All transcription providers failed");

  // 4. Graceful fallback — student sees a helpful message, not a crash
  return { text: "", success: false, model: "none", error: "Transcription unavailable — please try again" };
}
