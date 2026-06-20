import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const FALLBACK_RESPONSES: Record<string, string> = {
  tajweed: `**Tajweed Rules — Overview:**\n\nTajweed (تجويد) means "to make beautiful" — rules governing proper Quran recitation.\n\n**Key rules:**\n1. **Noon Sakinah & Tanween**: Izhar (clear), Idgham (merging), Iqlab (conversion), Ikhfa (hiding)\n2. **Meem Sakinah**: Ikhfa Shafawi, Idgham Shafawi, Izhar Shafawi\n3. **Madd (elongation)**: Natural (2 counts), Connected & Separated (4-5 counts)\n4. **Qalqalah (echo)**: Letters ق ط ب ج د\n5. **Heavy & Light letters**: Tafkheem and Tarqeeq\n\nPractice with a qualified Sheikh and use Al Bayaan's Voice Teacher for AI feedback! 🎙️`,

  hifdh: `**Quran Memorization (Hifdh) Tips 📖**\n\n*"And We have certainly made the Quran easy for remembrance"* (54:17)\n\n**Proven techniques:**\n1. **Consistency** — Even 1-5 ayahs daily beats large irregular sessions\n2. **Repetition** — Repeat each ayah 20-30 times before moving on\n3. **Connection** — Link end of each ayah to beginning of next\n4. **Revision** — 1 new page = review 5 old pages\n5. **Morning sessions** — Mind retains best after Fajr\n6. **Understand meanings** — Helps memory significantly\n7. **Use in Salah** — Recite memorized portions in daily prayer\n\nUse Al Bayaan's Hifdh Tracker to set daily goals! 🌟`,

  fatiha: `**Surah Al-Fatiha — The Opening (الفاتحة)**\n\n*"It is the greatest Surah in the Quran"* — Prophet Muhammad ﷺ\n\n**Meaning:**\n- Ayat 1: Bismillah — Begin with Allah's name\n- Ayat 2: All praise to Allah, Lord of all worlds\n- Ayat 3: The Most Gracious, Most Merciful\n- Ayat 4: Master of the Day of Judgment\n- Ayat 5: You alone we worship, You alone we ask for help\n- Ayat 6: Guide us on the Straight Path\n- Ayat 7: Path of those You blessed, not those who went astray\n\nAl-Fatiha is recited 17 times daily in obligatory prayers! 🤲`,

  wudu: `**Wudu (Ablution) Steps 💧**\n\n1. **Intention** (Niyyah) — In your heart\n2. **Bismillah** — Say before starting\n3. **Hands** — Wash 3x up to wrists\n4. **Mouth** — Rinse 3x (Madmadah)\n5. **Nose** — Clean 3x (Istinshaq)\n6. **Face** — Wash 3x (hairline to chin)\n7. **Arms** — Right then left, up to elbows, 3x\n8. **Head** — Wipe once (front to back)\n9. **Ears** — Inside & outside with wet fingers\n10. **Feet** — Right then left, up to ankles, 3x\n\n**Wudu breaks** by: natural discharges, deep sleep, touching private parts.`,

  pillars: `**The Five Pillars of Islam 🕌**\n\n1. **Shahada** — Declaration: "No god but Allah, Muhammad is His messenger"\n2. **Salah** — 5 daily prayers: Fajr, Dhuhr, Asr, Maghrib, Isha\n3. **Zakat** — 2.5% of savings given to those in need annually\n4. **Sawm** — Fasting during Ramadan (9th Islamic month)\n5. **Hajj** — Pilgrimage to Makkah (once in a lifetime if able)\n\nMay Allah help us uphold all five pillars! 🤲`,

  default: `Assalamu Alaikum! 🌙\n\nJazakallah khair for your question. I'm your Al Bayaan AI Learning Assistant, here to support your Islamic education journey.\n\n**I can help with:**\n- Tajweed rules and pronunciation tips\n- Quran memorization (Hifdh) strategies\n- Surah meanings and Tafsir\n- Islamic studies (Fiqh, Aqeedah, Seerah)\n- Arabic language learning\n- Study planning and scheduling\n\nPlease ask me anything about your Quranic or Islamic learning, and I'll do my best to assist. May Allah bless your studies! 🤲`,
};

function buildFallback(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes("tajweed") || lower.includes("recit") || lower.includes("pronunciation")) return FALLBACK_RESPONSES.tajweed;
  if (lower.includes("hifdh") || lower.includes("memoriz") || lower.includes("hifz") || lower.includes("memoris")) return FALLBACK_RESPONSES.hifdh;
  if (lower.includes("fatiha") || lower.includes("fatihah") || lower.includes("opening surah")) return FALLBACK_RESPONSES.fatiha;
  if (lower.includes("wudu") || lower.includes("ablution") || lower.includes("purif")) return FALLBACK_RESPONSES.wudu;
  if (lower.includes("pillar") || lower.includes("shahada") || lower.includes("salah") || lower.includes("zakat") || lower.includes("sawm") || lower.includes("hajj")) return FALLBACK_RESPONSES.pillars;
  return FALLBACK_RESPONSES.default;
}

async function callHuggingFace(userMessage: string): Promise<string | null> {
  const token = process.env["HF_TOKEN"];
  if (!token) return null;

  const systemPrompt = `You are an expert Islamic education AI assistant for Al Bayaan AI Academy — a Quran learning platform. You help students learn Tajweed, Quran memorization (Hifdh), Islamic studies (Fiqh, Aqeedah, Seerah, Arabic). Be concise, accurate, and warm. Always cite Quranic verses or Hadith where relevant. Format responses with **bold** for key terms. Keep answers under 300 words. Start with a relevant Islamic greeting or du'a where appropriate.`;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `<s>[INST] ${systemPrompt}\n\nStudent question: ${userMessage} [/INST]`,
          parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
            return_full_text: false,
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      logger.warn({ status: response.status, errText }, "HuggingFace API error");
      return null;
    }

    const data = (await response.json()) as Array<{ generated_text?: string }>;
    const text = data[0]?.generated_text?.trim();
    return text && text.length > 10 ? text : null;
  } catch (err) {
    logger.warn({ err }, "HuggingFace call failed, using fallback");
    return null;
  }
}

router.post("/ai-chat", async (req, res) => {
  const { messages } = req.body as {
    messages?: Array<{ role: string; content: string }>;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array required" });
    return;
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const userContent = lastUserMsg?.content ?? "";

  try {
    const hfResponse = await callHuggingFace(userContent);
    const response = hfResponse ?? buildFallback(userContent);
    res.json({ response, source: hfResponse ? "ai" : "fallback" });
  } catch (err) {
    logger.error({ err }, "ai-chat error");
    res.json({ response: buildFallback(userContent), source: "fallback" });
  }
});

export default router;
