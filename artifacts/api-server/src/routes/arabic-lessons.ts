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
};

// ─── Helper: get lesson content ───────────────────────────────────────────────

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
