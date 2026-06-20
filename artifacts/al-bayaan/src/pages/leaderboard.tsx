import { useState } from "react";
import { useGetLeaderboard, GetLeaderboardPeriod } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Star, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function Leaderboard() {
  const { t } = useI18n();
  const [period, setPeriod] = useState<GetLeaderboardPeriod>("weekly");
  const { data: leaderboard, isLoading } = useGetLeaderboard({ period });

  // In Orval, query params might need to be passed differently based on generated code,
  // For the sake of UI we assume the hook takes params or we just use it directly
  // Adjust based on exact generated hook signature if needed.

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return "bg-amber-100 text-amber-700 border-amber-300 ring-4 ring-amber-50 shadow-amber-200/50";
      case 2: return "bg-slate-100 text-slate-600 border-slate-300 ring-4 ring-slate-50";
      case 3: return "bg-orange-100 text-orange-700 border-orange-300 ring-4 ring-orange-50";
      default: return "bg-blue-50 text-blue-800 border-blue-100";
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-blue-50 flex items-center gap-3 justify-center md:justify-start">
              <Trophy className="h-8 w-8 text-amber-500" /> {t("ldr.title")}
            </h1>
            <p className="text-muted-foreground mt-2">"{t("ldr.hadith")}"</p>
          </div>

          <Tabs value={period} onValueChange={(v) => setPeriod(v as GetLeaderboardPeriod)} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-3 bg-blue-100/50 p-1">
              <TabsTrigger value="weekly" className="data-[state=active]:bg-white data-[state=active]:text-blue-950 rounded-md">{t("ldr.weekly")}</TabsTrigger>
              <TabsTrigger value="monthly" className="data-[state=active]:bg-white data-[state=active]:text-blue-950 rounded-md">{t("ldr.monthly")}</TabsTrigger>
              <TabsTrigger value="alltime" className="data-[state=active]:bg-white data-[state=active]:text-blue-950 rounded-md">{t("ldr.alltime")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y divide-blue-50">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-6 flex-1" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-blue-50">
                {/* Headers */}
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 bg-blue-950 text-blue-50 text-sm font-medium">
                  <div className="w-12 text-center">{t("ldr.rank")}</div>
                  <div>{t("ldr.student")}</div>
                  <div className="w-32 text-right">{t("ldr.xp")}</div>
                </div>

                {leaderboard?.map((entry, index) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`grid grid-cols-[auto_1fr_auto] gap-4 p-4 items-center transition-colors hover:bg-blue-50/50 ${
                      entry.isCurrentUser ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                    }`}
                  >
                    <div className="w-12 flex justify-center">
                      <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${getRankStyle(entry.rank)}`}>
                        {entry.rank}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {entry.avatarUrl ? (
                        <img src={entry.avatarUrl} alt="" className="h-12 w-12 rounded-full ring-2 ring-blue-500" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-lg">
                          {entry.displayName[0]}
                        </div>
                      )}
                      
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {entry.displayName}
                          {entry.isCurrentUser && <span className="text-[10px] uppercase tracking-wider bg-teal-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">{t("ldr.you")}</span>}
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> {entry.streakDays} {t("ldr.dayStreak")}</span>
                          <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" /> {entry.surahsCompleted} {t("ldr.surahs")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-32 text-right">
                      <div className="text-xl font-bold text-blue-800">{entry.xp.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-widest">{t("ldr.xp")}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
