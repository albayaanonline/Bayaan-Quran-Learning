/**
 * Al Bayaan AI Provider Manager
 *
 * Priority chain — fully automatic, zero student-visible config errors:
 *   1. Groq          (free tier, fast — llama3-8b-8192 / mixtral-8x7b)
 *   2. Pollinations  (100% free, no key, open-source models)
 *   3. HuggingFace   (free inference, no token required, rate-limited)
 *   4. Static        (built-in Islamic scholar fallback, always works)
 *
 * To unlock Groq: set GROQ_API_KEY env var (free at console.groq.com).
 * The app works perfectly without ANY key — providers auto-skip on failure.
 */

import { logger } from "./logger";

export type AIChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AIStreamCallbacks {
  onChunk: (chunk: string) => void;
  onDone: (fullText: string) => void;
  onError: (err: string) => void;
}

interface Provider {
  name: string;
  baseUrl: string;
  model: string;
  requiresKey: boolean;
  getKey: () => string | null;
  extraBody?: Record<string, unknown>;
}

function buildProviders(): Provider[] {
  const groqKey = process.env.GROQ_API_KEY ?? null;
  const hfKey = process.env.HF_TOKEN ?? null;

  const providers: Provider[] = [];

  // 1. Groq — extremely fast, free tier (requires GROQ_API_KEY)
  if (groqKey) {
    providers.push(
      {
        name: "groq-llama3",
        baseUrl: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama3-8b-8192",
        requiresKey: true,
        getKey: () => groqKey,
      },
      {
        name: "groq-mixtral",
        baseUrl: "https://api.groq.com/openai/v1/chat/completions",
        model: "mixtral-8x7b-32768",
        requiresKey: true,
        getKey: () => groqKey,
      }
    );
  }

  // 2. Pollinations — free, no key, open-source
  providers.push(
    {
      name: "pollinations-openai",
      baseUrl: "https://text.pollinations.ai/openai",
      model: "openai",
      requiresKey: false,
      getKey: () => null,
    },
    {
      name: "pollinations-mistral",
      baseUrl: "https://text.pollinations.ai/openai",
      model: "mistral",
      requiresKey: false,
      getKey: () => null,
    }
  );

  // 3. HuggingFace — free inference, token optional (higher rate limits with token)
  providers.push(
    {
      name: "hf-mistral",
      baseUrl: "https://api-inference.huggingface.co/v1/chat/completions",
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      requiresKey: false,
      getKey: () => hfKey,
    },
    {
      name: "hf-llama3",
      baseUrl: "https://api-inference.huggingface.co/v1/chat/completions",
      model: "meta-llama/Meta-Llama-3-8B-Instruct",
      requiresKey: false,
      getKey: () => hfKey,
    }
  );

  return providers;
}

async function tryStreamProvider(
  provider: Provider,
  messages: AIChatMessage[],
  maxTokens: number,
  temperature: number,
  callbacks: AIStreamCallbacks
): Promise<boolean> {
  const key = provider.getKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) headers["Authorization"] = `Bearer ${key}`;

  const body: Record<string, unknown> = {
    model: provider.model,
    messages,
    max_tokens: maxTokens,
    stream: true,
    temperature,
    ...(provider.extraBody ?? {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const resp = await fetch(provider.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok || !resp.body) {
      logger.warn({ provider: provider.name, status: resp.status }, "Provider failed");
      return false;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let fullText = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw);
            const chunk =
              parsed.choices?.[0]?.delta?.content ??
              parsed.choices?.[0]?.message?.content ??
              "";
            if (chunk) {
              fullText += chunk;
              callbacks.onChunk(chunk);
            }
          } catch {}
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (fullText.trim().length > 10) {
      callbacks.onDone(fullText);
      logger.info({ provider: provider.name, chars: fullText.length }, "Provider success");
      return true;
    }
    return false;
  } catch (err: unknown) {
    clearTimeout(timeout);
    const isAbort = err instanceof Error && err.name === "AbortError";
    logger.warn({ provider: provider.name, err: isAbort ? "timeout" : String(err) }, "Provider error");
    return false;
  }
}

/**
 * Stream a chat completion through the provider chain.
 * Never throws — falls back to static text on total failure.
 */
export async function streamAIChat(
  messages: AIChatMessage[],
  callbacks: AIStreamCallbacks,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<boolean> {
  const maxTokens = options.maxTokens ?? 2048;
  const temperature = options.temperature ?? 0.7;
  const providers = buildProviders();

  for (const provider of providers) {
    logger.info({ provider: provider.name }, "Trying provider");
    const ok = await tryStreamProvider(provider, messages, maxTokens, temperature, callbacks);
    if (ok) return true;
  }

  // All providers exhausted — invoke static fallback
  callbacks.onError("All providers unavailable");
  return false;
}

/** Set SSE response headers */
export function setSSEHeaders(res: any) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
}

/**
 * Stream an AI response directly to an Express SSE response.
 * Guarantees the response is always closed — never leaves the client hanging.
 * Uses the built-in Islamic fallback if all providers fail.
 */
export async function streamToResponse(
  res: any,
  messages: AIChatMessage[],
  options: { maxTokens?: number; temperature?: number; fallback?: string } = {}
): Promise<string> {
  if (!res.headersSent) setSSEHeaders(res);

  let fullText = "";

  const ok = await streamAIChat(
    messages,
    {
      onChunk: (chunk) => {
        fullText += chunk;
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      },
      onDone: () => {},
      onError: () => {},
    },
    options
  );

  if (!ok || fullText.trim().length < 10) {
    const fallback =
      options.fallback ??
      "Bismillah. I am your Al Bayaan AI Teacher. I am here to help you with Quran recitation, Tajweed rules, Hifdh memorization, and Islamic studies. Please ask me your question and I will do my best to assist you, insha'Allah.";
    res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
    fullText = fallback;
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
  return fullText;
}
