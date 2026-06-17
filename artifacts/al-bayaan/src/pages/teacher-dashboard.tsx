import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, Activity, TrendingUp, BookOpen, Search, ChevronRight,
  ArrowLeft, Mic, BarChart3, AlertTriangle, RefreshCw, Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Student {
  id: number; clerkId: string; displayName: string; avatarUrl: string | null;
  level: string; xp: number; streakDays: number; lastStudyDate: string | null;
  isActiveToday: boolean; weeklyRecordings: number; totalRecordings: number;
  avgScore: number; avgTajweed: number; surahsStarted: number; surahsCompleted: number;
  hifdhSurahs: number; hifdhMemorized: number; onboardingComplete: boolean;
}

interface ClassReport {
  totalStudents: number; activeToday: number; activeThisWeek: number;
  avgClassScore: number; totalRecordingsThisWeek: number;
  levelDistribution: Record<string, number>;
  classWeakAreas: { rule: string; count: number }[];
}

interface StudentDetail {
  profile: any; stats: any; weakAreas: { rule: string; count: number }[];
  recentRecordings: any[]; surahProgress: any[];
}

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    beginner: "border-blue-200 text-blue-700",
    intermediate: "border-amber-200 text-amber-700",
    advanced: "border-emerald-200 text-emerald-700",
  };
  return <Badge variant="outline" className={`text-xs capitalize ${colors[level] ?? "border-gray-200 text-gray-700"}`}>{level}</Badge>;
}

function ScoreDot({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : score > 0 ? "bg-red-400" : "bg-gray-200";
  return <div className={`h-2 w-2 rounded-full ${color}`} title={`${score}%`} />;
}

export default function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classReport, setClassReport] = useState<ClassReport | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, reportRes] = await Promise.all([
        fetch("/api/teacher-dashboard/students?limit=50", { credentials: "include" }),
        fetch("/api/teacher-dashboard/class-report", { credentials: "include" }),
      ]);
      if (!studentsRes.ok) throw new Error(`HTTP ${studentsRes.status}`);
      const [s, r] = await Promise.all([studentsRes.json(), reportRes.ok ? reportRes.json() : null]);
      setStudents(s.students ?? []);
      if (r) setClassReport(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const viewStudent = async (student: Student) => {
    setDetailLoading(true);
    setSelectedStudentName(student.displayName);
    try {
      const r = await fetch(`/api/teacher-dashboard/student/${student.clerkId}`, { credentials: "include" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setSelectedStudent(await r.json());
    } catch { setSelectedStudent(null); } finally { setDetailLoading(false); }
  };

  const filtered = students.filter(s =>
    s.displayName.toLowerCase().includes(search.toLowerCase()) ||
    s.level.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedStudent || detailLoading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <h1 className="text-xl font-semibold text-emerald-950">{selectedStudentName}</h1>
          </div>

          {detailLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : selectedStudent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Avg Score", value: `${selectedStudent.stats.avgScore}%`, icon: Star },
                  { label: "Recordings", value: selectedStudent.stats.totalRecordings, icon: Mic },
                  { label: "Surahs Done", value: selectedStudent.stats.surahsCompleted, icon: BookOpen },
                  { label: "Week Change", value: `${selectedStudent.stats.improvement >= 0 ? "+" : ""}${selectedStudent.stats.improvement}%`, icon: TrendingUp },
                ].map(({ label, value, icon: Icon }) => (
                  <Card key={label} className="border-emerald-100">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <Icon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <p className="text-2xl font-bold text-emerald-950">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedStudent.weakAreas.length > 0 && (
                <Card className="border-amber-100">
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="h-4 w-4" /> Tajweed Weak Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedStudent.weakAreas.map((w: any) => (
                        <div key={w.rule} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-36 truncate">{w.rule}</span>
                          <div className="flex-1">
                            <Progress value={Math.min(100, w.count * 10)} className="h-1.5 bg-amber-100" />
                          </div>
                          <span className="text-xs text-muted-foreground w-16 text-right">{w.count}× missed</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-emerald-100">
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-medium">Recent Recordings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedStudent.recentRecordings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recordings yet</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedStudent.recentRecordings.map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Surah {r.surahId}:{r.ayahNumber}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs ${r.overallScore >= 80 ? "border-emerald-200 text-emerald-700" : r.overallScore >= 60 ? "border-amber-200 text-amber-700" : "border-red-200 text-red-700"}`}>
                                {r.overallScore}%
                              </Badge>
                              <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-emerald-100">
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-medium">Surah Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedStudent.surahProgress.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No surahs started yet</p>
                    ) : (
                      <ScrollArea className="h-40">
                        <div className="space-y-2">
                          {selectedStudent.surahProgress.map((sp: any) => {
                            const pct = Math.round((sp.completedAyahs / sp.totalAyahs) * 100);
                            return (
                              <div key={sp.surahId}>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>{sp.surahName}</span>
                                  <span>{sp.completedAyahs}/{sp.totalAyahs} · {sp.averageScore ? `${sp.averageScore}% avg` : ""}</span>
                                </div>
                                <Progress value={pct} className="h-1.5 bg-emerald-100" />
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-emerald-950 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-emerald-600" />
              Teacher Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor student progress and learning analytics</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">Error: {error}</p>}

        {classReport && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Total Students", value: classReport.totalStudents, icon: Users },
              { label: "Active Today", value: classReport.activeToday, icon: Activity },
              { label: "Active This Week", value: classReport.activeThisWeek, icon: TrendingUp },
              { label: "Avg Class Score", value: `${classReport.avgClassScore}%`, icon: Star },
              { label: "Weekly Recordings", value: classReport.totalRecordingsThisWeek, icon: Mic },
              { label: "Common Weak Area", value: classReport.classWeakAreas[0]?.rule ?? "None", icon: AlertTriangle },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="border-emerald-100">
                <CardContent className="p-4">
                  <Icon className="h-4 w-4 text-emerald-600 mb-2" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-bold text-emerald-950 mt-0.5 text-sm truncate">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border-emerald-100">
          <CardHeader className="pb-3 flex-row items-center justify-between gap-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              Students ({filtered.length})
            </CardTitle>
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search students…" className="pl-9 h-8 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-emerald-100 bg-emerald-50/50">
                      {["Student", "Level", "Score", "Tajweed", "Surahs", "Hifdh", "Activity", ""].map(h => (
                        <th key={h} className={`py-2.5 px-4 text-xs text-muted-foreground font-medium ${h === "" || h === "Student" ? "text-left" : "text-center"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filtered.map((s, i) => (
                        <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="border-b border-emerald-50 hover:bg-emerald-50/50 transition-colors cursor-pointer"
                          onClick={() => viewStudent(s)}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {s.avatarUrl ? (
                                <img src={s.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                                  {s.displayName?.[0] ?? "?"}
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-emerald-950 text-xs">{s.displayName}</p>
                                {s.isActiveToday && <p className="text-[10px] text-emerald-600">Active today</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center"><LevelBadge level={s.level} /></td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <ScoreDot score={s.avgScore} />
                              <span className="text-xs font-medium">{s.avgScore > 0 ? `${s.avgScore}%` : "—"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-xs text-muted-foreground">{s.avgTajweed > 0 ? `${s.avgTajweed}%` : "—"}</td>
                          <td className="py-3 px-4 text-center text-xs text-muted-foreground">{s.surahsCompleted}/{s.surahsStarted}</td>
                          <td className="py-3 px-4 text-center text-xs text-muted-foreground">{s.hifdhMemorized}/{s.hifdhSurahs}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="text-[10px] text-muted-foreground">
                              <p>{s.weeklyRecordings} this week</p>
                              <p>{s.streakDays}d streak</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    {search ? "No students match your search" : "No students yet"}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
