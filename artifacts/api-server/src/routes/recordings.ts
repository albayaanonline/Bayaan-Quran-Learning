import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db, recordingsTable, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

function generateAIFeedback(ayahText: string): any {
  // Simulated AI feedback for demonstration
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pronunciationScore = rand(68, 98);
  const fluencyScore = rand(65, 96);
  const tajweedScore = rand(60, 95);
  const accuracyScore = rand(70, 99);
  const confidenceScore = rand(65, 97);
  const overallScore = Math.round((pronunciationScore + fluencyScore + tajweedScore + accuracyScore + confidenceScore) / 5);

  const words = ayahText.split(" ").slice(0, 5);
  const correctCount = Math.floor(words.length * 0.7);
  const correctWords = words.slice(0, correctCount);
  const incorrectWords = words.slice(correctCount, correctCount + 1);
  const missingWords: string[] = [];

  const allSuggestions = [
    "Work on the pronunciation of the letter ع",
    "Practice the madd (elongation) rules",
    "Pay attention to the ghunnah on ن and م",
    "Improve the qalqalah on ق and ط",
    "Practice the idgham rule when applicable",
    "Work on breath control for longer ayahs",
    "Review the rules for waqf (stopping)",
  ];
  const suggestions = allSuggestions.sort(() => Math.random() - 0.5).slice(0, 2);

  return {
    pronunciationScore,
    fluencyScore,
    tajweedScore,
    accuracyScore,
    confidenceScore,
    overallScore,
    correctWords,
    incorrectWords,
    missingWords,
    suggestions,
    transcribedText: ayahText,
  };
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
    const rows = await db.select().from(recordingsTable)
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
    const { surahId, ayahId, ayahNumber, ayahText, durationSeconds } = req.body;
    const feedback = generateAIFeedback(ayahText ?? "");
    const inserted = await db.insert(recordingsTable).values({
      userId: req.userId,
      surahId,
      ayahId,
      ayahNumber,
      durationSeconds: durationSeconds ?? 0,
      feedback,
    }).returning();

    // Award XP for recording — raw SQL increment
    await db.execute(
      `UPDATE profiles SET xp = xp + 10 WHERE clerk_id = '${req.userId}'`
    );

    res.status(201).json(formatRecording(inserted[0]));
  } catch (err) {
    logger.error({ err }, "Failed to create recording");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/recordings/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.select().from(recordingsTable).where(eq(recordingsTable.id, id)).limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatRecording(rows[0]));
  } catch (err) {
    logger.error({ err }, "Failed to get recording");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
