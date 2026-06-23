import { useState, useRef, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/api";
import { useParams, Link } from "wouter";
import { useGetSurah, useListAyahs, useGetSurahProgress } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play, Pause, Mic, ArrowLeft, ArrowRight, RotateCcw, AlertCircle,
  Languages, Loader2, Square, Trash2, Send, ChevronDown, Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// ── Qari data ────────────────────────────────────────────────────────────────
const QARIS = [
  { id: "Alafasy_128kbps",              name: "Mishary Alafasy",      nameAr: "مشاري العفاسي",  country: "Kuwait 🇰🇼",       style: "Murattal" },
  { id: "Abdul_Basit_Murattal_192kbps", name: "Abdul Basit",          nameAr: "عبد الباسط",      country: "Egypt 🇪🇬",        style: "Murattal" },
  { id: "Husary_128kbps",               name: "Mahmoud Al-Husary",    nameAr: "محمود الحصري",    country: "Egypt 🇪🇬",        style: "Mujawwad" },
  { id: "Sudais_192kbps",               name: "Abdur-Rahman As-Sudais",nameAr: "عبد الرحمن السديس",country:"Saudi Arabia 🇸🇦", style: "Murattal" },
  { id: "Minshawi_Murattal_128kbps",    name: "Mohamed Al-Minshawi",  nameAr: "محمد المنشاوي",   country: "Egypt 🇪🇬",        style: "Murattal" },
  { id: "Maher_AlMuaiqly_128kbps",      name: "Maher Al Muaiqly",     nameAr: "ماهر المعيقلي",   country: "Saudi Arabia 🇸🇦", style: "Murattal" },
];

// ── Recording states ──────────────────────────────────────────────────────────
type RecordingState = "idle" | "recording" | "preview" | "submitting";

// ── Waveform bar heights (random static for preview) ─────────────────────────
function genBars(count = 40) {
  return Array.from({ length: count }, () => 0.15 + Math.random() * 0.7);
}

// ── Waveform canvas component ─────────────────────────────────────────────────
function WaveformCanvas({ analyser, isLive, staticBars, color = "#059669" }: {
  analyser: AnalyserNode | null; isLive: boolean; staticBars: number[]; color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    if (isLive && analyser) {
      const draw = () => {
        animRef.current = requestAnimationFrame(draw);
        const bufLen = analyser.frequencyBinCount;
        const data = new Uint8Array(bufLen);
        analyser.getByteFrequencyData(data);
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        const barW = W / 40;
        const step = Math.floor(bufLen / 40);
        for (let i = 0; i < 40; i++) {
          const val = data[i * step] / 255;
          const h = Math.max(4, val * H);
          const x = i * barW + barW * 0.15;
          const bw = barW * 0.7;
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.4 + val * 0.6;
          ctx.beginPath();
          ctx.roundRect(x, (H - h) / 2, bw, h, 3);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };
      draw();
    } else {
      // Static bars
      cancelAnimationFrame(animRef.current);
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const bars = staticBars.length > 0 ? staticBars : genBars();
      const barW = W / bars.length;
      bars.forEach((v, i) => {
        const h = Math.max(4, v * H);
        const x = i * barW + barW * 0.15;
        const bw = barW * 0.7;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3 + v * 0.5;
        ctx.beginPath();
        ctx.roundRect(x, (H - h) / 2, bw, h, 3);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    return () => cancelAnimationFrame(animRef.current);
  }, [analyser, isLive, staticBars, color]);

  return <canvas ref={canvasRef} width={320} height={56} className="w-full h-14 rounded-lg" />;
}

export default function SurahDetail() {
  const params = useParams();
  const surahId = parseInt(params.surahId || "1");
  const { toast } = useToast();

  const { data: surah, isLoading: surahLoading } = useGetSurah(surahId);
  const { data: ayahs, isLoading: ayahsLoading } = useListAyahs(surahId);
  const { data: progress } = useGetSurahProgress(surahId);

  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [sttFailure, setSttFailure] = useState<any>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Qari selection
  const [selectedQariId, setSelectedQariId] = useState("Alafasy_128kbps");
  const [showQariPicker, setShowQariPicker] = useState(false);
  const selectedQari = QARIS.find(q => q.id === selectedQariId) ?? QARIS[0];

  // Recording state machine
  const [recState, setRecState] = useState<RecordingState>("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [previewBars] = useState<number[]>(genBars);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (progress && ayahs && currentAyahIndex === 0) {
      const idx = Math.min(Math.max(0, progress.completedAyahs), ayahs.length - 1);
      setCurrentAyahIndex(idx);
    }
  }, [progress, ayahs]);

  useEffect(() => {
    resetRecording();
    setFeedback(null);
    setSttFailure(null);
    setTranslation(null);
    setShowTranslation(false);
    setIsPlaying(false);
    setMicError(null);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
  }, [currentAyahIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      audioCtxRef.current?.close();
    };
  }, []);

  const currentAyah = ayahs?.[currentAyahIndex];

  const getAudioUrl = (qariId = selectedQariId) => {
    if (!currentAyah) return "";
    const s = surahId.toString().padStart(3, "0");
    const a = currentAyah.numberInSurah.toString().padStart(3, "0");
    return `https://everyayah.com/data/${qariId}/${s}${a}.mp3`;
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
    if (ayahs && currentAyahIndex < ayahs.length - 1) setCurrentAyahIndex(p => p + 1);
  };
  const handlePrev = () => {
    if (currentAyahIndex > 0) setCurrentAyahIndex(p => p - 1);
  };

  const resetRecording = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBlob(null);
    setRecState("idle");
    setRecordingSeconds(0);
    setIsPreviewPlaying(false);
    if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current.src = ""; }
  }, [previewUrl]);

  const startRecording = useCallback(async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Web Audio API for waveform
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start(250);
      setRecState("recording");
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch {
      setMicError("Microphone access denied. Please allow microphone access and try again.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    clearInterval(recordingTimerRef.current!);
    mediaRecorderRef.current.onstop = () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();
      analyserRef.current = null;

      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      if (blob.size < 500) {
        resetRecording();
        toast({ title: "Recording too short", description: "Please speak for at least 1 second.", variant: "destructive" });
        return;
      }
      const url = URL.createObjectURL(blob);
      setPreviewBlob(blob);
      setPreviewUrl(url);
      setRecState("preview");
    };
    mediaRecorderRef.current.stop();
  }, [resetRecording, toast]);

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current || !previewUrl) return;
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current.src = previewUrl;
      previewAudioRef.current.play().catch(() => setIsPreviewPlaying(false));
      setIsPreviewPlaying(true);
    }
  };

  const submitRecording = useCallback(async () => {
    if (!previewBlob || !currentAyah) return;
    setRecState("submitting");

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(previewBlob);
    });

    try {
      const resp = await authFetch("/api/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surahId,
          ayahId: currentAyah.number ?? 0,
          ayahNumber: currentAyah.numberInSurah ?? 0,
          ayahText: currentAyah.text ?? "",
          audioBase64: base64,
          audioMimeType: previewBlob.type,
          durationSeconds: recordingSeconds,
        }),
      });
      const data = await resp.json();

      // STT failure — all 4 providers failed, no feedback generated
      if (data.transcriptionFailed) {
        setSttFailure(data);
        resetRecording();
        return;
      }

      if (!resp.ok) throw new Error("API error");

      // Success — feedback is nested under .feedback from formatRecording
      setFeedback(data.feedback ?? data);
      resetRecording();
    } catch {
      toast({ title: "Error", description: "Could not submit recording. Please try again.", variant: "destructive" });
      setRecState("preview");
    }
  }, [previewBlob, currentAyah, surahId, recordingSeconds, resetRecording, toast]);

  const loadTranslation = async () => {
    if (translation) { setShowTranslation(v => !v); return; }
    setLoadingTranslation(true);
    try {
      const resp = await authFetch(`/api/ayahs/${surahId}:${currentAyah?.numberInSurah}`, { });
      if (resp.ok) { const d = await resp.json(); setTranslation(d.translation ?? null); setShowTranslation(true); }
    } catch {} finally { setLoadingTranslation(false); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

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
  const scoreColor = score >= 90 ? "border-blue-500 text-blue-700" : score >= 75 ? "border-amber-500 text-amber-600" : "border-red-500 text-red-600";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-16">
        <Link href="/learn" className="inline-flex items-center text-blue-700 hover:text-blue-800 mb-6 font-medium text-sm">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Surahs
        </Link>

        <div className="text-center mb-5">
          <h1 className="text-3xl font-serif text-slate-900 dark:text-blue-50 mb-1">{surah.name}</h1>
          <p className="font-arabic text-2xl text-blue-900 dark:text-blue-300">{surah.nameArabic}</p>
          <p className="text-sm text-muted-foreground mt-1">{surah.nameTranslation} · {surah.ayahCount} Ayahs · {surah.revelationType}</p>
        </div>

        {/* ── Qari Selector ── */}
        <div className="relative mb-4 flex justify-center">
          <button
            onClick={() => setShowQariPicker(v => !v)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-blue-100 bg-white shadow-sm hover:shadow-md transition-all"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-700 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {selectedQari.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{selectedQari.name}</p>
              <p className="text-[10px] text-muted-foreground">{selectedQari.country} · {selectedQari.style}</p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showQariPicker ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showQariPicker && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-white border border-blue-100 rounded-2xl shadow-xl z-50 overflow-hidden"
              >
                <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider px-4 pt-3 pb-1">Select Qari</p>
                {QARIS.map(q => (
                  <button
                    key={q.id}
                    onClick={() => { setSelectedQariId(q.id); setShowQariPicker(false); if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); } }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-700 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {q.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-slate-900">{q.name}</p>
                      <p className="text-xs font-arabic text-blue-800">{q.nameAr}</p>
                      <p className="text-[10px] text-muted-foreground">{q.country} · {q.style}</p>
                    </div>
                    {selectedQariId === q.id && <Check className="h-4 w-4 text-blue-700 shrink-0" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Main Quran Card ── */}
        <div className="relative mb-6" onClick={() => setShowQariPicker(false)}>
          <Card className="overflow-hidden border-2 border-blue-100 shadow-2xl bg-[#fdfdfc] dark:bg-blue-950/80">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('/images/geometric-pattern.png')] bg-cover" />
            <CardContent className="p-8 md:p-12 relative z-10">
              <div className="flex justify-between items-center mb-8 text-blue-700/60 text-sm font-medium">
                <span>Surah {surahId} · Ayah {currentAyah.numberInSurah}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={loadTranslation} className="text-xs gap-1 text-blue-800 hover:text-blue-950">
                    {loadingTranslation ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                    Translation
                  </Button>
                  <span className="text-blue-300">{currentAyah.numberInSurah} / {surah.ayahCount}</span>
                </div>
              </div>

              {/* Translation */}
              <AnimatePresence>
                {showTranslation && translation && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed italic">"{translation}"</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Arabic Text */}
              <div className="flex items-center justify-center py-8 min-h-[180px]">
                <p className="text-4xl md:text-5xl lg:text-6xl text-center leading-[2] md:leading-[2.5] text-slate-900 dark:text-blue-50"
                  style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}>
                  {currentAyah.text}
                  <span className="inline-block mx-2 text-2xl text-blue-600/50">﴾{currentAyah.numberInSurah}﴿</span>
                </p>
              </div>

              {/* ── Audio Player + Recording ── */}
              <div className="mt-8 space-y-5">
                {/* Play Ayah button */}
                <div className="flex justify-center">
                  <Button variant="outline" onClick={togglePlay}
                    className="flex items-center gap-2 h-11 px-6 rounded-full border-blue-200 text-blue-800 hover:bg-blue-50">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    {isPlaying ? "Pause Qari" : `Listen — ${selectedQari.name}`}
                  </Button>
                </div>

                {/* ── Recording UI ── */}
                <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/50 dark:bg-blue-950/30 p-5 space-y-4">
                  {/* Waveform */}
                  {(recState === "recording" || recState === "preview") && (
                    <WaveformCanvas
                      analyser={recState === "recording" ? analyserRef.current : null}
                      isLive={recState === "recording"}
                      staticBars={previewBars}
                      color="#059669"
                    />
                  )}

                  {/* Timer */}
                  {(recState === "recording" || recState === "preview") && (
                    <div className="text-center">
                      <span className={`text-2xl font-mono font-bold tabular-nums ${recState === "recording" ? "text-red-500" : "text-blue-800"}`}>
                        {fmt(recordingSeconds)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">{recState === "recording" ? "Recording…" : "Ready to submit"}</span>
                    </div>
                  )}

                  {/* Idle state: big record button */}
                  {recState === "idle" && (
                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={startRecording}
                        className="h-20 w-20 rounded-full bg-blue-700 hover:bg-blue-700 hover:scale-105 flex items-center justify-center shadow-lg shadow-blue-500 transition-all duration-200"
                      >
                        <Mic className="h-8 w-8 text-white" />
                      </button>
                      <p className="text-sm font-medium text-muted-foreground">Tap to start recording your recitation</p>
                    </div>
                  )}

                  {/* Recording state: stop button */}
                  {recState === "recording" && (
                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={stopRecording}
                        className="h-20 w-20 rounded-full bg-red-500 hover:bg-red-600 scale-110 shadow-2xl shadow-red-200 ring-4 ring-red-300 flex items-center justify-center transition-all duration-200"
                      >
                        <Square className="h-8 w-8 text-white fill-white" />
                      </button>
                      <p className="text-sm font-medium text-red-500 animate-pulse">Recording — Tap to stop</p>
                    </div>
                  )}

                  {/* Preview state: playback + actions */}
                  {recState === "preview" && (
                    <div className="space-y-4">
                      {/* Preview playback */}
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={togglePreviewPlay}
                          className="h-11 w-11 rounded-full bg-blue-100 hover:bg-teal-200 flex items-center justify-center transition-colors"
                        >
                          {isPreviewPlaying ? <Pause className="h-5 w-5 text-blue-800" /> : <Play className="h-5 w-5 text-blue-800 ml-0.5" />}
                        </button>
                        <span className="text-sm text-blue-900 font-medium">Review your recording</span>
                      </div>
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={resetRecording}
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-1.5">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { resetRecording(); setTimeout(startRecording, 100); }}
                          className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50 gap-1.5">
                          <RotateCcw className="h-3.5 w-3.5" /> Re-record
                        </Button>
                        <Button size="sm" onClick={submitRecording}
                          className="flex-1 bg-blue-700 hover:bg-blue-700 text-white gap-1.5">
                          <Send className="h-3.5 w-3.5" /> Submit
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Submitting */}
                  {recState === "submitting" && (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
                      <p className="text-sm text-blue-800 font-medium">Analyzing your recitation with AI…</p>
                    </div>
                  )}

                  {micError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {micError}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ayah Navigation */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-14">
            <Button variant="ghost" size="icon" onClick={handlePrev} disabled={currentAyahIndex === 0}
              className="rounded-full bg-white shadow-md text-blue-800 hover:text-blue-950 disabled:opacity-30">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-14">
            <Button variant="ghost" size="icon" onClick={handleNext} disabled={currentAyahIndex === ayahs.length - 1}
              className="rounded-full bg-white shadow-md text-blue-800 hover:text-blue-950 disabled:opacity-30">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* ── STT Failure Panel — shown when ALL 4 providers fail ── */}
        <AnimatePresence>
          {sttFailure && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <Card className="border-red-200 shadow-lg overflow-hidden bg-gradient-to-br from-white to-red-50 dark:from-red-950 dark:to-red-900">
                <CardContent className="p-6 md:p-8 space-y-5">

                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-900">Speech Recognition Failed</h3>
                      <p className="text-sm text-red-700 mt-0.5">{sttFailure.reason}</p>
                    </div>
                  </div>

                  {/* Audio diagnostics */}
                  {sttFailure.diagnostics && (
                    <div className="grid grid-cols-2 gap-3">
                      {sttFailure.diagnostics.audioBytes > 0 && (
                        <div className="bg-white rounded-xl p-3 border border-red-100 text-center">
                          <p className="text-2xl font-bold text-red-700">
                            {Math.round(sttFailure.diagnostics.audioBytes / 1024)} KB
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">Audio received</p>
                        </div>
                      )}
                      {sttFailure.diagnostics.durationSeconds > 0 && (
                        <div className="bg-white rounded-xl p-3 border border-red-100 text-center">
                          <p className="text-2xl font-bold text-red-700">
                            {sttFailure.diagnostics.durationSeconds}s
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">Recording length</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Provider attempts table */}
                  {sttFailure.diagnostics?.providersAttempted?.length > 0 && (
                    <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wider px-4 pt-3 pb-2">
                        Providers Attempted
                      </p>
                      <div className="divide-y divide-red-50">
                        {sttFailure.diagnostics.providersAttempted.map((p: any, i: number) => (
                          <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                            <span className="mt-0.5 h-2 w-2 rounded-full bg-red-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-red-800">{p.provider}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{p.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All raw errors (collapsed) */}
                  {sttFailure.providerErrors?.length > 0 && (
                    <details className="group">
                      <summary className="cursor-pointer text-xs text-red-400 hover:text-red-600 flex items-center gap-1 select-none">
                        <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                        Full error log
                      </summary>
                      <div className="mt-2 bg-gray-50 rounded-lg p-3 font-mono text-[10px] text-gray-600 space-y-1">
                        {sttFailure.providerErrors.map((e: string, i: number) => (
                          <p key={i} className="break-all">{i + 1}. {e}</p>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Tips */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 space-y-1.5">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Tips to fix this</p>
                    <ul className="space-y-1">
                      {[
                        "Speak clearly and close to your microphone",
                        "Record in a quiet room (no background noise)",
                        "Record for at least 3 seconds",
                        "Add a GROQ_API_KEY secret for fastest, most reliable STT",
                        "Try again — the local AI model downloads ~39MB on first use",
                      ].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                          <span className="mt-0.5 text-amber-500">•</span>{tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2 border-t border-red-100">
                    <Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => { setSttFailure(null); }}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                    <Button className="flex-1 bg-blue-700 hover:bg-blue-700 text-white" onClick={handleNext}
                      disabled={currentAyahIndex === ayahs.length - 1}>
                      Skip to Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AI Feedback Panel ── */}
        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <Card className="border-blue-200 shadow-lg overflow-hidden bg-gradient-to-br from-white to-blue-50 dark:from-blue-950 dark:to-blue-900">
                <CardContent className="p-6 md:p-8 space-y-6">

                  {/* ── Transcription failed banner ── */}
                  {feedback.transcriptionSuccess === false && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Audio transcription unavailable</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          The AI speech-to-text service did not process your audio this time
                          {feedback.diagnostics?.transcriptionProvider ? ` (tried: ${feedback.diagnostics.transcriptionProvider})` : ""}.
                          Scores below are based on Tajweed rules detected in the text only.
                          {" "}
                          <span className="font-medium">For live audio analysis, a GROQ_API_KEY is needed.</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Score ring + sub-score bars ── */}
                  <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <div className="shrink-0 flex flex-col items-center">
                      <div className={`relative h-28 w-28 rounded-full flex items-center justify-center border-8 ${scoreColor}`}>
                        <span className="text-4xl font-bold">{score}</span>
                      </div>
                      <span className="mt-2 text-sm font-medium text-blue-900">Overall Score</span>
                      {feedback.transcriptionSuccess === false && (
                        <Badge variant="outline" className="mt-2 text-xs text-amber-600 border-amber-300">Text analysis only</Badge>
                      )}
                      {feedback.diagnostics?.audioDurationSeconds > 0 && (
                        <span className="mt-1 text-xs text-muted-foreground">
                          ⏱ {feedback.diagnostics.audioDurationSeconds}s recorded
                        </span>
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-3">
                      {[
                        { label: "Accuracy", score: feedback.accuracyScore, desc: "Words matched" },
                        { label: "Tajweed", score: feedback.tajweedScore, desc: "Pronunciation rules" },
                        { label: "Pronunciation", score: feedback.pronunciationScore, desc: "Letter clarity" },
                        { label: "Fluency", score: feedback.fluencyScore, desc: "Smoothness" },
                      ].map(({ label, score: s, desc }) => {
                        const pct = Math.max(0, Math.min(100, s));
                        const color = pct >= 90 ? "bg-blue-600" : pct >= 70 ? "bg-amber-500" : "bg-red-500";
                        return (
                          <div key={label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-blue-950">{label}</span>
                              <span className="text-muted-foreground">{pct}%</span>
                            </div>
                            <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden" title={desc}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`h-full rounded-full ${color}`} />
                            </div>
                          </div>
                        );
                      })}
                      {feedback.wordStats && (
                        <p className="text-xs text-muted-foreground pt-1">
                          Words: <span className="text-blue-800 font-medium">{feedback.wordStats.correct} correct</span>
                          {" · "}<span className="text-red-600 font-medium">{feedback.wordStats.missing} missing</span>
                          {feedback.wordStats.extra > 0 && <> · <span className="text-amber-600 font-medium">{feedback.wordStats.extra} extra</span></>}
                          {" · "}<span className="text-muted-foreground">{feedback.wordStats.total} total</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ── What AI heard ── */}
                  {feedback.transcribedText ? (
                    <div className="bg-white dark:bg-blue-950 rounded-xl p-4 border border-blue-100">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">🎤 What the AI Heard</p>
                      <p className="text-base text-blue-950 leading-relaxed" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                        {feedback.transcribedText}
                      </p>
                      {feedback.transcriptionModel && feedback.transcriptionModel !== "none" && (
                        <p className="text-[10px] text-muted-foreground mt-1.5">Model: {feedback.transcriptionModel}</p>
                      )}
                    </div>
                  ) : feedback.transcriptionSuccess === false ? (
                    <div className="bg-gray-50 dark:bg-blue-950 rounded-xl p-4 border border-dashed border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">🎤 AI Heard</p>
                      <p className="text-sm text-gray-400 italic">No speech detected — transcription unavailable.</p>
                      <p className="text-xs text-gray-400 mt-1">Make sure you're in a quiet room and speak clearly into the microphone.</p>
                    </div>
                  ) : null}

                  {/* ── Word-by-word diff ── */}
                  {(feedback.correctWords?.length > 0 || feedback.missingWords?.length > 0 || feedback.incorrectWords?.length > 0) && (
                    <div className="bg-white dark:bg-blue-950 rounded-xl p-4 border border-blue-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">📝 Word Analysis</p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span><span className="inline-block w-2 h-2 rounded-sm bg-blue-600 mr-1" />correct</span>
                          <span><span className="inline-block w-2 h-2 rounded-sm bg-red-400 mr-1" />missing</span>
                          {feedback.incorrectWords?.length > 0 && <span><span className="inline-block w-2 h-2 rounded-sm bg-amber-400 mr-1" />extra</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2" dir="rtl">
                        {feedback.correctWords?.map((w: string, i: number) => (
                          <span key={`c-${i}`} className="px-2 py-1 bg-blue-100 text-blue-900 rounded-md text-sm font-arabic">✓ {w}</span>
                        ))}
                        {feedback.incorrectWords?.map((w: string, i: number) => (
                          <span key={`x-${i}`} className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-sm font-arabic">+ {w}</span>
                        ))}
                        {feedback.missingWords?.map((w: string, i: number) => (
                          <span key={`m-${i}`} className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-sm font-arabic line-through opacity-70">⊘ {w}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Tajweed rules ── */}
                  {feedback.tajweedRules?.length > 0 && (
                    <div className="bg-white dark:bg-blue-950 rounded-xl p-4 border border-blue-100">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">🌙 Tajweed Rules in This Verse</p>
                      <div className="flex flex-wrap gap-2">
                        {feedback.tajweedRules.map((rule: any) => (
                          <div key={rule.name} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-800 font-semibold text-sm">{rule.name}</span>
                              <span className="text-blue-700 font-arabic text-base">{rule.nameArabic}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                            {rule.confidenceNote && (
                              <p className="text-[10px] text-amber-600 mt-0.5 italic">{rule.confidenceNote}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── AI suggestions ── */}
                  {feedback.suggestions?.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-100">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">💡 Your AI Teacher Says</p>
                      <ul className="space-y-2">
                        {feedback.suggestions.map((s: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                            <span className="mt-0.5 shrink-0 text-amber-500">•</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ── Score formula (collapsed by default) ── */}
                  {feedback.diagnostics?.scoreFormula && (
                    <details className="group">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-blue-800 flex items-center gap-1 select-none">
                        <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                        How was this score calculated?
                      </summary>
                      <div className="mt-2 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 font-mono">
                        {feedback.diagnostics.scoreFormula}
                        {feedback.diagnostics.analysisLog && (
                          <div className="mt-2 border-t border-gray-200 pt-2 space-y-0.5 font-sans">
                            <p>Reference words: {feedback.diagnostics.analysisLog.referenceWordCount}</p>
                            <p>Transcribed words: {feedback.diagnostics.analysisLog.transcribedWordCount}</p>
                            <p>LCS matches: {feedback.diagnostics.analysisLog.lcsLength}</p>
                            <p>Error pattern: {feedback.diagnostics.analysisLog.errorPattern}</p>
                            {feedback.diagnostics.audioBytes > 0 && <p>Audio size: ~{Math.round(feedback.diagnostics.audioBytes / 1024)} KB</p>}
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* ── Action buttons ── */}
                  <div className="flex gap-3 pt-2 border-t border-blue-100">
                    <Button variant="outline" className="flex-1 border-blue-200 text-blue-800 hover:bg-blue-50" onClick={() => setFeedback(null)}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                    <Button className="flex-1 bg-blue-700 hover:bg-blue-700 text-white" onClick={handleNext}
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
        <audio ref={previewAudioRef} onEnded={() => setIsPreviewPlaying(false)} />
      </div>
    </AppLayout>
  );
}
