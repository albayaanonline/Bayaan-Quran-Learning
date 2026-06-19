import { Router } from "express";
import { db, recordingsTable, profilesTable, surahProgressTable, parentProfilesTable, notificationsTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { transcribeAudio } from "../lib/whisperTranscribe";
import { analyzeRecitation } from "../lib/quranCorrection";
import { analyzeTajweed } from "../lib/tajweedAnalysis";
import { SURAHS } from "./surahs";

const router = Router();

/**
 * Convert raw provider error strings into a single human-readable sentence.
 * Shown on the student's screen when all STT providers fail.
 */
function deriveHumanReason(errors: string[]): string {
  if (!errors || errors.length === 0) return "Speech recognition failed for an unknown reason.";
  const joined = errors.join(" | ").toLowerCase();
  if (joined.includes("no audio") || joined.includes("too small") || joined.includes("too short")) {
    return "No audio was received. Please record for at least 2 seconds and allow microphone access.";
  }
  if (joined.includes("timed out")) {
    return "The speech recognition service timed out. Check your internet connection and try again.";
  }
  if (joined.includes("empty transcription") || joined.includes("no speech") || joined.includes("vad")) {
    return "No Arabic speech was detected. Speak clearly and close to the microphone in a quiet environment.";
  }
  if (joined.includes("groq_api_key") && joined.includes("503")) {
    return "The cloud speech service is temporarily unavailable (cold start). The local fallback also failed. Try again in 30 seconds.";
  }
  if (joined.includes("groq_api_key")) {
    return "Cloud speech recognition is not configured (no GROQ_API_KEY). The local fallback failed. Try again or add a GROQ_API_KEY secret.";
  }
  return "Speech recognition failed. Please try again in a quiet environment.";
}

/**
 * Build a structured list of which providers were attempted and their status.
 */
function buildProviderAttempts(errors: string[]): Array<{ provider: string; status: string; detail: string }> {
  const attempts: Array<{ provider: string; status: string; detail: string }> = [];
  const known = [
    { key: "groq", label: "Groq Whisper-large-v3" },
    { key: "tarteel", label: "HF tarteel-ai/whisper-large-v2-ar" },
    { key: "whisper-large-v3", label: "HF openai/whisper-large-v3" },
    { key: "faster-whisper", label: "Local faster-whisper (tiny)" },
  ];
  for (const p of known) {
    const match = (errors ?? []).find(e => e.toLowerCase().includes(p.key));
    if (match) {
      attempts.push({ provider: p.label, status: "failed", detail: match });
    }
  }
  return attempts;
}

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

    const audioBytes = audioBase64 ? Math.round(audioBase64.length * 0.75) : 0;

    // ── STEP 1: Transcribe audio (4-provider chain) ──────────────────────────
    if (!audioBase64 || audioBase64.length < 100) {
      res.status(400).json({
        transcriptionFailed: true,
        reason: "No audio received by the server.",
        providerErrors: ["No audio data in request"],
        diagnostics: { audioBytes: 0, durationSeconds: durationSeconds ?? 0 },
      });
      return;
    }

    logger.info({ surahId, ayahNumber, audioBytes }, "Starting STT chain");
    const sttResult = await transcribeAudio(audioBase64, audioMimeType || "audio/webm");

    // ── HARD GATE: no feedback from empty transcription ──────────────────────
    if (!sttResult.success || !sttResult.text || sttResult.text.trim().length === 0) {
      logger.warn({ errors: sttResult.providerErrors }, "All STT providers failed — returning failure response");
      res.status(200).json({
        transcriptionFailed: true,
        reason: deriveHumanReason(sttResult.providerErrors),
        providerErrors: sttResult.providerErrors,
        diagnostics: {
          audioBytes,
          durationSeconds: durationSeconds ?? 0,
          providersAttempted: buildProviderAttempts(sttResult.providerErrors),
        },
      });
      return;
    }

    // ── STEP 2: Correction analysis (only runs when real text exists) ─────────
    const attemptKey = `${Date.now()}_${audioBytes}_a${ayahNumber ?? 0}`;
    const correction = analyzeRecitation(ayahText ?? "", sttResult.text, attemptKey);
    const tajweed = analyzeTajweed(ayahText ?? "", correction.accuracyScore);

    const accuracyScore = correction.accuracyScore;
    const tajweedScore = tajweed.score;
    const pronunciationScore = Math.min(100, Math.round(accuracyScore * 0.85 + tajweedScore * 0.15));
    const fluencyScore = Math.min(100, Math.round(accuracyScore * 0.75 + 25));
    const confidenceScore = Math.min(100, Math.round(sttResult.confidence * 100 * 0.5 + fluencyScore * 0.5));
    const overallScore = Math.round(
      (accuracyScore + tajweedScore + pronunciationScore + fluencyScore + confidenceScore) / 5
    );

    const allSuggestions = [
      ...correction.suggestions,
      ...tajweed.suggestions,
    ].filter(Boolean).slice(0, 6);

    const feedback = {
      // ── Scores ──
      pronunciationScore,
      fluencyScore,
      tajweedScore,
      accuracyScore,
      confidenceScore,
      overallScore,
      // ── Word diff ──
      correctWords: correction.correctWords,
      incorrectWords: correction.incorrectWords,
      missingWords: correction.missingWords,
      wordStats: correction.wordStats,
      // ── AI suggestions ──
      suggestions: allSuggestions.length > 0 ? allSuggestions : ["Keep practicing!"],
      // ── Transcription info ──
      transcribedText: sttResult.text,
      transcriptionSuccess: true,
      transcriptionModel: sttResult.model,
      transcriptionConfidence: sttResult.confidence,
      // ── Tajweed ──
      presentTajweedRules: tajweed.presentRules,
      tajweedRules: tajweed.rules.filter((r) => r.found),
      // ── Diagnostics ──
      diagnostics: {
        audioDurationSeconds: durationSeconds ?? 0,
        audioBytes,
        transcriptionProvider: sttResult.model,
        transcriptionConfidence: sttResult.confidence,
        analysisLog: correction.analysisLog,
        scoreFormula: `Overall=(accuracy:${accuracyScore}+tajweed:${tajweedScore}+pronunciation:${pronunciationScore}+fluency:${fluencyScore}+confidence:${confidenceScore})/5=${overallScore}`,
      },
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

    // Async: notify any parent who has this student as a child
    if (overallScore > 0) {
      setImmediate(async () => {
        try {
          const surahName = SURAHS.find(s => s.number === surahId)?.name ?? `Surah ${surahId}`;
          const studentName = profileRows[0]?.displayName ?? "Your child";
          const parentRows = await db.select().from(parentProfilesTable);
          for (const parent of parentRows) {
            const childIds = parent.childClerkIds ?? [];
            if (!childIds.includes(req.userId)) continue;
            await db.insert(notificationsTable).values({
              userId: parent.parentClerkId,
              type: "recitation",
              title: "New Recitation Completed",
              message: `${studentName} completed Ayah ${ayahNumber} of ${surahName} with a score of ${overallScore}%.`,
              link: `/teacher-dashboard`,
              isRead: false,
            });
          }
        } catch (notifErr) {
          logger.warn({ notifErr }, "Parent notification failed (non-critical)");
        }
      });
    }
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
