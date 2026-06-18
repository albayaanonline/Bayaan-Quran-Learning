import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ── Surah metadata ──────────────────────────────────────────────────────────
const SURAHS = [
  { number: 1, name: "Al-Fatihah", nameArabic: "الفاتحة", nameTranslation: "The Opening", ayahCount: 7, revelationType: "Meccan", juz: 1 },
  { number: 2, name: "Al-Baqarah", nameArabic: "البقرة", nameTranslation: "The Cow", ayahCount: 286, revelationType: "Medinan", juz: 1 },
  { number: 3, name: "Ali 'Imran", nameArabic: "آل عمران", nameTranslation: "Family of Imran", ayahCount: 200, revelationType: "Medinan", juz: 3 },
  { number: 4, name: "An-Nisa", nameArabic: "النساء", nameTranslation: "The Women", ayahCount: 176, revelationType: "Medinan", juz: 4 },
  { number: 5, name: "Al-Ma'idah", nameArabic: "المائدة", nameTranslation: "The Table Spread", ayahCount: 120, revelationType: "Medinan", juz: 6 },
  { number: 6, name: "Al-An'am", nameArabic: "الأنعام", nameTranslation: "The Cattle", ayahCount: 165, revelationType: "Meccan", juz: 7 },
  { number: 7, name: "Al-A'raf", nameArabic: "الأعراف", nameTranslation: "The Heights", ayahCount: 206, revelationType: "Meccan", juz: 8 },
  { number: 8, name: "Al-Anfal", nameArabic: "الأنفال", nameTranslation: "The Spoils of War", ayahCount: 75, revelationType: "Medinan", juz: 9 },
  { number: 9, name: "At-Tawbah", nameArabic: "التوبة", nameTranslation: "The Repentance", ayahCount: 129, revelationType: "Medinan", juz: 10 },
  { number: 10, name: "Yunus", nameArabic: "يونس", nameTranslation: "Jonah", ayahCount: 109, revelationType: "Meccan", juz: 11 },
  { number: 11, name: "Hud", nameArabic: "هود", nameTranslation: "Hud", ayahCount: 123, revelationType: "Meccan", juz: 11 },
  { number: 12, name: "Yusuf", nameArabic: "يوسف", nameTranslation: "Joseph", ayahCount: 111, revelationType: "Meccan", juz: 12 },
  { number: 13, name: "Ar-Ra'd", nameArabic: "الرعد", nameTranslation: "The Thunder", ayahCount: 43, revelationType: "Medinan", juz: 13 },
  { number: 14, name: "Ibrahim", nameArabic: "إبراهيم", nameTranslation: "Abraham", ayahCount: 52, revelationType: "Meccan", juz: 13 },
  { number: 15, name: "Al-Hijr", nameArabic: "الحجر", nameTranslation: "The Rocky Tract", ayahCount: 99, revelationType: "Meccan", juz: 14 },
  { number: 16, name: "An-Nahl", nameArabic: "النحل", nameTranslation: "The Bee", ayahCount: 128, revelationType: "Meccan", juz: 14 },
  { number: 17, name: "Al-Isra", nameArabic: "الإسراء", nameTranslation: "The Night Journey", ayahCount: 111, revelationType: "Meccan", juz: 15 },
  { number: 18, name: "Al-Kahf", nameArabic: "الكهف", nameTranslation: "The Cave", ayahCount: 110, revelationType: "Meccan", juz: 15 },
  { number: 19, name: "Maryam", nameArabic: "مريام", nameTranslation: "Mary", ayahCount: 98, revelationType: "Meccan", juz: 16 },
  { number: 20, name: "Ta-Ha", nameArabic: "طه", nameTranslation: "Ta-Ha", ayahCount: 135, revelationType: "Meccan", juz: 16 },
  { number: 21, name: "Al-Anbiya", nameArabic: "الأنبياء", nameTranslation: "The Prophets", ayahCount: 112, revelationType: "Meccan", juz: 17 },
  { number: 22, name: "Al-Hajj", nameArabic: "الحج", nameTranslation: "The Pilgrimage", ayahCount: 78, revelationType: "Medinan", juz: 17 },
  { number: 23, name: "Al-Mu'minun", nameArabic: "المؤمنون", nameTranslation: "The Believers", ayahCount: 118, revelationType: "Meccan", juz: 18 },
  { number: 24, name: "An-Nur", nameArabic: "النور", nameTranslation: "The Light", ayahCount: 64, revelationType: "Medinan", juz: 18 },
  { number: 25, name: "Al-Furqan", nameArabic: "الفرقان", nameTranslation: "The Criterion", ayahCount: 77, revelationType: "Meccan", juz: 18 },
  { number: 26, name: "Ash-Shu'ara", nameArabic: "الشعراء", nameTranslation: "The Poets", ayahCount: 227, revelationType: "Meccan", juz: 19 },
  { number: 27, name: "An-Naml", nameArabic: "النمل", nameTranslation: "The Ant", ayahCount: 93, revelationType: "Meccan", juz: 19 },
  { number: 28, name: "Al-Qasas", nameArabic: "القصص", nameTranslation: "The Stories", ayahCount: 88, revelationType: "Meccan", juz: 20 },
  { number: 29, name: "Al-'Ankabut", nameArabic: "العنكبوت", nameTranslation: "The Spider", ayahCount: 69, revelationType: "Meccan", juz: 20 },
  { number: 30, name: "Ar-Rum", nameArabic: "الروم", nameTranslation: "The Romans", ayahCount: 60, revelationType: "Meccan", juz: 21 },
  { number: 31, name: "Luqman", nameArabic: "لقمان", nameTranslation: "Luqman", ayahCount: 34, revelationType: "Meccan", juz: 21 },
  { number: 32, name: "As-Sajdah", nameArabic: "السجدة", nameTranslation: "The Prostration", ayahCount: 30, revelationType: "Meccan", juz: 21 },
  { number: 33, name: "Al-Ahzab", nameArabic: "الأحزاب", nameTranslation: "The Combined Forces", ayahCount: 73, revelationType: "Medinan", juz: 21 },
  { number: 34, name: "Saba", nameArabic: "سبأ", nameTranslation: "Sheba", ayahCount: 54, revelationType: "Meccan", juz: 22 },
  { number: 35, name: "Fatir", nameArabic: "فاطر", nameTranslation: "Originator", ayahCount: 45, revelationType: "Meccan", juz: 22 },
  { number: 36, name: "Ya-Sin", nameArabic: "يس", nameTranslation: "Ya Sin", ayahCount: 83, revelationType: "Meccan", juz: 22 },
  { number: 37, name: "As-Saffat", nameArabic: "الصافات", nameTranslation: "Those who set the Ranks", ayahCount: 182, revelationType: "Meccan", juz: 23 },
  { number: 38, name: "Sad", nameArabic: "ص", nameTranslation: "The Letter Sad", ayahCount: 88, revelationType: "Meccan", juz: 23 },
  { number: 39, name: "Az-Zumar", nameArabic: "الزمر", nameTranslation: "The Troops", ayahCount: 75, revelationType: "Meccan", juz: 23 },
  { number: 40, name: "Ghafir", nameArabic: "غافر", nameTranslation: "The Forgiver", ayahCount: 85, revelationType: "Meccan", juz: 24 },
  { number: 41, name: "Fussilat", nameArabic: "فصلت", nameTranslation: "Explained in Detail", ayahCount: 54, revelationType: "Meccan", juz: 24 },
  { number: 42, name: "Ash-Shuraa", nameArabic: "الشورى", nameTranslation: "The Consultation", ayahCount: 53, revelationType: "Meccan", juz: 25 },
  { number: 43, name: "Az-Zukhruf", nameArabic: "الزخرف", nameTranslation: "The Ornaments of Gold", ayahCount: 89, revelationType: "Meccan", juz: 25 },
  { number: 44, name: "Ad-Dukhan", nameArabic: "الدخان", nameTranslation: "The Smoke", ayahCount: 59, revelationType: "Meccan", juz: 25 },
  { number: 45, name: "Al-Jathiyah", nameArabic: "الجاثية", nameTranslation: "The Crouching", ayahCount: 37, revelationType: "Meccan", juz: 25 },
  { number: 46, name: "Al-Ahqaf", nameArabic: "الأحقاف", nameTranslation: "The Wind-Curved Sandhills", ayahCount: 35, revelationType: "Meccan", juz: 26 },
  { number: 47, name: "Muhammad", nameArabic: "محمد", nameTranslation: "Muhammad", ayahCount: 38, revelationType: "Medinan", juz: 26 },
  { number: 48, name: "Al-Fath", nameArabic: "الفتح", nameTranslation: "The Victory", ayahCount: 29, revelationType: "Medinan", juz: 26 },
  { number: 49, name: "Al-Hujurat", nameArabic: "الحجرات", nameTranslation: "The Rooms", ayahCount: 18, revelationType: "Medinan", juz: 26 },
  { number: 50, name: "Qaf", nameArabic: "ق", nameTranslation: "The Letter Qaf", ayahCount: 45, revelationType: "Meccan", juz: 26 },
  { number: 51, name: "Adh-Dhariyat", nameArabic: "الذاريات", nameTranslation: "The Winnowing Winds", ayahCount: 60, revelationType: "Meccan", juz: 26 },
  { number: 52, name: "At-Tur", nameArabic: "الطور", nameTranslation: "The Mount", ayahCount: 49, revelationType: "Meccan", juz: 27 },
  { number: 53, name: "An-Najm", nameArabic: "النجم", nameTranslation: "The Star", ayahCount: 62, revelationType: "Meccan", juz: 27 },
  { number: 54, name: "Al-Qamar", nameArabic: "القمر", nameTranslation: "The Moon", ayahCount: 55, revelationType: "Meccan", juz: 27 },
  { number: 55, name: "Ar-Rahman", nameArabic: "الرحمن", nameTranslation: "The Beneficent", ayahCount: 78, revelationType: "Medinan", juz: 27 },
  { number: 56, name: "Al-Waqi'ah", nameArabic: "الواقعة", nameTranslation: "The Inevitable", ayahCount: 96, revelationType: "Meccan", juz: 27 },
  { number: 57, name: "Al-Hadid", nameArabic: "الحديد", nameTranslation: "The Iron", ayahCount: 29, revelationType: "Medinan", juz: 27 },
  { number: 58, name: "Al-Mujadila", nameArabic: "المجادلة", nameTranslation: "The Pleading Woman", ayahCount: 22, revelationType: "Medinan", juz: 28 },
  { number: 59, name: "Al-Hashr", nameArabic: "الحشر", nameTranslation: "The Exile", ayahCount: 24, revelationType: "Medinan", juz: 28 },
  { number: 60, name: "Al-Mumtahanah", nameArabic: "الممتحنة", nameTranslation: "She that is to be Examined", ayahCount: 13, revelationType: "Medinan", juz: 28 },
  { number: 61, name: "As-Saf", nameArabic: "الصف", nameTranslation: "The Ranks", ayahCount: 14, revelationType: "Medinan", juz: 28 },
  { number: 62, name: "Al-Jumu'ah", nameArabic: "الجمعة", nameTranslation: "The Congregation", ayahCount: 11, revelationType: "Medinan", juz: 28 },
  { number: 63, name: "Al-Munafiqun", nameArabic: "المنافقون", nameTranslation: "The Hypocrites", ayahCount: 11, revelationType: "Medinan", juz: 28 },
  { number: 64, name: "At-Taghabun", nameArabic: "التغابن", nameTranslation: "The Mutual Disillusion", ayahCount: 18, revelationType: "Medinan", juz: 28 },
  { number: 65, name: "At-Talaq", nameArabic: "الطلاق", nameTranslation: "The Divorce", ayahCount: 12, revelationType: "Medinan", juz: 28 },
  { number: 66, name: "At-Tahrim", nameArabic: "التحريم", nameTranslation: "The Prohibition", ayahCount: 12, revelationType: "Medinan", juz: 28 },
  { number: 67, name: "Al-Mulk", nameArabic: "الملك", nameTranslation: "The Sovereignty", ayahCount: 30, revelationType: "Meccan", juz: 29 },
  { number: 68, name: "Al-Qalam", nameArabic: "القلم", nameTranslation: "The Pen", ayahCount: 52, revelationType: "Meccan", juz: 29 },
  { number: 69, name: "Al-Haqqah", nameArabic: "الحاقة", nameTranslation: "The Reality", ayahCount: 52, revelationType: "Meccan", juz: 29 },
  { number: 70, name: "Al-Ma'arij", nameArabic: "المعارج", nameTranslation: "The Ascending Stairways", ayahCount: 44, revelationType: "Meccan", juz: 29 },
  { number: 71, name: "Nuh", nameArabic: "نوح", nameTranslation: "Noah", ayahCount: 28, revelationType: "Meccan", juz: 29 },
  { number: 72, name: "Al-Jinn", nameArabic: "الجن", nameTranslation: "The Jinn", ayahCount: 28, revelationType: "Meccan", juz: 29 },
  { number: 73, name: "Al-Muzzammil", nameArabic: "المزمل", nameTranslation: "The Enshrouded One", ayahCount: 20, revelationType: "Meccan", juz: 29 },
  { number: 74, name: "Al-Muddaththir", nameArabic: "المدثر", nameTranslation: "The Cloaked One", ayahCount: 56, revelationType: "Meccan", juz: 29 },
  { number: 75, name: "Al-Qiyamah", nameArabic: "القيامة", nameTranslation: "The Resurrection", ayahCount: 40, revelationType: "Meccan", juz: 29 },
  { number: 76, name: "Al-Insan", nameArabic: "الإنسان", nameTranslation: "Man", ayahCount: 31, revelationType: "Medinan", juz: 29 },
  { number: 77, name: "Al-Mursalat", nameArabic: "المرسلات", nameTranslation: "The Emissaries", ayahCount: 50, revelationType: "Meccan", juz: 29 },
  { number: 78, name: "An-Naba", nameArabic: "النبأ", nameTranslation: "The Tidings", ayahCount: 40, revelationType: "Meccan", juz: 30 },
  { number: 79, name: "An-Nazi'at", nameArabic: "النازعات", nameTranslation: "Those who drag forth", ayahCount: 46, revelationType: "Meccan", juz: 30 },
  { number: 80, name: "Abasa", nameArabic: "عبس", nameTranslation: "He Frowned", ayahCount: 42, revelationType: "Meccan", juz: 30 },
  { number: 81, name: "At-Takwir", nameArabic: "التكوير", nameTranslation: "The Overthrowing", ayahCount: 29, revelationType: "Meccan", juz: 30 },
  { number: 82, name: "Al-Infitar", nameArabic: "الانفطار", nameTranslation: "The Cleaving", ayahCount: 19, revelationType: "Meccan", juz: 30 },
  { number: 83, name: "Al-Mutaffifin", nameArabic: "المطففين", nameTranslation: "The Defrauding", ayahCount: 36, revelationType: "Meccan", juz: 30 },
  { number: 84, name: "Al-Inshiqaq", nameArabic: "الانشقاق", nameTranslation: "The Sundering", ayahCount: 25, revelationType: "Meccan", juz: 30 },
  { number: 85, name: "Al-Buruj", nameArabic: "البروج", nameTranslation: "The Mansions of the Stars", ayahCount: 22, revelationType: "Meccan", juz: 30 },
  { number: 86, name: "At-Tariq", nameArabic: "الطارق", nameTranslation: "The Morning Star", ayahCount: 17, revelationType: "Meccan", juz: 30 },
  { number: 87, name: "Al-A'la", nameArabic: "الأعلى", nameTranslation: "The Most High", ayahCount: 19, revelationType: "Meccan", juz: 30 },
  { number: 88, name: "Al-Ghashiyah", nameArabic: "الغاشية", nameTranslation: "The Overwhelming", ayahCount: 26, revelationType: "Meccan", juz: 30 },
  { number: 89, name: "Al-Fajr", nameArabic: "الفجر", nameTranslation: "The Dawn", ayahCount: 30, revelationType: "Meccan", juz: 30 },
  { number: 90, name: "Al-Balad", nameArabic: "البلد", nameTranslation: "The City", ayahCount: 20, revelationType: "Meccan", juz: 30 },
  { number: 91, name: "Ash-Shams", nameArabic: "الشمس", nameTranslation: "The Sun", ayahCount: 15, revelationType: "Meccan", juz: 30 },
  { number: 92, name: "Al-Layl", nameArabic: "الليل", nameTranslation: "The Night", ayahCount: 21, revelationType: "Meccan", juz: 30 },
  { number: 93, name: "Ad-Duhaa", nameArabic: "الضحى", nameTranslation: "The Morning Hours", ayahCount: 11, revelationType: "Meccan", juz: 30 },
  { number: 94, name: "Ash-Sharh", nameArabic: "الشرح", nameTranslation: "The Relief", ayahCount: 8, revelationType: "Meccan", juz: 30 },
  { number: 95, name: "At-Tin", nameArabic: "التين", nameTranslation: "The Fig", ayahCount: 8, revelationType: "Meccan", juz: 30 },
  { number: 96, name: "Al-'Alaq", nameArabic: "العلق", nameTranslation: "The Clot", ayahCount: 19, revelationType: "Meccan", juz: 30 },
  { number: 97, name: "Al-Qadr", nameArabic: "القدر", nameTranslation: "The Power", ayahCount: 5, revelationType: "Meccan", juz: 30 },
  { number: 98, name: "Al-Bayyinah", nameArabic: "البينة", nameTranslation: "The Clear Proof", ayahCount: 8, revelationType: "Medinan", juz: 30 },
  { number: 99, name: "Az-Zalzalah", nameArabic: "الزلزلة", nameTranslation: "The Earthquake", ayahCount: 8, revelationType: "Medinan", juz: 30 },
  { number: 100, name: "Al-'Adiyat", nameArabic: "العاديات", nameTranslation: "The Coursers", ayahCount: 11, revelationType: "Meccan", juz: 30 },
  { number: 101, name: "Al-Qari'ah", nameArabic: "القارعة", nameTranslation: "The Calamity", ayahCount: 11, revelationType: "Meccan", juz: 30 },
  { number: 102, name: "At-Takathur", nameArabic: "التكاثر", nameTranslation: "The Rivalry in World Increase", ayahCount: 8, revelationType: "Meccan", juz: 30 },
  { number: 103, name: "Al-'Asr", nameArabic: "العصر", nameTranslation: "The Declining Day", ayahCount: 3, revelationType: "Meccan", juz: 30 },
  { number: 104, name: "Al-Humazah", nameArabic: "الهمزة", nameTranslation: "The Traducer", ayahCount: 9, revelationType: "Meccan", juz: 30 },
  { number: 105, name: "Al-Fil", nameArabic: "الفيل", nameTranslation: "The Elephant", ayahCount: 5, revelationType: "Meccan", juz: 30 },
  { number: 106, name: "Quraysh", nameArabic: "قريش", nameTranslation: "Quraysh", ayahCount: 4, revelationType: "Meccan", juz: 30 },
  { number: 107, name: "Al-Ma'un", nameArabic: "الماعون", nameTranslation: "The Small Kindnesses", ayahCount: 7, revelationType: "Meccan", juz: 30 },
  { number: 108, name: "Al-Kawthar", nameArabic: "الكوثر", nameTranslation: "A River in Paradise", ayahCount: 3, revelationType: "Meccan", juz: 30 },
  { number: 109, name: "Al-Kafirun", nameArabic: "الكافرون", nameTranslation: "The Disbelievers", ayahCount: 6, revelationType: "Meccan", juz: 30 },
  { number: 110, name: "An-Nasr", nameArabic: "النصر", nameTranslation: "The Divine Support", ayahCount: 3, revelationType: "Medinan", juz: 30 },
  { number: 111, name: "Al-Masad", nameArabic: "المسد", nameTranslation: "The Palm Fibre", ayahCount: 5, revelationType: "Meccan", juz: 30 },
  { number: 112, name: "Al-Ikhlas", nameArabic: "الإخلاص", nameTranslation: "The Sincerity", ayahCount: 4, revelationType: "Meccan", juz: 30 },
  { number: 113, name: "Al-Falaq", nameArabic: "الفلق", nameTranslation: "The Daybreak", ayahCount: 5, revelationType: "Meccan", juz: 30 },
  { number: 114, name: "An-Nas", nameArabic: "الناس", nameTranslation: "Mankind", ayahCount: 6, revelationType: "Meccan", juz: 30 },
];

// ── In-memory ayah cache — keyed by surahId, TTL 24 hours ──────────────────
interface CacheEntry {
  ayahs: any[];
  fetchedAt: number;
}
const ayahCache = new Map<number, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getCached(surahId: number): any[] | null {
  const entry = ayahCache.get(surahId);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    ayahCache.delete(surahId);
    return null;
  }
  return entry.ayahs;
}

function setCache(surahId: number, ayahs: any[]): void {
  ayahCache.set(surahId, { ayahs, fetchedAt: Date.now() });
}

function buildAudioUrl(surahId: number, numberInSurah: number): string {
  const s = String(surahId).padStart(3, "0");
  const a = String(numberInSurah).padStart(3, "0");
  return `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;
}

// ── Primary Quran source: AlQuran.cloud ─────────────────────────────────────
async function fetchFromAlQuranCloud(surahId: number): Promise<any[] | null> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const resp = await fetch(
      `https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`,
      { signal: ctrl.signal }
    );
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data = await resp.json() as any;
    const ayahs = data.data?.ayahs;
    if (!Array.isArray(ayahs) || ayahs.length === 0) return null;
    return ayahs.map((a: any) => ({
      number: a.number,
      numberInSurah: a.numberInSurah,
      text: a.text,
      surahNumber: surahId,
      page: a.page ?? null,
      juz: a.juz ?? null,
      audioUrl: buildAudioUrl(surahId, a.numberInSurah),
    }));
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

// ── Backup Quran source: quranapi.pages.dev ──────────────────────────────────
async function fetchFromBackupAPI(surahId: number, surah: { ayahCount: number; juz: number }): Promise<any[] | null> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const resp = await fetch(
      `https://quranapi.pages.dev/api/${surahId}.json`,
      { signal: ctrl.signal }
    );
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data = await resp.json() as any;
    const arabicLines: string[] = data.arabic1 ?? data.arabic2 ?? [];
    if (!arabicLines.length) return null;

    return arabicLines.map((text: string, i: number) => ({
      number: i + 1,
      numberInSurah: i + 1,
      text,
      surahNumber: surahId,
      page: null,
      juz: surah.juz,
      audioUrl: buildAudioUrl(surahId, i + 1),
    }));
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

// ── Third backup: cdn.jsdelivr.net static Quran data ────────────────────────
async function fetchFromJsDelivr(surahId: number, surah: { ayahCount: number; juz: number }): Promise<any[] | null> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const resp = await fetch(
      `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranabulama/${surahId}.json`,
      { signal: ctrl.signal }
    );
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data = await resp.json() as any;
    const chapter = data?.chapter;
    if (!Array.isArray(chapter) || chapter.length === 0) return null;

    return chapter.map((entry: any, i: number) => ({
      number: i + 1,
      numberInSurah: i + 1,
      text: entry.text ?? entry,
      surahNumber: surahId,
      page: null,
      juz: surah.juz,
      audioUrl: buildAudioUrl(surahId, i + 1),
    }));
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

router.get("/surahs", (_req, res) => {
  res.json(SURAHS);
});

router.get("/surahs/:surahId", (req, res) => {
  const id = parseInt(req.params.surahId);
  const surah = SURAHS.find(s => s.number === id);
  if (!surah) { res.status(404).json({ error: "Surah not found" }); return; }
  res.json(surah);
});

router.get("/surahs/:surahId/ayahs", async (req, res) => {
  const surahId = parseInt(req.params.surahId);
  const surah = SURAHS.find(s => s.number === surahId);
  if (!surah) { res.status(404).json({ error: "Surah not found" }); return; }

  const cached = getCached(surahId);
  if (cached) {
    res.setHeader("X-Cache", "HIT");
    res.json(cached);
    return;
  }

  logger.info({ surahId }, "Fetching ayahs from AlQuran.cloud (primary)");
  let ayahs = await fetchFromAlQuranCloud(surahId);

  if (!ayahs) {
    logger.warn({ surahId }, "AlQuran.cloud failed — trying quranapi.pages.dev");
    ayahs = await fetchFromBackupAPI(surahId, surah);
  }

  if (!ayahs) {
    logger.warn({ surahId }, "quranapi.pages.dev failed — trying jsDelivr");
    ayahs = await fetchFromJsDelivr(surahId, surah);
  }

  if (!ayahs) {
    logger.error({ surahId }, "All Quran API sources failed");
    res.status(503).json({
      error: "Quran text temporarily unavailable — all sources failed",
      detail: "AlQuran.cloud, quranapi.pages.dev, and jsDelivr cdn all failed. Please try again.",
      surahId,
    });
    return;
  }

  setCache(surahId, ayahs);
  res.setHeader("X-Cache", "MISS");
  res.json(ayahs);
});

router.get("/ayahs/:ayahKey", async (req, res) => {
  const { ayahKey } = req.params;
  try {
    const [surahPart, ayahPart] = ayahKey.split(":");
    const surahNum = parseInt(surahPart);
    const ayahNum = parseInt(ayahPart);

    const cached = getCached(surahNum);
    if (cached) {
      const ayah = cached.find((a: any) => a.numberInSurah === ayahNum);
      if (ayah) {
        const translationCtrl = new AbortController();
        const ttTimeout = setTimeout(() => translationCtrl.abort(), 8_000);
        let translation = "";
        try {
          const translationResp = await fetch(
            `https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/en.sahih`,
            { signal: translationCtrl.signal }
          );
          clearTimeout(ttTimeout);
          if (translationResp.ok) {
            const tData = await translationResp.json() as any;
            translation = tData.data?.text ?? "";
          }
        } catch { clearTimeout(ttTimeout); }
        res.json({ ayah, translation, transliteration: null, tafsir: null });
        return;
      }
    }

    const [arabicResp, translationResp] = await Promise.allSettled([
      fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/quran-uthmani`),
      fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/en.sahih`),
    ]);

    if (arabicResp.status === "rejected" || !((arabicResp as PromiseFulfilledResult<Response>).value?.ok)) {
      res.status(503).json({ error: "Failed to fetch ayah from Quran API" });
      return;
    }

    const arabicData = await (arabicResp as PromiseFulfilledResult<Response>).value.json() as any;
    let translationText = "";
    if (translationResp.status === "fulfilled" && (translationResp as PromiseFulfilledResult<Response>).value.ok) {
      const tData = await (translationResp as PromiseFulfilledResult<Response>).value.json() as any;
      translationText = tData.data?.text ?? "";
    }

    const a = arabicData.data;
    res.json({
      ayah: {
        number: a.number,
        numberInSurah: a.numberInSurah,
        text: a.text,
        surahNumber: surahNum,
        page: a.page ?? null,
        juz: a.juz ?? null,
        audioUrl: buildAudioUrl(surahNum, ayahNum),
      },
      translation: translationText,
      transliteration: null,
      tafsir: null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch ayah detail");
    res.status(500).json({ error: "Failed to fetch ayah" });
  }
});

export { SURAHS };
export default router;
