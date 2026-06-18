/**
 * Al Bayaan AI Provider Manager
 *
 * Priority chain — fully automatic, zero student-visible config errors:
 *   1. Groq          (free tier, fast — llama3-8b-8192 / mixtral-8x7b)
 *   2. Pollinations  (100% free, no key, open-source models — streaming)
 *   3. Pollinations  (GET endpoint — simple, reliable, no streaming issues)
 *   4. HuggingFace   (free inference, no token required, rate-limited)
 *   5. Static        (built-in Islamic scholar fallback, always works)
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

  // 2. Pollinations — free, no key, open-source (streaming)
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
  const timeout = setTimeout(() => controller.abort(), 40_000);

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
 * Pollinations simple GET fallback — no streaming, returns plain text.
 * Very reliable as a final free fallback before the static response.
 */
async function tryPollinationsGet(
  messages: AIChatMessage[]
): Promise<string | null> {
  const lastUser = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
  const system = messages.find(m => m.role === "system")?.content ?? "";

  if (!lastUser) return null;

  const prompt = encodeURIComponent(lastUser);
  const sys = encodeURIComponent(system.slice(0, 600));
  const seed = Math.floor(Math.random() * 9999);

  const url = `https://text.pollinations.ai/${prompt}?model=openai&system=${sys}&seed=${seed}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);

  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) {
      logger.warn({ status: resp.status }, "Pollinations GET failed");
      return null;
    }

    const text = (await resp.text()).trim();
    logger.info({ chars: text.length }, "Pollinations GET success");
    return text.length > 10 ? text : null;
  } catch (err: unknown) {
    clearTimeout(timeout);
    logger.warn({ err: String(err) }, "Pollinations GET error");
    return null;
  }
}

/**
 * Stream a chat completion through the provider chain.
 * Never throws — falls back through GET Pollinations then static text on total failure.
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

  // All streaming providers failed — try simple GET Pollinations
  logger.info("Trying Pollinations GET fallback");
  const getResult = await tryPollinationsGet(messages);
  if (getResult) {
    callbacks.onChunk(getResult);
    callbacks.onDone(getResult);
    return true;
  }

  // Everything failed
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
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
    const fallback = options.fallback ?? buildContextualFallback(lastUserMsg);
    res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
    fullText = fallback;
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
  return fullText;
}

/**
 * Build a contextual fallback response based on what the user asked,
 * so it never returns the exact same static message every time.
 */
function buildContextualFallback(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes("tajweed") || msg.includes("ghunnah") || msg.includes("madd") || msg.includes("ikhfa")) {
    return "Tajweed is the science of reciting the Quran correctly. Key rules include Ikhfa (hiding the nun sound), Ghunnah (nasal sounds), Idgham (merging letters), and Madd (lengthening vowels). I recommend starting with the Noon Sakinah rules before moving to Madd. Which specific rule would you like to explore?";
  }
  if (msg.includes("hifdh") || msg.includes("memori") || msg.includes("memorize")) {
    return "For Quran memorization, consistency is key. Recite new verses in Fajr when the mind is fresh, and review old portions in every prayer. The rule of 3-3-3 works well: memorize 3 new verses, review the last 3 pages, and revise a Juz from older memorization. How many verses are you currently memorizing per day?";
  }
  if (msg.includes("arabic") || msg.includes("word") || msg.includes("grammar")) {
    return "Classical Arabic has a rich grammar system built around three-letter roots. Understanding root patterns helps you decode Quranic vocabulary. Start with common patterns like فَعَلَ (verb patterns) and فَاعِل (doer patterns). Would you like to start with vocabulary, grammar, or Quranic word meanings?";
  }
  if (msg.includes("surah") || msg.includes("ayah") || msg.includes("verse") || msg.includes("quran")) {
    return "The Quran is the direct word of Allah, revealed to Prophet Muhammad ﷺ over 23 years. It contains 114 Surahs and 6236 Ayat. Each Surah has a unique theme and purpose. Regular recitation with reflection (Tadabbur) brings enormous blessing. Which Surah would you like to study today?";
  }

  return "Bismillah. I am your Al Bayaan AI Teacher, here to help with Quran recitation, Tajweed rules, Hifdh memorization, and Islamic knowledge. The AI response service is temporarily busy — please ask your question again and I will answer with full detail, insha'Allah.";
}
