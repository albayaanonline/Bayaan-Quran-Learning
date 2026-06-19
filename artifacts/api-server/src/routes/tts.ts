import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const LANG_MAP: Record<string, string> = {
  en: "en", ar: "ar", so: "so",
  "en-US": "en", "ar-SA": "ar", "so-SO": "so",
};

interface CacheEntry { buffer: Buffer; type: string; at: number }
const ttsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000;
const MAX_CACHE = 200;

function pruneCache() {
  if (ttsCache.size <= MAX_CACHE) return;
  const entries = [...ttsCache.entries()].sort((a, b) => a[1].at - b[1].at);
  for (let i = 0; i < 20 && entries[i]; i++) ttsCache.delete(entries[i][0]);
}

router.get("/tts", async (req, res) => {
  const rawText = (req.query.text as string ?? "").trim().slice(0, 300);
  const lang = LANG_MAP[req.query.lang as string ?? "en"] ?? "en";

  if (!rawText) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const cacheKey = `${lang}:${rawText}`;
  const now = Date.now();
  const cached = ttsCache.get(cacheKey);
  if (cached && now - cached.at < CACHE_TTL) {
    res.set("Content-Type", cached.type);
    res.set("Cache-Control", "public, max-age=600");
    res.set("X-TTS-Source", "cache");
    res.send(cached.buffer);
    return;
  }

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 12_000);

  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(rawText)}&tl=${lang}&client=tw-ob&ttsspeed=0.9`;
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://translate.google.com/",
        "Accept": "audio/mpeg, audio/*, */*",
      },
      signal: ctrl.signal,
    });
    clearTimeout(timeout);

    if (!upstream.ok) throw new Error(`Upstream TTS returned HTTP ${upstream.status}`);

    const contentType = upstream.headers.get("content-type") ?? "audio/mpeg";
    const buffer = Buffer.from(await upstream.arrayBuffer());

    ttsCache.set(cacheKey, { buffer, type: contentType, at: now });
    pruneCache();

    logger.info({ lang, bytes: buffer.length }, "TTS served");
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=600");
    res.set("X-TTS-Source", "google");
    res.send(buffer);
  } catch (err: any) {
    clearTimeout(timeout);
    logger.warn({ err: String(err), lang }, "TTS proxy failed");
    res.status(503).json({ error: "TTS temporarily unavailable", detail: String(err) });
  }
});

export default router;
