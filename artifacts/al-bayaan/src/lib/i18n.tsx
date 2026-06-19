import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "en" | "ar" | "so";

type Translations = Record<string, string>;

const EN: Translations = {
  // ── Navigation ──────────────────────────────────────────────────────────────
  "nav.dashboard":       "Dashboard",
  "nav.quran":           "Quran",
  "nav.hifdh":           "Hifdh Tracker",
  "nav.mushaf":          "Mushaf Reader",
  "nav.library":         "Library",
  "nav.resources":       "Resources",
  "nav.aiTeacher":       "AI Teacher",
  "nav.tajweedTutor":    "Tajweed Tutor",
  "nav.voiceTeacher":    "Voice Teacher",
  "nav.videoTeacher":    "Video Teacher",
  "nav.studyPlanner":    "Study Planner",
  "nav.progress":        "My Progress",
  "nav.analytics":       "Analytics",
  "nav.bookmarks":       "Bookmarks",
  "nav.achievements":    "Achievements",
  "nav.leaderboard":     "Leaderboard",
  "nav.examCentre":      "Exam Centre",
  "nav.certificates":    "Certificates",
  "nav.parentDashboard": "Parent Dashboard",
  "nav.teacherView":     "Teacher View",
  "nav.admin":           "Admin",
  "nav.examBuilder":     "Exam Builder",
  "nav.messages":        "Messages",
  "nav.payments":        "Upgrade Plan",
  "nav.liveClassroom":   "Live Classroom",
  "nav.contentGen":      "AI Content",
  "nav.signOut":         "Sign Out",
  // Nav group labels
  "nav.group.learn":      "Learn",
  "nav.group.aiTeachers": "AI Teachers",
  "nav.group.progress":   "Progress",
  "nav.group.exams":      "Exams",
  "nav.group.family":     "Family",
  "nav.group.community":  "Community",
  "nav.group.admin":      "Admin",

  // ── General ─────────────────────────────────────────────────────────────────
  "general.loading":   "Loading…",
  "general.save":      "Save",
  "general.cancel":    "Cancel",
  "general.delete":    "Delete",
  "general.edit":      "Edit",
  "general.submit":    "Submit",
  "general.back":      "Back",
  "general.next":      "Next",
  "general.done":      "Done",
  "general.publish":   "Publish",
  "general.add":       "Add",
  "general.search":    "Search",
  "general.filter":    "Filter",
  "general.all":       "All",
  "general.new":       "New",
  "general.score":     "Score",
  "general.marks":     "Marks",
  "general.passed":    "Passed",
  "general.failed":    "Failed",
  "general.error":     "Something went wrong",
  "general.retry":     "Try Again",
  "general.empty":     "Nothing here yet",
  "general.close":     "Close",
  "general.open":      "Open",
  "general.continue":  "Continue",
  "general.start":     "Start",
  "general.play":      "Play",
  "general.pause":     "Pause",
  "general.stop":      "Stop",

  // ── Dashboard ────────────────────────────────────────────────────────────────
  "dash.welcome":          "Welcome back",
  "dash.hadith":           "\"Read the Quran, for it will come as an intercessor for its reciters on the Day of Resurrection.\"",
  "dash.dailyGoal":        "Daily Goal",
  "dash.goalReached":      "Goal reached! Mashallah, keep going.",
  "dash.minutesLeft":      "minutes left to reach your daily goal",
  "dash.streak":           "Day Streak",
  "dash.totalXP":          "Total XP",
  "dash.ayahsRead":        "Ayahs Read",
  "dash.avgAccuracy":      "Avg Accuracy",
  "dash.totalTime":        "Total Time",
  "dash.failedLoad":       "Failed to load dashboard.",

  // ── Notifications ────────────────────────────────────────────────────────────
  "notif.title":       "Notifications",
  "notif.markAllRead": "Mark all read",
  "notif.empty":       "No notifications yet",
  "notif.examPassed":  "Exam Passed!",
  "notif.certEarned":  "Certificate Earned",
  "notif.streakAlert": "Keep your streak!",
  "notif.teacherMsg":  "Message from Teacher",

  // ── Library ──────────────────────────────────────────────────────────────────
  "lib.title":      "Islamic Digital Library",
  "lib.subtitle":   "books across Islamic sciences",
  "lib.search":     "Search books, authors, topics…",
  "lib.inProgress": "In Progress",
  "lib.completed":  "Completed",
  "lib.noBooks":    "No books found",
  "lib.noBooksSub": "Try a different category or search term",
  "lib.continue":   "Continue →",
  "lib.start":      "Start →",
  "lib.featured":   "Featured",
  "lib.lessons":    "lessons",

  // ── Mushaf Reader ────────────────────────────────────────────────────────────
  "mushaf.title":     "Mushaf Reader",
  "mushaf.subtitle":  "Full Quran page-by-page reading",
  "mushaf.page":      "Page",
  "mushaf.juz":       "Juz",
  "mushaf.surah":     "Surah",
  "mushaf.bookmarks": "bookmarks",
  "mushaf.verses":    "verses",
  "mushaf.complete":  "complete",
  "mushaf.playPage":  "Play this page",
  "mushaf.bookmark":  "Bookmark page",
  "mushaf.resume":    "Resume last position",

  // ── Hifdh ────────────────────────────────────────────────────────────────────
  "hifdh.title":    "Hifdh Tracker",
  "hifdh.subtitle": "Track your Quran memorization with spaced repetition",
  "hifdh.addSurah": "Add Surah",
  "hifdh.myHifdh":  "My Hifdh",
  "hifdh.aiCoach":  "AI Hifdh Coach",
  "hifdh.strength": "Strength",
  "hifdh.revisions":"Revisions",
  "hifdh.nextRevision":     "Next revision",
  "hifdh.status.learning":  "Learning",
  "hifdh.status.memorized": "Memorized",
  "hifdh.status.weak":      "Needs Review",
  "hifdh.status.strong":    "Strong",

  // ── Quran / Learn ────────────────────────────────────────────────────────────
  "learn.title":        "Quran",
  "learn.selectSurah":  "Select a Surah",
  "learn.listenFirst":  "Listen first",
  "learn.record":       "Record",
  "learn.stopRecording":"Stop recording",
  "learn.sendForReview":"Send for review",
  "learn.feedback":     "Feedback",
  "learn.accuracy":     "Accuracy",
  "learn.missed":       "Missed words",
  "learn.extra":        "Extra words",
  "learn.correct":      "Correct words",

  // ── Exams / Certs ────────────────────────────────────────────────────────────
  "exams.title":    "Exam Centre",
  "certs.title":    "Certificates",
  "certs.download": "Download PDF",
  "certs.share":    "Share",

  // ── Auth ─────────────────────────────────────────────────────────────────────
  "auth.signIn":  "Sign In",
  "auth.signUp":  "Get Started Free",
  "auth.signOut": "Sign Out",
};

const AR: Translations = {
  // ── Navigation ──────────────────────────────────────────────────────────────
  "nav.dashboard":       "لوحة التحكم",
  "nav.quran":           "القرآن الكريم",
  "nav.hifdh":           "تتبع الحفظ",
  "nav.mushaf":          "قارئ المصحف",
  "nav.library":         "المكتبة",
  "nav.resources":       "الموارد",
  "nav.aiTeacher":       "المعلم الذكي",
  "nav.tajweedTutor":    "مدرس التجويد",
  "nav.voiceTeacher":    "المعلم الصوتي",
  "nav.videoTeacher":    "المعلم المرئي",
  "nav.studyPlanner":    "مخطط الدراسة",
  "nav.progress":        "تقدمي",
  "nav.analytics":       "التحليلات",
  "nav.bookmarks":       "الإشارات المرجعية",
  "nav.achievements":    "الإنجازات",
  "nav.leaderboard":     "لوحة المتصدرين",
  "nav.examCentre":      "مركز الامتحانات",
  "nav.certificates":    "الشهادات",
  "nav.parentDashboard": "لوحة الوالدين",
  "nav.teacherView":     "عرض المعلم",
  "nav.admin":           "الإدارة",
  "nav.examBuilder":     "منشئ الامتحانات",
  "nav.messages":        "الرسائل",
  "nav.payments":        "ترقية الخطة",
  "nav.liveClassroom":   "الفصل الحي",
  "nav.contentGen":      "محتوى ذكي",
  "nav.signOut":         "تسجيل الخروج",
  "nav.group.learn":      "التعلم",
  "nav.group.aiTeachers": "المعلمون الأذكياء",
  "nav.group.progress":   "التقدم",
  "nav.group.exams":      "الامتحانات",
  "nav.group.family":     "الأسرة",
  "nav.group.community":  "التواصل",
  "nav.group.admin":      "الإدارة",

  // ── General ─────────────────────────────────────────────────────────────────
  "general.loading":   "جاري التحميل…",
  "general.save":      "حفظ",
  "general.cancel":    "إلغاء",
  "general.delete":    "حذف",
  "general.edit":      "تعديل",
  "general.submit":    "إرسال",
  "general.back":      "رجوع",
  "general.next":      "التالي",
  "general.done":      "تم",
  "general.publish":   "نشر",
  "general.add":       "إضافة",
  "general.search":    "بحث",
  "general.filter":    "تصفية",
  "general.all":       "الكل",
  "general.new":       "جديد",
  "general.score":     "النتيجة",
  "general.marks":     "الدرجات",
  "general.passed":    "نجح",
  "general.failed":    "رسب",
  "general.error":     "حدث خطأ ما",
  "general.retry":     "حاول مرة أخرى",
  "general.empty":     "لا يوجد شيء بعد",
  "general.close":     "إغلاق",
  "general.open":      "فتح",
  "general.continue":  "متابعة",
  "general.start":     "بدء",
  "general.play":      "تشغيل",
  "general.pause":     "إيقاف مؤقت",
  "general.stop":      "إيقاف",

  // ── Dashboard ────────────────────────────────────────────────────────────────
  "dash.welcome":          "مرحباً بعودتك",
  "dash.hadith":           "«اقرؤوا القرآن فإنه يأتي يوم القيامة شفيعاً لأصحابه»",
  "dash.dailyGoal":        "الهدف اليومي",
  "dash.goalReached":      "تم الوصول إلى الهدف! ما شاء الله، استمر.",
  "dash.minutesLeft":      "دقيقة متبقية للوصول إلى هدفك اليومي",
  "dash.streak":           "يوم متواصل",
  "dash.totalXP":          "نقاط XP",
  "dash.ayahsRead":        "الآيات المقروءة",
  "dash.avgAccuracy":      "متوسط الدقة",
  "dash.totalTime":        "إجمالي الوقت",
  "dash.failedLoad":       "فشل تحميل لوحة التحكم.",

  // ── Notifications ────────────────────────────────────────────────────────────
  "notif.title":       "الإشعارات",
  "notif.markAllRead": "تحديد الكل كمقروء",
  "notif.empty":       "لا توجد إشعارات",
  "notif.examPassed":  "!اجتزت الامتحان",
  "notif.certEarned":  "تم منح الشهادة",
  "notif.streakAlert": "!حافظ على تسلسلك",
  "notif.teacherMsg":  "رسالة من المعلم",

  // ── Library ──────────────────────────────────────────────────────────────────
  "lib.title":      "المكتبة الإسلامية الرقمية",
  "lib.subtitle":   "كتاب في العلوم الإسلامية",
  "lib.search":     "ابحث عن كتب، مؤلفين، مواضيع…",
  "lib.inProgress": "قيد التقدم",
  "lib.completed":  "مكتمل",
  "lib.noBooks":    "لم يتم العثور على كتب",
  "lib.noBooksSub": "جرب تصنيفاً أو مصطلح بحث مختلفاً",
  "lib.continue":   "متابعة ←",
  "lib.start":      "بدء ←",
  "lib.featured":   "مميز",
  "lib.lessons":    "درس",

  // ── Mushaf Reader ────────────────────────────────────────────────────────────
  "mushaf.title":     "قارئ المصحف",
  "mushaf.subtitle":  "قراءة القرآن الكريم صفحة بصفحة",
  "mushaf.page":      "صفحة",
  "mushaf.juz":       "جزء",
  "mushaf.surah":     "سورة",
  "mushaf.bookmarks": "إشارات مرجعية",
  "mushaf.verses":    "آيات",
  "mushaf.complete":  "مكتمل",
  "mushaf.playPage":  "تشغيل الصفحة",
  "mushaf.bookmark":  "إشارة مرجعية",
  "mushaf.resume":    "متابعة من آخر موضع",

  // ── Hifdh ────────────────────────────────────────────────────────────────────
  "hifdh.title":    "متتبع الحفظ",
  "hifdh.subtitle": "تتبع حفظك للقرآن بنظام التكرار المتباعد",
  "hifdh.addSurah": "إضافة سورة",
  "hifdh.myHifdh":  "حفظي",
  "hifdh.aiCoach":  "مدرب الحفظ الذكي",
  "hifdh.strength": "القوة",
  "hifdh.revisions":"المراجعات",
  "hifdh.nextRevision":     "المراجعة التالية",
  "hifdh.status.learning":  "جاري التعلم",
  "hifdh.status.memorized": "محفوظ",
  "hifdh.status.weak":      "يحتاج مراجعة",
  "hifdh.status.strong":    "قوي",

  // ── Quran / Learn ────────────────────────────────────────────────────────────
  "learn.title":        "القرآن الكريم",
  "learn.selectSurah":  "اختر سورة",
  "learn.listenFirst":  "استمع أولاً",
  "learn.record":       "تسجيل",
  "learn.stopRecording":"إيقاف التسجيل",
  "learn.sendForReview":"إرسال للمراجعة",
  "learn.feedback":     "التغذية الراجعة",
  "learn.accuracy":     "الدقة",
  "learn.missed":       "كلمات مفقودة",
  "learn.extra":        "كلمات زائدة",
  "learn.correct":      "كلمات صحيحة",

  // ── Exams / Certs ────────────────────────────────────────────────────────────
  "exams.title":    "مركز الامتحانات",
  "certs.title":    "الشهادات",
  "certs.download": "تحميل PDF",
  "certs.share":    "مشاركة",

  // ── Auth ─────────────────────────────────────────────────────────────────────
  "auth.signIn":  "تسجيل الدخول",
  "auth.signUp":  "ابدأ مجاناً",
  "auth.signOut": "تسجيل الخروج",
};

const SO: Translations = {
  // ── Navigation ──────────────────────────────────────────────────────────────
  "nav.dashboard":       "Guddiga",
  "nav.quran":           "Quraanka",
  "nav.hifdh":           "Xafidka",
  "nav.mushaf":          "Akhriska Mushaf",
  "nav.library":         "Maktabadda",
  "nav.resources":       "Kheyraadka",
  "nav.aiTeacher":       "Macalinka AI",
  "nav.tajweedTutor":    "Macalinka Tajwiid",
  "nav.voiceTeacher":    "Macalinka Codka",
  "nav.videoTeacher":    "Macalinka Muuqaalka",
  "nav.studyPlanner":    "Qorsheynta Barashada",
  "nav.progress":        "Horumarkayga",
  "nav.analytics":       "Falanqaynta",
  "nav.bookmarks":       "Calaamadaha",
  "nav.achievements":    "Guulaha",
  "nav.leaderboard":     "Liiska Hore",
  "nav.examCentre":      "Xarunta Imtixaanka",
  "nav.certificates":    "Shahaadooyinka",
  "nav.parentDashboard": "Guddiga Waalidka",
  "nav.teacherView":     "Aragtida Macalinka",
  "nav.admin":           "Maamulka",
  "nav.examBuilder":     "Dhisaha Imtixaanka",
  "nav.messages":        "Fariimaha",
  "nav.payments":        "Kor u qaad Qorshaha",
  "nav.liveClassroom":   "Fasalka Tooska ah",
  "nav.contentGen":      "Waxa AI",
  "nav.signOut":         "Ka Bax",
  "nav.group.learn":      "Barasho",
  "nav.group.aiTeachers": "Macalimiinta AI",
  "nav.group.progress":   "Horumar",
  "nav.group.exams":      "Imtixaannada",
  "nav.group.family":     "Qoyska",
  "nav.group.community":  "Xiriirka",
  "nav.group.admin":      "Maamulka",

  // ── General ─────────────────────────────────────────────────────────────────
  "general.loading":   "Waa la rarayo…",
  "general.save":      "Kaydi",
  "general.cancel":    "Jooji",
  "general.delete":    "Tir",
  "general.edit":      "Wax ka bedel",
  "general.submit":    "Dir",
  "general.back":      "Dib u noqo",
  "general.next":      "Xiga",
  "general.done":      "Dhammays",
  "general.publish":   "Daabac",
  "general.add":       "Kudar",
  "general.search":    "Raadi",
  "general.filter":    "Shaandee",
  "general.all":       "Dhammaan",
  "general.new":       "Cusub",
  "general.score":     "Dhibcaha",
  "general.marks":     "Calaamadaha",
  "general.passed":    "Guuleystay",
  "general.failed":    "Ku fashilmay",
  "general.error":     "Wax qaldan ayaa dhacay",
  "general.retry":     "Isku day mar kale",
  "general.empty":     "Wali waxba ma jiro",
  "general.close":     "Xidh",
  "general.open":      "Fur",
  "general.continue":  "Sii wad",
  "general.start":     "Bilow",
  "general.play":      "Ciyaar",
  "general.pause":     "Jooji si ku meel gaar",
  "general.stop":      "Joogso",

  // ── Dashboard ────────────────────────────────────────────────────────────────
  "dash.welcome":          "Ku soo dhawow",
  "dash.hadith":           "«Akhri Quraanka, waayo wuxuu noqon doonaa dhexdhexaad u ah akhristayaashiisa maalinta qiyaamaha.»",
  "dash.dailyGoal":        "Ujeedada Maalinta",
  "dash.goalReached":      "Ujeedada la gaartay! Mashaa Allaah, sii wad.",
  "dash.minutesLeft":      "daqiiqadood ayaa hadhay si aad ujeedadaada gaarto",
  "dash.streak":           "Maalmood joogto ah",
  "dash.totalXP":          "XP la helay",
  "dash.ayahsRead":        "Aayaadka la akhristay",
  "dash.avgAccuracy":      "Shaqsiyada celceliska ah",
  "dash.totalTime":        "Waqtiga wadarta ah",
  "dash.failedLoad":       "Waa la guuldareystay in la raro guddiga.",

  // ── Notifications ────────────────────────────────────────────────────────────
  "notif.title":       "Ogeysiisyada",
  "notif.markAllRead": "Dhammaan u calaamadee akhrisan",
  "notif.empty":       "Wali ogeysiis ma jiro",
  "notif.examPassed":  "!Imtixaanka waad dhaaftay",
  "notif.certEarned":  "Shahaado ayaa la helay",
  "notif.streakAlert": "!Joogso silsiladdaada",
  "notif.teacherMsg":  "Fariin ka timid Macalinka",

  // ── Library ──────────────────────────────────────────────────────────────────
  "lib.title":      "Maktabadda Islaamiga ah ee Dhijitaalka ah",
  "lib.subtitle":   "buug gudaha cilmiga Islaamiga",
  "lib.search":     "Raadi buugaag, qoraayaal, mawduucyo…",
  "lib.inProgress": "Socda",
  "lib.completed":  "Dhammaysan",
  "lib.noBooks":    "Buug lama helin",
  "lib.noBooksSub": "Isku day qaybta ama ereyga raadinta kale",
  "lib.continue":   "Sii wad →",
  "lib.start":      "Bilow →",
  "lib.featured":   "Xulasho",
  "lib.lessons":    "casharrada",

  // ── Mushaf Reader ────────────────────────────────────────────────────────────
  "mushaf.title":     "Akhriska Mushaf",
  "mushaf.subtitle":  "Akhriska Quraanka bogga ka bogga",
  "mushaf.page":      "Bog",
  "mushaf.juz":       "Juzuu",
  "mushaf.surah":     "Suurad",
  "mushaf.bookmarks": "calaamadaha",
  "mushaf.verses":    "aayaadka",
  "mushaf.complete":  "dhammays",
  "mushaf.playPage":  "Ciyaar boggan",
  "mushaf.bookmark":  "Calaamadee boggan",
  "mushaf.resume":    "Sii wad meesha la joojiyay",

  // ── Hifdh ────────────────────────────────────────────────────────────────────
  "hifdh.title":    "Raadraaca Xafidka",
  "hifdh.subtitle": "La socod xafidkaaga Quraanka",
  "hifdh.addSurah": "Kudar Suurad",
  "hifdh.myHifdh":  "Xafidkayga",
  "hifdh.aiCoach":  "Tababaraha Xafidka ee AI",
  "hifdh.strength": "Xoogga",
  "hifdh.revisions":"Dib u eegidda",
  "hifdh.nextRevision":     "Dib-u-eegis xiga",
  "hifdh.status.learning":  "Baranaya",
  "hifdh.status.memorized": "Xafidsan",
  "hifdh.status.weak":      "U baahan dib-u-eegis",
  "hifdh.status.strong":    "Xoog leh",

  // ── Quran / Learn ────────────────────────────────────────────────────────────
  "learn.title":        "Quraanka Kariimka",
  "learn.selectSurah":  "Dooro Suurad",
  "learn.listenFirst":  "Dhageyso marka hore",
  "learn.record":       "Duub",
  "learn.stopRecording":"Jooji duubista",
  "learn.sendForReview":"Dir si loo eego",
  "learn.feedback":     "Jawaab-celinta",
  "learn.accuracy":     "Saxnaanta",
  "learn.missed":       "Ereyada la waayay",
  "learn.extra":        "Ereyada dheeraadka ah",
  "learn.correct":      "Ereyada saxda ah",

  // ── Exams / Certs ────────────────────────────────────────────────────────────
  "exams.title":    "Xarunta Imtixaanka",
  "certs.title":    "Shahaadooyinka",
  "certs.download": "Soo deji PDF",
  "certs.share":    "La wadaag",

  // ── Auth ─────────────────────────────────────────────────────────────────────
  "auth.signIn":  "Gal",
  "auth.signUp":  "Bilow bilaash ah",
  "auth.signOut": "Ka Bax",
};

const LOCALES: Record<Locale, Translations> = { en: EN, ar: AR, so: SO };

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (k, f) => f ?? k,
  isRTL: false,
});

const STORAGE_KEY = "al-bayaan-locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    return saved && ["en", "ar", "so"].includes(saved) ? saved : "en";
  });

  const isRTL = locale === "ar";

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [locale, isRTL]);

  const setLocale = (l: Locale) => setLocaleState(l);

  const t = (key: string, fallback?: string): string => {
    return LOCALES[locale]?.[key] ?? LOCALES.en[key] ?? fallback ?? key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
