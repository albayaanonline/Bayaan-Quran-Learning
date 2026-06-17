import { useListAchievements } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, Flame, Book, Mic, Trophy, Medal, Crown, Heart, Moon, Sun, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function Achievements() {
  const { data: achievements, isLoading } = useListAchievements();

  const getIcon = (type: string, unlocked: boolean) => {
    const props = { 
      className: `h-8 w-8 ${unlocked ? "text-amber-500" : "text-emerald-200"}`,
      strokeWidth: unlocked ? 2.5 : 2 
    };
    switch (type) {
      case 'star': return <Star {...props} />;
      case 'flame': return <Flame {...props} />;
      case 'book': return <Book {...props} />;
      case 'mic': return <Mic {...props} />;
      case 'trophy': return <Trophy {...props} />;
      case 'medal': return <Medal {...props} />;
      case 'crown': return <Crown {...props} />;
      case 'heart': return <Heart {...props} />;
      case 'moon': return <Moon {...props} />;
      case 'sun': return <Sun {...props} />;
      default: return <Award {...props} />;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-emerald-950 dark:text-emerald-50">Achievements</h1>
          <p className="text-muted-foreground mt-2">Earn rewards for your dedication</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {achievements?.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`h-full border-2 transition-all ${
                  achievement.isUnlocked 
                    ? "border-amber-200 bg-gradient-to-b from-amber-50/50 to-white shadow-md hover:shadow-lg hover:-translate-y-1" 
                    : "border-emerald-50 bg-emerald-50/30 opacity-70 grayscale-[0.5]"
                }`}>
                  <CardContent className="p-6 flex flex-col items-center text-center h-full relative overflow-hidden">
                    {achievement.isUnlocked && (
                      <div className="absolute -top-4 -right-4 h-16 w-16 bg-amber-100 rounded-full blur-xl opacity-60"></div>
                    )}
                    
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
                      achievement.isUnlocked ? "bg-amber-100" : "bg-emerald-100"
                    }`}>
                      {getIcon(achievement.iconType, achievement.isUnlocked)}
                    </div>
                    
                    <h3 className={`font-bold mb-2 ${achievement.isUnlocked ? "text-emerald-950" : "text-emerald-800"}`}>
                      {achievement.title}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground mb-4 flex-1">
                      {achievement.description}
                    </p>
                    
                    <div className="w-full mt-auto">
                      {achievement.isUnlocked ? (
                        <div className="text-xs font-bold text-amber-600 bg-amber-100 py-1.5 px-3 rounded-full inline-block">
                          +{achievement.xpReward} XP
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Progress value={achievement.progress || 0} className="h-1.5 bg-emerald-100" />
                          <div className="text-[10px] font-medium text-emerald-600 text-right">
                            {achievement.progress}%
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
