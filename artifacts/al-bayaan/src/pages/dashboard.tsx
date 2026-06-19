import { useGetDashboard } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Star, BookOpen, Clock, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard();
  const { t } = useI18n();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AppLayout>
    );
  }

  if (!dashboard) {
    return (
      <AppLayout>
        <div className="text-muted-foreground p-6">{t("dash.failedLoad", "Failed to load dashboard.")}</div>
      </AppLayout>
    );
  }

  const minsLeft = dashboard.streak.dailyGoalMinutes - dashboard.todayMinutes;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-emerald-950 dark:text-emerald-50">
            {t("dash.welcome")}, {dashboard.profile.displayName}
          </h1>
          <p className="text-muted-foreground mt-2 italic text-sm">
            {t("dash.hadith")}
          </p>
        </div>

        {/* Daily Goal & Streak */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="h-full border-emerald-100 bg-white/50 backdrop-blur-sm dark:bg-emerald-950/50 dark:border-emerald-900 shadow-sm">
              <CardContent className="p-6 flex flex-col justify-center h-full">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                    <Target className="h-5 w-5" />
                    <span className="font-medium">{t("dash.dailyGoal")}</span>
                  </div>
                  <span className="text-sm font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 px-2 py-1 rounded-full">
                    {dashboard.todayMinutes} / {dashboard.streak.dailyGoalMinutes} mins
                  </span>
                </div>
                <Progress
                  value={(dashboard.todayMinutes / dashboard.streak.dailyGoalMinutes) * 100}
                  className="h-4 bg-emerald-100 dark:bg-emerald-900"
                />
                <p className="text-sm text-muted-foreground mt-4">
                  {dashboard.todayMinutes >= dashboard.streak.dailyGoalMinutes
                    ? t("dash.goalReached")
                    : `${minsLeft} ${t("dash.minutesLeft")}.`}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                <div className="relative">
                  <Flame className={`h-16 w-16 ${dashboard.streak.dailyGoalCompletedToday ? "text-orange-500 fill-orange-500" : "text-orange-300"}`} />
                  {dashboard.streak.dailyGoalCompletedToday && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 bg-orange-400 rounded-full blur-xl z-[-1]"
                    />
                  )}
                </div>
                <h3 className="text-4xl font-bold text-orange-600 dark:text-orange-400 mt-2">{dashboard.streak.currentStreak}</h3>
                <p className="text-orange-800/80 dark:text-orange-200/80 font-medium">{t("dash.streak")}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { key: "dash.totalXP",     value: dashboard.streak.xp,                                     icon: Star,    color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/50" },
            { key: "dash.ayahsRead",   value: dashboard.totalAyahs,                                    icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/50" },
            { key: "dash.avgAccuracy", value: `${dashboard.quickStats.avgAccuracy}%`,                  icon: Target,  color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/50" },
            { key: "dash.totalTime",   value: `${Math.round(dashboard.quickStats.totalRecordings / 60)}h`, icon: Clock, color: "text-rose-600",   bg: "bg-rose-100 dark:bg-rose-900/50" },
          ].map((stat, i) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t(stat.key)}</p>
                    <h4 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">{stat.value}</h4>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
