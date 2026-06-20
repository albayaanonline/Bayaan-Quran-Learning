import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Mic, MessageSquare, TrendingUp, Star, Activity, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

interface AdminStats {
  totalUsers: number;
  activeToday: number;
  totalRecordings: number;
  totalConversations: number;
  avgXp: number;
  avgScore: number;
  levelDistribution: Record<string, number>;
  newUsersToday: number;
}

interface AdminUser {
  id: number;
  clerkId: string;
  displayName: string;
  avatarUrl: string | null;
  level: string;
  xp: number;
  streakDays: number;
  totalRecordings: number;
  onboardingComplete: boolean;
  createdAt: string;
  lastStudyDate: string | null;
}

function StatCard({ label, value, icon: Icon, sub, color = "emerald" }: {
  label: string; value: string | number; icon: any; sub?: string; color?: string;
}) {
  return (
    <Card className="border-emerald-100">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <div className={`h-9 w-9 rounded-xl bg-${color}-100 flex items-center justify-center`}>
            <Icon className={`h-4 w-4 text-${color}-700`} />
          </div>
        </div>
        <p className="text-3xl font-bold text-emerald-950">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const { t } = useI18n();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats", { credentials: "include" }),
        fetch("/api/admin/users?limit=20", { credentials: "include" }),
      ]);
      if (statsRes.status === 403) { setError("Access denied. Admin privileges required."); return; }
      if (!statsRes.ok) throw new Error(`Stats: HTTP ${statsRes.status}`);
      if (!usersRes.ok) throw new Error(`Users: HTTP ${usersRes.status}`);
      const [s, u] = await Promise.all([statsRes.json(), usersRes.json()]);
      setStats(s);
      setUsers(u.users ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">{t("admin.accessDenied")}</h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">{t("admin.setAdminIds")}</p>
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
              <Shield className="h-6 w-6 text-emerald-600" />
              {t("admin.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t("admin.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> {t("gen.refresh")}
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label={t("admin.totalUsers")} value={stats.totalUsers} icon={Users} sub={`+${stats.newUsersToday} ${t("admin.today")}`} />
              <StatCard label={t("admin.activeToday")} value={stats.activeToday} icon={Activity} sub={t("admin.uniqueStudents")} />
              <StatCard label={t("admin.totalRecordings")} value={stats.totalRecordings.toLocaleString()} icon={Mic} sub={t("admin.allTime")} />
              <StatCard label={t("admin.conversations")} value={stats.totalConversations.toLocaleString()} icon={MessageSquare} sub={t("admin.withAI")} />
              <StatCard label={t("admin.avgXp")} value={stats.avgXp.toLocaleString()} icon={Star} sub={t("admin.allUsers")} />
              <StatCard label={t("admin.avgScore")} value={`${stats.avgScore}%`} icon={TrendingUp} sub={t("admin.recitationAcc")} />
              <StatCard label={t("admin.newToday")} value={stats.newUsersToday} icon={Users} sub={t("admin.newReg")} color="blue" />
              <StatCard label={t("admin.activeRate")} value={`${stats.totalUsers > 0 ? Math.round((stats.activeToday / stats.totalUsers) * 100) : 0}%`} icon={Activity} sub={t("admin.dailyActive")} color="purple" />
            </div>

            {Object.keys(stats.levelDistribution).length > 0 && (
              <Card className="border-emerald-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{t("admin.levelDist")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(stats.levelDistribution).map(([level, count]) => (
                      <div key={level} className="flex items-center gap-2">
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 capitalize">{level}</Badge>
                        <span className="font-bold text-emerald-950">{count}</span>
                        <span className="text-xs text-muted-foreground">users</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-emerald-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  {t("admin.topUsers")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-emerald-100">
                        <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">{t("admin.colUser")}</th>
                        <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">{t("teacher.colLevel")}</th>
                        <th className="text-right py-2.5 px-4 text-xs text-muted-foreground font-medium">{t("ldr.xp")}</th>
                        <th className="text-right py-2.5 px-4 text-xs text-muted-foreground font-medium">{t("admin.colStreak")}</th>
                        <th className="text-right py-2.5 px-4 text-xs text-muted-foreground font-medium">{t("teacher.recordings")}</th>
                        <th className="text-right py-2.5 px-4 text-xs text-muted-foreground font-medium">{t("admin.colLastActive")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr key={u.id} className={`border-b border-emerald-50 hover:bg-emerald-50/50 transition-colors ${i === 0 ? "bg-emerald-50/30" : ""}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                                  {u.displayName?.[0] ?? "?"}
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-emerald-950">{u.displayName || "Student"}</p>
                                {!u.onboardingComplete && <p className="text-xs text-amber-600">{t("admin.onboardingIncomplete")}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700 text-xs capitalize">{u.level || "beginner"}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-950">{u.xp.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-muted-foreground">{u.streakDays}d</td>
                          <td className="py-3 px-4 text-right text-muted-foreground">{u.totalRecordings}</td>
                          <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                            {u.lastStudyDate ? new Date(u.lastStudyDate).toLocaleDateString() : t("admin.never")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-8">{t("admin.noUsers")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
