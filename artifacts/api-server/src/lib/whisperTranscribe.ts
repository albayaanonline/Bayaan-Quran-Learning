/**
 * HuggingFace Whisper Transcription
 * Uses tarteel-ai/whisper-large-v2-ar (Quran-specialized) or
 * openai/whisper-large-v3 as fallback.
 * Model is open-source; API is free (HF_TOKEN optional but recommended).
 */
import { logger } from "./logger";

const HF_TOKEN = process.env.HF_TOKEN;
const PRIMARY_MODEL = "tarteel-ai/whisper-large-v2-ar";
const FALLBACK_MODEL = "openai/whisper-large-v3";

async function callHuggingFace(
  model: string,
  audioBuffer: Buffer,
  mimeType: string
): Promise<{ text: string; success: boolean; error?: string }> {
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const headers: Record<string, string> = {
    "Content-Type": mimeType,
  };
  if (HF_TOKEN) {
    headers["Authorization"] = `Bearer ${HF_TOKEN}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: audioBuffer,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 503) {
      const body = await response.json().catch(() => ({})) as any;
      const wait = body?.estimated_time ?? 20;
      return { text: "", success: false, error: `Model loading, retry in ${wait}s` };
    }

    if (!response.ok) {
      const errText = await response.text();
      return { text: "", success: false, error: `HF API ${response.status}: ${errText}` };
    }

    const data = await response.json() as any;
    const text: string =
      data?.text ??
      data?.[0]?.generated_text ??
      data?.[0]?.text ??
      "";

    return { text: text.trim(), success: true };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") {
      return { text: "", success: false, error: "Transcription timed out" };
    }
    return { text: "", success: false, error: String(err) };
  }
}

export interface TranscriptionResult {
  text: string;
  success: boolean;
  model: string;
  error?: string;
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType = "audio/webm"
): Promise<TranscriptionResult> {
  if (!audioBase64 || audioBase64.length === 0) {
    return { text: "", success: false, model: "none", error: "No audio data provided" };
  }

  let base64Data = audioBase64;
  if (audioBase64.includes(",")) {
    base64Data = audioBase64.split(",")[1];
  }

  const audioBuffer = Buffer.from(base64Data, "base64");

  if (audioBuffer.length < 1000) {
    return { text: "", success: false, model: "none", error: "Audio too short" };
  }

  logger.info({ model: PRIMARY_MODEL, bytes: audioBuffer.length }, "Transcribing audio");

  const primary = await callHuggingFace(PRIMARY_MODEL, audioBuffer, mimeType);
  if (primary.success && primary.text.length > 0) {
    return { ...primary, model: PRIMARY_MODEL };
  }

  logger.warn({ error: primary.error }, "Primary model failed, trying fallback");

  const fallback = await callHuggingFace(FALLBACK_MODEL, audioBuffer, mimeType);
  if (fallback.success) {
    return { ...fallback, model: FALLBACK_MODEL };
  }

  return { text: "", success: false, model: "none", error: fallback.error };
}
