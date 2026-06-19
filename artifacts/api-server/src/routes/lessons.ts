/**
 * Al Bayaan — Universal Lesson Content API
 * Covers all course categories: arabic, hadith, tajweed, fiqh, aqeedah, tafsir, quran, hingaad
 * GET  /api/lessons/:bookId/:lessonNum  — fetch lesson content
 * POST /api/lessons/feedback            — AI evaluation of student reading/recitation
 */

import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { setSSEHeaders, streamToResponse, type AIChatMessage } from "../lib/aiProvider";

const router = Router();

// ─── Shared Types ─────────────────────────────────────────────────────────────

interface LessonPage {
  id: number;
  arabic: string;
  translation: string;
  transliteration: string;
  note?: string;
}
interface VocabWord {
  arabic: string;
  transliteration: string;
  english: string;
  pos: string;
  plural?: string;
  example?: string;
}
interface ConceptNote {
  title: string;
  titleArabic: string;
  explanation: string;
  examples: Array<{ arabic: string; translation: string }>;
}
interface Exercise {
  type: "fill_blank" | "translate" | "match" | "choose";
  instruction: string;
  instructionArabic?: string;
  items: any[];
  answers: any[];
}
interface LessonContent {
  bookId: string;
  lessonNum: number;
  title: string;
  titleArabic: string;
  description: string;
  category: string;
  pages: LessonPage[];
  vocabulary: VocabWord[];
  grammar: ConceptNote;
  exercises: Exercise[];
  culturalNote?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LESSON DATA
// ═══════════════════════════════════════════════════════════════════════════════

const LESSONS: Record<string, LessonContent[]> = {

  // ───────────────────────────────────────────────────────────────────────────
  // ARABIC — العربية بين يديك Book 1 (10 full lessons)
  // ───────────────────────────────────────────────────────────────────────────
  "arabic-bayna-yadayk-1": [
    {
      bookId: "arabic-bayna-yadayk-1", lessonNum: 1, category: "arabic",
      title: "Greetings & Farewells", titleArabic: "التَّحِيَّاتُ وَالوَدَاع",
      description: "Essential Arabic greetings and farewells for everyday conversation.",
      pages: [
        { id: 1, arabic: "اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ.", translation: "Peace be upon you, and the mercy of Allah and His blessings.", transliteration: "As-salāmu ʿalaykum wa raḥmatu llāhi wa barakātuh.", note: "This is the full Islamic greeting — a supplication (duʿāʾ) for the person you greet." },
        { id: 2, arabic: "وَعَلَيْكُمُ السَّلَامُ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ.", translation: "And upon you peace, and the mercy of Allah and His blessings.", transliteration: "Wa ʿalaykumu s-salāmu wa raḥmatu llāhi wa barakātuh.", note: "The full reply. Notice: وَعَلَيْكُمُ comes first in the response — the word order reverses." },
        { id: 3, arabic: "كَيْفَ حَالُكَ؟\nأَنَا بِخَيْرٍ، شُكْرًا، وَالْحَمْدُ لِلَّهِ. وَأَنْتَ؟", translation: "How are you? [to male]\nI am fine, thank you, and praise be to Allah. And you?", transliteration: "Kayfa ḥāluk?\nAnā bi-khayr, shukran, wa l-ḥamdu li-llāh. Wa anta?", note: "كَيْفَ حَالُكِ (with كِ) is used for a female. Notice كَيْفَ = 'how'." },
        { id: 4, arabic: "أَهْلًا وَسَهْلًا!\nأَهْلًا بِكَ! / أَهْلًا بِكِ!", translation: "Welcome!\nWelcome to you! [male / female]", transliteration: "Ahlan wa sahlan!\nAhlan bika! / Ahlan biki!", note: "أَهْلًا وَسَهْلًا means 'you have come to family and an easy place' — a warm Arabic welcome." },
        { id: 5, arabic: "مَعَ السَّلَامَةِ!\nإِلَى اللِّقَاءِ! / إِلَى الغَدِ!", translation: "Goodbye! (lit: go with safety)\nUntil we meet again! / Until tomorrow!", transliteration: "Maʿa s-salāmah!\nIlā l-liqāʾ! / Ilā l-ghad!", note: "مَعَ السَّلَامَة is said to the person leaving. The one staying may say وَدَاعًا." },
      ],
      vocabulary: [
        { arabic: "اَلسَّلَام", transliteration: "as-salām", english: "peace", pos: "noun (m)" },
        { arabic: "رَحْمَة", transliteration: "raḥmah", english: "mercy", pos: "noun (f)", plural: "رَحَمَات" },
        { arabic: "كَيْفَ", transliteration: "kayfa", english: "how", pos: "interrogative" },
        { arabic: "حَال", transliteration: "ḥāl", english: "condition / state", pos: "noun (m/f)", plural: "أَحْوَال" },
        { arabic: "بِخَيْرٍ", transliteration: "bi-khayr", english: "fine / well", pos: "phrase", example: "أَنَا بِخَيْرٍ" },
        { arabic: "شُكْرًا", transliteration: "shukran", english: "thank you", pos: "exclamation" },
        { arabic: "اَلْحَمْدُ لِلَّهِ", transliteration: "al-ḥamdu li-llāh", english: "praise be to Allah", pos: "phrase" },
        { arabic: "أَهْلًا", transliteration: "ahlan", english: "welcome / hello", pos: "exclamation" },
        { arabic: "مَعَ السَّلَامَة", transliteration: "maʿa s-salāmah", english: "goodbye", pos: "phrase" },
        { arabic: "إِلَى اللِّقَاء", transliteration: "ilā l-liqāʾ", english: "until we meet again", pos: "phrase" },
      ],
      grammar: {
        title: "The Nominal Sentence (الجُمْلَة الاسْمِيَّة)", titleArabic: "الجُمْلَة الاسْمِيَّة",
        explanation: "Arabic nominal sentences begin with a noun/pronoun and have NO verb 'to be'.\n\n• المُبْتَدَأ (Subject): always definite\n• الخَبَر (Predicate): describes the subject\n\nExample: اَلسَّلَامُ عَلَيْكُمْ\n→ اَلسَّلَامُ (subject) + عَلَيْكُمْ (predicate)",
        examples: [
          { arabic: "أَنَا طَالِبٌ.", translation: "I am a student." },
          { arabic: "هُوَ مُعَلِّمٌ.", translation: "He is a teacher." },
          { arabic: "البَيْتُ كَبِيرٌ.", translation: "The house is big." },
        ],
      },
      exercises: [
        {
          type: "fill_blank", instruction: "Fill in the blank.", instructionArabic: "أَكْمِلِ الفَرَاغ.",
          items: [{ sentence: "اَلسَّلَامُ ___ وَرَحْمَةُ اللهِ.", blank: 1, hint: "upon you (pl)" }, { sentence: "كَيْفَ ___؟", blank: 1, hint: "your condition [m]" }, { sentence: "أَنَا ___ وَالْحَمْدُ لِلَّهِ.", blank: 1, hint: "fine" }, { sentence: "___ وَسَهْلًا!", blank: 1, hint: "welcome" }],
          answers: ["عَلَيْكُمْ", "حَالُكَ", "بِخَيْرٍ", "أَهْلًا"],
        },
        {
          type: "choose", instruction: "Choose the correct answer.", instructionArabic: "اِخْتَرِ الجَوَابَ الصَّحِيح.",
          items: [{ question: "How do you say 'How are you?' to a female?", options: ["كَيْفَ حَالُكَ؟", "كَيْفَ حَالُكِ؟", "كَيْفَ أَنْتَ؟"], answer: 1 }, { question: "What does اَلْحَمْدُ لِلَّهِ mean?", options: ["Thank you", "Goodbye", "Praise be to Allah"], answer: 2 }],
          answers: [1, 2],
        },
      ],
      culturalNote: "The Prophet ﷺ said: 'Spread the greeting of salaam among yourselves.' (Muslim). The full greeting اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ carries 30 good deeds, while the shorter form carries 10.",
    },
    {
      bookId: "arabic-bayna-yadayk-1", lessonNum: 2, category: "arabic",
      title: "The Arabic Alphabet", titleArabic: "الحُرُوفُ العَرَبِيَّة",
      description: "Master the 28 Arabic letters and read vowel marks (harakat).",
      pages: [
        { id: 1, arabic: "الحُرُوفُ العَرَبِيَّةُ ثَمَانِيَةٌ وَعِشْرُونَ حَرْفًا.\nتُكْتَبُ مِنَ اليَمِينِ إِلَى اليَسَارِ.", translation: "The Arabic letters are twenty-eight letters.\nThey are written from right to left.", transliteration: "Al-ḥurūfu l-ʿarabiyyatu thamāniyatun wa ʿishrūna ḥarfan.\nTuktabu min al-yamīni ilā l-yasār.", note: "Arabic is written right-to-left. Most letters connect to neighbours." },
        { id: 2, arabic: "أَلِفٌ — بَاءٌ — تَاءٌ — ثَاءٌ — جِيمٌ — حَاءٌ — خَاءٌ\nدَالٌ — ذَالٌ — رَاءٌ — زَايٌ — سِينٌ — شِينٌ", translation: "Alif — Bāʾ — Tāʾ — Thāʾ — Jīm — Ḥāʾ — Khāʾ\nDāl — Dhāl — Rāʾ — Zāy — Sīn — Shīn", transliteration: "ʾ — b — t — th — j — ḥ — kh / d — dh — r — z — s — sh", note: "ب ت ث differ only by number/position of dots. ح (deep throat h) and خ (Scottish 'loch') are distinct sounds." },
        { id: 3, arabic: "صَادٌ — ضَادٌ — طَاءٌ — ظَاءٌ — عَيْنٌ — غَيْنٌ\nفَاءٌ — قَافٌ — كَافٌ — لَامٌ — مِيمٌ — نُونٌ — هَاءٌ — وَاوٌ — يَاءٌ", translation: "Ṣād — Ḍād — Ṭāʾ — Ẓāʾ — ʿAyn — Ghayn\nFāʾ — Qāf — Kāf — Lām — Mīm — Nūn — Hāʾ — Wāw — Yāʾ", transliteration: "ṣ — ḍ — ṭ — ẓ — ʿ — gh / f — q — k — l — m — n — h — w — y", note: "Arabic is the ONLY language with the ض sound. ع is a voiced pharyngeal — constrict the throat while producing a vowel." },
        { id: 4, arabic: "الحَرَكَاتُ الثَّلَاث:\nفَتْحَةٌ (ـَ): كَتَبَ — ضَمَّةٌ (ـُ): يَكْتُبُ — كَسْرَةٌ (ـِ): بِسْمِ", translation: "The three short vowels:\nFatḥah (a): kataba — Ḍammah (u): yaktubu — Kasrah (i): bismi", transliteration: "al-ḥarakātu th-thalāth: fatḥah — ḍammah — kasrah", note: "Harakat (short vowels) are small marks above/below letters. Sukūn (ـْ) means no vowel. Shaddah (ـّ) doubles the letter." },
      ],
      vocabulary: [
        { arabic: "حَرْف", transliteration: "ḥarf", english: "letter", pos: "noun (m)", plural: "حُرُوف" },
        { arabic: "كَلِمَة", transliteration: "kalimah", english: "word", pos: "noun (f)", plural: "كَلِمَات" },
        { arabic: "فَتْحَة", transliteration: "fatḥah", english: "short 'a' vowel (ـَ)", pos: "noun (f)" },
        { arabic: "ضَمَّة", transliteration: "ḍammah", english: "short 'u' vowel (ـُ)", pos: "noun (f)" },
        { arabic: "كَسْرَة", transliteration: "kasrah", english: "short 'i' vowel (ـِ)", pos: "noun (f)" },
        { arabic: "سُكُون", transliteration: "sukūn", english: "no-vowel mark (ـْ)", pos: "noun (m)" },
        { arabic: "شَدَّة", transliteration: "shaddah", english: "doubling mark (ـّ)", pos: "noun (f)" },
        { arabic: "تَنْوِين", transliteration: "tanwīn", english: "nunation — indefinite ending (ـٌ ـٍ ـً)", pos: "noun (m)" },
      ],
      grammar: {
        title: "Arabic Short Vowels (الحَرَكَات)", titleArabic: "الحَرَكَات",
        explanation: "Three short vowels:\n• فَتْحَة (ـَ) = 'a' → كَتَبَ (kataba)\n• ضَمَّة (ـُ) = 'u' → يَكْتُبُ (yaktubu)\n• كَسْرَة (ـِ) = 'i' → بِسْمِ (bismi)\n\nSpecial marks:\n• سُكُون (ـْ) = no vowel after\n• شَدَّة (ـّ) = double the letter\n• تَنْوِين = adds 'n' sound for indefinite nouns",
        examples: [
          { arabic: "كَتَبَ — يَكْتُبُ — كِتَابٌ", translation: "he wrote — he writes — a book (all from root ك-ت-ب)" },
          { arabic: "مُسْلِمٌ", translation: "Muslim (ḍammah-sukūn-kasrah pattern)" },
          { arabic: "اللهُ أَكْبَرُ", translation: "Allah is the Greatest" },
        ],
      },
      exercises: [
        {
          type: "choose", instruction: "Identify the vowel on the bold letter.", instructionArabic: "حَدِّدِ الحَرَكَةَ.",
          items: [{ question: "The vowel in بَيْت (bayt — house)", options: ["fatḥah (a)", "ḍammah (u)", "kasrah (i)", "sukūn"], answer: 0 }, { question: "The vowel in مِنْ (min — from)", options: ["fatḥah (a)", "ḍammah (u)", "kasrah (i)", "sukūn"], answer: 2 }],
          answers: [0, 2],
        },
      ],
    },
    {
      bookId: "arabic-bayna-yadayk-1", lessonNum: 3, category: "arabic",
      title: "Numbers 1–10", titleArabic: "الأَرْقَامُ مِنْ ١ إِلَى ١٠",
      description: "Count in Arabic and understand the polarity rule for numbers 3–10.",
      pages: [
        { id: 1, arabic: "وَاحِدٌ — اثْنَانِ — ثَلَاثَةٌ — أَرْبَعَةٌ — خَمْسَةٌ", translation: "One — Two — Three — Four — Five", transliteration: "Wāḥid — Ithnān — Thalāthah — Arbaʿah — Khamsah", note: "These are the 'with-ة' forms used with masculine nouns (3–10). Arabic numbers have OPPOSITE gender to the noun they count!" },
        { id: 2, arabic: "سِتَّةٌ — سَبْعَةٌ — ثَمَانِيَةٌ — تِسْعَةٌ — عَشَرَةٌ", translation: "Six — Seven — Eight — Nine — Ten", transliteration: "Sittah — Sabʿah — Thamāniyah — Tisʿah — ʿAsharah", note: "Numbers 3–10: add ة for masculine nouns, remove ة for feminine nouns. This is called مُعَاكَسَة (polarity)." },
        { id: 3, arabic: "كَمْ كِتَابًا عِنْدَكَ؟\nعِنْدِي ثَلَاثَةُ كُتُبٍ وَخَمْسُ كُرَّاسَاتٍ.", translation: "How many books do you have?\nI have three books and five notebooks.", transliteration: "Kam kitāban ʿindak?\nʿIndī thalāthatu kutubin wa khamsu kurrāsāt.", note: "كُتُب (books, m) → ثَلَاثَةُ (with ة). كُرَّاسَات (notebooks, f) → خَمْسُ (without ة)." },
        { id: 4, arabic: "فِي المَدْرَسَةِ عَشَرَةُ فُصُولٍ.\nفِي كُلِّ فَصْلٍ ثَمَانِيَةٌ وَعِشْرُونَ طَالِبًا.", translation: "In the school there are ten classrooms.\nIn each classroom there are twenty-eight students.", transliteration: "Fī l-madrasati ʿasharatu fuṣūl.\nFī kulli faṣlin thamāniyatun wa ʿishrūna ṭālibanā.", note: "Compound numbers: وَ (and) joins the tens and units. The number comes before the noun in genitive (majrūr) case." },
      ],
      vocabulary: [
        { arabic: "وَاحِد", transliteration: "wāḥid", english: "one", pos: "number" },
        { arabic: "اثْنَان", transliteration: "ithnān", english: "two", pos: "number" },
        { arabic: "ثَلَاثَة", transliteration: "thalāthah", english: "three", pos: "number" },
        { arabic: "أَرْبَعَة", transliteration: "arbaʿah", english: "four", pos: "number" },
        { arabic: "خَمْسَة", transliteration: "khamsah", english: "five", pos: "number" },
        { arabic: "سِتَّة", transliteration: "sittah", english: "six", pos: "number" },
        { arabic: "سَبْعَة", transliteration: "sabʿah", english: "seven", pos: "number" },
        { arabic: "ثَمَانِيَة", transliteration: "thamāniyah", english: "eight", pos: "number" },
        { arabic: "تِسْعَة", transliteration: "tisʿah", english: "nine", pos: "number" },
        { arabic: "عَشَرَة", transliteration: "ʿasharah", english: "ten", pos: "number" },
        { arabic: "كَمْ", transliteration: "kam", english: "how many/much", pos: "interrogative" },
        { arabic: "عِنْدِي", transliteration: "ʿindī", english: "I have (lit: at me)", pos: "phrase" },
      ],
      grammar: {
        title: "Number-Noun Polarity (المُعَاكَسَة في الأَعْدَاد)", titleArabic: "المُعَاكَسَة",
        explanation: "Numbers 3–10 take the OPPOSITE gender of the noun:\n• MASCULINE noun → use number WITH ة: ثَلَاثَةُ رِجَالٍ (3 men)\n• FEMININE noun → use number WITHOUT ة: ثَلَاثُ نِسَاءٍ (3 women)\n\nFor 1 & 2: they AGREE with the noun's gender.\nFor 11–99: different rules apply (covered later).",
        examples: [
          { arabic: "خَمْسَةُ أَقْلَامٍ", translation: "5 pens (قَلَم is masculine → خَمْسَة with ة)" },
          { arabic: "خَمْسُ طَاوِلَاتٍ", translation: "5 tables (طَاوِلَة is feminine → خَمْسُ without ة)" },
          { arabic: "سَبْعَةُ أَيَّامٍ", translation: "7 days (يَوْم is masculine)" },
        ],
      },
      exercises: [
        {
          type: "choose", instruction: "Which form is correct?", instructionArabic: "أَيُّ الصِّيَغِ صَحِيح؟",
          items: [{ question: "Five books (كِتَاب — masculine)", options: ["خَمْسُ كُتُبٍ", "خَمْسَةُ كُتُبٍ"], answer: 1 }, { question: "Three girls (بِنْت — feminine)", options: ["ثَلَاثَةُ بَنَاتٍ", "ثَلَاثُ بَنَاتٍ"], answer: 1 }],
          answers: [1, 1],
        },
        {
          type: "translate", instruction: "Translate into Arabic.", instructionArabic: "تَرْجِمْ إِلَى العَرَبِيَّة.",
          items: [{ english: "How many books?" }, { english: "I have seven pens." }, { english: "Ten students in the class." }],
          answers: ["كَمْ كِتَابًا؟", "عِنْدِي سَبْعَةُ أَقْلَامٍ.", "عَشَرَةُ طُلَّابٍ فِي الفَصْلِ."],
        },
      ],
    },
    {
      bookId: "arabic-bayna-yadayk-1", lessonNum: 4, category: "arabic",
      title: "Personal Pronouns", titleArabic: "الضَّمَائِر الشَّخْصِيَّة",
      description: "Learn all Arabic personal pronouns and form simple sentences.",
      pages: [
        { id: 1, arabic: "أَنَا — نَحْنُ\nأَنْتَ — أَنْتِ\nهُوَ — هِيَ", translation: "I — We\nYou (m.) — You (f.)\nHe — She", transliteration: "Anā — Naḥnu\nAnta — Anti\nHuwa — Hiya", note: "Arabic has separate pronouns for masculine and feminine in 2nd and 3rd person. English only does this for he/she." },
        { id: 2, arabic: "أَنَا مُسْلِمٌ مِنَ الصُّومَال.\nأَنْتَ مِنْ أَيْنَ؟\nهُوَ مُعَلِّمٌ مِنَ السُّعُودِيَّة.", translation: "I am a Muslim from Somalia.\nWhere are you from?\nHe is a teacher from Saudi Arabia.", transliteration: "Anā muslimun min aṣ-Ṣūmāl.\nAnta min ayna?\nHuwa muʿallimun min as-Suʿūdiyyah.", note: "أَنَا مُسْلِمٌ — no 'am' needed! The pronoun + noun = complete sentence." },
        { id: 3, arabic: "هِيَ مُدَرِّسَةٌ وَطَالِبَةٌ أَيْضًا.\nنَحْنُ أَصْدِقَاءٌ.\nهُمْ طُلَّابٌ مِنَ اليَمَن.", translation: "She is a teacher and also a student.\nWe are friends.\nThey are students from Yemen.", transliteration: "Hiya mudarrisatun wa ṭālibatun ayḍan.\nNaḥnu aṣdiqāʾ.\nHum ṭullābun min al-Yaman.", note: "أَيْضًا (ayḍan) = 'also/too'. هُمْ is the default 3rd person plural for mixed or male groups." },
      ],
      vocabulary: [
        { arabic: "أَنَا", transliteration: "anā", english: "I", pos: "pronoun" },
        { arabic: "أَنْتَ", transliteration: "anta", english: "you (m.sg.)", pos: "pronoun" },
        { arabic: "أَنْتِ", transliteration: "anti", english: "you (f.sg.)", pos: "pronoun" },
        { arabic: "هُوَ", transliteration: "huwa", english: "he / it (m.)", pos: "pronoun" },
        { arabic: "هِيَ", transliteration: "hiya", english: "she / it (f.)", pos: "pronoun" },
        { arabic: "نَحْنُ", transliteration: "naḥnu", english: "we", pos: "pronoun" },
        { arabic: "أَنْتُمْ", transliteration: "antum", english: "you (m.pl.)", pos: "pronoun" },
        { arabic: "هُمْ", transliteration: "hum", english: "they (m.pl.)", pos: "pronoun" },
        { arabic: "هُنَّ", transliteration: "hunna", english: "they (f.pl.)", pos: "pronoun" },
        { arabic: "مِنْ أَيْنَ", transliteration: "min ayna", english: "from where?", pos: "interrogative phrase" },
      ],
      grammar: {
        title: "Detached Pronouns as Subject (الضَّمِير المُنْفَصِل مُبْتَدَأً)", titleArabic: "الضَّمَائِر المُنْفَصِلَة",
        explanation: "In nominal sentences, the detached pronoun is the subject (مُبْتَدَأ).\n\nArabic has 12 pronoun forms (English has 7):\n• Singular: أَنَا، أَنْتَ، أَنْتِ، هُوَ، هِيَ\n• Dual: أَنْتُمَا، هُمَا\n• Plural: نَحْنُ، أَنْتُمْ، أَنْتُنَّ، هُمْ، هُنَّ\n\nKey: the predicate (خَبَر) matches the pronoun's gender. أَنَا طَالِبٌ (m) vs أَنَا طَالِبَةٌ (f).",
        examples: [
          { arabic: "أَنَا طَالِبٌ.", translation: "I am a student. (m)" },
          { arabic: "هِيَ مُعَلِّمَةٌ مِنَ مِصْر.", translation: "She is a teacher from Egypt." },
          { arabic: "نَحْنُ مُسْلِمُون.", translation: "We are Muslims." },
        ],
      },
      exercises: [
        {
          type: "choose", instruction: "Choose the correct pronoun.", instructionArabic: "اِخْتَرِ الضَّمِيرَ الصَّحِيح.",
          items: [{ question: "Addressing one female", options: ["أَنَا", "أَنْتَ", "أَنْتِ", "هِيَ"], answer: 2 }, { question: "She is a teacher", options: ["هُوَ مُعَلِّمٌ", "هِيَ مُعَلِّمَةٌ", "أَنْتِ مُعَلِّمَةٌ"], answer: 1 }],
          answers: [2, 1],
        },
        {
          type: "translate", instruction: "Translate into Arabic.", instructionArabic: "تَرْجِمْ إِلَى العَرَبِيَّة.",
          items: [{ english: "He is a doctor." }, { english: "We are Muslims." }, { english: "They (m) are students from Somalia." }],
          answers: ["هُوَ طَبِيبٌ.", "نَحْنُ مُسْلِمُون.", "هُمْ طُلَّابٌ مِنَ الصُّومَال."],
        },
      ],
    },
    {
      bookId: "arabic-bayna-yadayk-1", lessonNum: 5, category: "arabic",
      title: "The Definite Article & Gender", titleArabic: "أَلْ التَّعْرِيف وَالجِنْس",
      description: "Make nouns definite with أَلْ and understand sun/moon letter assimilation.",
      pages: [
        { id: 1, arabic: "كِتَابٌ — اَلكِتَابُ\nقَلَمٌ — اَلقَلَمُ\nطَالِبٌ — اَلطَّالِبُ", translation: "a book — THE book\na pen — THE pen\na student — THE student", transliteration: "Kitābun — al-kitābu\nQalamun — al-qalamu\nṬālibun — aṭ-ṭālibu", note: "Adding أَلْ makes the noun DEFINITE. The tanwīn (ـٌ) disappears. Watch: اَلطَّالِب — the ل assimilates to ط (sun letter)!" },
        { id: 2, arabic: "اَلحُرُوفُ القَمَرِيَّة: أ ب ج ح خ ع غ ف ق ك م و ه ي\nمِثَال: اَلبَيْتُ، اَلقَلَمُ، اَلكِتَابُ", translation: "Moon letters (أَلْ is pronounced fully: al-)\nExamples: the house, the pen, the book", transliteration: "Al-ḥurūf al-qamariyyah\nal-baytu, al-qalamu, al-kitābu", note: "14 MOON letters — أَلْ keeps its ل: al-bayt, al-qalam. Called 'moon' because القَمَر (the moon) is a moon letter." },
        { id: 3, arabic: "اَلحُرُوفُ الشَّمْسِيَّة: ت ث د ذ ر ز س ش ص ض ط ظ ل ن\nمِثَال: اَلشَّمْسُ، اَلنُّورُ، اَلطَّالِبُ", translation: "Sun letters (ل assimilates to the next letter)\nExamples: the sun, the light, the student", transliteration: "Al-ḥurūf ash-shamsiyyah\nash-shamsu, an-nūru, aṭ-ṭālibu", note: "14 SUN letters — the ل disappears and the letter doubles: aṭ-ṭālib (not al-ṭālib). Called 'sun' because اَلشَّمْس is a sun letter." },
      ],
      vocabulary: [
        { arabic: "أَلْ", transliteration: "al-", english: "the (definite article)", pos: "particle" },
        { arabic: "نَكِرَة", transliteration: "nakirah", english: "indefinite (a/an)", pos: "noun" },
        { arabic: "مَعْرِفَة", transliteration: "maʿrifah", english: "definite (the)", pos: "noun" },
        { arabic: "مُذَكَّر", transliteration: "mudhakar", english: "masculine", pos: "noun" },
        { arabic: "مُؤَنَّث", transliteration: "muʾannath", english: "feminine", pos: "noun" },
        { arabic: "شَمْسِيّ", transliteration: "shamsī", english: "sun letter", pos: "adj" },
        { arabic: "قَمَرِيّ", transliteration: "qamarī", english: "moon letter", pos: "adj" },
        { arabic: "بَاب", transliteration: "bāb", english: "door", pos: "noun (m)", plural: "أَبْوَاب" },
        { arabic: "شَجَرَة", transliteration: "shajarah", english: "tree", pos: "noun (f)", plural: "أَشْجَار" },
      ],
      grammar: {
        title: "Sun & Moon Letters (الشَّمْسِيَّة والقَمَرِيَّة)", titleArabic: "الشَّمْسِيَّة والقَمَرِيَّة",
        explanation: "MOON letters (14): أ ب ج ح خ ع غ ف ق ك م و ه ي → أَلْ pronounced fully: al-\nSUN letters (14): ت ث د ذ ر ز س ش ص ض ط ظ ل ن → ل assimilates: ash- / ar- / aṭ-\n\nTip: sun letters are pronounced at the FRONT of the mouth (like the sun is close), moon letters at the BACK (like the moon is far).",
        examples: [
          { arabic: "اَلكِتَابُ (al-kitābu)", translation: "the book — ك is moon letter" },
          { arabic: "اَلشَّمْسُ (ash-shamsu)", translation: "the sun — ش is sun letter" },
          { arabic: "اَلرَّجُلُ (ar-rajulu)", translation: "the man — ر is sun letter" },
        ],
      },
      exercises: [
        {
          type: "choose", instruction: "How is أَلْ pronounced with this word?", instructionArabic: "كَيْفَ تُنْطَقُ أَلْ مَعَ هَذِهِ الكَلِمَة؟",
          items: [{ question: "اَلنُّور (the light) — ن is a:", options: ["moon letter → say al-nūr", "sun letter → say an-nūr"], answer: 1 }, { question: "اَلبَيْت (the house) — ب is a:", options: ["moon letter → say al-bayt", "sun letter → say ab-bayt"], answer: 0 }],
          answers: [1, 0],
        },
      ],
    },
    {
      bookId: "arabic-bayna-yadayk-1", lessonNum: 6, category: "arabic",
      title: "Professions & Occupations", titleArabic: "المِهَنُ وَالوَظَائِف",
      description: "Learn names of professions and form sentences describing people's jobs.",
      pages: [
        { id: 1, arabic: "مَا مِهْنَتُكَ؟ — أَنَا طَبِيبٌ.\nمَا مِهْنَتُكِ؟ — أَنَا مُمَرِّضَةٌ.", translation: "What is your profession? [m] — I am a doctor.\nWhat is your profession? [f] — I am a nurse.", transliteration: "Mā mihnatuk? — Anā ṭabīb.\nMā mihnatuki? — Anā mumarriḍah.", note: "مِهْنَة (profession) takes ـكَ for male and ـكِ for female. Most professions have masculine and feminine forms." },
        { id: 2, arabic: "هُوَ مُهَنْدِسٌ مَاهِرٌ.\nهِيَ مُعَلِّمَةٌ فِي مَدْرَسَةٍ إِسْلَامِيَّةٍ.\nهُمْ تُجَّارٌ نَاجِحُون.", translation: "He is a skilled engineer.\nShe is a teacher in an Islamic school.\nThey are successful merchants.", transliteration: "Huwa muhandisun māhir.\nHiya muʿallimah fī madrasatin islāmiyyah.\nHum tujjārun nājiḥūn.", note: "Adjectives follow and agree with the noun: مُهَنْدِسٌ مَاهِرٌ (m), مُعَلِّمَةٌ (f), تُجَّارٌ نَاجِحُون (m.pl)." },
        { id: 3, arabic: "أَيْنَ تَعْمَلُ؟ — أَعْمَلُ فِي مُسْتَشْفَى.\nأَيْنَ تَعْمَلِين؟ — أَعْمَلُ فِي مَكْتَبٍ.", translation: "Where do you work? [m] — I work in a hospital.\nWhere do you work? [f] — I work in an office.", transliteration: "Ayna taʿmal? — Aʿmalu fī mustashfā.\nAyna taʿmalīn? — Aʿmalu fī maktab.", note: "تَعْمَلُ (you work, m) vs تَعْمَلِين (you work, f). The verb distinguishes gender in the 2nd person." },
      ],
      vocabulary: [
        { arabic: "طَبِيب", transliteration: "ṭabīb", english: "doctor (m)", pos: "noun (m)", plural: "أَطِبَّاء" },
        { arabic: "طَبِيبَة", transliteration: "ṭabībah", english: "doctor (f)", pos: "noun (f)" },
        { arabic: "مُعَلِّم", transliteration: "muʿallim", english: "teacher (m)", pos: "noun (m)", plural: "مُعَلِّمُون" },
        { arabic: "مُهَنْدِس", transliteration: "muhandis", english: "engineer (m)", pos: "noun (m)", plural: "مُهَنْدِسُون" },
        { arabic: "مُمَرِّض", transliteration: "mumarriḍ", english: "nurse (m)", pos: "noun (m)" },
        { arabic: "تَاجِر", transliteration: "tājir", english: "merchant / trader (m)", pos: "noun (m)", plural: "تُجَّار" },
        { arabic: "مَكْتَب", transliteration: "maktab", english: "office / desk", pos: "noun (m)", plural: "مَكَاتِب" },
        { arabic: "مُسْتَشْفَى", transliteration: "mustashfā", english: "hospital", pos: "noun (m)", plural: "مُسْتَشْفَيَات" },
        { arabic: "مِهْنَة", transliteration: "mihnah", english: "profession", pos: "noun (f)", plural: "مِهَن" },
        { arabic: "عَمِلَ — يَعْمَلُ", transliteration: "ʿamila — yaʿmalu", english: "to work", pos: "verb" },
        { arabic: "مَاهِر", transliteration: "māhir", english: "skilled / expert", pos: "adjective" },
        { arabic: "نَاجِح", transliteration: "nājiḥ", english: "successful", pos: "adjective" },
      ],
      grammar: {
        title: "The Present Tense Verb (الفِعْل المُضَارِع)", titleArabic: "الفِعْل المُضَارِع",
        explanation: "Present tense verbs are conjugated for person and gender:\n\n• أَعْمَلُ — I work (1st person)\n• تَعْمَلُ — you work (m) / تَعْمَلِين — you work (f)\n• يَعْمَلُ — he works / تَعْمَلُ — she works\n• نَعْمَلُ — we work\n• يَعْمَلُون — they work (m)\n\nPattern: prefixes indicate person; suffixes indicate number/gender.",
        examples: [
          { arabic: "أَنَا أَعْمَلُ فِي مَكْتَبٍ.", translation: "I work in an office." },
          { arabic: "هِيَ تَعْمَلُ فِي مُسْتَشْفَى.", translation: "She works in a hospital." },
          { arabic: "هُمْ يَعْمَلُون فِي مَصْنَعٍ.", translation: "They work in a factory." },
        ],
      },
      exercises: [
        {
          type: "match", instruction: "Match Arabic profession to English.", instructionArabic: "طَابِقْ بَيْنَ المِهَنِ.",
          items: [{ arabic: "طَبِيبٌ", english: "Doctor" }, { arabic: "مُهَنْدِسٌ", english: "Engineer" }, { arabic: "مُعَلِّمٌ", english: "Teacher" }, { arabic: "تَاجِرٌ", english: "Merchant" }],
          answers: [0, 1, 2, 3],
        },
        {
          type: "translate", instruction: "Translate into Arabic.", instructionArabic: "تَرْجِمْ إِلَى العَرَبِيَّة.",
          items: [{ english: "What is your profession? [to female]" }, { english: "I am a doctor." }, { english: "She works in a hospital." }],
          answers: ["مَا مِهْنَتُكِ؟", "أَنَا طَبِيبٌ/طَبِيبَة.", "هِيَ تَعْمَلُ فِي مُسْتَشْفَى."],
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // HADITH — Forty Hadith of Imam An-Nawawi (5 full hadith)
  // ───────────────────────────────────────────────────────────────────────────
  "hadith-arbaeen-nawawi": [
    {
      bookId: "hadith-arbaeen-nawawi", lessonNum: 1, category: "hadith",
      title: "Hadith 1 — Actions by Intentions", titleArabic: "الحَدِيث الأَوَّل: الأَعْمَالُ بِالنِّيَّات",
      description: "The foundational hadith of Islam: all deeds are judged by their intentions.",
      pages: [
        { id: 1, arabic: "عَنْ أَمِيرِ المُؤْمِنِينَ أَبِي حَفْصٍ عُمَرَ بْنِ الخَطَّابِ رَضِيَ اللهُ عَنْهُ قَالَ:", translation: "On the authority of the Commander of the Faithful, Abu Hafs ʿUmar ibn al-Khaṭṭāb (may Allah be pleased with him), who said:", transliteration: "ʿAn Amīri l-Muʾminīna Abī Ḥafṣin ʿUmara bni l-Khaṭṭābi raḍiya llāhu ʿanhu qāla:", note: "رَضِيَ اللهُ عَنْهُ (may Allah be pleased with him) — said after the name of any Companion." },
        { id: 2, arabic: "سَمِعْتُ رَسُولَ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يَقُولُ:\n«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى.»", translation: "I heard the Messenger of Allah (ﷺ) say:\n'Actions are only by intentions, and every person will have only what they intended.'", transliteration: "Samiʿtu Rasūla llāhi ṣallā llāhu ʿalayhi wa sallama yaqūlu:\n«Innamā l-aʿmālu bi-n-niyyāti, wa innamā li-kulli mriʾin mā nawā.»", note: "إِنَّمَا is a restrictive particle meaning 'only' or 'nothing but'. نِيَّة (intention) must be in the heart." },
        { id: 3, arabic: "«فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللهِ وَرَسُولِهِ،\nوَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوِ امْرَأَةٍ يَنْكِحُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ.»", translation: "'So whoever emigrated for Allah and His Messenger, his emigration is for Allah and His Messenger.\nAnd whoever emigrated for worldly gain or for a woman to marry, his emigration is for what he emigrated for.'", transliteration: "«Faman kānat hijratuhu ilā llāhi wa rasūlihi fahijratuhu ilā llāhi wa rasūlih...", note: "Context: This hadith was revealed regarding the migration to Madinah. هِجْرَة = migration/emigration. The example shows how intention determines the spiritual value of the act." },
      ],
      vocabulary: [
        { arabic: "نِيَّة", transliteration: "niyyah", english: "intention", pos: "noun (f)", plural: "نِيَّات", example: "الأَعْمَالُ بِالنِّيَّات" },
        { arabic: "عَمَل", transliteration: "ʿamal", english: "deed / action", pos: "noun (m)", plural: "أَعْمَال" },
        { arabic: "إِنَّمَا", transliteration: "innamā", english: "only / nothing but", pos: "restrictive particle" },
        { arabic: "امْرُؤٌ", transliteration: "imruʾun", english: "a man / person", pos: "noun (m)" },
        { arabic: "نَوَى — يَنْوِي", transliteration: "nawā — yanwī", english: "to intend", pos: "verb" },
        { arabic: "هِجْرَة", transliteration: "hijrah", english: "emigration / migration", pos: "noun (f)" },
        { arabic: "دُنْيَا", transliteration: "dunyā", english: "this world / worldly life", pos: "noun (f)" },
        { arabic: "رَسُول", transliteration: "rasūl", english: "messenger", pos: "noun (m)", plural: "رُسُل" },
        { arabic: "صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ", transliteration: "ṣallā llāhu ʿalayhi wa sallam", english: "may Allah's peace and blessings be upon him", pos: "durood phrase" },
        { arabic: "رَضِيَ اللهُ عَنْهُ", transliteration: "raḍiya llāhu ʿanh", english: "may Allah be pleased with him", pos: "phrase" },
      ],
      grammar: {
        title: "The Lesson of Hadith 1 (فِقْه الحَدِيث)", titleArabic: "فِقْهُ الحَدِيث الأَوَّل",
        explanation: "Imam Al-Nawawi placed this hadith FIRST in his Forty Hadith because it is the foundation of all Islamic actions.\n\nKey lessons:\n1. An action has two components: the outward act (عَمَل) and the inner intention (نِيَّة)\n2. The spiritual value of any deed depends on its intention\n3. The SAME act can be worship or mere habit depending on intention — even eating can be worship if done with the right intention\n4. Imam Al-Shafi'ī said: 'This hadith is a third of all knowledge'\n5. The hadith covers all 'adāt (habits) being converted to worship through intention\n\nApplication: Before any act of worship, RENEW your intention in your heart.",
        examples: [
          { arabic: "صَلَّيْتُ لِأَنَّ اللهَ أَمَرَنِي.", translation: "I prayed because Allah commanded me. ✓ (correct intention)" },
          { arabic: "صُمْتُ لِأَفْقِدَ الوَزْن.", translation: "I fasted to lose weight. (worldly intention — no spiritual reward)" },
          { arabic: "طَلَبْتُ العِلْمَ لِلَّهِ.", translation: "I sought knowledge for Allah's sake. ✓" },
        ],
      },
      exercises: [
        {
          type: "choose", instruction: "What does إِنَّمَا الأَعْمَالُ بِالنِّيَّات mean?", instructionArabic: "مَا مَعْنَى هَذَا الحَدِيث؟",
          items: [{ question: "Translate: إِنَّمَا الأَعْمَالُ بِالنِّيَّات", options: ["Actions need effort", "Actions are only by intentions", "Good deeds are rewarded", "Worship requires purity"], answer: 1 }, { question: "If someone fasts only to lose weight, what is the ruling?", options: ["Full reward, intention doesn't matter", "No spiritual reward but the fast counts", "The fast is invalid", "Partial reward"], answer: 1 }],
          answers: [1, 1],
        },
        {
          type: "translate", instruction: "Translate into Arabic.", instructionArabic: "تَرْجِمْ إِلَى العَرَبِيَّة.",
          items: [{ english: "Actions are only by intentions." }, { english: "He intended to seek knowledge for Allah." }, { english: "May Allah be pleased with him." }],
          answers: ["إِنَّمَا الأَعْمَالُ بِالنِّيَّات.", "نَوَى طَلَبَ العِلْمِ لِلَّه.", "رَضِيَ اللهُ عَنْهُ."],
        },
      ],
      culturalNote: "This is one of the most important hadith in Islam. Imam Ahmad ibn Hanbal said it is one of the foundations upon which all of Islam rests. The hadith was related to the migration (hijrah) to Madinah: someone migrated for a woman named Umm Qays, so he became known as 'the one who migrated for Umm Qays' — his migration had no spiritual reward.",
    },
    {
      bookId: "hadith-arbaeen-nawawi", lessonNum: 2, category: "hadith",
      title: "Hadith 2 — Islam, Iman & Ihsan", titleArabic: "الحَدِيث الثَّانِي: الإِسْلَام وَالإِيمَان وَالإِحْسَان",
      description: "The Hadith of Jibril — the three levels of religion: submission, faith, and excellence.",
      pages: [
        { id: 1, arabic: "عَنْ عُمَرَ بْنِ الخَطَّابِ رَضِيَ اللهُ عَنْهُ قَالَ:\nbيَنَمَا نَحْنُ جُلُوسٌ عِنْدَ رَسُولِ اللهِ ﷺ ذَاتَ يَوْمٍ إِذْ طَلَعَ عَلَيْنَا رَجُلٌ شَدِيدُ بَيَاضِ الثِّيَابِ، شَدِيدُ سَوَادِ الشَّعَرِ", translation: "On the authority of ʿUmar ibn al-Khaṭṭāb: 'While we were sitting with the Messenger of Allah ﷺ one day, a man appeared with intensely white clothes and intensely black hair.'", transliteration: "Baynamanā naḥnu julūsun ʿinda rasūli llāhi...", note: "This is the angel Jibrīl (Gabriel) appearing as a man to ask questions so the Companions could learn. A dramatic teaching moment!" },
        { id: 2, arabic: "قَالَ: أَخْبِرْنِي عَنِ الإِسْلَامِ.\nقَالَ: «الإِسْلَامُ أَنْ تَشْهَدَ أَنْ لَا إِلَهَ إِلَّا اللهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللهِ، وَتُقِيمَ الصَّلَاةَ، وَتُؤْتِيَ الزَّكَاةَ، وَتَصُومَ رَمَضَانَ، وَتَحُجَّ البَيْتَ إِنِ اسْتَطَعْتَ إِلَيْهِ سَبِيلًا.»", translation: "He said: 'Tell me about Islam.'\nHe replied: 'Islam is to testify that there is no god but Allah and that Muhammad is the Messenger of Allah, to establish the prayer, to pay zakat, to fast Ramadan, and to make pilgrimage to the House if you are able.'", transliteration: "Qāla: Akhbirnī ʿani l-Islām. Qāla: al-Islāmu an tashhada...", note: "The Five Pillars of Islam are defined precisely here: Shahada, Salah, Zakat, Sawm, Hajj." },
        { id: 3, arabic: "قَالَ: فَأَخْبِرْنِي عَنِ الإِيمَانِ.\nقَالَ: «أَنْ تُؤْمِنَ بِاللهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ وَاليَوْمِ الآخِرِ وَتُؤْمِنَ بِالقَدَرِ خَيْرِهِ وَشَرِّهِ.»", translation: "He said: 'Tell me about Iman.'\nHe said: 'To believe in Allah, His angels, His books, His messengers, the Last Day, and to believe in Divine Decree — its good and its evil.'", transliteration: "Qāla: fa-akhbirnī ʿani l-Īmān. Qāla: an tuʾmina billāhi wa malāʾikatihi...", note: "The Six Pillars of Iman: Allah, Angels, Books, Messengers, Last Day, Qadar (Divine Decree)." },
        { id: 4, arabic: "قَالَ: فَأَخْبِرْنِي عَنِ الإِحْسَانِ.\nقَالَ: «أَنْ تَعْبُدَ اللهَ كَأَنَّكَ تَرَاهُ، فَإِنْ لَمْ تَكُنْ تَرَاهُ فَإِنَّهُ يَرَاكَ.»", translation: "He said: 'Tell me about Ihsan.'\nHe said: 'To worship Allah as if you see Him, and if you cannot see Him, know that He surely sees you.'", transliteration: "Qāla: fa-akhbirnī ʿani l-Iḥsān. Qāla: an taʿbuda llāha ka-annaka tarāhu...", note: "Ihsan = spiritual excellence / perfection. The highest level of the religion. This transforms every act of worship." },
      ],
      vocabulary: [
        { arabic: "إِسْلَام", transliteration: "islām", english: "submission to Allah / the religion", pos: "noun (m)" },
        { arabic: "إِيمَان", transliteration: "īmān", english: "faith / belief", pos: "noun (m)" },
        { arabic: "إِحْسَان", transliteration: "iḥsān", english: "excellence / perfection in worship", pos: "noun (m)" },
        { arabic: "شَهَادَة", transliteration: "shahādah", english: "testimony / witnessing", pos: "noun (f)" },
        { arabic: "صَلَاة", transliteration: "ṣalāh", english: "prayer", pos: "noun (f)", plural: "صَلَوَات" },
        { arabic: "زَكَاة", transliteration: "zakāh", english: "obligatory charity", pos: "noun (f)" },
        { arabic: "صَوْم", transliteration: "ṣawm", english: "fasting", pos: "noun (m)" },
        { arabic: "حَجّ", transliteration: "ḥajj", english: "pilgrimage to Makkah", pos: "noun (m)" },
        { arabic: "مَلَائِكَة", transliteration: "malāʾikah", english: "angels", pos: "noun (f.pl)" },
        { arabic: "قَدَر", transliteration: "qadar", english: "divine decree / destiny", pos: "noun (m)" },
        { arabic: "عِبَادَة", transliteration: "ʿibādah", english: "worship", pos: "noun (f)" },
        { arabic: "يَوْم الآخِر", transliteration: "yawm ul-ākhir", english: "the Last Day / Day of Judgment", pos: "noun phrase" },
      ],
      grammar: {
        title: "Three Levels of the Religion (مَرَاتِب الدِّين الثَّلَاث)", titleArabic: "مَرَاتِبُ الدِّين",
        explanation: "This hadith defines the three interconnected levels of the religion:\n\n1. الإِسْلَام (Submission) — the outward practice:\n   • 5 Pillars: Shahada, Salah, Zakat, Sawm, Hajj\n   • This is the body of the religion\n\n2. الإِيمَان (Faith) — the inner belief:\n   • 6 Pillars: Allah, Angels, Books, Messengers, Last Day, Qadar\n   • This is the heart of the religion\n\n3. الإِحْسَان (Excellence) — the spiritual level:\n   • Worshipping Allah as if you see Him\n   • If you cannot see Him, know He sees you\n   • This is the soul of the religion\n\nAll three must be present for a complete Muslim life.",
        examples: [
          { arabic: "أَرْكَانُ الإِسْلَامِ خَمْسَة.", translation: "The pillars of Islam are five." },
          { arabic: "أَرْكَانُ الإِيمَانِ سِتَّة.", translation: "The pillars of Iman are six." },
          { arabic: "الإِحْسَانُ أَنْ تَعْبُدَ اللهَ كَأَنَّكَ تَرَاه.", translation: "Ihsan is to worship Allah as if you see Him." },
        ],
      },
      exercises: [
        {
          type: "choose", instruction: "Answer from the hadith.", instructionArabic: "أَجِبْ مِنَ الحَدِيث.",
          items: [
            { question: "How many pillars of Islam are mentioned?", options: ["4", "5", "6", "7"], answer: 1 },
            { question: "What does الإِحْسَان mean?", options: ["Ihsan = memorizing Quran", "Ihsan = worshipping Allah as if you see Him", "Ihsan = paying zakat", "Ihsan = fasting Ramadan"], answer: 1 },
            { question: "How many pillars of Iman?", options: ["5", "6", "7", "4"], answer: 1 },
          ],
          answers: [1, 1, 1],
        },
        {
          type: "match", instruction: "Match each Arabic term to its meaning.", instructionArabic: "طَابِقْ بَيْنَ المُصْطَلَحَات.",
          items: [{ arabic: "الإِسْلَام", english: "Submission / 5 Pillars" }, { arabic: "الإِيمَان", english: "Faith / 6 Pillars" }, { arabic: "الإِحْسَان", english: "Excellence in worship" }, { arabic: "القَدَر", english: "Divine Decree" }],
          answers: [0, 1, 2, 3],
        },
      ],
      culturalNote: "This is known as 'Umm al-Sunnah' (The Mother of the Sunnah) and 'Hadith Jibrīl'. Imam Nawawi called it the comprehensive foundation of all Islamic sciences. The unknown questioner — Jibrīl ﷺ — left and the Prophet ﷺ told the Companions: 'That was Jibrīl who came to teach you your religion.'",
    },
    {
      bookId: "hadith-arbaeen-nawawi", lessonNum: 3, category: "hadith",
      title: "Hadith 3 — Pillars of Islam", titleArabic: "الحَدِيث الثَّالِث: أَرْكَانُ الإِسْلَام",
      description: "Islam is built upon five pillars — each one essential to the structure of the faith.",
      pages: [
        { id: 1, arabic: "عَنِ ابْنِ عُمَرَ رَضِيَ اللهُ عَنْهُمَا أَنَّ رَسُولَ اللهِ ﷺ قَالَ:\n«بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ»", translation: "On the authority of Ibn ʿUmar (may Allah be pleased with them both): The Messenger of Allah ﷺ said:\n'Islam is built upon five.'", transliteration: "ʿAni bni ʿUmara raḍiya llāhu ʿanhumā anna Rasūla llāhi ﷺ qāla:\n«Buniya l-Islāmu ʿalā khams»", note: "بُنِيَ is a passive verb: 'was built'. The metaphor of a building is powerful — all five pillars are load-bearing." },
        { id: 2, arabic: "«شَهَادَةِ أَنْ لَا إِلَهَ إِلَّا اللهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللهِ،\nوَإِقَامِ الصَّلَاةِ، وَإِيتَاءِ الزَّكَاةِ،\nوَصَوْمِ رَمَضَانَ، وَحَجِّ البَيْتِ»", translation: "'...witnessing that there is no god but Allah and that Muhammad is the Messenger of Allah, establishing the prayer, paying the zakat, fasting Ramadan, and making pilgrimage to the House.'", transliteration: "«Shahādati an lā ilāha illā llāhu wa anna Muḥammadan rasūlu llāh, wa iqāmi ṣ-ṣalāt, wa ītāʾi z-zakāh, wa ṣawmi ramaḍān, wa ḥajji l-bayt»", note: "Note the order: Shahada first (the foundation), then Salah (most regular practice), Zakat (wealth), Fasting (body), Hajj (life journey)." },
      ],
      vocabulary: [
        { arabic: "رُكْن", transliteration: "rukn", english: "pillar / corner", pos: "noun (m)", plural: "أَرْكَان" },
        { arabic: "شَهَادَة", transliteration: "shahādah", english: "testimony / declaration", pos: "noun (f)" },
        { arabic: "إِقَامَة", transliteration: "iqāmah", english: "establishing / maintaining", pos: "noun (f)" },
        { arabic: "إِيتَاء", transliteration: "ītāʾ", english: "giving / paying", pos: "verbal noun" },
        { arabic: "رَمَضَان", transliteration: "ramaḍān", english: "Ramadan (9th Islamic month)", pos: "proper noun" },
        { arabic: "بَيْت", transliteration: "bayt", english: "house / Ka'bah", pos: "noun (m)" },
        { arabic: "بُنِيَ", transliteration: "buniya", english: "was built (passive)", pos: "verb (passive)" },
      ],
      grammar: {
        title: "The Five Pillars (الأَرْكَانُ الخَمْسَة)", titleArabic: "الأَرْكَانُ الخَمْسَة",
        explanation: "The Five Pillars in order:\n1. الشَّهَادَة (Shahada): 'Lā ilāha illa llāh, Muhammadun rasūlu llāh'\n   • The key that opens the door of Islam\n2. الصَّلَاة (Salah): 5 daily prayers\n   • The pillar that holds the building upright\n3. الزَّكَاة (Zakah): 2.5% of surplus wealth\n   • Given annually to 8 categories of recipients\n4. صَوْم رَمَضَان (Sawm): Fasting the holy month\n   • From Fajr to Maghrib, abstaining from food, drink, and intimacy\n5. الحَجّ (Hajj): Pilgrimage to Makkah\n   • Once in a lifetime if able",
        examples: [
          { arabic: "الصَّلَاةُ عَمُودُ الدِّينِ.", translation: "Prayer is the pillar (column) of the religion." },
          { arabic: "الزَّكَاةُ طُهْرَةٌ للمَالِ.", translation: "Zakat purifies wealth." },
          { arabic: "صُومُوا تَصِحُّوا.", translation: "Fast and you will be healthy. (Hadith)" },
        ],
      },
      exercises: [
        {
          type: "fill_blank", instruction: "Complete the five pillars.", instructionArabic: "أَكْمِلِ الأَرْكَانَ الخَمْسَة.",
          items: [
            { sentence: "1. ___ أَنْ لَا إِلَهَ إِلَّا اللهُ", blank: 1, hint: "testimony" },
            { sentence: "2. إِقَامُ ___", blank: 1, hint: "prayer" },
            { sentence: "3. إِيتَاءُ ___", blank: 1, hint: "zakat" },
            { sentence: "4. صَوْمُ ___", blank: 1, hint: "Ramadan" },
            { sentence: "5. ___ البَيْتِ", blank: 1, hint: "pilgrimage" },
          ],
          answers: ["شَهَادَة", "الصَّلَاة", "الزَّكَاة", "رَمَضَان", "حَجّ"],
        },
      ],
    },
    {
      bookId: "hadith-arbaeen-nawawi", lessonNum: 4, category: "hadith",
      title: "Hadith 4 — Halal, Haram & the Doubtful", titleArabic: "الحَدِيث الرَّابِع: الحَلَال وَالحَرَام",
      description: "The clearest guide for everyday decision-making: what is lawful, unlawful, and doubtful.",
      pages: [
        { id: 1, arabic: "«إِنَّ الحَلَالَ بَيِّنٌ، وَإِنَّ الحَرَامَ بَيِّنٌ،\nوَبَيْنَهُمَا أُمُورٌ مُشْتَبِهَاتٌ لَا يَعْلَمُهُنَّ كَثِيرٌ مِنَ النَّاسِ.»", translation: "'Indeed the lawful is clear and the forbidden is clear, and between them are doubtful matters which many people do not know.'", transliteration: "«Inna l-ḥalāla bayyinun, wa inna l-ḥarāma bayyinun, wa baynahumā umūrun mushtabihātun lā yaʿlamuhunna kathīrun mina n-nās.»", note: "بَيِّن = clear/evident. The grey area (مُشْتَبِهَات) requires scholars to analyze and the pious to be cautious." },
        { id: 2, arabic: "«فَمَنِ اتَّقَى الشُّبُهَاتِ فَقَدِ اسْتَبْرَأَ لِدِينِهِ وَعِرْضِهِ،\nوَمَنْ وَقَعَ فِي الشُّبُهَاتِ وَقَعَ فِي الحَرَامِ.»", translation: "'Whoever avoids the doubtful matters has protected his religion and his honor, and whoever falls into the doubtful matters falls into the forbidden.'", transliteration: "«Faman ittaqā sh-shubuhāti faqad istabraʾa li-dīnihi wa ʿirḍih, wa man waqaʿa fī sh-shubuhāti waqaʿa fī l-ḥarām.»", note: "اِسْتَبْرَأَ = cleared himself / protected. The principle: avoid doubtful matters as a safety margin around the forbidden." },
        { id: 3, arabic: "«كَالرَّاعِي يَرْعَى حَوْلَ الحِمَى يُوشِكُ أَنْ يَقَعَ فِيهِ.\nأَلَا وَإِنَّ لِكُلِّ مَلِكٍ حِمًى، أَلَا وَإِنَّ حِمَى اللهِ مَحَارِمُهُ.»", translation: "'Like a shepherd who grazes near a protected zone — he is about to fall into it. Indeed every king has a protected zone, and Allah's protected zone is His prohibitions.'", transliteration: "«Ka-r-rāʿī yarʿā ḥawla l-ḥimā yūshiku an yaqaʿa fīh...", note: "Beautiful parable: the doubtful is like grazing too close to the king's forbidden zone. Safety is in distance." },
      ],
      vocabulary: [
        { arabic: "حَلَال", transliteration: "ḥalāl", english: "lawful / permissible", pos: "adjective" },
        { arabic: "حَرَام", transliteration: "ḥarām", english: "forbidden / unlawful", pos: "adjective" },
        { arabic: "شُبْهَة", transliteration: "shubhah", english: "doubtful matter", pos: "noun (f)", plural: "شُبُهَات / مُشْتَبِهَات" },
        { arabic: "بَيِّن", transliteration: "bayyinun", english: "clear / evident", pos: "adjective" },
        { arabic: "اتَّقَى", transliteration: "ittaqā", english: "to avoid / to be cautious of", pos: "verb" },
        { arabic: "رَاعٍ", transliteration: "rāʿin", english: "shepherd", pos: "noun (m)" },
        { arabic: "حِمَى", transliteration: "ḥimā", english: "protected area / sanctuary", pos: "noun (m)" },
        { arabic: "مَحَارِم", transliteration: "maḥārim", english: "prohibitions / sacred limits", pos: "noun (f.pl)" },
      ],
      grammar: {
        title: "Fiqh Principle: Blocking the Means (سَدُّ الذَّرَائِع)", titleArabic: "سَدُّ الذَّرَائِع",
        explanation: "This hadith establishes the key Islamic legal principle:\n\nThings are divided into three categories:\n1. الحَلَال البَيِّن — Clearly lawful: halal meat, marriage, honest trade\n2. الحَرَام البَيِّن — Clearly forbidden: alcohol, riba (usury), zina\n3. المُشْتَبِهَات — Doubtful matters: things where scholars differ\n\nRule for doubtful matters:\n• The scholar must research and verify\n• The layperson should ask a trusted scholar\n• The precautionary principle: 'Leave what makes you doubt for what does not make you doubt' (Tirmidhi)\n\nThis is the principle of سَدُّ الذَّرَائِع (blocking the means to harm).",
        examples: [
          { arabic: "الخَمْرُ حَرَامٌ بَيِّن.", translation: "Wine/alcohol is clearly forbidden." },
          { arabic: "الحَلِيبُ حَلَالٌ بَيِّن.", translation: "Milk is clearly lawful." },
          { arabic: "بَعْضُ التَّأْمِينِ مُشْتَبَهٌ فِيهِ.", translation: "Some types of insurance are doubtful matters." },
        ],
      },
      exercises: [
        {
          type: "choose", instruction: "Classify each item.", instructionArabic: "صَنِّفْ كُلَّ بَنْد.",
          items: [
            { question: "Drinking alcohol (الخَمْر)", options: ["Halal", "Haram", "Doubtful"], answer: 1 },
            { question: "Eating halal chicken", options: ["Halal", "Haram", "Doubtful"], answer: 0 },
            { question: "A new financial product with unclear terms", options: ["Halal", "Haram", "Doubtful"], answer: 2 },
          ],
          answers: [1, 0, 2],
        },
      ],
    },
    {
      bookId: "hadith-arbaeen-nawawi", lessonNum: 5, category: "hadith",
      title: "Hadith 5 — No Harm in Islam", titleArabic: "الحَدِيث الخَامِس: لَا ضَرَرَ وَلَا ضِرَار",
      description: "The foundational Islamic legal maxim: causing harm is prohibited in Islam.",
      pages: [
        { id: 1, arabic: "«لَا ضَرَرَ وَلَا ضِرَارَ.»", translation: "'There shall be no harm and no reciprocal harm.'", transliteration: "«Lā ḍarara wa lā ḍirār.»", note: "One of the most concise and comprehensive principles in Islamic law. Only 5 Arabic words but covers vast areas of jurisprudence." },
        { id: 2, arabic: "الضَّرَرُ: الأَذَى الَّذِي يَصْدُرُ مِنَ الإِنْسَانِ ابْتِدَاءً.\nالضِّرَارُ: أَنْ تُضِرَّ بِمَنْ أَضَرَّ بِكَ عَلَى وَجْهٍ غَيْرِ مَشْرُوع.", translation: "Ḍarar (harm): harm that a person initiates without cause.\nḌirār: harming back someone who harmed you in an unlawful manner.", transliteration: "Aḍ-ḍararu: al-adhā alladhī yaṣduru mina l-insāni ibtidāʾan...", note: "Scholars distinguish: ضَرَر = initiating harm. ضِرَار = retaliating with excess harm beyond what was done to you." },
      ],
      vocabulary: [
        { arabic: "ضَرَر", transliteration: "ḍarar", english: "harm / injury", pos: "noun (m)" },
        { arabic: "ضِرَار", transliteration: "ḍirār", english: "reciprocal harm / retaliation with harm", pos: "noun (m)" },
        { arabic: "لَا", transliteration: "lā", english: "no / there is no (negation)", pos: "particle of negation" },
        { arabic: "قَاعِدَة", transliteration: "qāʿidah", english: "rule / legal maxim", pos: "noun (f)", plural: "قَوَاعِد" },
        { arabic: "فِقْه", transliteration: "fiqh", english: "Islamic jurisprudence", pos: "noun (m)" },
      ],
      grammar: {
        title: "The Five Major Legal Maxims (القَوَاعِد الفِقْهِيَّة الخَمْس)", titleArabic: "القَوَاعِد الفِقْهِيَّة الخَمْس",
        explanation: "This hadith is the basis for one of the Five Major Legal Maxims of Islamic Fiqh:\n\n1. الأُمُورُ بِمَقَاصِدِهَا — Actions are judged by their goals (Hadith 1)\n2. اليَقِينُ لَا يُزَالُ بِالشَّكِّ — Certainty is not removed by doubt\n3. المَشَقَّةُ تَجْلِبُ التَّيْسِيرَ — Hardship brings ease\n4. الضَّرَرُ يُزَال — Harm must be removed (THIS HADITH)\n5. العَادَةُ مُحَكَّمَة — Custom is authoritative\n\nApplications of لَا ضَرَرَ وَلَا ضِرَار:\n• Consumer protection in trade\n• Medical ethics (first do no harm)\n• Environmental protection\n• Family law (no abuse allowed)",
        examples: [
          { arabic: "الضَّرَرُ يُزَال.", translation: "Harm must be eliminated. (Legal maxim)" },
          { arabic: "يُتَحَمَّلُ الضَّرَرُ الخَاصُّ لِدَفْعِ الضَّرَرِ العَامِّ.", translation: "A private harm is tolerated to repel public harm." },
          { arabic: "الضَّرُورَاتُ تُبِيحُ المَحْظُورَات.", translation: "Necessities allow the prohibited." },
        ],
      },
      exercises: [
        {
          type: "translate", instruction: "Translate into Arabic.", instructionArabic: "تَرْجِمْ إِلَى العَرَبِيَّة.",
          items: [{ english: "There shall be no harm." }, { english: "Harm must be eliminated." }, { english: "No harm and no reciprocal harm." }],
          answers: ["لَا ضَرَر.", "الضَّرَرُ يُزَال.", "لَا ضَرَرَ وَلَا ضِرَار."],
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // TAJWEED — Tajweed Rules of the Quran (5 lessons)
  // ───────────────────────────────────────────────────────────────────────────
  "quran-tajweed-rules": [
    {
      bookId: "quran-tajweed-rules", lessonNum: 1, category: "tajweed",
      title: "Introduction to Tajweed", titleArabic: "تَعْرِيفُ التَّجْوِيدِ وَحُكْمُه",
      description: "What is Tajweed, why is it obligatory, and how do you begin learning it?",
      pages: [
        { id: 1, arabic: "اَلتَّجْوِيدُ لُغَةً: تَحْسِينُ الشَّيْءِ وَإِتْقَانُهُ.\nاَلتَّجْوِيدُ اصْطِلَاحًا: إِعْطَاءُ كُلِّ حَرْفٍ حَقَّهُ مِنَ الصِّفَاتِ وَمُسْتَحَقَّهُ.", translation: "Tajweed linguistically: improving a thing and perfecting it.\nTajweed technically: giving each letter its due rights from attributes and its earned characteristics.", transliteration: "At-tajwīdu lughatan: taḥsīnu sh-shayʾi wa itqānuh.\nAt-tajwīdu iṣṭilāḥan: iʿṭāʾu kulli ḥarfin ḥaqqahu min aṣ-ṣifāti wa mustaḥaqqah.", note: "Every letter has: حَقّ (due right — permanent attributes) and مُسْتَحَقّ (earned characteristics — context-dependent attributes)." },
        { id: 2, arabic: "حُكْمُ التَّجْوِيدِ: فَرْضُ عَيْنٍ عَلَى كُلِّ مُسْلِمٍ وَمُسْلِمَة.\nقَالَ اللهُ تَعَالَى: ﴿وَرَتِّلِ القُرْآنَ تَرْتِيلًا﴾", translation: "The ruling on Tajweed: individually obligatory (farḍ ʿayn) for every Muslim man and woman.\nAllah says: 'And recite the Quran with measured recitation.' (Al-Muzzammil 73:4)", transliteration: "Ḥukmu t-tajwīdi: farḍu ʿaynin ʿalā kulli muslimin wa muslimah.", note: "فَرْضُ عَيْن = individually obligatory — every person must learn it. فَرْضُ كِفَايَة = communally obligatory (if some do it, others are excused)." },
        { id: 3, arabic: "المَخَارِج: مَوَاضِعُ خُرُوجِ الحُرُوفِ مِنَ الجَهَازِ النُّطْقِيّ.\nالأَقْسَامُ الخَمْسَة: الجَوْف، الحَلْق، اللِّسَان، الشَّفَتَان، الخَيْشُوم", translation: "Makharij: the exit points of letters from the vocal apparatus.\nFive regions: the oral cavity, throat, tongue, two lips, nasal passage.", transliteration: "Al-makhārij: mawāḍiʿu khurūji l-ḥurūfi mina l-jihāzi n-nuṭqī...", note: "There are 17 specific makharij (exit points) for the 28 letters, within these 5 main regions." },
      ],
      vocabulary: [
        { arabic: "تَجْوِيد", transliteration: "tajwīd", english: "Tajweed / making excellent", pos: "noun (m)" },
        { arabic: "مَخْرَج", transliteration: "makhraj", english: "exit point of a letter", pos: "noun (m)", plural: "مَخَارِج" },
        { arabic: "صِفَة", transliteration: "ṣifah", english: "attribute / characteristic", pos: "noun (f)", plural: "صِفَات" },
        { arabic: "حَلْق", transliteration: "ḥalq", english: "throat", pos: "noun (m)" },
        { arabic: "لِسَان", transliteration: "lisān", english: "tongue", pos: "noun (m)" },
        { arabic: "شَفَة", transliteration: "shafah", english: "lip", pos: "noun (f)", plural: "شَفَتَان" },
        { arabic: "خَيْشُوم", transliteration: "khayshūm", english: "nasal passage", pos: "noun (m)" },
        { arabic: "فَرْض عَيْن", transliteration: "farḍu ʿayn", english: "individual obligation", pos: "legal term" },
        { arabic: "تَرْتِيل", transliteration: "tartīl", english: "measured recitation", pos: "noun (m)" },
      ],
      grammar: {
        title: "Why Tajweed is Obligatory (وُجُوبُ التَّجْوِيد)", titleArabic: "وُجُوبُ التَّجْوِيد",
        explanation: "Tajweed is obligatory because:\n1. Quranic command: ﴿وَرَتِّلِ القُرْآنَ تَرْتِيلًا﴾ (73:4)\n2. The Prophet ﷺ recited with Tajweed and taught his companions\n3. Mispronunciation can change the meaning: كَفَرَ (he disbelieved) vs كَبَرَ (he grew up)\n\nLevels of Tajweed:\n• At-Tartīl (الترتيل): Slow, beautiful, contemplative — best for learning\n• At-Tadwīr (التدوير): Medium pace — common for teaching\n• Al-Hadr (الحدر): Fast, but still correct — for those who know it well\n\nThe FIRST obligation: correct your Fatiha — every prayer requires it.",
        examples: [
          { arabic: "﴿وَرَتِّلِ القُرْآنَ تَرْتِيلًا﴾", translation: "And recite the Quran with measured recitation. (Al-Muzzammil 73:4)" },
          { arabic: "وَرَّتَلَهُ النَّبِيُّ ﷺ آيَةً آيَة.", translation: "The Prophet ﷺ recited it ayah by ayah." },
        ],
      },
      exercises: [
        {
          type: "choose", instruction: "Answer the questions about Tajweed.", instructionArabic: "أَجِبْ عَنِ الأَسْئِلَة.",
          items: [
            { question: "What is the ruling on Tajweed?", options: ["Recommended (mustahabb)", "Individually obligatory (farḍ ʿayn)", "Communally obligatory (farḍ kifāyah)", "Optional"], answer: 1 },
            { question: "How many main regions of makharij?", options: ["3", "4", "5", "6"], answer: 2 },
            { question: "Which Quran verse commands tartīl?", options: ["Al-Baqarah 2:2", "Al-Muzzammil 73:4", "Al-Fatiha 1:1", "Al-Ikhlas 112:1"], answer: 1 },
          ],
          answers: [1, 2, 1],
        },
      ],
      culturalNote: "The Prophet ﷺ said: 'Recite the Quran with a sad voice, for it was revealed in sadness.' (Ibn Majah). And: 'The one who is skilled in reciting the Quran will be with the noble righteous scribes, and the one who recites the Quran and struggles with it, will have a double reward.' (Bukhari & Muslim)",
    },
    {
      bookId: "quran-tajweed-rules", lessonNum: 2, category: "tajweed",
      title: "Noon Saakin & Tanween Rules", titleArabic: "أَحْكَامُ النُّونِ السَّاكِنَةِ وَالتَّنْوِين",
      description: "Four rules govern every noon saakin (نْ) and tanween (ـٌ ـٍ ـً) in the Quran.",
      pages: [
        { id: 1, arabic: "أَحْكَامُ النُّونِ السَّاكِنَةِ وَالتَّنْوِينِ أَرْبَعَة:\n١. الإِظْهَار — ٢. الإِدْغَام — ٣. الإِقْلَاب — ٤. الإِخْفَاء", translation: "The rules of noon saakin and tanween are four:\n1. Iẓhār (clear) — 2. Idghām (merging) — 3. Iqlab (converting) — 4. Ikhfāʾ (hiding)", transliteration: "Aḥkāmu n-nūni s-sākinati wa t-tanwīni arbaʿah:\n1. al-Iẓhār — 2. al-Idghām — 3. al-Iqlab — 4. al-Ikhfāʾ", note: "These four rules apply whenever نْ or tanween appears BEFORE another letter." },
        { id: 2, arabic: "١. الإِظْهَار الحَلْقِي: يَكُونُ مَعَ حُرُوفِ: أ ه ع ح غ خ\nمِثَال: مِنْ أَهْلِ — مِنْ هَادٍ — مَنْ عَمِلَ — عَلِيمٌ حَكِيم", translation: "1. Throat Iẓhār: occurs with the letters: ʾ h ʿ ḥ gh kh\nExamples: min ahlin — min hādin — man ʿamila — ʿalīmun ḥakīm", transliteration: "Al-Iẓhār al-ḥalqī: yakūnu maʿa ḥurūf: ʾ h ʿ ḥ gh kh", note: "These 6 throat letters require CLEAR pronunciation of the noon/tanween — no merging or nasality." },
        { id: 3, arabic: "٢. الإِدْغَام: يَكُونُ مَعَ حُرُوفِ: ي ر م ل و ن\nبِغُنَّة: ي ن م و — بِلَا غُنَّة: ر ل\nمِثَال: مِنْ يَعْمَلُ — مِنْ رَبِّك — مِنْ لَدُن", translation: "2. Idghām (merging): occurs with letters: y r m l w n\nWith ghunnah: y n m w — Without ghunnah: r l\nExamples: min yaʿmalu — min rabbika — min ladun", transliteration: "Al-Idghām: yakūnu maʿa ḥurūf: y r m l w n", note: "Idghām = the noon MERGES into the next letter. The noon disappears and the next letter is stressed (doubled). Ghunnah = nasality through the nose." },
        { id: 4, arabic: "٣. الإِقْلَاب: يَكُونُ مَعَ حَرْفٍ وَاحِد: ب\nمِثَال: ﴿مِنْ بَعْدِ﴾ — ﴿أَنْبِئُونِي﴾\n٤. الإِخْفَاء: يَكُونُ مَعَ الحُرُوفِ البَاقِيَة الخَمْسَة عَشَر", translation: "3. Iqlab: occurs with one letter: ب (ba)\nExample: min baʿdi — anbiʾūnī\n4. Ikhfāʾ: occurs with the remaining 15 letters", transliteration: "Al-Iqlab: yakūnu maʿa ḥarfin wāḥid: b", note: "Iqlab = the noon CONVERTS to a nasal meem sound before ب. Ikhfāʾ = the noon is HIDDEN with nasal sound before the remaining 15 letters." },
      ],
      vocabulary: [
        { arabic: "إِظْهَار", transliteration: "iẓhār", english: "clear/manifest pronunciation", pos: "noun (m)" },
        { arabic: "إِدْغَام", transliteration: "idghām", english: "merging/assimilation", pos: "noun (m)" },
        { arabic: "إِقْلَاب", transliteration: "iqlab", english: "conversion/change", pos: "noun (m)" },
        { arabic: "إِخْفَاء", transliteration: "ikhfāʾ", english: "hiding/concealment", pos: "noun (m)" },
        { arabic: "غُنَّة", transliteration: "ghunnah", english: "nasality (through nose)", pos: "noun (f)" },
        { arabic: "سُكُون", transliteration: "sukūn", english: "no-vowel sign (ـْ)", pos: "noun (m)" },
        { arabic: "تَنْوِين", transliteration: "tanwīn", english: "double vowel endings (ـٌ ـٍ ـً)", pos: "noun (m)" },
        { arabic: "حَلْقِيّ", transliteration: "ḥalqī", english: "throat/guttural", pos: "adjective" },
      ],
      grammar: {
        title: "Summary: Noon Saakin Rules (مُلَخَّص أَحْكَام النُّون)", titleArabic: "مُلَخَّصُ الأَحْكَام",
        explanation: "Quick Reference for Noon Saakin + Tanween:\n\nLetter | Rule | Sound\n--\nأ ه ع ح غ خ (6) → إِظْهَار → Clear noon, no nasality\ny ن م و → إِدْغَام بِغُنَّة → Merge with nasality\nr ل → إِدْغَام بِلَا غُنَّة → Merge, no nasality\nب (1) → إِقْلَاب → Convert noon to nasal م\nRemaining 15 → إِخْفَاء → Hidden noon + nasal\n\nMemory trick for Idghām letters: يَرْمَلُون (يَرْمَلُون reads as 'yarmalūn')",
        examples: [
          { arabic: "﴿مِنْ هَادٍ﴾", translation: "Iẓhār — clear noon before ه" },
          { arabic: "﴿مِنْ يَعْمَلُ﴾", translation: "Idghām with ghunnah — noon merges into ي" },
          { arabic: "﴿مِنْ بَعْدِ﴾", translation: "Iqlab — noon converts to nasal م before ب" },
          { arabic: "﴿مِنْ تَحْتِهَا﴾", translation: "Ikhfāʾ — noon hidden before ت" },
        ],
      },
      exercises: [
        {
          type: "choose", instruction: "What rule applies here?", instructionArabic: "أَيُّ حُكْمٍ يُطَبَّق هُنَا؟",
          items: [
            { question: "﴿مِنْ أَمِنَ﴾ — nun before أ", options: ["Iẓhār", "Idghām", "Iqlab", "Ikhfāʾ"], answer: 0 },
            { question: "﴿مِنْ بَعْدِ﴾ — nun before ب", options: ["Iẓhār", "Idghām", "Iqlab", "Ikhfāʾ"], answer: 2 },
            { question: "﴿مِنْ نَعِيمٍ﴾ — nun before ن", options: ["Iẓhār", "Idghām with ghunnah", "Iqlab", "Ikhfāʾ"], answer: 1 },
            { question: "﴿مِنْ ثَمَرَة﴾ — nun before ث", options: ["Iẓhār", "Idghām", "Iqlab", "Ikhfāʾ"], answer: 3 },
          ],
          answers: [0, 2, 1, 3],
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // FIQH — Essentials of Islamic Fiqh (5 lessons)
  // ───────────────────────────────────────────────────────────────────────────
  "fiqh-essentials": [
    {
      bookId: "fiqh-essentials", lessonNum: 1, category: "fiqh",
      title: "Purification — An Overview", titleArabic: "الطَّهَارَة — نَظْرَة عَامَّة",
      description: "Understand the concept of Islamic purification, its types, and why it matters.",
      pages: [
        { id: 1, arabic: "الطَّهَارَةُ لُغَةً: النَّظَافَةُ وَالنَّزَاهَةُ.\nالطَّهَارَةُ شَرْعًا: رَفْعُ الحَدَثِ وَإِزَالَةُ النَّجَاسَة.\nقَالَ ﷺ: «الطُّهُورُ شَطْرُ الإِيمَان.»", translation: "Purity linguistically: cleanliness and spotlessness.\nPurity in Islamic law: removing ritual impurity and eliminating physical impurity.\nThe Prophet ﷺ said: 'Purification is half of faith.'", transliteration: "Aṭ-ṭahāratu lughatan: an-naẓāfatu wa n-nazāhah.\nAṭ-ṭahāratu sharʿan: rafʿu l-ḥadathi wa izālatu n-najāsah.", note: "الطُّهُور is the highest grade of purification. شَطْر = half. This means purification is essential to Iman." },
        { id: 2, arabic: "أَنْوَاعُ الطَّهَارَة:\n١. طَهَارَةُ الحَدَثِ: رَفْعُ الحَدَثِ الأَصْغَرِ (الوُضُوء) وَالأَكْبَرِ (الغُسْل)\n٢. طَهَارَةُ النَّجَاسَة: إِزَالَةُ النَّجَاسَةِ مِنَ الثَّوْبِ وَالبَدَنِ وَالمَكَان", translation: "Types of purification:\n1. Purification from ritual state: removing minor impurity (wudu) and major impurity (ghusl)\n2. Purification from physical impurity: removing najasah from clothing, body, and place", transliteration: "Anwāʿu ṭ-ṭahārah:\n1. Ṭahāratu l-ḥadath: rafʿu l-ḥadathi l-aṣghari (al-wuḍūʾ) wa l-akbari (al-ghusl)", note: "حَدَث أَصْغَر (minor ritual impurity): broken by things like urinating, flatulence. Removed by wudu.\nحَدَث أَكْبَر (major ritual impurity): requires ghusl — after marital relations, menstruation, etc." },
        { id: 3, arabic: "المَاءُ الطَّهُور وَأَقْسَامُهُ:\n• مَاءٌ طَهُور (طَاهِر مُطَهِّر): رَافِعٌ لِلْحَدَثِ — كَالمَاءِ المُطْلَق\n• مَاءٌ طَاهِر (غَيْرُ مُطَهِّر): لَا يَرْفَعُ الحَدَث — كَعَصِيرِ الفَاكِهَة\n• مَاءٌ نَجِس: لَا يَجُوزُ التَّطَهُّرُ بِهِ — إِذَا تَغَيَّرَ بِالنَّجَاسَة", translation: "Types of water:\n• Pure purifying water: removes ritual impurity — like rainwater, river water\n• Pure non-purifying water: cannot remove ritual impurity — like juice\n• Impure water: cannot be used for purification — water changed by najasah", transliteration: "Al-māʾu ṭ-ṭahūru wa aqsāmuh...", note: "All naturally occurring water is طَهُور (purifying). Water becomes impure only if its color, smell, or taste changes due to najasah." },
      ],
      vocabulary: [
        { arabic: "طَهَارَة", transliteration: "ṭahārah", english: "purification / purity", pos: "noun (f)" },
        { arabic: "حَدَث", transliteration: "ḥadath", english: "ritual impurity", pos: "noun (m)", plural: "أَحْدَاث" },
        { arabic: "نَجَاسَة", transliteration: "najāsah", english: "physical impurity (filth)", pos: "noun (f)" },
        { arabic: "وُضُوء", transliteration: "wuḍūʾ", english: "ritual ablution (minor)", pos: "noun (m)" },
        { arabic: "غُسْل", transliteration: "ghusl", english: "full ritual bath (major)", pos: "noun (m)" },
        { arabic: "تَيَمُّم", transliteration: "tayammum", english: "dry purification (with earth)", pos: "noun (m)" },
        { arabic: "مَاء طَهُور", transliteration: "māʾun ṭahūr", english: "purifying water", pos: "noun phrase" },
        { arabic: "طَاهِر", transliteration: "ṭāhir", english: "pure / clean", pos: "adjective" },
        { arabic: "نَجِس", transliteration: "najis", english: "impure / dirty", pos: "adjective" },
      ],
      grammar: {
        title: "The Conditions for Salah (شُرُوطُ الصَّلَاة)", titleArabic: "شُرُوطُ الصَّلَاة",
        explanation: "Purification is the FIRST condition of prayer. The conditions for Salah are:\n\n1. الإِسْلَام — Being Muslim\n2. العَقْل — Sound mind\n3. البُلُوغ — Reaching puberty (obligation begins)\n4. دُخُولُ الوَقْت — The prayer time has entered\n5. الطَّهَارَة — Ritual purification (wudu)\n6. سَتْرُ العَوْرَة — Covering the awrah\n7. اسْتِقْبَالُ القِبْلَة — Facing the Qiblah\n8. النِّيَّة — Intention\n\nIf ANY condition is missing, the prayer is INVALID.",
        examples: [
          { arabic: "«لَا تُقْبَلُ صَلَاةٌ بِغَيْرِ طَهُور.»", translation: "'No prayer is accepted without purification.' (Muslim)" },
          { arabic: "«الطُّهُورُ شَطْرُ الإِيمَان.»", translation: "'Purification is half of faith.' (Muslim)" },
        ],
      },
      exercises: [
        {
          type: "choose", instruction: "Answer the fiqh questions.", instructionArabic: "أَجِبْ عَنِ الأَسْئِلَة الفِقْهِيَّة.",
          items: [
            { question: "What removes a minor (asghar) ritual impurity?", options: ["Ghusl", "Wudu", "Tayammum", "Just washing the hands"], answer: 1 },
            { question: "Can you pray with impure water for wudu?", options: ["Yes if urgent", "No, it's invalid", "Yes, prayer is still valid", "Depends on the school"], answer: 1 },
            { question: "What is the minimum water is used for wudu by scholars?", options: ["1 liter", "Any amount that covers the required parts", "2 liters", "Must be running water"], answer: 1 },
          ],
          answers: [1, 1, 1],
        },
        {
          type: "match", instruction: "Match each term to its meaning.", instructionArabic: "طَابِقْ بَيْنَ المُصْطَلَحَات.",
          items: [{ arabic: "وُضُوء", english: "Minor purification (ablution)" }, { arabic: "غُسْل", english: "Major ritual bath" }, { arabic: "تَيَمُّم", english: "Dry purification with earth" }, { arabic: "النَّجَاسَة", english: "Physical impurity (filth)" }],
          answers: [0, 1, 2, 3],
        },
      ],
    },
    {
      bookId: "fiqh-essentials", lessonNum: 2, category: "fiqh",
      title: "How to Perform Wudu", titleArabic: "كَيْفِيَّةُ الوُضُوء",
      description: "Step-by-step guide to the obligatory acts, sunnahs, and conditions of wudu.",
      pages: [
        { id: 1, arabic: "فَرَائِضُ الوُضُوءِ سِتَّة:\n١. النِّيَّة — ٢. غَسْلُ الوَجْهِ — ٣. غَسْلُ اليَدَيْن إِلَى المِرْفَقَيْن\n٤. مَسْحُ الرَّأْسِ — ٥. غَسْلُ الرِّجْلَيْن إِلَى الكَعْبَيْن — ٦. التَّرْتِيب", translation: "The obligatory acts of wudu are six:\n1. Intention — 2. Washing the face — 3. Washing both arms to the elbows\n4. Wiping the head — 5. Washing both feet to the ankles — 6. Order (sequence)", transliteration: "Farāʾiḍu l-wuḍūʾi sittah:\n1. An-niyyah — 2. Ghuslu l-wajh — 3. Ghuslu l-yadayni ilā l-mirfaqayn...", note: "These six come from Quran 5:6: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا قُمْتُمْ إِلَى الصَّلَاةِ فَاغْسِلُوا وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى المَرَافِقِ وَامْسَحُوا بِرُؤُوسِكُمْ وَأَرْجُلَكُمْ إِلَى الكَعْبَيْنِ﴾" },
        { id: 2, arabic: "سُنَنُ الوُضُوء:\n• التَّسْمِيَة (بِسْمِ اللهِ) — غَسْلُ الكَفَّيْن — المَضْمَضَة — الاسْتِنْشَاق\n• مَسْحُ الأُذُنَيْن — تَخْلِيلُ الأَصَابِع — التَّثْلِيث (ثَلَاث مَرَّات)\n• البَدْء بِاليَمِين — الدُّعَاء بَعْد الوُضُوء", translation: "Sunnahs of wudu:\n• Saying bismillah — washing palms — rinsing mouth — sniffing water\n• Wiping ears — combing through fingers — triple washing\n• Starting with the right side — making duaa after wudu", transliteration: "Sunanu l-wuḍūʾ: at-tasmiyah, ghuslu l-kaffayn, al-maḍmaḍah, al-istinshāq...", note: "Sunnahs increase the reward but are not required for validity." },
      ],
      vocabulary: [
        { arabic: "فَرِيضَة", transliteration: "farīḍah", english: "obligatory act", pos: "noun (f)", plural: "فَرَائِض" },
        { arabic: "سُنَّة", transliteration: "sunnah", english: "prophetic practice", pos: "noun (f)", plural: "سُنَن" },
        { arabic: "وَجْه", transliteration: "wajh", english: "face", pos: "noun (m)" },
        { arabic: "مِرْفَق", transliteration: "mirfaq", english: "elbow", pos: "noun (m)", plural: "مَرَافِق" },
        { arabic: "رَأْس", transliteration: "raʾs", english: "head", pos: "noun (m)" },
        { arabic: "كَعْب", transliteration: "kaʿb", english: "ankle", pos: "noun (m)", plural: "كَعْبَان" },
        { arabic: "مَضْمَضَة", transliteration: "maḍmaḍah", english: "rinsing the mouth", pos: "noun (f)" },
        { arabic: "اسْتِنْشَاق", transliteration: "istinshāq", english: "sniffing water into nose", pos: "noun (m)" },
        { arabic: "تَرْتِيب", transliteration: "tartīb", english: "order / sequence", pos: "noun (m)" },
      ],
      grammar: {
        title: "Nullifiers of Wudu (نَوَاقِضُ الوُضُوء)", titleArabic: "نَوَاقِضُ الوُضُوء",
        explanation: "What breaks wudu:\n1. Anything exiting from private parts (urine, feces, gas, etc.)\n2. Loss of consciousness (sleep, fainting)\n3. Touching private parts with bare hand (Shafi'i, Hanbali)\n4. Eating camel meat (Hanbali)\n5. Apostasy (leaving Islam)\n\nThat do NOT break wudu:\n• Laughing in prayer (only the prayer is invalid, not wudu)\n• Touching a woman (majority view: does not break wudu)\n• Doubt — if unsure, the default is purity is maintained",
        examples: [
          { arabic: "﴿أَوْ جَاءَ أَحَدٌ مِنْكُمْ مِنَ الغَائِطِ﴾", translation: "Or one of you comes from the place of relieving oneself (Nisa 4:43)" },
          { arabic: "«إِذَا وَجَدَ أَحَدُكُمْ فِي بَطْنِهِ شَيْئًا فَلَا يَخْرُجَنَّ...»", translation: "'If one of you finds something in his abdomen, let him not leave unless he hears a sound or smells something.' (Muslim)" },
        ],
      },
      exercises: [
        {
          type: "fill_blank", instruction: "List the 6 obligatory acts of wudu in order.", instructionArabic: "اُذْكُرِ الفَرَائِضَ السِّتَّة لِلْوُضُوء بِالتَّرْتِيب.",
          items: [
            { sentence: "١. ___", blank: 1, hint: "intention" },
            { sentence: "٢. ___ الوَجْه", blank: 1, hint: "washing" },
            { sentence: "٣. ___ اليَدَيْن إِلَى المِرْفَقَيْن", blank: 1, hint: "washing" },
            { sentence: "٤. ___ الرَّأْس", blank: 1, hint: "wiping" },
            { sentence: "٥. ___ الرِّجْلَيْن إِلَى الكَعْبَيْن", blank: 1, hint: "washing" },
            { sentence: "٦. ___", blank: 1, hint: "order/sequence" },
          ],
          answers: ["النِّيَّة", "غَسْل", "غَسْل", "مَسْح", "غَسْل", "التَّرْتِيب"],
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // AQEEDAH — Pillars of Faith for Beginners (5 lessons)
  // ───────────────────────────────────────────────────────────────────────────
  "aqeedah-beginners": [
    {
      bookId: "aqeedah-beginners", lessonNum: 1, category: "aqeedah",
      title: "Introduction to Islamic Creed", titleArabic: "مُقَدِّمَةٌ فِي العَقِيدَة",
      description: "What is Aqeedah, why does it matter, and what are its six pillars?",
      pages: [
        { id: 1, arabic: "العَقِيدَةُ لُغَةً: مِنَ العَقْدِ، وَهُوَ الرَّبْطُ وَالشَّدُّ بِقُوَّة.\nالعَقِيدَةُ اصْطِلَاحًا: الإِيمَانُ الجَازِمُ الَّذِي لَا يَقْبَلُ الشَّكَّ وَلَا التَّرَدُّد.", translation: "Aqeedah linguistically: from 'aqd' (knot), meaning to bind and tie firmly.\nAqeedah technically: firm belief that accepts no doubt or wavering.", transliteration: "Al-ʿaqīdatu lughatan: mina l-ʿaqdi, wa huwa r-rabṭu wa sh-shaddu bi-quwwah...", note: "The word ʿaqīdah comes from the root ع-ق-د meaning to bind or tie. It is what you bind your heart to — your core conviction." },
        { id: 2, arabic: "أَرْكَانُ الإِيمَانِ السِّتَّة:\n١. الإِيمَانُ بِاللهِ — ٢. الإِيمَانُ بِالمَلَائِكَة\n٣. الإِيمَانُ بِالكُتُب — ٤. الإِيمَانُ بِالرُّسُل\n٥. الإِيمَانُ بِاليَوْمِ الآخِر — ٦. الإِيمَانُ بِالقَدَر خَيْرِهِ وَشَرِّهِ", translation: "The Six Pillars of Iman:\n1. Belief in Allah — 2. Belief in the Angels\n3. Belief in the Books — 4. Belief in the Messengers\n5. Belief in the Last Day — 6. Belief in Divine Decree (good and evil)", transliteration: "Arkānu l-Īmāni s-sittah:\n1. Al-Īmānu billāh — 2. Al-Īmānu bi-l-malāʾikah...", note: "These six pillars come from the Quran (Al-Baqarah 2:285) and the Hadith of Jibril." },
        { id: 3, arabic: "قَالَ اللهُ تَعَالَى:\n﴿آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ﴾", translation: "Allah says: 'The Messenger has believed in what was revealed to him from his Lord, and so have the believers. All of them have believed in Allah, His angels, His books, and His messengers.'", transliteration: "Qāla llāhu taʿālā:\n﴿Āmana r-rasūlu bimā unzila ilayhi min rabbihi wa l-muʾminūn...﴾ (Al-Baqarah 2:285)", note: "This verse confirms all pillars except Qadar (which is confirmed in multiple other verses and hadith)." },
      ],
      vocabulary: [
        { arabic: "عَقِيدَة", transliteration: "ʿaqīdah", english: "creed / faith / belief", pos: "noun (f)", plural: "عَقَائِد" },
        { arabic: "إِيمَان", transliteration: "īmān", english: "faith / belief", pos: "noun (m)" },
        { arabic: "مَلَائِكَة", transliteration: "malāʾikah", english: "angels", pos: "noun (f.pl)" },
        { arabic: "كُتُب", transliteration: "kutub", english: "books (divine scriptures)", pos: "noun (f.pl)" },
        { arabic: "رُسُل", transliteration: "rusul", english: "messengers", pos: "noun (m.pl)" },
        { arabic: "يَوْم الآخِر", transliteration: "yawmu l-ākhir", english: "the Last Day", pos: "noun phrase" },
        { arabic: "قَدَر", transliteration: "qadar", english: "divine decree / destiny", pos: "noun (m)" },
        { arabic: "تَوْحِيد", transliteration: "tawḥīd", english: "monotheism / oneness of Allah", pos: "noun (m)" },
        { arabic: "شِرْك", transliteration: "shirk", english: "associating partners with Allah", pos: "noun (m)" },
      ],
      grammar: {
        title: "Tawhid — The Core of Islamic Belief (التَّوْحِيد)", titleArabic: "التَّوْحِيد",
        explanation: "Tawhid (monotheism) is the foundation of Aqeedah. It has three categories:\n\n1. تَوْحِيدُ الرُّبُوبِيَّة (Lordship): Allah alone is the Creator, Sustainer, Owner\n   • Even the mushrikeen (polytheists of Makkah) affirmed this\n\n2. تَوْحِيدُ الأُلُوهِيَّة (Worship): Allah alone deserves all worship\n   • This is the meaning of لَا إِلَهَ إِلَّا اللهُ\n   • This is what the prophets called their people to\n\n3. تَوْحِيدُ الأَسْمَاءِ وَالصِّفَات (Names & Attributes): affirm Allah's names/attributes as in Quran & Sunnah, without distortion, denial, resemblance, or modality",
        examples: [
          { arabic: "﴿قُلْ هُوَ اللهُ أَحَدٌ﴾", translation: "'Say: He is Allah, One.' (Al-Ikhlas 112:1) — Tawhid of Lordship & Worship" },
          { arabic: "﴿وَللهِ الأَسْمَاءُ الحُسْنَى﴾", translation: "'Allah has the Most Beautiful Names.' (Al-A'raf 7:180) — Tawhid of Names & Attributes" },
          { arabic: "لَا إِلَهَ إِلَّا اللهُ", translation: "'There is no god worthy of worship except Allah.' — The Declaration of Tawhid" },
        ],
      },
      exercises: [
        {
          type: "fill_blank", instruction: "Complete the six pillars of Iman.", instructionArabic: "أَكْمِلْ أَرْكَانَ الإِيمَانِ السِّتَّة.",
          items: [
            { sentence: "١. الإِيمَانُ بِ___", blank: 1, hint: "Allah" },
            { sentence: "٢. الإِيمَانُ بِالمَلَائِكَة ___", blank: 0, hint: "(nothing — already complete)" },
            { sentence: "٣. الإِيمَانُ بِالكُتُب ___", blank: 0, hint: "(nothing)" },
            { sentence: "٤. الإِيمَانُ بِالرُّسُل ___", blank: 0, hint: "(nothing)" },
            { sentence: "٥. الإِيمَانُ بِاليَوْمِ ___", blank: 1, hint: "Last Day" },
            { sentence: "٦. الإِيمَانُ بِالقَدَرِ ___ وَشَرِّهِ", blank: 1, hint: "its good" },
          ],
          answers: ["اللهِ", "-", "-", "-", "الآخِر", "خَيْرِهِ"],
        },
        {
          type: "choose", instruction: "Answer the Aqeedah questions.", instructionArabic: "أَجِبْ عَنِ الأَسْئِلَة.",
          items: [
            { question: "What does Tawhid al-Uluhiyyah mean?", options: ["Allah is the Creator", "Allah alone deserves worship", "Allah has beautiful names", "Angels worship Allah"], answer: 1 },
            { question: "How many pillars of Iman?", options: ["5", "6", "7", "8"], answer: 1 },
          ],
          answers: [1, 1],
        },
      ],
      culturalNote: "The scholars of Ahl al-Sunnah wal-Jama'ah have preserved the correct creed for over 1400 years. Key texts include: Al-Aqeedah Al-Wasitiyya by Ibn Taymiyyah, Al-Aqeedah Al-Tahawiyya by Imam Al-Tahawi, and Lum'at Al-I'tiqad by Ibn Qudamah. Study one of these with a qualified scholar.",
    },
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // TAFSIR — Tafsir of Juz Amma (5 surahs)
  // ───────────────────────────────────────────────────────────────────────────
  "tafsir-juz-amma": [
    {
      bookId: "tafsir-juz-amma", lessonNum: 1, category: "tafsir",
      title: "Surah Al-Fatiha — The Opening", titleArabic: "سُورَةُ الفَاتِحَة — تَفْسِيرٌ كَامِل",
      description: "A complete tafsir of Al-Fatiha — the greatest surah, repeated 17 times daily in prayer.",
      pages: [
        { id: 1, arabic: "﴿بِسْمِ اللهِ الرَّحْمَٰنِ الرَّحِيمِ﴾\n﴿الْحَمْدُ للهِ رَبِّ الْعَالَمِينَ﴾", translation: "In the name of Allah, the Most Gracious, the Most Merciful.\nAll praise is due to Allah, Lord of all the worlds.", transliteration: "Bismi llāhi r-raḥmāni r-raḥīm.\nAl-ḥamdu li-llāhi rabbi l-ʿālamīn.", note: "الحَمْد = all praise (definite article = ALL praise is Allah's). رَبِّ العَالَمِين — Allah is Lord of every world: humans, jinn, animals, plants, galaxies — ALL of existence." },
        { id: 2, arabic: "﴿الرَّحْمَٰنِ الرَّحِيمِ﴾\n﴿مَالِكِ يَوْمِ الدِّينِ﴾", translation: "The Most Gracious, the Most Merciful.\nMaster of the Day of Judgment.", transliteration: "Ar-raḥmāni r-raḥīm.\nMāliki yawmi d-dīn.", note: "رَحْمَان: expansive mercy for ALL creation. رَحِيم: special mercy for believers. مَالِك = Owner/Master. يَوْم الدِّين = The Day of Recompense." },
        { id: 3, arabic: "﴿إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ﴾", translation: "You alone we worship and You alone we ask for help.", transliteration: "Iyyāka naʿbudu wa iyyāka nastaʿīn.", note: "The center of Al-Fatiha and the center of Islam. Starting with إِيَّاكَ (You!) emphasizes EXCLUSIVITY — only Allah. نَعْبُد = we worship (plural: community of faith). نَسْتَعِين = we seek help." },
        { id: 4, arabic: "﴿اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ﴾\n﴿صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ﴾", translation: "Guide us to the straight path — the path of those upon whom You have bestowed favor, not of those who have evoked anger or of those who are astray.", transliteration: "Ihdinā ṣ-ṣirāṭa l-mustaqīm.\nṢirāṭa lladhīna anʿamta ʿalayhim ghayri l-maghḍūbi ʿalayhim wa lā ḍ-ḍāllīn.", note: "اهْدِنَا = guide us (we are ALWAYS in need of guidance, even after becoming guided!). المَغْضُوب عَلَيْهِم = those who know the truth but reject it. الضَّالِّين = those who are misguided without knowledge." },
      ],
      vocabulary: [
        { arabic: "حَمْد", transliteration: "ḥamd", english: "praise / gratitude", pos: "noun (m)" },
        { arabic: "رَبّ", transliteration: "rabb", english: "Lord / Sustainer", pos: "noun (m)" },
        { arabic: "عَالَم", transliteration: "ʿālam", english: "world / universe", pos: "noun (m)", plural: "عَالَمُون / عَوَالِم" },
        { arabic: "رَحْمَان", transliteration: "raḥmān", english: "The Most Gracious (universal mercy)", pos: "divine name" },
        { arabic: "رَحِيم", transliteration: "raḥīm", english: "The Most Merciful (special mercy)", pos: "divine name" },
        { arabic: "مَالِك", transliteration: "mālik", english: "Owner / Master / King", pos: "divine attribute" },
        { arabic: "عِبَادَة", transliteration: "ʿibādah", english: "worship", pos: "noun (f)" },
        { arabic: "اسْتِعَانَة", transliteration: "istiʿānah", english: "seeking help", pos: "noun (f)" },
        { arabic: "صِرَاط", transliteration: "ṣirāṭ", english: "path / way / road", pos: "noun (m)" },
        { arabic: "مُسْتَقِيم", transliteration: "mustaqīm", english: "straight / upright", pos: "adjective" },
      ],
      grammar: {
        title: "Al-Fatiha — Structure & Significance (بُنْيَة سُورَة الفَاتِحَة)", titleArabic: "بُنْيَةُ الفَاتِحَة",
        explanation: "Al-Fatiha has 7 ayahs and is divided into two halves by a hadith Qudsi:\n\nAllah says: 'I have divided prayer between Me and My servant into two halves, and My servant shall have what he asks for.'\n\nFirst half (ayahs 1-3): PRAISE OF ALLAH\n• Bismillah — invoking Allah's name\n• Al-Hamdu — praising Allah\n• Ar-Rahman Ar-Rahim — His mercy\n• Maliki yawm id-deen — His sovereignty\n\nSecond half (ayahs 5-7): THE SERVANT'S REQUEST\n• Iyyaka naʿbud — declaration of worship\n• Iyyaka nastaʿin — seeking help\n• Ihdinas — the great supplication\n\nAyah 5 (Iyyaka) is the PIVOT — bridge between praise and asking.",
        examples: [
          { arabic: "«أُمُّ الكِتَاب وَالسَّبْعُ المَثَانِي»", translation: "'Mother of the Book and the Seven Often-Repeated Verses' — names of Al-Fatiha in hadith" },
          { arabic: "«لَا صَلَاةَ لِمَنْ لَمْ يَقْرَأْ بِفَاتِحَةِ الكِتَاب»", translation: "'There is no prayer for one who does not recite Al-Fatiha.' (Bukhari)" },
        ],
      },
      exercises: [
        {
          type: "choose", instruction: "Answer questions about Al-Fatiha.", instructionArabic: "أَجِبْ عَنِ أَسْئِلَة الفَاتِحَة.",
          items: [
            { question: "How many times is Al-Fatiha recited daily (minimum)?", options: ["5 times", "10 times", "17 times", "34 times"], answer: 2 },
            { question: "What does الرَّحْمَان mean compared to الرَّحِيم?", options: ["They are identical", "Rahmanexpansive mercy for all creation; Rahim = special mercy for believers", "Rahman is for believers; Rahim is for all", "Rahman is stronger"], answer: 1 },
            { question: "﴿إِيَّاكَ نَعْبُدُ﴾ — What does إِيَّاكَ emphasize?", options: ["We worship together", "Exclusivity — ONLY You", "We ask for worship", "Multiple gods"], answer: 1 },
          ],
          answers: [2, 1, 1],
        },
      ],
      culturalNote: "Al-Fatiha is called 'Umm al-Quran' (Mother of the Quran), 'Al-Sab' al-Mathani' (The Seven Often-Repeated), and 'Al-Ruqyah' (The Healing). It was called 'Al-Ruqyah' because a Companion used it to heal a snake-bitten man, and the Prophet ﷺ approved. Reading it with sincerity and understanding transforms your prayer.",
    },
    {
      bookId: "tafsir-juz-amma", lessonNum: 2, category: "tafsir",
      title: "Surah Al-Ikhlas — Pure Monotheism", titleArabic: "سُورَةُ الإِخْلَاص — التَّوْحِيد الخَالِص",
      description: "The surah that defines Allah's essence — worth a third of the Quran.",
      pages: [
        { id: 1, arabic: "﴿قُلْ هُوَ اللهُ أَحَدٌ﴾\n﴿اللهُ الصَّمَدُ﴾", translation: "'Say: He is Allah, One.\nAllah is the Self-Sufficient Master.'", transliteration: "Qul huwa llāhu aḥad.\nAllāhu ṣ-ṣamad.", note: "أَحَد = ONE, uniquely alone with no equals, no partners, no counterparts. الصَّمَد = The Samad: the One whom all creation needs while He needs nothing — the Lord, Master, and Refuge of all." },
        { id: 2, arabic: "﴿لَمْ يَلِدْ وَلَمْ يُولَدْ﴾\n﴿وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ﴾", translation: "'He neither begot nor was He begotten.\nNor is there any equivalent to Him.'", transliteration: "Lam yalid wa lam yūlad.\nWa lam yakun lahu kufuwan aḥad.", note: "This refutes three false beliefs: لَمْ يَلِدْ refutes Christianity (Jesus is not Allah's son). لَمْ يُولَدْ refutes paganism. كُفُوًا أَحَد = no equivalent, peer, or equal to Allah in any way." },
      ],
      vocabulary: [
        { arabic: "أَحَد", transliteration: "aḥad", english: "One (unique, alone)", pos: "divine name" },
        { arabic: "صَمَد", transliteration: "ṣamad", english: "The Self-Sufficient, Eternal Refuge", pos: "divine name" },
        { arabic: "وَلَد", transliteration: "walad", english: "offspring / child", pos: "noun (m)" },
        { arabic: "كُفُو", transliteration: "kufuʾ", english: "equivalent / equal / peer", pos: "noun (m)" },
        { arabic: "إِخْلَاص", transliteration: "ikhlāṣ", english: "sincerity / pure devotion", pos: "noun (m)" },
      ],
      grammar: {
        title: "Why Al-Ikhlas Equals One-Third of the Quran (عَدْلُ ثُلُثِ القُرْآن)", titleArabic: "فَضْلُ سُورَةِ الإِخْلَاص",
        explanation: "The Prophet ﷺ said: 'Qul huwa llahu ahad is equal to one third of the Quran.' (Bukhari)\n\nWhy? Because the Quran contains three main themes:\n1. Stories (Qasas) — history of prophets and nations\n2. Legal rulings (Ahkam) — halal, haram, fiqh\n3. Creed (Aqeedah) — belief in Allah\n\nSurah Al-Ikhlas contains pure Aqeedah — the essence of knowing Allah — so it equals one third.\n\nFour names of Allah in 4 ayahs:\n1. اللهُ — the personal name of the divine\n2. أَحَد — the One with no partners\n3. الصَّمَد — the Eternal Refuge\n4. (implied) الأَوَّل وَالآخِر — The First and Last (begetting implies temporal limit, which He is free from)",
        examples: [
          { arabic: "«مَنْ قَرَأَ (قُلْ هُوَ اللهُ أَحَد) عَشْرَ مَرَّاتٍ بَنَى اللهُ لَهُ قَصْرًا فِي الجَنَّة»", translation: "'Whoever reads Qul hu wallahu ahad ten times, Allah builds him a palace in Paradise.' (Ahmad)" },
        ],
      },
      exercises: [
        {
          type: "fill_blank", instruction: "Complete the surah from memory.", instructionArabic: "أَكْمِلِ السُّورَةَ مِنَ الحِفْظ.",
          items: [
            { sentence: "﴿قُلْ هُوَ اللهُ ___﴾", blank: 1, hint: "One" },
            { sentence: "﴿اللهُ ___﴾", blank: 1, hint: "the Self-Sufficient" },
            { sentence: "﴿لَمْ ___ وَلَمْ يُولَد﴾", blank: 1, hint: "he begat" },
            { sentence: "﴿وَلَمْ يَكُن لَّهُ كُفُوًا ___﴾", blank: 1, hint: "anyone" },
          ],
          answers: ["أَحَدٌ", "الصَّمَدُ", "يَلِدْ", "أَحَدٌ"],
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // MADINAH ARABIC — Book 1 (2 full lessons)
  // ───────────────────────────────────────────────────────────────────────────
  "madinah-arabic-1": [
    {
      bookId: "madinah-arabic-1", lessonNum: 1, category: "arabic",
      title: "This and That (Masculine)", titleArabic: "الدَّرْسُ الأَوَّل: هَذَا وَذَلِكَ",
      description: "Use هَذَا and ذَلِكَ with masculine nouns to form 'This is a...' sentences.",
      pages: [
        { id: 1, arabic: "هَذَا كِتَابٌ.\nهَذَا قَلَمٌ.\nهَذَا مِفْتَاحٌ.", translation: "This is a book.\nThis is a pen.\nThis is a key.", transliteration: "Hādhā kitābun.\nHādhā qalamun.\nHādhā miftāḥun.", note: "هَذَا (hādhā) = 'this' for MASCULINE nouns. No verb needed — 'is' is implied. Noun is indefinite: ends in ـٌ (tanwīn)." },
        { id: 2, arabic: "مَا هَذَا؟\nهَذَا بَابٌ.\nهَذَا كُرْسِيٌّ.\nهَذَا سَرِيرٌ.", translation: "What is this?\nThis is a door.\nThis is a chair.\nThis is a bed.", transliteration: "Mā hādhā?\nHādhā bābun.\nHādhā kursiyyun.\nHādhā sarīrun.", note: "مَا = 'what' for things. مَنْ = 'who' for people. The question-answer pattern is the core of the Madinah method." },
        { id: 3, arabic: "ذَلِكَ كِتَابٌ.\nذَلِكَ بَيْتٌ كَبِيرٌ.\nذَلِكَ مَسْجِدٌ.", translation: "That is a book.\nThat is a big house.\nThat is a mosque.", transliteration: "Dhālika kitābun.\nDhālika baytun kabīrun.\nDhālika masjidun.", note: "ذَلِكَ (dhālika) = 'that' for masculine, far away. Adjective كَبِيرٌ follows and agrees with the noun." },
      ],
      vocabulary: [
        { arabic: "هَذَا", transliteration: "hādhā", english: "this (m.)", pos: "demonstrative" },
        { arabic: "ذَلِكَ", transliteration: "dhālika", english: "that (m.)", pos: "demonstrative" },
        { arabic: "مَا", transliteration: "mā", english: "what (for things)", pos: "interrogative" },
        { arabic: "مَنْ", transliteration: "man", english: "who (for people)", pos: "interrogative" },
        { arabic: "قَلَم", transliteration: "qalam", english: "pen", pos: "noun (m)", plural: "أَقْلَام" },
        { arabic: "مِفْتَاح", transliteration: "miftāḥ", english: "key", pos: "noun (m)", plural: "مَفَاتِيح" },
        { arabic: "كُرْسِيّ", transliteration: "kursī", english: "chair", pos: "noun (m)", plural: "كَرَاسِي" },
        { arabic: "بَاب", transliteration: "bāb", english: "door", pos: "noun (m)", plural: "أَبْوَاب" },
        { arabic: "مَسْجِد", transliteration: "masjid", english: "mosque", pos: "noun (m)", plural: "مَسَاجِد" },
        { arabic: "سَرِير", transliteration: "sarīr", english: "bed", pos: "noun (m)", plural: "أَسِرَّة" },
      ],
      grammar: {
        title: "Demonstrative Sentences (هَذَا + نَكِرَة)", titleArabic: "هَذَا + نَكِرَة",
        explanation: "Pattern: هَذَا / ذَلِكَ + Indefinite noun (ـٌ)\n\nRules:\n1. No verb 'is' — implied\n2. Noun is INDEFINITE (tanwīn ـٌ)\n3. هَذَا = near masculine\n4. ذَلِكَ = far masculine\n5. هَذِهِ / تِلْكَ = for feminine\n\nDo NOT say: هَذَا اَلكِتَابُ = 'This is THE book' — that means 'This book is...' (different structure).",
        examples: [
          { arabic: "هَذَا قَلَمٌ.", translation: "This is a pen." },
          { arabic: "مَا هَذَا؟ هَذَا بَابٌ.", translation: "What is this? This is a door." },
          { arabic: "ذَلِكَ مَسْجِدٌ كَبِيرٌ.", translation: "That is a big mosque." },
        ],
      },
      exercises: [
        {
          type: "fill_blank", instruction: "Fill in with هَذَا or ذَلِكَ.", instructionArabic: "أَكْمِلْ بِـ هَذَا أَوْ ذَلِكَ.",
          items: [{ sentence: "___ كِتَابٌ. (near)", blank: 1, hint: "this (near)" }, { sentence: "___ بَيْتٌ كَبِيرٌ. (far)", blank: 1, hint: "that (far)" }],
          answers: ["هَذَا", "ذَلِكَ"],
        },
        {
          type: "translate", instruction: "Translate into Arabic.", instructionArabic: "تَرْجِمْ إِلَى العَرَبِيَّة.",
          items: [{ english: "What is this?" }, { english: "This is a mosque." }, { english: "That is a big house." }],
          answers: ["مَا هَذَا؟", "هَذَا مَسْجِدٌ.", "ذَلِكَ بَيْتٌ كَبِيرٌ."],
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────────────
  // ARABIC FOR YOUTH — Level 1 (1 lesson)
  // ───────────────────────────────────────────────────────────────────────────
  "arabic-nasheeen-1": [
    {
      bookId: "arabic-nasheeen-1", lessonNum: 1, category: "arabic",
      title: "My Name & Where I'm From", titleArabic: "اسْمِي وَبَلَدِي",
      description: "Introduce yourself in Arabic: name, country, and what you study.",
      pages: [
        { id: 1, arabic: "اِسْمِي عَلِيٌّ. أَنَا مِنَ الصُّومَال.\nأَنَا طَالِبٌ فِي مَعْهَدِ البَيَان.", translation: "My name is Ali. I am from Somalia.\nI am a student at Al-Bayaan Institute.", transliteration: "Ismī ʿAliyyun. Anā min aṣ-Ṣūmāl.\nAnā ṭālibun fī Maʿhad al-Bayān.", note: "اسْمِي = 'my name'. ـِي is the attached pronoun for 'my'. This is the key possessive structure for beginners." },
        { id: 2, arabic: "اسْمُكَ؟ — اسْمِي أَحْمَدُ.\nمِنْ أَيْنَ أَنْتَ؟ — أَنَا مِنَ اليَمَن.\nمَاذَا تَدْرُسُ؟ — أَدْرُسُ اللُّغَةَ العَرَبِيَّة.", translation: "What is your name? — My name is Ahmad.\nWhere are you from? — I am from Yemen.\nWhat do you study? — I study Arabic language.", transliteration: "Ismuka? — Ismī Aḥmadu.\nMin ayna anta? — Anā min al-Yaman.\nMādhā tadrusu? — Adrusu l-lughat al-ʿarabiyyah.", note: "اسْمُكَ (your name) = اسم + كَ. Present tense: تَدْرُسُ (you study, m) vs تَدْرُسِين (you study, f)." },
      ],
      vocabulary: [
        { arabic: "اسْم", transliteration: "ism", english: "name", pos: "noun (m)", plural: "أَسْمَاء" },
        { arabic: "بَلَد", transliteration: "balad", english: "country / hometown", pos: "noun (m)", plural: "بِلَاد" },
        { arabic: "الصُّومَال", transliteration: "aṣ-Ṣūmāl", english: "Somalia", pos: "proper noun" },
        { arabic: "اليَمَن", transliteration: "al-Yaman", english: "Yemen", pos: "proper noun" },
        { arabic: "مِصْر", transliteration: "Miṣr", english: "Egypt", pos: "proper noun" },
        { arabic: "درَسَ — يَدْرُسُ", transliteration: "darasa — yadrusu", english: "to study", pos: "verb" },
        { arabic: "مَعْهَد", transliteration: "maʿhad", english: "institute", pos: "noun (m)", plural: "مَعَاهِد" },
        { arabic: "مَاذَا", transliteration: "mādhā", english: "what (for actions)", pos: "interrogative" },
      ],
      grammar: {
        title: "Attached Pronouns for Possession (ضَمَائِر الاتِّصَال)", titleArabic: "ضَمَائِر الاتِّصَال",
        explanation: "Attached pronouns (ضَمَائِر مُتَّصِلَة) are added to nouns to show possession:\n• ـِي = my → اسْمِي (my name)\n• ـكَ = your (m) → اسْمُكَ (your name)\n• ـكِ = your (f) → اسْمُكِ\n• ـهُ = his → اسْمُهُ (his name)\n• ـهَا = her → اسْمُهَا (her name)\n• ـنَا = our → اسْمُنَا (our name)",
        examples: [
          { arabic: "اسْمِي عَلِيٌّ.", translation: "My name is Ali." },
          { arabic: "بَيْتُنَا كَبِيرٌ.", translation: "Our house is big." },
          { arabic: "كِتَابُهَا جَدِيدٌ.", translation: "Her book is new." },
        ],
      },
      exercises: [
        {
          type: "fill_blank", instruction: "Add the correct pronoun suffix.", instructionArabic: "أَلْصِقِ الضَّمِيرَ المُنَاسِب.",
          items: [{ sentence: "اسْم___ عَلِيٌّ. (My name is Ali)", blank: 1, hint: "my" }, { sentence: "بَيْت___ كَبِيرٌ. (His house is big)", blank: 1, hint: "his" }],
          answers: ["ـِي", "ـهُ"],
        },
      ],
    },
  ],
};

// ─── Helper: get lesson + smart AI fallback ───────────────────────────────────

function getLessonContent(bookId: string, lessonNum: number): LessonContent | null {
  const book = LESSONS[bookId];
  if (!book || book.length === 0) return null;

  const lesson = book.find(l => l.lessonNum === lessonNum);
  if (lesson) return lesson;

  // Smart fallback: return lesson structure with AI guidance (no بسم الله placeholder)
  const firstLesson = book[0];
  const lastLesson = book[book.length - 1];
  const category = firstLesson?.category ?? "arabic";

  const categoryTitles: Record<string, { en: string; ar: string }> = {
    arabic: { en: "Arabic Language Lesson", ar: "دَرْسُ اللُّغَةِ العَرَبِيَّة" },
    hadith: { en: "Hadith Study", ar: "دِرَاسَةُ الحَدِيث" },
    tajweed: { en: "Tajweed Rule", ar: "قَاعِدَةُ التَّجْوِيد" },
    fiqh: { en: "Islamic Jurisprudence", ar: "مَسْأَلَةٌ فِقْهِيَّة" },
    aqeedah: { en: "Islamic Creed", ar: "مَسْأَلَةٌ عَقَدِيَّة" },
    tafsir: { en: "Quranic Exegesis", ar: "تَفْسِيرٌ قُرْآنِيّ" },
    quran: { en: "Quran Study", ar: "دِرَاسَةٌ قُرْآنِيَّة" },
    hingaad: { en: "Arabic Reading", ar: "القِرَاءَةُ العَرَبِيَّة" },
  };

  const ct = categoryTitles[category] ?? categoryTitles.arabic;

  return {
    bookId,
    lessonNum,
    category,
    title: `${ct.en} ${lessonNum}`,
    titleArabic: `${ct.ar} — الدَّرْسُ ${lessonNum}`,
    description: `Lesson ${lessonNum} continues building on the curriculum. Use the AI Teacher tab to get a personalized lesson on this topic.`,
    pages: [
      {
        id: 1,
        arabic: `الدَّرْسُ ${lessonNum}`,
        translation: `Lesson ${lessonNum}`,
        transliteration: `Ad-darsu ${lessonNum}`,
        note: `This lesson continues from where Lesson ${lastLesson?.lessonNum ?? lessonNum - 1} left off. Click "Ask AI Teacher" to receive a complete interactive lesson for this topic, including explanations, examples, and exercises.`,
      },
    ],
    vocabulary: [],
    grammar: {
      title: "Continue with AI Teacher",
      titleArabic: "تَابِعْ مَعَ مُعَلِّمِ الذَّكَاء الاصْطِنَاعِي",
      explanation: `This lesson (${lessonNum}) is guided by the AI Teacher who will customize the content to your level.\n\nTo start:\n1. Click the "Ask AI Teacher" button below\n2. Tell the teacher which book you are studying and what lesson number\n3. Ask them to explain the next topic in sequence\n\nThe AI Teacher knows the full curriculum for this book and will pick up exactly where the previous lesson left off.`,
      examples: [],
    },
    exercises: [],
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/lessons/:bookId/:lessonNum", requireAuth, async (req: any, res) => {
  try {
    const { bookId, lessonNum } = req.params;
    const num = parseInt(lessonNum);
    if (isNaN(num) || num < 1) {
      res.status(400).json({ error: "Invalid lesson number" });
      return;
    }
    const lesson = getLessonContent(bookId, num);
    if (!lesson) {
      res.status(404).json({ error: `No lesson content available for book '${bookId}'` });
      return;
    }
    res.json({ lesson });
  } catch (err) {
    logger.error({ err }, "Failed to get lesson content");
    res.status(500).json({ error: "Internal server error" });
  }
});

// AI feedback — evaluates student reading of any lesson type
router.post("/lessons/feedback", requireAuth, async (req: any, res) => {
  try {
    const {
      transcription,
      targetText,
      transcriptionError,
      lessonTitle,
      lessonCategory = "arabic",
      bookTitle,
    } = req.body;

    if (!targetText) {
      res.status(400).json({ error: "targetText is required" });
      return;
    }

    const categoryPrompts: Record<string, string> = {
      arabic: "Focus on Arabic pronunciation, vowel sounds (harakat), and letter emphasis.",
      tajweed: "Focus specifically on Tajweed rules: makharij, sifat, noon saakin, madd, qalqalah, etc.",
      hadith: "Evaluate the student's pronunciation of this hadith text. Focus on Arabic phonics.",
      fiqh: "Evaluate the student's recitation of this Islamic text. Note any terminology mispronounced.",
      aqeedah: "Evaluate the student's recitation of this creed text with attention to theological terms.",
      tafsir: "Evaluate the student's recitation of this Quranic verse. Apply Tajweed standards.",
      quran: "Apply FULL Tajweed evaluation: makharij, sifat, noon saakin rules, madd, ghunnah, etc.",
      hingaad: "Focus on Arabic letter recognition and correct vowel sounds.",
    };

    const systemPrompt = `You are an expert ${lessonCategory} teacher at Al-Bayaan Islamic Institute. A student has recorded their reading of an Arabic text and you are providing evaluation.

LESSON: ${lessonTitle ?? "Arabic lesson"}${bookTitle ? ` from "${bookTitle}"` : ""}
CATEGORY: ${lessonCategory}
TARGET TEXT: ${targetText}
${transcriptionError ? `TRANSCRIPTION ERROR: ${transcriptionError}` : `STUDENT'S READING (transcribed): ${transcription || "(transcription not available)"}`}

${categoryPrompts[lessonCategory] ?? categoryPrompts.arabic}

Provide your feedback in this exact format:

**SCORE: X/100**

**✓ What went well:**
[List specific words or phrases the student read correctly, or encourage them if transcription failed]

**⚠ Areas to improve:**
[List specific pronunciation issues if transcription is available, or give general guidance]

**💡 Tip:**
[One specific, actionable improvement tip]

**Keep going!**
[One sentence of sincere encouragement in a warm, Islamic teaching style]

${!transcription && !transcriptionError ? "NOTE: If transcription was unavailable, evaluate based on the student's effort to practice this text and give encouraging feedback for continuing to try." : ""}

Keep the total response under 200 words. Be encouraging and specific.`;

    const messages: AIChatMessage[] = [
      {
        role: "user",
        content: `Please evaluate my reading of: "${targetText}"\n${transcription ? `My attempt: "${transcription}"` : transcriptionError ? `Transcription failed: ${transcriptionError}` : "I recorded but the transcription did not capture clearly."}`,
      },
    ];

    setSSEHeaders(res);
    await streamToResponse(res, messages, { fallback: `**SCORE: 70/100**\n\n**✓ What went well:**\nYou practiced this text — that itself is a great step!\n\n**💡 Tip:**\nListen to the audio playback, then record again. Focus on matching the rhythm and vowel sounds.\n\n**Keep going!**\nMay Allah make the Arabic language easy for you. جَزَاكَ اللهُ خَيْرًا for your effort!`, maxTokens: 400 });
  } catch (err) {
    logger.error({ err }, "Lesson feedback failed");
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
