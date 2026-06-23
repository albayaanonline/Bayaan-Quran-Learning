import { useState, useEffect, useRef, useCallback } from "react";
import { authFetch } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, Volume2, VolumeX,
  Play, Pause, RotateCcw, BookOpen, Mic, MicOff, Square, CheckCircle2,
  XCircle, AlertTriangle, Loader2, RefreshCw, Target, Sparkles, Info,
} from "lucide-react";
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

type WordStatus = "correct" | "missing" | "extra" | "unknown";
type PageMode = "read" | "recite";
type RecordState = "idle" | "recording" | "analyzing" | "done" | "error";

interface RecitationResult {
  transcription: {
    text: string;
    success: boolean;
    model: string;
    confidence: number;
    error: string | null;
    providerErrors?: string[];
  };
  correction: {
    correctWords: string[];
    incorrectWords: string[];
    missingWords: string[];
    accuracyScore: number;
    wordStats: { total: number; correct: number; missing: number; extra: number };
    suggestions: string[];
    analysisLog: {
      referenceWordCount: number;
      transcribedWordCount: number;
      lcsLength: number;
      errorPattern: string;
      referenceNormalized: string;
      transcribedNormalized: string;
    };
  } | null;
  referenceWords: string[];
  wordStatuses: WordStatus[];
  referenceText: string;
  sttFailed?: boolean;
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
  401,421,441,462,482,502,522,542,562,582,
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

function buildAudioBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function AccuracyRing({ score }: { score: number }) {
  const color = score >= 90 ? "text-blue-700" : score >= 70 ? "text-blue-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  const bg = score >= 90 ? "bg-blue-50" : score >= 70 ? "bg-blue-50" : score >= 50 ? "bg-amber-50" : "bg-red-50";
  return (
    <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-full ${bg} border-4 ${score >= 90 ? "border-blue-300" : score >= 70 ? "border-blue-300" : score >= 50 ? "border-amber-300" : "border-red-300"}`}>
      <span className={`text-2xl font-bold ${color}`}>{score}%</span>
      <span className="text-xs text-muted-foreground">accuracy</span>
    </div>
  );
}

export default function Mushaf() {
  const { toast } = useToast();
  const { t } = useI18n();

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

  const [pageMode, setPageMode] = useState<PageMode>("read");
  const [reciteScope, setReciteScope] = useState<"page" | number>("page");
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recitationResult, setRecitationResult] = useState<RecitationResult | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isBookmarked = bookmarks.includes(page);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(page));
    setPageInput(String(page));
    setLoading(true);
    setError(null);
    setPageData(null);
    setCurrentAyahIdx(0);
    setRecitationResult(null);
    setRecordState("idle");
    setRecordSeconds(0);
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

  useEffect(() => {
    return () => {
      stopRecording(false);
    };
  }, []);

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
    audio.play().catch(() => setIsPlaying(false));
    audio.onended = () => {
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
    toast({ title: isBookmarked ? "Bookmark removed" : "Page bookmarked!", description: isBookmarked ? `Page ${page} removed.` : `Page ${page} saved.` });
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

  const getReferenceText = useCallback((): string => {
    if (!pageData) return "";
    if (reciteScope === "page") {
      return pageData.ayahs.map(a => a.text).join(" ");
    }
    const ayah = pageData.ayahs.find(a => a.number === reciteScope);
    return ayah?.text ?? pageData.ayahs.map(a => a.text).join(" ");
  }, [pageData, reciteScope]);

  const stopRecording = useCallback((analyze = true) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      if (analyze) {
        mediaRecorderRef.current.stop();
      } else {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
        setRecordState("idle");
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!pageData) return;
    setRecitationResult(null);
    setRecordState("recording");
    setRecordSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        if (chunksRef.current.length === 0) {
          setRecordState("error");
          toast({ title: "No audio captured", description: "Please allow microphone access and try again.", variant: "destructive" });
          return;
        }
        setRecordState("analyzing");
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const audioBase64 = await buildAudioBase64(blob);
          const referenceText = getReferenceText();
          const response = await authFetch("/api/mushaf-recitation/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioBase64,
              mimeType,
              referenceText,
              pageNumber: page,
              scope: reciteScope === "page" ? "page" : `ayah-${reciteScope}`,
            }),
          });
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error ?? `HTTP ${response.status}`);
          }
          const result: RecitationResult = await response.json();
          setRecitationResult(result);
          setRecordState("done");
        } catch (err: any) {
          setRecordState("error");
          toast({ title: "Analysis failed", description: err.message ?? "Could not analyze recitation.", variant: "destructive" });
        }
      };

      mr.start(250);

      timerRef.current = setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);
    } catch (err: any) {
      setRecordState("error");
      toast({ title: "Microphone access denied", description: "Please allow microphone access in your browser settings.", variant: "destructive" });
    }
  }, [pageData, page, reciteScope, getReferenceText, toast]);

  const handleRecordToggle = () => {
    if (recordState === "recording") {
      stopRecording(true);
    } else if (recordState === "idle" || recordState === "done" || recordState === "error") {
      startRecording();
    }
  };

  const resetRecitation = () => {
    setRecitationResult(null);
    setRecordState("idle");
    setRecordSeconds(0);
  };

  const juzNumber = pageData?.ayahs[0]?.juz ?? 1;
  const surahName = pageData?.ayahs[0]?.surah?.englishName ?? "";
  const groups = pageData ? formatPageForDisplay(pageData.ayahs) : [];

  const wordStatusMap = useCallback((globalWordIndex: number): WordStatus => {
    if (!recitationResult) return "unknown";
    return recitationResult.wordStatuses[globalWordIndex] ?? "unknown";
  }, [recitationResult]);

  let globalWordCounter = 0;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-blue-50 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-700" />
              {t("mushaf.title", "Mushaf Reader")}
              <Badge className="bg-blue-700 text-white border-0 text-xs">
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
            {pageMode === "read" && (
              <>
                <Button variant="outline" size="icon" onClick={() => setAudioEnabled(!audioEnabled)} title={audioEnabled ? "Mute" : "Enable audio"}>
                  {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button variant={isPlaying ? "default" : "outline"} size="icon" onClick={playPage} disabled={loading || !pageData} className={isPlaying ? "bg-blue-700 text-white" : ""}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </>
            )}
            <Button variant={isBookmarked ? "default" : "outline"} size="icon" onClick={toggleBookmark} className={isBookmarked ? "bg-blue-700 text-white" : ""}>
              {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* ── Mode Switcher ── */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
          <button
            onClick={() => { setPageMode("read"); resetRecitation(); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              pageMode === "read"
                ? "bg-white dark:bg-gray-700 text-blue-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            {t("mushaf.read")}
          </button>
          <button
            onClick={() => { setPageMode("recite"); stopAudio(); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              pageMode === "recite"
                ? "bg-white dark:bg-gray-700 text-blue-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Mic className="h-4 w-4" />
            {t("mushaf.recite")}
          </button>
        </div>

        {/* ── Navigation bar ── */}
        <div className="flex items-center gap-2 flex-wrap bg-blue-50/80 border border-blue-100 rounded-xl p-3">
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
                <SelectValue placeholder={`${bookmarks.length} bookmarks`} />
              </SelectTrigger>
              <SelectContent>
                {bookmarks.map(p => (
                  <SelectItem key={p} value={String(p)}>Page {p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goToPage(parseInt(localStorage.getItem(STORAGE_KEY) ?? "1"))} title="Resume last position">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* ── Page content ── */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white dark:bg-blue-950/30 border border-blue-100 rounded-2xl p-8 space-y-6">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
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
              key={`page-${page}-${pageMode}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {/* ────────── READ MODE ────────── */}
              {pageMode === "read" && (
                <div className="bg-white dark:bg-blue-950/30 border border-blue-100 rounded-2xl overflow-hidden shadow-sm">
                  {groups.map((group, gi) => (
                    <div key={gi}>
                      <div className="border-b border-blue-100 bg-blue-50/60 dark:bg-blue-900/20 px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold">
                            {group.ayahsInGroup[0].surah.number}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-blue-950 dark:text-blue-100 font-arabic" style={{ fontFamily: "var(--font-arabic)" }}>
                              {group.surahName}
                            </p>
                            <p className="text-xs text-muted-foreground">{group.surahEnglish} · {group.isMakki ? "Meccan" : "Medinan"}</p>
                          </div>
                        </div>
                        {group.ayahsInGroup[0].numberInSurah === 1 && group.ayahsInGroup[0].surah.number !== 9 && (
                          <p className="text-sm text-blue-900 dark:text-blue-200 font-arabic" style={{ fontFamily: "var(--font-arabic)" }}>
                            بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
                          </p>
                        )}
                      </div>
                      <div className="px-6 py-6" dir="rtl">
                        <p className="text-right leading-[3rem] text-2xl text-slate-900 dark:text-blue-50" style={{ fontFamily: "var(--font-arabic)" }}>
                          {group.ayahsInGroup.map((ayah) => {
                            const globalIdx = pageData.ayahs.indexOf(ayah);
                            const isCurrentPlaying = isPlaying && currentAyahIdx === globalIdx;
                            return (
                              <span key={ayah.number}
                                onClick={() => playAyah(ayah, globalIdx)}
                                className={`cursor-pointer rounded transition-colors px-0.5 ${
                                  isCurrentPlaying
                                    ? "bg-teal-200 dark:bg-blue-700"
                                    : "hover:bg-blue-50 dark:hover:bg-blue-900/40"
                                }`}
                                title={`Verse ${ayah.numberInSurah} — click to play`}
                              >
                                {ayah.text}
                                <span className="text-blue-600 dark:text-blue-400 text-base mx-1">
                                  ۝{ayah.numberInSurah.toLocaleString("ar-SA")}
                                </span>
                              </span>
                            );
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-blue-100 px-6 py-3 flex items-center justify-between text-xs text-muted-foreground bg-blue-50/40">
                    <span>Juz {juzNumber}</span>
                    <span className="font-arabic text-blue-800 dark:text-blue-400" style={{ fontFamily: "var(--font-arabic)" }}>{page}</span>
                    <span>{pageData.ayahs.length} verses on this page</span>
                  </div>
                </div>
              )}

              {/* ────────── RECITE MODE ────────── */}
              {pageMode === "recite" && (
                <div className="space-y-4">

                  {/* Recitation scope selector */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-amber-900 mb-2 flex items-center gap-1.5">
                      <Target className="h-4 w-4" />
                      What will you recite?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => { setReciteScope("page"); resetRecitation(); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          reciteScope === "page"
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white text-amber-800 border-amber-300 hover:bg-amber-50"
                        }`}
                      >
                        Whole Page ({pageData.ayahs.length} verses)
                      </button>
                      {pageData.ayahs.map(a => (
                        <button
                          key={a.number}
                          onClick={() => { setReciteScope(a.number); resetRecitation(); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            reciteScope === a.number
                              ? "bg-amber-600 text-white border-amber-600"
                              : "bg-white text-amber-800 border-amber-300 hover:bg-amber-50"
                          }`}
                        >
                          {a.surah.englishName} :{a.numberInSurah}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mushaf display with word-level coloring */}
                  <div className="bg-white dark:bg-blue-950/30 border border-blue-100 rounded-2xl overflow-hidden shadow-sm">
                    {recitationResult && (
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-teal-200 border border-blue-400"></span> {t("mushaf.correct")}</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-red-200 border border-red-400"></span> {t("mushaf.missing")}</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-orange-200 border border-orange-400"></span> {t("mushaf.extra")}</span>
                      </div>
                    )}
                    {(() => {
                      globalWordCounter = 0;
                      return groups.map((group, gi) => (
                        <div key={gi}>
                          <div className="border-b border-blue-100 bg-blue-50/60 dark:bg-blue-900/20 px-6 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold">
                                {group.ayahsInGroup[0].surah.number}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-blue-950 dark:text-blue-100" style={{ fontFamily: "var(--font-arabic)" }}>
                                  {group.surahName}
                                </p>
                                <p className="text-xs text-muted-foreground">{group.surahEnglish}</p>
                              </div>
                            </div>
                            {group.ayahsInGroup[0].numberInSurah === 1 && group.ayahsInGroup[0].surah.number !== 9 && (
                              <p className="text-sm text-blue-900 font-arabic" style={{ fontFamily: "var(--font-arabic)" }}>
                                بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
                              </p>
                            )}
                          </div>
                          <div className="px-6 py-5" dir="rtl">
                            {group.ayahsInGroup.map(ayah => {
                              const isTargetAyah = reciteScope === "page" || reciteScope === ayah.number;
                              const ayahWords = ayah.text.split(/\s+/).filter(Boolean);
                              const renderedWords = ayahWords.map((word, wi) => {
                                const gIdx = globalWordCounter++;
                                const status = recitationResult && isTargetAyah ? wordStatusMap(gIdx) : "unknown";
                                return (
                                  <span
                                    key={wi}
                                    className={`inline-block leading-loose mx-0.5 rounded px-0.5 transition-colors cursor-default text-2xl ${
                                      status === "correct"
                                        ? "bg-teal-200 text-blue-950 dark:bg-blue-700 dark:text-blue-50"
                                        : status === "missing"
                                        ? "bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-100"
                                        : "text-slate-900 dark:text-blue-50"
                                    }`}
                                    style={{ fontFamily: "var(--font-arabic)" }}
                                    title={
                                      status === "correct" ? `✓ ${t("mushaf.correct")}` :
                                      status === "missing" ? `✗ ${t("mushaf.missing")}` :
                                      undefined
                                    }
                                  >
                                    {word}
                                  </span>
                                );
                              });
                              return (
                                <span key={ayah.number} className={`${!isTargetAyah && recitationResult ? "opacity-40" : ""}`}>
                                  {renderedWords}
                                  <span className="inline-block text-blue-600 text-base mx-1" style={{ fontFamily: "var(--font-arabic)" }}>
                                    ۝{ayah.numberInSurah.toLocaleString("ar-SA")}
                                  </span>
                                  {" "}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}

                    {/* Extra words the student said that aren't in the reference */}
                    {recitationResult && recitationResult.correction.incorrectWords.length > 0 && (
                      <div className="px-6 pb-4 border-t border-gray-100">
                        <p className="text-xs font-medium text-orange-700 mt-3 mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {t("mushaf.extra")} — 
                        </p>
                        <div className="flex flex-wrap gap-1.5" dir="rtl">
                          {recitationResult.correction.incorrectWords.map((w, i) => (
                            <span key={i} className="inline-block bg-orange-100 text-orange-800 rounded px-2 py-0.5 text-sm border border-orange-200"
                              style={{ fontFamily: "var(--font-arabic)" }}>
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Recording Controls ── */}
                  <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-semibold text-blue-950">{t("mushaf.recitationRec")}</p>
                      {recordState === "done" && recitationResult && (
                        <Button variant="outline" size="sm" onClick={resetRecitation} className="gap-1.5 text-xs">
                          <RefreshCw className="h-3.5 w-3.5" /> {t("mushaf.tryAgain")}
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      {/* Big record button */}
                      <div className="relative">
                        <button
                          onClick={handleRecordToggle}
                          disabled={recordState === "analyzing"}
                          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                            recordState === "recording"
                              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                              : recordState === "analyzing"
                              ? "bg-amber-500 text-white cursor-not-allowed"
                              : recordState === "done"
                              ? "bg-blue-700 hover:bg-blue-700 text-white"
                              : "bg-blue-700 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {recordState === "recording" ? (
                            <Square className="h-8 w-8" />
                          ) : recordState === "analyzing" ? (
                            <Loader2 className="h-8 w-8 animate-spin" />
                          ) : recordState === "done" ? (
                            <RefreshCw className="h-7 w-7" />
                          ) : (
                            <Mic className="h-8 w-8" />
                          )}
                        </button>
                        {recordState === "recording" && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-mono min-w-[2.5rem] text-center">
                            {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:{String(recordSeconds % 60).padStart(2, "0")}
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-center text-muted-foreground">
                        {recordState === "idle" && t("mushaf.startRecording")}
                        {recordState === "recording" && (
                          <span className="text-red-600 font-medium animate-pulse">
                            {t("mushaf.recording")}
                          </span>
                        )}
                        {recordState === "analyzing" && (
                          <span className="text-amber-700 font-medium">{t("mushaf.analyzing")}</span>
                        )}
                        {recordState === "done" && t("mushaf.stopRecording")}
                        {recordState === "error" && (
                          <span className="text-red-600">{t("general.error")} — {t("general.tryAgain")}</span>
                        )}
                      </p>

                      {/* Quick tips */}
                      {recordState === "idle" && (
                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-gray-50 rounded-xl p-3 w-full max-w-sm">
                          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-700" />
                          <span>Use a quiet environment. Speak each word clearly. Record at least 3 seconds for best results.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Results Panel ── */}
                  <AnimatePresence>
                    {recitationResult && recordState === "done" && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        {/* ── STT FAILED: show real reason, no correction ── */}
                        {recitationResult.sttFailed && (
                          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
                            <div className="flex items-start gap-3">
                              <MicOff className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                              <div>
                                <p className="font-semibold text-red-800 text-sm">{t("mushaf.sttFailed")}</p>
                                <p className="text-xs text-red-700 mt-1">
                                  {recitationResult.transcription.error ?? t("mushaf.noSpeech")}
                                </p>
                              </div>
                            </div>

                            {recitationResult.transcription.providerErrors && recitationResult.transcription.providerErrors.length > 0 && (
                              <div className="bg-red-100 rounded-xl p-3 space-y-1">
                                <p className="text-xs font-semibold text-red-800 mb-1">{t("mushaf.providerDetails")}</p>
                                {recitationResult.transcription.providerErrors.map((e, i) => (
                                  <p key={i} className="text-xs text-red-700 font-mono">• {e}</p>
                                ))}
                              </div>
                            )}

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                              <p className="font-semibold">{t("mushaf.howToFix")}</p>
                              <p>1. {t("mushaf.fixStep1")}</p>
                              <p>2. {t("mushaf.fixStep2")}</p>
                              <p>3. {t("mushaf.fixStep3")}</p>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={resetRecitation}
                              className="gap-1.5 text-xs border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <RefreshCw className="h-3.5 w-3.5" /> {t("mushaf.tryAgain")}
                            </Button>
                          </div>
                        )}

                        {/* ── SUCCESS: show full correction results ── */}
                        {!recitationResult.sttFailed && recitationResult.correction && (
                          <>
                            {/* Score header */}
                            <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
                              <div className="flex items-center gap-4 flex-wrap">
                                <AccuracyRing score={recitationResult.correction.accuracyScore} />
                                <div className="flex-1 min-w-0 space-y-3">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">{t("mushaf.accuracy")}</p>
                                    <Progress value={recitationResult.correction.accuracyScore} className="h-3" />
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-blue-50 rounded-lg p-2">
                                      <p className="text-lg font-bold text-blue-800">{recitationResult.correction.wordStats.correct}</p>
                                      <p className="text-xs text-blue-700">{t("mushaf.correct")}</p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-2">
                                      <p className="text-lg font-bold text-red-700">{recitationResult.correction.wordStats.missing}</p>
                                      <p className="text-xs text-red-600">{t("mushaf.missing")}</p>
                                    </div>
                                    <div className="bg-orange-50 rounded-lg p-2">
                                      <p className="text-lg font-bold text-orange-700">{recitationResult.correction.wordStats.extra}</p>
                                      <p className="text-xs text-orange-600">{t("mushaf.extra")}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Transcription & confidence */}
                            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <p className="text-sm font-semibold text-blue-950 flex items-center gap-1.5">
                                  <Mic className="h-4 w-4 text-blue-700" />
                                  {t("mushaf.recognizedText")}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="bg-gray-100 rounded px-2 py-0.5">{recitationResult.transcription.model}</span>
                                  <span className="bg-blue-50 text-blue-700 rounded px-2 py-0.5 font-medium">
                                    {Math.round(recitationResult.transcription.confidence * 100)}% {t("mushaf.confidence")}
                                  </span>
                                </div>
                              </div>

                              <div
                                className="bg-gray-50 rounded-xl p-4 text-xl text-right leading-loose text-gray-900"
                                dir="rtl"
                                style={{ fontFamily: "var(--font-arabic)" }}
                              >
                                {recitationResult.transcription.text}
                              </div>

                              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                                <span><span className="font-medium text-gray-700">{t("mushaf.refWords")}:</span> {recitationResult.correction.wordStats.total}</span>
                                <span><span className="font-medium text-gray-700">{t("mushaf.recognized")}:</span> {recitationResult.correction.analysisLog.transcribedWordCount}</span>
                                <span><span className="font-medium text-gray-700">{t("mushaf.lcsMatch")}:</span> {recitationResult.correction.analysisLog.lcsLength}</span>
                                <span><span className="font-medium text-gray-700">{t("mushaf.pattern")}:</span> {recitationResult.correction.analysisLog.errorPattern}</span>
                              </div>
                            </div>

                            {/* Missing words */}
                            {recitationResult.correction.missingWords.length > 0 && (
                              <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                                <p className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-1.5">
                                  <XCircle className="h-4 w-4" />
                                  {t("mushaf.missingWords")} ({recitationResult.correction.missingWords.length})
                                </p>
                                <div className="flex flex-wrap gap-2" dir="rtl">
                                  {recitationResult.correction.missingWords.map((w, i) => (
                                    <span key={i} className="bg-red-100 text-red-900 border border-red-200 rounded-lg px-3 py-1 text-lg"
                                      style={{ fontFamily: "var(--font-arabic)" }}>{w}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Correct words */}
                            {recitationResult.correction.correctWords.length > 0 && (
                              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                                <p className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-1.5">
                                  <CheckCircle2 className="h-4 w-4" />
                                  {t("mushaf.correctWords")} ({recitationResult.correction.correctWords.length})
                                </p>
                                <div className="flex flex-wrap gap-2" dir="rtl">
                                  {recitationResult.correction.correctWords.map((w, i) => (
                                    <span key={i} className="bg-blue-100 text-blue-950 border border-blue-200 rounded-lg px-3 py-1 text-lg"
                                      style={{ fontFamily: "var(--font-arabic)" }}>{w}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* AI Teacher Feedback */}
                            {recitationResult.correction.suggestions.length > 0 && (
                              <div className="bg-gradient-to-br from-blue-700 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
                                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-amber-300" />
                                  {t("mushaf.aiFeedback")}
                                </p>
                                <div className="space-y-2">
                                  {recitationResult.correction.suggestions.map((s, i) => (
                                    <p key={i} className="text-sm text-blue-50 leading-relaxed bg-white/10 rounded-xl px-4 py-3">{s}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Bottom navigation ── */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => goToPage(page - 1)} disabled={page <= 1} className="gap-2 border-blue-200 hover:bg-blue-50">
            <ChevronLeft className="h-4 w-4" />
            {t("general.back")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {Math.round((page / TOTAL_PAGES) * 100)}% {t("mushaf.complete")}
          </span>
          <Button variant="outline" onClick={() => goToPage(page + 1)} disabled={page >= TOTAL_PAGES} className="gap-2 border-blue-200 hover:bg-blue-50">
            {t("general.next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
