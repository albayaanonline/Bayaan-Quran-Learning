import { Link } from "wouter";
import { useListSurahs, useGetProgress } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, BookOpen } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function Learn() {
  const { t } = useI18n();
  const { data: surahs, isLoading: surahsLoading, isError: surahsError, refetch: refetchSurahs } = useListSurahs();
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
      <div className="max-w-6xl mx-auto space-y-8 page-enter">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold">{t("learn.title")}</h1>
            <p className="text-muted-foreground mt-2">
              {progress ? `${progress.totalSurahsStarted} ${t("learn.started")} · ${progress.totalSurahsCompleted} ${t("learn.completed")}` : t("learn.subtitle")}
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-700/50" />
            <Input
              placeholder={t("learn.searchPlaceholder")}
              className="pl-10 border-blue-200 focus-visible:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {surahsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl shimmer" />)}
          </div>
        ) : filteredSurahs?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
            <BookOpen className="h-10 w-10 opacity-30" />
            <p className="text-sm">{t("learn.noResults") || "No surahs found"}</p>
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
                    transition={{ delay: Math.min(index * 0.04, 0.4) }}
                    className="h-full"
                  >
                    <Card className={`card-premium cursor-pointer h-full transition-all duration-200 group ${
                      isCompleted
                        ? "border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50/80 to-teal-50/40 dark:from-blue-950/60 dark:to-teal-950/30"
                        : "hover:border-primary/40"
                    }`}>
                      <CardContent className="p-5 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                              isCompleted
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-500 dark:shadow-blue-500"
                                : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
                            }`}>
                              {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : surah.number}
                            </div>
                            <div>
                              <h3 className="font-semibold group-hover:text-primary transition-colors">
                                {surah.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">{surah.nameTranslation}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                            <span className="font-arabic text-xl text-foreground/70" style={{ fontFamily: "var(--font-arabic)" }}>
                              {surah.nameArabic}
                            </span>
                            {sp?.averageScore && (
                              <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">
                                {sp.averageScore}%
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mt-auto">
                          <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground/70 text-[10px]">
                              {surah.revelationType}
                            </span>
                            <span>
                              {hasStarted ? `${sp?.completedAyahs ?? 0}/${surah.ayahCount} ayahs` : `${surah.ayahCount} ayahs`}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${isCompleted ? "bg-blue-600" : "bg-primary/60"}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
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
