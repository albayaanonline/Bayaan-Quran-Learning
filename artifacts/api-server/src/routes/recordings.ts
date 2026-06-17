import { Router } from "express";
import { db, recordingsTable, profilesTable, surahProgressTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { transcribeAudio } from "../lib/whisperTranscribe";
import { analyzeRecitation } from "../lib/quranCorrection";
import { analyzeTajweed } from "../lib/tajweedAnalysis";
import { SURAHS } from "./surahs";

const router = Router();

function formatRecording(r: any) {
  return {
    id: r.id,
    userId: r.userId,
    surahId: r.surahId,
    ayahId: r.ayahId,
    ayahNumber: r.ayahNumber,
    audioUrl: r.audioUrl ?? null,
    durationSeconds: r.durationSeconds,
    createdAt: r.createdAt,
    feedback: r.feedback ?? null,
  };
}

router.get("/recordings", requireAuth, async (req: any, res) => {
  try {
    const rows = await db
      .select()
      .from(recordingsTable)
      .where(eq(recordingsTable.userId, req.userId))
      .orderBy(desc(recordingsTable.createdAt))
      .limit(50);
    res.json(rows.map(formatRecording));
  } catch (err) {
    logger.error({ err }, "Failed to list recordings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/recordings", requireAuth, async (req: any, res) => {
  try {
    const { surahId, ayahId, ayahNumber, ayahText, audioBase64, audioMimeType, durationSeconds } = req.body;

    let transcribedText = "";
    let transcriptionSuccess = false;
    let transcriptionModel = "none";

    if (audioBase64 && audioBase64.length > 100) {
      logger.info({ surahId, ayahNumber }, "Transcribing audio with Whisper");
      const result = await transcribeAudio(audioBase64, audioMimeType || "audio/webm");
      transcribedText = result.text;
      transcriptionSuccess = result.success;
      transcriptionModel = result.model;
      if (!result.success) {
        logger.warn({ error: result.error }, "Transcription failed, using text-only analysis");
      }
    }

    const correction = analyzeRecitation(ayahText ?? "", transcribedText);
    const tajweed = analyzeTajweed(ayahText ?? "", correction.accuracyScore);

    const accuracyScore = correction.accuracyScore;
    const tajweedScore = tajweed.score;
    const pronunciationScore = Math.min(100, Math.round(accuracyScore * 0.85 + tajweedScore * 0.15));
    const fluencyScore = transcribedText.length > 0 ? Math.min(100, Math.round(accuracyScore * 0.75 + 25)) : 0;
    const confidenceScore = transcribedText.length > 0 ? Math.min(100, fluencyScore + 5) : 0;
    const overallScore =
      transcribedText.length > 0
        ? Math.round((accuracyScore + tajweedScore + pronunciationScore + fluencyScore + confidenceScore) / 5)
        : 0;

    const allSuggestions = [
      ...correction.suggestions,
      ...tajweed.suggestions,
    ].filter(Boolean).slice(0, 5);

    const feedback = {
      pronunciationScore,
      fluencyScore,
      tajweedScore,
      accuracyScore,
      confidenceScore,
      overallScore,
      correctWords: correction.correctWords,
      incorrectWords: correction.incorrectWords,
      missingWords: correction.missingWords,
      suggestions: allSuggestions.length > 0 ? allSuggestions : ["Keep practicing!"],
      transcribedText,
      transcriptionSuccess,
      transcriptionModel,
      presentTajweedRules: tajweed.presentRules,
      tajweedRules: tajweed.rules.filter((r) => r.found),
      wordStats: correction.wordStats,
    };

    const [inserted] = await db
      .insert(recordingsTable)
      .values({
        userId: req.userId,
        surahId,
        ayahId,
        ayahNumber,
        durationSeconds: durationSeconds ?? 0,
        feedback,
      })
      .returning();

    const today = new Date().toISOString().split("T")[0];
    const profileRows = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.clerkId, req.userId))
      .limit(1);

    if (profileRows.length > 0) {
      const profile = profileRows[0];
      const lastStudy = profile.lastStudyDate;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let newStreak = profile.streakDays;
      if (lastStudy !== today) {
        if (lastStudy === yesterdayStr) {
          newStreak = profile.streakDays + 1;
        } else {
          newStreak = 1;
        }
      }

      const xpGain = 10 + (overallScore >= 90 ? 20 : overallScore >= 75 ? 10 : 0);

      await db
        .update(profilesTable)
        .set({
          xp: sql`${profilesTable.xp} + ${xpGain}`,
          streakDays: newStreak,
          lastStudyDate: today,
        })
        .where(eq(profilesTable.clerkId, req.userId));
    }

    const surah = SURAHS.find((s) => s.number === surahId);
    if (surah) {
      const progressRows = await db
        .select()
        .from(surahProgressTable)
        .where(and(eq(surahProgressTable.userId, req.userId), eq(surahProgressTable.surahId, surahId)))
        .limit(1);

      if (progressRows.length === 0) {
        await db.insert(surahProgressTable).values({
          userId: req.userId,
          surahId,
          surahName: surah.name,
          completedAyahs: ayahNumber,
          totalAyahs: surah.ayahCount,
          lastStudied: new Date(),
          averageScore: overallScore > 0 ? overallScore : null,
        });
      } else {
        const prev = progressRows[0];
        const newCompleted = Math.max(prev.completedAyahs, ayahNumber);
        const prevAvg = prev.averageScore ?? 0;
        const newAvg = overallScore > 0 ? Math.round((prevAvg + overallScore) / 2) : prevAvg;
        await db
          .update(surahProgressTable)
          .set({
            completedAyahs: newCompleted,
            lastStudied: new Date(),
            averageScore: newAvg > 0 ? newAvg : null,
          })
          .where(and(eq(surahProgressTable.userId, req.userId), eq(surahProgressTable.surahId, surahId)));
      }
    }

    res.status(201).json(formatRecording(inserted));
  } catch (err) {
    logger.error({ err }, "Failed to create recording");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/recordings/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db
      .select()
      .from(recordingsTable)
      .where(and(eq(recordingsTable.id, id), eq(recordingsTable.userId, req.userId)))
      .limit(1);
    if (!rows[0]) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(formatRecording(rows[0]));
  } catch (err) {
    logger.error({ err }, "Failed to get recording");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
