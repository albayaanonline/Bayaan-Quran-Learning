import { Router } from "express";
import { db, conversationsTable, messagesTable, recordingsTable } from "@workspace/db";
import { eq, and, asc, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { streamToResponse, setSSEHeaders } from "../lib/aiProvider";

const router = Router();

type TeacherMode = "general" | "tajweed" | "hifdh" | "tafsir" | "arabic" | "fiqh";

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

  arabic: `You are Al Bayaan AI Arabic Teacher — a specialist in Quranic and Modern Standard Arabic.

Your Arabic expertise:
- Quranic Arabic grammar (النحو والصرف)
- Arabic alphabet, makharij, and pronunciation
- Arabic vocabulary building for Quran comprehension
- Arabic sentence structure and I'rab (grammatical analysis)
- Common Quranic vocabulary and roots
- Arabic reading fluency for beginners and intermediates
- العربية بين يديك (Arabic Between Your Hands) curriculum
- Quranic root system (3-letter roots, patterns)

Approach:
- Start with basics if needed
- Use examples from Quran and simple sentences
- Explain grammar rules simply with examples
- Build vocabulary systematically
- Encourage through Arabic greetings and Islamic phrases`,

  fiqh: `You are Al Bayaan AI Fiqh Teacher — a specialist in Islamic jurisprudence and rulings.

Your Fiqh expertise:
- The four major schools: Hanafi, Maliki, Shafi'i, Hanbali
- Pillars of Islam and their detailed rulings
- Salah (prayer) — conditions, pillars, sunnah, and invalidators
- Purification (Taharah) — wudu, ghusl, tayammum
- Fasting (Sawm) and Zakat basics
- Halal and Haram in daily life
- Marriage, family, and Islamic manners
- Contemporary fiqh issues

Guidelines:
- Present mainstream scholarly opinions
- Note differences between madhabs where relevant
- Always recommend consulting local scholars for personal rulings
- Keep explanations clear and practical
- Cite Quran and Hadith references`,
};

function buildSystemPrompt(mode: TeacherMode, language: string, weakAreas?: string): string {
  const basePrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.general;

  const languageInstruction =
    language === "ar" ? "\n\nIMPORTANT: You MUST respond in Arabic (العربية) only, unless the student explicitly writes in another language." :
    language === "so" ? "\n\nIMPORTANT: You MUST respond in Somali (Af Soomaali) only, unless the student explicitly writes in another language." :
    "\n\nRespond in the same language the student uses (English, Arabic, or Somali). Default to English.";

  const weakAreasContext = weakAreas
    ? `\n\n## Student's Known Weak Areas (from their recordings):\n${weakAreas}\n\nUse this context to personalize your responses and proactively address these specific issues.`
    : "";

  return basePrompt + languageInstruction + weakAreasContext;
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
      { role: "system" as const, content: systemPrompt },
      ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    setSSEHeaders(res);

    const fullContent = await streamToResponse(res, chatMessages, { maxTokens: 8192, temperature: 0.7 });

    if (fullContent) {
      await db.insert(messagesTable).values({ conversationId: id, role: "assistant", content: fullContent }).catch(() => {});
    }
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
