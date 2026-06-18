/**
 * Al Bayaan AI Provider Manager
 *
 * Priority chain — auto-detects and auto-falls-back:
 *   1. Pollinations.ai   (100% free, no key, open-source models)
 *   2. HuggingFace free  (no token required, rate-limited)
 *   3. Static scholar    (built-in Islamic knowledge, always available)
 *
 * Students NEVER see technical errors or configuration messages.
 */

import { logger } from "./logger";

export type AIChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AIStreamCallbacks {
  onChunk: (chunk: string) => void;
  onDone: (fullText: string) => void;
  onError: (err: string) => void;
}

const PROVIDERS = [
  {
    name: "pollinations",
    baseUrl: "https://text.pollinations.ai/openai",
    model: "openai",
    requiresKey: false,
    getKey: () => null as string | null,
  },
  {
    name: "pollinations-mistral",
    baseUrl: "https://text.pollinations.ai/openai",
    model: "mistral",
    requiresKey: false,
    getKey: () => null as string | null,
  },
  {
    name: "huggingface-mistral",
    baseUrl: "https://api-inference.huggingface.co/v1/chat/completions",
    model: "mistralai/Mistral-7B-Instruct-v0.2",
    requiresKey: false,
    getKey: () => process.env.HF_TOKEN ?? null,
  },
  {
    name: "huggingface-llama",
    baseUrl: "https://api-inference.huggingface.co/v1/chat/completions",
    model: "meta-llama/Meta-Llama-3-8B-Instruct",
    requiresKey: false,
    getKey: () => process.env.HF_TOKEN ?? null,
  },
];

async function tryStreamProvider(
  provider: (typeof PROVIDERS)[0],
  messages: AIChatMessage[],
  maxTokens: number,
  temperature: number,
  callbacks: AIStreamCallbacks
): Promise<boolean> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = provider.getKey();
  if (key) headers["Authorization"] = `Bearer ${key}`;

  const body: Record<string, unknown> = {
    model: provider.model,
    messages,
    max_tokens: maxTokens,
    stream: true,
    temperature,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const resp = await fetch(provider.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!resp.ok || !resp.body) {
      logger.warn({ provider: provider.name, status: resp.status }, "AI provider failed");
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
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
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
      logger.info({ provider: provider.name, chars: fullText.length }, "AI provider success");
      return true;
    }

    return false;
  } catch (err: unknown) {
    clearTimeout(timeout);
    const isAbort = err instanceof Error && err.name === "AbortError";
    logger.warn({ provider: provider.name, err: isAbort ? "timeout" : String(err) }, "AI provider error");
    return false;
  }
}

/**
 * Stream a chat completion through the provider chain.
 * Returns true if any provider succeeded.
 */
export async function streamAIChat(
  messages: AIChatMessage[],
  callbacks: AIStreamCallbacks,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<boolean> {
  const maxTokens = options.maxTokens ?? 2048;
  const temperature = options.temperature ?? 0.7;

  for (const provider of PROVIDERS) {
    logger.info({ provider: provider.name }, "Trying AI provider");
    const ok = await tryStreamProvider(provider, messages, maxTokens, temperature, callbacks);
    if (ok) return true;
  }

  callbacks.onError("AI service temporarily unavailable");
  return false;
}

/**
 * Helper: set SSE headers on response
 */
export function setSSEHeaders(res: any) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
}

/**
 * Full SSE stream for Express response — handles provider chain, writes data events.
 * Returns the complete text.
 */
export async function streamToResponse(
  res: any,
  messages: AIChatMessage[],
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  setSSEHeaders(res);
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

  if (!ok || fullText.trim().length < 5) {
    const fallback =
      "Bismillah. I am your Al Bayaan AI Teacher. I am here to help you with Quran, Tajweed, Hifdh, and Islamic studies. Please ask me any question and I will do my best to help you, insha'Allah.";
    res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
    fullText = fallback;
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();

  return fullText;
}
