import { Router } from "express";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import { eq, and, asc, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";
const HF_API = "https://api-inference.huggingface.co/v1/chat/completions";

const SYSTEM_PROMPT = `You are Al Bayaan AI Quran Teacher — a knowledgeable, patient Islamic scholar and Quran educator.

Your expertise includes:
- Quranic Arabic and proper recitation (Tajweed)
- Tajweed rules: Ghunnah, Madd, Qalqalah, Ikhfa, Idgham, Iqlab, Makharij
- Tafsir (Quran interpretation and exegesis)
- Hifdh (memorization techniques and methods)
- Islamic knowledge, fiqh basics, and Islamic history

Guidelines:
- Be respectful, encouraging, and patient
- Give accurate, scholarly information
- Reference specific Surah and Ayah numbers (e.g., Al-Baqarah 2:255)
- Explain Tajweed rules clearly with Arabic letter examples
- Respond in the same language the student uses (English, Arabic, or Somali)
- Keep responses clear and structured (2-4 paragraphs)
- When citing Quran: "Surah [Name] [Chapter:Verse]"
- Always begin with Bismillah or a short Islamic greeting when starting a new topic
- Encourage daily recitation and review`;

router.get("/teacher/conversations", requireAuth, async (req: any, res) => {
  try {
    const convs = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.userId, req.userId))
      .orderBy(desc(conversationsTable.createdAt));
    res.json(convs);
  } catch (err) {
    logger.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/teacher/conversations", requireAuth, async (req: any, res) => {
  try {
    const { title } = req.body;
    const [conv] = await db
      .insert(conversationsTable)
      .values({ userId: req.userId, title: title || "New Chat" })
      .returning();
    res.status(201).json(conv);
  } catch (err) {
    logger.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/teacher/conversations/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, req.userId)))
      .limit(1);
    if (!conv) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(asc(messagesTable.createdAt));
    res.json({ ...conv, messages: msgs });
  } catch (err) {
    logger.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/teacher/conversations/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(messagesTable).where(eq(messagesTable.conversationId, id));
    await db
      .delete(conversationsTable)
      .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, req.userId)));
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/teacher/conversations/:id/messages", requireAuth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const { content } = req.body;

  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "content is required" });
    return;
  }

  try {
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, req.userId)))
      .limit(1);
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db.insert(messagesTable).values({ conversationId: id, role: "user", content });

    const history = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(asc(messagesTable.createdAt));

    const chatMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (!HF_TOKEN) {
      const fallback =
        "Assalamu Alaikum! I'm your Al Bayaan AI Quran Teacher. To enable AI responses, please add your HuggingFace API token (HF_TOKEN) in the environment settings. Get a free token at huggingface.co/settings/tokens — it's free and takes only a minute to set up. Once configured, I can answer your Quran, Tajweed, Tafsir, and Hifdh questions!";
      await db.insert(messagesTable).values({ conversationId: id, role: "assistant", content: fallback });
      res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    let hfResponse: Response;
    try {
      hfResponse = await fetch(HF_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HF_TOKEN}`,
        },
        body: JSON.stringify({
          model: HF_MODEL,
          messages: chatMessages,
          max_tokens: 8192,
          stream: true,
          temperature: 0.7,
        }),
      });
    } catch (fetchErr) {
      logger.error({ fetchErr }, "HF API fetch error");
      res.write(`data: ${JSON.stringify({ error: "AI service unavailable" })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      logger.warn({ status: hfResponse.status, errText }, "HF API error");
      res.write(`data: ${JSON.stringify({ error: `AI error ${hfResponse.status}` })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    const reader = hfResponse.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let buf = "";

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
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) {
              fullContent += chunk;
              res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            }
          } catch {}
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (fullContent) {
      await db.insert(messagesTable).values({ conversationId: id, role: "assistant", content: fullContent });
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    logger.error({ err }, "Teacher chat error");
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error", done: true })}\n\n`);
      res.end();
    }
  }
});

export default router;
