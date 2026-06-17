import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useGetSurah, useListAyahs, useGetSurahProgress } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Mic, ArrowLeft, ArrowRight, RotateCcw, AlertCircle, CheckCircle2, Languages, BookOpen, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const QARIS: Record<string, string> = {
  Alafasy_128kbps: "Mishary Al-Afasy",
  Abdul_Basit_Murattal_192kbps: "Abdul Basit",
  Husary_128kbps: "Mahmoud Khalil Al-Husary",
  Minshawi_Murattal_128kbps: "Mohamed Siddiq Al-Minshawi",
};

export default function SurahDetail() {
  const params = useParams();
  const surahId = parseInt(params.surahId || "1");
  const { toast } = useToast();

  const { data: surah, isLoading: surahLoading } = useGetSurah(surahId);
  const { data: ayahs, isLoading: ayahsLoading } = useListAyahs(surahId);
  const { data: progress } = useGetSurahProgress(surahId);

  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (progress && ayahs && currentAyahIndex === 0) {
      const idx = Math.min(Math.max(0, progress.completedAyahs), ayahs.length - 1);
      setCurrentAyahIndex(idx);
    }
  }, [progress, ayahs]);

  useEffect(() => {
    setFeedback(null);
    setTranslation(null);
    setShowTranslation(false);
    setIsPlaying(false);
    setMicError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, [currentAyahIndex]);

  const currentAyah = ayahs?.[currentAyahIndex];

  const getAudioUrl = (qari = "Alafasy_128kbps") => {
    if (!currentAyah) return "";
    const s = surahId.toString().padStart(3, "0");
    const a = currentAyah.numberInSurah.toString().padStart(3, "0");
    return `https://everyayah.com/data/${qari}/${s}${a}.mp3`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = getAudioUrl();
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (ayahs && currentAyahIndex < ayahs.length - 1) {
      setCurrentAyahIndex((p) => p + 1);
    }
  };

  const handlePrev = () => {
    if (currentAyahIndex > 0) setCurrentAyahIndex((p) => p - 1);
  };

  const startRecording = useCallback(async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      setMicError("Microphone access denied. Please allow microphone access and try again.");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;

    clearInterval(recordingTimerRef.current!);
    setIsRecording(false);
    setIsProcessing(true);

    await new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = () => resolve();
      mediaRecorderRef.current!.stop();
    });

    streamRef.current?.getTracks().forEach((t) => t.stop());

    const mimeType = mediaRecorderRef.current.mimeType || "audio/webm";
    const blob = new Blob(audioChunksRef.current, { type: mimeType });

    if (blob.size < 1000) {
      setIsProcessing(false);
      toast({ title: "Recording too short", description: "Please hold the button while reciting.", variant: "destructive" });
      return;
    }

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    try {
      const resp = await fetch("/api/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          surahId,
          ayahId: currentAyah?.number ?? 0,
          ayahNumber: currentAyah?.numberInSurah ?? 0,
          ayahText: currentAyah?.text ?? "",
          audioBase64: base64,
          audioMimeType: mimeType,
          durationSeconds: recordingSeconds,
        }),
      });

      if (!resp.ok) throw new Error("API error");
      const data = await resp.json();
      setFeedback(data.feedback);

      if (data.feedback?.transcriptionSuccess === false) {
        toast({
          title: "Transcription unavailable",
          description: "Add HF_TOKEN to enable real speech recognition. Showing text analysis.",
        });
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not submit recording. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [currentAyah, surahId, recordingSeconds, toast]);

  const loadTranslation = async () => {
    if (translation) { setShowTranslation((v) => !v); return; }
    setLoadingTranslation(true);
    try {
      const resp = await fetch(`/api/ayahs/${surahId}:${currentAyah?.numberInSurah}`, { credentials: "include" });
      if (resp.ok) {
        const data = await resp.json();
        setTranslation(data.translation ?? null);
        setShowTranslation(true);
      }
    } catch {}
    setLoadingTranslation(false);
  };

  if (surahLoading || ayahsLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-[60vh] w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!surah || !ayahs || !currentAyah) return <AppLayout><div className="p-8 text-center text-muted-foreground">Failed to load. Please refresh.</div></AppLayout>;

  const score = feedback?.overallScore ?? 0;
  const scoreColor = score >= 90 ? "border-emerald-500 text-emerald-600" : score >= 75 ? "border-amber-500 text-amber-600" : "border-red-500 text-red-600";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-16">
        <Link href="/learn" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6 font-medium text-sm">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Surahs
        </Link>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-serif text-emerald-950 dark:text-emerald-50 mb-1">{surah.name}</h1>
          <p className="font-arabic text-2xl text-emerald-800 dark:text-emerald-300">{surah.nameArabic}</p>
          <p className="text-sm text-muted-foreground mt-1">{surah.nameTranslation} · {surah.ayahCount} Ayahs · {surah.revelationType}</p>
        </div>

        {/* Main Quran Card */}
        <div className="relative mb-6">
          <Card className="overflow-hidden border-2 border-emerald-100 shadow-2xl bg-[#fdfdfc] dark:bg-emerald-950/80">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('/images/geometric-pattern.png')] bg-cover" />
            <CardContent className="p-8 md:p-12 relative z-10">
              <div className="flex justify-between items-center mb-8 text-emerald-600/60 text-sm font-medium">
                <span>Surah {surahId} · Ayah {currentAyah.numberInSurah}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={loadTranslation} className="text-xs gap-1 text-emerald-700 hover:text-emerald-900">
                    {loadingTranslation ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                    Translation
                  </Button>
                  <span className="text-emerald-300">{currentAyah.numberInSurah} / {surah.ayahCount}</span>
                </div>
              </div>

              {/* Translation Panel */}
              <AnimatePresence>
                {showTranslation && translation && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed italic">"{translation}"</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Arabic Text */}
              <div className="flex items-center justify-center py-8 min-h-[180px]">
                <p className="text-4xl md:text-5xl lg:text-6xl text-center leading-[2] md:leading-[2.5] text-emerald-950 dark:text-emerald-50"
                  style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}>
                  {currentAyah.text}
                  <span className="inline-block mx-2 text-2xl text-emerald-500/50">﴾{currentAyah.numberInSurah}﴿</span>
                </p>
              </div>

              {/* Controls */}
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex items-center gap-6">
                  <Button variant="outline" size="icon" onClick={togglePlay}
                    className="h-14 w-14 rounded-full border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                  </Button>

                  {/* Record Button */}
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onMouseLeave={() => isRecording && stopRecording()}
                      onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                      onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                      disabled={isProcessing}
                      className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg focus:outline-none ${
                        isProcessing ? "bg-gray-400 cursor-wait" :
                        isRecording ? "bg-red-500 scale-110 shadow-red-300 shadow-2xl ring-4 ring-red-300" :
                        "bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
                      }`}
                    >
                      {isProcessing
                        ? <Loader2 className="h-8 w-8 text-white animate-spin" />
                        : <Mic className={`h-8 w-8 text-white ${isRecording ? "animate-pulse" : ""}`} />
                      }
                    </button>
                    <span className="text-xs font-medium text-muted-foreground">
                      {isProcessing ? "Analyzing…" : isRecording ? `Recording ${recordingSeconds}s — Release to analyze` : "Hold to recite"}
                    </span>
                  </div>
                </div>

                {micError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {micError}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-14">
            <Button variant="ghost" size="icon" onClick={handlePrev} disabled={currentAyahIndex === 0}
              className="rounded-full bg-white shadow-md text-emerald-700 hover:text-emerald-900 disabled:opacity-30">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-14">
            <Button variant="ghost" size="icon" onClick={handleNext} disabled={currentAyahIndex === ayahs.length - 1}
              className="rounded-full bg-white shadow-md text-emerald-700 hover:text-emerald-900 disabled:opacity-30">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* AI Feedback Panel */}
        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <Card className="border-emerald-200 shadow-lg overflow-hidden bg-gradient-to-br from-white to-emerald-50 dark:from-emerald-950 dark:to-emerald-900">
                <CardContent className="p-6 md:p-8 space-y-6">

                  {/* Header + Score */}
                  <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <div className="shrink-0 flex flex-col items-center">
                      <div className={`relative h-28 w-28 rounded-full flex items-center justify-center border-8 ${scoreColor}`}>
                        <span className="text-4xl font-bold">{score}</span>
                      </div>
                      <span className="mt-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">Overall Score</span>
                      {feedback.transcriptionSuccess === false && (
                        <Badge variant="outline" className="mt-2 text-xs text-amber-600 border-amber-300">Text analysis only</Badge>
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-3">
                      {[
                        { label: "Accuracy", score: feedback.accuracyScore, desc: "Words matched" },
                        { label: "Tajweed", score: feedback.tajweedScore, desc: "Pronunciation rules" },
                        { label: "Pronunciation", score: feedback.pronunciationScore, desc: "Letter clarity" },
                        { label: "Fluency", score: feedback.fluencyScore, desc: "Smoothness of recitation" },
                      ].map(({ label, score: s, desc }) => {
                        const pct = Math.max(0, Math.min(100, s));
                        const color = pct >= 90 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500";
                        return (
                          <div key={label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-emerald-900 dark:text-emerald-100">{label}</span>
                              <span className="text-muted-foreground">{pct}%</span>
                            </div>
                            <div className="h-2 w-full bg-emerald-100 dark:bg-emerald-950 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-full rounded-full ${color}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Transcribed Text */}
                  {feedback.transcribedText && (
                    <div className="bg-white dark:bg-emerald-950 rounded-xl p-4 border border-emerald-100">
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">🎤 What the AI Heard</p>
                      <p className="text-base text-emerald-900 dark:text-emerald-100 leading-relaxed" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                        {feedback.transcribedText}
                      </p>
                    </div>
                  )}

                  {/* Word Analysis */}
                  {(feedback.correctWords?.length > 0 || feedback.missingWords?.length > 0 || feedback.incorrectWords?.length > 0) && (
                    <div className="bg-white dark:bg-emerald-950 rounded-xl p-4 border border-emerald-100 space-y-3">
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">📝 Word Analysis</p>
                      <div className="flex flex-wrap gap-2" dir="rtl">
                        {feedback.correctWords?.map((w: string, i: number) => (
                          <span key={`c-${i}`} className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-sm font-arabic">✓ {w}</span>
                        ))}
                        {feedback.incorrectWords?.map((w: string, i: number) => (
                          <span key={`x-${i}`} className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-sm font-arabic">✗ {w}</span>
                        ))}
                        {feedback.missingWords?.map((w: string, i: number) => (
                          <span key={`m-${i}`} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-sm font-arabic line-through">⊘ {w}</span>
                        ))}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="text-emerald-600">✓ Correct: {feedback.wordStats?.correct ?? 0}</span>
                        <span className="text-red-500">✗ Extra: {feedback.wordStats?.extra ?? 0}</span>
                        <span className="text-gray-500">⊘ Missed: {feedback.wordStats?.missing ?? 0}</span>
                      </div>
                    </div>
                  )}

                  {/* Tajweed Rules */}
                  {feedback.tajweedRules?.length > 0 && (
                    <div className="bg-white dark:bg-emerald-950 rounded-xl p-4 border border-emerald-100">
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">🌙 Tajweed Rules in this Ayah</p>
                      <div className="flex flex-wrap gap-2">
                        {feedback.tajweedRules.map((rule: any) => (
                          <div key={rule.name} className="bg-emerald-50 dark:bg-emerald-900/50 border border-emerald-200 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-700 font-semibold text-sm">{rule.name}</span>
                              <span className="text-emerald-600 font-arabic text-base">{rule.nameArabic}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {feedback.suggestions?.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-100">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">💡 Improvement Tips</p>
                      <ul className="space-y-1.5">
                        {feedback.suggestions.map((s: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
                            <span className="mt-0.5 shrink-0">•</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2 border-t border-emerald-100">
                    <Button variant="outline" className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => setFeedback(null)}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleNext}
                      disabled={currentAyahIndex === ayahs.length - 1}>
                      Next Ayah <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      </div>
    </AppLayout>
  );
}
