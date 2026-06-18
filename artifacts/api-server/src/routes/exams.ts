import { Router } from "express";
import { db, examsTable, examResultsTable, profilesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { streamToResponse, setSSEHeaders } from "../lib/aiProvider";

const router = Router();

router.get("/exams", requireAuth, async (req: any, res) => {
  try {
    const rows = await db.select().from(examsTable)
      .where(eq(examsTable.isPublished, true))
      .orderBy(desc(examsTable.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list exams");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/exams/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, id)).limit(1);
    if (!exam) { res.status(404).json({ error: "Exam not found" }); return; }
    res.json(exam);
  } catch (err) {
    logger.error({ err }, "Failed to get exam");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/exams", requireAuth, async (req: any, res) => {
  try {
    const { title, description, type, subject, surahId, fromAyah, toAyah, totalMarks, passingMarks, durationMinutes, questions } = req.body;
    const [exam] = await db.insert(examsTable).values({
      title, description, type: type || "written", subject: subject || "quran",
      surahId, fromAyah, toAyah,
      totalMarks: totalMarks || 100, passingMarks: passingMarks || 60,
      durationMinutes: durationMinutes || 30,
      questions,
      createdBy: req.userId,
    }).returning();
    res.status(201).json(exam);
  } catch (err) {
    logger.error({ err }, "Failed to create exam");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/exams/:id/publish", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [exam] = await db.update(examsTable).set({ isPublished: true }).where(eq(examsTable.id, id)).returning();
    res.json(exam);
  } catch (err) {
    logger.error({ err }, "Failed to publish exam");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/exams/:id/start", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, id)).limit(1);
    if (!exam) { res.status(404).json({ error: "Exam not found" }); return; }
    const [result] = await db.insert(examResultsTable).values({
      examId: id, userId: req.userId,
      totalMarks: exam.totalMarks,
    }).returning();
    res.status(201).json(result);
  } catch (err) {
    logger.error({ err }, "Failed to start exam");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/exams/:id/submit", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { resultId, answers } = req.body;
    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, id)).limit(1);
    if (!exam) { res.status(404).json({ error: "Exam not found" }); return; }

    const questions = (exam.questions as any[]) ?? [];
    let score = 0;
    const feedback: Record<string, unknown>[] = [];

    for (const q of questions) {
      const studentAnswer = (answers as Record<string, unknown>)?.[q.id] ?? "";
      const isCorrect = String(studentAnswer).toLowerCase().trim() === String(q.answer).toLowerCase().trim();
      if (isCorrect) score += q.marks ?? 1;
      feedback.push({ questionId: q.id, correct: isCorrect, studentAnswer, correctAnswer: q.answer });
    }

    const totalQ = questions.length;
    const percentage = totalQ > 0 ? Math.round((score / exam.totalMarks) * 100) : 0;
    const passed = percentage >= exam.passingMarks;

    const [updated] = await db.update(examResultsTable)
      .set({ answers, score, passed, feedback, submittedAt: new Date(), gradedAt: new Date() })
      .where(and(eq(examResultsTable.id, resultId ?? 0), eq(examResultsTable.userId, req.userId)))
      .returning();

    res.json({ ...updated, percentage });
  } catch (err) {
    logger.error({ err }, "Failed to submit exam");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/exams/:id/evaluate", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { answers, recitationText } = req.body;
    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, id)).limit(1);
    if (!exam) { res.status(404).json({ error: "Exam not found" }); return; }

    const prompt = `Evaluate this student's exam submission for "${exam.title}" (${exam.subject} exam):

Student Answers/Recitation:
${recitationText || JSON.stringify(answers)}

Exam Details:
- Subject: ${exam.subject}
- Total Marks: ${exam.totalMarks}
- Passing Marks: ${exam.passingMarks}

Provide:
1. Detailed feedback on each answer
2. Score justification
3. Areas of strength
4. Areas needing improvement
5. Specific advice for improvement
6. Encouragement and motivation

Be specific, constructive, and encouraging.`;

    const messages = [
      { role: "system" as const, content: "You are a compassionate Islamic educator evaluating student exams at Al Bayaan Academy. Provide detailed, constructive, and encouraging feedback." },
      { role: "user" as const, content: prompt },
    ];

    setSSEHeaders(res);
    await streamToResponse(res, messages, { maxTokens: 1024, temperature: 0.6 });
  } catch (err) {
    logger.error({ err }, "Failed to evaluate exam");
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/exam-results", requireAuth, async (req: any, res) => {
  try {
    const rows = await db.select().from(examResultsTable)
      .where(eq(examResultsTable.userId, req.userId))
      .orderBy(desc(examResultsTable.startedAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list exam results");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
