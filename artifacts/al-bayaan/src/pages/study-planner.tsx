import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Sparkles, Loader2, RefreshCw, Printer, Clock, Target, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useGetProfile, useGetProgress } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold font-serif text-slate-900 mt-6 mb-3">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-bold text-blue-950 mt-5 mb-2 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-700 shrink-0" />{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold text-blue-900 mt-4 mb-2">{line.slice(4)}</h3>;
        if (line.startsWith("**") && line.endsWith("**") && line.length > 4) return <p key={i} className="font-semibold text-blue-950 mt-3">{line.slice(2, -2)}</p>;
        if (line.startsWith("- ")) return (
          <div key={i} className="flex gap-2 my-0.5">
            <span className="text-blue-700 mt-0.5 shrink-0">•</span>
            <span className="text-sm text-foreground">{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</span>
          </div>
        );
        if (/^\d+\./.test(line)) return (
          <div key={i} className="flex gap-2 my-0.5">
            <span className="text-blue-700 font-medium text-sm shrink-0">{line.split(".")[0]}.</span>
            <span className="text-sm text-foreground">{line.replace(/^\d+\.\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}</span>
          </div>
        );
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i} className="text-sm text-foreground my-0.5">{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
      })}
    </div>
  );
}

export default function StudyPlanner() {
  const { t } = useI18n();
  const { data: profile } = useGetProfile();
  const { data: progress } = useGetProgress();
  const [hifdhCount, setHifdhCount] = useState(0);
  const [plan, setPlan] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/hifdh", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setHifdhCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, []);

  const generatePlan = async () => {
    setIsGenerating(true);
    setPlan("");

    try {
      const r = await fetch("/api/study-planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
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
            if (d.content) setPlan(prev => prev + d.content);
          } catch {}
        }
      }
    } catch {
      setPlan(t("planner.failed"));
    } finally {
      setIsGenerating(false);
    }
  };

  const dailyGoal = profile?.dailyGoalMinutes ?? 20;
  let goals: string[] = [];
  try { goals = typeof profile?.learningGoals === "string" ? JSON.parse(profile.learningGoals) : (profile?.learningGoals ?? []); } catch {}

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-blue-50 flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-blue-700" />
              {t("planner.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t("planner.subtitle")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-blue-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-blue-800" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("planner.dailyGoal")}</p>
                <p className="font-bold text-slate-900">{dailyGoal} {t("planner.minutes")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-blue-800" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("planner.surahsStarted")}</p>
                <p className="font-bold text-slate-900">{progress?.totalSurahsStarted ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-blue-800" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("planner.hifdhSurahs")}</p>
                <p className="font-bold text-slate-900">{hifdhCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {goals.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("planner.yourGoals")}</span>
            {goals.map(g => (
              <Badge key={g} variant="outline" className="border-blue-200 text-blue-800 text-xs">{g}</Badge>
            ))}
          </div>
        )}

        {!plan && !isGenerating ? (
          <Card className="border-blue-100 border-dashed">
            <CardContent className="p-12 flex flex-col items-center text-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900">{t("planner.generateTitle")}</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {t("planner.generateDesc")}
                </p>
              </div>
              <Button onClick={generatePlan} className="bg-blue-700 hover:bg-blue-700 text-white gap-2 px-8">
                <Sparkles className="h-4 w-4" />
                {t("planner.generateBtn")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-blue-100">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-700" />
                  {t("planner.planTitle")}
                  {isGenerating && (
                    <Badge variant="outline" className="border-blue-200 text-blue-800 text-xs gap-1 ml-2">
                      <Loader2 className="h-3 w-3 animate-spin" />{t("planner.generating")}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generatePlan} disabled={isGenerating} className="gap-1 text-xs">
                    <RefreshCw className="h-3 w-3" /> {t("planner.regenerate")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1 text-xs">
                    <Printer className="h-3 w-3" /> {t("planner.print")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[60vh] pr-2">
                  <MarkdownRenderer content={plan} />
                  {isGenerating && (
                    <span className="inline-block w-1 h-4 bg-blue-700 animate-pulse ml-1 align-middle" />
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
