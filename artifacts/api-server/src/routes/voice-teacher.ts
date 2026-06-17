import { Router } from "express";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { transcribeAudio } from "../lib/whisperTranscribe";

const router = Router();

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";
const HF_API = "https://api-inference.huggingface.co/v1/chat/completions";

const VOICE_SYSTEM_PROMPT = `You are Al Bayaan AI Voice Quran Teacher — a warm, conversational Quran educator speaking in real-time voice conversation.

Rules for voice responses:
- Keep responses SHORT (2-4 sentences maximum) — this is a VOICE conversation
- Be conversational and warm, like a real teacher
- No markdown, no bullet points, no headers — plain natural speech
- After answering, ask a short follow-up question to keep the conversation going
- If the student recites Quran, give immediate feedback on their recitation
- Always start with a short acknowledgment (e.g., "Good question!", "Mashallah!", "Let me explain...")
- Speak as if you're sitting with the student in person

Your expertise: Tajweed, Hifdh, Tafsir, Islamic knowledge, Quran recitation feedback.`;

router.post("/voice-teacher/message", requireAuth, async (req: any, res) => {
  const { audioBase64, audioMimeType, text, history = [] } = req.body;

  if (!audioBase64 && !text) {
    res.status(400).json({ error: "Either audioBase64 or text is required" });
    return;
  }

  try {
    let userText = text || "";

    if (audioBase64 && audioBase64.length > 100) {
      logger.info({ userId: req.userId }, "Voice teacher: transcribing audio");
      const result = await transcribeAudio(audioBase64, audioMimeType || "audio/webm");
      if (result.success && result.text.trim()) {
        userText = result.text;
        logger.info({ transcribed: userText }, "Voice teacher: transcription success");
      } else {
        logger.warn({ error: result.error }, "Voice teacher: transcription failed");
        if (!text) {
          res.json({ transcribedText: "", response: "I couldn't hear you clearly. Could you try again? Make sure your microphone is working and speak clearly.", done: true });
          return;
        }
      }
    }

    if (!userText.trim()) {
      res.json({ transcribedText: "", response: "I didn't catch that. Could you please repeat?", done: true });
      return;
    }

    const chatMessages = [
      { role: "system", content: VOICE_SYSTEM_PROMPT },
      ...history.slice(-6).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: userText },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.write(`data: ${JSON.stringify({ transcribedText: userText })}\n\n`);

    if (!HF_TOKEN) {
      const fallback = "Assalamu Alaikum! I'm your voice Quran teacher. To enable AI responses, please add your HuggingFace token. Once configured, we can have real conversations about Quran, Tajweed, and more!";
      res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    let hfResponse: Response;
    try {
      hfResponse = await fetch(HF_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${HF_TOKEN}` },
        body: JSON.stringify({ model: HF_MODEL, messages: chatMessages, max_tokens: 512, stream: true, temperature: 0.8 }),
      });
    } catch (fetchErr) {
      logger.error({ fetchErr }, "HF API error in voice teacher");
      res.write(`data: ${JSON.stringify({ error: "AI service unavailable", done: true })}\n\n`);
      res.end();
      return;
    }

    if (!hfResponse.ok) {
      logger.warn({ status: hfResponse.status }, "HF API error in voice teacher");
      res.write(`data: ${JSON.stringify({ error: "AI error", done: true })}\n\n`);
      res.end();
      return;
    }

    const reader = hfResponse.body!.getReader();
    const decoder = new TextDecoder();
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
            if (chunk) res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
          } catch {}
        }
      }
    } finally {
      reader.releaseLock();
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    logger.error({ err }, "Voice teacher error");
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    else { res.write(`data: ${JSON.stringify({ error: "Error", done: true })}\n\n`); res.end(); }
  }
});

export default router;
