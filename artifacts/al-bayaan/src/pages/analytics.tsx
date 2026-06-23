import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, BookOpen, Brain, BotMessageSquare, Flame, Star, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface AnalyticsData {
  overview: {
    totalRecordings: number;
    recentRecordings: number;
    avgScore: number;
    streakDays: number;
    totalXp: number;
    level: number;
    surahsStudied: number;
    hifdhSurahs: number;
    aiConversations: number;
  };
  weakAreas: Array<{ rule: string; count: number; percentage: number }>;
  scoresByWeek: Array<{ week: string; avgScore: number }>;
  surahCompletion: Array<{ surahId: number; surahName: string; completion: number; avgScore: number }>;
  hifdh: { total: number; mastered: number; reviewing: number };
}

interface TajweedAnalytics {
  rules: Array<{ name: string; accuracy: number; found: number; missed: number; total: number }>;
  totalRecordings: number;
}

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: any; color: string; sub?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-blue-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ScoreBar({ label, score, max = 100, color = "bg-blue-600" }: { label: string; score: number; max?: number; color?: string }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{score}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [tajweed, setTajweed] = useState<TajweedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch("/api/analytics/overview", { }).then(r => r.ok ? r.json() : null),
      authFetch("/api/analytics/tajweed", { }).then(r => r.ok ? r.json() : null),
    ]).then(([overview, taj]) => {
      setData(overview);
      setTajweed(taj);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    </AppLayout>
  );

  if (!data) return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-blue-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No data yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Start reciting to see your analytics</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );

  const { overview, weakAreas, scoresByWeek, surahCompletion, hifdh } = data;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-700" /> Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track your learning performance and progress</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Avg Score (30d)" value={`${overview.avgScore}%`} icon={Star} color="text-amber-500" sub={`${overview.recentRecordings} recordings`} />
          <StatCard label="Streak" value={`${overview.streakDays} days`} icon={Flame} color="text-orange-500" />
          <StatCard label="Level" value={overview.level} icon={TrendingUp} color="text-blue-700" sub={`${overview.totalXp} XP total`} />
          <StatCard label="AI Chats" value={overview.aiConversations} icon={BotMessageSquare} color="text-blue-500" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Surahs Studied" value={overview.surahsStudied} icon={BookOpen} color="text-blue-700" />
          <StatCard label="Hifdh Surahs" value={hifdh.total} icon={Brain} color="text-purple-600" sub={`${hifdh.mastered} mastered`} />
          <StatCard label="Total Recitations" value={overview.totalRecordings} icon={Target} color="text-sky-500" />
        </div>

        <Tabs defaultValue="scores">
          <TabsList>
            <TabsTrigger value="scores">Score Trends</TabsTrigger>
            <TabsTrigger value="tajweed">Tajweed Analysis</TabsTrigger>
            <TabsTrigger value="surahs">Surah Progress</TabsTrigger>
            <TabsTrigger value="hifdh">Hifdh Status</TabsTrigger>
          </TabsList>

          <TabsContent value="scores" className="mt-4 space-y-4">
            <Card className="border-blue-100">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Weekly Average Score</CardTitle></CardHeader>
              <CardContent>
                {scoresByWeek.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Not enough data yet — keep reciting!</p>
                ) : (
                  <div className="space-y-3">
                    {scoresByWeek.map((w) => (
                      <div key={w.week} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-20 shrink-0">{new Date(w.week).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${w.avgScore}%` }}
                            transition={{ duration: 0.6 }}
                            className={`h-full rounded-full flex items-center justify-end pr-2 text-[10px] font-bold text-white ${w.avgScore >= 80 ? "bg-blue-600" : w.avgScore >= 60 ? "bg-amber-500" : "bg-red-400"}`}
                          >
                            {w.avgScore > 15 ? `${w.avgScore}%` : ""}
                          </motion.div>
                        </div>
                        <span className="text-xs font-semibold w-10 text-right">{w.avgScore}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {weakAreas.length > 0 && (
              <Card className="border-red-100 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" /> Needs Attention
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {weakAreas.map(area => (
                    <ScoreBar key={area.rule} label={`${area.rule} — missed ${area.percentage}% of the time`} score={area.percentage} color="bg-red-400" />
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tajweed" className="mt-4">
            <Card className="border-blue-100">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Tajweed Rule Accuracy</CardTitle></CardHeader>
              <CardContent>
                {!tajweed || tajweed.rules.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Record recitations to see Tajweed analysis</p>
                ) : (
                  <div className="space-y-4">
                    {tajweed.rules.map(rule => (
                      <div key={rule.name}>
                        <ScoreBar
                          label={`${rule.name} (${rule.found}/${rule.total} correct)`}
                          score={rule.accuracy}
                          color={rule.accuracy >= 80 ? "bg-blue-600" : rule.accuracy >= 60 ? "bg-amber-500" : "bg-red-400"}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="surahs" className="mt-4">
            <Card className="border-blue-100">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Surah Completion</CardTitle></CardHeader>
              <CardContent>
                {surahCompletion.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Start learning surahs to see progress</p>
                ) : (
                  <div className="space-y-4">
                    {surahCompletion.map(s => (
                      <div key={s.surahId}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{s.surahName}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">{s.avgScore}%</Badge>
                            <span className="font-semibold">{s.completion}%</span>
                          </div>
                        </div>
                        <Progress value={s.completion} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hifdh" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total Surahs", value: hifdh.total, icon: Brain, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Mastered (80%+)", value: hifdh.mastered, icon: CheckCircle2, color: "text-blue-700", bg: "bg-blue-50" },
                { label: "Due for Review", value: hifdh.reviewing, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
              ].map(item => (
                <Card key={item.label} className={`border-0 ${item.bg}`}>
                  <CardContent className="p-5 text-center">
                    <item.icon className={`h-8 w-8 ${item.color} mx-auto mb-2`} />
                    <p className="text-3xl font-bold">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
