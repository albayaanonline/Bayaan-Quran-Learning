import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Star, Flame, BookOpen, Brain, Plus, UserCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface ChildProfile {
  id: number;
  clerkId: string;
  displayName: string;
  xp: number;
  streakDays: number;
  stats: {
    avgScore: number;
    totalRecordings: number;
    hifdhSurahs: number;
    surahsStudied: number;
    streakDays: number;
    xp: number;
    level: number;
    lastStudied: string | null;
  };
}

interface ParentProfile {
  id: number;
  displayName: string;
  childClerkIds: string[];
}

interface ChildProgress {
  profile: { displayName: string; xp: number; streakDays: number };
  surahProgress: Array<{ surahName: string; completedAyahs: number; totalAyahs: number; averageScore: number }>;
  hifdh: Array<{ surahName: string; strengthScore: number }>;
  summary: {
    avgScore: number;
    totalRecordings: number;
    hifdhSurahs: number;
    weakAreas: Array<{ rule: string; percentage: number }>;
    streakDays: number;
    xp: number;
  };
}

export default function ParentDashboard() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [childProgress, setChildProgress] = useState<ChildProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingChild, setAddingChild] = useState(false);
  const [newChildId, setNewChildId] = useState("");
  const [parentName, setParentName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/parent/profile", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch("/api/parent/children", { credentials: "include" }).then(r => r.ok ? r.json() : []),
    ]).then(([profile, kids]) => {
      setParentProfile(profile);
      setParentName(profile?.displayName ?? "");
      setChildren(kids);
      if (kids.length > 0) setSelectedChild(kids[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    setChildProgress(null);
    fetch(`/api/parent/children/${selectedChild.clerkId}/progress`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => setChildProgress(d))
      .catch(() => {});
  }, [selectedChild]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/parent/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName: parentName, childClerkIds: parentProfile?.childClerkIds ?? [] }),
      });
      if (r.ok) {
        const data = await r.json();
        setParentProfile(data);
        toast({ title: t("parent.profileSaved") });
      }
    } catch { toast({ title: t("parent.failedSave"), variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const addChild = async () => {
    if (!newChildId.trim()) return;
    const currentIds = parentProfile?.childClerkIds ?? [];
    const updatedIds = [...currentIds, newChildId.trim()];
    setSaving(true);
    try {
      const r = await fetch("/api/parent/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName: parentName, childClerkIds: updatedIds }),
      });
      if (r.ok) {
        const data = await r.json();
        setParentProfile(data);
        setNewChildId("");
        setAddingChild(false);
        const kidsR = await fetch("/api/parent/children", { credentials: "include" });
        if (kidsR.ok) { const kids = await kidsR.json(); setChildren(kids); }
        toast({ title: t("parent.childAdded") });
      }
    } catch { toast({ title: t("parent.failedAdd"), variant: "destructive" }); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0,1,2].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900">{t("parent.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("parent.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAddingChild(true)} className="gap-2">
            <Plus className="h-4 w-4" /> {t("parent.addChild")}
          </Button>
        </div>

        {!parentProfile?.displayName && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-amber-900">{t("parent.setupProfile")}</p>
                <div className="flex gap-2 mt-2">
                  <Input value={parentName} onChange={e => setParentName(e.target.value)} placeholder={t("parent.yourName")} className="h-8 text-sm" />
                  <Button size="sm" onClick={saveProfile} disabled={saving}>{t("gen.save")}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {addingChild && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-blue-950 mb-2">{t("parent.enterChildId")}</p>
              <div className="flex gap-2">
                <Input value={newChildId} onChange={e => setNewChildId(e.target.value)} placeholder="user_xxxxxxxxxxxx" className="h-8 text-sm" />
                <Button size="sm" onClick={addChild} disabled={saving}>{t("gen.add")}</Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingChild(false)}>{t("gen.cancel")}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {children.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-blue-300 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">{t("parent.noChildren")}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{t("parent.noChildrenSub")}</p>
              <Button onClick={() => setAddingChild(true)} className="bg-blue-700 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> {t("parent.addChildAccount")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-[200px_1fr]">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">{t("parent.children")}</p>
              {children.map(child => (
                <button
                  key={child.clerkId}
                  onClick={() => setSelectedChild(child)}
                  className={`w-full text-left rounded-xl p-3 transition-all ${selectedChild?.clerkId === child.clerkId ? "bg-blue-100 border border-blue-300" : "bg-white border border-transparent hover:bg-blue-50"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {child.displayName?.[0] ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{child.displayName ?? "Student"}</p>
                      <p className="text-[11px] text-muted-foreground">Level {child.stats.level} · {child.stats.xp} XP</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span className="text-xs text-muted-foreground">{child.stats.streakDays}d streak</span>
                    {child.stats.lastStudied && (
                      <span className="text-[10px] text-blue-700 ml-auto">Active</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedChild && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    { label: t("parent.avgScore"), value: `${selectedChild.stats.avgScore}%`, icon: Star, color: "text-amber-600" },
                    { label: t("parent.streak"), value: `${selectedChild.stats.streakDays} ${t("parent.days")}`, icon: Flame, color: "text-orange-600" },
                    { label: t("parent.surahs"), value: selectedChild.stats.surahsStudied, icon: BookOpen, color: "text-blue-700" },
                    { label: t("nav.hifdh"), value: selectedChild.stats.hifdhSurahs, icon: Brain, color: "text-purple-600" },
                  ].map(stat => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="border-blue-100">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            <span className="text-xs text-muted-foreground">{stat.label}</span>
                          </div>
                          <p className="text-2xl font-bold">{stat.value}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <Tabs defaultValue="progress">
                  <TabsList>
                    <TabsTrigger value="progress">{t("parent.tabProgress")}</TabsTrigger>
                    <TabsTrigger value="weaknesses">{t("parent.tabWeak")}</TabsTrigger>
                    <TabsTrigger value="hifdh">{t("nav.hifdh")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="progress" className="mt-3 space-y-3">
                    {!childProgress ? (
                      <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-10" />)}</div>
                    ) : (
                      <div className="space-y-2">
                        {childProgress.surahProgress.slice(0, 10).map((s, i) => (
                          <div key={i} className="bg-white border border-blue-100 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium">{s.surahName}</span>
                              <Badge variant="outline" className="text-xs">{s.averageScore ?? 0}%</Badge>
                            </div>
                            <Progress value={Math.min(100, Math.round((s.completedAyahs / (s.totalAyahs || 1)) * 100))} className="h-1.5" />
                            <p className="text-[10px] text-muted-foreground mt-1">{s.completedAyahs}/{s.totalAyahs} ayahs</p>
                          </div>
                        ))}
                        {childProgress.surahProgress.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-6">{t("parent.noSurahsStudied")}</p>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="weaknesses" className="mt-3">
                    {!childProgress ? <Skeleton className="h-32" /> : (
                      <div className="space-y-2">
                        {childProgress.summary.weakAreas.length === 0 ? (
                          <div className="flex items-center gap-2 text-blue-800 bg-blue-50 rounded-lg p-4">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-sm">{t("parent.noWeakAreas")}</span>
                          </div>
                        ) : childProgress.summary.weakAreas.map((area, i) => (
                          <div key={area.rule} className="bg-white border border-red-100 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium">{area.rule}</span>
                              <Badge variant="outline" className="text-xs text-red-600 border-red-200">Missed {area.percentage}%</Badge>
                            </div>
                            <Progress value={area.percentage} className="h-1.5 [&>div]:bg-red-400" />
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="hifdh" className="mt-3">
                    {!childProgress ? <Skeleton className="h-32" /> : (
                      <div className="space-y-2">
                        {childProgress.hifdh.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-6">{t("parent.noHifdhYet")}</p>
                        ) : childProgress.hifdh.map((h, i) => (
                          <div key={i} className="bg-white border border-purple-100 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium">{h.surahName}</span>
                              <Badge className="text-xs bg-purple-100 text-purple-700 border-0">{h.strengthScore ?? 0}% strength</Badge>
                            </div>
                            <Progress value={h.strengthScore ?? 0} className="h-1.5 [&>div]:bg-purple-500" />
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
