import { useState, useRef, useCallback, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2, RefreshCw, Video, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/lib/api";

type TeacherMode = "quran" | "tajweed" | "hifdh" | "arabic" | "fiqh" | "tafsir";
type Language = "en" | "ar" | "so";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const TEACHER_MODES: { value: TeacherMode; label: string; labelAr: string; color: string; emoji: string; desc: string }[] = [
  { value: "quran",  label: "Quran Teacher",  labelAr: "معلم القرآن",  color: "emerald", emoji: "📖", desc: "Recitation, memorization & understanding" },
  { value: "tajweed",label: "Tajweed Teacher",labelAr: "معلم التجويد", color: "amber",   emoji: "🎵", desc: "Pronunciation & articulation rules" },
  { value: "hifdh",  label: "Hifdh Coach",    labelAr: "مدرب الحفظ",  color: "blue",    emoji: "🧠", desc: "Memorization strategies & plans" },
  { value: "arabic", label: "Arabic Teacher", labelAr: "معلم العربية", color: "purple",  emoji: "🌙", desc: "Classical Arabic language" },
  { value: "fiqh",   label: "Fiqh Teacher",   labelAr: "معلم الفقه",  color: "teal",    emoji: "⚖️", desc: "Islamic jurisprudence" },
  { value: "tafsir", label: "Tafsir Teacher", labelAr: "معلم التفسير",color: "rose",    emoji: "✨", desc: "Quran explanation & commentary" },
];

const LANGS: { value: Language; label: string; ttsCode: string }[] = [
  { value: "en", label: "English",  ttsCode: "en" },
  { value: "ar", label: "العربية", ttsCode: "ar" },
  { value: "so", label: "Somali",   ttsCode: "so" },
];

// ── AudioContext-driven lip sync ──────────────────────────────────────────────
// mouthAmount: 0.0 = closed, 1.0 = wide open — driven by real audio RMS amplitude
function AvatarFace({ isSpeaking, isThinking, mode, mouthAmount }: {
  isSpeaking: boolean;
  isThinking: boolean;
  mode: TeacherMode;
  mouthAmount: number;
}) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  const colorMap: Record<TeacherMode, { skin: string; robe: string; bg: string; glow: string }> = {
    quran:  { skin: "#f4c78a", robe: "#10b981", bg: "#d1fae5", glow: "#10b981" },
    tajweed:{ skin: "#f4c78a", robe: "#d97706", bg: "#fef3c7", glow: "#d97706" },
    hifdh:  { skin: "#f4c78a", robe: "#3b82f6", bg: "#dbeafe", glow: "#3b82f6" },
    arabic: { skin: "#f4c78a", robe: "#7c3aed", bg: "#ede9fe", glow: "#7c3aed" },
    fiqh:   { skin: "#f4c78a", robe: "#0d9488", bg: "#ccfbf1", glow: "#0d9488" },
    tafsir: { skin: "#f4c78a", robe: "#e11d48", bg: "#ffe4e6", glow: "#e11d48" },
  };
  const c = colorMap[mode];

  // Real audio amplitude → mouth opening height (px)
  const mouthRy = Math.round(mouthAmount * 8);  // 0–8px vertical radius
  const mouthRx = 10;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 240, height: 260 }}>
      <motion.div
        animate={{ scale: isSpeaking ? [1, 1.05, 1] : 1, opacity: isSpeaking ? [0.4, 0.7, 0.4] : 0.2 }}
        transition={{ repeat: Infinity, duration: 0.6 }}
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${c.glow}44, transparent 70%)` }}
      />

      <motion.div
        animate={{ y: isSpeaking ? [0, -3, 0] : isThinking ? [0, -2, 0] : 0 }}
        transition={{ repeat: Infinity, duration: isSpeaking ? 0.5 : 2, ease: "easeInOut" }}
      >
        <svg width="200" height="240" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="110" r="90" fill={c.bg} opacity="0.6" />
          <path d="M40 200 Q55 155 100 145 Q145 155 160 200 L170 240 L30 240 Z" fill={c.robe} />
          <path d="M80 148 Q100 160 120 148 L115 175 Q100 168 85 175 Z" fill={c.skin} />
          <rect x="88" y="140" width="24" height="16" rx="4" fill={c.skin} />
          <ellipse cx="100" cy="105" rx="42" ry="46" fill={c.skin} />
          <ellipse cx="100" cy="62" rx="38" ry="12" fill={c.robe} />
          <rect x="62" y="55" width="76" height="12" rx="4" fill={c.robe} />
          <ellipse cx="58" cy="110" rx="7" ry="10" fill={c.skin} />
          <ellipse cx="142" cy="110" rx="7" ry="10" fill={c.skin} />
          <g>
            <ellipse cx="84" cy="105" rx="8" ry={blink ? 1.5 : 9} fill="white" />
            {!blink && <ellipse cx="84" cy="107" rx="5" ry="6" fill="#1a3a1a" />}
            {!blink && <circle cx="86" cy="104" r="2" fill="white" />}
            <ellipse cx="116" cy="105" rx="8" ry={blink ? 1.5 : 9} fill="white" />
            {!blink && <ellipse cx="116" cy="107" rx="5" ry="6" fill="#1a3a1a" />}
            {!blink && <circle cx="118" cy="104" r="2" fill="white" />}
          </g>
          <path d="M75 93 Q84 88 93 93" stroke="#5a3a1a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M107 93 Q116 88 125 93" stroke="#5a3a1a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M97 112 Q100 118 103 112" stroke="#c4965a" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Mouth — driven by real audio amplitude via mouthRy */}
          {mouthRy > 1 ? (
            <ellipse cx="100" cy="130" rx={mouthRx} ry={mouthRy} fill="#8b3a3a" />
          ) : (
            <path
              d={isThinking ? "M90 130 Q100 128 110 130" : "M90 130 Q100 135 110 130"}
              stroke="#b06060" strokeWidth="2" strokeLinecap="round" fill="none"
            />
          )}

          <path d="M72 135 Q80 148 100 150 Q120 148 128 135" stroke="#5a3a1a" strokeWidth="2" fill="none" opacity="0.5" />

          {isThinking && (
            <g>
              <motion.circle cx="85" cy="82" r="3" fill={c.glow} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} />
              <motion.circle cx="100" cy="78" r="3" fill={c.glow} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} />
              <motion.circle cx="115" cy="82" r="3" fill={c.glow} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.6 }} />
            </g>
          )}

          {isSpeaking && (
            <g>
              {[0, 1, 2].map(i => (
                <motion.line key={i}
                  x1={160 + i * 8} y1="100" x2={160 + i * 8} y2="120"
                  stroke={c.glow} strokeWidth="2.5" strokeLinecap="round"
                  animate={{ y1: [100, 95, 100], y2: [120, 125, 120] }}
                  transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </g>
          )}
        </svg>
      </motion.div>
    </div>
  );
}

const SR_CLASS_VT: (new () => any) | null =
  typeof window !== "undefined"
    ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null)
    : null;

const BASE_PATH = ((import.meta.env.VITE_API_BASE_URL as string) || "").replace(/\/$/, "");

export default function VideoTeacher() {
  const { toast } = useToast();
  const [mode, setMode] = useState<TeacherMode>("quran");
  const [lang, setLang] = useState<Language>("en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [mouthAmount, setMouthAmount] = useState(0);
  const [ttsMode, setTtsMode] = useState<"api" | "browser" | "unknown">("unknown");

  const recognitionRef = useRef<any | null>(null);
  const recognizedTextRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Audio / lip-sync refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // ── Cleanup audio on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAudio();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── Stop all audio ────────────────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    if (sourceRef.current) { try { sourceRef.current.stop(); } catch {} sourceRef.current = null; }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setMouthAmount(0);
  }, []);

  // ── Real-time lip sync loop — reads AudioContext AnalyserNode ─────────────
  const startLipSyncLoop = useCallback((analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.fftSize);
    let smoothed = 0;
    const tick = () => {
      analyser.getByteTimeDomainData(dataArray);
      let sumSq = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const n = (dataArray[i] - 128) / 128;
        sumSq += n * n;
      }
      const rms = Math.sqrt(sumSq / dataArray.length);
      // Exponential smoothing to avoid jitter
      smoothed = smoothed * 0.7 + rms * 0.3;
      const amount = Math.min(1, smoothed * 10);
      setMouthAmount(amount);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Primary TTS: fetch audio from API proxy → AudioContext → AnalyserNode ─
  const speakViaAudioContext = useCallback(async (text: string): Promise<boolean> => {
    try {
      const langInfo = LANGS.find(l => l.value === lang);
      const ttsLang = langInfo?.ttsCode ?? "en";
      const snippet = text.replace(/[#*`]/g, "").slice(0, 250);

      const resp = await fetch(
        `${BASE_PATH}/api/tts?text=${encodeURIComponent(snippet)}&lang=${ttsLang}`,
        { signal: AbortSignal.timeout(12_000) }
      );
      if (!resp.ok) return false;

      const arrayBuffer = await resp.arrayBuffer();
      if (arrayBuffer.byteLength < 512) return false;

      // Create or resume AudioContext
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") await ctx.resume();

      // Decode MP3 audio
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

      // Pipeline: BufferSource → Analyser → Destination
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      sourceRef.current = source;

      setIsSpeaking(true);
      setTtsMode("api");
      startLipSyncLoop(analyser);

      source.onended = () => {
        if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
        setIsSpeaking(false);
        setMouthAmount(0);
        sourceRef.current = null;
      };

      source.start(0);
      return true;
    } catch {
      return false;
    }
  }, [lang, startLipSyncLoop]);

  // ── Fallback TTS: browser SpeechSynthesis + word-boundary lip sync ─────────
  const speakViaBrowser = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const langInfo = LANGS.find(l => l.value === lang);
    utter.lang = langInfo?.ttsCode === "ar" ? "ar-SA" : langInfo?.ttsCode === "so" ? "so-SO" : "en-US";
    utter.rate = 0.88;
    utter.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith(utter.lang.split("-")[0]) && (v.name.includes("Google") || v.name.includes("Microsoft")))
      ?? voices.find(v => v.lang.startsWith(utter.lang.split("-")[0]))
      ?? voices[0];
    if (preferred) utter.voice = preferred;

    // Word-boundary events drive lip sync (better than timer)
    utter.onboundary = (e) => {
      if (e.name === "word") {
        const word = text.slice(e.charIndex, e.charIndex + (e.charLength ?? 4));
        // Approximate mouth opening by word length (longer words = more movement)
        const intensity = Math.min(1, word.length / 8);
        setMouthAmount(intensity);
        setTimeout(() => setMouthAmount(0), Math.min(e.charLength ?? 150, 200));
      }
    };

    utter.onstart = () => { setIsSpeaking(true); setTtsMode("browser"); };
    utter.onend = () => { setIsSpeaking(false); setMouthAmount(0); };
    utter.onerror = () => { setIsSpeaking(false); setMouthAmount(0); };
    window.speechSynthesis.speak(utter);
  }, [lang]);

  // ── Main speak dispatcher ─────────────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    if (!ttsEnabled) return;
    stopAudio();
    const usedAudioContext = await speakViaAudioContext(text);
    if (!usedAudioContext) {
      speakViaBrowser(text);
    }
  }, [ttsEnabled, stopAudio, speakViaAudioContext, speakViaBrowser]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;
    stopAudio();
    setInput("");
    setMessages(m => [...m, { role: "user", content }]);
    setIsStreaming(true);

    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const r = await authFetch("/api/video-teacher/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({ text: content, mode, language: lang, history }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      setMessages(m => [...m, { role: "assistant", content: "" }]);
      const reader = r.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const d = JSON.parse(line.slice(6));
            if (d.done) break;
            if (d.content) {
              fullText += d.content;
              setMessages(m => {
                const copy = [...m];
                copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + d.content };
                return copy;
              });
            }
          } catch {}
        }
      }
      if (fullText) speak(fullText);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast({ title: "Error", description: "Failed to get response from AI teacher.", variant: "destructive" });
      }
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, messages, mode, lang, speak, stopAudio, toast]);

  const sendVoiceText = useCallback(async (spokenText: string) => {
    if (!spokenText.trim()) return;
    setIsProcessing(false);
    sendMessage(spokenText);
  }, [sendMessage]);

  const startRecording = async () => {
    if (isRecording || isProcessing) return;
    stopAudio();

    if (SR_CLASS_VT) {
      recognizedTextRef.current = "";
      const recognition = new SR_CLASS_VT();
      const langCode = LANGS.find(l => l.value === lang)?.ttsCode === "ar" ? "ar-SA" : lang === "so" ? "so-SO" : "en-US";
      recognition.lang = langCode;
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) recognizedTextRef.current += e.results[i][0].transcript + " ";
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        const recognized = recognizedTextRef.current.trim();
        if (recognized) {
          sendVoiceText(recognized);
        } else {
          setIsProcessing(false);
          toast({ title: "No speech detected", description: "Hold the button while speaking. Try again or use the text box.", variant: "destructive" });
        }
      };

      recognition.onerror = (e: any) => {
        const code: string = e.error || "";
        setIsRecording(false);
        setIsProcessing(false);
        const msg = code === "not-allowed" ? "Microphone blocked — allow access in browser settings."
          : code === "network" ? "Speech recognition needs an internet connection."
          : code === "no-speech" ? "No speech detected. Try speaking louder."
          : code !== "aborted" ? `Speech recognition error: ${code}` : "";
        if (msg) toast({ title: "Voice error", description: msg, variant: "destructive" });
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
      } catch {
        toast({ title: "Microphone Error", description: "Could not start voice recognition. Use the text box.", variant: "destructive" });
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find(t => MediaRecorder.isTypeSupported(t)) || "";
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        chunksRef.current = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.start(100);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (err: any) {
        const msg = err?.name === "NotAllowedError" ? "Microphone access denied. Allow microphone in browser settings."
          : err?.name === "NotFoundError" ? "No microphone found on this device."
          : "Could not access microphone.";
        toast({ title: "Microphone Error", description: msg, variant: "destructive" });
      }
    }
  };

  const stopRecording = useCallback(async () => {
    if (!isRecording) return;

    if (SR_CLASS_VT && recognitionRef.current) {
      setIsProcessing(true);
      recognitionRef.current.stop();
      recognitionRef.current = null;
      return;
    }

    if (!mediaRecorderRef.current) return;
    setIsRecording(false);
    setIsProcessing(true);
    const recorder = mediaRecorderRef.current;
    await new Promise<void>(r => { recorder.onstop = () => r(); recorder.stop(); recorder.stream.getTracks().forEach(t => t.stop()); });
    mediaRecorderRef.current = null;
    if (chunksRef.current.length === 0) { setIsProcessing(false); return; }

    const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });
    const toBase64 = (b: Blob): Promise<string> => new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res((reader.result as string).split(",")[1]);
      reader.onerror = rej;
      reader.readAsDataURL(b);
    });

    try {
      const audioBase64 = await toBase64(blob);
      const r = await authFetch("/api/voice-teacher/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, audioMimeType: blob.type, history: messages.slice(-6) }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const reader2 = r.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let fullResponse = "";
      while (true) {
        const { done, value } = await reader2.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const d = JSON.parse(line.slice(6));
            if (d.transcribedText !== undefined && d.transcribedText) {
              setMessages(m => [...m, { role: "user", content: d.transcribedText }]);
            }
            if (d.done) break;
            if (d.content) {
              fullResponse += d.content;
              setMessages(m => {
                const last = m[m.length - 1];
                if (last?.role === "assistant") {
                  const copy = [...m];
                  copy[copy.length - 1] = { ...last, content: last.content + d.content };
                  return copy;
                }
                return [...m, { role: "assistant", content: d.content }];
              });
            }
          } catch {}
        }
      }
      if (fullResponse) speak(fullResponse);
    } catch {
      toast({ title: "Error", description: "Could not process audio. Please try the text box.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [isRecording, messages, speak, toast, sendVoiceText]);

  const currentMode = TEACHER_MODES.find(m => m.value === mode)!;
  const colorClass: Record<string, string> = {
    emerald: "bg-blue-700", amber: "bg-amber-600", blue: "bg-blue-600",
    purple: "bg-purple-600", teal: "bg-teal-600", rose: "bg-rose-600",
  };
  const bgClass: Record<string, string> = {
    emerald: "from-blue-50 to-white", amber: "from-amber-50 to-white", blue: "from-blue-50 to-white",
    purple: "from-purple-50 to-white", teal: "from-teal-50 to-white", rose: "from-rose-50 to-white",
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <Video className="h-6 w-6 text-blue-700" />
              AI Video Teacher
              <Badge className="bg-blue-700 text-white border-0">LIVE</Badge>
              {ttsMode !== "unknown" && (
                <Badge variant="outline" className="text-xs border-blue-200 text-blue-800">
                  {ttsMode === "api" ? "🔊 Audio-sync" : "🔊 Browser TTS"}
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">AI teacher with real audio-driven lip sync</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={lang} onValueChange={v => setLang(v as Language)}>
              <SelectTrigger className="w-32 h-9 text-sm">
                <Globe className="h-3.5 w-3.5 mr-1" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setTtsEnabled(!ttsEnabled)} title={ttsEnabled ? "Mute" : "Unmute"}>
              {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => { stopAudio(); setMessages([]); }} title="New session">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {TEACHER_MODES.map(m => (
            <button key={m.value} onClick={() => { setMode(m.value); stopAudio(); setMessages([]); }}
              className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 transition-all text-center ${
                mode === m.value ? `border-current bg-white shadow-sm` : "border-transparent hover:border-gray-200 hover:bg-gray-50"
              }`}
              style={{ color: mode === m.value ? `var(--${m.color}-600, #10b981)` : undefined }}>
              <span className="text-xl">{m.emoji}</span>
              <span className="text-[11px] font-semibold leading-tight">{m.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          <div className={`lg:col-span-2 rounded-2xl bg-gradient-to-b ${bgClass[currentMode.color]} border flex flex-col items-center justify-between p-6 gap-4 min-h-[420px]`}>
            <div className="text-center">
              <Badge className={`${colorClass[currentMode.color]} text-white border-0 mb-2`}>
                {currentMode.emoji} {currentMode.label}
              </Badge>
              <p className="text-xs text-muted-foreground">{currentMode.desc}</p>
            </div>

            <AvatarFace isSpeaking={isSpeaking} isThinking={isStreaming} mode={mode} mouthAmount={mouthAmount} />

            <div className="w-full space-y-3">
              {isSpeaking && (
                <div className="flex items-center justify-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <motion.div key={i} className={`w-1 rounded-full ${colorClass[currentMode.color]}`}
                        animate={{ height: [4, 4 + mouthAmount * 16, 4] }}
                        transition={{ duration: 0.15, repeat: Infinity, delay: i * 0.04 }}
                      />
                    ))}
                  </div>
                  <button onClick={stopAudio} className="text-xs underline text-muted-foreground">Stop</button>
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onMouseDown={startRecording}
                  onTouchStart={startRecording}
                  onMouseUp={stopRecording}
                  onTouchEnd={stopRecording}
                  disabled={isProcessing || isStreaming}
                  className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    isRecording ? "bg-red-500 text-white" :
                    isProcessing ? "bg-gray-200 text-gray-400 cursor-not-allowed" :
                    `${colorClass[currentMode.color]} text-white`
                  }`}
                >
                  {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> :
                   isRecording  ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </motion.button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {isRecording ? "🔴 Release to send" : isProcessing ? "Processing…" : "Hold to speak"}
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-3">
            <Card className="flex-1">
              <CardContent className="p-0 flex flex-col h-[380px]">
                <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
                      <span className="text-4xl">{currentMode.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900">{currentMode.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xs">{currentMode.desc}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Ask a question or hold the mic to speak</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {messages.map((m, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs ${
                              m.role === "user" ? `${colorClass[currentMode.color]} text-white` : "bg-gray-100 text-gray-600"
                            }`}>
                              {m.role === "user" ? "U" : currentMode.emoji}
                            </div>
                            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                              m.role === "user"
                                ? `${colorClass[currentMode.color]} text-white`
                                : "bg-white border border-gray-100 shadow-sm"
                            }`}>
                              <p className="whitespace-pre-wrap">{m.content}</p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {isStreaming && (
                        <div className="flex gap-2">
                          <div className="shrink-0 h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">{currentMode.emoji}</div>
                          <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder={`Ask ${currentMode.label}…`}
                rows={2}
                className="resize-none flex-1 text-sm"
                disabled={isStreaming}
              />
              <Button onClick={() => sendMessage(input)} disabled={!input.trim() || isStreaming}
                className={`${colorClass[currentMode.color]} text-white self-end`}>
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
