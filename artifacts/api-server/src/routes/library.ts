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
    id: "madinah-arabic-1",
    title: "Madinah Arabic — Book 1 (دُرُوسُ اللُّغَةِ العَرَبِيَّة)",
    titleArabic: "دُرُوسُ اللُّغَةِ العَرَبِيَّة — الكِتَابُ الأَوَّل",
    author: "Dr. V. Abdur Rahim",
    authorArabic: "د. ف. عبد الرحيم",
    description: "The world-famous Arabic course developed at the Islamic University of Madinah. Uses the direct Arabic-through-Arabic method. Covers demonstratives, pronouns, adjectives, verbs, and essential vocabulary from lesson one.",
    category: "arabic",
    difficulty: "beginner",
    lessonCount: 32,
    coverGradient: ["#064e3b", "#065f46"],
    accentColor: "#34d399",
    tags: ["Madinah", "Classical", "Grammar", "Direct Method"],
    featured: true,
  },
  {
    id: "arabic-nasheeen-1",
    title: "Arabic for Young Learners — Level 1 (العَرَبِيَّة لِلنَّاشِئِين)",
    titleArabic: "العَرَبِيَّة لِلنَّاشِئِين — المُسْتَوَى الأَوَّل",
    author: "Ministry of Education, Saudi Arabia",
    authorArabic: "وِزَارَةُ التَّعْلِيم",
    description: "Widely used in Islamic schools worldwide. Teaches conversational and written Arabic through themes: self-introduction, family, school, numbers, and daily life — with rich vocabulary and exercises.",
    category: "arabic",
    difficulty: "beginner",
    lessonCount: 20,
    coverGradient: ["#7c2d12", "#9a3412"],
    accentColor: "#fb923c",
    tags: ["Beginner", "Conversational", "Youth", "Vocabulary"],
    featured: true,
  },
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

  // ── SEERAH ─────────────────────────────────────────────────────────────
  {
    id: "seerah-prophet-muhammad",
    title: "Seerah: The Life of Prophet Muhammad ﷺ",
    titleArabic: "السيرة النبوية: حياة النبي محمد ﷺ",
    author: "Sheikh Safiy ur-Rahman Al-Mubarakpuri (adapted)",
    authorArabic: "الشيخ صفي الرحمن المباركفوري",
    description: "A comprehensive journey through the life of the Prophet Muhammad ﷺ — from birth to the Final Sermon. Covers the Makkan and Madinan periods, battles, treaties, and the formation of the Muslim ummah.",
    category: "seerah",
    difficulty: "beginner",
    lessonCount: 40,
    coverGradient: ["#1a2e05", "#2d4a0a"],
    accentColor: "#86efac",
    tags: ["Prophet", "History", "Makkan", "Madinan"],
    featured: true,
  },
  {
    id: "seerah-companions",
    title: "Lives of the Companions (Sahabah)",
    titleArabic: "حياة الصحابة الكرام",
    author: "Al Bayaan Institute",
    authorArabic: "معهد البيان",
    description: "Inspiring stories of the companions of the Prophet ﷺ — Abu Bakr, Umar, Uthman, Ali, Khadijah, Aisha, and the generation that changed the world.",
    category: "seerah",
    difficulty: "beginner",
    lessonCount: 30,
    coverGradient: ["#1e3a5f", "#1e4080"],
    accentColor: "#93c5fd",
    tags: ["Companions", "Sahabah", "History"],
  },
  {
    id: "seerah-islamic-history",
    title: "Islamic Civilisation & History",
    titleArabic: "الحضارة والتاريخ الإسلامي",
    author: "Al Bayaan Institute",
    authorArabic: "معهد البيان",
    description: "From the golden age of Islamic scholarship to the spread of Islam across continents — trace the rise of Islamic civilisation and its contributions to humanity.",
    category: "seerah",
    difficulty: "intermediate",
    lessonCount: 25,
    coverGradient: ["#3b1c00", "#5c2d00"],
    accentColor: "#fdba74",
    tags: ["History", "Civilisation", "Golden Age"],
  },
];

// ── Lesson curricula per book ──────────────────────────────────────────────────
type LessonType = "video" | "reading" | "practice" | "quiz";
interface Lesson {
  number: number;
  title: string;
  titleArabic: string;
  description: string;
  duration: string;
  type: LessonType;
}

const LESSON_TYPES: LessonType[] = ["reading", "video", "practice", "practice", "quiz"];

const CURRICULA: Record<string, Array<{ title: string; titleArabic: string; description: string; type: LessonType; duration: string }>> = {
  "arabic-bayna-yadayk-1": [
    { title: "Greetings & Introductions", titleArabic: "التحيات والمقدمات", description: "Learn essential greetings: as-salamu alaykum, marhaba, kayfa haluka. Practice introducing yourself and asking others' names.", type: "video", duration: "20 min" },
    { title: "The Arabic Alphabet Review", titleArabic: "مراجعة الحروف العربية", description: "Review all 28 letters with their isolated, initial, medial, and final forms. Practice writing and recognizing each letter.", type: "practice", duration: "25 min" },
    { title: "Numbers 1–10", titleArabic: "الأرقام ١–١٠", description: "Learn to count from one to ten in Arabic, understand masculine and feminine forms of numbers, and use them in simple sentences.", type: "reading", duration: "15 min" },
    { title: "Definite & Indefinite Articles", titleArabic: "التعريف والتنكير", description: "Master the use of ال (al-) for definite nouns and tanwin (ـً ـٍ ـٌ) for indefinite nouns. Practice with common vocabulary.", type: "practice", duration: "20 min" },
    { title: "Basic Sentence Structure", titleArabic: "بنية الجملة الأساسية", description: "Introduction to the nominal sentence (الجملة الاسمية): Subject (مبتدأ) + Predicate (خبر). Build simple sentences like 'I am a student.'", type: "video", duration: "25 min" },
    { title: "The Family", titleArabic: "الأسرة", description: "Vocabulary for family members: father, mother, brother, sister, son, daughter. Practice possessive pronouns with family terms.", type: "reading", duration: "20 min" },
    { title: "Colors & Descriptions", titleArabic: "الألوان والأوصاف", description: "Learn color words and basic adjectives. Understand adjective-noun agreement in gender and number in Arabic.", type: "practice", duration: "20 min" },
    { title: "Numbers 11–100", titleArabic: "الأرقام ١١–١٠٠", description: "Extend your number knowledge from 11 to 100. Learn compound numbers and use them for age, quantities, and prices.", type: "reading", duration: "20 min" },
    { title: "Days of the Week & Months", titleArabic: "أيام الأسبوع والأشهر", description: "Learn all seven days and the 12 months in Arabic. Practice scheduling and talking about dates.", type: "practice", duration: "15 min" },
    { title: "The Classroom", titleArabic: "الفصل الدراسي", description: "Classroom vocabulary: book, pen, desk, board, teacher, student. Practice classroom commands and instructions.", type: "video", duration: "20 min" },
    { title: "Telling Time", titleArabic: "قول الوقت", description: "Learn to express time using hours, half-hours, and quarter-hours. Practice asking 'What time is it?' (كم الساعة؟)", type: "practice", duration: "20 min" },
    { title: "Food & Drink", titleArabic: "الطعام والشراب", description: "Essential food vocabulary. Learn to order at a restaurant, express preferences, and ask about prices.", type: "reading", duration: "20 min" },
    { title: "The Human Body", titleArabic: "جسم الإنسان", description: "Body part vocabulary with pronunciation. Practice describing physical appearance and using body terms in sentences.", type: "practice", duration: "20 min" },
    { title: "Professions & Occupations", titleArabic: "المهن والحرف", description: "Learn common job titles and professions. Practice saying what you do and asking others about their work.", type: "reading", duration: "20 min" },
    { title: "Present Tense Verbs (I)", titleArabic: "أفعال المضارع (١)", description: "Introduction to the present tense (المضارع). Learn the six main verb forms and conjugate common verbs like 'to write', 'to read', 'to go'.", type: "video", duration: "30 min" },
    { title: "Present Tense Verbs (II)", titleArabic: "أفعال المضارع (٢)", description: "Expand present tense conjugation to all 14 forms including dual and plural. Practice with common daily activity verbs.", type: "practice", duration: "30 min" },
    { title: "Negation in Arabic", titleArabic: "النفي في العربية", description: "Learn how to negate sentences using لا، لم، لن، ليس. Practice making positive sentences negative.", type: "reading", duration: "20 min" },
    { title: "The City & Directions", titleArabic: "المدينة والاتجاهات", description: "Vocabulary for places in a city: market, mosque, school, hospital. Learn directional words and asking for directions.", type: "video", duration: "25 min" },
    { title: "Shopping & Prices", titleArabic: "التسوق والأسعار", description: "Practice shopping dialogues. Learn to ask prices, negotiate, and use numbers in a market context.", type: "practice", duration: "20 min" },
    { title: "Weather & Seasons", titleArabic: "الطقس والفصول", description: "Weather vocabulary and the four seasons. Practice describing weather conditions and talking about climate.", type: "reading", duration: "15 min" },
    { title: "Hobbies & Free Time", titleArabic: "الهوايات ووقت الفراغ", description: "Vocabulary for leisure activities: sports, reading, travel. Express likes and dislikes using أحب/لا أحب.", type: "practice", duration: "20 min" },
    { title: "The Past Tense (I)", titleArabic: "الماضي (١)", description: "Introduction to the past tense (الماضي). Learn the basic conjugation pattern and use common verbs in past tense.", type: "video", duration: "30 min" },
    { title: "The Past Tense (II)", titleArabic: "الماضي (٢)", description: "Expand past tense conjugation and practice narrating past events. Use time expressions like yesterday, last week.", type: "practice", duration: "30 min" },
    { title: "Interrogative Sentences", titleArabic: "الجمل الاستفهامية", description: "Master question words: من، ما، أين، متى، لماذا، كيف، كم. Form and answer questions in Arabic.", type: "reading", duration: "20 min" },
    { title: "Prepositions & Locations", titleArabic: "حروف الجر والأماكن", description: "Learn prepositions: في، على، تحت، فوق، بين، أمام، خلف. Practice describing where things are.", type: "practice", duration: "20 min" },
    { title: "Transportation", titleArabic: "المواصلات", description: "Vocabulary for transport: car, bus, train, airplane. Learn to discuss travel plans and give directions.", type: "reading", duration: "20 min" },
    { title: "At the Doctor", titleArabic: "عند الطبيب", description: "Medical vocabulary and health-related expressions. Practice describing symptoms and understanding a doctor's advice.", type: "video", duration: "20 min" },
    { title: "Describing People", titleArabic: "وصف الناس", description: "Physical and personality adjectives. Practice describing people's appearance and character traits.", type: "practice", duration: "20 min" },
    { title: "Possessive Structures (Idafa)", titleArabic: "الإضافة", description: "Master the Arabic genitive construct (الإضافة). Learn to express possession and relationships between nouns.", type: "video", duration: "30 min" },
    { title: "Dual & Plural Forms", titleArabic: "المثنى والجمع", description: "Learn sound and broken plurals. Practice using dual forms and identify the most common plural patterns.", type: "practice", duration: "30 min" },
    { title: "Conjunctions & Connectors", titleArabic: "الروابط وأدوات الوصل", description: "Use و، ف، لكن، ثم، أو to connect sentences. Practice building complex, flowing Arabic sentences.", type: "reading", duration: "20 min" },
    { title: "The Home & Furniture", titleArabic: "البيت والأثاث", description: "Vocabulary for rooms and furniture. Describe your home and practice prepositions with furniture placement.", type: "practice", duration: "20 min" },
    { title: "Future Tense", titleArabic: "المستقبل", description: "Express future actions using سـ and سوف. Practice planning and making promises in Arabic.", type: "video", duration: "25 min" },
    { title: "Reading Comprehension I", titleArabic: "الفهم القرائي (١)", description: "Read a short Arabic passage about daily life. Practice extracting key information and answering comprehension questions.", type: "reading", duration: "25 min" },
    { title: "Listening & Dialogue Practice", titleArabic: "الاستماع وتدريب الحوار", description: "Listen to authentic Arabic dialogues. Practice shadowing, repetition, and comprehension of natural spoken Arabic.", type: "practice", duration: "25 min" },
    { title: "Expressing Opinions", titleArabic: "التعبير عن الآراء", description: "Learn phrases for expressing opinions: أعتقد أن، في رأيي، من وجهة نظري. Practice agreeing and disagreeing politely.", type: "reading", duration: "20 min" },
    { title: "Writing Practice: Short Paragraphs", titleArabic: "التدريب الكتابي: فقرات قصيرة", description: "Write short Arabic paragraphs about yourself, your family, and your daily routine. Review and improve your written Arabic.", type: "practice", duration: "30 min" },
    { title: "Verb Roots & Patterns", titleArabic: "جذور الأفعال وأوزانها", description: "Introduction to the trilateral root system. Understand how roots generate related words and recognize patterns.", type: "video", duration: "30 min" },
    { title: "Reading Comprehension II", titleArabic: "الفهم القرائي (٢)", description: "A more challenging reading passage on a cultural topic. Practice identifying main ideas, details, and vocabulary in context.", type: "reading", duration: "30 min" },
    { title: "Conversational Practice: Travel", titleArabic: "محادثة: السفر", description: "Role-play travel scenarios: at the airport, booking a hotel, asking for recommendations. Build real conversational fluency.", type: "practice", duration: "25 min" },
    { title: "Islamic & Cultural Vocabulary", titleArabic: "المفردات الإسلامية والثقافية", description: "Essential Islamic terms and cultural expressions. Learn to navigate Friday prayers, Ramadan greetings, and religious occasions.", type: "reading", duration: "20 min" },
    { title: "Review: Vocabulary Checkpoint", titleArabic: "مراجعة: نقطة تفتيش المفردات", description: "Comprehensive review of all vocabulary from this book. Use flashcards, gap-fill exercises, and spaced repetition techniques.", type: "practice", duration: "25 min" },
    { title: "Review: Grammar Checkpoint", titleArabic: "مراجعة: نقطة تفتيش القواعد", description: "Grammar review covering sentence structure, verb conjugation, plurals, and prepositions introduced throughout the course.", type: "practice", duration: "30 min" },
    { title: "Final Assessment", titleArabic: "التقييم النهائي", description: "Complete the end-of-book assessment covering all four skills: reading, writing, speaking prompts, and grammar exercises.", type: "quiz", duration: "45 min" },
  ],

  "quran-tajweed-rules": [
    { title: "Introduction to Tajweed", titleArabic: "مقدمة في التجويد", description: "What is Tajweed? Its ruling (hukm) and the history of Tajweed scholarship. Why correct recitation matters.", type: "video", duration: "20 min" },
    { title: "Makharij al-Huruf (I)", titleArabic: "مخارج الحروف (١)", description: "The five main articulation points: Al-Jawf, Al-Halq, Al-Lisan, Ash-Shafatan, Al-Khayshum. Learn the throat letters.", type: "video", duration: "25 min" },
    { title: "Makharij al-Huruf (II)", titleArabic: "مخارج الحروف (٢)", description: "Tongue letters and their precise positions. Practice the 18 tongue articulation points with recorded examples.", type: "practice", duration: "25 min" },
    { title: "Makharij al-Huruf (III)", titleArabic: "مخارج الحروف (٣)", description: "Lip letters (ف، م، ب، و) and nasal letters. Complete the articulation point study with practice drills.", type: "practice", duration: "20 min" },
    { title: "Sifat al-Huruf — Part 1", titleArabic: "صفات الحروف — الجزء الأول", description: "Letter characteristics with opposite pairs: Jahr vs. Hams, Shiddah vs. Rakhawah, Isti'la vs. Istifal.", type: "reading", duration: "25 min" },
    { title: "Sifat al-Huruf — Part 2", titleArabic: "صفات الحروف — الجزء الثاني", description: "Remaining letter characteristics: Itbaq, Infitah, Idhlaq, Ismat, and characteristics without opposites.", type: "reading", duration: "25 min" },
    { title: "Heavy & Light Letters (Tafkhim & Tarqiq)", titleArabic: "التفخيم والترقيق", description: "Understanding heaviness (Tafkhim) and lightness (Tarqiq). Special rules for ر and ل in different contexts.", type: "practice", duration: "25 min" },
    { title: "Noon Sakinah & Tanwin — Idgham", titleArabic: "النون الساكنة والتنوين — الإدغام", description: "Rules of Idgham (assimilation) with and without Ghunnah. Identify the six Idgham letters and apply the rule.", type: "video", duration: "30 min" },
    { title: "Noon Sakinah & Tanwin — Ikhfa", titleArabic: "النون الساكنة والتنوين — الإخفاء", description: "Ikhfa (concealment): the 15 Ikhfa letters and how to produce the correct nasal sound with each.", type: "practice", duration: "25 min" },
    { title: "Noon Sakinah & Tanwin — Iqlab & Idhar", titleArabic: "الإقلاب والإظهار", description: "Iqlab (conversion) with ب and Idhar (clear pronunciation) with the six throat letters. Complete the Noon rules.", type: "practice", duration: "25 min" },
    { title: "Meem Sakinah Rules", titleArabic: "أحكام الميم الساكنة", description: "Three rules for Meem Sakinah: Idgham Shafawi, Ikhfa Shafawi, and Idhar Shafawi. Practice with Quranic examples.", type: "reading", duration: "20 min" },
    { title: "Ghunnah (Nasalization)", titleArabic: "الغنة", description: "The nasal sound: when it occurs, its levels (mushadd, mutaharik, mushba'), and duration of 2 counts.", type: "practice", duration: "20 min" },
    { title: "Qalqalah", titleArabic: "القلقلة", description: "The echo/bouncing rule for ق، ط، ب، ج، د. Practice distinguishing minor and major Qalqalah at pause.", type: "practice", duration: "20 min" },
    { title: "Madd — Foundations", titleArabic: "المد — الأساسيات", description: "Introduction to elongation (Madd). The three letters of Madd, the original Madd (المد الطبيعي), and its 2-count duration.", type: "video", duration: "25 min" },
    { title: "Madd Wajib Muttasil", titleArabic: "المد الواجب المتصل", description: "The obligatory connected Madd: when a Madd letter is followed by Hamzah in the same word. 4–5 count rule.", type: "practice", duration: "20 min" },
    { title: "Madd Jaiz Munfasil", titleArabic: "المد الجائز المنفصل", description: "The permissible separated Madd: Madd letter at end of word followed by Hamzah at start of next word. 2–5 counts.", type: "practice", duration: "20 min" },
    { title: "Madd al-Arid lil Sukun", titleArabic: "مد العارض للسكون", description: "Madd that occurs when stopping at a word ending in a voweled letter. Duration of 2, 4, or 6 counts when pausing.", type: "practice", duration: "25 min" },
    { title: "Madd al-Lazim & al-Lin", titleArabic: "المد اللازم والمد اللين", description: "The compulsory Madd (always 6 counts) and the soft Madd letters (و، ي with Fathah before them at a pause).", type: "reading", duration: "25 min" },
    { title: "Rules of Stopping (Waqf)", titleArabic: "أحكام الوقف", description: "Types of stopping: mandatory (لازم), preferable (أولى), permissible (جائز), and forbidden (ممنوع). Reading the Waqf signs.", type: "reading", duration: "25 min" },
    { title: "Starting After Stopping (Ibtida)", titleArabic: "الابتداء", description: "Rules for where to begin recitation after stopping. Understanding complete, sufficient, and good stopping points.", type: "reading", duration: "20 min" },
    { title: "Hamzatul Wasl & Qat'", titleArabic: "همزة الوصل والقطع", description: "Connecting Hamzah (dropped in flow) vs. Cutting Hamzah (always pronounced). Apply in Quranic recitation.", type: "practice", duration: "25 min" },
    { title: "Lam Rules", titleArabic: "أحكام اللام", description: "Rules for Lam in Al (لام التعريف) — when it's clear (Idhar Shamsiyyah) and when it assimilates (Idgham Shamsiyyah).", type: "practice", duration: "20 min" },
    { title: "Applied Tajweed: Al-Fatiha & Al-Baqarah (Opening)", titleArabic: "التجويد التطبيقي: الفاتحة والبقرة", description: "Apply all learned rules to Surah Al-Fatiha and the opening verses of Al-Baqarah. Identify every Tajweed rule present.", type: "practice", duration: "30 min" },
    { title: "Final Review & Recitation Assessment", titleArabic: "المراجعة النهائية وتقييم التلاوة", description: "Comprehensive review of all rules. Record yourself reciting a passage and evaluate your Tajweed application.", type: "quiz", duration: "40 min" },
  ],

  "hadith-arbaeen-nawawi": [
    { title: "The Foundation: Hadith 1 — Actions by Intentions", titleArabic: "الحديث الأول: الأعمال بالنيات", description: "The famous hadith of Umar ibn Al-Khattab. Understand why niyyah (intention) is the foundation of all deeds in Islam.", type: "video", duration: "25 min" },
    { title: "Hadith 2: Islam, Iman & Ihsan", titleArabic: "الحديث الثاني: الإسلام والإيمان والإحسان", description: "The Hadith of Jibreel. The three levels of religion and what each level requires from a Muslim.", type: "reading", duration: "30 min" },
    { title: "Hadith 3: The Five Pillars of Islam", titleArabic: "الحديث الثالث: أركان الإسلام الخمسة", description: "Islam is built on five pillars. Understand the role of each pillar and how they structure a Muslim's life.", type: "video", duration: "25 min" },
    { title: "Hadith 4: Creation in the Womb", titleArabic: "الحديث الرابع: الخلق في الرحم", description: "The stages of human creation and the writing of destiny. A profound reflection on the divine decree.", type: "reading", duration: "20 min" },
    { title: "Hadith 5: Innovation in Religion", titleArabic: "الحديث الخامس: البدعة في الدين", description: "Whoever introduces something new in this matter of ours… Understanding Bid'ah and protecting the purity of Islam.", type: "practice", duration: "25 min" },
    { title: "Hadith 6: Halal, Haram & Doubtful Matters", titleArabic: "الحديث السادس: الحلال والحرام والمشتبهات", description: "The halal is clear, the haram is clear — learn the concept of doubtful matters and how a Muslim navigates them.", type: "reading", duration: "25 min" },
    { title: "Hadith 7: Religion is Sincere Counsel (Nasihah)", titleArabic: "الحديث السابع: الدين النصيحة", description: "Religion is nasihah — to Allah, His Book, His Messenger, leaders, and the Muslim community. What does sincerity look like?", type: "video", duration: "20 min" },
    { title: "Hadith 8: Fighting Muslims is Disbelief", titleArabic: "الحديث الثامن", description: "The severe prohibition of fighting fellow Muslims. Understanding the sanctity of Muslim life and property.", type: "reading", duration: "20 min" },
    { title: "Hadith 9: What You Have Been Forbidden, Avoid", titleArabic: "الحديث التاسع: اجتناب المنهيات", description: "If I command you to do something, do of it what you are able. The principle of ease and capability in Islamic law.", type: "practice", duration: "20 min" },
    { title: "Hadith 10: Eat What is Pure", titleArabic: "الحديث العاشر: أكل الطيبات", description: "Allah is pure and accepts only what is pure. The connection between lawful earnings and accepted supplications.", type: "reading", duration: "20 min" },
  ],

  "fiqh-essentials": [
    { title: "Introduction to Fiqh & Usul", titleArabic: "مقدمة في الفقه والأصول", description: "What is Fiqh? The four major schools (Madhabs), their founders, and the importance of following a Madhab.", type: "video", duration: "25 min" },
    { title: "Taharah — The Concept of Purity", titleArabic: "الطهارة — مفهوم النظافة", description: "The two types of purity: physical (hadath/najasah) and spiritual. Why Taharah is the key to worship.", type: "reading", duration: "20 min" },
    { title: "Water & Its Rulings", titleArabic: "الماء وأحكامه", description: "Categories of water: mutlaq, musta'mal, and najis. Which water can be used for purification.", type: "reading", duration: "20 min" },
    { title: "Wudu — Step by Step", titleArabic: "الوضوء — خطوة بخطوة", description: "The fard and sunnah acts of wudu. Learn the correct method with practical demonstrations and common mistakes.", type: "video", duration: "30 min" },
    { title: "What Breaks Wudu", titleArabic: "نواقض الوضوء", description: "Comprehensive list of nullifiers of wudu with evidence. Understand major and minor hadath.", type: "reading", duration: "20 min" },
    { title: "Ghusl — Full Ritual Bath", titleArabic: "الغسل الكامل", description: "When is ghusl obligatory? The fard elements and the complete recommended method with sunnah acts.", type: "practice", duration: "25 min" },
    { title: "Tayammum — Dry Ablution", titleArabic: "التيمم", description: "When water is unavailable or harmful. The conditions, method, and limitations of Tayammum.", type: "reading", duration: "20 min" },
    { title: "Najasah — Ritual Impurity", titleArabic: "النجاسة", description: "Types of impurities and how to remove them from clothing, body, and prayer space. Excuse for traces.", type: "practice", duration: "20 min" },
    { title: "Salah — Conditions & Times", titleArabic: "الصلاة — شروطها وأوقاتها", description: "The five daily prayers, their time windows, and the conditions that must be met before praying.", type: "video", duration: "25 min" },
    { title: "The Pillars of Salah", titleArabic: "أركان الصلاة", description: "The 14 obligatory pillars without which prayer is invalid. Understand each pillar and why it cannot be omitted.", type: "reading", duration: "25 min" },
    { title: "Wajibat & Sunan of Salah", titleArabic: "واجبات وسنن الصلاة", description: "Distinguish between obligatory (fard), necessary (wajib), and recommended (sunnah) acts of prayer.", type: "reading", duration: "20 min" },
    { title: "Prostration of Forgetfulness (Sujood Al-Sahw)", titleArabic: "سجود السهو", description: "When to perform Sujood al-Sahw, the three cases, and how to repair a prayer affected by forgetfulness.", type: "practice", duration: "20 min" },
    { title: "Congregational Prayer (Jama'ah)", titleArabic: "صلاة الجماعة", description: "The ruling on praying in congregation, its virtue, and the roles of imam and follower (ma'mum).", type: "video", duration: "25 min" },
    { title: "Friday Prayer (Jumu'ah)", titleArabic: "صلاة الجمعة", description: "Conditions for Jumu'ah, the two khutbahs, and rulings specific to Friday prayer.", type: "reading", duration: "25 min" },
    { title: "Zakah — Purification of Wealth", titleArabic: "الزكاة — تطهير المال", description: "Zakah: who must pay, on what wealth, the nisaab, and the eligible recipients (asnaf).", type: "video", duration: "30 min" },
    { title: "Sawm — The Fast of Ramadan", titleArabic: "الصوم — صيام رمضان", description: "Conditions for fasting, what nullifies the fast, and the spiritual dimensions of Ramadan.", type: "reading", duration: "25 min" },
    { title: "Hajj — Pilgrimage Essentials", titleArabic: "الحج — أساسيات الحج", description: "The pillars and obligations of Hajj, the stages of the pilgrimage, and its profound spiritual significance.", type: "video", duration: "35 min" },
    { title: "Halal & Haram in Food", titleArabic: "الحلال والحرام في الطعام", description: "Islamic dietary laws: forbidden animals, slaughter conditions, and contemporary food labelling issues.", type: "reading", duration: "20 min" },
    { title: "Islamic Rulings on Marriage", titleArabic: "أحكام النكاح", description: "The conditions for a valid marriage contract, the roles of the wali, mahr, and witnesses.", type: "reading", duration: "25 min" },
    { title: "Rulings on Death & Burial", titleArabic: "أحكام الجنازة", description: "Washing the deceased, the funeral prayer (Janazah), burial rules, and the Islamic view of mourning.", type: "video", duration: "25 min" },
  ],

  "arabic-bayna-yadayk-3": [
    { title: "Complex Sentence Structures", titleArabic: "التراكيب المعقدة", description: "Conditional sentences, relative clauses, and subordinate structures in advanced Arabic.", type: "video", duration: "35 min" },
    { title: "Arabic Essay Writing & Discourse", titleArabic: "الكتابة المقالية والخطاب", description: "Structure formal Arabic essays using discourse markers and advanced connectives.", type: "practice", duration: "40 min" },
    { title: "Classical Arabic Literature & Poetry", titleArabic: "الأدب العربي الكلاسيكي والشعر", description: "Introduction to the qasidah form, famous Arab poets, and Arabic literary heritage.", type: "reading", duration: "35 min" },
    { title: "Arabic Rhetoric (Balagha) — Metaphor & Simile", titleArabic: "البلاغة: الاستعارة والتشبيه", description: "The three branches of Arabic rhetoric: bayan, ma'ani, and badi'. Focus on metaphor and simile.", type: "video", duration: "30 min" },
    { title: "Reading Classical Texts — Al-Muqaddimah", titleArabic: "قراءة النصوص الكلاسيكية: المقدمة", description: "Selected passages from Ibn Khaldun's Muqaddimah with full grammatical analysis.", type: "reading", duration: "40 min" },
    { title: "Advanced Verb Forms — Derived Patterns (II)", titleArabic: "أوزان الأفعال المشتقة (٢)", description: "Patterns VII–X: infa'ala, ifta'ala, if'alla, istaf'ala — meanings, examples, and conjugation.", type: "practice", duration: "35 min" },
    { title: "Academic Writing in Arabic", titleArabic: "الكتابة الأكاديمية بالعربية", description: "Write structured academic paragraphs, research summaries, and formal reports in Arabic.", type: "practice", duration: "40 min" },
    { title: "Translation Skills: Arabic–English", titleArabic: "مهارات الترجمة: عربي–إنجليزي", description: "Principles of literary translation. Translate selected passages from Arabic classical texts.", type: "practice", duration: "35 min" },
    { title: "Islamic Texts in Classical Arabic", titleArabic: "النصوص الإسلامية بالعربية الكلاسيكية", description: "Reading selections from Al-Nawawi's Riyad al-Salihin with full grammatical commentary.", type: "reading", duration: "40 min" },
    { title: "Final Assessment — Advanced Arabic", titleArabic: "التقييم النهائي: العربية المتقدمة", description: "Comprehensive examination of all advanced Arabic skills: reading, writing, grammar, and literary analysis.", type: "quiz", duration: "60 min" },
  ],

  "hingaad-advanced-fluency": [
    { title: "Connected Letter Forms & Long Vowels", titleArabic: "الأشكال المتصلة والحركات الطويلة", description: "Master connected letter forms and the three long vowels (Alif, Waw, Ya) in Arabic text.", type: "video", duration: "25 min" },
    { title: "Shaddah, Sukun & Reading Speed", titleArabic: "الشدة والسكون وسرعة القراءة", description: "Master consonant doubling (Shaddah) and no-vowel letters (Sukun). Build reading fluency.", type: "practice", duration: "25 min" },
    { title: "Reading Unvocalised Arabic Text", titleArabic: "قراءة النص العربي غير المشكل", description: "Advanced skill: reading Arabic without diacritics using vocabulary and context knowledge.", type: "practice", duration: "30 min" },
    { title: "Tanwin — Double Vowel Endings", titleArabic: "التنوين — النهايات المضاعفة", description: "The three tanwin forms (ـً ـٍ ـٌ) and when they are used. Indefinite nouns and their case endings.", type: "reading", duration: "20 min" },
    { title: "Speed Reading Drills", titleArabic: "تدريبات القراءة السريعة", description: "Timed Arabic reading exercises. Build from 30 to 80+ words per minute with accuracy.", type: "practice", duration: "30 min" },
    { title: "Quranic Vocabulary in Context", titleArabic: "مفردات القرآن في السياق", description: "The 100 most frequent Quranic words. Recognize them on sight in any Arabic text.", type: "reading", duration: "25 min" },
    { title: "Newspaper & Modern Arabic Reading", titleArabic: "قراءة الصحف والعربية الحديثة", description: "Read authentic Arabic newspaper headlines and short articles. Bridge classical to modern Arabic.", type: "practice", duration: "30 min" },
    { title: "Final Fluency Assessment", titleArabic: "تقييم الطلاقة النهائي", description: "Complete a comprehensive reading assessment: speed, accuracy, comprehension, and unvocalised text.", type: "quiz", duration: "40 min" },
  ],

  "seerah-prophet-muhammad": [
    { title: "The Arabian Peninsula Before Islam", titleArabic: "الجزيرة العربية قبل الإسلام", description: "The social, religious, and political landscape of Arabia before the Prophet's ﷺ birth. The Age of Ignorance (Jahiliyyah).", type: "video", duration: "25 min" },
    { title: "The Birth & Early Life of the Prophet ﷺ", titleArabic: "مولد النبي ﷺ وحياته المبكرة", description: "Birth in Makkah, the year of the elephant, his early years with Halimah, and the opening of his chest.", type: "reading", duration: "25 min" },
    { title: "The First Revelation — Beginning of Prophethood", titleArabic: "الوحي الأول — بداية النبوة", description: "The night of Qadr in the Cave of Hira. Jibril's first visit. Khadijah's RA role. The early believers.", type: "video", duration: "30 min" },
    { title: "Persecution in Makkah", titleArabic: "الاضطهاد في مكة المكرمة", description: "The early Muslims' suffering at the hands of Quraysh. Bilal, Ammar, Sumayyah — the first martyrs of Islam.", type: "reading", duration: "25 min" },
    { title: "The Night Journey & Ascension (Isra & Mi'raj)", titleArabic: "الإسراء والمعراج", description: "The miraculous night journey from Makkah to Jerusalem and the ascension to the heavens. The gift of the five daily prayers.", type: "video", duration: "30 min" },
    { title: "The Hijrah — Migration to Madinah", titleArabic: "الهجرة إلى المدينة", description: "The Prophet's ﷺ migration to Madinah, the journey with Abu Bakr, and the warm welcome of the Ansar.", type: "reading", duration: "25 min" },
    { title: "Building the Muslim State in Madinah", titleArabic: "بناء الدولة الإسلامية في المدينة", description: "The Constitution of Madinah, the first masjid, the brotherhood between Muhajirun and Ansar.", type: "video", duration: "30 min" },
    { title: "The Battle of Badr", titleArabic: "غزوة بدر", description: "The first major battle of Islam: causes, key figures, the miraculous victory, and its consequences.", type: "reading", duration: "25 min" },
    { title: "The Battle of Uhud", titleArabic: "غزوة أحد", description: "Lessons from the setback at Uhud: obedience, patience, and the death of Hamzah RA.", type: "reading", duration: "25 min" },
    { title: "The Treaty of Hudaybiyyah", titleArabic: "صلح الحديبية", description: "Apparent defeat that was a divine victory. The Quran calls it a 'clear conquest'. Strategic wisdom of the Prophet ﷺ.", type: "video", duration: "25 min" },
    { title: "The Conquest of Makkah", titleArabic: "فتح مكة المكرمة", description: "The bloodless conquest of Makkah in 8 AH. The Prophet's ﷺ general amnesty — forgiveness of his enemies.", type: "video", duration: "30 min" },
    { title: "The Final Sermon & the Prophet's Legacy ﷺ", titleArabic: "خطبة الوداع وإرث النبي ﷺ", description: "The complete Farewell Sermon at Arafat. The Prophet's ﷺ final illness, death, and eternal legacy.", type: "reading", duration: "35 min" },
  ],

  "seerah-companions": [
    { title: "Abu Bakr As-Siddiq RA — The Truthful", titleArabic: "أبو بكر الصديق رضي الله عنه", description: "First adult male to accept Islam. Companion in the cave. First Caliph. His wisdom and gentleness.", type: "video", duration: "30 min" },
    { title: "Umar ibn Al-Khattab RA — Al-Farouq", titleArabic: "عمر بن الخطاب رضي الله عنه", description: "His dramatic conversion, his strength and justice as Second Caliph, and his transformative leadership.", type: "video", duration: "30 min" },
    { title: "Uthman ibn Affan RA — Dhu an-Nurain", titleArabic: "عثمان بن عفان رضي الله عنه", description: "Twice the Prophet's ﷺ son-in-law. His generosity, the compilation of the Quran, and his martyrdom.", type: "reading", duration: "25 min" },
    { title: "Ali ibn Abi Talib RA — The Lion of Allah", titleArabic: "علي بن أبي طالب رضي الله عنه", description: "Raised in the Prophet's ﷺ home. Bravest companion. His knowledge, wisdom, and tenure as Fourth Caliph.", type: "reading", duration: "25 min" },
    { title: "Khadijah bint Khuwaylid RA", titleArabic: "خديجة بنت خويلد رضي الله عنها", description: "The Prophet's ﷺ first wife and greatest supporter. A successful businesswoman and the first Muslim.", type: "video", duration: "25 min" },
    { title: "Aisha bint Abi Bakr RA", titleArabic: "عائشة بنت أبي بكر رضي الله عنها", description: "Mother of the Believers. Scholar of hadith. One-quarter of Islamic law is traced through her narrations.", type: "reading", duration: "25 min" },
    { title: "Bilal ibn Rabah RA — The First Muezzin", titleArabic: "بلال بن رباح رضي الله عنه", description: "From enslaved torture victim to the Prophet's ﷺ beloved muezzin. A symbol of Islam's liberation message.", type: "video", duration: "20 min" },
    { title: "Salman Al-Farisi RA — The Persian Seeker", titleArabic: "سلمان الفارسي رضي الله عنه", description: "His incredible 40-year journey across continents seeking truth before finding Islam in Madinah.", type: "reading", duration: "25 min" },
  ],

  "seerah-islamic-history": [
    { title: "The Rightly-Guided Caliphs (Khulafa Rashidun)", titleArabic: "الخلفاء الراشدون", description: "The first four caliphs: their reigns, achievements, and the rapid spread of Islam after the Prophet ﷺ.", type: "video", duration: "30 min" },
    { title: "The Umayyad Dynasty", titleArabic: "الدولة الأموية", description: "The expansion of the Islamic state to Spain, Persia, and Central Asia under Umayyad leadership.", type: "reading", duration: "25 min" },
    { title: "The Abbasid Golden Age", titleArabic: "العصر الذهبي العباسي", description: "Baghdad as the world's centre of knowledge. Al-Kindi, Ibn Sina, Al-Biruni and the Islamic scientific revolution.", type: "video", duration: "30 min" },
    { title: "Islam in Africa", titleArabic: "الإسلام في إفريقيا", description: "The spread of Islam across East Africa, West Africa, and the Horn of Africa. Great Islamic empires of Mali and Songhai.", type: "reading", duration: "25 min" },
    { title: "The Ottoman Empire", titleArabic: "الدولة العثمانية", description: "600 years of Ottoman stewardship of the holy cities, the courts, and Islamic scholarship across three continents.", type: "video", duration: "30 min" },
    { title: "Islam in the Modern World", titleArabic: "الإسلام في العالم الحديث", description: "Islamic revival movements, the Muslim world today, challenges, and the global Muslim community.", type: "reading", duration: "25 min" },
  ],
};

function generateLessons(book: Book): Lesson[] {
  const predefined = CURRICULA[book.id];

  if (predefined) {
    const lessons: Lesson[] = predefined.slice(0, book.lessonCount).map((l, i) => ({
      number: i + 1,
      ...l,
    }));
    // Fill remaining with generated if predefined has fewer than lessonCount
    for (let i = lessons.length; i < book.lessonCount; i++) {
      lessons.push({
        number: i + 1,
        title: `Lesson ${i + 1}`,
        titleArabic: `الدرس ${i + 1}`,
        description: `Continue your study of ${book.title}. This lesson builds on previous concepts and introduces new material from the curriculum.`,
        duration: "20 min",
        type: LESSON_TYPES[i % LESSON_TYPES.length],
      });
    }
    return lessons;
  }

  // Generate lessons from book metadata
  const base: Lesson[] = [];
  for (let i = 0; i < book.lessonCount; i++) {
    const n = i + 1;
    base.push({
      number: n,
      title: `Lesson ${n}: ${book.tags[i % book.tags.length]} Studies`,
      titleArabic: `الدرس ${n}`,
      description: `This lesson covers important material from "${book.title}". Study the relevant passages, complete the exercises, and review with the AI Teacher for personalised guidance.`,
      duration: `${15 + (i % 4) * 5} min`,
      type: LESSON_TYPES[i % LESSON_TYPES.length],
    });
  }
  return base;
}

router.get("/library/books", requireAuth, async (_req, res) => {
  res.json({ books: LIBRARY_BOOKS });
});

router.get("/library/books/:bookId", requireAuth, async (req: any, res) => {
  try {
    const { bookId } = req.params;
    const book = LIBRARY_BOOKS.find((b) => b.id === bookId);
    if (!book) { res.status(404).json({ error: "Book not found" }); return; }
    const lessons = generateLessons(book);
    res.json({ book: { ...book, lessons } });
  } catch (err) {
    logger.error({ err }, "Failed to get book detail");
    res.status(500).json({ error: "Internal server error" });
  }
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
