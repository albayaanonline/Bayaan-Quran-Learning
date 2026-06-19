import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, Volume2, VolumeX, Play, Pause, RotateCcw, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
  };
  juz: number;
  page: number;
  hizbQuarter: number;
}

interface PageData {
  number: number;
  ayahs: Ayah[];
}

const TOTAL_PAGES = 604;
const STORAGE_KEY = "albayaan-mushaf-page";
const BOOKMARKS_KEY = "albayaan-mushaf-bookmarks";

const QARIS = [
  { id: "Alafasy_128kbps", name: "Mishary Alafasy" },
  { id: "Abdul_Basit_Murattal_192kbps", name: "Abdul Basit" },
  { id: "Husary_128kbps", name: "Mahmoud Al-Husary" },
  { id: "Sudais_192kbps", name: "Abdur-Rahman As-Sudais" },
  { id: "Maher_AlMuaiqly_128kbps", name: "Maher Al-Muaiqly" },
];

const JUZ_PAGES: number[] = [
  1,22,42,62,82,102,121,142,162,182,
  201,221,241,262,282,301,322,342,362,382,
  401,421,441,461,482,502,522,542,562,582,
];

function ayahAudioUrl(surah: number, ayah: number, qari: string): string {
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `https://everyayah.com/data/${qari}/${s}${a}.mp3`;
}

function formatPageForDisplay(ayahs: Ayah[]): { surahName: string; surahEnglish: string; isMakki: boolean; ayahsInGroup: Ayah[] }[] {
  const groups: Map<number, Ayah[]> = new Map();
  for (const a of ayahs) {
    if (!groups.has(a.surah.number)) groups.set(a.surah.number, []);
    groups.get(a.surah.number)!.push(a);
  }
  return [...groups.entries()].map(([, group]) => ({
    surahName: group[0].surah.name,
    surahEnglish: group[0].surah.englishName,
    isMakki: group[0].surah.revelationType === "Meccan",
    ayahsInGroup: group,
  }));
}

export default function Mushaf() {
  const { toast } = useToast();
  const { t, isRTL } = useI18n();

  const [page, setPage] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Math.max(1, Math.min(TOTAL_PAGES, parseInt(saved))) : 1;
  });
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState(String(page));
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "[]"); } catch { return []; }
  });
  const [qari, setQari] = useState(QARIS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahIdx, setCurrentAyahIdx] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isBookmarked = bookmarks.includes(page);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(page));
    setPageInput(String(page));
    setLoading(true);
    setError(null);
    setPageData(null);
    setCurrentAyahIdx(0);
    stopAudio();

    const ctrl = new AbortController();
    fetch(`https://api.alquran.cloud/v1/page/${page}/quran-uthmani`, { signal: ctrl.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (d.code === 200 && d.data) setPageData(d.data);
        else throw new Error("Invalid API response");
      })
      .catch(e => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [page]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playAyah = useCallback((ayah: Ayah, idx: number) => {
    stopAudio();
    if (!audioEnabled) return;
    const url = ayahAudioUrl(ayah.surah.number, ayah.numberInSurah, qari);
    const audio = new Audio(url);
    audioRef.current = audio;
    setCurrentAyahIdx(idx);
    setIsPlaying(true);
    audio.play().catch(() => { setIsPlaying(false); });
    audio.onended = () => {
      // Auto-advance to next ayah on the same page
      if (pageData && idx + 1 < pageData.ayahs.length) {
        playAyah(pageData.ayahs[idx + 1], idx + 1);
      } else {
        setIsPlaying(false);
      }
    };
    audio.onerror = () => setIsPlaying(false);
  }, [audioEnabled, qari, pageData, stopAudio]);

  const playPage = useCallback(() => {
    if (!pageData || pageData.ayahs.length === 0) return;
    if (isPlaying) { stopAudio(); return; }
    playAyah(pageData.ayahs[0], 0);
  }, [pageData, isPlaying, playAyah, stopAudio]);

  const toggleBookmark = () => {
    const updated = isBookmarked
      ? bookmarks.filter(p => p !== page)
      : [...bookmarks, page].sort((a, b) => a - b);
    setBookmarks(updated);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    toast({ title: isBookmarked ? "Bookmark removed" : "Page bookmarked!", description: isBookmarked ? `Page ${page} removed from bookmarks.` : `Page ${page} saved to your bookmarks.` });
  };

  const goToPage = (p: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_PAGES, p));
    if (clamped !== page) { setPage(clamped); stopAudio(); }
  };

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const n = parseInt(pageInput);
      if (!isNaN(n)) goToPage(n);
    }
  };

  const juzNumber = pageData?.ayahs[0]?.juz ?? 1;
  const surahName = pageData?.ayahs[0]?.surah?.englishName ?? "";
  const groups = pageData ? formatPageForDisplay(pageData.ayahs) : [];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-serif font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-emerald-600" />
              {t("mushaf.title", "Mushaf Reader")}
              <Badge className="bg-emerald-600 text-white border-0 text-xs">
                {t("mushaf.page", "Page")} {page}/{TOTAL_PAGES}
              </Badge>
            </h1>
            {pageData && (
              <p className="text-sm text-muted-foreground mt-1">
                {surahName} · {t("mushaf.juz", "Juz")} {juzNumber} · {t("mushaf.page", "Page")} {page}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={qari} onValueChange={q => { setQari(q); stopAudio(); }}>
              <SelectTrigger className="w-44 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QARIS.map(q => <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setAudioEnabled(!audioEnabled)} title={audioEnabled ? "Mute" : "Enable audio"}>
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button variant={isPlaying ? "default" : "outline"} size="icon" onClick={playPage} disabled={loading || !pageData} title={isPlaying ? "Stop" : "Play this page"} className={isPlaying ? "bg-emerald-600 text-white" : ""}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant={isBookmarked ? "default" : "outline"} size="icon" onClick={toggleBookmark} title={isBookmarked ? "Remove bookmark" : "Bookmark this page"} className={isBookmarked ? "bg-emerald-600 text-white" : ""}>
              {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation bar */}
        <div className="flex items-center gap-2 flex-wrap bg-emerald-50/80 border border-emerald-100 rounded-xl p-3">
          <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> {t("general.back", "Prev")}
          </Button>

          <div className="flex items-center gap-1">
            <Input
              value={pageInput}
              onChange={e => setPageInput(e.target.value)}
              onKeyDown={handlePageInput}
              className="w-16 h-8 text-center text-sm"
              type="number"
              min={1}
              max={TOTAL_PAGES}
            />
            <span className="text-xs text-muted-foreground">/ {TOTAL_PAGES}</span>
          </div>

          <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= TOTAL_PAGES} className="gap-1">
            {t("general.next", "Next")} <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="flex-1 min-w-0" />

          <Select value={String(juzNumber)} onValueChange={v => goToPage(JUZ_PAGES[parseInt(v) - 1])}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder={`${t("mushaf.juz", "Juz")} ${juzNumber}`} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                <SelectItem key={j} value={String(j)}>{t("mushaf.juz", "Juz")} {j}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {bookmarks.length > 0 && (
            <Select value="" onValueChange={v => goToPage(parseInt(v))}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <Bookmark className="h-3 w-3 mr-1" />
                <SelectValue placeholder={`${bookmarks.length} ${t("mushaf.bookmarks", "bookmarks")}`} />
              </SelectTrigger>
              <SelectContent>
                {bookmarks.map(p => (
                  <SelectItem key={p} value={String(p)}>{t("mushaf.page", "Page")} {p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goToPage(parseInt(localStorage.getItem(STORAGE_KEY) ?? "1"))} title="Resume last position">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Page content */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white dark:bg-emerald-950/30 border border-emerald-100 rounded-2xl p-8 space-y-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </motion.div>
          )}

          {error && !loading && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-red-700">
              <p className="font-medium">Could not load page {page}</p>
              <p className="text-sm mt-1">{error}</p>
              <Button onClick={() => setPage(p => p)} variant="outline" className="mt-4">Retry</Button>
            </motion.div>
          )}

          {!loading && !error && pageData && (
            <motion.div
              key={`page-${page}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-emerald-950/30 border border-emerald-100 rounded-2xl overflow-hidden shadow-sm"
            >
              {groups.map((group, gi) => (
                <div key={gi}>
                  {/* Surah header */}
                  <div className="border-b border-emerald-100 bg-emerald-50/60 dark:bg-emerald-900/20 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                        {group.ayahsInGroup[0].surah.number}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 font-arabic" style={{ fontFamily: "var(--font-arabic)" }}>
                          {group.surahName}
                        </p>
                        <p className="text-xs text-muted-foreground">{group.surahEnglish} · {group.isMakki ? "Meccan" : "Medinan"}</p>
                      </div>
                    </div>
                    {group.ayahsInGroup[0].numberInSurah === 1 && group.ayahsInGroup[0].surah.number !== 9 && (
                      <div className="text-center">
                        <p className="text-sm text-emerald-800 dark:text-emerald-200 font-arabic leading-relaxed" style={{ fontFamily: "var(--font-arabic)" }}>
                          بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ayahs — full continuous text in Uthmani style */}
                  <div className="px-6 py-6" dir="rtl">
                    <p className="text-right leading-[2.8] text-2xl text-emerald-950 dark:text-emerald-50"
                      style={{ fontFamily: "var(--font-arabic)", lineHeight: "3rem" }}>
                      {group.ayahsInGroup.map((ayah, ai) => {
                        const globalIdx = pageData.ayahs.indexOf(ayah);
                        const isCurrentPlaying = isPlaying && currentAyahIdx === globalIdx;
                        return (
                          <span key={ayah.number}
                            onClick={() => playAyah(ayah, globalIdx)}
                            className={`cursor-pointer rounded transition-colors px-0.5 ${
                              isCurrentPlaying
                                ? "bg-emerald-200 dark:bg-emerald-700 text-emerald-900 dark:text-emerald-50"
                                : "hover:bg-emerald-50 dark:hover:bg-emerald-900/40"
                            }`}
                            title={`Verse ${ayah.numberInSurah} — click to play`}
                          >
                            {ayah.text}
                            <span className="text-emerald-500 dark:text-emerald-400 text-base mx-1">
                              ۝{ayah.numberInSurah.toLocaleString("ar-SA")}
                            </span>
                          </span>
                        );
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Page footer */}
              <div className="border-t border-emerald-100 px-6 py-3 flex items-center justify-between text-xs text-muted-foreground bg-emerald-50/40">
                <span>{t("mushaf.juz", "Juz")} {juzNumber}</span>
                <span className="font-arabic text-emerald-700 dark:text-emerald-400" style={{ fontFamily: "var(--font-arabic)" }}>
                  {page}
                </span>
                <span>{pageData.ayahs.length} {t("mushaf.verses", "verses")} on this page</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="gap-2 border-emerald-200 hover:bg-emerald-50"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("general.back", "Previous Page")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {Math.round((page / TOTAL_PAGES) * 100)}% {t("mushaf.complete", "complete")}
          </span>
          <Button
            variant="outline"
            onClick={() => goToPage(page + 1)}
            disabled={page >= TOTAL_PAGES}
            className="gap-2 border-emerald-200 hover:bg-emerald-50"
          >
            {t("general.next", "Next Page")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
