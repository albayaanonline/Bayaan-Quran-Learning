import { useListAchievements } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, Flame, Book, Mic, Trophy, Medal, Crown, Heart, Moon, Sun, Award, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function Achievements() {
  const { t } = useI18n();
  const { data: achievements, isLoading } = useListAchievements();

  const getIcon = (type: string, unlocked: boolean) => {
    const cls = `h-9 w-9 ${unlocked ? "text-amber-500 drop-shadow-sm" : "text-muted-foreground/40"}`;
    const sw = unlocked ? 2 : 1.5;
    switch (type) {
      case 'star':   return <Star   className={cls} strokeWidth={sw} />;
      case 'flame':  return <Flame  className={cls} strokeWidth={sw} />;
      case 'book':   return <Book   className={cls} strokeWidth={sw} />;
      case 'mic':    return <Mic    className={cls} strokeWidth={sw} />;
      case 'trophy': return <Trophy className={cls} strokeWidth={sw} />;
      case 'medal':  return <Medal  className={cls} strokeWidth={sw} />;
      case 'crown':  return <Crown  className={cls} strokeWidth={sw} />;
      case 'heart':  return <Heart  className={cls} strokeWidth={sw} />;
      case 'moon':   return <Moon   className={cls} strokeWidth={sw} />;
      case 'sun':    return <Sun    className={cls} strokeWidth={sw} />;
      default:       return <Award  className={cls} strokeWidth={sw} />;
    }
  };

  const unlocked = achievements?.filter((a) => a.isUnlocked) ?? [];
  const locked   = achievements?.filter((a) => !a.isUnlocked) ?? [];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 page-enter">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold">{t("ach.title")}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{t("ach.subtitle")}</p>
          </div>
          {!isLoading && achievements && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50"
            >
              <Trophy className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                  {unlocked.length} / {achievements.length}
                </p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Unlocked</p>
              </div>
            </motion.div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl shimmer" />
            ))}
          </div>
        ) : (
          <>
            {/* Unlocked achievements */}
            {unlocked.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">
                  🏆 Unlocked ({unlocked.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {unlocked.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.85, y: 16 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.06, type: "spring", stiffness: 200 }}
                    >
                      <Card className="h-full border-2 border-amber-200 dark:border-amber-800/60 bg-gradient-to-b from-amber-50/80 to-white dark:from-amber-950/30 dark:to-card shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 group cursor-default">
                        <CardContent className="p-5 flex flex-col items-center text-center h-full relative overflow-hidden">
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-full group-hover:translate-x-full duration-700 pointer-events-none" />

                          {/* Icon in circle */}
                          <div className="relative mb-3">
                            <div className="h-16 w-16 rounded-full badge-unlocked flex items-center justify-center shadow-md">
                              {getIcon(achievement.iconType, true)}
                            </div>
                            <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                              <Star className="h-2.5 w-2.5 fill-white text-white" />
                            </div>
                          </div>

                          <h3 className="font-bold text-sm leading-tight mb-1">{achievement.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed flex-1">{achievement.description}</p>

                          {achievement.isUnlocked && achievement.unlockedAt && (
                            <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60 mt-2">
                              ✓ {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </p>
                          )}

                          {achievement.maxProgress && achievement.maxProgress > 1 && (
                            <div className="w-full mt-3">
                              <Progress value={100} className="h-1.5 bg-amber-100 dark:bg-amber-900/50" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked achievements */}
            {locked.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">
                  🔒 In Progress ({locked.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {locked.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.04 }}
                    >
                      <Card className="h-full border border-border bg-card/50 hover:border-primary/20 hover:bg-card transition-all duration-200 cursor-default">
                        <CardContent className="p-5 flex flex-col items-center text-center h-full">
                          <div className="relative mb-3">
                            <div className="h-16 w-16 rounded-full badge-locked flex items-center justify-center">
                              {getIcon(achievement.iconType, false)}
                            </div>
                            <div className="absolute -top-1 -right-1 h-5 w-5 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                              <Lock className="h-2.5 w-2.5 text-muted-foreground/60" />
                            </div>
                          </div>

                          <h3 className="font-semibold text-sm leading-tight mb-1 text-muted-foreground">{achievement.title}</h3>
                          <p className="text-xs text-muted-foreground/70 leading-relaxed flex-1">{achievement.description}</p>

                          {achievement.maxProgress && achievement.currentProgress !== undefined && (
                            <div className="w-full mt-3 space-y-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>{achievement.currentProgress ?? 0}</span>
                                <span>{achievement.maxProgress}</span>
                              </div>
                              <Progress
                                value={((achievement.currentProgress ?? 0) / achievement.maxProgress) * 100}
                                className="h-1.5"
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {(!achievements || achievements.length === 0) && (
              <div className="text-center py-20 text-muted-foreground">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
                <p className="font-medium">Start learning to earn your first achievement!</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
