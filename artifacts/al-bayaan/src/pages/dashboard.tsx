import { useUser, useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Star, BookOpen, Clock, Target, Zap, Trophy, ArrowRight, TrendingUp, MessageSquare, CreditCard, MessageCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TrialCountdown from "@/components/TrialCountdown";

const MOTIVATIONAL_HADITHS = [
  { text: "Whoever recites a letter from Allah's Book, then he receives the reward from it, and the reward of ten the like of it.", source: "Tirmidhi 2910" },
  { text: "The best of you are those who learn the Quran and teach it.", source: "Bukhari 5027" },
  { text: "Indeed, the one who recites the Quran beautifully, smoothly, and precisely, will be in the company of the noble angels.", source: "Bukhari 4937" },
  { text: "Make the Quran the spring of your hearts, the light of your chests.", source: "Ibn Hibban" },
];

const todayHadith = MOTIVATIONAL_HADITHS[new Date().getDate() % MOTIVATIONAL_HADITHS.length];

const QUICK_LINKS = [
  { href: "/learn",          label: "Continue Quran",       icon: BookOpen,      color: "from-blue-600 to-teal-500",     badge: null },
  { href: "/teacher",        label: "Ask AI Teacher",       icon: MessageSquare, color: "from-violet-500 to-purple-500", badge: "AI" },
  { href: "/hifdh",          label: "Hifdh Tracker",        icon: Brain,         color: "from-blue-500 to-indigo-500",   badge: null },
  { href: "/achievements",   label: "My Achievements",      icon: Trophy,        color: "from-amber-500 to-orange-500",  badge: null },
  { href: "/payments",       label: "Payments",             icon: CreditCard,    color: "from-emerald-600 to-teal-600",  badge: null },
  { href: "/messages",       label: "Messages",             icon: MessageCircle, color: "from-sky-600 to-blue-600",      badge: "NEW" },
];

function Brain(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.81A3 3 0 0 1 4.5 9.5a3 3 0 0 1 .5-1.69A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.81A3 3 0 0 0 19.5 9.5a3 3 0 0 0-.5-1.69A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
}

async function fetchWithToken(path: string, getToken: () => Promise<string | null>) {
  const token = await getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(path, { credentials: "include", headers });
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`);
  return res.json();
}

export default function Dashboard() {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  const ready = isLoaded && !!isSignedIn;

  // Fetch dashboard data — getToken() called at query-time so the Bearer token
  // is always fresh regardless of when Clerk finishes initializing.
  const { data: dashboard, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchWithToken("/api/dashboard", getToken),
    enabled: ready,
    retry: 2,
    staleTime: 30_000,
  });

  // Load profile to detect new users who haven't completed onboarding
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchWithToken("/api/profile", getToken),
    enabled: ready,
    staleTime: 60_000,
  });

  // Redirect new users to onboarding before they see the dashboard
  useEffect(() => {
    if (profile && profile.onboardingComplete === false) {
      setLocation("/onboarding");
    }
  }, [profile, setLocation]);

  if (!isLoaded || isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <Skeleton className="h-10 w-64 shimmer" />
          <Skeleton className="h-28 w-full shimmer" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 shimmer" />)}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 shimmer" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isError || !dashboard) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center p-6">
          <p className="text-muted-foreground">{t("dash.failedLoad", "Failed to load dashboard.")}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      </AppLayout>
    );
  }

  const minsLeft = Math.max(0, dashboard.streak.dailyGoalMinutes - dashboard.todayMinutes);
  const goalPct = Math.min(100, (dashboard.todayMinutes / dashboard.streak.dailyGoalMinutes) * 100);
  const goalDone = dashboard.todayMinutes >= dashboard.streak.dailyGoalMinutes;
  const streak = dashboard.streak.currentStreak;
  const xpLevel = Math.floor((dashboard.streak.xp ?? 0) / 500) + 1;

  return (
    <AppLayout>
      <div className="space-y-7 page-enter">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl md:text-3xl font-serif font-bold"
            >
              {t("dash.welcome")}, {dashboard.profile.displayName} 👋
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-muted-foreground mt-1 text-sm italic"
            >
              {t("dash.hadith")}
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="shrink-0"
          >
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
              <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              Level {xpLevel}
            </Badge>
          </motion.div>
        </div>

        {/* Trial / Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <TrialCountdown />
        </motion.div>

        {/* Daily Goal + Streak */}
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2"
          >
            <Card className="card-premium h-full border-0 shadow-sm bg-gradient-to-br from-blue-50 to-teal-50/50 dark:from-blue-950/60 dark:to-teal-950/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-600/15 flex items-center justify-center">
                      <Target className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                    </div>
                    <span className="font-semibold text-blue-950 dark:text-blue-100">{t("dash.dailyGoal")}</span>
                  </div>
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${goalDone ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-200"}`}>
                    {dashboard.todayMinutes} / {dashboard.streak.dailyGoalMinutes} min
                  </span>
                </div>
                <Progress value={goalPct} className="h-3 bg-blue-100 dark:bg-blue-900/50" />
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {goalDone
                      ? "🎉 " + t("dash.goalReached")
                      : `${minsLeft} ${t("dash.minutesLeft")}`}
                  </p>
                  {!goalDone && (
                    <Link href="/learn">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-blue-200 hover:bg-blue-50">
                        Study now <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <Card className={`card-premium h-full border-0 shadow-sm ${streak > 0 ? "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/40" : "bg-muted/40"}`}>
              <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full relative overflow-hidden">
                {streak >= 7 && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,146,60,0.15),_transparent_70%)] pointer-events-none" />
                )}
                <div className={`relative ${streak > 0 ? "animate-streak-bounce" : ""}`}>
                  <Flame className={`h-14 w-14 ${streak > 0 ? "text-orange-500 fill-orange-400" : "text-muted-foreground/30"}`} />
                  {streak >= 7 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-amber-400 rounded-full flex items-center justify-center">
                      <Star className="h-3 w-3 fill-white text-white" />
                    </div>
                  )}
                </div>
                <h3 className={`text-4xl font-bold mt-2 ${streak > 0 ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`}>
                  {streak}
                </h3>
                <p className={`font-medium text-sm mt-0.5 ${streak > 0 ? "text-orange-700/80 dark:text-orange-300/80" : "text-muted-foreground"}`}>
                  {t("dash.streak")}
                </p>
                {streak >= 3 && (
                  <Badge className="mt-2 bg-orange-100 text-orange-700 border-0 text-xs dark:bg-orange-950 dark:text-orange-300">
                    🔥 On fire!
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { key: "dash.totalXP",     value: (dashboard.streak.xp ?? 0).toLocaleString(), icon: Star,     color: "text-blue-600 dark:text-blue-400",   bg: "from-blue-50 to-indigo-50/50 dark:from-blue-950/50 dark:to-indigo-950/30",   glow: "stat-glow-blue" },
            { key: "dash.ayahsRead",   value: dashboard.totalAyahs.toLocaleString(),        icon: BookOpen,  color: "text-blue-700 dark:text-blue-400", bg: "from-blue-50 to-teal-50/50 dark:from-blue-950/50 dark:to-teal-950/30", glow: "stat-glow-emerald" },
            { key: "dash.avgAccuracy", value: `${dashboard.quickStats.avgAccuracy}%`,        icon: Target,   color: "text-purple-600 dark:text-purple-400", bg: "from-purple-50 to-violet-50/50 dark:from-purple-950/50 dark:to-violet-950/30", glow: "stat-glow-purple" },
            { key: "dash.totalTime",   value: `${Math.round(dashboard.quickStats.totalRecordings / 60)}h`, icon: Clock, color: "text-rose-600 dark:text-rose-400", bg: "from-rose-50 to-pink-50/50 dark:from-rose-950/50 dark:to-pink-950/30", glow: "stat-glow-rose" },
          ].map((stat, i) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.07 }}
            >
              <Card className={`card-premium border-0 shadow-sm bg-gradient-to-br ${stat.bg} ${stat.glow}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t(stat.key)}</p>
                      <h4 className="text-2xl font-bold">{stat.value}</h4>
                    </div>
                    <div className={`h-9 w-9 rounded-xl bg-white/70 dark:bg-black/20 flex items-center justify-center shadow-sm`}>
                      <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>All time</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <h2 className="text-base font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-xs">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_LINKS.map((link, i) => (
              <Link key={link.href} href={link.href}>
                <div className={`group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${link.color} text-white cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg`}>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <link.icon className="h-6 w-6 mb-2 opacity-90" />
                  <p className="text-sm font-medium leading-tight">{link.label}</p>
                  {link.badge && (
                    <span className="absolute top-2 right-2 text-[9px] bg-white/25 px-1.5 py-0.5 rounded-full font-semibold">
                      {link.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Hadith of the day */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <Card className="card-premium border-0 shadow-sm bg-gradient-to-br from-slate-900 to-blue-950 dark:from-black dark:to-blue-950/80 text-white overflow-hidden">
            <CardContent className="p-5 relative">
              <div className="absolute top-0 right-0 text-[120px] leading-none font-serif text-white/5 select-none pointer-events-none">"</div>
              <div className="absolute inset-0 bg-[url('/images/geometric-pattern.png')] opacity-[0.04] bg-repeat bg-[length:200px] pointer-events-none" />
              <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold mb-3">✨ Hadith of the Day</p>
                <p className="text-sm md:text-base text-white/85 leading-relaxed italic">"{todayHadith.text}"</p>
                <p className="mt-2 text-xs text-white/35">— {todayHadith.source}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
