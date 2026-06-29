import { useState, useEffect, useRef } from "react";
import { authFetch } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Brain, CheckCircle2, RotateCcw, BookOpen, Calendar, Trash2, Star, Flame, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useListSurahs } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";

interface HifdhEntry {
  id: number;
  surahId: number;
  surahName: string;
  ayahStart: number;
  ayahEnd: number;
  status: string;
  strengthScore: number;
  lastRevised: string | null;
  nextRevision: string | null;
  revisionCount: number;
}

interface HifdhPlan {
  due: HifdhEntry[];
  upcoming: HifdhEntry[];
  stats: { totalSurahs: number; memorized: number; reviewing: number; learning: number; dueToday: number };
}

const STATUS_COLORS: Record<string, string> = {
  memorized: "bg-blue-100 text-blue-900 border-blue-200",
  reviewing: "bg-amber-100 text-amber-800 border-amber-200",
  learning: "bg-blue-100 text-blue-800 border-blue-200",
};

const STATUS_LABELS: Record<string, string> = {
  memorized: "Memorized ✓",
  reviewing: "Reviewing",
  learning: "Learning",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Not set";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1 text-sm">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold font-serif text-slate-900 mt-6 mb-3">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-bold text-blue-950 mt-5 mb-2 flex items-center gap-2"><Brain className="h-4 w-4 text-blue-700 shrink-0" />{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold text-blue-900 mt-4 mb-2">{line.slice(4)}</h3>;
        if (line.startsWith("**") && line.endsWith("**") && line.length > 4) return <p key={i} className="font-semibold text-blue-950 mt-3">{line.slice(2, -2)}</p>;
        if (line.startsWith("- ")) return (
          <div key={i} className="flex gap-2 my-0.5">
            <span className="text-blue-700 mt-0.5 shrink-0">•</span>
            <span className="text-foreground">{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</span>
          </div>
        );
        if (/^\d+\./.test(line)) return (
          <div key={i} className="flex gap-2 my-0.5">
            <span className="text-blue-700 font-medium shrink-0">{line.split(".")[0]}.</span>
            <span className="text-foreground">{line.replace(/^\d+\.\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}</span>
          </div>
        );
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i} className="text-foreground my-0.5">{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
      })}
    </div>
  );
}

export default function Hifdh() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { data: surahs } = useListSurahs();
  const [entries, setEntries] = useState<HifdhEntry[]>([]);
  const [plan, setPlan] = useState<HifdhPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedSurahId, setSelectedSurahId] = useState<string>("");
  const [revising, setRevising] = useState<number | null>(null);

  // AI Coach state
  const [aiPlan, setAiPlan] = useState("");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
  }, [aiPlan]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesRes, planRes] = await Promise.all([
        authFetch("/api/hifdh", { }),
        authFetch("/api/hifdh/plan", { }),
      ]);
      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (planRes.ok) setPlan(await planRes.json());
    } catch {
      toast({ title: t("gen.error"), description: t("hifdh.errorLoad"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateAiPlan = async () => {
    setIsGeneratingPlan(true);
    setAiPlan("");
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const r = await authFetch("/api/hifdh/ai-coach", { signal: ctrl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
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
            if (d.error) throw new Error(d.error);
            if (d.content) setAiPlan(prev => prev + d.content);
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast({ title: "Error", description: "Could not generate plan. Try again.", variant: "destructive" });
      }
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const addSurah = async () => {
    if (!selectedSurahId) return;
    const surahId = parseInt(selectedSurahId);
    const surah = surahs?.find((s) => s.number === surahId);
    try {
      const res = await authFetch("/api/hifdh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surahId, ayahStart: 1, ayahEnd: surah?.ayahCount ?? 1 }),
      });
      if (res.status === 409) { toast({ title: t("hifdh.alreadyAdded"), description: t("hifdh.alreadyAddedSub") }); return; }
      if (!res.ok) throw new Error();
      toast({ title: t("hifdh.added"), description: `${surah?.name ?? "Surah"} added to your Hifdh plan.` });
      setAddOpen(false);
      setSelectedSurahId("");
      loadData();
    } catch {
      toast({ title: t("gen.error"), description: t("hifdh.errorAdd"), variant: "destructive" });
    }
  };

  const revise = async (id: number, quality: string) => {
    setRevising(id);
    try {
      const res = await authFetch(`/api/hifdh/${id}/revise`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
      });
      if (res.ok) {
        toast({ title: t("hifdh.revisionRecorded"), description: t("hifdh.strengthUpdated") });
        loadData();
      }
    } catch {
      toast({ title: t("gen.error"), description: t("hifdh.errorRevise"), variant: "destructive" });
    } finally {
      setRevising(null);
    }
  };

  const remove = async (id: number) => {
    try {
      await authFetch(`/api/hifdh/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast({ title: t("gen.removed") });
    } catch {
      toast({ title: t("gen.error"), description: "Could not remove entry. Please try again.", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-blue-50">{t("nav.hifdh")}</h1>
            <p className="text-muted-foreground mt-1">{t("hifdh.subtitle")}</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-700 hover:bg-blue-700 text-white gap-2">
                <Plus className="h-4 w-4" /> {t("hifdh.addSurah")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("hifdh.addDialog")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Select value={selectedSurahId} onValueChange={setSelectedSurahId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("hifdh.selectSurah")} />
                  </SelectTrigger>
                  <SelectContent>
                    {surahs?.map((s) => (
                      <SelectItem key={s.number} value={String(s.number)}>
                        {s.number}. {s.name} — {s.nameArabic} ({s.ayahCount} ayahs)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addSurah} disabled={!selectedSurahId} className="w-full bg-blue-700 hover:bg-blue-700 text-white">
                  {t("hifdh.addToPlan")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : !plan ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
            {t("hifdh.noplan") || "Add your first surah to begin tracking your Hifdh."}
          </div>
        ) : plan && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("hifdh.totalSurahs"), value: plan.stats.totalSurahs, icon: BookOpen, color: "text-blue-700", bg: "bg-blue-50 dark:bg-blue-950" },
              { label: t("hifdh.memorized"), value: plan.stats.memorized, icon: CheckCircle2, color: "text-blue-700", bg: "bg-blue-50 dark:bg-blue-950" },
              { label: t("hifdh.reviewing"), value: plan.stats.reviewing, icon: RotateCcw, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
              { label: t("hifdh.dueToday"), value: plan.stats.dueToday, icon: Flame, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card>
                  <CardContent className="p-5 flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-blue-50">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="surahs">
          <TabsList className="border border-blue-100">
            <TabsTrigger value="surahs" className="gap-2"><Brain className="h-3.5 w-3.5" />{t("hifdh.mySurahs")}</TabsTrigger>
            <TabsTrigger value="ai-coach" className="gap-2"><Sparkles className="h-3.5 w-3.5" />{t("hifdh.aiCoach")}</TabsTrigger>
          </TabsList>

          {/* ── My Surahs Tab ── */}
          <TabsContent value="surahs" className="space-y-6 mt-4">
            {/* Due Today */}
            {plan && plan.due.length > 0 && (
              <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-red-800 dark:text-red-300 flex items-center gap-2">
                    <Flame className="h-4 w-4" /> {t("hifdh.dueRevision")} ({plan.due.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.due.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-4 bg-white dark:bg-background rounded-xl p-4 border border-red-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-blue-50">{entry.surahName}</p>
                        <p className="text-xs text-muted-foreground">Ayahs {entry.ayahStart}–{entry.ayahEnd} · {entry.revisionCount} {t("hifdh.revisions")}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={entry.strengthScore} className="h-1.5 flex-1 bg-blue-100" />
                          <span className="text-xs font-medium text-blue-800">{entry.strengthScore}%</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50"
                          onClick={() => revise(entry.id, "good")} disabled={revising === entry.id}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> {t("hifdh.good")}
                        </Button>
                        <Button size="sm" className="bg-blue-700 hover:bg-blue-700 text-white"
                          onClick={() => revise(entry.id, "excellent")} disabled={revising === entry.id}>
                          <Star className="h-3.5 w-3.5 mr-1" /> {t("hifdh.excellent")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* All Surahs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("hifdh.allProgress")}</CardTitle>
                <CardDescription>{t("hifdh.allProgressSub")}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading && <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>}
                {!loading && entries.length === 0 && (
                  <div className="text-center py-12">
                    <Brain className="h-12 w-12 mx-auto text-blue-300 mb-3" />
                    <p className="text-muted-foreground text-sm">{t("hifdh.noSurahs")}</p>
                    <p className="text-muted-foreground text-sm">{t("hifdh.clickAdd")}</p>
                  </div>
                )}
                <div className="space-y-3">
                  {entries.map((entry, i) => (
                    <motion.div key={entry.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-900 text-sm shrink-0">
                        {entry.surahId}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-slate-900 dark:text-blue-50">{entry.surahName}</span>
                          <Badge className={`text-xs border ${STATUS_COLORS[entry.status] ?? ""}`}>{STATUS_LABELS[entry.status] ?? entry.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Ayahs {entry.ayahStart}–{entry.ayahEnd} · {entry.revisionCount} revisions</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Progress value={entry.strengthScore} className="h-1.5 flex-1 bg-blue-100" />
                          <span className="text-xs font-medium text-blue-800 w-8 text-right">{entry.strengthScore}%</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(entry.nextRevision)}</div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => revise(entry.id, "good")} disabled={revising === entry.id}
                          className="text-amber-600 hover:bg-amber-50 h-8 px-2">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => revise(entry.id, "excellent")} disabled={revising === entry.id}
                          className="text-blue-700 hover:bg-blue-50 h-8 px-2">
                          <Star className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(entry.id)}
                          className="text-red-400 hover:bg-red-50 h-8 px-2">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming */}
            {plan && plan.upcoming.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-700" /> {t("hifdh.upcoming")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {plan.upcoming.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between text-sm py-2 border-b border-blue-50 last:border-0">
                        <span className="font-medium text-blue-950 dark:text-blue-100">{entry.surahName}</span>
                        <span className="text-muted-foreground">{formatDate(entry.nextRevision)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── AI Coach Tab ── */}
          <TabsContent value="ai-coach" className="mt-4">
            <Card className="border-blue-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <Sparkles className="h-5 w-5 text-blue-700" /> {t("hifdh.aiCoachTitle")}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {t("hifdh.aiCoachSub")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {aiPlan && (
                      <Button variant="outline" size="sm" onClick={() => setAiPlan("")} className="gap-1.5 border-blue-200 text-blue-800">
                        <Trash2 className="h-3.5 w-3.5" /> {t("hifdh.clear")}
                      </Button>
                    )}
                    <Button
                      onClick={generateAiPlan}
                      disabled={isGeneratingPlan}
                      className="bg-blue-700 hover:bg-blue-700 text-white gap-2"
                    >
                      {isGeneratingPlan
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("hifdh.generating")}</>
                        : <><RefreshCw className="h-4 w-4" />{aiPlan ? t("hifdh.regenerate") : t("hifdh.generateBtn")}</>
                      }
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!aiPlan && !isGeneratingPlan && (
                  <div className="text-center py-16">
                    <div className="h-16 w-16 rounded-2xl bg-blue-100 mx-auto flex items-center justify-center mb-4">
                      <Brain className="h-8 w-8 text-blue-700" />
                    </div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-2">{t("hifdh.getYourPlan")}</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                      {t("hifdh.analyzeDesc")}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground mb-8">
                      {[t("hifdh.feat1"), t("hifdh.feat2"), t("hifdh.feat3"), t("hifdh.feat4")].map(f => (
                        <span key={f} className="bg-blue-50 border border-blue-100 rounded-full px-3 py-1">{f}</span>
                      ))}
                    </div>
                    <Button onClick={generateAiPlan} className="bg-blue-700 hover:bg-blue-700 text-white gap-2 h-11 px-8">
                      <Sparkles className="h-4 w-4" /> {t("hifdh.genCoach")}
                    </Button>
                  </div>
                )}

                {isGeneratingPlan && !aiPlan && (
                  <div className="flex flex-col items-center py-16 gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-blue-700 animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-blue-950">{t("hifdh.analyzing")}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t("hifdh.crafting")}</p>
                    </div>
                  </div>
                )}

                {aiPlan && (
                  <div
                    ref={aiScrollRef}
                    className="max-h-[60vh] overflow-y-auto prose-sm bg-blue-50/50 rounded-xl p-6 border border-blue-100"
                  >
                    <MarkdownRenderer content={aiPlan} />
                    {isGeneratingPlan && (
                      <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-0.5 rounded-sm" />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
