import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { transcribeAudio } from "../lib/whisperTranscribe";
import { analyzeRecitation } from "../lib/quranCorrection";
import { logger } from "../lib/logger";

const router = Router();

function removeArabicDiacritics(text: string): string {
  return text
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\u0670/g, "")
    .replace(/\u0640/g, "")
    .replace(/[\u06D6-\u06DC]/g, "")
    .replace(/[\u06DF-\u06E8]/g, "")
    .replace(/[\u06EA-\u06ED]/g, "")
    .replace(/[﴾﴿\u06D6\u06D7\u06D8\u06D9\u06DA\u06DB]/g, "")
    .trim();
}

function normalizeArabic(text: string): string {
  return removeArabicDiacritics(text)
    .replace(/آ/g, "ا")
    .replace(/أ/g, "ا")
    .replace(/إ/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

type WordStatus = "correct" | "missing" | "extra";

function computeWordStatuses(
  originalRefWords: string[],
  correctNormWords: string[],
  missingNormWords: string[]
): WordStatus[] {
  const statuses: WordStatus[] = [];
  let cIdx = 0;
  let mIdx = 0;

  for (const word of originalRefWords) {
    const norm = normalizeArabic(word);
    if (cIdx < correctNormWords.length && correctNormWords[cIdx] === norm) {
      statuses.push("correct");
      cIdx++;
    } else if (mIdx < missingNormWords.length && missingNormWords[mIdx] === norm) {
      statuses.push("missing");
      mIdx++;
    } else {
      statuses.push("missing");
    }
  }

  return statuses;
}

router.post("/mushaf-recitation/analyze", requireAuth, async (req: any, res) => {
  try {
    const { audioBase64, mimeType, referenceText, pageNumber, scope } = req.body;

    if (!audioBase64 || typeof audioBase64 !== "string") {
      res.status(400).json({ error: "audioBase64 is required" });
      return;
    }
    if (!referenceText || typeof referenceText !== "string" || !referenceText.trim()) {
      res.status(400).json({ error: "referenceText is required" });
      return;
    }

    logger.info({ userId: req.userId, pageNumber, scope }, "Mushaf recitation: transcribing audio");

    const transcriptionResult = await transcribeAudio(audioBase64, mimeType || "audio/webm");

    const attemptKey = `mushaf-p${pageNumber ?? 0}-${Date.now()}`;

    const transcribedText = transcriptionResult.success ? transcriptionResult.text : "";
    const correction = analyzeRecitation(referenceText, transcribedText, attemptKey);

    const originalRefWords = referenceText
      .split(/\s+/)
      .filter((w) => w.length > 0);

    const wordStatuses = computeWordStatuses(
      originalRefWords,
      correction.correctWords,
      correction.missingWords
    );

    logger.info(
      {
        userId: req.userId,
        model: transcriptionResult.model,
        accuracy: correction.accuracyScore,
        transcribed: transcribedText.slice(0, 60),
      },
      "Mushaf recitation: analysis complete"
    );

    res.json({
      transcription: {
        text: transcriptionResult.text,
        success: transcriptionResult.success,
        model: transcriptionResult.model,
        confidence: transcriptionResult.confidence,
        error: transcriptionResult.error ?? null,
        providerErrors: transcriptionResult.providerErrors,
      },
      correction,
      referenceWords: originalRefWords,
      wordStatuses,
      referenceText,
    });
  } catch (err) {
    logger.error({ err }, "Mushaf recitation analyze error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
