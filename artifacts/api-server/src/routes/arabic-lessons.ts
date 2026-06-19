import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { setSSEHeaders, streamToResponse } from "../lib/aiProvider";

const router = Router();

// ─── Types ───────────────────────────────────────────────────────────────────

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
  pos: string; // part of speech
  plural?: string;
  example?: string;
}

interface GrammarNote {
  title: string;
  titleArabic: string;
  explanation: string;
  examples: Array<{ arabic: string; translation: string }>;
}

type ExerciseType = "fill_blank" | "translate" | "match" | "choose" | "arrange";

interface Exercise {
  type: ExerciseType;
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
  pages: LessonPage[];
  vocabulary: VocabWord[];
  grammar: GrammarNote;
  exercises: Exercise[];
  culturalNote?: string;
}

// ─── Real Lesson Data ─────────────────────────────────────────────────────────

const LESSONS: Record<string, LessonContent[]> = {

  // ══════════════════════════════════════════════════════════════════════════
  // العربية بين يديك — Book 1 (Arabic Between Your Hands)
  // ══════════════════════════════════════════════════════════════════════════
  "arabic-bayna-yadayk-1": [
    {
      bookId: "arabic-bayna-yadayk-1", lessonNum: 1,
      title: "Greetings & Farewells",
      titleArabic: "التَّحِيَّاتُ وَالوَدَاع",
      description: "Learn essential Arabic greetings and farewells used in everyday conversation.",
      pages: [
        {
          id: 1,
          arabic: "اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ.",
          translation: "Peace be upon you, and the mercy of Allah and His blessings.",
          transliteration: "As-salāmu ʿalaykum wa raḥmatu llāhi wa barakātuh.",
          note: "This is the full Islamic greeting. It is a supplication (duʿāʾ) for the person you are greeting.",
        },
        {
          id: 2,
          arabic: "وَعَلَيْكُمُ السَّلَامُ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ.",
          translation: "And upon you peace, and the mercy of Allah and His blessings.",
          transliteration: "Wa ʿalaykumu s-salāmu wa raḥmatu llāhi wa barakātuh.",
          note: "This is the full reply to the greeting. Notice the word order changes: وَعَلَيْكُمُ comes first.",
        },
        {
          id: 3,
          arabic: "كَيْفَ حَالُكَ؟\nأَنَا بِخَيْرٍ، شُكْرًا، وَالْحَمْدُ لِلَّهِ. وَأَنْتَ؟",
          translation: "How are you? [to a male]\nI am fine, thank you, and praise be to Allah. And you?",
          transliteration: "Kayfa ḥāluk?\nAnā bi-khayr, shukran, wa l-ḥamdu li-llāh. Wa anta?",
          note: "كَيْفَ حَالُكِ is used when addressing a female. The ك changes to كِ.",
        },
        {
          id: 4,
          arabic: "أَهْلًا وَسَهْلًا!\nأَهْلًا بِكَ! / أَهْلًا بِكِ!",
          translation: "Welcome!\nWelcome to you! [male / female]",
          transliteration: "Ahlan wa sahlan!\nAhlan bika! / Ahlan biki!",
          note: "أَهْلًا وَسَهْلًا literally means 'you have come to family and an easy place'. It is the warm Arabic welcome.",
        },
        {
          id: 5,
          arabic: "مَعَ السَّلَامَةِ!\nإِلَى اللِّقَاءِ! / إِلَى الغَدِ!",
          translation: "Goodbye! (lit. go with safety)\nUntil we meet again! / Until tomorrow!",
          transliteration: "Maʿa s-salāmah!\nIla l-liqāʾ! / Ila l-ghad!",
          note: "مَعَ السَّلَامَةِ is said to the person leaving. The person staying says وَدَاعًا or اللهُ مَعَكَ.",
        },
      ],
      vocabulary: [
        { arabic: "اَلسَّلَام", transliteration: "as-salām", english: "peace", pos: "noun (m)" },
        { arabic: "رَحْمَة", transliteration: "raḥmah", english: "mercy", pos: "noun (f)", plural: "رَحَمَات" },
        { arabic: "بَرَكَة", transliteration: "barakah", english: "blessing", pos: "noun (f)", plural: "بَرَكَات" },
        { arabic: "كَيْفَ", transliteration: "kayfa", english: "how", pos: "interrogative particle" },
        { arabic: "حَال", transliteration: "ḥāl", english: "condition, state", pos: "noun (m/f)", plural: "أَحْوَال" },
        { arabic: "بِخَيْرٍ", transliteration: "bi-khayr", english: "fine, well", pos: "prepositional phrase", example: "أَنَا بِخَيْرٍ — I am fine" },
        { arabic: "شُكْرًا", transliteration: "shukran", english: "thank you", pos: "verbal noun" },
        { arabic: "اَلْحَمْدُ لِلَّهِ", transliteration: "al-ḥamdu li-llāh", english: "praise be to Allah", pos: "phrase" },
        { arabic: "أَهْلًا", transliteration: "ahlan", english: "welcome / hello", pos: "exclamation" },
        { arabic: "مَرْحَبًا", transliteration: "marḥaban", english: "welcome / hello", pos: "exclamation" },
        { arabic: "مَعَ السَّلَامَة", transliteration: "maʿa s-salāmah", english: "goodbye", pos: "phrase" },
        { arabic: "إِلَى اللِّقَاء", transliteration: "ilā l-liqāʾ", english: "until we meet again", pos: "phrase" },
      ],
      grammar: {
        title: "The Nominal Sentence (الجُمْلَة الاسْمِيَّة)",
        titleArabic: "الجُمْلَة الاسْمِيَّة",
        explanation: "Arabic has two basic sentence types. The Nominal Sentence (الجُمْلَة الاسْمِيَّة) begins with a noun or pronoun. It has two parts:\n\n• المُبْتَدَأ (al-mubtadaʾ): the Subject — always definite\n• الخَبَر (al-khabar): the Predicate — tells us something about the subject\n\nImportantly, Arabic has NO verb 'to be' (is/am/are) in the present tense. It is implied.\n\nExample: اَلسَّلَامُ عَلَيْكُمْ\n• اَلسَّلَامُ = subject (peace)\n• عَلَيْكُمْ = predicate (upon you)",
        examples: [
          { arabic: "أَنَا طَالِبٌ.", translation: "I am a student. (lit: I — a student)" },
          { arabic: "هُوَ مُعَلِّمٌ.", translation: "He is a teacher." },
          { arabic: "البَيْتُ كَبِيرٌ.", translation: "The house is big." },
          { arabic: "اَلسَّلَامُ عَلَيْكُمْ.", translation: "Peace (be) upon you." },
        ],
      },
      exercises: [
        {
          type: "fill_blank",
          instruction: "Fill in the blank with the correct Arabic word.",
          instructionArabic: "أَكْمِلِ الفَرَاغَ بِالكَلِمَةِ الصَّحِيحَة.",
          items: [
            { sentence: "اَلسَّلَامُ ___ وَرَحْمَةُ اللهِ.", blank: 1, hint: "upon you (pl)" },
            { sentence: "كَيْفَ ___؟", blank: 1, hint: "your condition [to male]" },
            { sentence: "أَنَا ___ وَالْحَمْدُ لِلَّهِ.", blank: 1, hint: "fine/well" },
            { sentence: "___ وَسَهْلًا!", blank: 1, hint: "welcome" },
          ],
          answers: ["عَلَيْكُمْ", "حَالُكَ", "بِخَيْرٍ", "أَهْلًا"],
        },
        {
          type: "translate",
          instruction: "Translate into Arabic.",
          instructionArabic: "تَرْجِمْ إِلَى اللُّغَةِ العَرَبِيَّة.",
          items: [
            { english: "Peace be upon you" },
            { english: "I am fine" },
            { english: "Thank you" },
            { english: "Goodbye" },
          ],
          answers: ["اَلسَّلَامُ عَلَيْكُمْ", "أَنَا بِخَيْرٍ", "شُكْرًا", "مَعَ السَّلَامَة"],
        },
        {
          type: "match",
          instruction: "Match each Arabic phrase with its English meaning.",
          instructionArabic: "طَابِقْ بَيْنَ العِبَارَات العَرَبِيَّة وَمَعَانِيهَا.",
          items: [
            { arabic: "كَيْفَ حَالُكَ؟", english: "How are you?" },
            { arabic: "مَرْحَبًا", english: "Hello / Welcome" },
            { arabic: "شُكْرًا", english: "Thank you" },
            { arabic: "إِلَى اللِّقَاء", english: "Until we meet again" },
          ],
          answers: [0, 1, 2, 3],
        },
        {
          type: "choose",
          instruction: "Choose the correct answer.",
          instructionArabic: "اِخْتَرِ الجَوَابَ الصَّحِيح.",
          items: [
            { question: "How do you say 'How are you?' to a female?", options: ["كَيْفَ حَالُكَ؟", "كَيْفَ حَالُكِ؟", "كَيْفَ أَنْتَ؟", "كَيْفَ هِيَ؟"], answer: 1 },
            { question: "What does 'اَلْحَمْدُ لِلَّهِ' mean?", options: ["Thank you", "Goodbye", "Praise be to Allah", "Peace be upon you"], answer: 2 },
            { question: "Which phrase means 'goodbye' (said to the one leaving)?", options: ["أَهْلًا وَسَهْلًا", "كَيْفَ حَالُكَ", "مَعَ السَّلَامَة", "إِلَى اللِّقَاء"], answer: 2 },
          ],
          answers: [1, 2, 2],
        },
      ],
      culturalNote: "The Islamic greeting السَّلَامُ عَلَيْكُمْ is both a greeting and a prayer for the person's wellbeing. The Prophet Muhammad ﷺ said: 'You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I not guide you to something that, if you do it, you will love one another? Spread the greeting of salaam among yourselves.' (Muslim)",
    },

    {
      bookId: "arabic-bayna-yadayk-1", lessonNum: 2,
      title: "The Arabic Alphabet",
      titleArabic: "الحُرُوفُ العَرَبِيَّة",
      description: "Master the 28 Arabic letters, their shapes, and how to read vowel marks (harakat).",
      pages: [
        {
          id: 1,
          arabic: "الحُرُوفُ العَرَبِيَّةُ ثَمَانِيَةٌ وَعِشْرُونَ حَرْفًا.",
          translation: "The Arabic letters are twenty-eight letters.",
          transliteration: "Al-ḥurūfu l-ʿarabiyyatu thamāniyatun wa ʿishrūna ḥarfan.",
          note: "Arabic is written from right to left. Most letters connect to the letters before and after them.",
        },
        {
          id: 2,
          arabic: "أَ / أَلِفٌ — بَ / بَاءٌ — تَ / تَاءٌ — ثَ / ثَاءٌ — جَ / جِيمٌ — حَ / حَاءٌ — خَ / خَاءٌ",
          translation: "Alif — Bāʾ — Tāʾ — Thāʾ — Jīm — Ḥāʾ — Khāʾ",
          transliteration: "ʾ — b — t — th — j — ḥ — kh",
          note: "These are the first seven letters. Notice that ب ت ث differ only by the number and position of dots.",
        },
        {
          id: 3,
          arabic: "دَ / دَالٌ — ذَ / ذَالٌ — رَ / رَاءٌ — زَ / زَايٌ — سَ / سِينٌ — شَ / شِينٌ — صَ / صَادٌ — ضَ / ضَادٌ",
          translation: "Dāl — Dhāl — Rāʾ — Zāy — Sīn — Shīn — Ṣād — Ḍād",
          transliteration: "d — dh — r — z — s — sh — ṣ — ḍ",
          note: "ص and ض are emphatic (heavy) letters. They give a deeper, fuller sound. Arabic is the only language in the world with the ض sound.",
        },
        {
          id: 4,
          arabic: "طَ / طَاءٌ — ظَ / ظَاءٌ — عَ / عَيْنٌ — غَ / غَيْنٌ — فَ / فَاءٌ — قَ / قَافٌ — كَ / كَافٌ — لَ / لَامٌ",
          translation: "Ṭāʾ — Ẓāʾ — ʿAyn — Ghayn — Fāʾ — Qāf — Kāf — Lām",
          transliteration: "ṭ — ẓ — ʿ — gh — f — q — k — l",
          note: "ع (ʿAyn) is unique to Arabic — a voiced pharyngeal fricative. Practice constricting the throat slightly while making a vowel sound.",
        },
        {
          id: 5,
          arabic: "مَ / مِيمٌ — نَ / نُونٌ — هَ / هَاءٌ — وَ / وَاوٌ — يَ / يَاءٌ",
          translation: "Mīm — Nūn — Hāʾ — Wāw — Yāʾ",
          transliteration: "m — n — h — w — y",
          note: "وَاو and يَاء serve double duty: they are both consonants (w, y) AND long vowels (ū/ō and ī/ē). Context determines which role they play.",
        },
      ],
      vocabulary: [
        { arabic: "حَرْف", transliteration: "ḥarf", english: "letter", pos: "noun (m)", plural: "حُرُوف" },
        { arabic: "كَلِمَة", transliteration: "kalimah", english: "word", pos: "noun (f)", plural: "كَلِمَات" },
        { arabic: "جُمْلَة", transliteration: "jumlah", english: "sentence", pos: "noun (f)", plural: "جُمَل" },
        { arabic: "صَوْت", transliteration: "ṣawt", english: "sound / voice", pos: "noun (m)", plural: "أَصْوَات" },
        { arabic: "فَتْحَة", transliteration: "fatḥah", english: "short 'a' vowel (ـَ)", pos: "noun (f)" },
        { arabic: "ضَمَّة", transliteration: "ḍammah", english: "short 'u' vowel (ـُ)", pos: "noun (f)" },
        { arabic: "كَسْرَة", transliteration: "kasrah", english: "short 'i' vowel (ـِ)", pos: "noun (f)" },
        { arabic: "سُكُون", transliteration: "sukūn", english: "no-vowel marker (ـْ)", pos: "noun (m)" },
        { arabic: "شَدَّة", transliteration: "shaddah", english: "doubling marker (ـّ)", pos: "noun (f)" },
        { arabic: "مَدّ", transliteration: "madd", english: "lengthening", pos: "noun (m)" },
      ],
      grammar: {
        title: "Arabic Short Vowels (الحَرَكَات)",
        titleArabic: "الحَرَكَات",
        explanation: "Arabic has three short vowels (حَرَكَات) written as small marks above or below letters:\n\n• فَتْحَة (ـَ): a short 'a' sound. Example: كَتَبَ (kataba — he wrote)\n• ضَمَّة (ـُ): a short 'u' sound. Example: يَكْتُبُ (yaktubu — he writes)\n• كَسْرَة (ـِ): a short 'i' sound. Example: بِسْمِ (bismi — in the name of)\n\nAnd two special marks:\n• سُكُون (ـْ): shows NO vowel follows. Example: يَكْتُبْ\n• شَدَّة (ـّ): doubles the letter. Example: مُحَمَّد = Muḥammad",
        examples: [
          { arabic: "بَيْتٌ — بُيُوتٌ", translation: "house — houses (fatḥah on ب, ḍammah on ب in plural)" },
          { arabic: "كَتَبَ — كِتَابٌ", translation: "he wrote — book (same root ك-ت-ب, different patterns)" },
          { arabic: "مُسْلِمٌ", translation: "Muslim (ḍammah-sukūn-kasrah pattern)" },
          { arabic: "اللهُ أَكْبَرُ", translation: "Allah is the greatest (note vowel marks throughout)" },
        ],
      },
      exercises: [
        {
          type: "choose",
          instruction: "Identify the vowel mark on the underlined letter.",
          instructionArabic: "حَدِّدِ الحَرَكَةَ عَلَى الحَرْفِ المُسَطَّرِ.",
          items: [
            { question: "The vowel in بَيْت (bayt)", options: ["fatḥah (ـَ)", "ḍammah (ـُ)", "kasrah (ـِ)", "sukūn (ـْ)"], answer: 0 },
            { question: "The vowel in مِنْ (min — from)", options: ["fatḥah (ـَ)", "ḍammah (ـُ)", "kasrah (ـِ)", "sukūn (ـْ)"], answer: 2 },
            { question: "The mark on مُسْلِم (muslim)", options: ["fatḥah on م", "ḍammah on م", "kasrah on م", "shaddah on م"], answer: 1 },
          ],
          answers: [0, 2, 1],
        },
        {
          type: "translate",
          instruction: "Read and transliterate these Arabic words.",
          instructionArabic: "اِقْرَأْ هَذِهِ الكَلِمَات وَاكْتُبْ نُطْقَهَا بِالحُرُوفِ اللَّاتِينِيَّة.",
          items: [
            { english: "كِتَابٌ (a book)" },
            { english: "بَيْتٌ (a house)" },
            { english: "قَلَمٌ (a pen)" },
            { english: "وَلَدٌ (a boy)" },
          ],
          answers: ["kitābun", "baytun", "qalamun", "waladun"],
        },
        {
          type: "match",
          instruction: "Match each letter to its name.",
          instructionArabic: "طَابِقْ بَيْنَ الحَرْفِ وَاسْمِه.",
          items: [
            { arabic: "ع", english: "ʿAyn" },
            { arabic: "ق", english: "Qāf" },
            { arabic: "ش", english: "Shīn" },
            { arabic: "غ", english: "Ghayn" },
          ],
          answers: [0, 1, 2, 3],
        },
      ],
      culturalNote: "Arabic is the language of the Quran and holds a special place in Islamic civilization. It has been preserved virtually unchanged for 1,400 years through the Quran. Arabic gave hundreds of words to other languages — including English: algebra (الجَبْر), algorithm (from al-Khwārizmī), sugar (سُكَّر), and coffee (قَهْوَة).",
    },

    {
      bookId: "arabic-bayna-yadayk-1", lessonNum: 3,
      title: "Numbers 1–10",
      titleArabic: "الأَرْقَامُ مِنْ وَاحِدٍ إِلَى عَشَرَة",
      description: "Learn to count from one to ten in Arabic and use numbers in simple sentences.",
      pages: [
        {
          id: 1,
          arabic: "وَاحِدٌ — اثْنَانِ — ثَلَاثَةٌ — أَرْبَعَةٌ — خَمْسَةٌ",
          translation: "One — Two — Three — Four — Five",
          transliteration: "Wāḥidun — ithNāni — thalāthatun — arbaʿatun — khamsatun",
          note: "These are the 'feminine' number forms, used with masculine nouns. Arabic numbers have a grammatical gender that is the OPPOSITE of the noun they count!",
        },
        {
          id: 2,
          arabic: "سِتَّةٌ — سَبْعَةٌ — ثَمَانِيَةٌ — تِسْعَةٌ — عَشَرَةٌ",
          translation: "Six — Seven — Eight — Nine — Ten",
          transliteration: "Sittatun — sabʿatun — thamāniyatun — tisʿatun — ʿasharatun",
          note: "Numbers 3-10 take تَاء مَرْبُوطَة (ة) when used with masculine nouns and drop it with feminine nouns.",
        },
        {
          id: 3,
          arabic: "كَمْ عَدَدُ الطُّلَّابِ؟ فِي الفَصْلِ خَمْسَةُ طُلَّابٍ وَثَلَاثُ طَالِبَاتٍ.",
          translation: "How many students are there? In the class there are five male students and three female students.",
          transliteration: "Kam ʿadadu ṭ-ṭullāb? Fī l-faṣli khamsatu ṭullābin wa thalāthu ṭālibāt.",
          note: "Note: خَمْسَة (5) is used with طُلَّاب (m), but تَلَاثُ (3, without ة) is used with طَالِبَات (f). This is the famous 'polarity rule'.",
        },
        {
          id: 4,
          arabic: "عِنْدِي كِتَابٌ وَاحِدٌ. — عِنْدِي كِتَابَانِ. — عِنْدِي ثَلَاثَةُ كُتُبٍ.",
          translation: "I have one book. — I have two books. — I have three books.",
          transliteration: "ʿIndī kitābun wāḥidun. — ʿIndī kitābāni. — ʿIndī thalāthatu kutubin.",
          note: "For 1: the number follows the noun. For 2: use the dual form (كِتَابَانِ), no number word needed. For 3+: use the number before the noun in plural form.",
        },
      ],
      vocabulary: [
        { arabic: "وَاحِدٌ", transliteration: "wāḥidun", english: "one", pos: "number" },
        { arabic: "اثْنَانِ", transliteration: "ithnāni", english: "two", pos: "number" },
        { arabic: "ثَلَاثَة", transliteration: "thalāthah", english: "three", pos: "number" },
        { arabic: "أَرْبَعَة", transliteration: "arbaʿah", english: "four", pos: "number" },
        { arabic: "خَمْسَة", transliteration: "khamsah", english: "five", pos: "number" },
        { arabic: "سِتَّة", transliteration: "sittah", english: "six", pos: "number" },
        { arabic: "سَبْعَة", transliteration: "sabʿah", english: "seven", pos: "number" },
        { arabic: "ثَمَانِيَة", transliteration: "thamāniyah", english: "eight", pos: "number" },
        { arabic: "تِسْعَة", transliteration: "tisʿah", english: "nine", pos: "number" },
        { arabic: "عَشَرَة", transliteration: "ʿasharah", english: "ten", pos: "number" },
        { arabic: "كَمْ", transliteration: "kam", english: "how many / how much", pos: "interrogative" },
        { arabic: "عَدَد", transliteration: "ʿadad", english: "number", pos: "noun (m)", plural: "أَعْدَاد" },
      ],
      grammar: {
        title: "Numbers and Gender Polarity (المُعَاكَسَة في الأَعْدَاد)",
        titleArabic: "المُعَاكَسَة في الأَعْدَاد",
        explanation: "Arabic numbers 3-10 follow a unique rule: the NUMBER has the OPPOSITE gender of the NOUN it counts.\n\n• If the noun is MASCULINE → use the number with ة (feminine form)\n  Example: ثَلَاثَةُ رِجَالٍ (three men) — رِجَال is masculine, so ثَلَاثَة (with ة)\n\n• If the noun is FEMININE → use the number WITHOUT ة (masculine form)\n  Example: ثَلَاثُ نِسَاءٍ (three women) — نِسَاء is feminine, so ثَلَاثُ (without ة)\n\nThis rule applies ONLY to numbers 3-10. Numbers 1-2 agree with the noun's gender.",
        examples: [
          { arabic: "خَمْسَةُ أَقْلَامٍ", translation: "five pens (قَلَم is masculine → use خَمْسَة with ة)" },
          { arabic: "خَمْسُ طَاوِلَاتٍ", translation: "five tables (طَاوِلَة is feminine → use خَمْسُ without ة)" },
          { arabic: "سَبْعَةُ أَيَّامٍ", translation: "seven days (يَوْم is masculine → use سَبْعَة with ة)" },
          { arabic: "ثَلَاثُ سَاعَاتٍ", translation: "three hours (سَاعَة is feminine → use ثَلَاثُ without ة)" },
        ],
      },
      exercises: [
        {
          type: "fill_blank",
          instruction: "Choose the correct number form.",
          instructionArabic: "اِخْتَرِ الصِّيغَةَ الصَّحِيحَة لِلعَدَد.",
          items: [
            { sentence: "___ كُتُبٍ (3 books — كِتَاب is masculine)", blank: 1, hint: "3" },
            { sentence: "___ بَنَاتٍ (4 girls — بِنْت is feminine)", blank: 1, hint: "4" },
            { sentence: "___ مَدَارِسَ (6 schools — مَدْرَسَة is feminine)", blank: 1, hint: "6" },
            { sentence: "___ طُلَّابٍ (7 students — طَالِب is masculine)", blank: 1, hint: "7" },
          ],
          answers: ["ثَلَاثَة", "أَرْبَع", "سِتّ", "سَبْعَة"],
        },
        {
          type: "choose",
          instruction: "How do you say 'five books' in Arabic?",
          instructionArabic: "كَيْفَ تَقُولُ 'five books' بِالعَرَبِيَّة؟",
          items: [
            { question: "Five books (كِتَاب — masculine)", options: ["خَمْسُ كُتُبٍ", "خَمْسَةُ كُتُبٍ", "خَمْسَةُ كِتَابٍ", "خَمْسُ كِتَابٍ"], answer: 1 },
            { question: "Three women (امْرَأَة — feminine)", options: ["ثَلَاثَةُ نِسَاءٍ", "ثَلَاثُ نِسَاءٍ", "ثَلَاثُ امْرَأَةٍ", "ثَلَاثَةُ امْرَأَةٍ"], answer: 1 },
          ],
          answers: [1, 1],
        },
        {
          type: "translate",
          instruction: "Translate into Arabic.",
          instructionArabic: "تَرْجِمْ إِلَى العَرَبِيَّة.",
          items: [
            { english: "How many books?" },
            { english: "I have seven pens." },
            { english: "In the class: ten students." },
          ],
          answers: ["كَمْ كِتَابًا؟", "عِنْدِي سَبْعَةُ أَقْلَامٍ.", "فِي الفَصْلِ عَشَرَةُ طُلَّابٍ."],
        },
      ],
    },

    {
      bookId: "arabic-bayna-yadayk-1", lessonNum: 4,
      title: "Personal Pronouns",
      titleArabic: "الضَّمَائِر الشَّخْصِيَّة",
      description: "Learn Arabic personal pronouns for I, you, he, she, we, and they.",
      pages: [
        {
          id: 1,
          arabic: "أَنَا — نَحْنُ\nأَنْتَ — أَنْتِ — أَنْتُمَا\nأَنْتُمْ — أَنْتُنَّ",
          translation: "I — We\nYou (m.sg.) — You (f.sg.) — You (dual)\nYou (m.pl.) — You (f.pl.)",
          transliteration: "Anā — Naḥnu\nAnta — Anti — Antumā\nAntum — Antunna",
          note: "Arabic distinguishes gender in the 2nd and 3rd person (you/he/she/they). It also has a DUAL form for exactly two people/things.",
        },
        {
          id: 2,
          arabic: "هُوَ — هِيَ — هُمَا\nهُمْ — هُنَّ",
          translation: "He — She — They (dual, m+f)\nThey (m.pl.) — They (f.pl.)",
          transliteration: "Huwa — Hiya — Humā\nHum — Hunna",
          note: "In Arabic, a mixed group of males and females is referred to with the masculine plural هُمْ. The feminine plural هُنَّ is only for an exclusively female group.",
        },
        {
          id: 3,
          arabic: "أَنَا طَالِبٌ مِنَ الصُّومَالِ.\nأَنْتَ طَالِبٌ مِنْ أَيْنَ؟\nهُوَ أُسْتَاذٌ مِنَ السُّعُودِيَّة.",
          translation: "I am a student from Somalia.\nWhere are you from?\nHe is a professor from Saudi Arabia.",
          transliteration: "Anā ṭālibun min aṣ-Ṣūmāl.\nAnta ṭālibun min ayna?\nHuwa ustādhun min as-Suʿūdiyyah.",
          note: "Pronouns are essential for forming simple nominal sentences. The pronoun (ضَمِير) is the subject (مُبْتَدَأ).",
        },
        {
          id: 4,
          arabic: "هِيَ مُدَرِّسَةٌ. — هُمْ طُلَّابٌ. — نَحْنُ مُسْلِمُون.",
          translation: "She is a teacher. — They are students. — We are Muslims.",
          transliteration: "Hiya mudarrisatun. — Hum ṭullābun. — Naḥnu muslimūna.",
          note: "Notice مُسْلِمُون (sound masculine plural) ends in -ūna. This is the nominative form. In other cases it becomes مُسْلِمِين.",
        },
      ],
      vocabulary: [
        { arabic: "أَنَا", transliteration: "anā", english: "I", pos: "pronoun" },
        { arabic: "أَنْتَ", transliteration: "anta", english: "you (m.sg.)", pos: "pronoun" },
        { arabic: "أَنْتِ", transliteration: "anti", english: "you (f.sg.)", pos: "pronoun" },
        { arabic: "هُوَ", transliteration: "huwa", english: "he / it (m.)", pos: "pronoun" },
        { arabic: "هِيَ", transliteration: "hiya", english: "she / it (f.)", pos: "pronoun" },
        { arabic: "نَحْنُ", transliteration: "naḥnu", english: "we", pos: "pronoun" },
        { arabic: "هُمْ", transliteration: "hum", english: "they (m.pl.)", pos: "pronoun" },
        { arabic: "هُنَّ", transliteration: "hunna", english: "they (f.pl.)", pos: "pronoun" },
        { arabic: "طَالِب", transliteration: "ṭālib", english: "student (m.)", pos: "noun (m)", plural: "طُلَّاب" },
        { arabic: "طَالِبَة", transliteration: "ṭālibah", english: "student (f.)", pos: "noun (f)", plural: "طَالِبَات" },
        { arabic: "أُسْتَاذ", transliteration: "ustādh", english: "professor / teacher (m.)", pos: "noun (m)", plural: "أَسَاتِذَة" },
        { arabic: "مِنْ أَيْنَ", transliteration: "min ayna", english: "from where?", pos: "interrogative phrase" },
      ],
      grammar: {
        title: "Detached Personal Pronouns (الضَّمَائِر المُنْفَصِلَة)",
        titleArabic: "الضَّمَائِر المُنْفَصِلَة",
        explanation: "Arabic has two sets of pronouns: detached (standalone) and attached (suffixes). This lesson covers DETACHED pronouns.\n\nIn nominal sentences, the detached pronoun usually functions as the subject (مُبْتَدَأ).\n\nArabic has 12 pronoun forms (compare to English's 7):\n• Singular: أَنَا، أَنْتَ، أَنْتِ، هُوَ، هِيَ (5)\n• Dual: أَنْتُمَا، هُمَا (2)\n• Plural: نَحْنُ، أَنْتُمْ، أَنْتُنَّ، هُمْ، هُنَّ (5)\n\nKey feature: Arabic pronouns specify GENDER and NUMBER for 2nd and 3rd persons.",
        examples: [
          { arabic: "أَنَا طَالِبٌ.", translation: "I am a student. (m)" },
          { arabic: "أَنَا طَالِبَةٌ.", translation: "I am a student. (f) — same pronoun, different predicate!" },
          { arabic: "هُمَا طَالِبَانِ.", translation: "The two of them are students." },
          { arabic: "نَحْنُ أَصْدِقَاءٌ.", translation: "We are friends." },
        ],
      },
      exercises: [
        {
          type: "choose",
          instruction: "Choose the correct pronoun.",
          instructionArabic: "اِخْتَرِ الضَّمِيرَ الصَّحِيح.",
          items: [
            { question: "You are (addressing one male)", options: ["أَنَا", "أَنْتَ", "أَنْتِ", "هُوَ"], answer: 1 },
            { question: "She is a teacher", options: ["هُوَ مُعَلِّمٌ", "هِيَ مُعَلِّمَةٌ", "أَنْتِ مُعَلِّمَةٌ", "نَحْنُ مُعَلِّمُون"], answer: 1 },
            { question: "We are students", options: ["هُمْ طُلَّابٌ", "أَنْتُمْ طُلَّابٌ", "نَحْنُ طُلَّابٌ", "هِيَ طَالِبَةٌ"], answer: 2 },
          ],
          answers: [1, 1, 2],
        },
        {
          type: "translate",
          instruction: "Translate these sentences into Arabic.",
          instructionArabic: "تَرْجِمْ هَذِهِ الجُمَلَ إِلَى العَرَبِيَّة.",
          items: [
            { english: "He is a doctor." },
            { english: "She is from Egypt." },
            { english: "We are Muslims." },
            { english: "They (m) are students from Somalia." },
          ],
          answers: ["هُوَ طَبِيبٌ.", "هِيَ مِنْ مِصْر.", "نَحْنُ مُسْلِمُون.", "هُمْ طُلَّابٌ مِنَ الصُّومَال."],
        },
        {
          type: "fill_blank",
          instruction: "Fill in with the correct pronoun.",
          instructionArabic: "أَكْمِلْ بِالضَّمِيرِ المُنَاسِب.",
          items: [
            { sentence: "___ مُهَنْدِسَةٌ. (She is an engineer)", blank: 1, hint: "she" },
            { sentence: "___ طُلَّابٌ. (They [m] are students)", blank: 1, hint: "they (m)" },
            { sentence: "مِنْ أَيْنَ ___؟ (Where are you from? [to female])", blank: 1, hint: "you (f)" },
          ],
          answers: ["هِيَ", "هُمْ", "أَنْتِ"],
        },
      ],
    },

    {
      bookId: "arabic-bayna-yadayk-1", lessonNum: 5,
      title: "The Definite Article & Noun Gender",
      titleArabic: "أَلْ التَّعْرِيفِ وَالجِنْس",
      description: "Learn how to make nouns definite with أَلْ and how Arabic gender works.",
      pages: [
        {
          id: 1,
          arabic: "كِتَابٌ — اَلكِتَابُ\nبَيْتٌ — اَلبَيْتُ\nطَالِبٌ — اَلطَّالِبُ",
          translation: "a book — THE book\na house — THE house\na student — THE student",
          transliteration: "Kitābun — al-kitābu\nBaytun — al-baytu\nṬālibun — aṭ-ṭālibu",
          note: "Adding أَلْ (al-) makes a noun DEFINITE. When أَلْ is added, the tanwīn (ـٌ ـٍ ـً) disappears. Notice: اَلطَّالِبُ — the ل assimilates to ط (sun letter)!",
        },
        {
          id: 2,
          arabic: "الحُرُوفُ القَمَرِيَّة: أ ب ج ح خ ع غ ف ق ك م و ه ي\nمِثَال: اَلبَيْتُ، اَلقَلَمُ، اَلكِتَابُ",
          translation: "Moon letters: ʾ b j ḥ kh ʿ gh f q k m w h y\nExamples: the house, the pen, the book",
          transliteration: "Al-ḥurūf al-qamariyyah\nAl-baytu, al-qalamu, al-kitābu",
          note: "With MOON letters (القَمَرِيَّة), أَلْ is pronounced fully: al-. These are called moon letters because القَمَر (the moon) itself is a moon letter.",
        },
        {
          id: 3,
          arabic: "الحُرُوفُ الشَّمْسِيَّة: ت ث د ذ ر ز س ش ص ض ط ظ ل ن\nمِثَال: اَلطَّالِبُ، اَلشَّمْسُ، اَلنُّورُ",
          translation: "Sun letters: t th d dh r z s sh ṣ ḍ ṭ ẓ l n\nExamples: the student, the sun, the light",
          transliteration: "Al-ḥurūf ash-shamsiyyah\nAṭ-ṭālibu, ash-shamsu, an-nūru",
          note: "With SUN letters (الشَّمْسِيَّة), the ل of أَلْ assimilates to (doubles) the sun letter. اَلشَّمْس → ash-shams (not al-shams). الشمس (the sun) is a sun letter — that's where the name comes from!",
        },
        {
          id: 4,
          arabic: "المُذَكَّر: كِتَابٌ، قَلَمٌ، بَابٌ، وَلَدٌ، رَجُلٌ\nالمُؤَنَّث: طَاوِلَةٌ، غُرْفَةٌ، شَجَرَةٌ، بِنْتٌ، امْرَأَةٌ",
          translation: "Masculine: book, pen, door, boy, man\nFeminine: table, room, tree, girl, woman",
          transliteration: "Al-mudhakar: kitāb, qalam, bāb, walad, rajul\nAl-muʾannatth: ṭāwilah, ghurfah, shajarah, bint, imraʾah",
          note: "Most feminine nouns end in تَاء مَرْبُوطَة (ة). But some are feminine by nature without ة: بِنْت (girl), امْرَأَة (woman), أُمّ (mother), أَرْض (earth), سَمَاء (sky).",
        },
      ],
      vocabulary: [
        { arabic: "أَلْ", transliteration: "al-", english: "the (definite article)", pos: "particle" },
        { arabic: "مُعَرَّف", transliteration: "muʿarraf", english: "definite", pos: "adjective" },
        { arabic: "نَكِرَة", transliteration: "nakirah", english: "indefinite", pos: "noun (f)" },
        { arabic: "مُذَكَّر", transliteration: "mudhakar", english: "masculine", pos: "noun (m)" },
        { arabic: "مُؤَنَّث", transliteration: "muʾannath", english: "feminine", pos: "noun (m)" },
        { arabic: "شَمْسِيّ", transliteration: "shamsī", english: "solar (sun letter)", pos: "adjective" },
        { arabic: "قَمَرِيّ", transliteration: "qamarī", english: "lunar (moon letter)", pos: "adjective" },
        { arabic: "بَاب", transliteration: "bāb", english: "door", pos: "noun (m)", plural: "أَبْوَاب" },
        { arabic: "غُرْفَة", transliteration: "ghurfah", english: "room", pos: "noun (f)", plural: "غُرَف" },
        { arabic: "شَجَرَة", transliteration: "shajarah", english: "tree", pos: "noun (f)", plural: "أَشْجَار" },
      ],
      grammar: {
        title: "Sun & Moon Letters (الشَّمْسِيَّة وَالقَمَرِيَّة)",
        titleArabic: "الشَّمْسِيَّة وَالقَمَرِيَّة",
        explanation: "When أَلْ (the) is added to a word, the pronunciation of ل depends on the first letter of the word:\n\n• MOON letters (القَمَرِيَّة — 14 letters): أ ب ج ح خ ع غف ق ك م و ه ي\n  → The ل is pronounced: al-kitāb (اَلكِتَاب)\n\n• SUN letters (الشَّمْسِيَّة — 14 letters): ت ث د ذ ر ز س ش ص ض ط ظ ل ن\n  → The ل disappears and the sun letter doubles: ash-shams (اَلشَّمْس) = NOT al-shams\n\nMemory tip: The 14 sun letters spell: تَاثَ دَذَ رَز سَشَ صَضَ طَظَ لَنُ",
        examples: [
          { arabic: "اَلكِتَابُ (al-kitābu)", translation: "the book — ك is a moon letter, ل is clear" },
          { arabic: "اَلشَّمْسُ (ash-shamsu)", translation: "the sun — ش is a sun letter, ل assimilates" },
          { arabic: "اَلرَّجُلُ (ar-rajulu)", translation: "the man — ر is a sun letter" },
          { arabic: "اَلقَمَرُ (al-qamaru)", translation: "the moon — ق is a moon letter" },
        ],
      },
      exercises: [
        {
          type: "choose",
          instruction: "How is أَلْ pronounced with this word?",
          instructionArabic: "كَيْفَ تُنْطَقُ أَلْ مَعَ هَذِهِ الكَلِمَة؟",
          items: [
            { question: "اَلنُّور (the light) — ن is a...", options: ["moon letter — say al-nūr", "sun letter — say an-nūr"], answer: 1 },
            { question: "اَلبَيْت (the house) — ب is a...", options: ["moon letter — say al-bayt", "sun letter — say ab-bayt"], answer: 0 },
            { question: "اَلصَّلَاة (the prayer) — ص is a...", options: ["moon letter — say al-ṣalāh", "sun letter — say aṣ-ṣalāh"], answer: 1 },
          ],
          answers: [1, 0, 1],
        },
        {
          type: "translate",
          instruction: "Add أَلْ and write the definite form.",
          instructionArabic: "أَضِفْ أَلْ وَاكْتُبِ الصِّيغَةَ المَعْرِفَة.",
          items: [
            { english: "a teacher (مُعَلِّم) → the teacher" },
            { english: "a book (كِتَاب) → the book" },
            { english: "a student f. (طَالِبَة) → the student" },
            { english: "a sun (شَمْس) → the sun" },
          ],
          answers: ["اَلمُعَلِّمُ", "اَلكِتَابُ", "اَلطَّالِبَةُ", "اَلشَّمْسُ"],
        },
        {
          type: "match",
          instruction: "Match each noun to its gender.",
          instructionArabic: "طَابِقْ كُلَّ اسْمٍ مَعَ جِنْسِه.",
          items: [
            { arabic: "كِتَابٌ (book)", english: "Masculine" },
            { arabic: "غُرْفَةٌ (room)", english: "Feminine" },
            { arabic: "بَابٌ (door)", english: "Masculine" },
            { arabic: "شَجَرَةٌ (tree)", english: "Feminine" },
          ],
          answers: [0, 1, 0, 1],
        },
      ],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // دُرُوسُ اللُّغَةِ العَرَبِيَّة — Madinah Arabic Book 1
  // ══════════════════════════════════════════════════════════════════════════
  "madinah-arabic-1": [
    {
      bookId: "madinah-arabic-1", lessonNum: 1,
      title: "This and That — هَذَا وَذَلِكَ",
      titleArabic: "الدَّرْسُ الأَوَّل: هَذَا وَذَلِكَ",
      description: "Learn the Arabic demonstrative pronouns for 'this' and 'that' with common masculine nouns.",
      pages: [
        {
          id: 1,
          arabic: "هَذَا كِتَابٌ.\nهَذَا قَلَمٌ.\nهَذَا مِفْتَاحٌ.",
          translation: "This is a book.\nThis is a pen.\nThis is a key.",
          transliteration: "Hādhā kitābun.\nHādhā qalamun.\nHādhā miftāḥun.",
          note: "هَذَا (hādhā) means 'this' and is used for MASCULINE nouns. There is no verb 'is' — it is implied in Arabic.",
        },
        {
          id: 2,
          arabic: "مَا هَذَا؟\nهَذَا بَابٌ.\nهَذَا كُرْسِيٌّ.\nهَذَا سَرِيرٌ.",
          translation: "What is this?\nThis is a door.\nThis is a chair.\nThis is a bed.",
          transliteration: "Mā hādhā?\nHādhā bābun.\nHādhā kursiyyun.\nHādhā sarīrun.",
          note: "مَا (mā) means 'what' in questions about things. In speech: 'Mā hādhā?' (What is this?). The answer pattern: هَذَا + [noun] + ٌ (tanwīn).",
        },
        {
          id: 3,
          arabic: "ذَلِكَ كِتَابٌ.\nذَلِكَ بَيْتٌ كَبِيرٌ.\nذَلِكَ مَسْجِدٌ.",
          translation: "That is a book.\nThat is a big house.\nThat is a mosque.",
          transliteration: "Dhālika kitābun.\nDhālika baytun kabīrun.\nDhālika masjidun.",
          note: "ذَلِكَ (dhālika) means 'that' for masculine nouns at a distance. Note: the adjective كَبِيرٌ (big) agrees with the noun in gender, number, and definiteness.",
        },
        {
          id: 4,
          arabic: "هَذَا مُحَمَّدٌ. هُوَ طَالِبٌ.\nذَلِكَ أَحْمَدُ. هُوَ مُعَلِّمٌ.",
          translation: "This is Muhammad. He is a student.\nThat is Ahmad. He is a teacher.",
          transliteration: "Hādhā Muḥammadun. Huwa ṭālibun.\nDhālika Aḥmadu. Huwa muʿallimun.",
          note: "هَذَا and ذَلِكَ can introduce people too. After introducing with the demonstrative, هُوَ (he) continues the description.",
        },
      ],
      vocabulary: [
        { arabic: "هَذَا", transliteration: "hādhā", english: "this (m.)", pos: "demonstrative pronoun" },
        { arabic: "هَذِهِ", transliteration: "hādhihi", english: "this (f.)", pos: "demonstrative pronoun" },
        { arabic: "ذَلِكَ", transliteration: "dhālika", english: "that (m.)", pos: "demonstrative pronoun" },
        { arabic: "تِلْكَ", transliteration: "tilka", english: "that (f.)", pos: "demonstrative pronoun" },
        { arabic: "مَا", transliteration: "mā", english: "what (for things)", pos: "interrogative" },
        { arabic: "مَنْ", transliteration: "man", english: "who (for people)", pos: "interrogative" },
        { arabic: "قَلَم", transliteration: "qalam", english: "pen", pos: "noun (m)", plural: "أَقْلَام" },
        { arabic: "مِفْتَاح", transliteration: "miftāḥ", english: "key", pos: "noun (m)", plural: "مَفَاتِيح" },
        { arabic: "كُرْسِيّ", transliteration: "kursī", english: "chair", pos: "noun (m)", plural: "كَرَاسِي" },
        { arabic: "بَيْت", transliteration: "bayt", english: "house", pos: "noun (m)", plural: "بُيُوت" },
        { arabic: "مَسْجِد", transliteration: "masjid", english: "mosque", pos: "noun (m)", plural: "مَسَاجِد" },
        { arabic: "كَبِير", transliteration: "kabīr", english: "big / large", pos: "adjective", plural: "كِبَار" },
      ],
      grammar: {
        title: "The Equational Sentence with Demonstratives",
        titleArabic: "الجُمْلَة الاسْمِيَّة مَعَ أَسْمَاءِ الإِشَارَة",
        explanation: "The key sentence structure in this lesson is:\n\nهَذَا / ذَلِكَ + Indefinite Noun (ـٌ)\n\nRules:\n1. No verb needed — 'is' is understood\n2. The noun is INDEFINITE (has tanwīn ـٌ), NOT اَل\n3. هَذَا for masculine things NEARBY\n4. ذَلِكَ for masculine things FAR AWAY\n5. هَذِهِ and تِلْكَ for feminine nouns (next lesson)\n\nPattern: هَذَا + noun + ٌ = 'This is a [noun]'",
        examples: [
          { arabic: "هَذَا قَلَمٌ.", translation: "This is a pen. (NOT: هَذَا اَلقَلَمُ)" },
          { arabic: "ذَلِكَ مَسْجِدٌ كَبِيرٌ.", translation: "That is a big mosque." },
          { arabic: "مَا هَذَا؟ هَذَا كِتَابٌ.", translation: "What is this? This is a book." },
          { arabic: "مَنْ هَذَا؟ هَذَا مُحَمَّدٌ.", translation: "Who is this? This is Muhammad." },
        ],
      },
      exercises: [
        {
          type: "fill_blank",
          instruction: "Fill in with هَذَا or ذَلِكَ.",
          instructionArabic: "أَكْمِلْ بِـ هَذَا أَوْ ذَلِكَ.",
          items: [
            { sentence: "___ كِتَابٌ. (near)", blank: 1, hint: "this (near)" },
            { sentence: "___ بَيْتٌ كَبِيرٌ. (far)", blank: 1, hint: "that (far)" },
            { sentence: "___ قَلَمٌ. (near)", blank: 1, hint: "this (near)" },
            { sentence: "___ مَسْجِدٌ. (far)", blank: 1, hint: "that (far)" },
          ],
          answers: ["هَذَا", "ذَلِكَ", "هَذَا", "ذَلِكَ"],
        },
        {
          type: "translate",
          instruction: "Translate into Arabic.",
          instructionArabic: "تَرْجِمْ إِلَى العَرَبِيَّة.",
          items: [
            { english: "What is this?" },
            { english: "This is a mosque." },
            { english: "That is a big house." },
            { english: "Who is this? This is Ahmad." },
          ],
          answers: ["مَا هَذَا؟", "هَذَا مَسْجِدٌ.", "ذَلِكَ بَيْتٌ كَبِيرٌ.", "مَنْ هَذَا؟ هَذَا أَحْمَدُ."],
        },
        {
          type: "choose",
          instruction: "Choose the correct demonstrative.",
          instructionArabic: "اِخْتَرِ اسْمَ الإِشَارَةِ الصَّحِيح.",
          items: [
            { question: "Pointing at a book right in front of you:", options: ["هَذَا كِتَابٌ", "ذَلِكَ كِتَابٌ", "هَذِهِ كِتَابٌ"], answer: 0 },
            { question: "Pointing at a mosque far away:", options: ["هَذَا مَسْجِدٌ", "ذَلِكَ مَسْجِدٌ", "تِلْكَ مَسْجِدٌ"], answer: 1 },
          ],
          answers: [0, 1],
        },
      ],
      culturalNote: "The Madinah Arabic course was developed by Dr. V. Abdur Rahim at the Islamic University of Madinah and is used to teach Arabic to Muslim students from around the world. It uses the direct method — teaching Arabic through Arabic — and builds from simple demonstrative sentences to complex classical Arabic.",
    },

    {
      bookId: "madinah-arabic-1", lessonNum: 2,
      title: "This and That — Feminine (هَذِهِ وَتِلْكَ)",
      titleArabic: "الدَّرْسُ الثَّانِي: هَذِهِ وَتِلْكَ",
      description: "Learn feminine demonstratives and understand how Arabic adjectives agree with nouns.",
      pages: [
        {
          id: 1,
          arabic: "هَذِهِ طَاوِلَةٌ.\nهَذِهِ سَبُّورَةٌ.\nهَذِهِ شَجَرَةٌ.",
          translation: "This is a table.\nThis is a blackboard.\nThis is a tree.",
          transliteration: "Hādhihi ṭāwilatun.\nHādhihi sabbūratun.\nHādhihi shajaratun.",
          note: "هَذِهِ (hādhihi) is the FEMININE form of هَذَا. It is used with feminine nouns, most of which end in ة.",
        },
        {
          id: 2,
          arabic: "مَا هَذِهِ؟\nهَذِهِ سَيَّارَةٌ جَدِيدَةٌ.\nتِلْكَ سَيَّارَةٌ قَدِيمَةٌ.",
          translation: "What is this?\nThis is a new car.\nThat is an old car.",
          transliteration: "Mā hādhihi?\nHādhihi sayyāratun jadīdatun.\nTilka sayyāratun qadīmatun.",
          note: "Adjectives must agree with the noun in GENDER. جَدِيد becomes جَدِيدَة with feminine nouns. قَدِيم becomes قَدِيمَة.",
        },
        {
          id: 3,
          arabic: "هَذِهِ مَدْرَسَةٌ كَبِيرَةٌ وَجَمِيلَةٌ.\nتِلْكَ غُرْفَةٌ صَغِيرَةٌ وَنَظِيفَةٌ.",
          translation: "This is a big and beautiful school.\nThat is a small and clean room.",
          transliteration: "Hādhihi madrasatun kabīratun wa jamīlatun.\nTilka ghurfatun ṣaghīratun wa naẓīfatun.",
          note: "Multiple adjectives simply follow one after another, each agreeing with the noun. وَ (and) connects them.",
        },
      ],
      vocabulary: [
        { arabic: "طَاوِلَة", transliteration: "ṭāwilah", english: "table", pos: "noun (f)", plural: "طَاوِلَات" },
        { arabic: "سَبُّورَة", transliteration: "sabbūrah", english: "blackboard", pos: "noun (f)", plural: "سَبُّورَات" },
        { arabic: "سَيَّارَة", transliteration: "sayyārah", english: "car", pos: "noun (f)", plural: "سَيَّارَات" },
        { arabic: "مَدْرَسَة", transliteration: "madrasah", english: "school", pos: "noun (f)", plural: "مَدَارِس" },
        { arabic: "غُرْفَة", transliteration: "ghurfah", english: "room", pos: "noun (f)", plural: "غُرَف" },
        { arabic: "جَدِيد", transliteration: "jadīd", english: "new", pos: "adjective (m)" },
        { arabic: "جَدِيدَة", transliteration: "jadīdah", english: "new (f.)", pos: "adjective (f)" },
        { arabic: "قَدِيم", transliteration: "qadīm", english: "old", pos: "adjective (m)" },
        { arabic: "كَبِير / كَبِيرَة", transliteration: "kabīr / kabīrah", english: "big", pos: "adjective (m/f)" },
        { arabic: "صَغِير / صَغِيرَة", transliteration: "ṣaghīr / ṣaghīrah", english: "small", pos: "adjective (m/f)" },
        { arabic: "جَمِيل / جَمِيلَة", transliteration: "jamīl / jamīlah", english: "beautiful", pos: "adjective (m/f)" },
        { arabic: "نَظِيف / نَظِيفَة", transliteration: "naẓīf / naẓīfah", english: "clean", pos: "adjective (m/f)" },
      ],
      grammar: {
        title: "Adjective Agreement (المُطَابَقَة في النَّعْت)",
        titleArabic: "المُطَابَقَة في النَّعْت",
        explanation: "In Arabic, an adjective (نَعْت) must agree with its noun in FOUR ways:\n1. Gender (جِنْس): masculine or feminine\n2. Number (عَدَد): singular, dual, or plural\n3. Definiteness (تَعْرِيف): definite (اَل) or indefinite (ـٌ)\n4. Case (إِعْرَاب): nominative, accusative, or genitive (advanced)\n\nFor now, focus on GENDER and DEFINITENESS:\n• Masculine noun → masculine adjective: كِتَابٌ كَبِيرٌ (a big book)\n• Feminine noun → feminine adjective: غُرْفَةٌ كَبِيرَةٌ (a big room)\n• To make an adjective feminine: add ة",
        examples: [
          { arabic: "بَيْتٌ كَبِيرٌ", translation: "a big house (m. noun + m. adjective)" },
          { arabic: "غُرْفَةٌ كَبِيرَةٌ", translation: "a big room (f. noun + f. adjective)" },
          { arabic: "سَيَّارَةٌ جَدِيدَةٌ جَمِيلَةٌ", translation: "a new, beautiful car" },
          { arabic: "اَلبَيْتُ الكَبِيرُ", translation: "the big house (both definite, both nominative)" },
        ],
      },
      exercises: [
        {
          type: "fill_blank",
          instruction: "Write the correct feminine form of the adjective.",
          instructionArabic: "اُكْتُبِ الصِّيغَةَ المُؤَنَّثَةَ الصَّحِيحَة لِلصِّفَة.",
          items: [
            { sentence: "هَذِهِ سَيَّارَةٌ ___ (new — feminine)", blank: 1, hint: "new (f)" },
            { sentence: "تِلْكَ غُرْفَةٌ ___ (small — feminine)", blank: 1, hint: "small (f)" },
            { sentence: "هَذِهِ مَدْرَسَةٌ ___ (beautiful — feminine)", blank: 1, hint: "beautiful (f)" },
          ],
          answers: ["جَدِيدَةٌ", "صَغِيرَةٌ", "جَمِيلَةٌ"],
        },
        {
          type: "translate",
          instruction: "Translate into Arabic.",
          instructionArabic: "تَرْجِمْ إِلَى العَرَبِيَّة.",
          items: [
            { english: "This is a new car." },
            { english: "That is a big school." },
            { english: "This is a small, clean room." },
          ],
          answers: ["هَذِهِ سَيَّارَةٌ جَدِيدَةٌ.", "تِلْكَ مَدْرَسَةٌ كَبِيرَةٌ.", "هَذِهِ غُرْفَةٌ صَغِيرَةٌ نَظِيفَةٌ."],
        },
        {
          type: "choose",
          instruction: "Choose the correct form.",
          instructionArabic: "اِخْتَرِ الصِّيغَةَ الصَّحِيحَة.",
          items: [
            { question: "How do you say 'a new school'?", options: ["مَدْرَسَةٌ جَدِيدٌ", "مَدْرَسَةٌ جَدِيدَةٌ", "مَدْرَسَةُ جَدِيدَةٌ"], answer: 1 },
            { question: "Which is correct for 'a big pen'?", options: ["قَلَمٌ كَبِيرَةٌ", "قَلَمٌ كَبِيرٌ", "قَلَمُ كَبِيرٌ"], answer: 1 },
          ],
          answers: [1, 1],
        },
      ],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // العربية للناشئين — Arabic for Young Learners (Level 1)
  // ══════════════════════════════════════════════════════════════════════════
  "arabic-nasheeen-1": [
    {
      bookId: "arabic-nasheeen-1", lessonNum: 1,
      title: "My Name & Where I'm From",
      titleArabic: "اسْمِي وَبَلَدِي",
      description: "Introduce yourself in Arabic — your name, nationality, and what you study.",
      pages: [
        {
          id: 1,
          arabic: "اِسْمِي عَلِيٌّ. أَنَا مِنَ الصُّومَال.\nأَنَا طَالِبٌ في مَعْهَدِ البَيَان.",
          translation: "My name is Ali. I am from Somalia.\nI am a student at Al-Bayaan Institute.",
          transliteration: "Ismī ʿAliyyun. Anā min aṣ-Ṣūmāl.\nAnā ṭālibun fī Maʿhad al-Bayān.",
          note: "اسْم (ism) = name. The possessive suffix ـِي (ī) means 'my'. So اسْمِي = 'my name'. This is called an attached pronoun (ضَمِير مُتَّصِل).",
        },
        {
          id: 2,
          arabic: "اسْمُكَ؟ — اسْمِي أَحْمَدُ.\nمِنْ أَيْنَ أَنْتَ؟ — أَنَا مِنَ اليَمَن.\nمَاذَا تَدْرُس؟ — أَدْرُسُ اللُّغَةَ العَرَبِيَّة.",
          translation: "What is your name? — My name is Ahmad.\nWhere are you from? — I am from Yemen.\nWhat do you study? — I study Arabic language.",
          transliteration: "Ismuka? — Ismī Aḥmadu.\nMin ayna anta? — Anā min al-Yaman.\nMādhā tadrus? — Adrusu l-lughat al-ʿarabiyyah.",
          note: "اسْمُكَ (your name) = اسم + كَ (attached pronoun 'your' for male). تَدْرُسُ (you study) and أَدْرُسُ (I study) are present tense verb forms.",
        },
        {
          id: 3,
          arabic: "أَنَا مِنَ الصُّومَال. جِنْسِيَّتِي صُومَالِيَّة.\nهُوَ مِنْ مِصْر. جِنْسِيَّتُهُ مِصْرِيَّة.\nهِيَ مِنَ المَغْرِب. جِنْسِيَّتُهَا مَغْرِبِيَّة.",
          translation: "I am from Somalia. My nationality is Somali.\nHe is from Egypt. His nationality is Egyptian.\nShe is from Morocco. Her nationality is Moroccan.",
          transliteration: "Anā min aṣ-Ṣūmāl. Jinsiyyatī ṣūmāliyyah.\nHuwa min Miṣr. Jinsiyyatuhu miṣriyyah.\nHiya min al-Maghrib. Jinsiyyatuhā maghribiyyah.",
          note: "Nationalities are adjectives (nisba adjectives — النِّسْبَة) formed by adding يّ (m.) or يَّة (f.) to the country name.",
        },
      ],
      vocabulary: [
        { arabic: "اسْم", transliteration: "ism", english: "name", pos: "noun (m)", plural: "أَسْمَاء" },
        { arabic: "بَلَد", transliteration: "balad", english: "country / hometown", pos: "noun (m)", plural: "بِلَاد / بُلْدَان" },
        { arabic: "جِنْسِيَّة", transliteration: "jinsiyyah", english: "nationality", pos: "noun (f)", plural: "جِنْسِيَّات" },
        { arabic: "الصُّومَال", transliteration: "aṣ-Ṣūmāl", english: "Somalia", pos: "proper noun" },
        { arabic: "مِصْر", transliteration: "Miṣr", english: "Egypt", pos: "proper noun" },
        { arabic: "اليَمَن", transliteration: "al-Yaman", english: "Yemen", pos: "proper noun" },
        { arabic: "المَغْرِب", transliteration: "al-Maghrib", english: "Morocco", pos: "proper noun" },
        { arabic: "السُّعُودِيَّة", transliteration: "as-Suʿūdiyyah", english: "Saudi Arabia", pos: "proper noun" },
        { arabic: "دَرَسَ — يَدْرُسُ", transliteration: "darasa — yadrusu", english: "to study", pos: "verb" },
        { arabic: "مَعْهَد", transliteration: "maʿhad", english: "institute", pos: "noun (m)", plural: "مَعَاهِد" },
        { arabic: "لُغَة", transliteration: "lughah", english: "language", pos: "noun (f)", plural: "لُغَات" },
        { arabic: "مَاذَا", transliteration: "mādhā", english: "what (for actions)", pos: "interrogative" },
      ],
      grammar: {
        title: "Attached Pronouns — Possessive (ضَمَائِر الاتِّصَال — المِلْكِيَّة)",
        titleArabic: "ضَمَائِر الاتِّصَال",
        explanation: "Arabic has ATTACHED pronouns that are suffixed to nouns to show possession:\n\n• ـِي (ī) = my → كِتَابِي (my book)\n• ـكَ (ka) = your (m) → كِتَابُكَ (your book)\n• ـكِ (ki) = your (f) → كِتَابُكِ (your book)\n• ـهُ (hu) = his → كِتَابُهُ (his book)\n• ـهَا (hā) = her → كِتَابُهَا (her book)\n• ـنَا (nā) = our → كِتَابُنَا (our book)\n• ـهُمْ (hum) = their (m) → كِتَابُهُمْ (their book)\n\nThese are the SAME pronouns attached to verbs to form objects (advanced level).",
        examples: [
          { arabic: "اسْمِي عَلِيٌّ.", translation: "My name is Ali." },
          { arabic: "بَيْتُنَا كَبِيرٌ.", translation: "Our house is big." },
          { arabic: "كِتَابُهَا جَدِيدٌ.", translation: "Her book is new." },
          { arabic: "مَعَ أُسْتَاذِهِمْ.", translation: "With their teacher." },
        ],
      },
      exercises: [
        {
          type: "fill_blank",
          instruction: "Attach the correct possessive pronoun.",
          instructionArabic: "أَلْصِقِ الضَّمِيرَ المُنَاسِب.",
          items: [
            { sentence: "اسْم___ عَلِيٌّ. (My name is Ali)", blank: 1, hint: "my" },
            { sentence: "بَيْت___ كَبِيرٌ. (His house is big)", blank: 1, hint: "his" },
            { sentence: "كِتَاب___ جَدِيدٌ. (Your [f] book is new)", blank: 1, hint: "your (f)" },
          ],
          answers: ["ـِي", "ـهُ", "ـكِ"],
        },
        {
          type: "translate",
          instruction: "Introduce yourself in Arabic using the patterns from this lesson.",
          instructionArabic: "قَدِّمْ نَفْسَكَ بِالعَرَبِيَّة.",
          items: [
            { english: "My name is [your name]. I am from [your country]." },
            { english: "I am a student. I study Arabic." },
          ],
          answers: ["اسْمِي [اسمك]. أَنَا مِنَ [بلدك].", "أَنَا طَالِبٌ/طَالِبَةٌ. أَدْرُسُ اللُّغَةَ العَرَبِيَّة."],
        },
        {
          type: "choose",
          instruction: "Choose the correct form.",
          instructionArabic: "اِخْتَرِ الصِّيغَةَ الصَّحِيحَة.",
          items: [
            { question: "How do you say 'my book'?", options: ["كِتَابَي", "كِتَابِي", "كِتَابُكَ", "كِتَابُهُ"], answer: 1 },
            { question: "How do you ask someone their name?", options: ["مَا اسْمُكَ؟", "مَا اسْمِي؟", "مَنْ أَنْتَ؟", "كَيْفَ اسْمُكَ؟"], answer: 0 },
          ],
          answers: [1, 0],
        },
      ],
      culturalNote: "In Arab and Islamic culture, names carry deep meaning. Muhammad (مُحَمَّد) means 'the highly praised one'. Ahmad (أَحْمَد) means 'most praiseworthy'. Names often include the father's name (Abdul-[name of Allah]) or compound names like Abdullah (عَبْدُ اللهِ — servant of Allah). When you meet someone, asking their name and origin shows genuine interest and respect.",
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // ARABIC BETWEEN YOUR HANDS — Book 2 (Intermediate)
  // ══════════════════════════════════════════════════════════════════════════
  "arabic-bayna-yadayk-2": [
    {
      bookId: "arabic-bayna-yadayk-2", lessonNum: 1,
      title: "The Verb System — Past Tense", titleArabic: "الفِعْلُ الثُّلَاثِيّ — الصَّرْفُ فِي المَاضِي",
      description: "Master the full conjugation of Arabic past tense verbs across all persons and genders.",
      pages: [
        { id: 1, arabic: "الفِعْلُ المَاضِي يَدُلُّ عَلَى حَدَثٍ وَقَعَ قَبْلَ وَقْتِ الكَلَام.", translation: "The past tense verb denotes an event that occurred before the time of speaking.", transliteration: "Al-fiʿlu l-māḍī yadullu ʿalā ḥadithin waqaʿa qabla waqti l-kalām.", note: "Arabic past tense has 14 forms. The base form is 3rd person masculine singular." },
        { id: 2, arabic: "تَصْرِيفُ كَتَبَ:\nكَتَبَ — كَتَبَتْ — كَتَبَا — كَتَبَتَا — كَتَبُوا — كَتَبْنَ\nكَتَبْتَ — كَتَبْتِ — كَتَبْتُمَا — كَتَبْتُمْ — كَتَبْتُنَّ\nكَتَبْتُ — كَتَبْنَا", translation: "Conjugation of kataba (wrote): He/She/They-dual(m/f)/They(m/f)/You(m/f)/You-dual/You-pl(m/f)/I/We", transliteration: "Kataba — katabat — katabā — katabatā / katabū — katabna — katabta — katabti / katabnā", note: "The root stays the same; only the ending suffix changes." },
        { id: 3, arabic: "أَمْثِلَة:\nذَهَبَ الطَّالِبُ إِلَى المَسْجِد.\nقَرَأَتِ الطَّالِبَةُ القُرْآنَ.\nكَتَبْنَا الوَاجِبَ أَمْسِ.", translation: "Examples: The student went to the mosque. / The student (f) read the Quran. / We wrote the homework yesterday.", transliteration: "Dhahaba ṭ-ṭālibu ilā l-masjid. / Qaraʾati ṭ-ṭālibatu l-qurʾān. / Katabnā l-wājiba ams.", note: "أَمْسِ = yesterday. Time expressions come at the beginning or end of the sentence." },
      ],
      vocabulary: [
        { arabic: "كَتَبَ", transliteration: "kataba", english: "he wrote", pos: "verb (past)" },
        { arabic: "ذَهَبَ", transliteration: "dhahaba", english: "he went", pos: "verb (past)" },
        { arabic: "قَرَأَ", transliteration: "qaraʾa", english: "he read", pos: "verb (past)" },
        { arabic: "أَمْس", transliteration: "ams", english: "yesterday", pos: "adverb" },
        { arabic: "وَاجِب", transliteration: "wājib", english: "homework / obligation", pos: "noun (m)" },
      ],
      grammar: { title: "Past Tense Endings (لَاحِقَات المَاضِي)", titleArabic: "لَاحِقَاتُ المَاضِي", explanation: "Singular: (3m) ـَ | (3f) ـَتْ | (2m) ـْتَ | (2f) ـْتِ | (1) ـْتُ\nDual: (3m) ـَا | (3f) ـَتَا | (2) ـْتُمَا\nPlural: (3m) ـُوا | (3f) ـْنَ | (2m) ـْتُمْ | (2f) ـْتُنَّ | (1) ـْنَا", examples: [{ arabic: "ذَهَبَ — ذَهَبَتْ — ذَهَبُوا", translation: "he went — she went — they went" }] },
      exercises: [{ type: "fill_blank", instruction: "Conjugate the verb.", instructionArabic: "صَرِّفِ الفِعْل.", items: [{ sentence: "هِيَ ___ (ذَهَبَ) إِلَى السُّوق.", blank: 1, hint: "she went" }, { sentence: "نَحْنُ ___ (كَتَبَ) الرِّسَالَة.", blank: 1, hint: "we wrote" }], answers: ["ذَهَبَتْ", "كَتَبْنَا"] }],
    },
    {
      bookId: "arabic-bayna-yadayk-2", lessonNum: 2,
      title: "The Present Tense", titleArabic: "الفِعْلُ المُضَارِع",
      description: "Master all 14 forms of the Arabic present tense verb.",
      pages: [
        { id: 1, arabic: "الفِعْلُ المُضَارِع يَبْدَأُ بِأَحَدِ أَحْرُفِ المُضَارَعَة: أَ — تَ — يَ — نَ (أَتَيْنَ)", translation: "The present tense begins with one of the four prefix letters: أ — تـ — يـ — نـ (mnemonic: Atayna)", transliteration: "Al-fiʿlu l-muḍāriʿu yabdaʾu bi-aḥadi aḥrufi l-muḍāraʿah.", note: "أَتَيْنَ: أَ (first person sing.) — تَ (2nd person/3rd feminine) — يَ (3rd masculine) — نَ (first person plural)." },
        { id: 2, arabic: "يَكْتُبُ — تَكْتُبُ — يَكْتُبَانِ — تَكْتُبَانِ\nيَكْتُبُونَ — يَكْتُبْنَ — تَكْتُبُ — تَكْتُبِين\nتَكْتُبَانِ — تَكْتُبُونَ — تَكْتُبْنَ — أَكْتُبُ — نَكْتُبُ", translation: "Present conjugation of 'to write': He/She/They-dual(m/f)/They(m/f)/You(m/f)/You-dual/You-pl(m/f)/I/We write", transliteration: "Yaktubu — taktubu — yaktubāni — taktubāni / yaktubūna — yaktubna — taktubu — taktubīna / aktubu — naktubu", note: "Present tense uses both prefixes AND suffixes." },
        { id: 3, arabic: "أَنَا أَدْرُسُ الآن. (حَاضِر)\nسَأَدْرُسُ غَدًا. (مُسْتَقْبَل — سَ + مُضَارِع)\nالشَّمْسُ تَطْلُعُ مِنَ الشَّرْق. (حَقِيقَة)", translation: "I am studying now. (present) / I will study tomorrow. (future — sa + present verb) / The sun rises from the east. (fact)", transliteration: "Anā adrusu l-ān. / Sa-adrusu ghadan. / Ash-shamsu taṭluʿu mina sh-sharq.", note: "سَ (prefix) or سَوْفَ (before verb) = will/shall. They create the future from the present verb form." },
      ],
      vocabulary: [
        { arabic: "يَكْتُبُ", transliteration: "yaktubu", english: "he writes", pos: "verb (present)" },
        { arabic: "يَدْرُسُ", transliteration: "yadrusu", english: "he studies", pos: "verb (present)" },
        { arabic: "الآن", transliteration: "al-ān", english: "now", pos: "adverb" },
        { arabic: "غَدًا", transliteration: "ghadan", english: "tomorrow", pos: "adverb" },
        { arabic: "سَوْفَ", transliteration: "sawfa", english: "will (future marker)", pos: "particle" },
      ],
      grammar: { title: "Present Tense — Prefixes & Suffixes", titleArabic: "أَحْرُفُ المُضَارَعَة وَلَاحِقَاتُهُ", explanation: "PREFIXES: يَـ = he/they(m) | تَـ = she/you | أَـ = I | نَـ = we\nSUFFIXES: (m.sg) none | (f.sg) ين | (dual) ان | (m.pl) ون | (f.pl) ن", examples: [{ arabic: "هُوَ يَقْرَأُ — هِيَ تَقْرَأُ — أَنَا أَقْرَأُ", translation: "he reads — she reads — I read" }] },
      exercises: [{ type: "choose", instruction: "Which form is correct?", instructionArabic: "أَيُّ الصِّيَغِ صَحِيح؟", items: [{ question: "She studies (root درس)", options: ["يَدْرُسُ", "تَدْرُسُ", "أَدْرُسُ", "نَدْرُسُ"], answer: 1 }, { question: "We write (root كتب)", options: ["يَكْتُبُونَ", "تَكْتُبُ", "نَكْتُبُ", "أَكْتُبُ"], answer: 2 }], answers: [1, 2] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // ARABIC MORPHOLOGY (SARF)
  // ══════════════════════════════════════════════════════════════════════════
  "arabic-morphology": [
    {
      bookId: "arabic-morphology", lessonNum: 1,
      title: "Introduction to Arabic Morphology (Sarf)", titleArabic: "مُقَدِّمَةٌ فِي عِلْمِ الصَّرْف",
      description: "Understand the Arabic root system and how all Arabic words derive from three-letter roots.",
      pages: [
        { id: 1, arabic: "عِلْمُ الصَّرْفِ هُوَ عِلْمُ بُنْيَةِ الكَلِمَة.\nالمِيزَانُ الصَّرْفِيّ: فَعَلَ (ف.ع.ل)\nكُلُّ كَلِمَةٍ عَرَبِيَّةٍ أَصِيلَةٍ تَرْجِعُ إِلَى جَذْرٍ ثُلَاثِيّ.", translation: "Sarf is the science of word structure. The morphological scale: fa-ʿa-la. Every original Arabic word goes back to a three or four-letter root.", transliteration: "ʿIlmu ṣ-ṣarfi huwa ʿilmu bunyati l-kalimah.", note: "فَعَلَ is the measurement tool: فَ = first root letter, عَ = second, لَ = third." },
        { id: 2, arabic: "مِثَال عَلَى الجَذْر (ك.ت.ب):\nكَتَبَ = كَتَبَ (فَعَلَ)\nكِتَاب = فِعَال\nكَاتِب = فَاعِل\nمَكْتُوب = مَفْعُول\nمَكْتَبَة = مَفْعَلَة\nكِتَابَة = فِعَالَة\nيَكْتُبُ = يَفْعُلُ", translation: "Root k.t.b example: wrote / book / writer / written / library / writing / writes — all from ONE root!", transliteration: "Mithālun ʿalā l-jidhr: k.t.b", note: "Knowing roots unlocks the entire Arabic dictionary!" },
        { id: 3, arabic: "الجَذْر (د.ر.س):\nدَرَسَ — دَرْس — دِرَاسَة — دَارِس — مَدْرَسَة — مُدَرِّس\nالجَذْر (ع.ل.م):\nعَلِمَ — عِلْم — عَالِم — مَعْلُوم — تَعَلَّمَ — عَلَّمَ", translation: "Root d.r.s: studied/lesson/studying/student/school/teacher\nRoot ʿ.l.m: knew/knowledge/scholar/known/learned/taught", transliteration: "Al-jidhr d.r.s — al-jidhr ʿ.l.m", note: "From ONE root → multiple words covering the entire semantic field of that concept." },
      ],
      vocabulary: [
        { arabic: "جَذْر", transliteration: "jidhr", english: "root (of a word)", pos: "noun (m)", plural: "جُذُور" },
        { arabic: "وَزْن", transliteration: "wazn", english: "morphological pattern", pos: "noun (m)", plural: "أَوْزَان" },
        { arabic: "مَصْدَر", transliteration: "maṣdar", english: "verbal noun", pos: "noun (m)", plural: "مَصَادِر" },
        { arabic: "اشْتِقَاق", transliteration: "ishtiqāq", english: "derivation", pos: "noun (m)" },
        { arabic: "اسْم فَاعِل", transliteration: "ism fāʿil", english: "active participle (doer noun)", pos: "term" },
      ],
      grammar: { title: "The Root System", titleArabic: "نِظَامُ الجُذُور", explanation: "From root س.ل.م:\n• سَلِمَ = was safe (verb)\n• سَلَام = peace (noun)\n• إِسْلَام = Islam (verbal noun)\n• مُسْلِم = Muslim (active participle)\n• مُسَالَمَة = making peace\n\nAll from ONE root! Sarf teaches you to predict them all.", examples: [{ arabic: "جَذْر (س.ل.م) → سَلِمَ — سَلَام — إِسْلَام — مُسْلِم", translation: "Root s.l.m → was safe — peace — Islam — Muslim" }] },
      exercises: [{ type: "match", instruction: "Match the word to its root.", instructionArabic: "طَابِقْ بَيْنَ الكَلِمَةِ وَجَذْرِهَا.", items: [{ arabic: "مَسْجِد", english: "Root: س.ج.د (to prostrate)" }, { arabic: "كِتَاب", english: "Root: ك.ت.ب (to write)" }, { arabic: "مُعَلِّم", english: "Root: ع.ل.م (to know)" }], answers: [0, 1, 2] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // TAJWEED RULES
  // ══════════════════════════════════════════════════════════════════════════
  "quran-tajweed-rules": [
    {
      bookId: "quran-tajweed-rules", lessonNum: 1,
      title: "Introduction to Tajweed", titleArabic: "تَعْرِيفُ التَّجْوِيدِ وَحُكْمُه",
      description: "What is Tajweed, why is it obligatory, and what are the levels of recitation?",
      pages: [
        { id: 1, arabic: "اَلتَّجْوِيدُ لُغَةً: تَحْسِينُ الشَّيْءِ وَإِتْقَانُهُ.\nاَلتَّجْوِيدُ اصْطِلَاحًا: إِعْطَاءُ كُلِّ حَرْفٍ حَقَّهُ مِنَ الصِّفَاتِ وَمُسْتَحَقَّهُ.", translation: "Tajweed linguistically: improving and perfecting a thing. Technically: giving each letter its due rights from its attributes.", transliteration: "At-tajwīdu lughatan: taḥsīnu sh-shayʾi wa itqānuh.", note: "Every letter has: حَقّ (permanent attributes) and مُسْتَحَقّ (context-dependent characteristics)." },
        { id: 2, arabic: "حُكْمُ التَّجْوِيدِ: فَرْضُ عَيْنٍ عَلَى كُلِّ مُسْلِمٍ وَمُسْلِمَة.\nقَالَ اللهُ: ﴿وَرَتِّلِ القُرْآنَ تَرْتِيلًا﴾ [المُزَّمِّل: ٤]", translation: "Ruling on Tajweed: individually obligatory for every Muslim. Allah says: 'And recite the Quran with measured recitation.' (73:4)", transliteration: "Ḥukmu t-tajwīdi: farḍu ʿaynin.", note: "مِيلِاً خَفِيفًا = the Prophet ﷺ said: 'The one who does not beautify his voice for the Quran is not from us.'" },
        { id: 3, arabic: "دَرَجَاتُ التِّلَاوَة:\n• التَّرْتِيل: بُطْء مَعَ تَدَبُّر — أَفْضَلُها\n• التَّدْوِير: السُّرْعَةُ المُتَوَسِّطَة\n• الحَدْر: السُّرْعَة مَعَ الصِّحَّة", translation: "Degrees of recitation: Tartīl (slow + contemplation — best) / Tadwīr (medium pace) / Hadr (fast but correct)", transliteration: "Darajātu t-tilāwah.", note: "Begin with Tartīl to establish correct habits before increasing speed." },
      ],
      vocabulary: [
        { arabic: "تَجْوِيد", transliteration: "tajwīd", english: "Tajweed / perfecting recitation", pos: "noun (m)" },
        { arabic: "تَرْتِيل", transliteration: "tartīl", english: "measured/slow recitation", pos: "noun (m)" },
        { arabic: "فَرْض عَيْن", transliteration: "farḍu ʿayn", english: "individual obligation", pos: "legal term" },
        { arabic: "مَخْرَج", transliteration: "makhraj", english: "articulation point", pos: "noun (m)", plural: "مَخَارِج" },
        { arabic: "صِفَة", transliteration: "ṣifah", english: "attribute of a letter", pos: "noun (f)", plural: "صِفَات" },
      ],
      grammar: { title: "Why Tajweed is Obligatory", titleArabic: "وُجُوبُ التَّجْوِيد", explanation: "Three reasons Tajweed is obligatory:\n1. Quranic command: ﴿وَرَتِّلِ القُرْآنَ تَرْتِيلًا﴾\n2. Prophetic example: The Prophet ﷺ recited with Tajweed\n3. Mispronunciation changes meaning: كَفَرَ (disbelieved) vs كَبَرَ (grew up)\n\nFirst steps: correct your Al-Fatiha, learn the 17 articulation points.", examples: [{ arabic: "﴿وَرَتِّلِ القُرْآنَ تَرْتِيلًا﴾", translation: "'And recite the Quran with measured recitation.' (73:4)" }] },
      exercises: [{ type: "choose", instruction: "Answer about Tajweed basics.", instructionArabic: "أَجِبْ عَنْ أُسَاسِيَّات التَّجْوِيد.", items: [{ question: "What is the ruling on Tajweed?", options: ["Recommended only", "Individually obligatory (farḍ ʿayn)", "Communally obligatory", "Optional"], answer: 1 }], answers: [1] }],
      culturalNote: "The Prophet ﷺ said: 'The one who is skilled in reciting the Quran will be with the noble righteous scribes (angels), and the one who struggles with it will have a DOUBLE reward.' Even beginners earn great reward!",
    },
    {
      bookId: "quran-tajweed-rules", lessonNum: 2,
      title: "Noon Saakin & Tanween — Four Rules", titleArabic: "أَحْكَامُ النُّونِ السَّاكِنَةِ وَالتَّنْوِين",
      description: "Master the four rules governing every noon saakin and tanween in the Quran.",
      pages: [
        { id: 1, arabic: "أَحْكَامُ النُّونِ السَّاكِنَةِ وَالتَّنْوِينِ أَرْبَعَة:\n١. الإِظْهَار — ٢. الإِدْغَام — ٣. الإِقْلَاب — ٤. الإِخْفَاء", translation: "The rules are four: 1. Iẓhār (clear) — 2. Idghām (merge) — 3. Iqlab (convert) — 4. Ikhfāʾ (hide)", transliteration: "Aḥkāmu n-nūni s-sākinati wa t-tanwīni arbaʿah.", note: "These apply whenever نْ or tanween (ـٌ ـٍ ـً) appears before another letter." },
        { id: 2, arabic: "١. الإِظْهَار — مَعَ: أ ه ع ح غ خ (حُرُوف الحَلْق)\n﴿مِنْ أَهْلِ﴾ — ﴿مِنْ هَادٍ﴾ — ﴿مَنْ عَمِلَ﴾\nالنُّون تُنْطَق بِوُضُوح بِدُونِ غُنَّة.", translation: "1. Iẓhār — with throat letters: أ ه ع ح غ خ. Examples: min ahlin / min hādin / man ʿamila. Noon pronounced clearly, no nasality.", transliteration: "Al-Iẓhār al-ḥalqī — maʿa: ء ه ع ح غ خ", note: "These 6 letters are the throat letters. Noon meets throat = both sounds remain clear." },
        { id: 3, arabic: "٢. الإِدْغَام (يَنْمُو) — بِغُنَّة: ي ن م و — بِلَا غُنَّة: ر ل\n٣. الإِقْلَاب — مَعَ: ب — النُّون → مِيمٌ خَفِيَّة\n٤. الإِخْفَاء — مَعَ بَاقِي الأَحْرُفِ الـ ١٥\n﴿مِنْ يَعْمَلُ﴾ — ﴿مِنْ بَعْدِ﴾ — ﴿مِنْ تَحْتِهَا﴾", translation: "2. Idghām (merge) — with ghunnah: ي ن م و | without: ر ل / 3. Iqlab — with ب (noon → hidden م) / 4. Ikhfāʾ — with 15 remaining letters", transliteration: "Al-Idghām / Al-Iqlab / Al-Ikhfāʾ", note: "Total: 6 + 4 + 2 + 1 + 15 = 28 = all Arabic letters." },
      ],
      vocabulary: [
        { arabic: "إِظْهَار", transliteration: "iẓhār", english: "making clear", pos: "noun (m)" },
        { arabic: "إِدْغَام", transliteration: "idghām", english: "merging / assimilation", pos: "noun (m)" },
        { arabic: "إِقْلَاب", transliteration: "iqlab", english: "conversion", pos: "noun (m)" },
        { arabic: "إِخْفَاء", transliteration: "ikhfāʾ", english: "hiding / concealment", pos: "noun (m)" },
        { arabic: "غُنَّة", transliteration: "ghunnah", english: "nasality (2-count nasal hum)", pos: "noun (f)" },
        { arabic: "نُون سَاكِن", transliteration: "nūn sākin", english: "noon with sukoon (نْ)", pos: "term" },
      ],
      grammar: { title: "Quick Reference: Noon Saakin Rules", titleArabic: "مُلَخَّصُ أَحْكَامِ النُّون", explanation: "Noon Saakin before:\n• أ ه ع ح غ خ → إِظْهَار (clear noon)\n• ي ن م و → إِدْغَام بِغُنَّة (merge with nasal)\n• ر ل → إِدْغَام بِلَا غُنَّة (merge without nasal)\n• ب → إِقْلَاب (noon becomes nasal م)\n• 15 others → إِخْفَاء (hide noon, keep nasal)", examples: [{ arabic: "﴿مِنْ أَمِنَ﴾ = إِظْهَار / ﴿مِنْ بَعْدِ﴾ = إِقْلَاب", translation: "Clear noon before ء / Noon converts before ب" }] },
      exercises: [{ type: "choose", instruction: "Which rule applies?", instructionArabic: "أَيُّ حُكْمٍ يُطَبَّق؟", items: [{ question: "﴿مِنْ عِلْمٍ﴾ — nun before ع", options: ["Iẓhār", "Idghām", "Iqlab", "Ikhfāʾ"], answer: 0 }, { question: "﴿مِنْ بَعْدِ﴾ — nun before ب", options: ["Iẓhār", "Idghām", "Iqlab", "Ikhfāʾ"], answer: 2 }], answers: [0, 2] }],
    },
    {
      bookId: "quran-tajweed-rules", lessonNum: 3,
      title: "Meem Saakin & Madd Rules", titleArabic: "أَحْكَامُ المِيمِ السَّاكِنَةِ وَالمَدّ",
      description: "Learn the three rules of meem saakin and the essential types of prolongation (madd).",
      pages: [
        { id: 1, arabic: "أَحْكَامُ المِيمِ السَّاكِنَة ثَلَاثَة:\n١. الإِخْفَاء الشَّفَوِيّ — مَعَ: ب — مِيمٌ خَفِيَّة مَعَ غُنَّة\n٢. الإِدْغَام الشَّفَوِيّ — مَعَ: م — إِدْغَامٌ كَامِل مَعَ غُنَّة\n٣. الإِظْهَار الشَّفَوِيّ — مَعَ: بَاقِي الأَحْرُف", translation: "Three rules of meem saakin:\n1. Ikhfāʾ shafawi — before ب (hidden meem with ghunnah)\n2. Idghām shafawi — before م (full merge with ghunnah)\n3. Iẓhār shafawi — before all other letters (clear meem)", transliteration: "Aḥkāmu l-mīmi s-sākinah thalāthah.", note: "شَفَوِيّ = labial (from the lips). Unlike noon rules, meem rules are simpler: only 3." },
        { id: 2, arabic: "أَنْوَاعُ المَدّ الأَسَاسِيَّة:\n• المَدُّ الطَّبِيعِيّ: حَرْفُ مَدٍّ بَعْدَهُ لَا هَمْز وَلَا سُكُون — ٢ حَرَكَة\n• مَدُّ البَدَل: هَمْزَة فَقَبْلَهَا حَرْفُ مَدّ — ٢ حَرَكَة\n• المَدُّ المُتَّصِل (وَاجِب): حَرْفُ مَدٍّ ثُمَّ هَمْزَة فِي كَلِمَة وَاحِدَة — ٤-٥ حَرَكَات\n• المَدُّ المُنْفَصِل (جَائِز): حَرْفُ مَدٍّ ثُمَّ هَمْزَة فِي كَلِمَة تَالِيَة — ٢-٥ حَرَكَات", translation: "Main Madd types: Natural (2 counts) / Badal-2 counts / Connected-mandatory (4-5 counts) / Separate-permissible (2-5 counts)", transliteration: "Anwāʿu l-madd.", note: "2 حَرَكَة = one alif length. 4-5 = double or more." },
      ],
      vocabulary: [
        { arabic: "مَدّ", transliteration: "madd", english: "elongation / prolongation", pos: "noun (m)" },
        { arabic: "حَرْف مَدّ", transliteration: "ḥarf madd", english: "letter of prolongation (ا و ي)", pos: "term" },
        { arabic: "هَمْزَة", transliteration: "hamzah", english: "the glottal stop letter (ء)", pos: "noun (f)" },
        { arabic: "حَرَكَة", transliteration: "ḥarakah", english: "vowel-count (unit of timing)", pos: "noun (f)", plural: "حَرَكَات" },
      ],
      grammar: { title: "Madd — The Letter of Prolongation", titleArabic: "حُرُوفُ المَدّ", explanation: "Madd letters are three: ا — و — ي\n• الأَلِف المَدِّيَّة: preceded by fatḥah (بَاب)\n• الوَاو المَدِّيَّة: preceded by ḍammah (نُور)\n• اليَاء المَدِّيَّة: preceded by kasrah (دِين)\n\nThese create the 3 long vowels: ā / ū / ī\n\nRule: the longer the madd, the more counts of elongation.", examples: [{ arabic: "بَاب (2) — جَاءَ (4-5) — القُرْآن (4-5)", translation: "bāb = 2 counts / jāʾa = 4-5 (connected madd before hamza)" }] },
      exercises: [{ type: "choose", instruction: "Identify the madd type.", instructionArabic: "حَدِّدْ نَوْعَ المَدّ.", items: [{ question: "بَاب — alif after fatḥah, no hamza or sukoon", options: ["Medd Ṭabīʿī (2 counts)", "Medd Muttaṣil (4-5)", "Medd Munfaṣil (2-5)", "Medd Badal (2)"], answer: 0 }], answers: [0] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // QURAN BEGINNERS GUIDE
  // ══════════════════════════════════════════════════════════════════════════
  "quran-beginners-guide": [
    {
      bookId: "quran-beginners-guide", lessonNum: 1,
      title: "Starting the Quran — Bismillah & Ta'awwudh", titleArabic: "البَسْمَلَة وَآدَابُ التِّلَاوَة",
      description: "Learn how to begin Quran recitation properly with Ta'awwudh and Bismillah.",
      pages: [
        { id: 1, arabic: "أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيم.\nبِسْمِ اللهِ الرَّحْمَٰنِ الرَّحِيم.", translation: "I seek refuge with Allah from the accursed Satan. In the name of Allah, the Most Gracious, the Most Merciful.", transliteration: "Aʿūdhu bi-llāhi mina sh-shayṭāni r-rajīm. Bismi llāhi r-raḥmāni r-raḥīm.", note: "Begin every Quran recitation with Ta'awwudh then Bismillah — this is Sunnah." },
        { id: 2, arabic: "آدَابُ تِلَاوَةِ القُرْآن:\n• الطَّهَارَة وَالوُضُوء\n• اسْتِقْبَالُ القِبْلَة إِذَا أَمْكَن\n• التَّرْتِيل وَعَدَم الاسْتِعْجَال\n• الخُشُوع وَحُضُور القَلْب", translation: "Etiquette of recitation: Purity/wudu / Facing Qiblah if possible / Slow deliberate recitation / Humility and heart-presence", transliteration: "Ādābu tilāwati l-Qurʾān.", note: "These are etiquettes (ādāb), not requirements. The Prophet ﷺ said: 'Beautify the Quran with your voices.'" },
        { id: 3, arabic: "تَحْلِيلُ البَسْمَلَة:\nبِـ = فِي / بِاسْم\nاسْم اللهِ = الاسْمُ الأَعْظَم\nالرَّحْمَٰن = ذُو الرَّحْمَةِ الوَاسِعَة لِجَمِيعِ الخَلْق\nالرَّحِيم = ذُو الرَّحْمَةِ الخَاصَّة بِالمُؤْمِنِين", translation: "Bismillah analysis: Bi = in/with | name of Allah = the Greatest Name | Ar-Raḥmān = vast mercy for all creation | Ar-Raḥīm = special mercy for believers", transliteration: "Bismi = bi + ism + Allāh / Ar-Raḥmān / Ar-Raḥīm", note: "Mercy is mentioned TWICE — emphasizing that beginning with His mercy is our protection." },
      ],
      vocabulary: [
        { arabic: "أَعُوذُ", transliteration: "aʿūdhu", english: "I seek refuge", pos: "verb (1st person)" },
        { arabic: "الشَّيْطَان", transliteration: "ash-shayṭān", english: "Satan", pos: "noun (m)" },
        { arabic: "الرَّجِيم", transliteration: "ar-rajīm", english: "the accursed / expelled", pos: "adjective" },
        { arabic: "تَعَوُّذ", transliteration: "taʿawwudh", english: "seeking refuge with Allah", pos: "noun (m)" },
        { arabic: "بَسْمَلَة", transliteration: "basmalah", english: "saying Bismillah", pos: "noun (f)" },
        { arabic: "تَدَبُّر", transliteration: "tadabbur", english: "deep contemplation", pos: "noun (m)" },
      ],
      grammar: { title: "Bismillah — Word by Word", titleArabic: "تَحْلِيلُ البَسْمَلَة", explanation: "بِسْمِ اللهِ الرَّحْمَٰنِ الرَّحِيمِ\n• بِـ = in/with (preposition)\n• اسْم = name (with alif wasl dropped)\n• اللهِ = of Allah (genitive)\n• الرَّحْمَٰن = The Most Gracious (eternal attribute)\n• الرَّحِيم = The Most Merciful (for believers)\n\nImplied verb: 'I begin' — 'I begin in the name of Allah...'", examples: [{ arabic: "بِسْمِ اللهِ الرَّحْمَٰنِ الرَّحِيمِ", translation: "In + name + of Allah + The Most Gracious + The Most Merciful" }] },
      exercises: [{ type: "fill_blank", instruction: "Complete from memory.", instructionArabic: "أَكْمِلْ مِنَ الحِفْظ.", items: [{ sentence: "أَعُوذُ بِاللهِ مِنَ ___ الرَّجِيم.", blank: 1, hint: "Satan" }, { sentence: "بِسْمِ اللهِ ___ الرَّحِيم.", blank: 1, hint: "The Most Gracious" }], answers: ["الشَّيْطَان", "الرَّحْمَٰنِ"] }],
    },
    {
      bookId: "quran-beginners-guide", lessonNum: 2,
      title: "Surah Al-Fatiha — Complete Study", titleArabic: "سُورَةُ الفَاتِحَة — دِرَاسَةٌ كَامِلَة",
      description: "Memorize and understand Al-Fatiha — the greatest surah, recited 17 times daily.",
      pages: [
        { id: 1, arabic: "﴿الْحَمْدُ للهِ رَبِّ الْعَالَمِينَ﴾\n﴿الرَّحْمَٰنِ الرَّحِيمِ﴾\n﴿مَالِكِ يَوْمِ الدِّينِ﴾", translation: "'All praise is due to Allah, Lord of all the worlds.' / 'The Most Gracious, the Most Merciful.' / 'Master of the Day of Judgment.'", transliteration: "Al-ḥamdu li-llāhi rabbi l-ʿālamīn. Ar-raḥmāni r-raḥīm. Māliki yawmi d-dīn.", note: "رَبُّ العَالَمِين = Lord of every world: humans, jinn, animals, planets — ALL of existence." },
        { id: 2, arabic: "﴿إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ﴾\n﴿اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ﴾\n﴿صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ﴾", translation: "'You alone we worship and You alone we ask for help.' / 'Guide us to the straight path.' / 'The path of those You have favored — not those who evoked anger or those astray.'", transliteration: "Iyyāka naʿbudu wa iyyāka nastaʿīn. Ihdinā ṣ-ṣirāṭa l-mustaqīm.", note: "إِيَّاكَ placed first = exclusivity: ONLY Allah is worshipped. اهْدِنَا = guide US (plural — community asking together)." },
      ],
      vocabulary: [
        { arabic: "حَمْد", transliteration: "ḥamd", english: "praise / grateful praise", pos: "noun (m)" },
        { arabic: "رَبّ", transliteration: "rabb", english: "Lord / Sustainer", pos: "noun (m)" },
        { arabic: "مَالِك", transliteration: "mālik", english: "Master / Owner", pos: "divine attribute" },
        { arabic: "صِرَاط", transliteration: "ṣirāṭ", english: "path / road", pos: "noun (m)" },
        { arabic: "مُسْتَقِيم", transliteration: "mustaqīm", english: "straight / upright", pos: "adjective" },
        { arabic: "هِدَايَة", transliteration: "hidāyah", english: "guidance", pos: "noun (f)" },
      ],
      grammar: { title: "Al-Fatiha — Two Halves", titleArabic: "بُنْيَةُ الفَاتِحَة", explanation: "Allah said in hadith qudsi: 'I divided Al-Fatiha between Me and My servant in two halves.'\n\nFirst Half (1-4): PRAISE OF ALLAH\n• Al-Ḥamd → all praise\n• Ar-Raḥmān Ar-Raḥīm → His mercy\n• Māliki Yawm → His sovereignty\n\nSecond Half (5-7): SERVANT'S REQUEST\n• Iyyāka naʿbud → worship\n• Iyyāka nastaʿīn → seeking help\n• Ihdinas → the great supplication", examples: [{ arabic: "«لَا صَلَاةَ لِمَنْ لَمْ يَقْرَأْ بِفَاتِحَةِ الكِتَاب»", translation: "'No prayer for one who does not recite Al-Fatiha.' (Bukhari)" }] },
      exercises: [{ type: "fill_blank", instruction: "Complete Al-Fatiha.", instructionArabic: "أَكْمِلِ الفَاتِحَة.", items: [{ sentence: "﴿الْحَمْدُ للهِ رَبِّ ___﴾", blank: 1, hint: "all the worlds" }, { sentence: "﴿إِيَّاكَ نَعْبُدُ وَإِيَّاكَ ___﴾", blank: 1, hint: "we seek help" }], answers: ["الْعَالَمِينَ", "نَسْتَعِينُ"] }],
      culturalNote: "Al-Fatiha is called 'Umm al-Quran' (Mother of the Quran) and 'Ash-Shifa' (The Healing). It is recited at LEAST 17 times daily in prayer — more than any other surah. The Prophet ﷺ said it is the greatest surah in the Quran.",
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // FORTY HADITH OF IMAM AN-NAWAWI
  // ══════════════════════════════════════════════════════════════════════════
  "hadith-arbaeen-nawawi": [
    {
      bookId: "hadith-arbaeen-nawawi", lessonNum: 1,
      title: "Hadith 1 — Actions by Intentions", titleArabic: "الحَدِيث الأَوَّل: الأَعْمَالُ بِالنِّيَّات",
      description: "The foundational hadith of Islam: all deeds are judged by their intentions.",
      pages: [
        { id: 1, arabic: "عَنْ عُمَرَ بْنِ الخَطَّابِ رَضِيَ اللهُ عَنْهُ:\n«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى.»", translation: "On the authority of ʿUmar ibn al-Khaṭṭāb: 'Actions are only by intentions, and every person will have only what they intended.'", transliteration: "«Innamā l-aʿmālu bi-n-niyyāti, wa innamā li-kulli mriʾin mā nawā.»", note: "إِنَّمَا = restriction: 'ONLY by intentions'. The same action has different spiritual value depending on intention." },
        { id: 2, arabic: "«فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللهِ وَرَسُولِهِ،\nوَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ.»", translation: "'Whoever emigrated for Allah and His Messenger — his emigration is for Allah. Whoever emigrated for worldly gain — his emigration is for what he emigrated for.'", transliteration: "«Faman kānat hijratuhu ilā llāhi wa rasūlihi...»", note: "The hadith was narrated regarding a man who migrated to Madinah for worldly reasons." },
        { id: 3, arabic: "تَطْبِيقَات:\n• الصَّلَاة لِلهِ = أَجْر كَامِل\n• الصَّلَاة لِلنَّاس (رِيَاء) = لَا أَجْر\n• حَتَّى الأَكْل وَالنَّوْم يَصِيرُ عِبَادَة بِالنِّيَّة الصَّالِحَة", translation: "Applications: Prayer for Allah = full reward / Prayer to show others (riya) = no reward / Even eating and sleeping become worship with correct intention", transliteration: "Taṭbīqāt.", note: "Imam Al-Shafi'i said: 'This hadith is a third of all knowledge.'" },
      ],
      vocabulary: [
        { arabic: "نِيَّة", transliteration: "niyyah", english: "intention / purpose", pos: "noun (f)", plural: "نِيَّات" },
        { arabic: "عَمَل", transliteration: "ʿamal", english: "deed / action", pos: "noun (m)", plural: "أَعْمَال" },
        { arabic: "إِنَّمَا", transliteration: "innamā", english: "only / nothing but (restrictive)", pos: "particle" },
        { arabic: "هِجْرَة", transliteration: "hijrah", english: "emigration / migration", pos: "noun (f)" },
        { arabic: "رِيَاء", transliteration: "riyāʾ", english: "showing off in worship", pos: "noun (m)" },
      ],
      grammar: { title: "Lessons of Hadith 1", titleArabic: "فِقْهُ الحَدِيثِ الأَوَّل", explanation: "Imam Al-Nawawi placed this FIRST because it is the foundation of all Islamic actions.\n\nKey lessons:\n1. Niyyah is the heart of every deed\n2. Same action = different reward based on intention\n3. Even eating/sleeping/working become worship with right intention\n4. Imam Al-Shafi'i: 'This hadith is a third of all knowledge'\n5. Context: revealed about a man who migrated for a woman named Umm Qays", examples: [{ arabic: "صَلَّيْتُ لِأَنَّ اللهَ أَمَرَنِي = أَجْر كَامِل", translation: "I prayed because Allah commanded me = full reward" }] },
      exercises: [{ type: "choose", instruction: "Apply the lesson of Hadith 1.", instructionArabic: "طَبِّقْ دَرْسَ الحَدِيث الأَوَّل.", items: [{ question: "A scholar teaches only so people call him 'learned'. What happens?", options: ["Full reward since he shared knowledge", "No reward — action was for praise not Allah", "Half reward", "Double reward for teaching"], answer: 1 }, { question: "What does إِنَّمَا indicate?", options: ["Encouragement", "Restriction — ONLY by intentions", "Question", "Command"], answer: 1 }], answers: [1, 1] }],
    },
    {
      bookId: "hadith-arbaeen-nawawi", lessonNum: 2,
      title: "Hadith 2 — Islam, Iman & Ihsan", titleArabic: "الحَدِيث الثَّانِي: الإِسْلَام وَالإِيمَان وَالإِحْسَان",
      description: "The Hadith of Jibril — the three levels of religion defined in one conversation.",
      pages: [
        { id: 1, arabic: "«الإِسْلَامُ أَنْ تَشْهَدَ أَنْ لَا إِلَهَ إِلَّا اللهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللهِ،\nوَتُقِيمَ الصَّلَاةَ، وَتُؤْتِيَ الزَّكَاةَ، وَتَصُومَ رَمَضَانَ، وَتَحُجَّ البَيْتَ إِنِ اسْتَطَعْتَ.»", translation: "'Islam is to testify there is no god but Allah and Muhammad is His Messenger, establish prayer, pay zakat, fast Ramadan, and pilgrimage if able.'", transliteration: "Al-Islāmu an tashhada an lā ilāha illā llāhu wa anna Muḥammadan Rasūlu llāh...", note: "The Five Pillars defined precisely. Hajj is conditional ('if able') — built into the pillar." },
        { id: 2, arabic: "«الإِيمَانُ أَنْ تُؤْمِنَ بِاللهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ وَاليَوْمِ الآخِرِ وَتُؤْمِنَ بِالقَدَرِ خَيْرِهِ وَشَرِّهِ.»\n«الإِحْسَانُ أَنْ تَعْبُدَ اللهَ كَأَنَّكَ تَرَاهُ، فَإِنْ لَمْ تَكُنْ تَرَاهُ فَإِنَّهُ يَرَاكَ.»", translation: "'Iman: believe in Allah, angels, books, messengers, Last Day, and divine decree — good and evil.' / 'Ihsan: worship Allah as if you see Him; if not, know He sees you.'", transliteration: "Al-Īmānu an tuʾmina billāhi wa malāʾikatihi... / Al-Iḥsānu an taʿbuda llāha kaʾannaka tarāh.", note: "Three levels form a hierarchy: Islam (actions) → Iman (heart/belief) → Ihsan (excellence in worship)." },
      ],
      vocabulary: [
        { arabic: "إِسْلَام", transliteration: "islām", english: "Islam / submission", pos: "noun (m)" },
        { arabic: "إِيمَان", transliteration: "īmān", english: "faith", pos: "noun (m)" },
        { arabic: "إِحْسَان", transliteration: "iḥsān", english: "excellence in worship", pos: "noun (m)" },
        { arabic: "مَلَائِكَة", transliteration: "malāʾikah", english: "angels", pos: "noun (f.pl)" },
        { arabic: "قَدَر", transliteration: "qadar", english: "divine decree", pos: "noun (m)" },
      ],
      grammar: { title: "Three Levels of the Religion", titleArabic: "مَرَاتِبُ الدِّين", explanation: "1. Islam (Outward Practice): 5 Pillars — the body of religion\n2. Iman (Inner Belief): 6 Pillars — the heart of religion\n3. Ihsan (Excellence): Worship as if you see Allah — the soul of religion\n\nAll three must be present for a complete Muslim.", examples: [{ arabic: "أَرْكَانُ الإِسْلَامِ خَمْسَة — أَرْكَانُ الإِيمَانِ سِتَّة", translation: "Pillars of Islam: 5 — Pillars of Iman: 6" }] },
      exercises: [{ type: "choose", instruction: "Answer from Hadith 2.", instructionArabic: "أَجِبْ مِنَ الحَدِيث الثَّانِي.", items: [{ question: "How many pillars of Iman?", options: ["5", "6", "7", "3"], answer: 1 }, { question: "What does Ihsan mean?", options: ["Paying zakat", "Worshipping Allah as if you see Him", "Fasting Ramadan", "Hijrah"], answer: 1 }], answers: [1, 1] }],
    },
    {
      bookId: "hadith-arbaeen-nawawi", lessonNum: 3,
      title: "Hadith 5 — No Harm in Islam", titleArabic: "الحَدِيث الخَامِس: لَا ضَرَرَ وَلَا ضِرَار",
      description: "The comprehensive legal maxim: causing harm is prohibited — foundation of Islamic welfare.",
      pages: [
        { id: 1, arabic: "«لَا ضَرَرَ وَلَا ضِرَارَ.»\nخَمْسُ كَلِمَاتٍ تُؤَسِّسُ قَاعِدَةً فِقْهِيَّة عُظْمَى.", translation: "'There shall be no harm and no reciprocal harm.' Five words establishing a great legal maxim.", transliteration: "«Lā ḍarara wa lā ḍirār.»", note: "الضَّرَر = harm you initiate. الضِّرَار = retaliatory harm beyond what was done to you. Both prohibited." },
        { id: 2, arabic: "القَاعِدَة الفِقْهِيَّة: «الضَّرَرُ يُزَال»\nتَطْبِيقَات:\n• لَا يَحِلُّ لِتَاجِرٍ أَنْ يَغُشَّ فِي البَيْع.\n• لَا يَجُوزُ تَلْوِيثُ البِيئَة.", translation: "Legal maxim: 'Harm must be eliminated.' Applications: A merchant cannot cheat. / Environmental pollution is not permitted.", transliteration: "Al-qāʿidatu l-fiqhiyyah: «Aḍ-ḍararu yuzāl»", note: "This hadith covers: consumer protection, medical ethics, environmental law — Islam 1400 years ahead." },
      ],
      vocabulary: [
        { arabic: "ضَرَر", transliteration: "ḍarar", english: "harm / injury", pos: "noun (m)" },
        { arabic: "ضِرَار", transliteration: "ḍirār", english: "reciprocal harm", pos: "noun (m)" },
        { arabic: "قَاعِدَة فِقْهِيَّة", transliteration: "qāʿidah fiqhiyyah", english: "legal maxim", pos: "term" },
        { arabic: "غِشّ", transliteration: "ghishsh", english: "cheating in trade", pos: "noun (m)" },
      ],
      grammar: { title: "Five Major Legal Maxims", titleArabic: "القَوَاعِدُ الفِقْهِيَّةُ الخَمْس", explanation: "This hadith forms basis of one of the 5 Major Legal Maxims:\n1. الأُمُورُ بِمَقَاصِدِهَا (actions by purposes)\n2. اليَقِينُ لَا يُزَالُ بِالشَّكّ (certainty not removed by doubt)\n3. المَشَقَّةُ تَجْلِبُ التَّيْسِير (hardship brings ease)\n4. الضَّرَرُ يُزَال (harm must be removed — THIS HADITH)\n5. العَادَةُ مُحَكَّمَة (custom is authoritative)", examples: [{ arabic: "«الضَّرَرُ يُزَال.»", translation: "'Harm must be eliminated.' (Legal maxim)" }] },
      exercises: [{ type: "choose", instruction: "Apply the lesson.", instructionArabic: "طَبِّقِ الدَّرْس.", items: [{ question: "A seller mixes bad produce with good to deceive. This is:", options: ["Permitted in trade", "Prohibited — it causes harm (ḍarar)", "Only forbidden for Muslims", "Permitted if minor"], answer: 1 }], answers: [1] }],
    },
    {
      bookId: "hadith-arbaeen-nawawi", lessonNum: 4,
      title: "Hadith 6 — Halal, Haram & the Doubtful", titleArabic: "الحَدِيث السَّادِس: الحَلَال وَالحَرَام",
      description: "The foundational guide for everyday decision-making in Islamic life.",
      pages: [
        { id: 1, arabic: "«إِنَّ الحَلَالَ بَيِّنٌ، وَإِنَّ الحَرَامَ بَيِّنٌ،\nوَبَيْنَهُمَا أُمُورٌ مُشْتَبِهَاتٌ لَا يَعْلَمُهُنَّ كَثِيرٌ مِنَ النَّاسِ.»", translation: "'Indeed the lawful is clear and the forbidden is clear, and between them are doubtful matters which many people do not know.'", transliteration: "«Inna l-ḥalāla bayyinun, wa inna l-ḥarāma bayyinun, wa baynahumā umūrun mushtabihāt...»", note: "بَيِّن = absolutely clear. The grey area requires asking a qualified scholar." },
        { id: 2, arabic: "«فَمَنِ اتَّقَى الشُّبُهَاتِ فَقَدِ اسْتَبْرَأَ لِدِينِهِ وَعِرْضِهِ،\nوَمَنْ وَقَعَ فِي الشُّبُهَاتِ وَقَعَ فِي الحَرَام.\nكَالرَّاعِي يَرْعَى حَوْلَ الحِمَى يُوشِكُ أَنْ يَقَعَ فِيهِ.»", translation: "'Whoever avoids doubtful matters clears himself. Whoever falls into doubtful matters falls into forbidden — like a shepherd grazing near a protected zone, about to fall into it.'", transliteration: "«Faman ittaqā sh-shubuhāti faqadi stabraʾa...»", note: "The shepherd parable: grazing near forbidden = eventually crossing. Distance from haram = safety." },
      ],
      vocabulary: [
        { arabic: "حَلَال", transliteration: "ḥalāl", english: "lawful / permissible", pos: "adjective" },
        { arabic: "حَرَام", transliteration: "ḥarām", english: "forbidden", pos: "adjective" },
        { arabic: "شُبْهَة", transliteration: "shubhah", english: "doubtful matter", pos: "noun (f)", plural: "شُبُهَات" },
        { arabic: "بَيِّن", transliteration: "bayyinun", english: "clear / evident", pos: "adjective" },
        { arabic: "رَاعٍ", transliteration: "rāʿin", english: "shepherd", pos: "noun (m)" },
        { arabic: "حِمَى", transliteration: "ḥimā", english: "protected area", pos: "noun (m)" },
      ],
      grammar: { title: "Three Categories of Actions", titleArabic: "أَقْسَامُ الأَفْعَال", explanation: "Five rulings in Islamic Fiqh:\n1. وَاجِب — obligatory\n2. مُسْتَحَبّ — recommended\n3. مُبَاح — permissible (neutral)\n4. مَكْرُوه — disliked\n5. حَرَام — forbidden\n\nThis hadith focuses on three broad categories: halal, haram, and doubtful.", examples: [{ arabic: "الصَّلَاةُ وَاجِبَة — الكَذِبُ حَرَام — الأَكْلُ مُبَاح", translation: "Prayer = obligatory / Lying = forbidden / Eating = permissible" }] },
      exercises: [{ type: "choose", instruction: "Classify according to the hadith.", instructionArabic: "صَنِّفْ حَسَبَ الحَدِيث.", items: [{ question: "A food item — scholars differ on its permissibility. Best action?", options: ["Just eat it", "Ask a qualified scholar", "Assume halal", "Assume haram"], answer: 1 }], answers: [1] }],
    },
    {
      bookId: "hadith-arbaeen-nawawi", lessonNum: 5,
      title: "Hadith 9 — What You Can Do", titleArabic: "الحَدِيث التَّاسِع: مَا نَهَيْتُكُمْ عَنْهُ",
      description: "The principle of ease in Islam — obligations are within human capability.",
      pages: [
        { id: 1, arabic: "«مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ، وَمَا أَمَرْتُكُمْ بِهِ فَأْتُوا مِنْهُ مَا اسْتَطَعْتُمْ.»\nقَالَ اللهُ تَعَالَى: ﴿لَا يُكَلِّفُ اللهُ نَفْسًا إِلَّا وُسْعَهَا﴾ [البَقَرَة: ٢٨٦]", translation: "'What I have forbidden you — avoid it entirely. What I have commanded you — do of it what you are able.' / 'Allah does not burden a soul beyond that it can bear.' (2:286)", transliteration: "«Mā nahaytukum ʿanhu fajtanibūh, wa mā amartukum bihi faʾtū minhu ma staṭaʿtum.»", note: "Two different standards: PROHIBITIONS = 100% avoided. COMMANDS = do what you can (capacity-based)." },
        { id: 2, arabic: "فِقْهُ الحَدِيث:\n• النَّوَاهِي أَشَدُّ مِنَ الأَوَامِر — تُحَرَّمُ كُلِّيًّا\n• الأَوَامِر مَبْنِيَّةٌ عَلَى الاسْتِطَاعَة\n• مَنْ لَمْ يَسْتَطِعِ القِيَامَ فِي الصَّلَاة صَلَّى جَالِسًا\n• مَنْ لَمْ يَجِدِ الماءَ تَيَمَّم", translation: "Jurisprudence: Prohibitions are absolute. Commands are capacity-based. One who cannot stand in prayer prays sitting. One who has no water uses tayammum (earth purification).", transliteration: "Fiqhu l-ḥadīth.", note: "This hadith establishes the principle of تَيْسِير (ease) in Islam — one of the fundamental principles of Islamic jurisprudence." },
      ],
      vocabulary: [
        { arabic: "اسْتِطَاعَة", transliteration: "istiṭāʿah", english: "capability / ability", pos: "noun (f)" },
        { arabic: "نَهْي", transliteration: "nahy", english: "prohibition", pos: "noun (m)", plural: "نَوَاهِي" },
        { arabic: "أَمْر", transliteration: "amr", english: "command", pos: "noun (m)", plural: "أَوَامِر" },
        { arabic: "تَيْسِير", transliteration: "taysīr", english: "ease / facilitation", pos: "noun (m)" },
        { arabic: "وُسْع", transliteration: "wusʿ", english: "capacity / extent of ability", pos: "noun (m)" },
      ],
      grammar: { title: "The Principle of Ease in Islam", titleArabic: "مَبْدَأُ التَّيْسِير", explanation: "Allah's wisdom:\n• Prohibitions: absolute — because one forbidden act can corrupt everything\n• Commands: within capability — because forcing beyond ability creates hardship\n\nExamples of capacity-based commands:\n• Fasting: ill/traveler may break it and make up later\n• Hajj: only if physically and financially able\n• Salah: sitting if cannot stand, lying if cannot sit\n• Wudu: tayammum if no water or water would harm\n\n﴿يُرِيدُ اللهُ بِكُمُ اليُسْرَ وَلَا يُرِيدُ بِكُمُ العُسْرَ﴾\n'Allah intends ease for you, not hardship.' (2:185)", examples: [{ arabic: "﴿لَا يُكَلِّفُ اللهُ نَفْسًا إِلَّا وُسْعَهَا﴾", translation: "'Allah does not burden a soul beyond that it can bear.' (2:286)" }] },
      exercises: [{ type: "choose", instruction: "Apply the principle of ease.", instructionArabic: "طَبِّقْ مَبْدَأَ التَّيْسِير.", items: [{ question: "A sick person cannot fast Ramadan. What should they do?", options: ["Must fast regardless", "May break the fast and make it up later when able", "Must pay fidya only", "Their duty is waived permanently"], answer: 1 }], answers: [1] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // RIYAD AL-SALIHIN
  // ══════════════════════════════════════════════════════════════════════════
  "hadith-riyadh-salihin": [
    {
      bookId: "hadith-riyadh-salihin", lessonNum: 1,
      title: "Chapter on Sincerity (Ikhlas)", titleArabic: "بَابُ الإِخْلَاص",
      description: "The opening chapter of Riyad Al-Salihin on sincerity in all acts.",
      pages: [
        { id: 1, arabic: "﴿وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللهَ مُخْلِصِينَ لَهُ الدِّينَ﴾ [البَيِّنَة: ٥]\n«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ.» [البُخَارِي وَمُسْلِم]", translation: "'They were not commanded except to worship Allah, sincere to Him in religion.' (98:5) / 'Actions are only by intentions.' (Bukhari & Muslim)", transliteration: "﴿Wa mā umirū illā li-yaʿbudu llāha mukhlisīna lahu d-dīn﴾", note: "مُتَّفَقٌ عَلَيْه = 'Agreed upon' — recorded by both Bukhari AND Muslim, the highest level of authenticity." },
        { id: 2, arabic: "الخَطَر الأَكْبَر: الرِّيَاء\nعَنْ أَبِي هُرَيْرَة: «إِنَّ أَوَّلَ النَّاسِ يُقْضَى يَوْمَ القِيَامَةِ عَلَيْهِ رَجُلٌ اسْتُشْهِدَ...\nقَالَ: كَذَبْتَ! وَلَكِنَّكَ قَاتَلْتَ لِأَنْ يُقَالَ: جَرِيءٌ. فَقَدْ قِيلَ. ثُمَّ أُمِرَ بِهِ فَسُحِبَ عَلَى وَجْهِهِ.»", translation: "Greatest danger: Showing off (Riya). Abu Hurayrah narrated: 'The first judged on Judgment Day will be a martyr...' Allah says: 'You lied! You fought so people would call you brave. That was said.' Then he is dragged on his face into the Fire.", transliteration: "Al-khatarun l-akbar: ar-riyāʾ.", note: "A martyr goes to hellfire because his intention was for worldly praise. CHECK your intentions before every act." },
      ],
      vocabulary: [
        { arabic: "إِخْلَاص", transliteration: "ikhlāṣ", english: "sincerity / pure devotion to Allah", pos: "noun (m)" },
        { arabic: "رِيَاء", transliteration: "riyāʾ", english: "showing off in worship", pos: "noun (m)" },
        { arabic: "تَقْوَى", transliteration: "taqwā", english: "piety / God-consciousness", pos: "noun (f)" },
        { arabic: "شَهِيد", transliteration: "shahīd", english: "martyr", pos: "noun (m)", plural: "شُهَدَاء" },
      ],
      grammar: { title: "Ikhlas vs Riya", titleArabic: "الإِخْلَاصُ مُقَابِلَ الرِّيَاء", explanation: "1. نِيَّة خَالِصَة (Pure for Allah): full reward\n2. نِيَّة رِيَاء (For people's praise): nullifies reward, may be shirk\n3. نِيَّة مُشْتَرَكَة (Mixed): portion for people rejected\n\nThe antidote:\n«اللَّهُمَّ إِنِّي أَعُوذُ بِكَ أَنْ أُشْرِكَ بِكَ شَيْئًا أَعْلَمُهُ»\n'O Allah, I seek refuge from associating with You what I know of.'", examples: [{ arabic: "مَنْ صَلَّى لِلهِ فَلَهُ الأَجْر — مَنْ صَلَّى لِلنَّاسِ لَا أَجْرَ لَهُ", translation: "Whoever prays for Allah = reward / Whoever prays for people = no reward" }] },
      exercises: [{ type: "choose", instruction: "Test your understanding.", instructionArabic: "اِخْتَبِرْ فَهْمَكَ.", items: [{ question: "مُتَّفَقٌ عَلَيْه means:", options: ["Narrated by Bukhari only", "Narrated by both Bukhari and Muslim", "Weak hadith", "Narrated by Muslim only"], answer: 1 }], answers: [1] }],
    },
    {
      bookId: "hadith-riyadh-salihin", lessonNum: 2,
      title: "Chapter on Repentance (Tawbah)", titleArabic: "بَابُ التَّوْبَة",
      description: "Allah's door of repentance is always open — learn the conditions of Tawbah.",
      pages: [
        { id: 1, arabic: "﴿قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنْفُسِهِمْ لَا تَقْنَطُوا مِنْ رَحْمَةِ اللهِ، إِنَّ اللهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا﴾ [الزُّمَر: ٥٣]", translation: "'Say: O My servants who have transgressed — do not despair of the mercy of Allah. Indeed, Allah forgives ALL sins.' (Az-Zumar 39:53)", transliteration: "Qul yā ʿibādī lladhīna asrafū ʿalā anfusihim lā taqnaṭū min raḥmati llāh...", note: "جَمِيعًا = ALL sins. No sin is too great for Allah to forgive with sincere Tawbah." },
        { id: 2, arabic: "شُرُوطُ التَّوْبَة الصَّادِقَة:\n١. الإِقْلَاع: التَّوَقُّف عَنِ الذَّنْب فَوْرًا\n٢. النَّدَم: الحُزْن وَالأَسَف القَلْبِيّ\n٣. العَزْم: العَزْمُ عَلَى عَدَم العَوْدَة\nإِنْ تَعَلَّقَ بِحَقِّ آدَمِيّ: + رَدُّ الحُقُوق / طَلَبُ العَفْو", translation: "Conditions of sincere Tawbah: 1. Stop the sin immediately / 2. Genuine regret in the heart / 3. Firm resolve not to return. If involving a human right: + return what is owed / seek their forgiveness.", transliteration: "Shurūṭu t-tawbati ṣ-ṣādiqah.", note: "Tawbah is accepted anytime before: the sun rises from the west (sign of Last Hour) OR the soul reaches the throat at death." },
      ],
      vocabulary: [
        { arabic: "تَوْبَة", transliteration: "tawbah", english: "repentance / returning to Allah", pos: "noun (f)" },
        { arabic: "مَغْفِرَة", transliteration: "maghfirah", english: "forgiveness", pos: "noun (f)" },
        { arabic: "ذَنْب", transliteration: "dhanb", english: "sin", pos: "noun (m)", plural: "ذُنُوب" },
        { arabic: "نَدَم", transliteration: "nadam", english: "regret / remorse", pos: "noun (m)" },
        { arabic: "إِقْلَاع", transliteration: "iqlāʿ", english: "ceasing the sin", pos: "noun (m)" },
      ],
      grammar: { title: "Conditions of Tawbah", titleArabic: "شُرُوطُ التَّوْبَة", explanation: "Three conditions (all three must be met):\n1. Stop the sin immediately\n2. Genuine regret in the heart\n3. Firm resolve not to return\n\n+4th if involving a human right: make it right (return stolen property / seek forgiveness)\n\n﴿إِنَّ اللهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ المُتَطَهِّرِين﴾\n'Indeed Allah loves those who constantly repent.' (2:222)", examples: [{ arabic: "«لَوْ أَخْطَأْتُمْ حَتَّى تَبْلُغَ خَطَايَاكُمُ السَّمَاءَ، ثُمَّ تُبْتُمْ، لَتَابَ اللهُ عَلَيْكُمْ.»", translation: "'If you sinned until your sins reached the sky, then repented — Allah would accept your repentance.' (Ibn Majah)" }] },
      exercises: [{ type: "choose", instruction: "Answer about Tawbah.", instructionArabic: "أَجِبْ عَنِ التَّوْبَة.", items: [{ question: "What is the FIRST condition of Tawbah?", options: ["Feeling guilty", "Stopping the sin immediately", "Telling someone", "Making duaa"], answer: 1 }, { question: "Is there a sin too great for Allah to forgive with sincere Tawbah?", options: ["Yes — major sins", "No — Allah forgives ALL sins", "Only small sins forgiven", "Only with a scholar's duaa"], answer: 1 }], answers: [1, 1] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // HADITH SCIENCES
  // ══════════════════════════════════════════════════════════════════════════
  "hadith-sciences": [
    {
      bookId: "hadith-sciences", lessonNum: 1,
      title: "Introduction to Hadith Sciences", titleArabic: "مُقَدِّمَةٌ فِي عِلْمِ مُصْطَلَحِ الحَدِيث",
      description: "What is Hadith? The importance of Isnad and why it is unique to Islam.",
      pages: [
        { id: 1, arabic: "الحَدِيثُ اصْطِلَاحًا: مَا أُضِيفَ إِلَى النَّبِيِّ ﷺ مِنْ قَوْلٍ أَوْ فِعْلٍ أَوْ تَقْرِيرٍ أَوْ صِفَة.\nقَالَ ابنُ المُبَارَك: «الإِسْنَادُ مِنَ الدِّين — لَوْلَا الإِسْنَادُ لَقَالَ مَنْ شَاءَ مَا شَاء.»", translation: "Hadith technically: what is attributed to the Prophet ﷺ of words, actions, approvals, or descriptions. Ibn al-Mubarak: 'Isnad is part of the religion — without it, anyone could say whatever they wish.'", transliteration: "Al-ḥadīthu iṣṭilāḥan: mā uḍīfa ilā n-nabiyyi ﷺ min qawlin aw fiʿlin aw taqrīrin aw ṣifah.", note: "The Isnad is Islam's unique contribution to historical verification — no other tradition preserved history with such rigor." },
        { id: 2, arabic: "أَجْزَاءُ الحَدِيث:\n• الإِسْنَادُ: سِلْسِلَةُ الرُّوَاة\n• المَتْن: نَصُّ الحَدِيث\nتَصْنِيفُ الحَدِيث بِالصِّحَّة:\n• صَحِيح — حَسَن — ضَعِيف — مَوْضُوع (مَكْذُوب)", translation: "Parts of a hadith: Isnād (chain of narrators) / Matn (text). Classification by authenticity: Sahih (authentic) / Hasan (good) / Daʿīf (weak) / Mawḍūʿ (fabricated)", transliteration: "Ajzāʾu l-ḥadīth: al-isnādu wa l-matn.", note: "Imam Bukhari memorized 600,000 hadiths and selected only 7,275 for his Sahih — after rigorous verification of every narrator." },
        { id: 3, arabic: "شُرُوطُ الحَدِيثِ الصَّحِيح الخَمْسَة:\n١. اتِّصَالُ السَّنَد — ٢. عَدَالَةُ الرُّوَاة — ٣. ضَبْطُ الرُّوَاة\n٤. انْتِفَاءُ العِلَّة — ٥. انْتِفَاءُ الشُّذُوذ\nكُتُبُ الصِّحَاح السِّتَّة: البُخَارِي — مُسْلِم — أَبُو دَاوُد — التِّرْمِذِي — النَّسَائِي — ابنُ مَاجَه", translation: "Five conditions for Sahih: 1. Connected chain / 2. Reliable narrators / 3. Good memory / 4. No hidden defect / 5. No irregularity. The Six Books: Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah.", transliteration: "Shurūṭu l-ḥadīthi ṣ-ṣaḥīḥ al-khamsah.", note: "صَحِيح البُخَارِي وَمُسْلِم = most authentic books after the Quran." },
      ],
      vocabulary: [
        { arabic: "إِسْنَاد", transliteration: "isnād", english: "chain of narrators", pos: "noun (m)" },
        { arabic: "مَتْن", transliteration: "matn", english: "text of the hadith", pos: "noun (m)" },
        { arabic: "رَاوِي", transliteration: "rāwī", english: "narrator", pos: "noun (m)", plural: "رُوَاة" },
        { arabic: "صَحِيح", transliteration: "ṣaḥīḥ", english: "authentic / sound", pos: "adjective" },
        { arabic: "ضَعِيف", transliteration: "ḍaʿīf", english: "weak (hadith)", pos: "adjective" },
        { arabic: "مَوْضُوع", transliteration: "mawḍūʿ", english: "fabricated (hadith)", pos: "adjective" },
      ],
      grammar: { title: "Hadith Classification", titleArabic: "تَصْنِيفُ الحَدِيث", explanation: "By authenticity:\n1. صَحِيح: authentic — all 5 conditions met\n2. حَسَن: good — slightly lower standard\n3. ضَعِيف: weak — condition(s) not met\n4. مَوْضُوع: fabricated — absolutely rejected\n\nBy transmission:\n1. مُتَوَاتِر: mass-transmitted — certain knowledge\n2. آحَاد: individual narration — requires authentication", examples: [{ arabic: "صَحِيح البُخَارِي وَصَحِيح مُسْلِم: أَصَحُّ الكُتُب بَعْدَ القُرْآن", translation: "Sahih Bukhari and Sahih Muslim: most authentic books after the Quran" }] },
      exercises: [{ type: "match", instruction: "Match the term.", instructionArabic: "طَابِقْ بَيْنَ المُصْطَلَحَات.", items: [{ arabic: "إِسْنَاد", english: "Chain of narrators" }, { arabic: "مَتْن", english: "Text of the hadith" }, { arabic: "صَحِيح", english: "Authentic hadith" }, { arabic: "مَوْضُوع", english: "Fabricated hadith" }], answers: [0, 1, 2, 3] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // FIQH ESSENTIALS
  // ══════════════════════════════════════════════════════════════════════════
  "fiqh-essentials": [
    {
      bookId: "fiqh-essentials", lessonNum: 1,
      title: "Introduction to Fiqh & Taharah", titleArabic: "مُقَدِّمَة فِي الفِقْهِ وَالطَّهَارَة",
      description: "What is Fiqh, its four schools, and the Islamic concept of purification.",
      pages: [
        { id: 1, arabic: "الفِقْهُ لُغَةً: الفَهْمُ وَالإِدْرَاك.\nالفِقْهُ اصْطِلَاحًا: مَعْرِفَةُ الأَحْكَامِ الشَّرْعِيَّةِ العَمَلِيَّة مِنْ أَدِلَّتِهَا التَّفْصِيلِيَّة.\nالمَذَاهِبُ الفِقْهِيَّةُ الأَرْبَعَة: الحَنَفِيّ — المَالِكِيّ — الشَّافِعِيّ — الحَنْبَلِيّ", translation: "Fiqh linguistically: understanding and comprehension. Technically: knowledge of practical Sharia rulings from their detailed evidences. The four schools: Hanafi / Maliki / Shafi'i / Hanbali", transliteration: "Al-fiqhu lughatan: al-fahmu wa l-idrāk.", note: "All four schools are valid Sunni madhabs. Scholars say: following a madhab is part of humility and order." },
        { id: 2, arabic: "الطَّهَارَة — مَفْتَاحُ الصَّلَاة:\n«الطُّهُورُ شَطْرُ الإِيمَان.» [مُسْلِم]\nأَنْوَاعُ الطَّهَارَة:\n• طَهَارَة الحَدَث الأَصْغَر: الوُضُوء\n• طَهَارَة الحَدَث الأَكْبَر: الغُسْل\n• طَهَارَة النَّجَاسَة: إِزَالَة النَّجَاسَة\n• التَّيَمُّم: عِنْدَ غِيَاب المَاء", translation: "'Purification is half of faith.' (Muslim). Types: Minor purification (wudu) / Major purification (ghusl) / Removing physical impurity / Tayammum (when no water)", transliteration: "«Aṭ-ṭahūru shaṭru l-īmān.»", note: "شَطْر الإِيمَان = half of faith. Taharah is the foundation of all worship — prayer, Quran recitation, tawaf." },
        { id: 3, arabic: "أَقْسَامُ المَاء:\n• طَهُور (مُطَهِّر): يَرْفَعُ الحَدَث وَيُزِيلُ النَّجَاسَة — مَاءُ المَطَر وَالنَّهَر\n• طَاهِر (غَيْرُ مُطَهِّر): نَظِيف لَكِنْ لَا يَصِحُّ الوُضُوء بِهِ — كَعَصِير\n• نَجِس: لَا يَجُوزُ التَّطَهُّر بِهِ — مَاءٌ تَغَيَّرَ بِنَجَاسَة", translation: "Water categories: Purifying (ṭahūr) — removes hadath, valid for wudu / Pure non-purifying (ṭāhir) — clean but invalid for wudu (juice) / Impure (najis) — changed by filth, invalid", transliteration: "Aqsāmu l-māʾ: ṭahūr — ṭāhir — najis.", note: "All naturally-occurring water is ṭahūr until its physical properties change from impurity." },
      ],
      vocabulary: [
        { arabic: "فِقْه", transliteration: "fiqh", english: "Islamic jurisprudence", pos: "noun (m)" },
        { arabic: "مَذْهَب", transliteration: "madhhab", english: "school of jurisprudence", pos: "noun (m)", plural: "مَذَاهِب" },
        { arabic: "طَهَارَة", transliteration: "ṭahārah", english: "purification / purity", pos: "noun (f)" },
        { arabic: "حَدَث", transliteration: "ḥadath", english: "ritual impurity (state)", pos: "noun (m)" },
        { arabic: "نَجَاسَة", transliteration: "najāsah", english: "physical impurity", pos: "noun (f)" },
        { arabic: "طَهُور", transliteration: "ṭahūr", english: "purifying water (highest grade)", pos: "adjective" },
      ],
      grammar: { title: "Conditions of Valid Prayer", titleArabic: "شُرُوطُ الصَّلَاة", explanation: "Purification is condition #1 for valid prayer. The 8 conditions:\n1. Islam\n2. Sound mind\n3. Puberty (for obligation)\n4. Prayer time entered\n5. Taharah (wudu/ghusl)\n6. Covering the awrah\n7. Facing Qiblah\n8. Niyyah (intention)\n\nIf any condition missing → prayer is INVALID.", examples: [{ arabic: "«لَا تُقْبَلُ صَلَاةٌ بِغَيْرِ طَهُور.»", translation: "'No prayer accepted without purification.' (Muslim)" }] },
      exercises: [{ type: "choose", instruction: "Test your Fiqh knowledge.", instructionArabic: "اِخْتَبِرْ مَعْرِفَتَكَ.", items: [{ question: "What removes minor hadath?", options: ["Ghusl", "Wudu", "Tayammum (only without water)", "Washing hands"], answer: 1 }, { question: "Can you perform wudu with fruit juice?", options: ["Yes", "No — only ṭahūr water is valid", "Yes if pure", "Scholars differ"], answer: 1 }], answers: [1, 1] }],
    },
    {
      bookId: "fiqh-essentials", lessonNum: 2,
      title: "How to Perform Wudu", titleArabic: "كَيْفِيَّةُ الوُضُوء",
      description: "Step-by-step guide to the obligatory acts and sunnahs of wudu.",
      pages: [
        { id: 1, arabic: "فَرَائِضُ الوُضُوءِ مِنَ القُرْآن:\n﴿فَاغْسِلُوا وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى المَرَافِقِ وَامْسَحُوا بِرُؤُوسِكُمْ وَأَرْجُلَكُمْ إِلَى الكَعْبَيْنِ﴾ [المَائِدَة: ٦]", translation: "Obligations from the Quran: 'Wash your faces and your forearms to the elbows, wipe your heads, and wash your feet to the ankles.' (5:6)", transliteration: "Farāʾiḍu l-wuḍūʾ mina l-Qurʾān.", note: "Quran specifies 4 acts. Scholars add niyyah and tartīb (order) making 6 total." },
        { id: 2, arabic: "خُطُوَاتُ الوُضُوء الكَامِل:\n١. النِّيَّة — ٢. بِسْمِ اللهِ — ٣. غَسْلُ الكَفَّيْن ٣×\n٤. المَضْمَضَة وَالاسْتِنْشَاق ٣× — ٥. غَسْلُ الوَجْه ٣×\n٦. غَسْلُ اليَدَيْن إِلَى المِرْفَقَيْن (يُمْنَى ثُمَّ يُسْرَى) ٣×\n٧. مَسْحُ الرَّأْسِ وَالأُذُنَيْن — ٨. غَسْلُ الرِّجْلَيْن (يُمْنَى ثُمَّ يُسْرَى) ٣×", translation: "Complete wudu steps: 1.Niyyah 2.Bismillah 3.Wash palms 3x 4.Rinse mouth+nose 3x 5.Face 3x 6.Arms to elbow (R then L) 3x 7.Wipe head+ears 8.Feet (R then L) 3x", transliteration: "Khuṭuwātu l-wuḍūʾi l-kāmil.", note: "Washing once = valid (fard). Twice = better. THREE times = Sunnah. More than 3 = prohibited (isrāf in water)." },
        { id: 3, arabic: "نَوَاقِضُ الوُضُوء:\n• كُلُّ مَا خَرَجَ مِنَ السَّبِيلَيْن\n• النَّوْم المُسْتَغْرِق (فَقْدَانُ الوَعْي)\n• زَوَالُ العَقْل\nدُعَاءُ بَعْدَ الوُضُوء:\n«أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ»", translation: "Nullifiers: anything from private parts / deep sleep (loss of consciousness) / loss of mind. Duaa after wudu: 'I testify there is no god but Allah and Muhammad is His servant and Messenger.'", transliteration: "Nawāqiḍu l-wuḍūʾ.", note: "The Prophet ﷺ said: whoever makes wudu and says the shahada — all 8 gates of Paradise are opened for him." },
      ],
      vocabulary: [
        { arabic: "فَرِيضَة", transliteration: "farīḍah", english: "obligatory act", pos: "noun (f)", plural: "فَرَائِض" },
        { arabic: "مَضْمَضَة", transliteration: "maḍmaḍah", english: "rinsing the mouth", pos: "noun (f)" },
        { arabic: "اسْتِنْشَاق", transliteration: "istinshāq", english: "inhaling water into nose", pos: "noun (m)" },
        { arabic: "مِرْفَق", transliteration: "mirfaq", english: "elbow", pos: "noun (m)", plural: "مَرَافِق" },
        { arabic: "كَعْب", transliteration: "kaʿb", english: "ankle", pos: "noun (m)", plural: "كُعُوب" },
        { arabic: "نَاقِض", transliteration: "nāqiḍ", english: "nullifier of wudu", pos: "noun (m)", plural: "نَوَاقِض" },
      ],
      grammar: { title: "Obligatory vs Sunnah Acts", titleArabic: "الفَرَائِضُ وَالسُّنَن", explanation: "OBLIGATORY (Fard) — wudu invalid without:\n1. Niyyah\n2. Face\n3. Arms to elbows\n4. Wiping head\n5. Feet to ankles\n6. Order (sequence)\n\nSUNNAH — increases reward:\n• Bismillah / Wash palms first / Rinse mouth+nose / Wipe ears / 3 times each / Start with right", examples: [{ arabic: "«اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ المُتَطَهِّرِين»", translation: "'O Allah, make me among those who repent and those who purify themselves.' — duaa after wudu" }] },
      exercises: [{ type: "fill_blank", instruction: "List the obligatory wudu acts.", instructionArabic: "اُذْكُرِ الفَرَائِضَ.", items: [{ sentence: "١. ___", blank: 1, hint: "intention" }, { sentence: "٢. غَسْلُ ___", blank: 1, hint: "the face" }, { sentence: "٣. مَسْح ___", blank: 1, hint: "the head" }, { sentence: "٤. غَسْلُ ___", blank: 1, hint: "two feet" }], answers: ["النِّيَّة", "الوَجْه", "الرَّأْس", "الرِّجْلَيْن"] }],
    },
    {
      bookId: "fiqh-essentials", lessonNum: 3,
      title: "The Five Daily Prayers", titleArabic: "الصَّلَوَاتُ الخَمْس",
      description: "Learn the times, rak'ahs, and essential method of the five daily prayers.",
      pages: [
        { id: 1, arabic: "أَوْقَاتُ الصَّلَوَاتِ الخَمْس:\n• الفَجْر: طُلُوعُ الفَجْر → الشُّرُوق\n• الظُّهْر: الزَّوَال → أَنْ يَصِيرَ ظِلُّ الشَّيْء مِثْلَهُ\n• العَصْر: بَعْدَ الظُّهْر → الغُرُوب\n• المَغْرِب: الغُرُوب → غِيَابُ الشَّفَق\n• العِشَاء: بَعْدَ المَغْرِب → مُنْتَصَف اللَّيْل", translation: "Prayer times: Fajr (dawn→sunrise) / Dhuhr (zenith→shadow equals object) / Asr (Dhuhr end→sunset) / Maghrib (sunset→red twilight gone) / Isha (Maghrib end→midnight)", transliteration: "Awqātu ṣ-ṣalawāti l-khams.", note: "Prayer times are natural markers set by Allah — the best deed is praying on time." },
        { id: 2, arabic: "عَدَدُ الرَّكَعَات:\n• الفَجْر: ٢ فَرْض\n• الظُّهْر: ٤ فَرْض\n• العَصْر: ٤ فَرْض\n• المَغْرِب: ٣ فَرْض\n• العِشَاء: ٤ فَرْض\nالمَجْمُوع: ١٧ رَكْعَة فَرْضًا يَوْمِيًّا", translation: "Rak'ahs: Fajr 2 / Dhuhr 4 / Asr 4 / Maghrib 3 / Isha 4. Total: 17 obligatory rak'ahs daily.", transliteration: "ʿAdadu r-rakʿāt.", note: "With sunnah prayers added: Fajr (+2), Dhuhr (+4 before, +2 after), Maghrib (+2 after), Isha (+2 after), Witr (+3)." },
      ],
      vocabulary: [
        { arabic: "فَجْر", transliteration: "fajr", english: "dawn / Fajr prayer", pos: "noun (m)" },
        { arabic: "ظُهْر", transliteration: "ẓuhr", english: "noon / Dhuhr prayer", pos: "noun (m)" },
        { arabic: "عَصْر", transliteration: "ʿaṣr", english: "afternoon / Asr prayer", pos: "noun (m)" },
        { arabic: "مَغْرِب", transliteration: "maghrib", english: "sunset / Maghrib prayer", pos: "noun (m)" },
        { arabic: "عِشَاء", transliteration: "ʿishāʾ", english: "night / Isha prayer", pos: "noun (m)" },
        { arabic: "رَكْعَة", transliteration: "rakʿah", english: "unit of prayer", pos: "noun (f)", plural: "رَكَعَات" },
        { arabic: "زَوَال", transliteration: "zawāl", english: "zenith (when sun is at highest)", pos: "noun (m)" },
      ],
      grammar: { title: "Pillars of Prayer (أَرْكَانُ الصَّلَاة)", titleArabic: "أَرْكَانُ الصَّلَاة", explanation: "14 obligatory pillars:\n1. Niyyah 2. Opening Takbir 3. Standing (qiyam) 4. Al-Fatiha 5. Rukuʿ (bowing) 6. Rising from rukuʿ 7. First sujūd 8. Sitting between sujūds 9. Second sujūd 10. Final sitting 11. Final tashahhud 12. Salah on Prophet 13. Taslim (salaam) 14. Order\n\nMissing any one = prayer INVALID.", examples: [{ arabic: "«أَوَّلُ مَا يُحَاسَبُ بِهِ العَبْدُ يَوْمَ القِيَامَةِ الصَّلَاة»", translation: "'The first thing accounted for on Judgment Day is prayer.'" }] },
      exercises: [{ type: "fill_blank", instruction: "Complete the prayer times.", instructionArabic: "أَكْمِلْ أَوْقَاتَ الصَّلَاة.", items: [{ sentence: "الفَجْر: مِنْ طُلُوعِ ___ إِلَى الشُّرُوق.", blank: 1, hint: "dawn" }, { sentence: "المَغْرِب: بَعْدَ ___ الشَّمْس.", blank: 1, hint: "setting" }], answers: ["الفَجْر الصَّادِق", "غُرُوب"] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // COMPLETE GUIDE TO SALAH
  // ══════════════════════════════════════════════════════════════════════════
  "fiqh-salah-complete": [
    {
      bookId: "fiqh-salah-complete", lessonNum: 1,
      title: "Why We Pray — The Importance of Salah", titleArabic: "فَضْلُ الصَّلَاة وَأَهَمِّيَّتُهَا",
      description: "Understand the profound importance of Salah — the pillar of religion.",
      pages: [
        { id: 1, arabic: "«الصَّلَاةُ عَمُودُ الدِّين.»\n﴿إِنَّ الصَّلَاةَ كَانَتْ عَلَى المُؤْمِنِينَ كِتَابًا مَوْقُوتًا﴾ [النِّسَاء: ١٠٣]\n«أَوَّلُ مَا يُحَاسَبُ بِهِ العَبْدُ يَوْمَ القِيَامَةِ الصَّلَاة.»", translation: "'Prayer is the pillar of religion.' / 'Prayer has been decreed upon believers at specified times.' (4:103) / 'The first thing questioned about on Judgment Day is prayer.'", transliteration: "«Aṣ-ṣalātu ʿamūdu d-dīn.»", note: "Prayer was commanded directly by Allah to the Prophet ﷺ during the Isra and Miraj — unlike other pillars given through Jibreel." },
        { id: 2, arabic: "مَنَافِعُ الصَّلَاة:\n﴿إِنَّ الصَّلَاةَ تَنْهَى عَنِ الفَحْشَاءِ وَالمُنْكَرِ﴾\nمِثْلُ نَهْرٍ يَغْسِلُ جَسَدَهُ خَمْسَ مَرَّاتٍ يَوْمِيًّا — لَا يَبْقَى وَسَخ.", translation: "'Prayer prevents immorality and wrongdoing.' (29:45) / Like a river washing the body 5 times daily — no dirt remains.", transliteration: "Manāfiʿu ṣ-ṣalāh.", note: "The Prophet ﷺ: if one had a river at his door and bathed 5 times, would any dirt remain? So too prayer purifies." },
      ],
      vocabulary: [
        { arabic: "عَمُود", transliteration: "ʿamūd", english: "pillar / column", pos: "noun (m)" },
        { arabic: "مَوْقُوت", transliteration: "mawqūt", english: "at specified times", pos: "adjective" },
        { arabic: "فَحْشَاء", transliteration: "faḥshāʾ", english: "indecency / immorality", pos: "noun (f)" },
        { arabic: "مُنْكَر", transliteration: "munkar", english: "wrongdoing / evil", pos: "noun (m)" },
      ],
      grammar: { title: "Salah in the Quran", titleArabic: "الصَّلَاةُ فِي القُرْآن", explanation: "Salah mentioned 98 times in the Quran. Key commands:\n1. ﴿أَقِمِ الصَّلَاةَ لِذِكْرِي﴾ 'Establish prayer for My remembrance.' (20:14)\n2. ﴿وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ﴾ paired 82 times\n3. ﴿وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ﴾ 'Seek help through patience and prayer.' (2:45)", examples: [{ arabic: "﴿أَقِمِ الصَّلَاةَ لِذِكْرِي﴾", translation: "'Establish prayer for My remembrance.' (Ta-Ha 20:14)" }] },
      exercises: [{ type: "choose", instruction: "About Salah.", instructionArabic: "أَجِبْ عَنِ الصَّلَاة.", items: [{ question: "What is the first thing questioned about on Judgment Day?", options: ["Zakat", "Salah", "Fasting", "Hajj"], answer: 1 }], answers: [1] }],
    },
    {
      bookId: "fiqh-salah-complete", lessonNum: 2,
      title: "Opening of Prayer — Takbir to Fatiha", titleArabic: "افْتِتَاحُ الصَّلَاة",
      description: "Master the opening of prayer: the takbir, opening duaa, and Al-Fatiha.",
      pages: [
        { id: 1, arabic: "تَكْبِيرَةُ الإِحْرَام:\n«اللهُ أَكْبَرُ» — يَرْفَعُ يَدَيْهِ إِلَى حَذْوِ مَنْكِبَيْهِ.\nثُمَّ يَضَعُ يَمِينَهُ عَلَى يَسَارِهِ عَلَى صَدْرِهِ.", translation: "Opening Takbir: 'Allahu Akbar' — raises hands to shoulders. Then places right hand over left on chest.", transliteration: "Takbīratu l-iḥrām: «Allāhu Akbar»", note: "Once you say Allahu Akbar, you are 'in' prayer — speaking, eating, moving are now prohibited." },
        { id: 2, arabic: "دُعَاءُ الاسْتِفْتَاح:\n«سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَهَ غَيْرُك.»\nثُمَّ: أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيم.\nثُمَّ: بِسْمِ اللهِ الرَّحْمَٰنِ الرَّحِيم.\nثُمَّ: الفَاتِحَة (فَرِيضَة فِي كُلِّ رَكْعَة)", translation: "Opening Duaa: 'Glory to You O Allah, with Your praise. Blessed is Your name, exalted is Your majesty. There is no god but You.' Then: taawwudh → Bismillah → Al-Fatiha (obligatory in every rak'ah)", transliteration: "«Subḥānaka llāhumma wa bi-ḥamdika...»", note: "This duaa is Sunnah. Al-Fatiha is Fard in EVERY rak'ah — prayer is invalid without it." },
      ],
      vocabulary: [
        { arabic: "تَكْبِيرَة الإِحْرَام", transliteration: "takbīratu l-iḥrām", english: "opening Allahu Akbar", pos: "term" },
        { arabic: "اسْتِفْتَاح", transliteration: "istiftāḥ", english: "opening supplication", pos: "noun (m)" },
        { arabic: "آمِين", transliteration: "āmīn", english: "Amin (accept O Allah)", pos: "supplication" },
      ],
      grammar: { title: "Silent vs Audible Prayers", titleArabic: "الصَّلَوَاتُ السِّرِّيَّةُ وَالجَهْرِيَّة", explanation: "AUDIBLE (Jahri): Fajr (both), Maghrib (first 2), Isha (first 2), Jumu'ah (both)\nSILENT (Sirri): Dhuhr (all 4), Asr (all 4)\n\nNight voluntary prayers = audible. Day voluntary prayers = silent.", examples: [{ arabic: "صَلَاةُ الفَجْرِ جَهْرِيَّة — صَلَاةُ الظُّهْرِ سِرِّيَّة", translation: "Fajr = audible / Dhuhr = silent" }] },
      exercises: [{ type: "fill_blank", instruction: "Complete the Opening Duaa.", instructionArabic: "أَكْمِلْ دُعَاءَ الاسْتِفْتَاح.", items: [{ sentence: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ ___ وَتَعَالَى جَدُّكَ.", blank: 1, hint: "Your Name" }, { sentence: "وَلَا إِلَهَ ___.", blank: 1, hint: "except You" }], answers: ["اسْمُكَ", "غَيْرُك"] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // AQEEDAH BEGINNERS
  // ══════════════════════════════════════════════════════════════════════════
  "aqeedah-beginners": [
    {
      bookId: "aqeedah-beginners", lessonNum: 1,
      title: "Introduction to Islamic Creed", titleArabic: "مُقَدِّمَةٌ فِي عِلْمِ العَقِيدَة",
      description: "What is Aqeedah, why it matters, and the six pillars of Iman.",
      pages: [
        { id: 1, arabic: "العَقِيدَةُ: الإِيمَانُ الجَازِمُ الَّذِي لَا يَقْبَلُ الشَّكَّ وَلَا التَّرَدُّد.\nأَهَمِّيَّتُها: أَصْلُ كُلِّ عَمَل — العَمَلُ بِدُونِ عَقِيدَة كَبِنَاءٍ بِغَيْرِ أَسَاس.", translation: "Aqeedah: firm belief that accepts no doubt. Importance: the foundation of every deed — actions without creed are like a building without foundation.", transliteration: "Al-ʿaqīdah: al-īmānu l-jāzimu lladhī lā yaqbalu sh-shakka wa lā t-taraddud.", note: "عَقِيدَة from عَقَدَ (to tie firmly). Your creed is what your heart is firmly tied to." },
        { id: 2, arabic: "أَرْكَانُ الإِيمَانِ السِّتَّة:\n١. الإِيمَانُ بِاللهِ\n٢. الإِيمَانُ بِالمَلَائِكَة\n٣. الإِيمَانُ بِالكُتُب\n٤. الإِيمَانُ بِالرُّسُل\n٥. الإِيمَانُ بِاليَوْمِ الآخِر\n٦. الإِيمَانُ بِالقَدَر خَيْرِهِ وَشَرِّهِ", translation: "Six Pillars of Iman: 1. Belief in Allah / 2. Angels / 3. Revealed Books / 4. Prophets / 5. Last Day / 6. Divine Decree (good and evil)", transliteration: "Arkānu l-Īmāni s-sittah.", note: "These come from the Hadith of Jibril. Denying any one takes a person outside Islam." },
        { id: 3, arabic: "التَّوْحِيد — أَسَاسُ العَقِيدَة:\nتَوْحِيدُ الرُّبُوبِيَّة: اللهُ هُوَ الخَالِقُ الرَّازِقُ المُدَبِّر.\nتَوْحِيدُ الأُلُوهِيَّة: عِبَادَةُ اللهِ وَحْدَهُ — مَعْنَى لَا إِلَهَ إِلَّا اللهُ.\nتَوْحِيدُ الأَسْمَاءِ وَالصِّفَات: الإِيمَانُ بِأَسْمَائِهِ كَمَا وَرَدَت.", translation: "Three types of Tawhid: Lordship (Allah alone creates/sustains) / Worship (only Allah worshipped — meaning of Lā ilāha illā llāh) / Names & Attributes (affirm as they came)", transliteration: "At-tawḥīdu — asāsu l-ʿaqīdah.", note: "The mushrikeen accepted Tawhid of Lordship but FAILED at Tawhid of Worship — they worshipped idols. The Prophets called people to pure worship." },
      ],
      vocabulary: [
        { arabic: "عَقِيدَة", transliteration: "ʿaqīdah", english: "creed / conviction", pos: "noun (f)", plural: "عَقَائِد" },
        { arabic: "تَوْحِيد", transliteration: "tawḥīd", english: "monotheism / Oneness of Allah", pos: "noun (m)" },
        { arabic: "شِرْك", transliteration: "shirk", english: "associating partners with Allah", pos: "noun (m)" },
        { arabic: "رُبُوبِيَّة", transliteration: "rubūbiyyah", english: "Lordship (of Allah)", pos: "noun (f)" },
        { arabic: "أُلُوهِيَّة", transliteration: "ulūhiyyah", english: "right to worship", pos: "noun (f)" },
        { arabic: "قَدَر", transliteration: "qadar", english: "divine decree", pos: "noun (m)" },
      ],
      grammar: { title: "Three Categories of Tawhid", titleArabic: "أَقْسَامُ التَّوْحِيد", explanation: "1. Rubūbiyyah: Allah alone is Creator, Sustainer, Controller\n   ALL people — even mushrikeen — accepted this\n\n2. Ulūhiyyah: THIS is what prophets called to\n   لَا إِلَهَ إِلَّا اللهُ = none worthy of worship except Allah\n\n3. Asmāʾ waṣ-Ṣifāt: Affirm Allah's names/attributes as in Quran & Sunnah — without distortion, denial, likening, or modality", examples: [{ arabic: "﴿قُلْ هُوَ اللهُ أَحَدٌ﴾ — تَوْحِيدُ الرُّبُوبِيَّةِ وَالأُلُوهِيَّة", translation: "'Say: He is Allah, One.' — Both Lordship and Worship" }] },
      exercises: [{ type: "choose", instruction: "Test your Aqeedah.", instructionArabic: "اِخْتَبِرْ عَقِيدَتَك.", items: [{ question: "What does 'Lā ilāha illā llāh' mean?", options: ["There is only one God", "None worthy of worship except Allah", "Allah is great", "Submit to Allah"], answer: 1 }, { question: "How many pillars of Iman?", options: ["5", "6", "7", "4"], answer: 1 }], answers: [1, 1] }],
      culturalNote: "The scholars preserved correct creed in texts like Al-Aqeedah Al-Wasitiyya (Ibn Taymiyyah), Al-Aqeedah Al-Tahawiyya (Imam Al-Tahawi), and Lum'at Al-I'tiqad (Ibn Qudamah). These are studied worldwide.",
    },
    {
      bookId: "aqeedah-beginners", lessonNum: 2,
      title: "Belief in Allah — Names & Attributes", titleArabic: "الإِيمَانُ بِاللهِ — أَسْمَاؤُهُ وَصِفَاتُهُ",
      description: "Know Allah through His 99 Most Beautiful Names and essential attributes.",
      pages: [
        { id: 1, arabic: "﴿وَللهِ الأَسْمَاءُ الحُسْنَى فَادْعُوهُ بِهَا﴾ [الأَعْرَاف: ١٨٠]\n«إِنَّ للهِ تِسْعَةً وَتِسْعِينَ اسْمًا مَنْ أَحْصَاهَا دَخَلَ الجَنَّة.» [البُخَارِي]", translation: "'To Allah belong the Best Names — invoke Him by them.' (7:180) / 'Allah has 99 names — whoever memorizes them enters Paradise.' (Bukhari)", transliteration: "Wa lillāhi l-asmāʾu l-ḥusnā fadʿūhu bihā.", note: "أَحْصَاهَا = memorizes + understands meaning + worships through them." },
        { id: 2, arabic: "أَهَمُّ الأَسْمَاء الحُسْنَى:\nاللهُ — الرَّحْمَن — الرَّحِيم — المَلِك — القُدُّوس — السَّلَام\nالعَلِيم — القَدِير — السَّمِيع — البَصِير — الحَيّ — القَيُّوم\nالغَفَّار — الرَّزَّاق — الوَهَّاب — التَّوَّاب — اللَّطِيف", translation: "Most important Beautiful Names: Allah / Ar-Raḥmān / Ar-Raḥīm / Al-Malik / Al-Quddūs / As-Salām / Al-ʿAlīm / Al-Qadīr / As-Samīʿ / Al-Baṣīr / Al-Ḥayy / Al-Qayyūm / Al-Ghaffār / Ar-Razzāq / Al-Wahhāb / At-Tawwāb / Al-Laṭīf", transliteration: "Ahamu l-asmāʾi l-ḥusnā.", note: "اللهُ is the GREATEST name — encompasses all other names and cannot refer to anyone else." },
      ],
      vocabulary: [
        { arabic: "اسْم", transliteration: "ism", english: "name", pos: "noun (m)", plural: "أَسْمَاء" },
        { arabic: "صِفَة", transliteration: "ṣifah", english: "attribute", pos: "noun (f)", plural: "صِفَات" },
        { arabic: "حَيّ", transliteration: "ḥayy", english: "The Ever-Living", pos: "divine name" },
        { arabic: "قَيُّوم", transliteration: "qayyūm", english: "The Sustainer of existence", pos: "divine name" },
        { arabic: "عَلِيم", transliteration: "ʿalīm", english: "The All-Knowing", pos: "divine name" },
        { arabic: "قَدِير", transliteration: "qadīr", english: "The All-Able", pos: "divine name" },
      ],
      grammar: { title: "Duaa with Allah's Names", titleArabic: "الدُّعَاءُ بِأَسْمَاءِ اللهِ", explanation: "Use relevant names in supplication:\n• Forgiveness → يَا غَفَّارُ اغْفِرْ لِي\n• Provision → يَا رَزَّاقُ ارْزُقْنِي\n• Guidance → يَا هَادِي اهْدِنِي\n• Difficulty → يَا لَطِيفُ الْطُفْ بِي\n• Strength → يَا قَوِيُّ قَوِّنِي\n\nLearn one name per week with meaning, Quranic context, and application.", examples: [{ arabic: "«يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيث»", translation: "'O Ever-Living, O Sustainer — by Your mercy I seek help.' (Tirmidhi)" }] },
      exercises: [{ type: "match", instruction: "Match name to meaning.", instructionArabic: "طَابِقْ بَيْنَ الاسْمِ وَمَعْنَاهُ.", items: [{ arabic: "الرَّزَّاق", english: "The Provider" }, { arabic: "الغَفَّار", english: "The Forgiving" }, { arabic: "العَلِيم", english: "The All-Knowing" }, { arabic: "القَدِير", english: "The All-Able" }], answers: [0, 1, 2, 3] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // TAFSIR OF JUZ AMMA
  // ══════════════════════════════════════════════════════════════════════════
  "tafsir-juz-amma": [
    {
      bookId: "tafsir-juz-amma", lessonNum: 1,
      title: "Surah Al-Fatiha — Tafsir", titleArabic: "سُورَةُ الفَاتِحَة — تَفْسِير",
      description: "Complete tafsir of Al-Fatiha — the greatest surah, repeated 17 times daily.",
      pages: [
        { id: 1, arabic: "﴿الْحَمْدُ للهِ رَبِّ الْعَالَمِينَ﴾\nالحَمْدُ = الثَّنَاءُ الكَامِل — رَبُّ العَالَمِين = رَبُّ كُلِّ الخَلَائِق: الإِنْس وَالجِنّ وَالمَلَائِكَة وَالكَوَاكِب.", translation: "'All praise to Allah, Lord of all worlds.' Al-Hamd = complete praise / Rabb al-ʿĀlamīn = Lord of every world: humans, jinn, angels, planets.", transliteration: "Al-ḥamdu li-llāhi rabbi l-ʿālamīn.", note: "الحَمْد with definite article = ALL praise belongs ONLY to Allah." },
        { id: 2, arabic: "﴿الرَّحْمَٰنِ الرَّحِيمِ﴾:\nالرَّحْمَان = رَحْمَة عَامَّة لِجَمِيعِ الخَلْق\nالرَّحِيم = رَحْمَة خَاصَّة بِالمُؤْمِنِين فِي الآخِرَة\n﴿مَالِكِ يَوْمِ الدِّينِ﴾ = المَالِكُ المُتَصَرِّف يَوْمَ القِيَامَة", translation: "Ar-Raḥmān = general mercy for all / Ar-Raḥīm = special mercy for believers in Hereafter / 'Master of Judgment Day' = sole Owner on Day of Resurrection", transliteration: "Ar-raḥmāni r-raḥīm. Māliki yawmi d-dīn.", note: "Mercy mentioned TWICE before judgment — Allah's mercy surrounds everything, even on Judgment Day." },
        { id: 3, arabic: "﴿إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ﴾ — قَلْبُ السُّورَة\n﴿اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ﴾", translation: "'You alone we worship, You alone we seek help' — the heart of the surah. 'Guide us to the straight path of those You favored — not those who evoked anger or those astray.'", transliteration: "Iyyāka naʿbudu wa iyyāka nastaʿīn. Ihdinā ṣ-ṣirāṭa l-mustaqīm.", note: "إِيَّاكَ first = exclusivity: ONLY Allah. A hadith qudsi: Allah says 'I divided Al-Fatiha between Me and My servant.'" },
      ],
      vocabulary: [
        { arabic: "حَمْد", transliteration: "ḥamd", english: "praise", pos: "noun (m)" },
        { arabic: "مَالِك", transliteration: "mālik", english: "Master / Owner", pos: "divine name" },
        { arabic: "عِبَادَة", transliteration: "ʿibādah", english: "worship", pos: "noun (f)" },
        { arabic: "هِدَايَة", transliteration: "hidāyah", english: "guidance", pos: "noun (f)" },
        { arabic: "صِرَاط", transliteration: "ṣirāṭ", english: "path", pos: "noun (m)" },
      ],
      grammar: { title: "Al-Fatiha — Conversation with Allah", titleArabic: "الفَاتِحَةُ — حِوَارٌ مَعَ اللهِ", explanation: "Hadith Qudsi (Muslim): Allah says:\n'Al-ḥamdu li-llāh' → My servant praised Me.\n'Ar-Raḥmān Ar-Raḥīm' → extolled Me.\n'Māliki Yawm' → glorified Me.\n'Iyyāka naʿbud' → between Me and My servant.\n'Ihdinā...' → for My servant, and he shall have what he asks.\n\nEvery prayer = real-time conversation with Allah!", examples: [{ arabic: "«لَا صَلَاةَ لِمَنْ لَمْ يَقْرَأْ بِفَاتِحَةِ الكِتَاب»", translation: "'No prayer without Al-Fatiha.' (Bukhari)" }] },
      exercises: [{ type: "choose", instruction: "Tafsir of Al-Fatiha.", instructionArabic: "تَفْسِيرُ الفَاتِحَة.", items: [{ question: "Ar-Raḥmān vs Ar-Raḥīm?", options: ["Identical", "Raḥmān = all creation; Raḥīm = believers in Hereafter", "Raḥmān = believers; Raḥīm = all", "Raḥmān is stronger"], answer: 1 }], answers: [1] }],
    },
    {
      bookId: "tafsir-juz-amma", lessonNum: 2,
      title: "Surah Al-Ikhlas — Pure Monotheism", titleArabic: "سُورَةُ الإِخْلَاص",
      description: "The surah that defines Allah's essence — equal to a third of the entire Quran.",
      pages: [
        { id: 1, arabic: "﴿قُلْ هُوَ اللهُ أَحَدٌ﴾\nأَحَد = الفَرْدُ الَّذِي لَا مِثِيلَ لَهُ (أَعْمَق مِنْ وَاحِد)\n﴿اللهُ الصَّمَدُ﴾ = السَّيِّدُ الَّذِي تَقْصِدُهُ الخَلَائِقُ فِي حَاجَاتِهِم", translation: "'Say: He is Allah, One.' Aḥad = uniquely singular, no equal (deeper than 'one') / 'Allah, the Self-Sufficient' = The Master all creatures turn to in their needs.", transliteration: "Qul huwa llāhu aḥad. Allāhu ṣ-ṣamad.", note: "وَاحِد = one (in number). أَحَد = uniquely alone with no equal of any kind — only applies to Allah." },
        { id: 2, arabic: "﴿لَمْ يَلِدْ وَلَمْ يُولَدْ﴾\nيَرُدُّ عَلَى النَّصَارَى (لَا وَلَد) وَعَلَى المُشْرِكِين (غَيْرُ مَخْلُوق)\n﴿وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ﴾ — لَا مِثِيل لَهُ فِي أَيِّ وَجْه", translation: "'He neither begat nor was begotten.' — Refutes Christianity (no son) and paganism (not created). 'Nor is there any equivalent to Him.' — Nothing like Him in any way.", transliteration: "Lam yalid wa lam yūlad. Wa lam yakun lahu kufuwan aḥad.", note: "لَمْ يَلِدْ refutes 'son of God'. لَمْ يُولَدْ refutes 'created god'. كُفُوًا أَحَد = no equivalent — refutes every comparison." },
      ],
      vocabulary: [
        { arabic: "أَحَد", transliteration: "aḥad", english: "One (uniquely singular)", pos: "divine name" },
        { arabic: "صَمَد", transliteration: "ṣamad", english: "The Self-Sufficient Eternal Refuge", pos: "divine name" },
        { arabic: "كُفُو", transliteration: "kufuʾ", english: "equivalent / equal", pos: "noun (m)" },
      ],
      grammar: { title: "Why Al-Ikhlas = Third of Quran", titleArabic: "لِمَاذَا تَعْدِلُ ثُلُثَ القُرْآن", explanation: "Prophet ﷺ: 'Qul huwa llahu ahad equals a third of the Quran.' (Bukhari)\n\nQuran covers three main topics:\n1. Aqeedah (creed) — knowing Allah\n2. Ahkam (rulings) — what to do/avoid\n3. Stories (lessons from history)\n\nSurah Al-Ikhlas = PURE Aqeedah, the essence of knowing Allah → covers one entire third.", examples: [{ arabic: "«مَنْ قَرَأَهَا عَشْرَ مَرَّاتٍ بَنَى اللهُ لَهُ قَصْرًا فِي الجَنَّة»", translation: "'Whoever reads it 10 times, Allah builds for him a palace in Paradise.' (Ahmad)" }] },
      exercises: [{ type: "fill_blank", instruction: "Complete Surah Al-Ikhlas.", instructionArabic: "أَكْمِلْ سُورَةَ الإِخْلَاص.", items: [{ sentence: "﴿قُلْ هُوَ اللهُ ___﴾", blank: 1, hint: "One" }, { sentence: "﴿اللهُ ___﴾", blank: 1, hint: "The Self-Sufficient" }, { sentence: "﴿لَمْ ___ وَلَمْ يُولَد﴾", blank: 1, hint: "He begat" }, { sentence: "﴿وَلَمْ يَكُن لَّهُ كُفُوًا ___﴾", blank: 1, hint: "anyone" }], answers: ["أَحَدٌ", "الصَّمَدُ", "يَلِدْ", "أَحَدٌ"] }],
    },
    {
      bookId: "tafsir-juz-amma", lessonNum: 3,
      title: "Surah Al-Falaq & An-Nas", titleArabic: "المُعَوِّذَتَان",
      description: "The two surahs of protection from all external and internal harms.",
      pages: [
        { id: 1, arabic: "سُورَةُ الفَلَق:\n﴿قُلْ أَعُوذُ بِرَبِّ الفَلَقِ مِن شَرِّ مَا خَلَقَ﴾\n﴿وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ﴾ — اللَّيْل\n﴿وَمِن شَرِّ النَّفَّاثَاتِ فِي العُقَد﴾ — السِّحْر\n﴿وَمِن شَرِّ حَاسِدٍ إِذَا حَسَد﴾ — الحَسَد", translation: "Surah Al-Falaq: 'Say: I seek refuge with the Lord of daybreak — from all He created / darkness / those who blow into knots (magic) / envier when they envy'", transliteration: "Qul aʿūdhu bi-rabbi l-falaq min sharri mā khalaq.", note: "Protection from external harms: night, sorcery, envy — seek refuge with الرَّبّ (Lord/Creator)." },
        { id: 2, arabic: "سُورَةُ النَّاس:\n﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ مَلِكِ النَّاسِ إِلَهِ النَّاسِ﴾\n«الرَّبّ — المَلِك — الإِلَه» — ثَلَاثَةُ أَسْمَاء: رُبُوبِيَّة — مُلْك — أُلُوهِيَّة\n﴿مِن شَرِّ الوَسْوَاسِ الخَنَّاسِ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ مِنَ الجِنَّةِ وَالنَّاسِ﴾", translation: "Surah An-Nas: 'Say: I seek refuge with the Lord of mankind, the King, the God — from the whisperer who withdraws, who whispers into the hearts of people — from jinn and men.'", transliteration: "Qul aʿūdhu bi-rabbi n-nās maliki n-nās ilāhi n-nās.", note: "Protection from INTERNAL enemy: Shaytan's whispers into the heart. الخَنَّاس = withdraws when Allah is remembered." },
      ],
      vocabulary: [
        { arabic: "فَلَق", transliteration: "falaq", english: "daybreak / dawn", pos: "noun (m)" },
        { arabic: "غَاسِق", transliteration: "ghāsiq", english: "darkness (nightfall)", pos: "noun (m)" },
        { arabic: "نَفَّاثَات", transliteration: "naffāthāt", english: "those who blow into knots (sorcerers)", pos: "noun (f.pl)" },
        { arabic: "حَاسِد", transliteration: "ḥāsid", english: "envier", pos: "noun (m)" },
        { arabic: "وَسْوَاس", transliteration: "waswās", english: "whisperer / whisper (Shaytan)", pos: "noun (m)" },
        { arabic: "خَنَّاس", transliteration: "khannās", english: "the one who withdraws (Shaytan)", pos: "noun (m)" },
      ],
      grammar: { title: "Daily Use of the Mu'awwidhatain", titleArabic: "اسْتِخْدَامُ المُعَوِّذَتَيْن يَوْمِيًّا", explanation: "Read 3x morning and evening with Al-Ikhlas: «تَكْفِيكَ كُلَّ شَيْء» ('sufficient for everything')\n\nUse for:\n• Before sleep: blow into cupped hands, wipe body\n• After each fard prayer (once)\n• During illness — ruqyah\n• Whenever feeling anxiety or spiritual harm", examples: [{ arabic: "«مَنْ قَرَأَهُنَّ حِينَ يُمْسِي وَحِينَ يُصْبِحُ ثَلَاثَ مَرَّاتٍ كَفَتْهُ مِنْ كُلِّ شَيْء»", translation: "'3x morning and evening — sufficient against everything.' (Abu Dawud)" }] },
      exercises: [{ type: "choose", instruction: "About the Mu'awwidhatain.", instructionArabic: "أَجِبْ عَنِ المُعَوِّذَتَيْن.", items: [{ question: "What does 'Al-Khannās' mean?", options: ["An angel", "Shaytan who withdraws when Allah is remembered", "A human enemy", "Night darkness"], answer: 1 }, { question: "How many times are these surahs read in morning/evening protection?", options: ["Once", "Twice", "Three times", "Seven"], answer: 2 }], answers: [1, 2] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // SEERAH OF THE PROPHET MUHAMMAD ﷺ
  // ══════════════════════════════════════════════════════════════════════════
  "seerah-prophet-muhammad": [
    {
      bookId: "seerah-prophet-muhammad", lessonNum: 1,
      title: "Introduction to the Seerah", titleArabic: "مُقَدِّمَةٌ فِي السِّيرَةِ النَّبَوِيَّة",
      description: "Why studying the Seerah is an act of worship and how it transforms your faith.",
      pages: [
        { id: 1, arabic: "﴿لَقَدْ كَانَ لَكُمْ فِي رَسُولِ اللهِ أُسْوَةٌ حَسَنَةٌ﴾ [الأَحْزَاب: ٢١]\nالسِّيرَةُ تُجِيب: كَيْفَ كَانَ يُصَلِّي، يَتَعَامَل، يَقُود وَيَرْبِي؟", translation: "'There has certainly been for you in the Messenger an excellent pattern.' (33:21). The Seerah answers: how did he pray, interact, lead, and educate?", transliteration: "﴿Laqad kāna lakum fī rasūli llāhi uswatun ḥasanah﴾", note: "Aisha said: 'His character was the Quran.' Studying Seerah makes the Quran come alive." },
        { id: 2, arabic: "فَوَائِدُ السِّيرَة:\n١. زِيَادَةُ المَحَبَّةِ للنَّبِيِّ ﷺ\n٢. تَقْوِيَةُ الإِيمَان\n٣. فَهْمُ القُرْآن (آيَات نَزَلَتْ فِي أَحْدَاث)\n٤. الاقْتِدَاءُ فِي الصَّبْر وَالابْتِلَاء\n٥. تَعَلُّمُ القِيَادَة وَبِنَاءِ الأُمَّة", translation: "Benefits of Seerah: 1.More love for Prophet / 2.Stronger Iman / 3.Understanding Quran / 4.Following his patience in trials / 5.Learning leadership and community building", transliteration: "Fawāʾidu s-sīrah.", note: "«لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى أَكُونَ أَحَبَّ إِلَيْهِ مِنْ وَلَدِهِ وَوَالِدِهِ» — Love of Prophet ﷺ is part of Iman." },
        { id: 3, arabic: "أَهَمُّ المَعَالِم:\n• وُلِدَ: مَكَّة، عَام الفِيل، ٥٧١م\n• أُمُّهُ: آمِنَة (تُوُفِّيَتْ وَهُوَ ابنُ ٦)\n• جَدُّهُ: عَبْدُ المُطَّلِب — عَمُّهُ: أَبُو طَالِب\n• أَوَّلُ الوَحْي: ٦١٠م — غَارُ حِرَاء\n• النُّبُوَّة: ٢٣ عَامًا (مَكِّيَّة ١٣ + مَدَنِيَّة ١٠)\n• الوَفَاة: ٦٣٢م — المَدِينَة المُنَوَّرَة", translation: "Key facts: Born Makkah 571CE / Mother Aminah (died when he was 6) / Raised by grandfather then uncle / First revelation 610CE Cave of Hira / Prophethood 23 yrs / Died 632CE Madinah age ~63", transliteration: "Ahammu l-maʿālim fī s-sīrah.", note: "عَام الفِيل = Year of the Elephant. Abraha attacked Ka'bah with elephants — Allah destroyed his army (Surah Al-Fil)." },
      ],
      vocabulary: [
        { arabic: "سِيرَة", transliteration: "sīrah", english: "biography / life story", pos: "noun (f)" },
        { arabic: "أُسْوَة", transliteration: "uswah", english: "excellent example / model", pos: "noun (f)" },
        { arabic: "نَسَب", transliteration: "nasab", english: "lineage", pos: "noun (m)" },
        { arabic: "مُعْجِزَة", transliteration: "muʿjizah", english: "miracle", pos: "noun (f)", plural: "مُعْجِزَات" },
        { arabic: "هِجْرَة", transliteration: "hijrah", english: "migration to Madinah", pos: "noun (f)" },
        { arabic: "عَام الفِيل", transliteration: "ʿāmu l-fīl", english: "Year of the Elephant (571CE)", pos: "proper noun" },
      ],
      grammar: { title: "Timeline of the Seerah", titleArabic: "أَبْرَزُ مَحَطَّاتِ السِّيرَة", explanation: "Key timeline:\n• 571 CE: Born in Makkah (Year of Elephant)\n• 575 CE: Mother Aminah dies\n• 578 CE: Grandfather Abd al-Muttalib dies\n• 595 CE: Marries Khadijah\n• 610 CE: First revelation (age 40)\n• 613 CE: Public call begins\n• 615 CE: Migration to Abyssinia\n• 619 CE: Year of Grief (Khadijah + Abu Talib die)\n• 620 CE: Isra and Miraj\n• 622 CE: Hijrah to Madinah (Islamic calendar begins)\n• 632 CE: Death (age ~63)", examples: [{ arabic: "وُلِدَ مَكَّة ← بُعِثَ مَكَّة ← هَاجَرَ المَدِينَة ← تُوُفِّيَ المَدِينَة", translation: "Born Makkah → Received prophethood Makkah → Migrated Madinah → Died Madinah" }] },
      exercises: [{ type: "choose", instruction: "Test Seerah knowledge.", instructionArabic: "اِخْتَبِرْ مَعْرِفَتَكَ بِالسِّيرَة.", items: [{ question: "Where was the Prophet ﷺ born?", options: ["Madinah", "Makkah", "Ta'if", "Jerusalem"], answer: 1 }, { question: "In which cave did the first revelation occur?", options: ["Cave Thawr", "Cave of Hira", "Cave of Uhud", "Cave of Badr"], answer: 1 }], answers: [1, 1] }],
      culturalNote: "The Seerah is the most thoroughly documented biography in history. Over 300,000 companions knew the Prophet ﷺ personally. The Islamic sciences of Isnad preserved every detail of his life. No other historical figure's life is as completely preserved.",
    },
    {
      bookId: "seerah-prophet-muhammad", lessonNum: 2,
      title: "Early Life — Al-Amin (The Trustworthy)", titleArabic: "الحَيَاةُ المُبَكِّرَة — الأَمِين",
      description: "The Prophet's childhood, youth, and noble character before prophethood.",
      pages: [
        { id: 1, arabic: "طُفُولَتُهُ ﷺ:\n• رَضَعَ مِنْ حَلِيمَةَ السَّعْدِيَّة — شَرْحُ الصَّدْر\n• تُوُفِّيَتْ أُمُّهُ وَهُوَ ٦ سَنَوَات\n• كَفَلَهُ جَدُّهُ عَبْدُ المُطَّلِب — ثُمَّ عَمُّهُ أَبُو طَالِب\n• عَمِلَ رَاعِيَ غَنَمٍ: «مَا مِنْ نَبِيٍّ إِلَّا رَعَى الغَنَم»", translation: "His childhood: Nursed by Halimah / Opening of chest (shrah al-sadr) / Mother died age 6 / Raised by grandfather then uncle / He was a shepherd: 'Every prophet tended sheep'", transliteration: "Ṭufūlatuhu ﷺ.", note: "شَرْحُ الصَّدْر (opening of chest) happened at age 4 and again before Isra and Miraj — preparation for the greatest mission." },
        { id: 2, arabic: "الشَّبَاب — لَقَبُ «الأَمِين»:\nاشْتُهِرَ بِالصِّدْقِ وَالأَمَانَة حَتَّى لُقِّبَ بِـ «الأَمِين».\nحَادِثَةُ الحَجَرِ الأَسْوَد: حَكَّمَهُ القَبَائِل — وَضَعَ الحَجَرَ فِي رِدَائِهِ.\nزَوَاجُهُ مِنْ خَدِيجَة ﵂ (عُمُرُهُ ٢٥): صَاحِبَتُهُ وَأَوَّلُ مَنْ آمَنَتْ.", translation: "Youth — nickname 'Al-Amin' (Trustworthy). Black Stone incident: tribes chose him as judge — placed stone in his robe. Married Khadijah at 25 — his companion and first believer.", transliteration: "Ash-shabāb — laqab «Al-Amīn».", note: "خَدِيجَة ﵂ = wealthy businesswoman 15 yrs older who proposed marriage after seeing his trustworthiness. She was his only wife for 25 yrs." },
      ],
      vocabulary: [
        { arabic: "أَمِين", transliteration: "amīn", english: "trustworthy (his nickname)", pos: "adjective" },
        { arabic: "شَرْح الصَّدْر", transliteration: "sharḥu ṣ-ṣadr", english: "opening of the chest (miracle)", pos: "proper noun" },
        { arabic: "حَلِيمَة", transliteration: "Ḥalīmah", english: "his wet nurse", pos: "proper noun" },
        { arabic: "الحَجَر الأَسْوَد", transliteration: "al-ḥajaru l-aswad", english: "The Black Stone", pos: "proper noun" },
        { arabic: "خَدِيجَة", transliteration: "Khadījah", english: "his first wife and first believer", pos: "proper noun" },
      ],
      grammar: { title: "Prophet's Character Before Prophethood", titleArabic: "أَخْلَاقُهُ قَبْلَ البِعْثَة", explanation: "Allah prepares prophets before revelation:\n• Never worshipped idols\n• Known as 'Al-Amin' throughout Makkah\n• Participated in Hilf Al-Fudhool (pact for justice)\n• Disliked pre-Islamic vices\n• Retreated to Cave of Hira for contemplation\n\nThis shows: the prophet was chosen by Allah, not self-made. Character prepared years before message.", examples: [{ arabic: "«مَا كُنْتُ قَبْلَ النُّبُوَّة إِلَّا رَاعِيَ غَنَم»", translation: "'Before prophethood I was nothing but a shepherd.' (Bukhari) — His humility despite his greatness" }] },
      exercises: [{ type: "choose", instruction: "About the Prophet's early life.", instructionArabic: "أَجِبْ عَنِ السِّيرَة المُبَكِّرَة.", items: [{ question: "What was his nickname before prophethood?", options: ["Al-Kāmil", "Al-Amīn (Trustworthy)", "Al-Fārūq", "Al-Ṣiddīq"], answer: 1 }, { question: "Who was the first to believe in him?", options: ["Abu Bakr", "Ali ibn Abi Talib", "Khadijah", "Umar"], answer: 2 }], answers: [1, 2] }],
    },
    {
      bookId: "seerah-prophet-muhammad", lessonNum: 3,
      title: "The First Revelation — Cave of Hira", titleArabic: "أَوَّلُ الوَحْي — غَارُ حِرَاء",
      description: "The beginning of the Message — the most transformative night in human history.",
      pages: [
        { id: 1, arabic: "فِي رَمَضَانَ ٦١٠م، نَزَلَ جِبْرِيل ﵇:\n«اقْرَأْ!» — «مَا أَنَا بِقَارِئ!»\nضَمَّهُ حَتَّى بَلَغَ مِنْهُ الجُهْد ثَلَاثَ مَرَّات.\nثُمَّ: ﴿اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ — خَلَقَ الإِنْسَانَ مِنْ عَلَقٍ — اقْرَأْ وَرَبُّكَ الأَكْرَمُ — الَّذِي عَلَّمَ بِالقَلَمِ — عَلَّمَ الإِنْسَانَ مَا لَمْ يَعْلَم﴾", translation: "In Ramadan 610CE, Jibreel descended: 'Read!' — 'I am not a reader!' Embraced him 3 times. Then: 'Read in the name of your Lord who created — from a clinging substance — Taught by the pen — taught man what he did not know.' (Al-Alaq 96:1-5)", transliteration: "Fī ramaḍāna 610m, nazala Jibrīl: «Iqraʾ!» — «Mā anā bi-qāriʾ!»", note: "First Quranic word: اقْرَأْ (Read/Recite) — to an unlettered man. Knowledge comes from Allah, not human ability." },
        { id: 2, arabic: "رُجُوعُهُ ﷺ يَرْجُف:\n«زَمِّلُونِي! زَمِّلُونِي!»\nقَالَ لِخَدِيجَة: «خَشِيتُ عَلَى نَفْسِي.»\nقَالَتْ خَدِيجَة: «كَلَّا! وَاللهِ مَا يُخْزِيكَ اللهُ أَبَدًا\nإِنَّكَ لَتَصِلُ الرَّحِم، وَتَحْمِلُ الكَلَّ، وَتُعِينُ عَلَى نَوَائِبِ الحَق.»", translation: "He returned trembling: 'Cover me! Cover me!' Told Khadijah: 'I fear for myself.' She said: 'Never! Allah will never disgrace you — you maintain family ties, bear others' burdens, help with the truth.'", transliteration: "«Zammilūnī! Zammilūnī!» — «Khashītu ʿalā nafsī.»", note: "Khadijah's response listed his CHARACTER as proof Allah would not abandon him — one of history's most beautiful moments of support." },
      ],
      vocabulary: [
        { arabic: "غَار حِرَاء", transliteration: "ghāru Ḥirāʾ", english: "Cave of Hira (first revelation)", pos: "proper noun" },
        { arabic: "اقْرَأْ", transliteration: "iqraʾ", english: "Read/Recite! (first Quranic word)", pos: "verb (imperative)" },
        { arabic: "عَلَق", transliteration: "ʿalaq", english: "clinging substance", pos: "noun (m)" },
        { arabic: "قَلَم", transliteration: "qalam", english: "pen", pos: "noun (m)" },
        { arabic: "رَوْع", transliteration: "rawʿ", english: "fear / fright", pos: "noun (m)" },
        { arabic: "وَحْي", transliteration: "waḥy", english: "divine revelation", pos: "noun (m)" },
      ],
      grammar: { title: "Surah Al-Alaq — First Revelation", titleArabic: "سُورَةُ العَلَق — أَوَّلُ مَا نَزَل", explanation: "First 5 ayahs of Surah Al-Alaq (96:1-5):\n1. اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ\n2. خَلَقَ الإِنْسَانَ مِنْ عَلَقٍ\n3. اقْرَأْ وَرَبُّكَ الأَكْرَمُ\n4. الَّذِي عَلَّمَ بِالقَلَمِ\n5. عَلَّمَ الإِنْسَانَ مَا لَمْ يَعْلَمْ\n\nThree themes: Allah as Creator / Allah as Teacher / the pen (knowledge).", examples: [{ arabic: "﴿اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ﴾ — أَوَّلُ كَلِمَةٍ مِنَ القُرْآن", translation: "First word revealed from the Quran" }] },
      exercises: [{ type: "fill_blank", instruction: "Complete Al-Alaq.", instructionArabic: "أَكْمِلْ أَوَّلَ الوَحْي.", items: [{ sentence: "﴿اقْرَأْ بِاسْمِ ___ الَّذِي خَلَق﴾", blank: 1, hint: "your Lord" }, { sentence: "﴿خَلَقَ الإِنْسَانَ مِنْ ___﴾", blank: 1, hint: "clinging substance" }, { sentence: "﴿الَّذِي عَلَّمَ بِالْ___﴾", blank: 1, hint: "pen" }], answers: ["رَبِّكَ", "عَلَق", "قَلَم"] }],
    },
    {
      bookId: "seerah-prophet-muhammad", lessonNum: 4,
      title: "The Makkan Period — Patience & Persecution", titleArabic: "المَرْحَلَةُ المَكِّيَّة",
      description: "13 years of dawah in Makkah — trial, patience, and ultimate victory.",
      pages: [
        { id: 1, arabic: "مَرَاحِلُ الدَّعْوَة فِي مَكَّة:\n١. سِرِّيَّة (٣ سَنَوَات): خَدِيجَة، عَلِيّ، أَبُو بَكْر، زَيْد\n٢. جَهْرِيَّة: ﴿فَاصْدَعْ بِمَا تُؤْمَر﴾\n٣. الأَذَى وَالتَّعْذِيب: قُرَيْش تُحَارِب الدَّعْوَة\n٤. هِجْرَةُ الحَبَشَة: النَّجَاشِيّ يَحْمِي المُسْلِمِين\n٥. عَامُ الحُزْن: وَفَاةُ خَدِيجَة وَأَبِي طَالِب", translation: "Stages in Makkah: 1.Secret (3 yrs): Khadijah/Ali/AbuBakr/Zayd / 2.Public: 'Proclaim what you are commanded' / 3.Persecution by Quraysh / 4.Migration to Abyssinia (Negus protects Muslims) / 5.Year of Grief: Khadijah + Abu Talib die", transliteration: "Marāḥilu d-daʿwah fī Makkah.", note: "عَامُ الحُزْن = 10th year of prophethood. Allah gifted the Isra and Miraj to strengthen the Prophet's heart." },
        { id: 2, arabic: "صَبْرُ الصَّحَابَة رَضِيَ اللهُ عَنْهُم:\nبِلَال ﵁: يُعَذَّب بِالحِجَارَة — «أَحَد، أَحَد!»\nسُمَيَّة ﵂: أَوَّلُ شَهِيدَة فِي الإِسْلَام\nقَالَ ﷺ: «صَبْرًا آلَ يَاسِر! فَإِنَّ مَوْعِدَكُمُ الجَنَّة.»\nدَرْسٌ: كَيْفَ تَنْتَشِرُ الدَّعْوَةُ رَغْمَ ١٣ عَامًا مِنَ الأَذَى؟", translation: "Companions' patience: Bilal tortured with rocks — 'Ahad, Ahad!' / Sumayyah — first martyr in Islam / Prophet said: 'Patience O family of Yasir — your appointment is Paradise.' Lesson: how does a call spread despite 13 yrs persecution?", transliteration: "Ṣabru ṣ-ṣaḥābah.", note: "These companions faced torture for saying 'lā ilāha illā llāh'. How much are we willing to endure for our faith today?" },
      ],
      vocabulary: [
        { arabic: "أَذَى", transliteration: "adhā", english: "harm / persecution", pos: "noun (m)" },
        { arabic: "صَبْر", transliteration: "ṣabr", english: "patience / endurance", pos: "noun (m)" },
        { arabic: "شَهِيد", transliteration: "shahīd", english: "martyr", pos: "noun (m)", plural: "شُهَدَاء" },
        { arabic: "عَامُ الحُزْن", transliteration: "ʿāmu l-ḥuzn", english: "Year of Grief", pos: "proper noun" },
        { arabic: "الإِسْرَاء وَالمِعْرَاج", transliteration: "al-isrāʾ wa l-miʿrāj", english: "Night Journey and Ascension", pos: "proper noun" },
      ],
      grammar: { title: "Lessons from the Makkan Period", titleArabic: "دُرُوسُ المَرْحَلَةِ المَكِّيَّة", explanation: "Five key lessons:\n1. الصَّبْر: Victory comes with patience — 13 yrs before Hijrah\n2. الإِخْلَاص: Early Muslims believed for Allah alone, not gain\n3. الحِكْمَة: Gradual approach — secret → public → legislation\n4. التَّوَكُّل: When human protection gone, Allah sent Miraj then Hijrah\n5. الأُخُوَّة: Migration to Abyssinia = community protecting each other\n\nQuranic focus in Makkah: Tawhid, Akhira, Prophethood, stories for encouragement.", examples: [{ arabic: "﴿إِنَّ مَعَ العُسْرِ يُسْرًا﴾", translation: "'With hardship comes ease.' (94:6) — revealed for Makkan trial comfort" }] },
      exercises: [{ type: "choose", instruction: "About the Makkan period.", instructionArabic: "أَجِبْ عَنِ المَرْحَلَةِ المَكِّيَّة.", items: [{ question: "Who was the first martyr in Islam?", options: ["Bilal", "Khadijah", "Sumayyah", "Khabbab"], answer: 2 }, { question: "What did Bilal say while being tortured?", options: ["Bismillah", "Ahad, Ahad! (One! One!)", "La ilaha illa Allah", "Allahu Akbar"], answer: 1 }], answers: [2, 1] }],
    },
    {
      bookId: "seerah-prophet-muhammad", lessonNum: 5,
      title: "The Hijrah to Madinah", titleArabic: "الهِجْرَةُ إِلَى المَدِينَة",
      description: "The migration that changed the world — beginning of the Islamic calendar.",
      pages: [
        { id: 1, arabic: "أَسْبَابُ الهِجْرَة:\n• اشْتَدَّ أَذَى قُرَيْش\n• بَيْعَةُ العَقَبَة: ٧٢ رَجُلًا وَامْرَأَتَان مِنَ المَدِينَة\n• مُؤَامَرَةُ دَار النَّدْوَة: قَرَّرَتْ قُرَيْش قَتْلَ النَّبِيِّ ﷺ", translation: "Reasons: Quraysh persecution intensified / Second Pledge of Aqabah: 72 men+2 women from Madinah pledge support / Dar Al-Nadwah conspiracy to assassinate the Prophet ﷺ", transliteration: "Asbābu l-hijrah.", note: "بَيْعَةُ العَقَبَة الثَّانِيَة = pivotal moment — Madinah people become Ansar (Helpers), ready to shelter all Muslims." },
        { id: 2, arabic: "رِحْلَةُ الهِجْرَة:\n• خَرَجَ مَعَ أَبِي بَكْرٍ الصِّدِّيق ﵁ لَيْلًا\n• اخْتَبَأَا فِي غَارِ ثَوْر ٣ أَيَّام\nقَالَ أَبُو بَكْر: «لَوْ نَظَرَ أَحَدُهُمْ تَحْتَ قَدَمَيْهِ لَرَآنَا!\"\nقَالَ ﷺ: «مَا ظَنُّكَ بِاثْنَيْنِ اللهُ ثَالِثُهُمَا؟»\n﴿إِذْ يَقُولُ لِصَاحِبِهِ لَا تَحْزَنْ إِنَّ اللهَ مَعَنَا﴾", translation: "Journey: Departed with Abu Bakr at night / Hid in Cave of Thawr 3 days. Abu Bakr: 'If one looks under their feet they'll see us!' Prophet: 'What do you think of two — Allah is their third?' 'Do not grieve — Allah is with us.' (9:40)", transliteration: "Riḥlatu l-hijrah.", note: "Allah sent spider web + dove nest at cave entrance — Quraysh search party turned back. Complete reliance on Allah." },
      ],
      vocabulary: [
        { arabic: "هِجْرَة", transliteration: "hijrah", english: "migration to Madinah", pos: "noun (f)" },
        { arabic: "أَنْصَار", transliteration: "anṣār", english: "The Helpers (Madinah people)", pos: "noun (m.pl)" },
        { arabic: "مُهَاجِرُون", transliteration: "muhājirūn", english: "The Emigrants (from Makkah)", pos: "noun (m.pl)" },
        { arabic: "غَار ثَوْر", transliteration: "ghāru Thawr", english: "Cave of Thawr", pos: "proper noun" },
        { arabic: "بَيْعَة", transliteration: "bayʿah", english: "pledge of allegiance", pos: "noun (f)" },
      ],
      grammar: { title: "Importance of the Hijrah", titleArabic: "أَهَمِّيَّةُ الهِجْرَة", explanation: "The Hijrah was so significant:\n1. Umar ibn Al-Khattab established it as START of Islamic calendar (1 AH)\n2. Marks birth of the Islamic state in Madinah\n3. Demonstrated complete reliance on Allah\n4. United Muhajirun + Ansar — model of brotherhood\n\nIn Madinah the Prophet established:\n• Masjid An-Nabawi\n• Brotherhood between Muhajirun and Ansar\n• Constitution of Madinah\n• Islamic governance with Friday prayer, etc.", examples: [{ arabic: "«لَا هِجْرَةَ بَعْدَ الفَتْح وَلَكِنْ جِهَادٌ وَنِيَّة»", translation: "'No Hijrah after the Conquest — but jihad (striving) and intention.' (Bukhari)" }] },
      exercises: [{ type: "choose", instruction: "About the Hijrah.", instructionArabic: "أَجِبْ عَنِ الهِجْرَة.", items: [{ question: "Who accompanied the Prophet on the Hijrah?", options: ["Ali ibn Abi Talib", "Abu Bakr Al-Siddiq", "Umar", "Uthman"], answer: 1 }, { question: "What did the Prophet say in the cave?", options: ["We must fight", "'Do not grieve — Allah is with us'", "Leave immediately", "We need more help"], answer: 1 }], answers: [1, 1] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // HINGAAD — AL-BAGHDADIYYA
  // ══════════════════════════════════════════════════════════════════════════
  "hingaad-baghdadiyya": [
    {
      bookId: "hingaad-baghdadiyya", lessonNum: 1,
      title: "The Arabic Alphabet — Letters 1–7", titleArabic: "الحُرُوفُ الأُولَى مِنْ ١ إِلَى ٧",
      description: "Learn the first seven Arabic letters with their sounds and forms.",
      pages: [
        { id: 1, arabic: "الحُرُوفُ السَّبْعَةُ الأُولَى:\nأَ — بَ — تَ — ثَ — جَ — حَ — خَ\nالعَرَبِيَّةُ تُكْتَبُ مِنَ اليَمِينِ إِلَى اليَسَار.", translation: "The first seven letters: Alif — Ba — Ta — Tha — Jim — Ha — Kha. Arabic is written right to left.", transliteration: "Alif — bā — tā — thā — jīm — ḥāʾ — khāʾ", note: "Master these before continuing. The foundation of all reading." },
        { id: 2, arabic: "ثَلَاثَةُ أَحْرُفٍ مُتَشَابِهَة:\nبَ = نُقْطَةٌ وَاحِدَة تَحْت\nتَ = نُقْطَتَانِ فَوْق\nثَ = ثَلَاثُ نُقَطٍ فَوْق\nثَلَاثَةٌ أُخْرَى:\nجَ = نُقْطَة وَسَط\nحَ = بِلَا نُقَط (مِنَ الحَلْق)\nخَ = نُقْطَة فَوْق", translation: "Three similar shapes: Ba (1 dot below) / Ta (2 dots above) / Tha (3 dots above). Three more: Jim (dot middle) / Ha (no dots — from throat) / Kha (1 dot above)", transliteration: "Bāʾ — tāʾ — thāʾ / jīm — ḥāʾ — khāʾ", note: "The DOTS distinguish letters. In the Quran every dot is essential — changing it changes meaning." },
        { id: 3, arabic: "تَدْرِيبٌ عَلَى النُّطْق:\nبَ — بِ — بُ — بْ\nتَ — تِ — تُ — تْ\nكَلِمَات: بَاب — بَيْت — بِنْت — كِتَاب", translation: "Pronunciation drill: ba/bi/bu/b-stop | ta/ti/tu/t-stop. Words: bāb (door) / bayt (house) / bint (girl) / kitāb (book)", transliteration: "Ba — bi — bu — b(sukūn) / ta — ti — tu — t(sukūn)", note: "Sukoon (ـْ) = no vowel — stop the sound." },
      ],
      vocabulary: [
        { arabic: "حَرْف", transliteration: "ḥarf", english: "letter", pos: "noun (m)", plural: "حُرُوف" },
        { arabic: "نُقْطَة", transliteration: "nuqṭah", english: "dot / point", pos: "noun (f)", plural: "نُقَط" },
        { arabic: "فَتْحَة", transliteration: "fatḥah", english: "short 'a' vowel (ـَ)", pos: "noun (f)" },
        { arabic: "كَسْرَة", transliteration: "kasrah", english: "short 'i' vowel (ـِ)", pos: "noun (f)" },
        { arabic: "ضَمَّة", transliteration: "ḍammah", english: "short 'u' vowel (ـُ)", pos: "noun (f)" },
        { arabic: "سُكُون", transliteration: "sukūn", english: "no-vowel mark (ـْ)", pos: "noun (m)" },
      ],
      grammar: { title: "Arabic Letters — Shape and Connection", titleArabic: "أَشْكَالُ الحُرُوفِ وَاتِّصَالُهَا", explanation: "Letters have up to 4 forms based on position:\n• Isolated: أ ب ت\n• Initial (start of word): بَيْت\n• Medial (middle): كِتَاب\n• Final (end): كِتَاب\n\nLetters that DON'T connect to what follows (6): ا د ذ ر ز و\nAll others connect on both sides.", examples: [{ arabic: "بَ + يْ + ت = بَيْت", translation: "ba + ay + ta = bayt (house)" }] },
      exercises: [{ type: "choose", instruction: "Identify the letter.", instructionArabic: "تَعَرَّفْ عَلَى الحَرْف.", items: [{ question: "TWO dots above?", options: ["بَ (Ba)", "تَ (Ta)", "ثَ (Tha)", "جَ (Jim)"], answer: 1 }, { question: "NO dots, from the throat?", options: ["جَ (Jim)", "خَ (Kha)", "حَ (Ha)", "بَ (Ba)"], answer: 2 }], answers: [1, 2] }],
    },
    {
      bookId: "hingaad-baghdadiyya", lessonNum: 2,
      title: "Letters 8–14 and Reading Syllables", titleArabic: "الحُرُوفُ مِنْ ٨ إِلَى ١٤",
      description: "Learn the next seven letters and practice reading connected Arabic syllables.",
      pages: [
        { id: 1, arabic: "الحُرُوفُ مِنَ الثَّامِنِ إِلَى الرَّابِعَ عَشَر:\nدَ — ذَ — رَ — زَ — سَ — شَ — صَ\nدَ وَ ذَ وَ رَ وَ زَ: لَا تَتَّصِلُ بِمَا بَعْدَهَا (مِثْلُ الأَلِف)", translation: "Letters 8-14: Dal/Dhal/Ra/Zay/Sin/Shin/Sad. Dal, Dhal, Ra, Zay: do NOT connect to what follows (like Alif)", transliteration: "Dāl — dhāl — rāʾ — zāy — sīn — shīn — ṣād", note: "Recognizing connector vs non-connector letters essential for reading Arabic." },
        { id: 2, arabic: "سِين وَشِين:\nسَ = ثَلَاثَةُ أَسْنَان بِلَا نُقَط: سَلَام — سُكَّر\nشَ = ثَلَاثَةُ أَسْنَان + نُقَط ثَلَاث: شَمْس — شُكْر\nصَاد: شَكْلٌ خَاصٌّ — صَوْتٌ ثَقِيل مُفَخَّم\nمُقَارَنَة: سَ (خَفِيف) ↔ صَ (ثَقِيل)", translation: "Sin: 3 teeth NO dots (salām, sukkar). Shin: 3 teeth WITH 3 dots (shams, shukr). Sad: special shape, heavy emphatic sound. Sin (light) ↔ Sad (heavy)", transliteration: "Sīn wa shīn wa ṣād.", note: "سَ vs صَ sound similar to English speakers but completely different — changing word meanings entirely." },
      ],
      vocabulary: [
        { arabic: "شَمْس", transliteration: "shams", english: "sun", pos: "noun (f)" },
        { arabic: "سَلَام", transliteration: "salām", english: "peace / greeting", pos: "noun (m)" },
        { arabic: "دَار", transliteration: "dār", english: "house / abode", pos: "noun (f)", plural: "دُور" },
        { arabic: "ذِكْر", transliteration: "dhikr", english: "remembrance (of Allah)", pos: "noun (m)" },
        { arabic: "صَبْر", transliteration: "ṣabr", english: "patience", pos: "noun (m)" },
        { arabic: "رَبّ", transliteration: "rabb", english: "Lord", pos: "noun (m)" },
      ],
      grammar: { title: "Reading Syllables", titleArabic: "القِرَاءَةُ المَقْطَعِيَّة", explanation: "Arabic syllable patterns:\n• CV: Consonant + Vowel: بَ (ba), تِ (ti), دُ (du)\n• CVC: Consonant + Vowel + Consonant: بَيْت (bayt), دَرْس (dars)\n• CVV: Consonant + Long Vowel: بَاب (bāb), دِين (dīn)\n\nTo read Arabic:\n1. Identify letters\n2. Look at vowel marks (ـَ ـِ ـُ)\n3. Read consonant + vowel together\n4. Sukoon (ـْ) = stop sound without vowel", examples: [{ arabic: "دَ + رَ + سَ = دَرَسَ", translation: "da + ra + sa = darasa (he studied)" }] },
      exercises: [{ type: "fill_blank", instruction: "Identify.", instructionArabic: "تَعَرَّفْ.", items: [{ sentence: "الحَرْفُ اللَّازِمُ ثَقِيل مُقَابِل السِّين: ___", blank: 1, hint: "Sad" }, { sentence: "حَرْفٌ ذُو ثَلَاثِ نُقَطٍ فَوْق مِنَ الأَسْنَان: ___", blank: 1, hint: "Shin" }], answers: ["صَ", "شَ"] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // JUZ AMMA — SURAH STUDY
  // ══════════════════════════════════════════════════════════════════════════
  "quran-juz-amma": [
    {
      bookId: "quran-juz-amma", lessonNum: 1,
      title: "Introduction to Juz Amma", titleArabic: "مُقَدِّمَةُ جُزْءِ عَمَّ",
      description: "Overview of the 30th Juz — its importance, structure, and study method.",
      pages: [
        { id: 1, arabic: "جُزْءُ عَمَّ: الجُزْءُ الثَّلَاثُون مِنَ القُرْآن.\nيَبْدَأُ بِالنَّبَأ (٧٨) وَيَنْتَهِي بِالنَّاس (١١٤).\n٣٧ سُورَة — أَقْصَرُ سُوَرِ القُرْآن.\nمَوَاضِيعُهُ: البَعْث — الجَزَاء — التَّوْحِيد — أَخْبَارُ الأَنْبِيَاء", translation: "Juz Amma: the 30th section of the Quran. Starts with An-Naba (78), ends with An-Nas (114). 37 surahs — the shortest in the Quran. Topics: Resurrection / Recompense / Tawhid / Prophets' stories", transliteration: "Juzʾu ʿamma: al-juzʾu th-thalāthūna mina l-Qurʾān.", note: "Most begin Quran memorization with Juz Amma — short, powerful, frequently recited in daily prayers." },
        { id: 2, arabic: "سُوَرُ جُزْءِ عَمَّ:\nالنَّبَأ — النَّازِعَات — عَبَسَ — التَّكْوِير — الانْفِطَار\nالمُطَفِّفِين — الانْشِقَاق — البُرُوج — الطَّارِق — الأَعْلَى\nالغَاشِيَة — الفَجْر — البَلَد — الشَّمْس — اللَّيْل\nالضُّحَى — الشَّرْح — التِّين — العَلَق — القَدْر\nالبَيِّنَة — الزَّلْزَلَة — العَادِيَات — القَارِعَة — التَّكَاثُر\nالعَصْر — الهُمَزَة — الفِيل — قُرَيْش — المَاعُون\nالكَوْثَر — الكَافِرُون — النَّصْر — المَسَد — الإِخْلَاص — الفَلَق — النَّاس", translation: "All 37 surahs of Juz Amma listed in order", transliteration: "Suwar Juzʾi ʿAmma.", note: "Memorize this list! Knowing the order helps navigate between surahs in prayer." },
      ],
      vocabulary: [
        { arabic: "جُزْء", transliteration: "juzʾ", english: "section (1/30 of Quran)", pos: "noun (m)", plural: "أَجْزَاء" },
        { arabic: "سُورَة", transliteration: "sūrah", english: "chapter", pos: "noun (f)", plural: "سُوَر" },
        { arabic: "آيَة", transliteration: "āyah", english: "verse", pos: "noun (f)", plural: "آيَات" },
        { arabic: "حِفْظ", transliteration: "ḥifẓ", english: "memorization", pos: "noun (m)" },
        { arabic: "بَعْث", transliteration: "baʿth", english: "resurrection", pos: "noun (m)" },
      ],
      grammar: { title: "How to Study Juz Amma", titleArabic: "كَيْفَ تَدْرُسُ جُزْءَ عَمَّ", explanation: "Study method per surah:\n1. Listen 10 times (Sheikh Maher Al-Mu'aqly recommended)\n2. Read Arabic text from mushaf\n3. Learn meaning of each word\n4. Memorize one ayah at a time\n5. Link new ayah to previous until surah complete\n6. Practice with Tajweed\n7. Recite in Salah — the final test\n\nSchedule: one surah/week for shorter ones", examples: [{ arabic: "«خَيْرُكُمْ مَنْ تَعَلَّمَ القُرْآنَ وَعَلَّمَه»", translation: "'The best of you learn the Quran and teach it.' (Bukhari)" }] },
      exercises: [{ type: "choose", instruction: "About Juz Amma.", instructionArabic: "أَجِبْ عَنْ جُزْءِ عَمَّ.", items: [{ question: "How many surahs in Juz Amma?", options: ["30", "37", "40", "45"], answer: 1 }, { question: "Which surah begins Juz Amma?", options: ["Al-Fatiha", "Al-Ikhlas", "An-Naba", "An-Nas"], answer: 2 }], answers: [1, 2] }],
    },
    {
      bookId: "quran-juz-amma", lessonNum: 2,
      title: "Surah An-Nas — The Mankind", titleArabic: "سُورَةُ النَّاس",
      description: "Complete study of Surah An-Nas — the last surah of the Quran.",
      pages: [
        { id: 1, arabic: "﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ مَلِكِ النَّاسِ إِلَهِ النَّاسِ﴾\nثَلَاثَةُ أَسْمَاء لِلهِ تَعَالَى: الرَّبّ — المَلِك — الإِلَه\nالرُّبُوبِيَّة — المُلْك — الأُلُوهِيَّة", translation: "'Say: I seek refuge with the Lord of mankind, the King of mankind, the God of mankind.' Three divine names: Lord (Rubūbiyyah) — King (Mulk) — God (Ulūhiyyah)", transliteration: "Qul aʿūdhu bi-rabbi n-nāsi maliki n-nāsi ilāhi n-nās.", note: "Progression from general (Lord) to specific (God — deserving worship). Shows all three types of Tawhid." },
        { id: 2, arabic: "﴿مِن شَرِّ الوَسْوَاسِ الخَنَّاسِ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ مِنَ الجِنَّةِ وَالنَّاسِ﴾\nالخَنَّاس: يَتَأَخَّرُ وَيَخْتَفِي عِنْدَ ذِكْرِ اللهِ.\nالوَسْوَاس: الشَّيْطَان يُوَسْوِسُ فِي القَلْب دَائِمًا.", translation: "'From the evil of the whisperer who withdraws — who whispers into the hearts of people — from among jinn and men.' Al-Khannās: retreats when Allah is remembered. He whispers into hearts constantly.", transliteration: "Min sharri l-waswāsi l-khannās alladhī yuwaswisu fī ṣudūri n-nās mina l-jinnati wa n-nās.", note: "The antidote: remember Allah (dhikr) — Shaytan retreats instantly. The more you remember Allah, the less he can whisper." },
      ],
      vocabulary: [
        { arabic: "وَسْوَاس", transliteration: "waswās", english: "the whisperer (Shaytan) / whisper", pos: "noun (m)" },
        { arabic: "خَنَّاس", transliteration: "khannās", english: "the retreater (Shaytan who withdraws)", pos: "noun (m)" },
        { arabic: "صُدُور", transliteration: "ṣudūr", english: "hearts / chests (plural of sadr)", pos: "noun (m.pl)" },
        { arabic: "جِنَّة", transliteration: "jinnah", english: "jinn / the jinn kind", pos: "noun (f)" },
      ],
      grammar: { title: "Protection from Shaytan's Whispers", titleArabic: "الحِمَايَةُ مِنْ وَسْوَسَةِ الشَّيْطَان", explanation: "Methods the Quran and Sunnah teach:\n1. أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيم — before Quran, prayer, other acts\n2. Read Ayat Al-Kursi before sleep — protects all night\n3. Read Surah Al-Baqarah in the home — Shaytan doesn't enter\n4. Regular dhikr morning and evening\n5. Surah Al-Falaq and An-Nas 3x morning/evening\n\nKey insight: Shaytan WITHDRAWS (خَنَّاس) when you remember Allah — so the solution is always more dhikr.", examples: [{ arabic: "«اقْرَؤُوا سُورَةَ البَقَرَةِ فِي بُيُوتِكُمْ — لَا يَدْخُلُهَا الشَّيْطَان»", translation: "'Read Al-Baqarah in your homes — Shaytan does not enter them.' (Muslim)" }] },
      exercises: [{ type: "fill_blank", instruction: "Complete Surah An-Nas.", instructionArabic: "أَكْمِلْ سُورَةَ النَّاس.", items: [{ sentence: "﴿قُلْ أَعُوذُ بِرَبِّ ___﴾", blank: 1, hint: "mankind" }, { sentence: "﴿مِن شَرِّ ___ الخَنَّاسِ﴾", blank: 1, hint: "the whisperer" }], answers: ["النَّاسِ", "الوَسْوَاسِ"] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // AQEEDAH AL-WASITIYYA
  // ══════════════════════════════════════════════════════════════════════════
  "aqeedah-wasitiyya": [
    {
      bookId: "aqeedah-wasitiyya", lessonNum: 1,
      title: "Introduction to Al-Wasitiyya", titleArabic: "مُقَدِّمَةُ العَقِيدَةِ الوَاسِطِيَّة",
      description: "Ibn Taymiyyah's foundational text on Sunni creed — introduction and methodology.",
      pages: [
        { id: 1, arabic: "العَقِيدَةُ الوَاسِطِيَّة:\nأَلَّفَهَا ابنُ تَيْمِيَّة (٦٦١–٧٢٨هـ) — شَيْخُ الإِسْلَام.\nمَنْهَجُهَا: الكِتَابُ وَالسُّنَّة وَفَهْمُ سَلَفِ الأُمَّة.\nمَوَاضِيعُهَا: أَسْمَاءُ اللهِ وَصِفَاتُهُ — الإِيمَانُ — مَنْهَجُ أَهْلِ السُّنَّة", translation: "Al-Wasitiyya: Written by Ibn Taymiyyah (661-728 AH). Methodology: Quran + Sunnah + understanding of the Salaf. Topics: Allah's names/attributes / Iman / Methodology of Ahl Al-Sunnah", transliteration: "Al-ʿaqīdatu l-wāsiṭiyyah: allafahu Ibnu Taymiyyah.", note: "Ibn Taymiyyah was a Hanbali scholar — student of Ibn Qudamah's tradition. Imprisoned for scholarly positions." },
        { id: 2, arabic: "مَنْهَجُ أَهْلِ السُّنَّةِ فِي الصِّفَات:\nالإِيمَانُ بِأَسْمَاءِ اللهِ وَصِفَاتِهِ كَمَا جَاءَتْ بِلَا:\n• تَأْوِيل (تَحْرِيف المَعْنَى)\n• تَعْطِيل (إِنْكَار الصِّفَة)\n• تَمْثِيل (تَشْبِيهُ اللهِ بِالخَلْق)\n• تَكْيِيف (السُّؤَال عَنِ الكَيْفِيَّة)\n﴿لَيْسَ كَمِثْلِهِ شَيْءٌ وَهُوَ السَّمِيعُ البَصِير﴾ [الشُّورَى: ١١]", translation: "Methodology for Allah's attributes: Affirm as they came WITHOUT: distortion (taʾwīl) / denial (taʿṭīl) / likening to creation (tamthīl) / asking modality (takyīf). 'There is nothing like Him, and He is All-Hearing, All-Seeing.' (42:11)", transliteration: "Manhaju Ahli s-Sunnah fī ṣ-ṣifāt.", note: "﴿لَيْسَ كَمِثْلِهِ شَيْء﴾ = negates any likeness. ﴿وَهُوَ السَّمِيعُ البَصِير﴾ = affirms the attributes. Both together = the Sunni method." },
        { id: 3, arabic: "وَسَطِيَّةُ أَهْلِ السُّنَّة:\n• بَيْنَ الجَبَرِيَّة (إِنْكَار إِرَادَة العَبْد) وَالقَدَرِيَّة (إِنْكَار الإِرَادَة الإِلَهِيَّة)\n• بَيْنَ الخَوَارِج (تَكْفِير المُسْلِمِين) وَالمُرْجِئَة (أَنَّ الإِيمَان لَا يَزِيدُ وَلَا يَنْقُص)\n• الإِيمَانُ قَوْلٌ وَعَمَلٌ وَعَقِيدَة — يَزِيدُ بِالطَّاعَة وَيَنْقُصُ بِالمَعْصِيَة", translation: "Middle path: between Jabariyyah (denying human will) and Qadariyyah (denying divine will) / between Khawarij (excommunicating Muslims) and Murji'ah (saying faith never changes). Iman = statement + action + belief — increases with obedience, decreases with sin.", transliteration: "Wasaṭiyyatu Ahli s-Sunnah.", note: "أَهْلُ السُّنَّةِ وَالجَمَاعَة = the mainstream Islamic orthodoxy following Prophet ﷺ and Companions." },
      ],
      vocabulary: [
        { arabic: "وَسَطِيَّة", transliteration: "wasaṭiyyah", english: "middle path / moderation", pos: "noun (f)" },
        { arabic: "تَأْوِيل", transliteration: "taʾwīl", english: "distorting the meaning", pos: "noun (m)" },
        { arabic: "تَعْطِيل", transliteration: "taʿṭīl", english: "denying attributes", pos: "noun (m)" },
        { arabic: "تَمْثِيل", transliteration: "tamthīl", english: "likening Allah to creation", pos: "noun (m)" },
        { arabic: "سَلَف", transliteration: "salaf", english: "righteous predecessors (first 3 gen)", pos: "noun (m)" },
        { arabic: "فِرْقَة", transliteration: "firqah", english: "sect", pos: "noun (f)", plural: "فِرَق" },
      ],
      grammar: { title: "Four Prohibitions with Allah's Attributes", titleArabic: "المَحْظُورَاتُ الأَرْبَعَة", explanation: "1. التَّأْوِيل: Changing meaning from apparent sense\n   Wrong: 'Allah's Hand = His power'\n\n2. التَّعْطِيل: Denying the attribute entirely\n   Wrong: 'Allah has no hand'\n\n3. التَّمْثِيل: Allah's Hand = like a human hand\n\n4. التَّكْيِيف: Asking 'how' is Allah's Hand\n\nCORRECT: 'Allah has a Hand, as befits His Majesty, unlike human hands' — affirm and move on.", examples: [{ arabic: "﴿لَيْسَ كَمِثْلِهِ شَيْءٌ وَهُوَ السَّمِيعُ البَصِير﴾", translation: "Negate likeness + affirm attributes = the Sunni method (42:11)" }] },
      exercises: [{ type: "choose", instruction: "Identify the correct approach.", instructionArabic: "تَعَرَّفْ عَلَى المَنْهَجِ الصَّحِيح.", items: [{ question: "'Allah's Hand means His power — no literal hand.' This is:", options: ["Correct Sunni approach", "Taʾwīl (distortion)", "Takyīf", "Acceptable"], answer: 1 }, { question: "The correct approach to Allah's attributes is:", options: ["Deny all physical-sounding ones", "Affirm as they came — no distortion or likening", "Seek metaphorical meanings", "Suspend judgment"], answer: 1 }], answers: [1, 1] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // TAFSIR IBN KATHIR — SELECTED
  // ══════════════════════════════════════════════════════════════════════════
  "tafsir-ibn-kathir-selected": [
    {
      bookId: "tafsir-ibn-kathir-selected", lessonNum: 1,
      title: "Tafsir of Al-Fatiha (Ibn Kathir)", titleArabic: "تَفْسِيرُ الفَاتِحَةِ لِابْنِ كَثِير",
      description: "Ibn Kathir's detailed commentary on Al-Fatiha.",
      pages: [
        { id: 1, arabic: "قَالَ ابنُ كَثِير ﵀:\n«سُمِّيَتْ فَاتِحَةَ الكِتَابِ لِأَنَّهُ يُفْتَتَحُ بِهَا فِي المَصَاحِفِ وَفِي الصَّلَاةِ.»\nأَسْمَاؤُهَا: الفَاتِحَة — أُمُّ القُرْآن — السَّبْعُ المَثَانِي — الوَافِيَة — الشِّفَاء — الرُّقْيَة", translation: "Ibn Kathir: 'Called Fatihat Al-Kitab because it opens the Mushaf and the prayer.' Its names: Al-Fatiha / Mother of Quran / The Seven Oft-Repeated / The Sufficient / The Healing / The Ruqyah", transliteration: "Qāla Ibnu Kathīr ﵀.", note: "Ibn Kathir (701-774 AH) was a student of Ibn Taymiyyah. His Tafsir is known for citing many supporting hadiths." },
        { id: 2, arabic: "تَفْسِيرُ «الحَمْد» بِالتَّفْصِيل:\nالحَمْدُ يَتَضَمَّن:\n• الثَّنَاءُ عَلَى اللهِ بِصِفَاتِ الكَمَال\n• الشُّكْرُ عَلَى النِّعَم\n• التَّعْظِيمُ وَالتَّبْجِيل\nالفَرْقُ بَيْنَ الحَمْد وَالشُّكْر:\nالحَمْد أَعَمُّ — يَكُون مَعَ النِّعَم وَبِدُونِهَا\nالشُّكْر — مُقَابِل النِّعَم فَقَط\nكُلُّ شُكْرٍ حَمْد — لَيْسَ كُلُّ حَمْدٍ شُكْر", translation: "Al-Hamd in detail: encompasses praise / gratitude for blessings / glorification. Difference: Hamd = broader (with or without blessings) / Shukr = only for blessings. Every shukr is hamd, not every hamd is shukr.", transliteration: "Tafsīru l-ḥamd bi-t-tafṣīl.", note: "Key distinction: We praise Allah even in hardship (hamd). We thank Him specifically for blessings (shukr)." },
        { id: 3, arabic: "مَنْهَجُ ابنِ كَثِير فِي التَّفْسِير:\n١. تَفْسِيرُ القُرْآنِ بِالقُرْآن — الأَفْضَل\n٢. تَفْسِيرُ القُرْآنِ بِالسُّنَّة\n٣. أَقْوَالُ الصَّحَابَة\n٤. أَقْوَالُ التَّابِعِين\n٥. اللُّغَةُ العَرَبِيَّة", translation: "Ibn Kathir's method: 1.Quran by Quran (best) / 2.By Sunnah / 3.Companions' views / 4.Successors' views / 5.Arabic language analysis. This hierarchy ensures authentic interpretation.", transliteration: "Manhaju Ibni Kathīr fī t-tafsīr.", note: "This hierarchy ensures authentic interpretation, not personal opinion — the safest method." },
      ],
      vocabulary: [
        { arabic: "تَفْسِير", transliteration: "tafsīr", english: "Quranic commentary", pos: "noun (m)" },
        { arabic: "حَمْد", transliteration: "ḥamd", english: "praise (absolute)", pos: "noun (m)" },
        { arabic: "شُكْر", transliteration: "shukr", english: "thanks (for blessings)", pos: "noun (m)" },
        { arabic: "إِسْنَاد", transliteration: "isnād", english: "chain of narration", pos: "noun (m)" },
        { arabic: "رِوَايَة", transliteration: "riwāyah", english: "narration", pos: "noun (f)" },
      ],
      grammar: { title: "Ibn Kathir's Tafsir Method", titleArabic: "مَنْهَجُ ابنِ كَثِير", explanation: "Best method: Quran explains Quran — Allah explains His own words.\n\nExample: 'Those You favored' (Al-Fatiha)\n↓ Quran explains:\n'Those upon whom Allah has bestowed favor of the prophets, the truthful, the martyrs, and the righteous.' (4:69)\n\nSecond method: Sunnah — Prophet ﷺ best understood the Quran.\nThird: Companions — witnessed the revelation.\nFourth: Successors — learned from Companions.\nFifth: Arabic language — most refined tool.", examples: [{ arabic: "﴿الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ﴾ فُسِّرَتْ بِآيَةِ النِّسَاء ٤:٦٩", translation: "'Those You favored' explained by An-Nisa 4:69 — Quran by Quran" }] },
      exercises: [{ type: "choose", instruction: "About Ibn Kathir's Tafsir.", instructionArabic: "أَجِبْ عَنْ تَفْسِيرِ ابنِ كَثِير.", items: [{ question: "Best method of Tafsir?", options: ["Personal interpretation", "Quran explains Quran", "Hadith only", "Arabic language only"], answer: 1 }, { question: "Difference between Hamd and Shukr?", options: ["Identical", "Hamd broader — with/without blessings; Shukr only for blessings", "Shukr broader", "Different languages"], answer: 1 }], answers: [1, 1] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // THEMATIC TAFSIR
  // ══════════════════════════════════════════════════════════════════════════
  "tafsir-thematic": [
    {
      bookId: "tafsir-thematic", lessonNum: 1,
      title: "The Quran on the Human Soul", titleArabic: "القُرْآنُ وَالنَّفْس البَشَرِيَّة",
      description: "Thematic study of how the Quran describes the human soul and its development.",
      pages: [
        { id: 1, arabic: "ثَلَاثَةُ أَنْوَاعٍ لِلنَّفْسِ فِي القُرْآن:\n١. النَّفْسُ الأَمَّارَةُ بِالسُّوء: ﴿إِنَّ النَّفْسَ لَأَمَّارَةٌ بِالسُّوءِ إِلَّا مَا رَحِمَ رَبِّي﴾ [يُوسُف: ٥٣]\n٢. النَّفْسُ اللَّوَّامَة: ﴿وَلَا أُقْسِمُ بِالنَّفْسِ اللَّوَّامَة﴾ [القِيَامَة: ٢]\n٣. النَّفْسُ المُطْمَئِنَّة: ﴿يَا أَيَّتُهَا النَّفْسُ المُطْمَئِنَّةُ ارْجِعِي إِلَى رَبِّكِ رَاضِيَةً مَرْضِيَّة﴾ [الفَجْر: ٢٧-٢٨]", translation: "Three types of soul in the Quran:\n1. Commanding soul (inclines to evil): 'The soul commands to evil, except what my Lord has mercy on.' (12:53)\n2. Self-reproaching soul: 'And I swear by the self-reproaching soul.' (75:2)\n3. Tranquil soul: 'O tranquil soul! Return to your Lord, pleased and pleasing.' (89:27-28)", transliteration: "Thalāthatu anwāʿin li-n-nafsi fī l-Qurʾān.", note: "These are not three different people — they describe STATES that every person moves between. The goal: reach the مُطْمَئِنَّة (tranquil) state." },
        { id: 2, arabic: "كَيْفَ تُزَكِّي نَفْسَك:\n﴿قَدْ أَفْلَحَ مَن زَكَّاهَا﴾ [الشَّمْس: ٩]\nالتَّزْكِيَة بِـ:\n• الإِيمَان الرَّاسِخ\n• الصَّلَاة — الصِّيَام — الذِّكْر\n• الاسْتِغْفَار وَالتَّوْبَة\n• صُحْبَة الصَّالِحِين\n• تِلَاوَة القُرْآن بِتَدَبُّر", translation: "'He who purifies it has succeeded.' (91:9). Purification through: Strong Iman / Prayer-fasting-dhikr / Seeking forgiveness / Righteous company / Quran with contemplation", transliteration: "Kayfa tuzakkī nafsak. ﴿Qad aflaḥa man zakkāhā﴾", note: "تَزْكِيَة = purification and growth of the soul. The Quran + Sunnah are the manual for the soul's development." },
      ],
      vocabulary: [
        { arabic: "نَفْس", transliteration: "nafs", english: "soul / self", pos: "noun (f)", plural: "أَنْفُس" },
        { arabic: "أَمَّارَة", transliteration: "ammārah", english: "commanding (to evil)", pos: "adjective" },
        { arabic: "لَوَّامَة", transliteration: "lawwāmah", english: "self-reproaching", pos: "adjective" },
        { arabic: "مُطْمَئِنَّة", transliteration: "muṭmaʾinnah", english: "tranquil / at peace", pos: "adjective" },
        { arabic: "تَزْكِيَة", transliteration: "tazkiyah", english: "purification of the soul", pos: "noun (f)" },
      ],
      grammar: { title: "Journey of the Soul in the Quran", titleArabic: "رِحْلَةُ النَّفْسِ فِي القُرْآن", explanation: "The soul's journey:\n\n1. النَّفْسُ الأَمَّارَة (default state):\n• Inclines to desires, laziness, sin\n• Needs discipline and worship to move beyond\n\n2. النَّفْسُ اللَّوَّامَة (awakened state):\n• Recognizes mistakes and reproaches itself\n• Sign of Iman — the believer never stops questioning themselves\n\n3. النَّفْسُ المُطْمَئِنَّة (achieved state):\n• At peace with Allah's decree\n• Content in worship\n• Enters Paradise: 'Return to your Lord, pleased and pleasing'", examples: [{ arabic: "﴿وَنَفْسٍ وَمَا سَوَّاهَا فَأَلْهَمَهَا فُجُورَهَا وَتَقْوَاهَا﴾ [الشَّمْس: ٧-٨]", translation: "'By the soul and He who proportioned it — He inspired it with its wickedness and its righteousness.' (91:7-8) — the soul has potential for both." }] },
      exercises: [{ type: "choose", instruction: "About the Quran's view of the soul.", instructionArabic: "أَجِبْ عَنِ النَّفْسِ فِي القُرْآن.", items: [{ question: "Which soul level is the goal for a believer?", options: ["Ammārah", "Lawwāmah", "Muṭmaʾinnah", "All are equal"], answer: 2 }, { question: "﴿قَدْ أَفْلَحَ مَن زَكَّاهَا﴾ means:", options: ["He who tested it succeeded", "He who purified it succeeded", "He who abandoned it succeeded", "He who strengthened it failed"], answer: 1 }], answers: [2, 1] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // FIQH AL-MUAMALAT (Islamic Finance & Transactions)
  // ══════════════════════════════════════════════════════════════════════════
  "fiqh-muamalat": [
    {
      bookId: "fiqh-muamalat", lessonNum: 1,
      title: "Introduction to Islamic Finance", titleArabic: "مُقَدِّمَةٌ فِي فِقْهِ المُعَامَلَات",
      description: "Principles of Islamic transactions — what is permitted and what is prohibited.",
      pages: [
        { id: 1, arabic: "المُعَامَلَاتُ: كُلُّ تَصَرُّفٍ مَالِيٍّ بَيْنَ النَّاسِ.\nالأَصْلُ فِي المُعَامَلَات: الإِبَاحَة (الإِذْن) حَتَّى يَثْبُتَ التَّحْرِيم.\nالمُحَرَّمَات الكُبْرَى: الرِّبَا — الغَرَر (الجَهَالَة) — الغِشّ — الاحْتِكَار", translation: "Muamalat: all financial transactions between people. The principle: permissible unless prohibition is established. Major prohibitions: Riba (interest) / Gharar (uncertainty) / Deception / Monopoly", transliteration: "Al-muʿāmalātu: kullu taṣarufin māliyyin bayna n-nās.", note: "الأَصْلُ فِي المُعَامَلَات الإِبَاحَة = unlike worship (which requires evidence to permit), transactions are permitted unless forbidden." },
        { id: 2, arabic: "الرِّبَا: الكَبِيرَةُ الكُبْرَى\n﴿وَأَحَلَّ اللهُ البَيْعَ وَحَرَّمَ الرِّبَا﴾ [البَقَرَة: ٢٧٥]\n«آكِلُ الرِّبَا وَمُؤْكِلُهُ وَكَاتِبُهُ وَشَاهِدَاهُ — كُلُّهُمْ سَوَاء.» [مُسْلِم]\nأَنْوَاعُه: رِبَا الفَضْل — رِبَا النَّسِيئَة\nالبَدِيل الإِسْلَامِيّ: المُضَارَبَة — المُشَارَكَة — المُرَابَحَة", translation: "'Allah permitted trade and prohibited Riba.' (2:275). 'The one who consumes riba, the one who pays it, the recorder, and the two witnesses — all are equal (in sin).' (Muslim). Types: Riba Al-Fadl / Riba Al-Nasiah. Islamic alternatives: Mudarabah / Musharakah / Murabahah", transliteration: "Ar-ribā: al-kabīratu l-kubrā.", note: "الرِّبَا = any increase stipulated in a loan/exchange. Even $1 profit guaranteed on a loan = riba." },
      ],
      vocabulary: [
        { arabic: "مُعَامَلَات", transliteration: "muʿāmalāt", english: "financial transactions", pos: "noun (f.pl)" },
        { arabic: "رِبَا", transliteration: "ribā", english: "usury / interest (prohibited)", pos: "noun (m)" },
        { arabic: "غَرَر", transliteration: "gharar", english: "uncertainty / risk (prohibited)", pos: "noun (m)" },
        { arabic: "إِبَاحَة", transliteration: "ibāḥah", english: "permissibility (default)", pos: "noun (f)" },
        { arabic: "بَيْع", transliteration: "bayʿ", english: "trade / sale", pos: "noun (m)" },
        { arabic: "عَقْد", transliteration: "ʿaqd", english: "contract / agreement", pos: "noun (m)", plural: "عُقُود" },
      ],
      grammar: { title: "Principles of Islamic Transactions", titleArabic: "مَبَادِئُ المُعَامَلَات الإِسْلَامِيَّة", explanation: "Five major prohibitions:\n1. الرِّبَا (Riba): interest/usury — absolutely forbidden\n2. الغَرَر (Gharar): excessive uncertainty — invalidates contracts\n3. الغِشّ (Ghishsh): deception — Prophet cursed the deceiver\n4. الاحْتِكَار (Ihtikār): monopoly hoarding — forbidden\n5. الرِّشْوَة (Rishwah): bribery — cursed in hadith\n\nValid contracts need:\n1. Offer (ايجاب) and Acceptance (قبول)\n2. Capable parties\n3. Known and owned item\n4. No prohibited element", examples: [{ arabic: "«مَنْ غَشَّنَا فَلَيْسَ مِنَّا»", translation: "'Whoever deceives us is not from us.' (Muslim)" }] },
      exercises: [{ type: "choose", instruction: "Classify these transactions.", instructionArabic: "صَنِّفْ هَذِهِ المُعَامَلَات.", items: [{ question: "Bank loan with guaranteed 5% annual interest — this is:", options: ["Permitted (minor issue)", "Riba — absolutely forbidden", "Gharar only", "Makruh only"], answer: 1 }, { question: "The default ruling for new financial instruments is:", options: ["Haram until scholars permit it", "Permissible until prohibition is established", "Requires scholars' approval first", "Only permitted for necessity"], answer: 1 }], answers: [1, 1] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // AQEEDAH AL-TAHAWIYYA
  // ══════════════════════════════════════════════════════════════════════════
  "aqeedah-tahawiyya": [
    {
      bookId: "aqeedah-tahawiyya", lessonNum: 1,
      title: "Introduction to Al-Tahawiyya", titleArabic: "مُقَدِّمَةُ العَقِيدَةِ الطَّحَاوِيَّة",
      description: "Imam Al-Tahawi's classic statement of Sunni creed — introduction and key principles.",
      pages: [
        { id: 1, arabic: "العَقِيدَةُ الطَّحَاوِيَّة:\nأَلَّفَهَا الإِمَامُ أَبُو جَعْفَرٍ الطَّحَاوِيّ (٢٢٩–٣٢١هـ).\nقَالَ: «هَذَا ذِكْرُ بَيَانِ اعْتِقَادِ أَهْلِ السُّنَّةِ وَالجَمَاعَة.»\nأَهَمِّيَّتُها: أَجْمَعَ العُلَمَاءُ عَلَى صِحَّةِ مَا فِيهَا — يُدَرَّسُ فِي كُلِّ أَرْجَاءِ العَالَمِ الإِسْلَامِي", translation: "Al-Tahawiyya: Written by Imam Abu Ja'far Al-Tahawi (229-321 AH). He said: 'This is a statement of the belief of Ahl Al-Sunnah wal Jama'ah.' Importance: Scholars unanimously agree on its correctness — studied worldwide.", transliteration: "Al-ʿaqīdatu ṭ-ṭaḥāwiyyah: allafahu l-Imāmu Abū Jaʿfarin ṭ-Ṭaḥāwī.", note: "Al-Tahawi was a Hanafi scholar who wrote the most concise and comprehensive summary of Sunni creed. Short enough to memorize, complete enough to cover all major issues." },
        { id: 2, arabic: "أَوَّلُ مَا يَذْكُرُهُ الطَّحَاوِيّ:\n«نَقُولُ فِي تَوْحِيدِ اللهِ مُعْتَقِدِينَ بِتَوْفِيقِ اللهِ:\nإِنَّ اللهَ وَاحِدٌ لَا شَرِيكَ لَه\nوَلَا شَيْءَ مِثْلُهُ\nوَلَا شَيْءَ يُعْجِزُهُ\nوَلَا إِلَهَ غَيْرُهُ»", translation: "First statement of Al-Tahawi: 'We say about Allah's oneness, with Allah's assistance: Allah is One, no partner. Nothing is like Him. Nothing is impossible for Him. There is no god besides Him.'", transliteration: "«Naqūlu fī tawḥīdi llāhi muʿtaqidīna bi-tawfīqi llāh: Inna llāha wāḥidun lā sharīka lah...»", note: "This opening covers in 4 short lines: Tawhid Al-Ulūhiyyah / absolute transcendence / omnipotence / absolute exclusivity. The foundation of all creed." },
        { id: 3, arabic: "قِسْمٌ مُهِمٌّ: الإِيمَانُ بِالقَضَاءِ وَالقَدَر\nقَالَ الطَّحَاوِيّ:\n«وَأَصْلُ القَدَرِ سِرُّ اللهِ فِي خَلْقِهِ لَمْ يَطَّلِعْ عَلَى ذَلِكَ مَلَكٌ مُقَرَّبٌ وَلَا نَبِيٌّ مُرْسَل.\nالتَّعَمُّقُ وَالنَّظَرُ فِي ذَلِكَ ذَرِيعَةُ الخِذْلَان.»", translation: "Important section — Belief in Qadar: 'The root of Qadar is Allah's secret in His creation — no near angel nor sent prophet has been informed of it. Delving deeply and pondering it is a path to misguidance.'", transliteration: "«Wa aṣlu l-qadari sirru llāhi fī khalqihi...»", note: "Qadar is accepted by faith, not fully explained by logic. The correct approach: believe in it, act according to commands, and leave what Allah has kept secret." },
      ],
      vocabulary: [
        { arabic: "قَضَاء", transliteration: "qaḍāʾ", english: "divine decree (executed)", pos: "noun (m)" },
        { arabic: "قَدَر", transliteration: "qadar", english: "divine measure/decree", pos: "noun (m)" },
        { arabic: "تَوْفِيق", transliteration: "tawfīq", english: "Allah's guidance/facilitation", pos: "noun (m)" },
        { arabic: "إِجْمَاع", transliteration: "ijmāʿ", english: "scholarly consensus", pos: "noun (m)" },
        { arabic: "أَهْل السُّنَّة", transliteration: "ahlu s-sunnah", english: "People of the Sunnah (mainstream orthodoxy)", pos: "proper noun" },
      ],
      grammar: { title: "The Six Levels of Belief in Qadar", titleArabic: "مَرَاتِبُ الإِيمَانِ بِالقَدَر", explanation: "Belief in Qadar has six levels:\n\n1. العِلْم: Allah knows everything before it exists\n2. الكِتَابَة: Allah wrote everything in Al-Lawh Al-Mahfuz (Preserved Tablet) 50,000 yrs before creation\n3. المَشِيئَة: Everything happens by Allah's Will\n4. الخَلْق: Allah created everything including human actions\n\nAnd from the human side:\n5. الأَسْبَاب: Allah created human ability and choice\n6. المَسْؤُولِيَّة: Humans are responsible for their choices\n\nBoth determinism AND free will — the Sunni middle path.", examples: [{ arabic: "«كَتَبَ اللهُ مَقَادِيرَ الخَلَائِقِ قَبْلَ أَنْ يَخْلُقَ السَّمَاوَاتِ وَالأَرْضَ بِخَمْسِينَ أَلْفَ سَنَة»", translation: "'Allah wrote the measures of creation 50,000 years before creating the heavens and earth.' (Muslim)" }] },
      exercises: [{ type: "choose", instruction: "About Al-Tahawiyya.", instructionArabic: "أَجِبْ عَنِ الطَّحَاوِيَّة.", items: [{ question: "Who wrote Al-Aqeedah Al-Tahawiyya?", options: ["Ibn Taymiyyah", "Imam Al-Tahawi", "Imam Al-Nawawi", "Ibn Qudamah"], answer: 1 }, { question: "Al-Tahawi says about Qadar's root:", options: ["It's fully explained in the Quran", "It's Allah's secret — even angels don't know it", "It's understood through reason", "Scholars have full access to it"], answer: 1 }], answers: [1, 1] }],
    },
  ],

  // ══════════════════════════════════════════════════════════════════════════
  // HINGAAD NOORANIA
  // ══════════════════════════════════════════════════════════════════════════
  "hingaad-noorania": [
    {
      bookId: "hingaad-noorania", lessonNum: 1,
      title: "The Noorania Method — Introduction", titleArabic: "الطَّرِيقَةُ النُّورَانِيَّة — مُقَدِّمَة",
      description: "The systematic method for perfect Quranic pronunciation from scratch.",
      pages: [
        { id: 1, arabic: "الطَّرِيقَةُ النُّورَانِيَّة:\nأَسَّسَهَا العَلَّامَةُ النُّورِي مُحَمَّد (رَحِمَهُ اللهُ) مِنَ الهِنْ

function getLessonContent(bookId: string, lessonNum: number): LessonContent | null {
  const book = LESSONS[bookId];
  if (!book) return null;
  const lesson = book.find(l => l.lessonNum === lessonNum);
  if (lesson) return lesson;

  // Auto-generate for lessons beyond hand-authored content
  return {
    bookId,
    lessonNum,
    title: `Lesson ${lessonNum}`,
    titleArabic: `الدَّرْسُ ${lessonNum}`,
    description: `Continue your Arabic studies with lesson ${lessonNum}. This lesson builds on previous vocabulary and grammar patterns.`,
    pages: [
      {
        id: 1,
        arabic: "بِسْمِ اللهِ الرَّحْمَٰنِ الرَّحِيمِ.",
        translation: "In the name of Allah, the Most Gracious, the Most Merciful.",
        transliteration: "Bismi llāhi r-raḥmāni r-raḥīm.",
        note: "This lesson's content will be guided by your AI Arabic Teacher. Click 'Ask AI Teacher' to start an interactive session for this topic.",
      },
    ],
    vocabulary: [],
    grammar: {
      title: "Continue with AI Teacher",
      titleArabic: "تَابِعْ مَعَ مُعَلِّمِ الذَّكَاء الاصْطِنَاعِي",
      explanation: "For this lesson, your AI Arabic Teacher will guide you through the content interactively. Ask questions about vocabulary, grammar, exercises, or request an explanation of any Arabic topic.",
      examples: [],
    },
    exercises: [],
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/arabic/lessons/:bookId/:lessonNum", requireAuth, async (req: any, res) => {
  try {
    const { bookId, lessonNum } = req.params;
    const num = parseInt(lessonNum);
    if (isNaN(num) || num < 1) { res.status(400).json({ error: "Invalid lesson number" }); return; }
    const lesson = getLessonContent(bookId, num);
    if (!lesson) { res.status(404).json({ error: "No lessons available for this book" }); return; }
    res.json({ lesson });
  } catch (err) {
    logger.error({ err }, "Failed to get lesson content");
    res.status(500).json({ error: "Internal server error" });
  }
});

// AI feedback on student reading
router.post("/arabic/feedback", requireAuth, async (req: any, res) => {
  try {
    const { transcription, targetArabic, lessonTitle, mode = "reading" } = req.body;
    if (!transcription || !targetArabic) {
      res.status(400).json({ error: "transcription and targetArabic are required" });
      return;
    }

    const systemPrompt = `You are an expert Arabic language teacher and phonetics specialist. A student is learning Arabic and has just read aloud a passage. Your job is to give precise, encouraging, actionable feedback.

LESSON: ${lessonTitle || "Arabic reading practice"}
TARGET TEXT: ${targetArabic}
STUDENT'S TRANSCRIPTION: ${transcription}

Analyze the student's reading and provide:
1. ACCURACY SCORE (0-100) based on how closely the transcription matches the target
2. SPECIFIC ERRORS: Identify mispronounced or missing words with explanation
3. CORRECT PARTS: Acknowledge what they got right
4. PRONUNCIATION TIP: One specific tip to improve
5. ENCOURAGEMENT: A warm, motivating closing comment

Format your response in clear sections. Use Arabic words when referencing Arabic text. Keep it concise (150-200 words max). Be kind and encouraging, especially for beginners.`;

    const userMessage = `Please evaluate my reading of: "${targetArabic}"\nMy attempt (transcribed): "${transcription}"`;

    setSSEHeaders(res);
    await streamToResponse(
      { system: systemPrompt, messages: [{ role: "user" as const, content: userMessage }] },
      res
    );
  } catch (err) {
    logger.error({ err }, "Arabic feedback failed");
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
