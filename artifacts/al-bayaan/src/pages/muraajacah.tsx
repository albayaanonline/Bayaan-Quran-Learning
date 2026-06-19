import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RotateCcw, CheckCircle2, XCircle, Clock, BookOpen, Brain,
  Flame, Star, ChevronRight, Loader2, RefreshCw,
  CalendarDays, BarChart3, Award, AlertTriangle, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface RevisionEntry {
  id: number;
  surahId: number;
  surahName: string;
  surahNameAr: string;
  ayahStart: number;
  ayahEnd: number;
  status: string;
  strengthScore: number;
  lastRevised: string | null;
  nextRevision: string | null;
  revisionCount: number;
}

interface RevisionStats {
  totalEntries: number;
  dueToday: number;
  overdueCount: number;
  avgStrength: number;
  totalRevisions: number;
  streakDays: number;
}

const STRENGTH_LABEL = (s: number) => {
  if (s >= 90) return { text: "Excellent", color: "text-emerald-600", bg: "bg-emerald-100" };
  if (s >= 70) return { text: "Good", color: "text-blue-600", bg: "bg-blue-100" };
  if (s >= 50) return { text: "Fair", color: "text-amber-600", bg: "bg-amber-100" };
  return { text: "Weak", color: "text-red-600", bg: "bg-red-100" };
};

function formatDue(dateStr: string | null): { label: string; urgent: boolean } {
  if (!dateStr) return { label: "Not scheduled", urgent: false };
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, urgent: true };
  if (diff === 0) return { label: "Due today", urgent: true };
  if (diff === 1) return { label: "Due tomorrow", urgent: false };
  return { label: `In ${diff} days`, urgent: false };
}

function RevisionCard({
  entry,
  onRevise,
  isRevising,
}: {
  entry: RevisionEntry;
  onRevise: (id: number, quality: number) => void;
  isRevising: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const due = formatDue(entry.nextRevision);
  const strength = STRENGTH_LABEL(entry.strengthScore);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all ${
        due.urgent ? "border-amber-200" : "border-gray-100"
      }`}
    >
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-50 flex flex-col items-center justify-center border border-emerald-100">
          <span className="text-xs font-bold text-emerald-700">{entry.surahId}</span>
          <BookOpen className="h-3 w-3 text-emerald-500 mt-0.5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-emerald-950 truncate">{entry.surahName}</span>
            <span className="text-sm text-emerald-700 font-arabic">{entry.surahNameAr}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Ayahs {entry.ayahStart}–{entry.ayahEnd}</span>
            <span>·</span>
            <span>{entry.revisionCount} revision{entry.revisionCount !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <Badge
            variant="outline"
            className={`text-xs ${due.urgent ? "border-amber-300 text-amber-700 bg-amber-50" : "border-gray-200 text-gray-600"}`}
          >
            {due.urgent && <AlertTriangle className="h-3 w-3 mr-1" />}
            {due.label}
          </Badge>
          <div className="flex items-center gap-1">
            <span className={`text-xs font-medium ${strength.color}`}>{strength.text}</span>
            <span className="text-xs text-muted-foreground">({entry.strengthScore}%)</span>
          </div>
        </div>

        <ChevronRight
          className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 border-t border-gray-50">
              <div className="pt-3 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Memory strength</span>
                  <span className="text-xs font-medium">{entry.strengthScore}%</span>
                </div>
                <Progress value={entry.strengthScore} className="h-1.5" />
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                Rate your recitation quality to update your spaced-repetition schedule:
              </p>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-red-200 text-red-700 hover:bg-red-50"
                  disabled={isRevising}
                  onClick={() => onRevise(entry.id, 1)}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Forgot
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                  disabled={isRevising}
                  onClick={() => onRevise(entry.id, 3)}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Partial
                </Button>
                <Button
                  size="sm"
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isRevising}
                  onClick={() => onRevise(entry.id, 5)}
                >
                  {isRevising ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  )}
                  Perfect
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Muraajacah() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<RevisionEntry[]>([]);
  const [stats, setStats] = useState<RevisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [revisingId, setRevisingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"due" | "all" | "strong">("due");

  const [aiCoach, setAiCoach] = useState("");
  const [isGeneratingCoach, setIsGeneratingCoach] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const coachScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (coachScrollRef.current)
      coachScrollRef.current.scrollTop = coachScrollRef.current.scrollHeight;
  }, [aiCoach]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesRes, planRes] = await Promise.all([
        fetch("/api/hifdh", { credentials: "include" }),
        fetch("/api/hifdh/plan", { credentials: "include" }),
      ]);

      if (entriesRes.ok) {
        const data: RevisionEntry[] = await entriesRes.json();
        setEntries(data);
      }

      if (planRes.ok) {
        const plan = await planRes.json();
        setStats({
          totalEntries: entries.length,
          dueToday: plan?.stats?.dueToday ?? 0,
          overdueCount: (plan?.due ?? []).filter((e: RevisionEntry) => {
            const d = e.nextRevision ? new Date(e.nextRevision) : null;
            return d && d < new Date();
          }).length,
          avgStrength: entries.length
            ? Math.round(entries.reduce((s: number, e: RevisionEntry) => s + e.strengthScore, 0) / entries.length)
            : 0,
          totalRevisions: entries.reduce((s: number, e: RevisionEntry) => s + e.revisionCount, 0),
          streakDays: plan?.stats?.streakDays ?? 0,
        });
      }
    } catch {
      toast({ title: "Error", description: "Could not load revision data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRevise = async (entryId: number, quality: number) => {
    setRevisingId(entryId);
    try {
      const res = await fetch(`/api/hifdh/${entryId}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quality }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({
        title: quality >= 4 ? "Excellent! 🌟" : quality >= 3 ? "Good revision! ✓" : "Keep practising 💪",
        description:
          quality >= 4
            ? "Your strength score has increased."
            : quality >= 3
            ? "Next revision scheduled. Keep it up!"
            : "We'll bring this back sooner for more practice.",
      });
      await loadData();
    } catch {
      toast({ title: "Error", description: "Could not save revision.", variant: "destructive" });
    } finally {
      setRevisingId(null);
    }
  };

  const generateAiCoach = async () => {
    setIsGeneratingCoach(true);
    setAiCoach("");
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const r = await fetch("/api/hifdh/ai-coach", {
        credentials: "include",
        signal: ctrl.signal,
      });
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
            if (d.content) setAiCoach((p) => p + d.content);
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError")
        toast({ title: "Error", description: "Could not generate advice. Try again.", variant: "destructive" });
    } finally {
      setIsGeneratingCoach(false);
    }
  };

  const dueEntries = entries.filter((e) => {
    if (!e.nextRevision) return false;
    return new Date(e.nextRevision) <= new Date();
  });

  const strongEntries = entries.filter((e) => e.strengthScore >= 80);

  const displayEntries =
    activeTab === "due" ? dueEntries : activeTab === "strong" ? strongEntries : entries;

  const statsCards = [
    {
      label: "Due Today",
      value: stats?.dueToday ?? dueEntries.length,
      icon: CalendarDays,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Avg Strength",
      value: `${stats?.avgStrength ?? 0}%`,
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Revisions",
      value: stats?.totalRevisions ?? 0,
      icon: RotateCcw,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Strong Surahs",
      value: strongEntries.length,
      icon: Award,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-emerald-950 mb-1">
              مُراجَعَة
            </h1>
            <p className="text-base font-semibold text-emerald-800 mb-1">Muraaja'ah — Revision</p>
            <p className="text-sm text-muted-foreground">
              Spaced-repetition Quran revision. Review what is due and strengthen weak memorisation.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            className="gap-2 text-xs"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </Button>
        </div>

        {/* Subci / Today's Sessions Banner */}
        {dueEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 text-white p-5 flex items-center gap-4 shadow-lg"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Flame className="h-6 w-6 text-amber-300" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg leading-tight">Subci — Today's Session</p>
              <p className="text-emerald-100 text-sm">
                {dueEntries.length} surah{dueEntries.length !== 1 ? "s" : ""} due for revision today.
                Complete them to maintain your memorisation strength.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shrink-0"
              onClick={() => setActiveTab("due")}
            >
              Start
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))
            : statsCards.map((s) => (
                <Card key={s.label} className="rounded-2xl border-gray-100 shadow-sm">
                  <CardContent className="p-4">
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <p className="text-xl font-bold text-emerald-950">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="due" className="rounded-lg text-xs">
              Due ({dueEntries.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg text-xs">
              All ({entries.length})
            </TabsTrigger>
            <TabsTrigger value="strong" className="rounded-lg text-xs">
              <Star className="h-3 w-3 mr-1 text-amber-500" />
              Strong ({strongEntries.length})
            </TabsTrigger>
          </TabsList>

          {(["due", "all", "strong"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))
              ) : displayEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
                  <p className="font-semibold text-emerald-800">
                    {tab === "due" ? "All caught up! No revisions due." : "No entries found."}
                  </p>
                  <p className="text-sm mt-1">
                    {tab === "due"
                      ? "Excellent work! Check back later."
                      : "Add surahs in the Hifdh Tracker first."}
                  </p>
                </div>
              ) : (
                displayEntries.map((entry) => (
                  <RevisionCard
                    key={entry.id}
                    entry={entry}
                    onRevise={handleRevise}
                    isRevising={revisingId === entry.id}
                  />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* AI Revision Coach */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-emerald-600" />
              AI Revision Coach
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiCoach && (
              <div
                ref={coachScrollRef}
                className="max-h-56 overflow-y-auto bg-emerald-50 rounded-xl p-4 text-sm text-emerald-900 leading-relaxed whitespace-pre-wrap"
              >
                {aiCoach}
              </div>
            )}
            <Button
              onClick={generateAiCoach}
              disabled={isGeneratingCoach}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isGeneratingCoach ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating advice…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {aiCoach ? "Regenerate Advice" : "Get AI Revision Advice"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

