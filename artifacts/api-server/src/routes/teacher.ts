import { Router } from "express";
import { db, conversationsTable, messagesTable, recordingsTable } from "@workspace/db";
import { eq, and, asc, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";
const HF_API = "https://api-inference.huggingface.co/v1/chat/completions";

type TeacherMode = "general" | "tajweed" | "hifdh" | "tafsir";

const SYSTEM_PROMPTS: Record<TeacherMode, string> = {
  general: `You are Al Bayaan AI Quran Teacher — a knowledgeable, patient Islamic scholar and Quran educator.

Your expertise includes:
- Quranic Arabic and proper recitation (Tajweed)
- Tajweed rules: Ghunnah, Madd, Qalqalah, Ikhfa, Idgham, Iqlab, Makharij al-Huruf
- Tafsir (Quran interpretation and exegesis) from classical scholars (Ibn Kathir, Al-Tabari, Al-Qurtubi)
- Hifdh (memorization techniques, retention methods, scheduling)
- Islamic knowledge, fiqh basics, and Islamic history

Guidelines:
- Be respectful, encouraging, and patient
- Give accurate, scholarly information
- Reference specific Surah and Ayah numbers (e.g., Al-Baqarah 2:255)
- Explain Tajweed rules clearly with Arabic letter examples
- Keep responses clear and structured (2-4 paragraphs)
- When citing Quran: "Surah [Name] [Chapter:Verse]"
- Begin with Bismillah or Islamic greeting on new topics
- Encourage daily recitation and review`,

  tajweed: `You are Al Bayaan AI Tajweed Specialist — a master of Quranic recitation rules.

FOCUS EXCLUSIVELY on Tajweed rules. You are the world's most patient and detailed Tajweed teacher.

Your Tajweed expertise:
- Makharij al-Huruf (articulation points of every Arabic letter)
- Sifat al-Huruf (characteristics: Jahr/Hams, Shidda/Rikhwa, Isti'la/Istifal, etc.)
- Noon Sakinah & Tanwin rules: Idgham (with/without ghunnah), Ikhfa, Iqlab, Izhar
- Meem Sakinah rules: Idgham Shafawi, Ikhfa Shafawi, Izhar Shafawi
- Ghunnah (nasalization) — cases and duration
- Madd rules: Tabi'i, Muttasil, Munfasil, Lazim, Arid Lissukun, Lin
- Qalqalah letters (ق ط ب ج د) and their levels (minor/major)
- Waqf (stopping) and Ibtida (starting) rules
- Lam Shamsiyya and Lam Qamariyya
- Tafkhim (heavy) and Tarqiq (light) letters

When explaining:
1. State the rule name (Arabic + transliteration)
2. Give the definition
3. Show examples from actual Quranic verses
4. Explain how to physically produce the sound
5. Give practice tips

Always cite verse references for examples.`,

  hifdh: `You are Al Bayaan AI Hifdh Coach — a specialist in Quran memorization and retention.

FOCUS EXCLUSIVELY on memorization strategies, schedules, and motivation.

Your Hifdh expertise:
- Traditional Hifdh methods (Khaleeji, Egyptian, Pakistani, Turkish methods)
- Spaced Repetition for Quran (daily new + daily review ratio)
- Memory palace / visualization techniques adapted for Arabic
- Chunking strategies (by ayah, by rub', by half-page)
- Understanding before memorizing (meaning-based memory)
- Dealing with similar verses (mutashabihat)
- Maintaining previously memorized portions
- Building a sustainable daily schedule
- Recovery from forgetting / weak spots
- Emotional and spiritual motivation

When creating plans:
1. Assess the student's current level and available time
2. Create realistic daily, weekly, and monthly targets
3. Include both new memorization and review
4. Recommend specific techniques for their challenges
5. Include motivational reminders

Give specific, actionable advice with concrete schedules.`,

  tafsir: `You are Al Bayaan AI Tafsir Scholar — a specialist in Quranic interpretation and meaning.

FOCUS EXCLUSIVELY on Tafsir, meaning, context, and wisdom of Quranic verses.

Your Tafsir expertise:
- Classical Tafsir works: Ibn Kathir, Al-Tabari, Al-Qurtubi, Al-Sa'di, Maududi
- Asbab al-Nuzul (occasions/reasons for revelation)
- Linguistic analysis of Quranic Arabic
- Thematic tafsir (connections between verses/surahs)
- Scientific and contemporary interpretation
- Stories of the Prophets in the Quran
- Quran and modern life application

When explaining a verse:
1. Quote the Arabic text
2. Provide accurate English translation
3. Explain the historical context (asbab al-nuzul if applicable)
4. Give the main scholarly interpretations
5. Explain practical lessons for modern Muslims
6. Note connections to other related verses

Be academically rigorous yet accessible.`,
};

function buildSystemPrompt(mode: TeacherMode, language: string, weakAreas?: string): string {
  const basePrompt = SYSTEM_PROMPTS[mode];

  const languageInstruction =
    language === "ar" ? "\n\nIMPORTANT: You MUST respond in Arabic (العربية) only, unless the student explicitly writes in another language." :
    language === "so" ? "\n\nIMPORTANT: You MUST respond in Somali (Af Soomaali) only, unless the student explicitly writes in another language." :
    "\n\nRespond in the same language the student uses (English, Arabic, or Somali). Default to English.";

  const weakAreasContext = weakAreas
    ? `\n\n## Student's Known Weak Areas (from their recordings):\n${weakAreas}\n\nUse this context to personalize your responses and proactively address these specific issues.`
    : "";

  return basePrompt + languageInstruction + weakAreasContext;
}

async function streamHuggingFace(
  res: any,
  chatMessages: any[],
  onComplete: (text: string) => Promise<void>
) {
  if (!HF_TOKEN) {
    const msg = "Assalamu Alaikum! I'm your Al Bayaan AI Teacher. To enable AI responses, please add your HuggingFace API token (HF_TOKEN) in the environment settings. Get a free token at huggingface.co/settings/tokens. Once configured, I can answer all your Quran, Tajweed, Tafsir, and Hifdh questions!";
    await onComplete(msg);
    res.write(`data: ${JSON.stringify({ content: msg })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    return;
  }

  let hfResponse: Response;
  try {
    hfResponse = await fetch(HF_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${HF_TOKEN}` },
      body: JSON.stringify({ model: HF_MODEL, messages: chatMessages, max_tokens: 8192, stream: true, temperature: 0.7 }),
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
          if (chunk) { fullContent += chunk; res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`); }
        } catch {}
      }
    }
  } finally {
    reader.releaseLock();
  }

  await onComplete(fullContent);
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
}

router.get("/teacher/conversations", requireAuth, async (req: any, res) => {
  try {
    const convs = await db.select().from(conversationsTable)
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
    const [conv] = await db.insert(conversationsTable)
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
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [conv] = await db.select().from(conversationsTable)
      .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, req.userId)))
      .limit(1);
    if (!conv) { res.status(404).json({ error: "Not found" }); return; }
    const msgs = await db.select().from(messagesTable)
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
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(messagesTable).where(eq(messagesTable.conversationId, id));
    await db.delete(conversationsTable)
      .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, req.userId)));
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/teacher/conversations/:id/messages", requireAuth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { content, mode = "general", language = "en" } = req.body;

  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "content is required" });
    return;
  }

  try {
    const [conv] = await db.select().from(conversationsTable)
      .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, req.userId)))
      .limit(1);
    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

    await db.insert(messagesTable).values({ conversationId: id, role: "user", content });

    const history = await db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(asc(messagesTable.createdAt));

    const weakAreas = await buildWeakAreasContext(req.userId);
    const systemPrompt = buildSystemPrompt(mode as TeacherMode, language, weakAreas);

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    await streamHuggingFace(res, chatMessages, async (fullContent) => {
      if (fullContent) {
        await db.insert(messagesTable).values({ conversationId: id, role: "assistant", content: fullContent });
      }
    });
  } catch (err) {
    logger.error({ err }, "Teacher chat error");
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    else { res.write(`data: ${JSON.stringify({ error: "Stream error", done: true })}\n\n`); res.end(); }
  }
});

async function buildWeakAreasContext(userId: string): Promise<string | undefined> {
  try {
    const recentRecs = await db.select().from(recordingsTable)
      .where(eq(recordingsTable.userId, userId))
      .orderBy(desc(recordingsTable.createdAt))
      .limit(10);

    if (recentRecs.length === 0) return undefined;

    const tajweedErrors: Record<string, number> = {};
    let lowAccuracyCount = 0;
    let avgScore = 0;

    for (const rec of recentRecs) {
      const fb = rec.feedback as any;
      if (!fb) continue;
      if ((fb.accuracyScore ?? 0) < 70) lowAccuracyCount++;
      avgScore += fb.overallScore ?? 0;
      const rules = fb.tajweedRules ?? [];
      for (const rule of rules) {
        if (!rule.found) {
          tajweedErrors[rule.name] = (tajweedErrors[rule.name] ?? 0) + 1;
        }
      }
    }

    avgScore = Math.round(avgScore / recentRecs.length);
    const topErrors = Object.entries(tajweedErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => `${name} (missed ${count} times)`);

    const parts: string[] = [];
    if (avgScore > 0) parts.push(`Overall average score: ${avgScore}%`);
    if (lowAccuracyCount > 0) parts.push(`Low accuracy in ${lowAccuracyCount} of last ${recentRecs.length} recordings`);
    if (topErrors.length > 0) parts.push(`Most missed Tajweed rules: ${topErrors.join(", ")}`);

    return parts.length > 0 ? parts.join("\n") : undefined;
  } catch {
    return undefined;
  }
}

router.get("/teacher/weak-areas", requireAuth, async (req: any, res) => {
  try {
    const recentRecs = await db.select().from(recordingsTable)
      .where(eq(recordingsTable.userId, req.userId))
      .orderBy(desc(recordingsTable.createdAt))
      .limit(20);

    if (recentRecs.length === 0) {
      res.json({ message: "No recordings yet. Start reciting to get personalized feedback!", weakAreas: [], avgScore: 0, totalRecordings: 0 });
      return;
    }

    const tajweedErrors: Record<string, number> = {};
    const wordErrors: string[] = [];
    let totalScore = 0, scoredCount = 0;

    for (const rec of recentRecs) {
      const fb = rec.feedback as any;
      if (!fb) continue;
      if (fb.overallScore > 0) { totalScore += fb.overallScore; scoredCount++; }
      const rules = fb.tajweedRules ?? [];
      for (const rule of rules) {
        if (!rule.found) tajweedErrors[rule.name] = (tajweedErrors[rule.name] ?? 0) + 1;
      }
      const incorrect = fb.incorrectWords ?? [];
      for (const w of incorrect.slice(0, 3)) {
        if (typeof w === "string" && w.length > 0) wordErrors.push(w);
      }
    }

    const weakAreas = Object.entries(tajweedErrors)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ rule: name, missedCount: count, percentage: Math.round((count / recentRecs.length) * 100) }));

    const frequentWordErrors = [...new Set(wordErrors)].slice(0, 5);

    res.json({
      avgScore: scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0,
      totalRecordings: recentRecs.length,
      weakAreas,
      frequentWordErrors,
      message: weakAreas.length > 0
        ? `Focus areas: ${weakAreas.slice(0, 2).map(w => w.rule).join(", ")}`
        : "Great job! No consistent Tajweed issues detected.",
    });
  } catch (err) {
    logger.error({ err }, "Failed to get weak areas");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
