import { useState, useRef, useCallback, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Volume2, VolumeX, Loader2, RefreshCw, BotMessageSquare, User, Waves } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface VoiceMessage {
  role: "user" | "assistant";
  content: string;
  transcribed?: string;
}

export default function VoiceTeacher() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current?.close();
      window.speechSynthesis.cancel();
    };
  }, []);

  const animateAudio = () => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    setAudioLevel(Math.min(100, avg * 2));
    animFrameRef.current = requestAnimationFrame(animateAudio);
  };

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    utter.pitch = 1;
    utter.lang = "en-US";

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === "en-US" && v.name.includes("Google")) || voices[0];
    if (preferred) utter.voice = preferred;

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    synthRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [ttsEnabled]);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const startRecording = async () => {
    if (isRecording || isProcessing) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioCtxRef.current = new AudioContext();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      animateAudio();

      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"].find(t => MediaRecorder.isTypeSupported(t)) || "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      stopSpeaking();
    } catch {
      toast({ title: "Microphone Error", description: "Could not access microphone. Please allow access.", variant: "destructive" });
    }
  };

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    cancelAnimationFrame(animFrameRef.current);
    setAudioLevel(0);
    setIsRecording(false);
    setIsProcessing(true);

    const recorder = mediaRecorderRef.current;

    await new Promise<void>(resolve => {
      recorder.onstop = () => resolve();
      recorder.stop();
      recorder.stream.getTracks().forEach(t => t.stop());
    });

    audioCtxRef.current?.close();
    audioCtxRef.current = null;

    if (chunksRef.current.length === 0) {
      setIsProcessing(false);
      return;
    }

    const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });

    const toBase64 = (b: Blob): Promise<string> => new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res((reader.result as string).split(",")[1]);
      reader.onerror = rej;
      reader.readAsDataURL(b);
    });

    try {
      const audioBase64 = await toBase64(blob);
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));

      const r = await fetch("/api/voice-teacher/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ audioBase64, audioMimeType: blob.type, history }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      let transcribed = "";
      let fullResponse = "";

      const reader2 = r.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

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
            if (d.transcribedText !== undefined) {
              transcribed = d.transcribedText;
              if (transcribed) setMessages(m => [...m, { role: "user", content: transcribed, transcribed }]);
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
      toast({ title: "Error", description: "Failed to process audio. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [isRecording, messages, speak, toast]);

  const reset = () => {
    stopSpeaking();
    setMessages([]);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
              <Mic className="h-6 w-6 text-emerald-600" />
              Voice Quran Teacher
              <Badge className="bg-emerald-600 text-white border-0 text-xs">AI</Badge>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Speak naturally — AI listens, responds, and teaches you</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setTtsEnabled(!ttsEnabled)}
              title={ttsEnabled ? "Mute AI voice" : "Enable AI voice"}>
              {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={reset} title="Clear conversation">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="border-emerald-100">
          <CardContent className="p-0">
            <ScrollArea className="h-[50vh] p-4" ref={scrollRef as any}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Mic className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-emerald-950">Voice Teacher Ready</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">Hold the button below and speak. Ask about Tajweed, recite a verse, or ask any Quran question.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground max-w-xs">
                    <p>💡 "What is Ghunnah?"</p>
                    <p>💡 "How do I memorize faster?"</p>
                    <p>💡 "Recite Bismillah and I'll correct you"</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {messages.map((m, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${
                          m.role === "user" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                          {m.role === "user" ? <User className="h-4 w-4" /> : <BotMessageSquare className="h-4 w-4" />}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                          m.role === "user"
                            ? "bg-emerald-600 text-white rounded-tr-sm"
                            : "bg-white dark:bg-emerald-950 border border-emerald-100 rounded-tl-sm shadow-sm"
                        }`}>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isProcessing && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                      <div className="bg-white border border-emerald-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-muted-foreground">
                        Transcribing &amp; thinking…
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-4">
          {isRecording && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 text-sm text-emerald-700">
              <Waves className="h-4 w-4" />
              <div className="flex gap-0.5">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div key={i}
                    animate={{ scaleY: [1, 1 + (audioLevel / 100) * 3, 1] }}
                    transition={{ duration: 0.3, delay: i * 0.02, repeat: Infinity }}
                    className="w-1 bg-emerald-500 rounded-full"
                    style={{ height: 4 }}
                  />
                ))}
              </div>
              <span className="font-medium">Listening…</span>
            </motion.div>
          )}
          {isSpeaking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-blue-600">
              <Volume2 className="h-4 w-4 animate-pulse" />
              <span>AI is speaking…</span>
              <button onClick={stopSpeaking} className="text-xs underline">Stop</button>
            </motion.div>
          )}

          <div className="flex items-center gap-4">
            {!isRecording ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onMouseDown={startRecording}
                onTouchStart={startRecording}
                onMouseUp={stopRecording}
                onTouchEnd={stopRecording}
                disabled={isProcessing}
                className={`h-20 w-20 rounded-full flex items-center justify-center shadow-lg transition-all
                  ${isProcessing
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95"
                  }`}
              >
                {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Mic className="h-8 w-8" />}
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={stopRecording}
                className="h-20 w-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg cursor-pointer"
              >
                <MicOff className="h-8 w-8" />
              </motion.button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isRecording ? "Release to send" : isProcessing ? "Processing…" : "Hold to speak"}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
