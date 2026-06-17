import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { transcribeAudio } from "../lib/whisperTranscribe";
import { logger } from "../lib/logger";

const router = Router();

router.post("/transcribe", requireAuth, async (req: any, res) => {
  try {
    const { audioBase64, mimeType } = req.body;

    if (!audioBase64 || typeof audioBase64 !== "string") {
      res.status(400).json({ error: "audioBase64 is required" });
      return;
    }

    const result = await transcribeAudio(audioBase64, mimeType || "audio/webm");

    res.json({
      transcription: result.text,
      success: result.success,
      model: result.model,
      error: result.error ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Transcription endpoint error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
