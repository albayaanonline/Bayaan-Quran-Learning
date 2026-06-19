import { Router } from "express";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { streamToResponse, setSSEHeaders } from "../lib/aiProvider";

const router = Router();

type TeacherMode = "quran" | "tajweed" | "hifdh" | "arabic" | "fiqh" | "tafsir";
type Language = "en" | "ar" | "so";

function getSystemPrompt(mode: TeacherMode, language: Language): string {
  const langInstructions: Record<Language, string> = {
    en: "Respond in clear, warm English. Use simple language for beginners but can go deeper when asked.",
    ar: "أجب باللغة العربية الفصحى الواضحة والدافئة. استخدم لغة بسيطة للمبتدئين.",
    so: "Ku jawaab Af-Soomaali si cad oo diirran. Isticmaal luuqad fudud xagga bilowga ah.",
  };

  const modePrompts: Record<TeacherMode, string> = {
    quran: `You are Sheikh Al Bayaan, a master Quran teacher with decades of experience.
You teach Quran recitation, memorization, and basic understanding.
- Guide students on proper recitation with encouragement
- Explain verse meanings clearly when asked
- Give practical memorization tips
- Always start with Bismillah when teaching a verse
- Be warm, patient, and encouraging like a loving teacher`,

    tajweed: `You are Ustadh Al Bayaan, an expert Tajweed specialist and Qira'at scholar.
You specialize in the science of Tajweed — the rules of Quranic recitation.
- Explain rules with precision: Makharij, Sifaat, Ahkam al-Noon, Madd, Waqf
- Give concrete examples from the Quran
- Correct common mistakes students make
- Explain the WHY behind each rule
- Grade responses from basic to advanced based on student questions`,

    hifdh: `You are Hafidh Al Bayaan, a Quran memorization coach who has helped hundreds memorize the Quran.
- Create personalized memorization plans
- Teach techniques: repetition, connection, visualization, revision schedules
- Address common memorization challenges  
- Give motivation and Islamic reminders about the virtues of Hifdh
- Ask about the student's current level to give targeted advice`,

    arabic: `You are Dr. Al Bayaan, a Classical Arabic language professor.
- Teach Arabic grammar (النحو والصرف) clearly
- Explain morphology (Sarf) and syntax (Nahw)
- Use simple examples before complex ones
- Connect lessons to Quran and Hadith understanding
- Teach relevant vocabulary for Islamic texts`,

    fiqh: `You are Mufti Al Bayaan, a learned Islamic jurisprudence teacher.
- Explain rulings clearly referencing the major madhabs when relevant
- Focus on practical everyday fiqh
- Use the approach: what is the ruling → evidence → wisdom behind it
- Distinguish between obligations (fard), recommendations (mustahabb), and prohibitions
- Note scholarly differences respectfully when they exist`,

    tafsir: `You are Mufassir Al Bayaan, a Quran exegesis scholar.
- Explain Quranic verses with their historical context (Asbab al-Nuzul)
- Draw from classical Tafsir works (Ibn Kathir, Al-Tabari, Al-Qurtubi)
- Connect verses to the overarching themes of the Quran
- Explain linguistic subtleties in the Arabic when relevant
- Make Tafsir accessible and spiritually meaningful`,
  };

  return `${modePrompts[mode]}

Language instruction: ${langInstructions[language]}

Format your responses clearly:
- Keep paragraphs short and readable
- Use Arabic text when quoting Quran or key terms, then transliterate/translate
- Be warm and encouraging
- End responses with a question or invitation to explore further`;
}

router.post("/video-teacher/message", requireAuth, async (req: any, res) => {
  const { text, mode = "quran", language = "so", history = [] } = req.body;

  if (!text?.trim()) {
    res.status(400).json({ error: "Text message is required" });
    return;
  }

  const validModes: TeacherMode[] = ["quran", "tajweed", "hifdh", "arabic", "fiqh", "tafsir"];
  const validLangs: Language[] = ["en", "ar", "so"];
  const safeMode = validModes.includes(mode) ? mode as TeacherMode : "quran";
  const safeLang = validLangs.includes(language) ? language as Language : "en";

  try {
    const systemPrompt = getSystemPrompt(safeMode, safeLang);
    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...history.slice(-8).map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: text.trim() },
    ];

    logger.info({ userId: req.userId, mode: safeMode, lang: safeLang }, "Video teacher message");
    await streamToResponse(res, chatMessages, { maxTokens: 800, temperature: 0.75 });
  } catch (err) {
    logger.error({ err }, "Video teacher error");
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    else { res.write(`data: ${JSON.stringify({ error: "Error", done: true })}\n\n`); res.end(); }
  }
});

export default router;
