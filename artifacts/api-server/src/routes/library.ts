import { Router } from "express";
import { db } from "@workspace/db";
import { libraryProgressTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

export interface Book {
  id: string;
  title: string;
  titleArabic: string;
  author: string;
  authorArabic: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  lessonCount: number;
  coverGradient: [string, string];
  accentColor: string;
  tags: string[];
  featured?: boolean;
}

export const LIBRARY_BOOKS: Book[] = [
  // ── QURAN ──────────────────────────────────────────────────────────────
  {
    id: "quran-tajweed-rules",
    title: "Tajweed Rules of the Quran",
    titleArabic: "أحكام تجويد القرآن الكريم",
    author: "Kareema Carol Czerepinski",
    authorArabic: "كريمة كارول",
    description: "A comprehensive English guide to Tajweed rules covering Makharij, Sifaat, Ghunnah, Madd, and all essential rules with practice examples.",
    category: "quran",
    difficulty: "beginner",
    lessonCount: 24,
    coverGradient: ["#064e3b", "#065f46"],
    accentColor: "#34d399",
    tags: ["Tajweed", "Pronunciation", "Rules"],
    featured: true,
  },
  {
    id: "quran-beginners-guide",
    title: "Quran for Beginners",
    titleArabic: "تعلم القرآن للمبتدئين",
    author: "Al Bayaan Institute",
    authorArabic: "معهد البيان",
    description: "Step-by-step guided lessons for new learners starting their Quran journey. Covers the alphabet, vowels, and basic reading skills.",
    category: "quran",
    difficulty: "beginner",
    lessonCount: 30,
    coverGradient: ["#1e3a5f", "#1e40af"],
    accentColor: "#60a5fa",
    tags: ["Reading", "Beginner", "Alphabet"],
  },
  {
    id: "quran-juz-amma",
    title: "Juz Amma — Complete Study",
    titleArabic: "جزء عمّ — دراسة شاملة",
    author: "Sheikh Yusuf Estes",
    authorArabic: "الشيخ يوسف استيس",
    description: "In-depth study of the 30th Juz with Tajweed application, word meanings, and Tafsir notes for each Surah.",
    category: "quran",
    difficulty: "intermediate",
    lessonCount: 37,
    coverGradient: ["#78350f", "#92400e"],
    accentColor: "#fbbf24",
    tags: ["Juz Amma", "Memorization", "Tafsir"],
  },

  // ── HINGAAD ────────────────────────────────────────────────────────────
  {
    id: "hingaad-baghdadiyya",
    title: "Arabic Reading with Al-Baghdadiyya",
    titleArabic: "معلم القراءة العربية بالقاعدة البغدادية",
    author: "Classical Method",
    authorArabic: "الطريقة الكلاسيكية",
    description: "The traditional Baghdadi primer — the time-tested method for learning Arabic letters, vowels, and syllables used across the Islamic world for centuries.",
    category: "hingaad",
    difficulty: "beginner",
    lessonCount: 40,
    coverGradient: ["#4c1d95", "#5b21b6"],
    accentColor: "#a78bfa",
    tags: ["Hingaad", "Alphabet", "Reading", "Classical"],
    featured: true,
  },
  {
    id: "hingaad-noorania",
    title: "Noorania Reading Method",
    titleArabic: "القاعدة النورانية",
    author: "Sheikh Noor Muhammad Haqqani",
    authorArabic: "الشيخ نور محمد حقاني",
    description: "A comprehensive structured approach to Arabic reading with a focus on Quranic pronunciation and fluency from the very first lesson.",
    category: "hingaad",
    difficulty: "beginner",
    lessonCount: 35,
    coverGradient: ["#701a75", "#86198f"],
    accentColor: "#e879f9",
    tags: ["Noorania", "Reading", "Fluency"],
  },
  {
    id: "hingaad-advanced-fluency",
    title: "Advanced Arabic Reading Fluency",
    titleArabic: "الطلاقة في القراءة العربية",
    author: "Al Bayaan Institute",
    authorArabic: "معهد البيان",
    description: "Build speed and precision in Arabic reading. Covers long vowels, Shaddah, Sukun, and connected letter forms.",
    category: "hingaad",
    difficulty: "intermediate",
    lessonCount: 20,
    coverGradient: ["#1c1917", "#292524"],
    accentColor: "#d4a37a",
    tags: ["Advanced", "Fluency", "Speed"],
  },

  // ── ARABIC LANGUAGE ────────────────────────────────────────────────────
  {
    id: "arabic-bayna-yadayk-1",
    title: "Arabic Between Your Hands — Book 1",
    titleArabic: "العربية بين يديك — الكتاب الأول",
    author: "Abdul Rahman Ibrahim Al-Fawzan",
    authorArabic: "عبد الرحمن إبراهيم الفوزان",
    description: "The gold-standard Modern Standard Arabic course. Beginner level covering greetings, daily conversation, basic grammar, and essential vocabulary.",
    category: "arabic",
    difficulty: "beginner",
    lessonCount: 45,
    coverGradient: ["#0c4a6e", "#075985"],
    accentColor: "#38bdf8",
    tags: ["MSA", "Grammar", "Vocabulary", "Speaking"],
    featured: true,
  },
  {
    id: "arabic-bayna-yadayk-2",
    title: "Arabic Between Your Hands — Book 2",
    titleArabic: "العربية بين يديك — الكتاب الثاني",
    author: "Abdul Rahman Ibrahim Al-Fawzan",
    authorArabic: "عبد الرحمن إبراهيم الفوزان",
    description: "Intermediate level Arabic covering complex sentence structures, verb conjugations, and diverse topics for building real conversational fluency.",
    category: "arabic",
    difficulty: "intermediate",
    lessonCount: 42,
    coverGradient: ["#052e16", "#14532d"],
    accentColor: "#4ade80",
    tags: ["MSA", "Grammar", "Intermediate"],
  },
  {
    id: "arabic-bayna-yadayk-3",
    title: "Arabic Between Your Hands — Book 3",
    titleArabic: "العربية بين يديك — الكتاب الثالث",
    author: "Abdul Rahman Ibrahim Al-Fawzan",
    authorArabic: "عبد الرحمن إبراهيم الفوزان",
    description: "Advanced level. Complex literary Arabic, classical text reading, essay writing, and academic discourse preparation.",
    category: "arabic",
    difficulty: "advanced",
    lessonCount: 38,
    coverGradient: ["#3b0764", "#4a044e"],
    accentColor: "#c084fc",
    tags: ["MSA", "Advanced", "Literary"],
  },
  {
    id: "arabic-morphology",
    title: "Arabic Morphology (Sarf)",
    titleArabic: "علم الصرف",
    author: "Al Bayaan Institute",
    authorArabic: "معهد البيان",
    description: "An essential course in Arabic word-root analysis. Learn to derive verb forms, noun patterns, and understand how Arabic words are built.",
    category: "arabic",
    difficulty: "intermediate",
    lessonCount: 28,
    coverGradient: ["#422006", "#431407"],
    accentColor: "#fb923c",
    tags: ["Sarf", "Grammar", "Word Roots"],
  },

  // ── FIQH ───────────────────────────────────────────────────────────────
  {
    id: "fiqh-essentials",
    title: "Essentials of Islamic Fiqh",
    titleArabic: "أساسيات الفقه الإسلامي",
    author: "Sheikh Ibn Uthaymin (adapted)",
    authorArabic: "الشيخ ابن عثيمين",
    description: "Comprehensive coverage of Islamic jurisprudence: Taharah, Salah, Zakah, Sawm, Hajj, and daily Islamic rulings with evidences.",
    category: "fiqh",
    difficulty: "beginner",
    lessonCount: 52,
    coverGradient: ["#1a2e05", "#1a3a0a"],
    accentColor: "#84cc16",
    tags: ["Ibadah", "Salah", "Taharah", "Rulings"],
    featured: true,
  },
  {
    id: "fiqh-salah-complete",
    title: "The Complete Guide to Salah",
    titleArabic: "الدليل الكامل للصلاة",
    author: "Al Bayaan Institute",
    authorArabic: "معهد البيان",
    description: "Everything about the prayer: conditions, pillars, obligations, Sunnah acts, and common mistakes — with illustrations and proofs.",
    category: "fiqh",
    difficulty: "beginner",
    lessonCount: 18,
    coverGradient: ["#0a2618", "#0f3d24"],
    accentColor: "#6ee7b7",
    tags: ["Salah", "Prayer", "Worship"],
  },
  {
    id: "fiqh-muamalat",
    title: "Contemporary Islamic Finance & Transactions",
    titleArabic: "المعاملات المالية المعاصرة",
    author: "Dr. Monzer Kahf",
    authorArabic: "د. منذر قحف",
    description: "Islamic rulings on modern financial transactions: banking, insurance, investment, employment contracts, and digital commerce.",
    category: "fiqh",
    difficulty: "advanced",
    lessonCount: 25,
    coverGradient: ["#0c2340", "#0c2d5a"],
    accentColor: "#93c5fd",
    tags: ["Finance", "Transactions", "Contemporary"],
  },

  // ── AQEEDAH ────────────────────────────────────────────────────────────
  {
    id: "aqeedah-wasitiyya",
    title: "Al-Aqeedah Al-Wasitiyya",
    titleArabic: "العقيدة الواسطية",
    author: "Ibn Taymiyyah",
    authorArabic: "ابن تيمية",
    description: "The foundational text of Sunni creed by Ibn Taymiyyah — covering the names and attributes of Allah, prophets, companions, and core beliefs.",
    category: "aqeedah",
    difficulty: "intermediate",
    lessonCount: 22,
    coverGradient: ["#1c0533", "#2e0e5c"],
    accentColor: "#d8b4fe",
    tags: ["Tawheed", "Attributes", "Creed"],
    featured: true,
  },
  {
    id: "aqeedah-tahawiyya",
    title: "Al-Aqeedah Al-Tahawiyya",
    titleArabic: "العقيدة الطحاوية",
    author: "Imam Al-Tahawi",
    authorArabic: "الإمام الطحاوي",
    description: "One of the most authoritative summaries of Sunni belief. Studied across the Muslim world for over a thousand years.",
    category: "aqeedah",
    difficulty: "advanced",
    lessonCount: 20,
    coverGradient: ["#330000", "#4c0000"],
    accentColor: "#fca5a5",
    tags: ["Classical", "Creed", "Advanced"],
  },
  {
    id: "aqeedah-beginners",
    title: "Pillars of Faith — Beginner's Aqeedah",
    titleArabic: "أركان الإيمان للمبتدئين",
    author: "Al Bayaan Institute",
    authorArabic: "معهد البيان",
    description: "A clear introduction to the six pillars of Imaan: Allah, Angels, Books, Prophets, the Last Day, and Divine Decree.",
    category: "aqeedah",
    difficulty: "beginner",
    lessonCount: 14,
    coverGradient: ["#172554", "#1d4ed8"],
    accentColor: "#bfdbfe",
    tags: ["Iman", "Pillars", "Beginner"],
  },

  // ── HADITH ─────────────────────────────────────────────────────────────
  {
    id: "hadith-arbaeen-nawawi",
    title: "The Forty Hadith of Imam An-Nawawi",
    titleArabic: "الأربعون النووية",
    author: "Imam An-Nawawi",
    authorArabic: "الإمام النووي",
    description: "The most important collection of 40 foundational hadith covering the essential principles of Islam with detailed commentary and explanation.",
    category: "hadith",
    difficulty: "beginner",
    lessonCount: 40,
    coverGradient: ["#1a2744", "#1e3a5f"],
    accentColor: "#7dd3fc",
    tags: ["Nawawi", "40 Hadith", "Foundations"],
    featured: true,
  },
  {
    id: "hadith-riyadh-salihin",
    title: "Riyad Al-Salihin",
    titleArabic: "رياض الصالحين",
    author: "Imam An-Nawawi",
    authorArabic: "الإمام النووي",
    description: "Gardens of the Righteous — a comprehensive collection of authentic hadith covering all aspects of Muslim character, worship, and daily life.",
    category: "hadith",
    difficulty: "intermediate",
    lessonCount: 60,
    coverGradient: ["#162032", "#1f4068"],
    accentColor: "#67e8f9",
    tags: ["Nawawi", "Character", "Ethics"],
  },
  {
    id: "hadith-sciences",
    title: "Introduction to Hadith Sciences (Mustalah)",
    titleArabic: "مصطلح الحديث",
    author: "Al Bayaan Institute",
    authorArabic: "معهد البيان",
    description: "Learn how to evaluate hadith authenticity. Covers chain analysis (Isnad), narrator criticism, and hadith classification systems.",
    category: "hadith",
    difficulty: "advanced",
    lessonCount: 20,
    coverGradient: ["#1c1917", "#28231f"],
    accentColor: "#d4a37a",
    tags: ["Sciences", "Isnad", "Classification"],
  },

  // ── TAFSIR ─────────────────────────────────────────────────────────────
  {
    id: "tafsir-juz-amma",
    title: "Tafsir of Juz Amma",
    titleArabic: "تفسير جزء عمّ",
    author: "Sheikh Muhammad Al-Sha'rawi (adapted)",
    authorArabic: "الشيخ محمد الشعراوي",
    description: "Accessible and engaging Tafsir of the 30th part of the Quran, explaining context, vocabulary, themes, and spiritual lessons.",
    category: "tafsir",
    difficulty: "beginner",
    lessonCount: 37,
    coverGradient: ["#2d1b00", "#3d2700"],
    accentColor: "#fcd34d",
    tags: ["Juz Amma", "Meaning", "Context"],
    featured: true,
  },
  {
    id: "tafsir-ibn-kathir-selected",
    title: "Selected Passages from Tafsir Ibn Kathir",
    titleArabic: "مختارات من تفسير ابن كثير",
    author: "Ibn Kathir",
    authorArabic: "ابن كثير",
    description: "Key passages from the most widely read classical Tafsir. Covers Surah Al-Fatiha through Al-Baqarah and selected Surahs in depth.",
    category: "tafsir",
    difficulty: "intermediate",
    lessonCount: 30,
    coverGradient: ["#1a0a00", "#2d1200"],
    accentColor: "#fb923c",
    tags: ["Classical", "Ibn Kathir", "Detailed"],
  },
  {
    id: "tafsir-thematic",
    title: "Thematic Quranic Studies",
    titleArabic: "الدراسات الموضوعية للقرآن",
    author: "Al Bayaan Institute",
    authorArabic: "معهد البيان",
    description: "Study Quran by theme: Day of Judgement, Paradise & Hell, Prophets, Family, Justice, and more — drawing verses together for deep understanding.",
    category: "tafsir",
    difficulty: "advanced",
    lessonCount: 24,
    coverGradient: ["#0f172a", "#1e293b"],
    accentColor: "#94a3b8",
    tags: ["Thematic", "Advanced", "Comprehensive"],
  },
];

router.get("/library/books", requireAuth, async (_req, res) => {
  res.json({ books: LIBRARY_BOOKS });
});

router.get("/library/progress", requireAuth, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const progress = await db
      .select()
      .from(libraryProgressTable)
      .where(eq(libraryProgressTable.userId, userId));
    res.json({ progress });
  } catch (err) {
    logger.error({ err }, "Failed to get library progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/library/progress/:bookId", requireAuth, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { bookId } = req.params;
    const { completedLessons } = req.body;

    if (typeof completedLessons !== "number" || completedLessons < 0) {
      res.status(400).json({ error: "completedLessons must be a non-negative number" });
      return;
    }

    const book = LIBRARY_BOOKS.find((b) => b.id === bookId);
    if (!book) { res.status(404).json({ error: "Book not found" }); return; }

    const lessons = Math.min(completedLessons, book.lessonCount);

    await db
      .insert(libraryProgressTable)
      .values({ userId, bookId, completedLessons: lessons })
      .onConflictDoUpdate({
        target: [libraryProgressTable.userId, libraryProgressTable.bookId],
        set: { completedLessons: lessons, updatedAt: new Date() },
      });

    res.json({ success: true, bookId, completedLessons: lessons });
  } catch (err) {
    logger.error({ err }, "Failed to update library progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
