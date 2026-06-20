import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Volume2, Mic, Square, Send,
  BookOpen, Star, CheckCircle2, Loader2, Eye, EyeOff,
  RotateCcw, ArrowRight, MessageCircle, BookMarked, Languages,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface GrammarNote {
  title: string;
  titleArabic: string;
  explanation: string;
  examples: Array<{ arabic: string; translation: string }>;
}

interface Exercise {
  type: "fill_blank" | "translate" | "match" | "choose" | "arrange";
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

// ─── Audio hook ───────────────────────────────────────────────────────────────

function useTTS() {
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(async (text: string, lang = "ar") => {
    if (playing === text) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    try {
      audioRef.current?.pause();
      const url = `/api/tts?text=${encodeURIComponent(text.slice(0, 200))}&lang=${lang}`;
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlaying(text);
      audio.onended = () => setPlaying(null);
      audio.onerror = () => setPlaying(null);
      await audio.play();
    } catch {
      setPlaying(null);
    }
  }, [playing]);

  return { play, playing };
}

// ─── Recording hook ───────────────────────────────────────────────────────────

type RecState = "idle" | "recording" | "done";

function useRecorder() {
  const [state, setState] = useState<RecState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTime = useRef(0);
  const timerRef = useRef<NodeJS.Timeout>();

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm" });
      mrRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        setAudioBlob(blob);
        setState("done");
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(250);
      startTime.current = Date.now();
      setState("recording");
      timerRef.current = setInterval(() => setAudioDuration(Math.floor((Date.now() - startTime.current) / 1000)), 100);
    } catch {
      setState("idle");
    }
  }, []);

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    mrRef.current?.stop();
    setAudioDuration(0);
  }, []);

  const reset = useCallback(() => {
    setAudioBlob(null);
    setState("idle");
    setAudioDuration(0);
  }, []);

  return { state, audioBlob, audioDuration, start, stop, reset };
}

// ─── Exercise renderer ────────────────────────────────────────────────────────

function ExerciseSection({ exercises }: { exercises: Exercise[] }) {
  const { t } = useI18n();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const setAnswer = (key: string, val: string) => setAnswers(p => ({ ...p, [key]: val }));
  const checkAll = () => setChecked(true);
  const reset = () => { setAnswers({}); setChecked(false); };

  if (!exercises.length) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Star className="h-5 w-5 text-amber-500" />
        <h3 className="text-base font-bold text-slate-900">{t("lesson.exercises")}</h3>
      </div>

      {exercises.map((ex, ei) => (
        <div key={ei} className="bg-white rounded-xl border border-blue-100 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-900 mb-1">{ex.instruction}</p>
          {ex.instructionArabic && (
            <p className="text-sm text-blue-800 font-arabic mb-3" style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}>
              {ex.instructionArabic}
            </p>
          )}

          {ex.type === "fill_blank" && (
            <div className="space-y-3">
              {ex.items.map((item: any, ii: number) => {
                const key = `${ei}-${ii}`;
                const correct = checked && answers[key]?.trim() === ex.answers[ii];
                const wrong = checked && answers[key]?.trim() !== ex.answers[ii];
                return (
                  <div key={ii} className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-arabic text-blue-950" style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}>
                      {item.sentence}
                    </p>
                    <input
                      value={answers[key] ?? ""}
                      onChange={e => setAnswer(key, e.target.value)}
                      placeholder={item.hint}
                      disabled={checked}
                      className={`border rounded-lg px-3 py-1.5 text-sm font-arabic w-36 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        correct ? "border-blue-500 bg-blue-50" : wrong ? "border-red-400 bg-red-50" : "border-blue-200"
                      }`}
                    />
                    {checked && (
                      <span className={`text-xs font-medium ${correct ? "text-blue-700" : "text-red-600"}`}>
                        {correct ? t("lesson.correctAns") : `${t("lesson.answer")} ${ex.answers[ii]}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {ex.type === "translate" && (
            <div className="space-y-3">
              {ex.items.map((item: any, ii: number) => {
                const key = `${ei}-${ii}`;
                return (
                  <div key={ii} className="space-y-1">
                    <p className="text-sm text-gray-700 font-medium">{item.english}</p>
                    <textarea
                      value={answers[key] ?? ""}
                      onChange={e => setAnswer(key, e.target.value)}
                      disabled={checked}
                      rows={2}
                      placeholder={t("lesson.translatePh")}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}
                    />
                    {checked && (
                      <p className="text-xs text-blue-800 bg-blue-50 rounded px-2 py-1">
                        {t("lesson.modelAnswer")} <span className="font-arabic font-semibold">{ex.answers[ii]}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {ex.type === "match" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                {ex.items.map((item: any, ii: number) => (
                  <div key={ii} className="bg-blue-50 rounded-lg px-3 py-2 text-right font-arabic text-blue-950" style={{ fontFamily: "var(--font-arabic)" }}>
                    {item.arabic}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {ex.items.map((item: any, ii: number) => (
                  <div key={ii} className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-900">
                    {item.english}
                  </div>
                ))}
              </div>
              {checked && (
                <div className="col-span-2 text-xs text-blue-700 bg-blue-50 rounded px-3 py-2">
                  ✓ {t("lesson.matchNote")}
                </div>
              )}
            </div>
          )}

          {ex.type === "choose" && (
            <div className="space-y-4">
              {ex.items.map((item: any, ii: number) => {
                const key = `${ei}-${ii}`;
                return (
                  <div key={ii} className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">{item.question}</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {item.options.map((opt: string, oi: number) => {
                        const selected = answers[key] === String(oi);
                        const isCorrect = oi === item.answer;
                        let cls = "border rounded-lg px-3 py-2 text-sm cursor-pointer transition-all text-left ";
                        if (checked) {
                          cls += isCorrect ? "border-blue-500 bg-blue-50 text-blue-900 font-medium" : selected ? "border-red-400 bg-red-50 text-red-700" : "border-gray-200 text-gray-500";
                        } else {
                          cls += selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50";
                        }
                        return (
                          <button key={oi} className={cls} onClick={() => !checked && setAnswer(key, String(oi))}>
                            <span className="font-medium mr-2 text-blue-700">{String.fromCharCode(65 + oi)}.</span>
                            <span className="font-arabic" style={{ fontFamily: opt.match(/[\u0600-\u06FF]/) ? "var(--font-arabic)" : undefined }}>
                              {opt}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-3">
        {!checked ? (
          <Button onClick={checkAll} className="bg-blue-700 hover:bg-blue-700 text-white">
            <CheckCircle2 className="h-4 w-4 mr-1.5" /> {t("lesson.checkAnswers")}
          </Button>
        ) : (
          <Button onClick={reset} variant="outline" className="border-blue-200 text-blue-800">
            <RotateCcw className="h-4 w-4 mr-1.5" /> {t("lesson.tryAgain")}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BookLesson() {
  const { bookId, lessonNum } = useParams<{ bookId: string; lessonNum: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  const { play, playing } = useTTS();
  const { state: recState, audioBlob, audioDuration, start: startRec, stop: stopRec, reset: resetRec } = useRecorder();

  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pageIndex, setPageIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTranslit, setShowTranslit] = useState(false);
  const [activeTab, setActiveTab] = useState<"read" | "vocab" | "grammar" | "exercises">("read");

  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [pagesCompleted, setPagesCompleted] = useState<Set<number>>(new Set());

  const lessonNumber = parseInt(lessonNum || "1");

  useEffect(() => {
    if (!bookId || !lessonNum) return;
    setLoading(true);
    setLesson(null);
    setError(null);
    setPageIndex(0);
    setPagesCompleted(new Set());
    setAiFeedback("");

    fetch(`/api/arabic/lessons/${bookId}/${lessonNum}`, { credentials: "include" })
      .then(async r => {
        if (!r.ok) throw new Error("Lesson not found");
        const d = await r.json();
        setLesson(d.lesson);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookId, lessonNum]);

  useEffect(() => {
    if (!lesson || !bookId) return;
    if (pagesCompleted.size >= lesson.pages.length) {
      fetch(`/api/library/progress/${bookId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedLessons: lessonNumber }),
      }).catch(() => {});
    }
  }, [pagesCompleted, lesson, bookId, lessonNumber]);

  const currentPage = lesson?.pages[pageIndex];

  const markPageDone = useCallback(() => {
    setPagesCompleted(prev => new Set([...prev, pageIndex]));
    if (lesson && pageIndex < lesson.pages.length - 1) {
      setPageIndex(pageIndex + 1);
      setAiFeedback("");
      resetRec();
    }
  }, [pageIndex, lesson, resetRec]);

  const submitRecording = useCallback(async () => {
    if (!audioBlob || !currentPage) return;
    setAiLoading(true);
    setAiFeedback("");

    try {
      const reader = new FileReader();
      const b64 = await new Promise<string>((res, rej) => {
        reader.onload = () => {
          const result = reader.result as string;
          res(result.split(",")[1] || "");
        };
        reader.onerror = rej;
        reader.readAsDataURL(audioBlob);
      });

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: b64, language: "ar" }),
      });

      let transcription = "";
      if (transcribeRes.ok) {
        const td = await transcribeRes.json();
        transcription = td.text || td.transcription || "";
      }

      const feedbackRes = await fetch("/api/arabic/feedback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcription: transcription || "[Could not transcribe — evaluating general pronunciation practice]",
          targetArabic: currentPage.arabic,
          lessonTitle: lesson?.title,
          mode: "reading",
        }),
      });

      if (!feedbackRes.ok || !feedbackRes.body) {
        throw new Error("Feedback unavailable");
      }

      const reader2 = feedbackRes.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      setAiFeedback("");

      while (true) {
        const { done, value } = await reader2.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const d = line.slice(6).trim();
            if (d === "[DONE]") break;
            try {
              const parsed = JSON.parse(d);
              const chunk = parsed.choices?.[0]?.delta?.content || parsed.text || parsed.content || "";
              if (chunk) { full += chunk; setAiFeedback(full); }
            } catch {
              if (d && d !== "[DONE]") { full += d; setAiFeedback(full); }
            }
          }
        }
      }

      if (!full) setAiFeedback("Great practice! Keep reading this passage aloud and focus on the vowel sounds (harakat). Try listening to the audio again and then record yourself.");
    } catch {
      setAiFeedback("I could not evaluate your recording right now. Please try again, or use the 'Ask AI Teacher' button for a live session.");
    } finally {
      setAiLoading(false);
    }
  }, [audioBlob, currentPage, lesson]);

  const goToPrevLesson = () => navigate(`/library/${bookId}/lesson/${lessonNumber - 1}`);
  const goToNextLesson = () => navigate(`/library/${bookId}/lesson/${lessonNumber + 1}`);

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (error || !lesson) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t("lesson.notFound")}</h2>
          <p className="text-muted-foreground mb-6">{error ?? t("lesson.notFoundSub")}</p>
          <Button onClick={() => navigate(`/library/${bookId}`)} variant="outline">
            <ChevronLeft className="h-4 w-4 mr-1" /> {t("lesson.backToCourse")}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const totalPages = lesson.pages.length;
  const pagesProgress = Math.round((pagesCompleted.size / totalPages) * 100);
  const allDone = pagesCompleted.size >= totalPages;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5 pb-12">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <button onClick={() => navigate(`/library/${bookId}`)} className="hover:text-blue-950 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> {t("lesson.backToCourse")}
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{t("lesson.lesson")} {lessonNumber}</span>
        </div>

        {/* Lesson Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl px-6 py-5 text-white shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-blue-300 text-xs font-medium mb-1">{t("lesson.lesson")} {lessonNumber}</p>
              <h1 className="text-xl font-serif font-bold leading-tight">{lesson.title}</h1>
              <p className="text-white/70 font-arabic text-lg mt-1" style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}>
                {lesson.titleArabic}
              </p>
              <p className="text-blue-200 text-sm mt-2">{lesson.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-blue-300 mb-1">{pagesCompleted.size}/{totalPages} {t("lesson.pages")}</p>
              <Progress value={pagesProgress} className="h-2 w-24 bg-white/20" />
              {allDone && <p className="text-xs text-blue-200 mt-1">{t("lesson.complete")}</p>}
            </div>
          </div>
        </motion.div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-blue-50 rounded-xl p-1 border border-blue-100">
          {[
            { id: "read", label: t("lesson.tabRead"), icon: BookOpen },
            { id: "vocab", label: t("lesson.tabVocab"), icon: BookMarked },
            { id: "grammar", label: t("lesson.tabGrammar"), icon: Languages },
            { id: "exercises", label: t("lesson.tabExercises"), icon: Star },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-blue-900 shadow-sm border border-blue-100"
                  : "text-blue-700 hover:text-blue-900"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── READ TAB ── */}
        <AnimatePresence mode="wait">
          {activeTab === "read" && (
            <motion.div key="read" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">

              {/* Page navigation */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t("lesson.pageOf")} {pageIndex + 1} {t("lesson.of")} {totalPages}</span>
                <div className="flex gap-1">
                  {lesson.pages.map((_, i) => (
                    <button key={i} onClick={() => setPageIndex(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i === pageIndex ? "bg-blue-700 scale-125" : pagesCompleted.has(i) ? "bg-teal-400" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowTranslation(p => !p)} className={`text-xs px-2 py-1 rounded-full border transition-all ${showTranslation ? "border-blue-500 text-blue-800 bg-blue-50" : "border-gray-200 text-gray-500"}`}>
                    <Eye className="h-3 w-3 inline mr-1" />{t("lesson.showTranslation")}
                  </button>
                  <button onClick={() => setShowTranslit(p => !p)} className={`text-xs px-2 py-1 rounded-full border transition-all ${showTranslit ? "border-blue-500 text-blue-700 bg-blue-50" : "border-gray-200 text-gray-500"}`}>
                    {t("lesson.showTranslit")}
                  </button>
                </div>
              </div>

              {/* Arabic text card */}
              {currentPage && (
                <motion.div key={pageIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6"
                >
                  {/* Arabic text */}
                  <div className="bg-blue-50/60 rounded-xl p-5 mb-4 text-right" style={{ direction: "rtl" }}>
                    {currentPage.arabic.split("\n").map((line, li) => (
                      <p key={li} className={`font-arabic text-slate-900 leading-loose ${li === 0 ? "text-2xl" : "text-xl mt-2"}`}
                        style={{ fontFamily: "var(--font-arabic)" }}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Transliteration */}
                  <AnimatePresence>
                    {showTranslit && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="text-sm text-blue-700 italic mb-3 overflow-hidden">
                        {currentPage.transliteration}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Translation */}
                  <AnimatePresence>
                    {showTranslation && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden">
                        {currentPage.translation.split("\n").map((line, li) => (
                          <p key={li} className="text-sm text-gray-600 mb-1">{line}</p>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Note */}
                  {currentPage.note && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                      <p className="text-xs text-amber-800 leading-relaxed">💡 {currentPage.note}</p>
                    </div>
                  )}

                  {/* Audio & Recording */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-200 text-blue-800 hover:bg-blue-50"
                      onClick={() => play(currentPage.arabic.replace(/\n/g, " "), "ar")}
                    >
                      {playing === currentPage.arabic.replace(/\n/g, " ")
                        ? <><Square className="h-3.5 w-3.5 mr-1.5 fill-current" />{t("lesson.stop")}</>
                        : <><Volume2 className="h-3.5 w-3.5 mr-1.5" />{t("lesson.listen")}</>}
                    </Button>

                    {recState === "idle" && (
                      <Button size="sm" variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={startRec}>
                        <Mic className="h-3.5 w-3.5 mr-1.5" />{t("lesson.recordReading")}
                      </Button>
                    )}
                    {recState === "recording" && (
                      <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white animate-pulse" onClick={stopRec}>
                        <Square className="h-3.5 w-3.5 mr-1.5 fill-current" />{t("lesson.stop")} ({audioDuration}s)
                      </Button>
                    )}
                    {recState === "done" && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-blue-700 hover:bg-blue-700 text-white" onClick={submitRecording} disabled={aiLoading}>
                          {aiLoading
                            ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{t("lesson.checking")}</>
                            : <><Send className="h-3.5 w-3.5 mr-1.5" />{t("lesson.getAIFeedback")}</>}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={resetRec} className="text-muted-foreground">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}

                    {!pagesCompleted.has(pageIndex) && (
                      <Button size="sm" className="bg-blue-700 hover:bg-blue-700 text-white ml-auto" onClick={markPageDone}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        {pageIndex < totalPages - 1 ? t("lesson.markDone") : t("lesson.completeLesson")}
                      </Button>
                    )}
                    {pagesCompleted.has(pageIndex) && pageIndex < totalPages - 1 && (
                      <Button size="sm" variant="outline" className="border-blue-200 ml-auto" onClick={() => setPageIndex(pageIndex + 1)}>
                        {t("lesson.nextPage")} <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    )}
                  </div>

                  {/* AI Feedback */}
                  <AnimatePresence>
                    {(aiFeedback || aiLoading) && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-800">{t("lesson.aiFeedback")}</span>
                          {aiLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500 ml-auto" />}
                        </div>
                        {aiFeedback && (
                          <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{aiFeedback}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Page prev/next */}
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setPageIndex(p => Math.max(0, p - 1))} disabled={pageIndex === 0} className="text-blue-800">
                  <ChevronLeft className="h-4 w-4 mr-1" />{t("lesson.prev")}
                </Button>
                <Button variant="ghost" onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))} disabled={pageIndex === totalPages - 1} className="text-blue-800">
                  {t("lesson.next")}<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Cultural note */}
              {lesson.culturalNote && allDone && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5">
                  <p className="text-xs font-semibold text-amber-800 mb-2">📚 {t("lesson.culturalNote")}</p>
                  <p className="text-sm text-amber-900 leading-relaxed">{lesson.culturalNote}</p>
                </motion.div>
              )}

              {/* Lesson nav when all done */}
              {allDone && (
                <div className="flex justify-between items-center bg-blue-50 rounded-xl border border-blue-100 p-4">
                  <div>
                    <p className="text-sm font-bold text-blue-950">🎉 {t("lesson.lesson")} {lessonNumber} {t("lesson.complete")}</p>
                    <p className="text-xs text-muted-foreground">{t("lesson.lessonCompleteMsg")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-blue-200" onClick={() => setActiveTab("exercises")}>
                      <Star className="h-3.5 w-3.5 mr-1" />{t("lesson.tabExercises")}
                    </Button>
                    <Button size="sm" className="bg-blue-700 hover:bg-blue-700 text-white" onClick={goToNextLesson}>
                      {t("lesson.nextLesson")} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── VOCAB TAB ── */}
          {activeTab === "vocab" && (
            <motion.div key="vocab" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              className="space-y-3">
              <p className="text-xs text-muted-foreground">{lesson.vocabulary.length} {t("lesson.vocabWords")}</p>
              {lesson.vocabulary.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <BookMarked className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>{t("lesson.vocabEmpty")}</p>
                </div>
              )}
              {lesson.vocabulary.map((word, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-2xl font-arabic text-blue-950 font-bold" style={{ fontFamily: "var(--font-arabic)" }}>
                          {word.arabic}
                        </p>
                        <button onClick={() => play(word.arabic, "ar")} className="text-blue-600 hover:text-blue-800 transition-colors">
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-blue-600 italic mb-1">{word.transliteration}</p>
                      <p className="text-sm font-semibold text-gray-800">{word.english}</p>
                      {word.plural && <p className="text-xs text-gray-500 mt-0.5">{t("lesson.plural")} <span className="font-arabic">{word.plural}</span></p>}
                      {word.example && <p className="text-xs text-blue-800 mt-1 bg-blue-50 rounded px-2 py-1 font-arabic" style={{ direction: "rtl" }}>{word.example}</p>}
                    </div>
                    <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-500 whitespace-nowrap shrink-0">
                      {word.pos}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── GRAMMAR TAB ── */}
          {activeTab === "grammar" && (
            <motion.div key="grammar" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-serif font-bold text-slate-900">{lesson.grammar.title}</h2>
                  <p className="text-base font-arabic text-blue-800 mt-0.5" style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}>
                    {lesson.grammar.titleArabic}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{lesson.grammar.explanation}</p>
                </div>

                {lesson.grammar.examples.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">{t("lesson.grammarExamples")} — أَمْثِلَة</p>
                    <div className="space-y-2">
                      {lesson.grammar.examples.map((ex, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white border border-blue-100 rounded-lg p-3">
                          <button onClick={() => play(ex.arabic, "ar")} className="text-blue-400 hover:text-blue-700 shrink-0">
                            <Volume2 className="h-4 w-4" />
                          </button>
                          <div className="flex-1">
                            <p className="text-base font-arabic text-blue-950" style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}>
                              {ex.arabic}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">{ex.translation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── EXERCISES TAB ── */}
          {activeTab === "exercises" && (
            <motion.div key="exercises" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              {lesson.exercises.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{t("general.empty")}</p>
                </div>
              ) : (
                <ExerciseSection exercises={lesson.exercises} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lesson navigation */}
        <div className="flex justify-between pt-2 border-t border-blue-100">
          <Button variant="ghost" onClick={goToPrevLesson} disabled={lessonNumber <= 1} className="text-blue-800 text-sm">
            <ChevronLeft className="h-4 w-4 mr-1" />{t("lesson.prevLesson")}
          </Button>
          <Button variant="ghost" onClick={() => navigate(`/library/${bookId}`)} className="text-muted-foreground text-sm">
            <BookOpen className="h-4 w-4 mr-1" />{t("lesson.backToCourse")}
          </Button>
          <Button variant="ghost" onClick={goToNextLesson} className="text-blue-800 text-sm">
            {t("lesson.nextLesson")}<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
