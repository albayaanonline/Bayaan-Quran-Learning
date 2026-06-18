import { Router } from "express";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { streamToResponse } from "../lib/aiProvider";

const router = Router();

type ContentType = "lesson" | "quiz" | "exam" | "homework";
type Subject = "quran" | "tajweed" | "arabic" | "fiqh" | "tafsir" | "hifdh";
type Level = "beginner" | "intermediate" | "advanced";

function buildPrompt(type: ContentType, subject: Subject, level: Level, topic: string, count: number): string {
  const subjectFull: Record<Subject, string> = {
    quran: "Quran Recitation and Understanding",
    tajweed: "Tajweed Rules and Pronunciation",
    arabic: "Classical Arabic Language",
    fiqh: "Islamic Jurisprudence (Fiqh)",
    tafsir: "Quran Exegesis (Tafsir)",
    hifdh: "Quran Memorization (Hifdh)",
  };

  const levelDesc: Record<Level, string> = {
    beginner: "complete beginners with no prior knowledge",
    intermediate: "students with basic foundation knowledge",
    advanced: "advanced students with strong subject knowledge",
  };

  if (type === "lesson") {
    return `You are an expert Islamic education curriculum designer. Create a comprehensive lesson plan.

Subject: ${subjectFull[subject]}
Level: ${level} (for ${levelDesc[level]})
Topic: ${topic}

Generate a complete lesson plan with this exact structure:

# LESSON PLAN: ${topic}

## Learning Objectives
(3-5 clear, measurable objectives starting with action verbs)

## Prerequisites
(What students need to know before this lesson)

## Lesson Duration
(Estimated time in minutes)

## Introduction (10 min)
(Hook activity, connection to prior knowledge, Arabic terms introduced)

## Main Content
### Key Concepts
(Numbered list of core concepts with explanations)

### Arabic Terms
(Key Arabic terminology with transliteration and meaning)

### Quranic/Hadith Evidence
(Relevant Quran verses or Hadith, in Arabic with translation)

## Activities & Practice (15 min)
(3 hands-on activities or exercises)

## Assessment
(2-3 questions to check understanding)

## Summary
(Key takeaways in 3-5 bullet points)

## Homework
(1-2 follow-up tasks for home practice)

Make the content authentic, pedagogically sound, and appropriate for ${level} level Islamic education students.`;
  }

  if (type === "quiz") {
    return `You are an expert Islamic education assessment designer. Create a quiz.

Subject: ${subjectFull[subject]}
Level: ${level}
Topic: ${topic}
Number of questions: ${count}

Generate a complete quiz with this structure:

# QUIZ: ${topic}
**Subject:** ${subjectFull[subject]} | **Level:** ${level} | **Total Marks:** ${count * 2}

---

For each question, include:
- Question number and type (MCQ/Fill-in-blank/True-False/Short Answer)
- The question text
- For MCQ: 4 options labeled A, B, C, D
- For Fill-in-blank: sentence with _____ for blank
- Marks allocated

Then after all questions:

---
## ANSWER KEY
(List all correct answers with brief explanations)

Make sure questions test real understanding, not just memorization. Include a mix of question types. Use Arabic terms where appropriate with transliterations.`;
  }

  if (type === "exam") {
    return `You are an expert Islamic education examiner. Create a formal exam.

Subject: ${subjectFull[subject]}
Level: ${level}
Topic: ${topic}
Number of questions: ${count}

Generate a complete formal exam:

# EXAM: ${topic}
**Subject:** ${subjectFull[subject]} | **Level:** ${level}
**Duration:** ${Math.max(30, count * 3)} minutes | **Total Marks:** ${count * 5}
**Passing Mark:** ${Math.round(count * 5 * 0.6)} (60%)

---
**Instructions:**
- Answer ALL questions
- Write clearly and legibly
- Begin each section on a new line

## Section A: Multiple Choice (${Math.ceil(count / 2)} questions × 3 marks)
(MCQ questions with 4 options each)

## Section B: Short Answer (${Math.floor(count / 3)} questions × 6 marks)
(Questions requiring 2-4 sentence answers)

## Section C: Essay (1 question × ${count} marks)
(A comprehensive essay/discussion question)

---
## MARKING SCHEME
(Complete answer key with mark allocation breakdown)

## GRADING RUBRIC
- 90-100%: Distinction (Mumtaz)
- 75-89%: Merit (Jayyid Jiddan)
- 60-74%: Pass (Jayyid)
- Below 60%: Fail

Ensure the exam is fair, comprehensive, and tests ${level}-level understanding.`;
  }

  // homework
  return `You are an expert Islamic education teacher creating homework assignments.

Subject: ${subjectFull[subject]}
Level: ${level}
Topic: ${topic}

Generate a detailed homework assignment:

# HOMEWORK ASSIGNMENT: ${topic}
**Subject:** ${subjectFull[subject]} | **Level:** ${level}
**Estimated Time:** 20-30 minutes

---

## Task 1: Reading & Reflection
(Reading task with guided reflection questions)

## Task 2: Practice Exercise
(Hands-on practice related to the topic)

## Task 3: Memorization/Review
(Something to memorize or review from today's lesson)

## Task 4: Application
(Real-life application of what was learned)

## Bonus (Optional)
(For advanced students who want to go further)

---
**Submission:** Complete all tasks by next class
**Note to Parents:** Brief description of what student is learning

Make the homework engaging, achievable, and connected to Islamic values. Appropriate for ${level} level.`;
}

router.post("/content-generator/generate", requireAuth, async (req: any, res) => {
  const { type = "lesson", subject = "quran", level = "beginner", topic, count = 5 } = req.body;

  if (!topic?.trim()) {
    res.status(400).json({ error: "Topic is required" });
    return;
  }

  const validTypes: ContentType[] = ["lesson", "quiz", "exam", "homework"];
  const validSubjects: Subject[] = ["quran", "tajweed", "arabic", "fiqh", "tafsir", "hifdh"];
  const validLevels: Level[] = ["beginner", "intermediate", "advanced"];

  if (!validTypes.includes(type) || !validSubjects.includes(subject) || !validLevels.includes(level)) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }

  try {
    const prompt = buildPrompt(type, subject, level, topic.trim(), Math.min(20, Math.max(1, count)));
    logger.info({ userId: req.userId, type, subject, level }, "Content generator request");

    await streamToResponse(res, [
      { role: "user" as const, content: prompt },
    ], {
      maxTokens: 2500,
      temperature: 0.65,
      fallback: `# ${type.toUpperCase()}: ${topic}\n\nContent generation is temporarily unavailable. Please try again shortly. The system uses free AI providers that may occasionally have rate limits.\n\nTopic: ${topic}\nSubject: ${subject}\nLevel: ${level}`,
    });
  } catch (err) {
    logger.error({ err }, "Content generator error");
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    else { res.write(`data: ${JSON.stringify({ error: "Error", done: true })}\n\n`); res.end(); }
  }
});

export default router;
