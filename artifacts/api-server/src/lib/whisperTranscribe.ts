/**
 * Al Bayaan Audio Transcription
 *
 * Provider chain — automatic fallback, zero student-visible errors:
 *   1. Groq Whisper-large-v3              (fast, free tier — needs GROQ_API_KEY)
 *   2. HF tarteel-ai/whisper-large-v2-ar  (Quran-specialised, free — retries on 503)
 *   3. HF openai/whisper-large-v3         (general Arabic, free — retries on 503)
 *   4. Graceful error with diagnostics    (never crashes the student)
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
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
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
//         Automatically retries once when the model is cold-starting (503)
// ---------------------------------------------------------------------------
async function transcribeHuggingFace(
  model: string,
  audioBuffer: Buffer,
  mimeType: string
): Promise<TranscriptionResult> {
  const hfToken = process.env.HF_TOKEN;
  const headers: Record<string, string> = { "Content-Type": mimeType };
  if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

  const attempt = async (waitMs = 0): Promise<TranscriptionResult> => {
    if (waitMs > 0) {
      logger.info({ model, waitMs }, "Waiting for HF model to load before retry");
      await new Promise(r => setTimeout(r, waitMs));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40_000);

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
        const estimatedWait: number = Math.min(body?.estimated_time ?? 20, 30);
        return { text: "", success: false, model, error: `Model loading (~${Math.round(estimatedWait)}s)` };
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
  };

  // First attempt
  const first = await attempt(0);
  if (first.success) return first;

  // If model is cold-starting (503), wait and retry once
  if (first.error?.includes("Model loading")) {
    const waitMatch = first.error.match(/~(\d+)s/);
    const waitMs = Math.min((parseInt(waitMatch?.[1] ?? "20", 10) + 3) * 1000, 20_000);
    logger.info({ model, waitMs }, "HF model cold-starting, retrying after delay");
    const retry = await attempt(waitMs);
    if (retry.success) return retry;
    return { ...retry, error: `${first.error} (retry also failed: ${retry.error})` };
  }

  return first;
}

// ---------------------------------------------------------------------------
// Public API — used by recordings.ts and voice-teacher.ts
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
    return { text: "", success: false, model: "none", error: "Audio too short (< 1 second)" };
  }

  logger.info({ bytes: audioBuffer.length, mimeType }, "Starting transcription chain");

  // 1. Groq (fast, free tier)
  const groqResult = await transcribeGroq(audioBuffer, mimeType);
  if (groqResult.success) {
    logger.info({ model: groqResult.model }, "Transcribed via Groq");
    return groqResult;
  }
  if (groqResult.error !== "No GROQ_API_KEY") {
    logger.warn({ err: groqResult.error }, "Groq transcription failed");
  }

  // 2. HF tarteel (Quran-specialised, best for Arabic recitation — retries on 503)
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

  // 3. HF openai/whisper-large-v3 (general Arabic — retries on 503)
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

  // Aggregate error for diagnostics
  const errors = [groqResult.error, tarteelResult.error, whisperResult.error].filter(Boolean).join(" | ");
  return { text: "", success: false, model: "none", error: errors || "All transcription providers unavailable" };
}
