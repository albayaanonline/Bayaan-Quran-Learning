import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Sparkles, RotateCcw } from "lucide-react";

const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string) || "").replace(/\/$/, "");

const WELCOME = `Assalamu Alaikum 👋

I am your **AI Learning Assistant**.

How can I help you today?`;

const QUICK_SUGGESTIONS = [
  "How do I learn Tajweed?",
  "Tips for Quran memorization",
  "What are the 5 pillars of Islam?",
  "How to perform Wudu correctly?",
  "Explain Surah Al-Fatiha",
  "How to learn Arabic fast?",
];

interface Message {
  role: "assistant" | "user";
  content: string;
  loading?: boolean;
}

function formatMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    const isBlank = line.trim() === "";
    return (
      <span key={i}>
        {isBlank ? (
          <br />
        ) : (
          <span dangerouslySetInnerHTML={{ __html: bold }} />
        )}
        {!isBlank && i < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default function AILearningAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  const [pulse, setPulse] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem("ab_ai_seen");
    if (!alreadySeen) {
      const t1 = setTimeout(() => setTooltip(true), 2500);
      const t2 = setTimeout(() => {
        setTooltip(false);
        setTooltipDismissed(true);
      }, 7500);
      sessionStorage.setItem("ab_ai_seen", "1");
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setTooltipDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (open) return;
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
    }, 5000);
    return () => clearInterval(interval);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, messages]);

  const dismiss = useCallback(() => {
    setTooltip(false);
    setTooltipDismissed(true);
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: trimmed },
          ],
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response ?? "Sorry, I couldn't answer that right now. Please try again." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Please check your connection and try again. 🤲",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const reset = () => {
    setMessages([{ role: "assistant", content: WELCOME }]);
    setInput("");
  };

  return (
    <>
      {/* ── Floating Button + Tooltip ────────────────────────────── */}
      <div className="fixed bottom-[5.5rem] right-6 z-50 flex flex-col items-end gap-2">
        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && !open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.92 }}
              transition={{ duration: 0.22 }}
              className="relative flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-xs font-medium px-3 py-2 rounded-2xl shadow-2xl max-w-[200px] whitespace-nowrap"
            >
              <Sparkles className="w-3 h-3 text-blue-300 shrink-0" />
              <span>Need help? Ask the AI Assistant.</span>
              <button
                onClick={dismiss}
                className="ml-1 text-white/40 hover:text-white/80 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
              {/* Arrow */}
              <div className="absolute -bottom-1.5 right-5 w-3 h-3 rotate-45 bg-white/10 border-r border-b border-white/20" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Button */}
        <motion.button
          onClick={() => { setOpen(true); setTooltip(false); setTooltipDismissed(true); }}
          aria-label="Open AI Learning Assistant"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.6 }}
          className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl overflow-visible"
          style={{
            background: "linear-gradient(135deg, #2563eb 0%, #1e40af 50%, #1d4ed8 100%)",
            boxShadow: "0 8px 32px rgba(37,99,235,0.5), 0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {/* Glassmorphism ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          />

          {/* Pulse ring */}
          <AnimatePresence>
            {pulse && (
              <motion.div
                key="pulse"
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 1.9, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className="absolute inset-0 rounded-full"
                style={{ background: "rgba(37,99,235,0.4)" }}
              />
            )}
          </AnimatePresence>

          {/* AI Icon */}
          <AIIcon />

          {/* Online indicator */}
          <span
            className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2"
            style={{ backgroundColor: "#4ade80", borderColor: "#1e40af" }}
          />
        </motion.button>
      </div>

      {/* ── Chat Panel ───────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-1.5rem)] flex flex-col rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
            style={{
              background: "linear-gradient(180deg, #0d1b3e 0%, #080f24 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              height: "min(540px, calc(100vh - 7rem))",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 shrink-0"
              style={{
                background: "linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 100%)",
                borderBottom: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 shrink-0">
                <AIIcon small />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-none">AI Learning Assistant</p>
                <p className="text-blue-200/70 text-xs mt-0.5">Al Bayaan AI Academy</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={reset}
                  aria-label="Reset conversation"
                  className="p-1.5 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/10 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="p-1.5 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/30 shrink-0 mt-0.5">
                      <AIIcon tiny />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed max-w-[82%] ${
                      msg.role === "user"
                        ? "text-white rounded-tr-sm"
                        : "text-white/90 rounded-tl-sm"
                    }`}
                    style={
                      msg.role === "user"
                        ? {
                            background: "linear-gradient(135deg, #2563eb, #1e40af)",
                            boxShadow: "0 2px 12px rgba(37,99,235,0.3)",
                          }
                        : {
                            background: "rgba(255,255,255,0.07)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }
                    }
                  >
                    {formatMarkdown(msg.content)}
                  </div>
                </div>
              ))}

              {/* Loading dots */}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/30 shrink-0 mt-0.5">
                    <AIIcon tiny />
                  </div>
                  <div
                    className="rounded-2xl rounded-tl-sm px-4 py-3"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Dots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length <= 1 && !loading && (
              <div className="px-4 pb-2 shrink-0">
                <p className="text-white/30 text-[10px] font-medium uppercase tracking-widest mb-2">Quick questions</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SUGGESTIONS.slice(0, 4).map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-[10.5px] px-2.5 py-1 rounded-full border transition-all whitespace-nowrap"
                      style={{
                        background: "rgba(37,99,235,0.12)",
                        borderColor: "rgba(37,99,235,0.35)",
                        color: "rgba(147,197,253,0.9)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.25)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(37,99,235,0.12)";
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div
              className="px-3 pb-3 pt-2 shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="flex items-end gap-2 rounded-xl px-3 py-2"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask me anything about Islam..."
                  disabled={loading}
                  className="flex-1 bg-transparent text-white text-xs placeholder:text-white/25 resize-none outline-none leading-relaxed py-0.5"
                  style={{ maxHeight: "80px", overflowY: "auto" }}
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  aria-label="Send"
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-all shrink-0 mb-0.5 disabled:opacity-30"
                  style={{
                    background: input.trim() && !loading
                      ? "linear-gradient(135deg, #2563eb, #1e40af)"
                      : "rgba(255,255,255,0.1)",
                  }}
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <p className="text-center text-white/15 text-[9px] mt-1.5">Powered by Al Bayaan AI · bayaan.online</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Dots() {
  return (
    <div className="flex gap-1 items-center h-4">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-1.5 h-1.5 rounded-full bg-blue-400/60"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function AIIcon({ small = false, tiny = false }: { small?: boolean; tiny?: boolean }) {
  const size = tiny ? "w-3.5 h-3.5" : small ? "w-5 h-5" : "w-6 h-6";
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${size} shrink-0`} xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6" width="18" height="13" rx="3" stroke="white" strokeWidth="1.5" fill="none" opacity="0.9" />
      <circle cx="8.5" cy="12.5" r="1.5" fill="white" opacity="0.9" />
      <circle cx="15.5" cy="12.5" r="1.5" fill="white" opacity="0.9" />
      <path d="M8 6V4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <path d="M16 6V4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <path d="M12 6V3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="2.5" r="1" fill="white" />
      <path d="M9.5 15.5 Q12 17 14.5 15.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8" />
    </svg>
  );
}
