import { Router } from "express";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { transcribeAudio } from "../lib/whisperTranscribe";
import { streamToResponse, setSSEHeaders } from "../lib/aiProvider";

const router = Router();

const VOICE_SYSTEM_PROMPT = `You are Al Bayaan AI Voice Quran Teacher — a warm, knowledgeable Quran educator speaking in real-time voice conversation.

Rules for voice responses:
- Keep responses SHORT (2-4 sentences maximum) — this is a VOICE conversation
- Be conversational and warm, like a real teacher sitting with the student
- No markdown, no bullet points, no headers — plain natural speech only
- After answering, ask a short follow-up question to keep the conversation going
- If the student recites Quran, give immediate specific feedback
- Always start with a short warm acknowledgment (e.g., "Good question!", "Mashallah!", "Excellent point!")

Your expertise: Tajweed rules, Hifdh memorization, Tafsir, Islamic knowledge, Quran recitation feedback.`;

router.post("/voice-teacher/message", requireAuth, async (req: any, res) => {
  const { audioBase64, audioMimeType, text, history = [] } = req.body;

  if (!audioBase64 && !text) {
    res.status(400).json({ error: "Either audioBase64 or text is required" });
    return;
  }

  try {
    let userText = text || "";

    if (audioBase64 && audioBase64.length > 100) {
      logger.info({ userId: req.userId }, "Voice teacher: transcribing audio via Whisper");
      const result = await transcribeAudio(audioBase64, audioMimeType || "audio/webm");

      if (result.success && result.text.trim()) {
        userText = result.text;
        logger.info({ model: result.model, transcribed: userText }, "Voice teacher: transcription success");
      } else {
        logger.warn({ error: result.error, model: result.model }, "Voice teacher: all transcription providers failed");

        if (!text) {
          setSSEHeaders(res);
          res.write(`data: ${JSON.stringify({ transcribedText: "" })}\n\n`);
          const diagMsg = result.error?.includes("Model loading")
            ? `The speech recognition model is warming up (${result.error}). Please try again in 30 seconds, or type your message using the text box.`
            : result.error?.includes("too short")
              ? "The recording was too short. Please hold the button and speak for at least 2 seconds."
              : "Speech-to-text is temporarily unavailable (all providers busy). Please type your question in the text box, or try again in a moment.";
          res.write(`data: ${JSON.stringify({ content: diagMsg, transcriptionError: true, errorDetail: result.error })}\n\n`);
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
          return;
        }
      }
    }

    if (!userText.trim()) {
      setSSEHeaders(res);
      res.write(`data: ${JSON.stringify({ transcribedText: "" })}\n\n`);
      res.write(`data: ${JSON.stringify({ content: "I didn't receive any text. Please speak again or type your question below." })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    const chatMessages = [
      { role: "system" as const, content: VOICE_SYSTEM_PROMPT },
      ...history.slice(-6).map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: userText },
    ];

    setSSEHeaders(res);
    res.write(`data: ${JSON.stringify({ transcribedText: userText })}\n\n`);

    await streamToResponse(res, chatMessages, { maxTokens: 256, temperature: 0.8 });
  } catch (err) {
    logger.error({ err }, "Voice teacher error");
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    else {
      res.write(`data: ${JSON.stringify({ content: "An unexpected error occurred. Please try again.", done: true })}\n\n`);
      res.end();
    }
  }
});

export default router;
