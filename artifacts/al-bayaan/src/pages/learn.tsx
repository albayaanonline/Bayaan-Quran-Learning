import { Link } from "wouter";
import { useListSurahs, useGetProgress } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function Learn() {
  const { data: surahs, isLoading: surahsLoading } = useListSurahs();
  const { data: progress } = useGetProgress();
  const [search, setSearch] = useState("");

  const progressMap = useMemo(() => {
    const map = new Map<number, { completedAyahs: number; totalAyahs: number; progressPercent: number; averageScore: number | null }>();
    for (const sp of progress?.surahsProgress ?? []) {
      map.set(sp.surahId, {
        completedAyahs: sp.completedAyahs,
        totalAyahs: sp.totalAyahs,
        progressPercent: (sp as any).progressPercent ?? Math.round((sp.completedAyahs / sp.totalAyahs) * 100),
        averageScore: sp.averageScore ?? null,
      });
    }
    return map;
  }, [progress]);

  const filteredSurahs = surahs?.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nameTranslation.toLowerCase().includes(search.toLowerCase()) ||
      s.number.toString() === search
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-emerald-950 dark:text-emerald-50">Surahs</h1>
            <p className="text-muted-foreground mt-2">
              {progress ? `${progress.totalSurahsStarted} started · ${progress.totalSurahsCompleted} completed` : "Continue your learning journey"}
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600/50" />
            <Input
              placeholder="Search by name or number..."
              className="pl-10 border-emerald-200 focus-visible:ring-emerald-600"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {surahsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSurahs?.map((surah, index) => {
              const sp = progressMap.get(surah.number);
              const progressPercent = sp?.progressPercent ?? 0;
              const isCompleted = progressPercent >= 100;
              const hasStarted = progressPercent > 0;

              return (
                <Link key={surah.number} href={`/learn/${surah.number}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  >
                    <Card className={`hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer h-full border-emerald-100 group ${isCompleted ? "border-emerald-400 bg-emerald-50/50" : ""}`}>
                      <CardContent className="p-5 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-medium text-sm transition-colors
                              ${isCompleted ? "bg-emerald-600 text-white" : "bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white"}`}>
                              {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : surah.number}
                            </div>
                            <div>
                              <h3 className="font-semibold text-emerald-950 dark:text-emerald-50 group-hover:text-emerald-700 transition-colors">
                                {surah.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">{surah.nameTranslation}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-arabic text-xl text-emerald-800 dark:text-emerald-300" style={{ fontFamily: "var(--font-arabic)" }}>
                              {surah.nameArabic}
                            </span>
                            {sp?.averageScore && (
                              <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                                {sp.averageScore}% avg
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-auto">
                          <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span>{surah.revelationType}</span>
                            <span>
                              {hasStarted ? `${sp!.completedAyahs}/${surah.ayahCount} ayahs` : `${surah.ayahCount} Ayahs`}
                            </span>
                          </div>
                          {hasStarted && (
                            <Progress
                              value={progressPercent}
                              className={`h-1.5 ${isCompleted ? "bg-emerald-200" : "bg-emerald-100 dark:bg-emerald-900"}`}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
