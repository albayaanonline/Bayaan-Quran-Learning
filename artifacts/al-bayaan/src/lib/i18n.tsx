import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "en" | "ar" | "so";

type Translations = Record<string, string>;

const EN: Translations = {
  // Nav
  "nav.dashboard": "Dashboard",
  "nav.quran": "Quran",
  "nav.hifdh": "Hifdh Tracker",
  "nav.library": "Library",
  "nav.resources": "Resources",
  "nav.aiTeacher": "AI Teacher",
  "nav.tajweedTutor": "Tajweed Tutor",
  "nav.voiceTeacher": "Voice Teacher",
  "nav.studyPlanner": "Study Planner",
  "nav.progress": "My Progress",
  "nav.analytics": "Analytics",
  "nav.bookmarks": "Bookmarks",
  "nav.achievements": "Achievements",
  "nav.leaderboard": "Leaderboard",
  "nav.examCentre": "Exam Centre",
  "nav.certificates": "Certificates",
  "nav.parentDashboard": "Parent Dashboard",
  "nav.teacherView": "Teacher View",
  "nav.admin": "Admin",
  "nav.examBuilder": "Exam Builder",
  "nav.signOut": "Sign Out",
  // General
  "general.loading": "Loading…",
  "general.save": "Save",
  "general.cancel": "Cancel",
  "general.delete": "Delete",
  "general.edit": "Edit",
  "general.submit": "Submit",
  "general.back": "Back",
  "general.next": "Next",
  "general.done": "Done",
  "general.publish": "Publish",
  "general.add": "Add",
  "general.search": "Search",
  "general.filter": "Filter",
  "general.all": "All",
  "general.new": "New",
  "general.score": "Score",
  "general.marks": "Marks",
  "general.passed": "Passed",
  "general.failed": "Failed",
  // Dashboard
  "dash.welcome": "Welcome back",
  "dash.streak": "Day streak",
  "dash.xp": "XP earned",
  "dash.level": "Level",
  "dash.continue": "Continue Learning",
  // Notifications
  "notif.title": "Notifications",
  "notif.markAllRead": "Mark all read",
  "notif.empty": "No notifications yet",
  "notif.examPassed": "Exam Passed!",
  "notif.certEarned": "Certificate Earned",
  "notif.streakAlert": "Keep your streak!",
  "notif.teacherMsg": "Message from Teacher",
};

const AR: Translations = {
  "nav.dashboard": "لوحة التحكم",
  "nav.quran": "القرآن الكريم",
  "nav.hifdh": "تتبع الحفظ",
  "nav.library": "المكتبة",
  "nav.resources": "الموارد",
  "nav.aiTeacher": "المعلم الذكي",
  "nav.tajweedTutor": "مدرس التجويد",
  "nav.voiceTeacher": "المعلم الصوتي",
  "nav.studyPlanner": "مخطط الدراسة",
  "nav.progress": "تقدمي",
  "nav.analytics": "التحليلات",
  "nav.bookmarks": "الإشارات المرجعية",
  "nav.achievements": "الإنجازات",
  "nav.leaderboard": "لوحة المتصدرين",
  "nav.examCentre": "مركز الامتحانات",
  "nav.certificates": "الشهادات",
  "nav.parentDashboard": "لوحة الوالدين",
  "nav.teacherView": "عرض المعلم",
  "nav.admin": "الإدارة",
  "nav.examBuilder": "منشئ الامتحانات",
  "nav.signOut": "تسجيل الخروج",
  "general.loading": "جاري التحميل…",
  "general.save": "حفظ",
  "general.cancel": "إلغاء",
  "general.delete": "حذف",
  "general.edit": "تعديل",
  "general.submit": "إرسال",
  "general.back": "رجوع",
  "general.next": "التالي",
  "general.done": "تم",
  "general.publish": "نشر",
  "general.add": "إضافة",
  "general.search": "بحث",
  "general.filter": "تصفية",
  "general.all": "الكل",
  "general.new": "جديد",
  "general.score": "النتيجة",
  "general.marks": "الدرجات",
  "general.passed": "نجح",
  "general.failed": "رسب",
  "dash.welcome": "مرحباً بعودتك",
  "dash.streak": "يوم متواصل",
  "dash.xp": "نقاط XP",
  "dash.level": "المستوى",
  "dash.continue": "متابعة التعلم",
  "notif.title": "الإشعارات",
  "notif.markAllRead": "تحديد الكل كمقروء",
  "notif.empty": "لا توجد إشعارات",
  "notif.examPassed": "!اجتزت الامتحان",
  "notif.certEarned": "تم منح الشهادة",
  "notif.streakAlert": "!حافظ على تسلسلك",
  "notif.teacherMsg": "رسالة من المعلم",
};

const SO: Translations = {
  "nav.dashboard": "Guddiga",
  "nav.quran": "Quraanka",
  "nav.hifdh": "Xafidka",
  "nav.library": "Maktabadda",
  "nav.resources": "Kheyraadka",
  "nav.aiTeacher": "Macalinka AI",
  "nav.tajweedTutor": "Macalinka Tajwiid",
  "nav.voiceTeacher": "Macalinka Codka",
  "nav.studyPlanner": "Qorsheynta Barashada",
  "nav.progress": "Horumarkayga",
  "nav.analytics": "Falanqaynta",
  "nav.bookmarks": "Calaamadaha",
  "nav.achievements": "Guulaha",
  "nav.leaderboard": "Liiska Hore",
  "nav.examCentre": "Xarunta Imtixaanka",
  "nav.certificates": "Shahaadooyinka",
  "nav.parentDashboard": "Guddiga Waalidka",
  "nav.teacherView": "Aragtida Macalinka",
  "nav.admin": "Maamulka",
  "nav.examBuilder": "Dhisaha Imtixaanka",
  "nav.signOut": "Ka Bax",
  "general.loading": "Waa la rarayo…",
  "general.save": "Kaydi",
  "general.cancel": "Jooji",
  "general.delete": "Tir",
  "general.edit": "Wax ka bedel",
  "general.submit": "Dir",
  "general.back": "Dib u noqo",
  "general.next": "Xiga",
  "general.done": "Dhammayстай",
  "general.publish": "Daabac",
  "general.add": "Kudar",
  "general.search": "Raadi",
  "general.filter": "Shaandee",
  "general.all": "Dhammaan",
  "general.new": "Cusub",
  "general.score": "Dhibcaha",
  "general.marks": "Calaamadaha",
  "general.passed": "Guuleystay",
  "general.failed": "Ku fashilmay",
  "dash.welcome": "Ku soo dhawow",
  "dash.streak": "Maalmood joogto ah",
  "dash.xp": "XP la helay",
  "dash.level": "Heerka",
  "dash.continue": "Sii wad Barashada",
  "notif.title": "Ogeysiisyada",
  "notif.markAllRead": "Dhammaan u calaamadee akhrisan",
  "notif.empty": "Wali ogeysiis ma jiro",
  "notif.examPassed": "!Imtixaanka waad dhaaftay",
  "notif.certEarned": "Shahaado ayaa la helay",
  "notif.streakAlert": "!Joogso silsiladdaada",
  "notif.teacherMsg": "Fariin ka timid Macalinka",
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
