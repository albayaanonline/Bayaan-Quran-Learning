import { useState, useRef, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Plus, Trash2, BotMessageSquare, User, Loader2, BookMarked, ChevronRight, AlertCircle, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface Message {
  role: string;
  content: string;
}

interface WeakArea {
  rule: string;
  missedCount: number;
  percentage: number;
}

interface WeakAreasData {
  avgScore: number;
  totalRecordings: number;
  weakAreas: WeakArea[];
  frequentWordErrors: string[];
  message: string;
}

const TAJWEED_RULES = [
  { name: "Ghunnah", ar: "غُنَّة", desc: "Nasalization for 2 counts on nun/meem with shaddah", examples: ["إنَّ", "ثُمَّ"] },
  { name: "Ikhfa", ar: "إخفاء", desc: "Partial hidden pronunciation before 15 letters", examples: ["مَنْ كَانَ", "أَنْتُمْ"] },
  { name: "Idgham", ar: "إدغام", desc: "Merging nun sakinah into following letter", examples: ["مَنْ يَقُول", "مِنْ رَّبِّهِم"] },
  { name: "Iqlab", ar: "إقلاب", desc: "Converting nun sakinah to meem before baa", examples: ["مِنْ بَعْدِ", "أَنْبِئْهُم"] },
  { name: "Izhar", ar: "إظهار", desc: "Clear pronunciation before throat letters (ء ه ع ح غ خ)", examples: ["مِنْ عِلْمٍ", "مَنْ آمَنَ"] },
  { name: "Qalqalah", ar: "قَلْقَلَة", desc: "Echo/bounce on letters ق ط ب ج د when sukoon", examples: ["يَقْطَع", "اقْرَأْ"] },
  { name: "Madd Tabi'i", ar: "مَدّ طَبِيعِي", desc: "Natural elongation — 2 counts for ا و ي", examples: ["قَالَ", "يَقُول"] },
  { name: "Madd Muttasil", ar: "مَدّ مُتَّصِل", desc: "Joined elongation — hamzah same word, 4-5 counts", examples: ["جَاءَ", "السَّمَاءِ"] },
  { name: "Madd Munfasil", ar: "مَدّ مُنفَصِل", desc: "Separated elongation — hamzah next word, 2-5 counts", examples: ["إِنَّا أَعْطَيْنَاكَ"] },
  { name: "Tafkhim", ar: "تَفْخِيم", desc: "Heavy/full-mouth pronunciation (خ ص ض ط ظ غ ق ر)", examples: ["قَالَ", "الطُّور"] },
  { name: "Tarqiq", ar: "تَرْقِيق", desc: "Light/thin pronunciation (most letters)", examples: ["بِسْمِ", "رَبِّ"] },
  { name: "Waqf", ar: "وَقف", desc: "Rules for stopping/pausing at end of verse", examples: ["pause marks: م ج ﻻ ط"] },
];

const WEAKNESS_COLORS = ["bg-red-100 text-red-700 border-red-200", "bg-amber-100 text-amber-700 border-amber-200", "bg-orange-100 text-orange-700 border-orange-200"];

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${
        isUser ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-700"}`}>
        {isUser ? <User className="h-4 w-4" /> : <BookMarked className="h-4 w-4" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-emerald-600 text-white rounded-tr-sm"
          : "bg-white dark:bg-slate-900 border border-amber-100 text-foreground rounded-tl-sm shadow-sm"
      }`}>
        <p className="whitespace-pre-wrap">{msg.content}</p>
      </div>
    </motion.div>
  );
}

function WeaknessPanel({ onPracticeRule }: { onPracticeRule: (rule: string) => void }) {
  const { t } = useI18n();
  const [data, setData] = useState<WeakAreasData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/weak-areas", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-2 p-3">
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );

  if (!data || data.totalRecordings === 0) return (
    <div className="px-3 pb-3">
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 rounded-lg p-3">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
        <span>{t("tajweed.noRecs")}</span>
      </div>
    </div>
  );

  return (
    <div className="px-3 pb-3 space-y-2">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{data.totalRecordings} {t("tajweed.analyzed")}</span>
        <span className="font-semibold text-emerald-700">{t("tajweed.avg")} {data.avgScore}%</span>
      </div>
      {data.weakAreas.length === 0 ? (
        <div className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2.5 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" /> {t("tajweed.noIssues")}
        </div>
      ) : (
        <div className="space-y-1.5">
          {data.weakAreas.slice(0, 3).map((area, i) => (
            <div key={area.rule} className="rounded-lg border bg-white overflow-hidden">
              <div className="flex items-center justify-between px-2.5 py-2 gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className={`text-[9px] px-1 py-0 ${WEAKNESS_COLORS[i]}`}>
                      #{i + 1}
                    </Badge>
                    <span className="text-xs font-medium text-foreground truncate">{area.rule}</span>
                  </div>
                  <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${area.percentage}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t("tajweed.missed")} {area.percentage}{t("tajweed.missedPct")}</p>
                </div>
                <button
                  onClick={() => onPracticeRule(area.rule)}
                  className="shrink-0 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded-md font-medium transition-colors whitespace-nowrap"
                >
                  {t("tajweed.practice")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {data.frequentWordErrors.length > 0 && (
        <div className="mt-1">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1">{t("tajweed.wordErrors")}</p>
          <div className="flex flex-wrap gap-1">
            {data.frequentWordErrors.map(w => (
              <span key={w} className="text-[11px] bg-red-50 text-red-700 border border-red-100 rounded px-1.5 py-0.5 font-arabic">{w}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TajweedTeacher() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [convId, setConvId] = useState<number | null>(null);
  const [selectedRule, setSelectedRule] = useState<typeof TAJWEED_RULES[0] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const createConversation = async (): Promise<number> => {
    const r = await fetch("/api/teacher/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: "Tajweed Session" }),
    });
    const d = await r.json();
    return d.id;
  };

  const send = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;
    setInput("");
    setMessages(m => [...m, { role: "user", content }]);
    setIsStreaming(true);

    try {
      let id = convId;
      if (!id) {
        id = await createConversation();
        setConvId(id);
      }

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const r = await fetch(`/api/teacher/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: ctrl.signal,
        body: JSON.stringify({ content, mode: "tajweed", language: "en" }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      setMessages(m => [...m, { role: "assistant", content: "" }]);
      const reader = r.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

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
            if (d.content) setMessages(m => {
              const copy = [...m];
              copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + d.content };
              return copy;
            });
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast({ title: t("general.error"), description: t("general.retry"), variant: "destructive" });
        setMessages(m => m.slice(0, -1));
      }
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, convId, toast, t]);

  const askAboutRule = (rule: typeof TAJWEED_RULES[0]) => {
    setSelectedRule(rule);
    send(`Please explain the ${rule.name} (${rule.ar}) rule in detail with Quranic examples, when it applies, and how to produce the sound correctly.`);
  };

  const practiceWeakRule = (ruleName: string) => {
    send(`I've been struggling with the ${ruleName} rule. Can you give me targeted exercises and tips specifically to improve my ${ruleName}? Include common mistakes students make and how to fix them.`);
  };

  const startNew = () => {
    setMessages([]);
    setConvId(null);
    setSelectedRule(null);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
              <BookMarked className="h-6 w-6 text-amber-600" />
              {t("tajweed.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t("tajweed.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={startNew} className="gap-2">
            <Plus className="h-4 w-4" /> {t("tajweed.newSession")}
          </Button>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left Sidebar */}
          <div className="hidden lg:flex flex-col w-64 shrink-0 gap-3 overflow-y-auto">
            {/* Tajweed Rules */}
            <Card className="border-amber-100 shrink-0">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-amber-800">{t("tajweed.rulesTitle")}</CardTitle>
                <p className="text-xs text-muted-foreground">{t("tajweed.rulesHint")}</p>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="space-y-0.5">
                  {TAJWEED_RULES.map(rule => (
                    <button key={rule.name} onClick={() => askAboutRule(rule)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between group
                        ${selectedRule?.name === rule.name ? "bg-amber-100 text-amber-900" : "hover:bg-amber-50 text-foreground"}`}>
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-xs text-muted-foreground font-arabic">{rule.ar}</div>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* My Weaknesses */}
            <Card className="border-red-100">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {t("tajweed.weakTitle")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{t("tajweed.weakHint")}</p>
              </CardHeader>
              <WeaknessPanel onPracticeRule={practiceWeakRule} />
            </Card>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col min-h-0 border-amber-100">
              <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-8">
                    <div className="h-16 w-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <BookMarked className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-emerald-950">{t("tajweed.ready")}</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{t("tajweed.readyHint")}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
                    </AnimatePresence>
                    {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                        <div className="bg-white border border-amber-100 rounded-2xl rounded-tl-sm px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <div className="border-t border-amber-100 p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder={t("tajweed.inputPh")}
                    className="min-h-[44px] max-h-32 resize-none border-amber-200 focus-visible:ring-amber-500"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  />
                  <Button onClick={() => send(input)} disabled={isStreaming || !input.trim()}
                    className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
                    {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
