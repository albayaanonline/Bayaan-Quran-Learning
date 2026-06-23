import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, RotateCcw, BookOpen, Mic2, Star } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "What are the rules of Tajweed?",
  "How do I improve my Quran recitation?",
  "Explain the meaning of Surah Al-Fatiha",
  "What is the importance of Hifdh?",
  "How to make Wudu correctly?",
  "What are the pillars of Islam?",
];

const FALLBACK_RESPONSES: Record<string, string> = {
  default: `Assalamu Alaikum wa Rahmatullahi wa Barakatuh! 🌙

I'm your Al Bayaan AI Learning Assistant. I'm here to help you on your journey of Quranic learning and Islamic knowledge.

**I can help you with:**
- Tajweed rules and pronunciation
- Quran memorization (Hifdh) tips
- Understanding Surah meanings and Tafsir
- Islamic studies (Fiqh, Aqeedah, Seerah)
- Arabic language learning
- Study plans and scheduling

Please ask me anything related to your Islamic education, and I'll do my best to assist you. May Allah bless your learning journey! 🤲`,

  tajweed: `**Tajweed Rules — A Brief Overview:**

Tajweed (تجويد) means "to make beautiful" — it's the set of rules governing proper recitation of the Quran.

**Key rules include:**

1. **Noon Sakinah & Tanween** — 4 rules:
   - Izhar (clear pronunciation)
   - Idgham (merging)
   - Iqlab (conversion)
   - Ikhfa (hiding)

2. **Meem Sakinah** — 3 rules:
   - Ikhfa Shafawi
   - Idgham Shafawi
   - Izhar Shafawi

3. **Madd (elongation)** — Natural Madd (2 counts), Connected Madd (4-5 counts), Separated Madd (4-5 counts)

4. **Qalqalah** — Echo on letters: ق ط ب ج د

5. **Heavy & Light letters** — Tafkheem and Tarqeeq

**Tip:** Practice with a qualified Sheikh and use Al Bayaan's Voice Teacher feature to get instant AI feedback on your recitation! 🎙️`,

  hifdh: `**Tips for Quran Memorization (Hifdh) 📖**

*"And We have certainly made the Quran easy for remembrance, so is there anyone who will remember?"* (54:17)

**Proven Hifdh Techniques:**

1. **Consistency** — Memorize a fixed amount daily (even 1-5 ayahs) rather than large amounts occasionally

2. **Repetition** — Repeat each new ayah 20-30 times before moving on

3. **Connection Method** — Link the end of each ayah to the beginning of the next

4. **Revision Schedule** — Never memorize new material without revising old (1 new page = review 5 old pages)

5. **Morning Sessions** — The mind retains best after Fajr prayer

6. **Understand the meaning** — It helps memory retention significantly

7. **Recite in prayer** — Use what you've memorized in your daily Salah

**Use Al Bayaan's Hifdh Tracker** to set daily goals and track your progress! 🌟`,

  fatiha: `**Surah Al-Fatiha — The Opening (الفاتحة)**

*"It is the greatest Surah in the Quran"* — Prophet Muhammad ﷺ

**Meaning & Tafsir:**

The Surah has 7 ayat and is divided into:

**Praise & Lordship** (Ayat 1-4):
- "In the name of Allah, the Most Gracious, the Most Merciful"
- "All praise is due to Allah, Lord of all the worlds"
- "The Most Gracious, the Most Merciful"  
- "Master of the Day of Judgment"

**Worship & Guidance** (Ayat 5-7):
- "You alone we worship, and You alone we ask for help"
- "Guide us on the Straight Path"
- "The path of those You have blessed — not those who earned anger, nor those who went astray"

**Key Lessons:**
- Begin everything with Allah's name
- True worship belongs to Allah alone
- Ask Allah for guidance daily
- Three types of people: the blessed, those with Allah's anger, the misguided

Al-Fatiha is recited 17 times daily in obligatory prayers! 🤲`,

  wudu: `**How to Perform Wudu (Ablution) 💧**

*"O believers! When you rise for prayer, wash your faces and your hands up to the elbows, wipe your heads, and wash your feet to the ankles."* (5:6)

**Steps of Wudu:**

1. **Intention (Niyyah)** — In your heart, intend to purify yourself

2. **Bismillah** — Say "Bismillah" before starting

3. **Wash hands** — 3 times up to the wrists

4. **Rinse mouth** — 3 times (Madmadah)

5. **Clean nose** — 3 times (Istinshaq/Istinthar)

6. **Wash face** — 3 times from hairline to chin

7. **Wash arms** — Right then left, up to elbows, 3 times

8. **Wipe head** — Once from front to back

9. **Wipe ears** — Inside and outside with wet fingers

10. **Wash feet** — Right then left, up to ankles, 3 times

**Duas after Wudu:**
*"Ashhadu an la ilaha illallah wa ashhadu anna Muhammadan 'abduhu wa rasuluhu"*

**Remember:** Wudu is broken by natural bodily discharges, sleep, and touching private parts.`,

  pillars: `**The Five Pillars of Islam 🕌**

*"Islam is built on five pillars..."* — Prophet Muhammad ﷺ

**1. Shahada — Declaration of Faith**
*"Ash-hadu an la ilaha illallah, wa ash-hadu anna Muhammadan rasul-ullah"*
"I bear witness that there is no god but Allah, and Muhammad is His messenger"

**2. Salah — Prayer 🙏**
- 5 daily prayers: Fajr, Dhuhr, Asr, Maghrib, Isha
- Establishes connection with Allah throughout the day

**3. Zakat — Charity 💰**
- 2.5% of savings given to those in need annually
- Purifies wealth and helps the community

**4. Sawm — Fasting 🌙**
- Fasting during Ramadan (9th month of Islamic calendar)
- Builds self-discipline and God-consciousness (Taqwa)

**5. Hajj — Pilgrimage 🕋**
- Once in a lifetime for those who are able
- Journey to Makkah, performing rites as Ibrahim (AS) did

These pillars form the foundation of a Muslim's life and practice. May Allah help us uphold all five! 🤲`,

  arabic: `**Learning Arabic for Quran 📚**

Arabic is the language of the Quran — understanding it deeply enriches your connection with Allah's words.

**Getting Started:**

**Stage 1 — Arabic Letters:**
- Learn all 28 letters and their forms (beginning, middle, end)
- Practice reading short words

**Stage 2 — Harakat (Vowels):**
- Fatha (ـَ), Kasra (ـِ), Damma (ـُ)
- Sukun, Shadda, Tanween

**Stage 3 — Quranic Vocabulary:**
- 50% of the Quran uses only ~100 root words
- Start with the most repeated words (Allah, Rabb, Raheem, etc.)

**Stage 4 — Basic Grammar:**
- Nouns (Ism), Verbs (Fi'l), Particles (Harf)
- Masculine/Feminine, Singular/Plural/Dual

**Free Resources:**
- Bayyinah TV (Dream course by Ustadh Nouman Ali Khan)
- Arabic Unlocked
- Quran.com for word-by-word translation

**Best Approach:** Study 20-30 minutes daily consistently rather than long irregular sessions! 📖`,
};

function getLocalResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes("tajweed") || lower.includes("recit") || lower.includes("pronunciation")) {
    return FALLBACK_RESPONSES.tajweed;
  }
  if (lower.includes("hifdh") || lower.includes("memoriz") || lower.includes("hifz") || lower.includes("memorise")) {
    return FALLBACK_RESPONSES.hifdh;
  }
  if (lower.includes("fatiha") || lower.includes("fatihah") || lower.includes("opening surah")) {
    return FALLBACK_RESPONSES.fatiha;
  }
  if (lower.includes("wudu") || lower.includes("ablution") || lower.includes("purif")) {
    return FALLBACK_RESPONSES.wudu;
  }
  if (lower.includes("pillar") || lower.includes("shahada") || lower.includes("salah") || lower.includes("zakat") || lower.includes("sawm") || lower.includes("hajj")) {
    return FALLBACK_RESPONSES.pillars;
  }
  if (lower.includes("arabic") || lower.includes("language") || lower.includes("grammar")) {
    return FALLBACK_RESPONSES.arabic;
  }
  return FALLBACK_RESPONSES.default;
}

const BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string) || "").replace(/\/$/, "");

async function fetchAIResponse(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/api/ai-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data.response || getLocalResponse(messages[messages.length - 1]?.content ?? "");
  } catch {
    const lastMsg = messages[messages.length - 1]?.content ?? "";
    return getLocalResponse(lastMsg);
  }
}

const SUGGESTIONS = [
  { icon: BookOpen, label: "Tajweed Rules", prompt: "What are the main rules of Tajweed?" },
  { icon: Mic2, label: "Recitation Tips", prompt: "How do I improve my Quran recitation?" },
  { icon: Star, label: "Hifdh Guide", prompt: "Give me a complete guide for Quran memorization (Hifdh)" },
  { icon: Sparkles, label: "Surah Meaning", prompt: "Explain the meaning of Surah Al-Fatiha" },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
    const response = await fetchAIResponse(history);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  const isEmpty = messages.length === 0;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-6rem)] page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center shadow-sm">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">AI Learning Assistant</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
                Always available · Islamic education focused
              </p>
            </div>
          </div>
          {!isEmpty && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="gap-1.5 text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
              New Chat
            </Button>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto rounded-2xl border bg-muted/20 p-4 space-y-4 mb-4">
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center py-12 px-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-500 dark:shadow-blue-500/30">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">Assalamu Alaikum! 🌙</h2>
              <p className="text-muted-foreground text-sm max-w-sm mb-8 leading-relaxed">
                I'm your personal AI Learning Assistant. Ask me about Tajweed, Hifdh, Quran meanings, Islamic studies, or anything about your learning journey.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.prompt)}
                    className="flex items-center gap-2 p-3 rounded-xl border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left text-sm group"
                  >
                    <s.icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium group-hover:text-primary transition-colors">{s.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card border rounded-bl-sm shadow-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: msg.content
                              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\*(.+?)\*/g, "<em>$1</em>")
                              .replace(/\n\n/g, "</p><p>")
                              .replace(/\n/g, "<br/>")
                              .replace(/^/, "<p>")
                              .replace(/$/, "</p>"),
                          }}
                        />
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-card border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center h-5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 rounded-full bg-blue-400"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="shrink-0">
          <div className="flex gap-2 items-end p-3 rounded-2xl border bg-card shadow-sm">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Tajweed, Hifdh, Quran meanings, Islamic studies..."
              className="flex-1 resize-none border-0 focus-visible:ring-0 shadow-none min-h-[44px] max-h-32 bg-transparent text-sm"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              size="icon"
              className="h-9 w-9 rounded-xl shrink-0 bg-blue-700 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            AI responses are for educational purposes. Always verify Islamic rulings with qualified scholars.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
