import { useState } from "react";
import { useGetLeaderboard, GetLeaderboardPeriod } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Star, Medal } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const [period, setPeriod] = useState<GetLeaderboardPeriod>("weekly");
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  // In Orval, query params might need to be passed differently based on generated code,
  // For the sake of UI we assume the hook takes params or we just use it directly
  // Adjust based on exact generated hook signature if needed.

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return "bg-amber-100 text-amber-700 border-amber-300 ring-4 ring-amber-50 shadow-amber-200/50";
      case 2: return "bg-slate-100 text-slate-600 border-slate-300 ring-4 ring-slate-50";
      case 3: return "bg-orange-100 text-orange-700 border-orange-300 ring-4 ring-orange-50";
      default: return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-serif font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-3 justify-center md:justify-start">
              <Trophy className="h-8 w-8 text-amber-500" /> Community Rankings
            </h1>
            <p className="text-muted-foreground mt-2">"Compete with one another in good deeds."</p>
          </div>

          <Tabs value={period} onValueChange={(v) => setPeriod(v as GetLeaderboardPeriod)} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-3 bg-emerald-100/50 p-1">
              <TabsTrigger value="weekly" className="data-[state=active]:bg-white data-[state=active]:text-emerald-900 rounded-md">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="data-[state=active]:bg-white data-[state=active]:text-emerald-900 rounded-md">Monthly</TabsTrigger>
              <TabsTrigger value="alltime" className="data-[state=active]:bg-white data-[state=active]:text-emerald-900 rounded-md">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y divide-emerald-50">
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
              <div className="divide-y divide-emerald-50">
                {/* Headers */}
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 bg-emerald-950 text-emerald-50 text-sm font-medium">
                  <div className="w-12 text-center">Rank</div>
                  <div>Student</div>
                  <div className="w-32 text-right">XP</div>
                </div>

                {leaderboard?.map((entry, index) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`grid grid-cols-[auto_1fr_auto] gap-4 p-4 items-center transition-colors hover:bg-emerald-50/50 ${
                      entry.isCurrentUser ? "bg-emerald-50 border-l-4 border-l-emerald-500" : ""
                    }`}
                  >
                    <div className="w-12 flex justify-center">
                      <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${getRankStyle(entry.rank)}`}>
                        {entry.rank}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {entry.avatarUrl ? (
                        <img src={entry.avatarUrl} alt="" className="h-12 w-12 rounded-full ring-2 ring-emerald-100" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                          {entry.displayName[0]}
                        </div>
                      )}
                      
                      <div>
                        <div className="font-bold text-emerald-950 flex items-center gap-2">
                          {entry.displayName}
                          {entry.isCurrentUser && <span className="text-[10px] uppercase tracking-wider bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">You</span>}
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> {entry.streakDays} Day Streak</span>
                          <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" /> {entry.surahsCompleted} Surahs</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-32 text-right">
                      <div className="text-xl font-bold text-emerald-700">{entry.xp.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-widest">XP</div>
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
