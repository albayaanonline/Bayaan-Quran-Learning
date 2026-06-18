import { useState, useRef, useCallback, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Volume2, VolumeX, Loader2, RefreshCw, BotMessageSquare, User, Send, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface VoiceMessage {
  role: "user" | "assistant";
  content: string;
}

type VoiceLang = "en-US" | "ar-SA" | "so-SO";

const LANG_OPTIONS: { value: VoiceLang; label: string }[] = [
  { value: "en-US", label: "EN" },
  { value: "ar-SA", label: "AR" },
  { value: "so-SO", label: "SO" },
];

const SR_CLASS: (new () => any) | null =
  typeof window !== "undefined"
    ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null)
    : null;

export default function VoiceTeacher() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [voiceLang, setVoiceLang] = useState<VoiceLang>("en-US");
  const [textInput, setTextInput] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const recognitionRef = useRef<any | null>(null);
  const recognizedTextRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasSpeechAPI = !!SR_CLASS;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92;
    utter.pitch = 1;
    utter.lang = voiceLang.startsWith("ar") ? "ar-SA" : "en-US";
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === utter.lang && v.name.toLowerCase().includes("google"))
      || voices.find(v => v.lang.startsWith(utter.lang.split("-")[0]))
      || voices[0];
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => { setIsSpeaking(false); };
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, [ttsEnabled, voiceLang]);

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const sendTextToAI = useCallback(async (userText: string) => {
    if (!userText.trim()) return;
    const trimmed = userText.trim();
    setMessages(m => [...m, { role: "user", content: trimmed }]);
    setIsProcessing(true);
    setStatusMsg("Thinking…");

    const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));

    try {
      const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
      const r = await fetch(`${basePath}/api/voice-teacher/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: trimmed, history }),
      });

      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      let fullResponse = "";
      const reader = r.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      setStatusMsg("Receiving response…");

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

      if (fullResponse) {
        setStatusMsg("");
        speak(fullResponse);
      }
    } catch (err) {
      console.error("Voice AI error:", err);
      toast({ title: "Connection Error", description: "Could not reach AI. Check your internet and try again.", variant: "destructive" });
      setStatusMsg("");
    } finally {
      setIsProcessing(false);
      setStatusMsg("");
    }
  }, [messages, speak, toast]);

  const startRecording = async () => {
    if (isRecording || isProcessing) return;
    stopSpeaking();

    if (hasSpeechAPI) {
      recognizedTextRef.current = "";
      const recognition = new SR_CLASS!();
      recognition.lang = voiceLang;
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            recognizedTextRef.current += e.results[i][0].transcript + " ";
          }
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        const recognized = recognizedTextRef.current.trim();
        if (recognized) {
          sendTextToAI(recognized);
        } else {
          setIsProcessing(false);
          setStatusMsg("");
          toast({
            title: "No speech detected",
            description: "Nothing was heard. Try speaking louder, or use the text box below.",
            variant: "destructive",
          });
        }
      };

      recognition.onerror = (e: any) => {
        const code: string = e.error || "";
        setIsRecording(false);
        setIsProcessing(false);
        setStatusMsg("");
        if (code === "not-allowed" || code === "permission-denied") {
          toast({ title: "Microphone blocked", description: "Allow microphone access in your browser to use voice.", variant: "destructive" });
        } else if (code === "network") {
          toast({ title: "Network error", description: "Speech recognition needs internet. Use the text box below.", variant: "destructive" });
        } else if (code !== "aborted") {
          toast({ title: "Voice error", description: `Recognition failed (${code}). Use the text box below.`, variant: "destructive" });
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
        setStatusMsg("Listening…");
      } catch {
        toast({ title: "Microphone error", description: "Could not start voice recognition. Use the text box.", variant: "destructive" });
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"].find(t => MediaRecorder.isTypeSupported(t)) || "";
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        chunksRef.current = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.start(100);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setStatusMsg("Recording…");
      } catch {
        toast({ title: "Microphone Error", description: "Could not access microphone. Please allow access in browser settings.", variant: "destructive" });
      }
    }
  };

  const stopRecording = useCallback(async () => {
    if (!isRecording) return;

    if (hasSpeechAPI && recognitionRef.current) {
      setIsProcessing(true);
      setStatusMsg("Processing speech…");
      recognitionRef.current.stop();
      recognitionRef.current = null;
      return;
    }

    if (!mediaRecorderRef.current) return;
    setIsRecording(false);
    setIsProcessing(true);
    setStatusMsg("Uploading audio for transcription…");

    const recorder = mediaRecorderRef.current;
    await new Promise<void>(resolve => {
      recorder.onstop = () => resolve();
      recorder.stop();
      recorder.stream.getTracks().forEach(t => t.stop());
    });
    mediaRecorderRef.current = null;

    if (chunksRef.current.length === 0) {
      setIsProcessing(false);
      setStatusMsg("");
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
      setStatusMsg("Transcribing audio…");
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
      const r = await fetch(`${basePath}/api/voice-teacher/message`, {
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
              if (transcribed) {
                setMessages(m => [...m, { role: "user", content: transcribed }]);
                setStatusMsg("Getting AI response…");
              }
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
      toast({ title: "Error", description: "Failed to process audio. Try the text box below.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setStatusMsg("");
    }
  }, [isRecording, hasSpeechAPI, messages, speak, toast]);

  const handleTextSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = textInput.trim();
    if (!t || isProcessing) return;
    setTextInput("");
    sendTextToAI(t);
  };

  const reset = () => {
    stopSpeaking();
    recognitionRef.current?.abort();
    setMessages([]);
    setStatusMsg("");
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
              {hasSpeechAPI
                ? <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-300">Browser Speech ✓</Badge>
                : <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">Whisper Mode</Badge>
              }
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {hasSpeechAPI
                ? "Hold mic button and speak — instant browser recognition, no API key needed"
                : "Hold to record — audio sent to Whisper for transcription"
              }
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex rounded-lg border border-emerald-200 overflow-hidden text-xs">
              {LANG_OPTIONS.map(l => (
                <button
                  key={l.value}
                  onClick={() => setVoiceLang(l.value)}
                  className={`px-2 py-1 font-medium transition-colors ${
                    voiceLang === l.value
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-emerald-700 hover:bg-emerald-50"
                  }`}
                  title={l.value}
                >
                  {l.label}
                </button>
              ))}
            </div>
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
            <ScrollArea className="h-[46vh] p-4" ref={scrollRef as any}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Mic className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-emerald-950">Voice Teacher Ready</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Hold the mic button and speak, or type below. Ask about Tajweed, recite a verse, or ask any Islamic question.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground max-w-xs">
                    <p>💡 "What is Ghunnah?"</p>
                    <p>💡 "How do I improve my Makharij?"</p>
                    <p>💡 "Explain Ikhfa rules"</p>
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
                  {(isProcessing || statusMsg) && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                      <div className="bg-white border border-emerald-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-muted-foreground">
                        {statusMsg || "Processing…"}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-3">
          {isSpeaking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-blue-600">
              <Volume2 className="h-4 w-4 animate-pulse" />
              <span>AI is speaking…</span>
              <button onClick={stopSpeaking} className="text-xs underline">Stop</button>
            </motion.div>
          )}

          {isRecording && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-red-600 font-medium">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="h-3 w-3 rounded-full bg-red-500"
              />
              Listening… ({LANG_OPTIONS.find(l => l.value === voiceLang)?.label})
            </motion.div>
          )}

          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onMouseDown={startRecording}
              onTouchStart={e => { e.preventDefault(); startRecording(); }}
              onMouseUp={stopRecording}
              onTouchEnd={e => { e.preventDefault(); stopRecording(); }}
              disabled={isProcessing}
              className={`h-20 w-20 rounded-full flex items-center justify-center shadow-lg transition-all select-none
                ${isProcessing
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : isRecording
                    ? "bg-red-500 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                }`}
            >
              {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" />
                : isRecording ? <MicOff className="h-8 w-8" />
                : <Mic className="h-8 w-8" />}
            </motion.button>
          </div>
          <p className="text-xs text-muted-foreground">
            {isRecording ? "Release to send" : isProcessing ? statusMsg || "Processing…" : "Hold to speak"}
          </p>

          <form onSubmit={handleTextSend} className="flex gap-2 w-full max-w-lg">
            <Input
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Or type your question here…"
              disabled={isProcessing}
              className="flex-1"
            />
            <Button type="submit" disabled={!textInput.trim() || isProcessing} size="icon"
              className="bg-emerald-600 hover:bg-emerald-700">
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {hasSpeechAPI
              ? "Using browser speech recognition — works instantly, no API key needed"
              : "Voice recognition not available in this browser — type below or use Chrome/Edge"
            }
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
