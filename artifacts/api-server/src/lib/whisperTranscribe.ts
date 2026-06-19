/**
 * Al Bayaan — Audio Transcription Engine
 *
 * Four-provider fallback chain. Each provider is tried in order.
 * The first successful transcription (non-empty Arabic text) is returned.
 * If every provider fails the caller receives { success: false } with the
 * exact per-provider error strings — no silent empty results.
 *
 * Provider order:
 *   1. Groq Whisper-large-v3        — fast cloud, needs GROQ_API_KEY
 *   2. HF tarteel-ai/whisper-large-v2-ar — Quran-specialised (x-wait-for-model)
 *   3. HF openai/whisper-large-v3   — general Arabic (x-wait-for-model)
 *   4. Local faster-whisper tiny    — runs on-server, no API key needed
 */

import { execFile } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface TranscriptionResult {
  text: string;
  success: boolean;
  model: string;
  confidence: number;        // 0–1, best estimate from provider
  providerErrors: string[];  // per-provider failure messages
  error?: string;            // summary error (set when success===false)
}

// ---------------------------------------------------------------------------
// 1. Groq Whisper-large-v3
//    Requires GROQ_API_KEY. Returns verbose_json for per-word confidence.
// ---------------------------------------------------------------------------
async function transcribeGroq(
  audioBuffer: Buffer,
  mimeType: string,
  errors: string[]
): Promise<TranscriptionResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    errors.push("Groq: no GROQ_API_KEY set");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-large-v3");
    formData.append("language", "ar");
    formData.append("response_format", "verbose_json");

    const resp = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const err = await resp.text();
      errors.push(`Groq HTTP ${resp.status}: ${err.slice(0, 200)}`);
      return null;
    }

    const data = await resp.json() as any;
    const text = (data?.text ?? "").trim();
    if (!text) {
      errors.push("Groq: returned empty transcription");
      return null;
    }

    // Average confidence from word-level segments if available
    const segs: any[] = data?.segments ?? [];
    const avgConf = segs.length > 0
      ? segs.reduce((s: number, g: any) => s + (g.avg_logprob ?? -0.5), 0) / segs.length
      : -0.3;
    const confidence = parseFloat(Math.max(0, Math.min(1, Math.exp(avgConf))).toFixed(3));

    return { text, success: true, model: "groq/whisper-large-v3", confidence, providerErrors: errors };
  } catch (err: any) {
    clearTimeout(timeout);
    const msg = err?.name === "AbortError" ? "Groq: timed out (30s)" : `Groq: ${String(err)}`;
    errors.push(msg);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 2 & 3. HuggingFace Inference API
//    Uses x-wait-for-model: true so HF waits for model instead of 503.
//    HF_TOKEN is optional (higher rate limits when set).
// ---------------------------------------------------------------------------
async function transcribeHuggingFace(
  model: string,
  audioBuffer: Buffer,
  mimeType: string,
  errors: string[]
): Promise<TranscriptionResult | null> {
  const hfToken = process.env.HF_TOKEN;
  const headers: Record<string, string> = {
    "Content-Type": mimeType,
    "x-wait-for-model": "true",
  };
  if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

  const controller = new AbortController();
  // Allow up to 90 s — HF may need ~60 s to warm up the model
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const resp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers,
      body: audioBuffer,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (resp.status === 503) {
      errors.push(`HF/${model}: model unavailable (503) even with wait`);
      return null;
    }
    if (!resp.ok) {
      const body = await resp.text();
      errors.push(`HF/${model} HTTP ${resp.status}: ${body.slice(0, 200)}`);
      return null;
    }

    const data = await resp.json() as any;
    const text = (
      data?.text ??
      data?.[0]?.generated_text ??
      data?.[0]?.text ??
      ""
    ).trim();

    if (!text) {
      errors.push(`HF/${model}: returned empty transcription`);
      return null;
    }

    return {
      text,
      success: true,
      model: `hf/${model}`,
      confidence: 0.7,  // HF API doesn't expose confidence; use reasonable default
      providerErrors: errors,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    const msg = err?.name === "AbortError"
      ? `HF/${model}: timed out (90s)`
      : `HF/${model}: ${String(err)}`;
    errors.push(msg);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 4. Local faster-whisper (tiny, CPU, Arabic)
//    Runs a Python subprocess — no API key needed, works fully offline.
//    Model (~39 MB) is downloaded to /tmp/fw_model on first use.
// ---------------------------------------------------------------------------
async function transcribeLocal(
  audioBuffer: Buffer,
  mimeType: string,
  errors: string[]
): Promise<TranscriptionResult | null> {
  // __dirname points to dist/ at runtime; script lives one level up in scripts/
  const scriptPath = path.resolve(__dirname, "../scripts/transcribe_local.py");

  if (!fs.existsSync(scriptPath)) {
    errors.push("Local: transcribe_local.py not found");
    return null;
  }

  const payload = JSON.stringify({
    audio_b64: audioBuffer.toString("base64"),
    mime_type: mimeType,
  });

  return new Promise((resolve) => {
    // Allow up to 120 s for first run (model download ~39 MB)
    const child = execFile(
      "python3",
      [scriptPath],
      { timeout: 120_000, maxBuffer: 512 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          const msg = `Local faster-whisper: ${err.message}${stderr ? ` | ${stderr.slice(0, 200)}` : ""}`;
          errors.push(msg);
          resolve(null);
          return;
        }

        try {
          const result = JSON.parse(stdout.trim()) as any;
          if (!result.success || !result.text) {
            errors.push(`Local faster-whisper: ${result.error ?? "empty transcription"}`);
            resolve(null);
            return;
          }
          resolve({
            text: result.text,
            success: true,
            model: result.model ?? "faster-whisper-tiny",
            confidence: result.confidence ?? 0.5,
            providerErrors: errors,
          });
        } catch (parseErr) {
          errors.push(`Local faster-whisper: invalid JSON output — ${stdout.slice(0, 200)}`);
          resolve(null);
        }
      }
    );

    // Write payload to stdin — attach error handler first to prevent
    // unhandled EPIPE from crashing the process when the child exits early.
    if (child.stdin) {
      child.stdin.on("error", () => {/* swallow EPIPE/write errors — callback handles the failure */});
      child.stdin.write(payload);
      child.stdin.end();
    }
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function transcribeAudio(
  audioBase64: string,
  mimeType = "audio/webm"
): Promise<TranscriptionResult> {
  if (!audioBase64 || audioBase64.length === 0) {
    return {
      text: "", success: false, model: "none", confidence: 0,
      providerErrors: ["No audio data provided"],
      error: "No audio data provided",
    };
  }

  const base64Data = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
  const audioBuffer = Buffer.from(base64Data, "base64");

  if (audioBuffer.length < 1000) {
    return {
      text: "", success: false, model: "none", confidence: 0,
      providerErrors: [`Audio too small (${audioBuffer.length} bytes — minimum 1 KB)`],
      error: "Audio too short — minimum ~1 second of speech",
    };
  }

  const errors: string[] = [];
  logger.info({ bytes: audioBuffer.length, mimeType }, "Starting 4-provider STT chain");

  // ── Provider 1: Groq ────────────────────────────────────────────────────
  const groq = await transcribeGroq(audioBuffer, mimeType, errors);
  if (groq) {
    logger.info({ model: groq.model, chars: groq.text.length, conf: groq.confidence }, "STT via Groq");
    return groq;
  }

  // ── Provider 2: HF tarteel (Quran-specialised) ──────────────────────────
  const tarteel = await transcribeHuggingFace("tarteel-ai/whisper-large-v2-ar", audioBuffer, mimeType, errors);
  if (tarteel) {
    logger.info({ model: tarteel.model, chars: tarteel.text.length }, "STT via HF tarteel");
    return tarteel;
  }

  // ── Provider 3: HF openai/whisper-large-v3 ──────────────────────────────
  const hfWhisper = await transcribeHuggingFace("openai/whisper-large-v3", audioBuffer, mimeType, errors);
  if (hfWhisper) {
    logger.info({ model: hfWhisper.model, chars: hfWhisper.text.length }, "STT via HF whisper");
    return hfWhisper;
  }

  // ── Provider 4: local faster-whisper ────────────────────────────────────
  logger.info("Cloud STT failed, falling back to local faster-whisper");
  const local = await transcribeLocal(audioBuffer, mimeType, errors);
  if (local) {
    logger.info({ model: local.model, chars: local.text.length, conf: local.confidence }, "STT via local faster-whisper");
    return local;
  }

  // ── All providers failed ─────────────────────────────────────────────────
  logger.error({ errors }, "All 4 STT providers failed");
  return {
    text: "", success: false, model: "none", confidence: 0,
    providerErrors: errors,
    error: errors.join(" | "),
  };
}
