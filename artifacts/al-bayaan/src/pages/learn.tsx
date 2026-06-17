import { Link } from "wouter";
import { useListSurahs } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Learn() {
  const { data: surahs, isLoading } = useListSurahs();
  const [search, setSearch] = useState("");

  const filteredSurahs = surahs?.filter(
    (s) =>
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
            <p className="text-muted-foreground mt-2">Continue your learning journey</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600/50" />
            <Input 
              placeholder="Search by name or number..." 
              className="pl-10 border-emerald-200 focus-visible:ring-emerald-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSurahs?.map((surah, index) => (
              <Link key={surah.number} href={`/learn/${surah.number}`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                >
                  <Card className="hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer h-full border-emerald-100 group">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-medium text-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            {surah.number}
                          </div>
                          <div>
                            <h3 className="font-semibold text-emerald-950 dark:text-emerald-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                              {surah.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">{surah.nameTranslation}</p>
                          </div>
                        </div>
                        <span className="font-arabic text-xl text-emerald-800 dark:text-emerald-300" style={{ fontFamily: "var(--font-arabic)" }}>
                          {surah.nameArabic}
                        </span>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                          <span>{surah.revelationType}</span>
                          <span>{surah.ayahCount} Ayahs</span>
                        </div>
                        {surah.hasProgress && (
                          <Progress value={30} className="h-1.5 bg-emerald-100 dark:bg-emerald-900" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
