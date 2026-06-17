import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Brain, CheckCircle2, RotateCcw, BookOpen, Calendar, Trash2, Star, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useListSurahs } from "@workspace/api-client-react";

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
  memorized: "bg-emerald-100 text-emerald-800 border-emerald-200",
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

export default function Hifdh() {
  const { toast } = useToast();
  const { data: surahs } = useListSurahs();
  const [entries, setEntries] = useState<HifdhEntry[]>([]);
  const [plan, setPlan] = useState<HifdhPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedSurahId, setSelectedSurahId] = useState<string>("");
  const [revising, setRevising] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesRes, planRes] = await Promise.all([
        fetch("/api/hifdh", { credentials: "include" }),
        fetch("/api/hifdh/plan", { credentials: "include" }),
      ]);
      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (planRes.ok) setPlan(await planRes.json());
    } catch {
      toast({ title: "Error", description: "Could not load Hifdh data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addSurah = async () => {
    if (!selectedSurahId) return;
    const surahId = parseInt(selectedSurahId);
    const surah = surahs?.find((s) => s.number === surahId);
    try {
      const res = await fetch("/api/hifdh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ surahId, ayahStart: 1, ayahEnd: surah?.ayahCount ?? 1 }),
      });
      if (res.status === 409) { toast({ title: "Already added", description: "This surah is already in your Hifdh plan." }); return; }
      if (!res.ok) throw new Error();
      toast({ title: "Added!", description: `${surah?.name ?? "Surah"} added to your Hifdh plan.` });
      setAddOpen(false);
      setSelectedSurahId("");
      loadData();
    } catch {
      toast({ title: "Error", description: "Could not add surah.", variant: "destructive" });
    }
  };

  const revise = async (id: number, quality: string) => {
    setRevising(id);
    try {
      const res = await fetch(`/api/hifdh/${id}/revise`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quality }),
      });
      if (res.ok) {
        toast({ title: "Revision recorded!", description: "Great work! Your strength score has been updated." });
        loadData();
      }
    } catch {
      toast({ title: "Error", description: "Could not record revision.", variant: "destructive" });
    } finally {
      setRevising(null);
    }
  };

  const remove = async (id: number) => {
    try {
      await fetch(`/api/hifdh/${id}`, { method: "DELETE", credentials: "include" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Removed" });
    } catch {}
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-emerald-950 dark:text-emerald-50">Hifdh Tracker</h1>
            <p className="text-muted-foreground mt-1">Track your Quran memorization with spaced repetition</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Plus className="h-4 w-4" /> Add Surah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Surah to Hifdh</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Select value={selectedSurahId} onValueChange={setSelectedSurahId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Surah…" />
                  </SelectTrigger>
                  <SelectContent>
                    {surahs?.map((s) => (
                      <SelectItem key={s.number} value={String(s.number)}>
                        {s.number}. {s.name} — {s.nameArabic} ({s.ayahCount} ayahs)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addSurah} disabled={!selectedSurahId} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Add to Hifdh Plan
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
        ) : plan && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Surahs", value: plan.stats.totalSurahs, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
              { label: "Memorized", value: plan.stats.memorized, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
              { label: "Reviewing", value: plan.stats.reviewing, icon: RotateCcw, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
              { label: "Due Today", value: plan.stats.dueToday, icon: Flame, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card>
                  <CardContent className="p-5 flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Due Today */}
        {plan && plan.due.length > 0 && (
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-red-800 dark:text-red-300 flex items-center gap-2">
                <Flame className="h-4 w-4" /> Due for Revision Today ({plan.due.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.due.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 bg-white dark:bg-background rounded-xl p-4 border border-red-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-emerald-950 dark:text-emerald-50">{entry.surahName}</p>
                    <p className="text-xs text-muted-foreground">Ayahs {entry.ayahStart}–{entry.ayahEnd} · {entry.revisionCount} revisions</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={entry.strengthScore} className="h-1.5 flex-1 bg-emerald-100" />
                      <span className="text-xs font-medium text-emerald-700">{entry.strengthScore}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => revise(entry.id, "good")} disabled={revising === entry.id}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Good
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => revise(entry.id, "excellent")} disabled={revising === entry.id}>
                      <Star className="h-3.5 w-3.5 mr-1" /> Excellent
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
            <CardTitle className="text-base">All Memorization Progress</CardTitle>
            <CardDescription>Surah-by-surah breakdown with spaced repetition scheduling</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>}

            {!loading && entries.length === 0 && (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 mx-auto text-emerald-300 mb-3" />
                <p className="text-muted-foreground text-sm">No surahs in your Hifdh plan yet.</p>
                <p className="text-muted-foreground text-sm">Click "Add Surah" to start your memorization journey.</p>
              </div>
            )}

            <div className="space-y-3">
              {entries.map((entry, i) => (
                <motion.div key={entry.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-emerald-100 hover:border-emerald-200 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center font-bold text-emerald-800 text-sm shrink-0">
                    {entry.surahId}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-emerald-950 dark:text-emerald-50">{entry.surahName}</span>
                      <Badge className={`text-xs border ${STATUS_COLORS[entry.status] ?? ""}`}>{STATUS_LABELS[entry.status] ?? entry.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Ayahs {entry.ayahStart}–{entry.ayahEnd} · {entry.revisionCount} revisions</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress value={entry.strengthScore} className="h-1.5 flex-1 bg-emerald-100" />
                      <span className="text-xs font-medium text-emerald-700 w-8 text-right">{entry.strengthScore}%</span>
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
                      className="text-emerald-600 hover:bg-emerald-50 h-8 px-2">
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
                <Calendar className="h-4 w-4 text-emerald-600" /> Upcoming Revisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {plan.upcoming.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-sm py-2 border-b border-emerald-50 last:border-0">
                    <span className="font-medium text-emerald-900 dark:text-emerald-100">{entry.surahName}</span>
                    <span className="text-muted-foreground">{formatDate(entry.nextRevision)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
