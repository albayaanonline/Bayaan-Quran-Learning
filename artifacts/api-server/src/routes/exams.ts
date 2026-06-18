import { Router } from "express";
import { db, examsTable, examResultsTable, certificatesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { streamToResponse, setSSEHeaders } from "../lib/aiProvider";
import { createNotification } from "./notifications";

const router = Router();

function genVerificationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

router.get("/exams", requireAuth, async (req: any, res) => {
  try {
    const showAll = req.query.all === "true";
    const rows = showAll
      ? await db.select().from(examsTable).orderBy(desc(examsTable.createdAt))
      : await db.select().from(examsTable)
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

router.patch("/exams/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, type, subject, totalMarks, passingMarks, durationMinutes, questions } = req.body;
    const [exam] = await db.update(examsTable)
      .set({ title, description, type, subject, totalMarks, passingMarks, durationMinutes, questions, updatedAt: new Date() })
      .where(and(eq(examsTable.id, id), eq(examsTable.createdBy, req.userId)))
      .returning();
    if (!exam) { res.status(404).json({ error: "Exam not found or not authorized" }); return; }
    res.json(exam);
  } catch (err) {
    logger.error({ err }, "Failed to update exam");
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

router.delete("/exams/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(examsTable).where(and(eq(examsTable.id, id), eq(examsTable.createdBy, req.userId)));
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Failed to delete exam");
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
      const isCorrect = String(studentAnswer).toLowerCase().trim() === String(q.answer ?? "").toLowerCase().trim();
      if (isCorrect) score += q.marks ?? 1;
      feedback.push({ questionId: q.id, correct: isCorrect, studentAnswer, correctAnswer: q.answer });
    }

    const percentage = exam.totalMarks > 0 ? Math.round((score / exam.totalMarks) * 100) : 0;
    const passed = score >= exam.passingMarks;

    const [updated] = await db.update(examResultsTable)
      .set({ answers, score, passed, feedback, submittedAt: new Date(), gradedAt: new Date() })
      .where(and(eq(examResultsTable.id, resultId ?? 0), eq(examResultsTable.userId, req.userId)))
      .returning();

    // ── Auto-certificate on exam pass ────────────────────────────────────
    let certificate = null;
    if (passed) {
      try {
        const [cert] = await db.insert(certificatesTable).values({
          userId: req.userId,
          type: "exam_completion",
          title: `${exam.title} — Certificate of Achievement`,
          description: `Successfully completed the ${exam.subject} exam with a score of ${score}/${exam.totalMarks} (${percentage}%).`,
          subject: exam.subject ?? "quran",
          issuedBy: "Al Bayaan AI Academy",
          verificationCode: genVerificationCode(),
          examResultId: updated?.id,
          metadata: { examId: id, score, totalMarks: exam.totalMarks, percentage, passingMarks: exam.passingMarks },
        }).returning();
        certificate = cert;

        await createNotification(
          req.userId,
          "certificate_earned",
          "🏅 Certificate Earned!",
          `Congratulations! You passed "${exam.title}" and earned a certificate. Score: ${percentage}%`,
          { examId: id, certificateId: cert.id }
        );
      } catch (certErr) {
        logger.error({ certErr }, "Failed to auto-issue certificate");
      }

      await createNotification(
        req.userId,
        "exam_passed",
        "✅ Exam Passed!",
        `You passed "${exam.title}" with ${percentage}% (${score}/${exam.totalMarks}). Keep up the great work!`,
        { examId: id, score, percentage }
      );
    } else {
      await createNotification(
        req.userId,
        "exam_graded",
        "📋 Exam Results Ready",
        `Your "${exam.title}" results are in. Score: ${score}/${exam.totalMarks} (${percentage}%). Passing mark: ${exam.passingMarks}. Keep studying!`,
        { examId: id, score, percentage }
      );
    }

    res.json({ ...updated, percentage, certificate });
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
