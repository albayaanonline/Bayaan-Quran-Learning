import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useGetSurah, useListAyahs, useGetSurahProgress } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Mic, ArrowLeft, ArrowRight, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SurahDetail() {
  const params = useParams();
  const surahId = parseInt(params.surahId || "1");
  
  const { data: surah, isLoading: surahLoading } = useGetSurah(surahId);
  const { data: ayahs, isLoading: ayahsLoading } = useListAyahs(surahId);
  const { data: progress } = useGetSurahProgress(surahId);

  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [simulatedScore, setSimulatedScore] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize index from progress if available
  useEffect(() => {
    if (progress && ayahs && currentAyahIndex === 0) {
      const idx = Math.min(progress.completedAyahs, ayahs.length - 1);
      setCurrentAyahIndex(idx);
    }
  }, [progress, ayahs, currentAyahIndex]);

  const currentAyah = ayahs?.[currentAyahIndex];

  // Helper to format CDN URL
  const getAudioUrl = () => {
    if (!currentAyah) return "";
    const surahPadded = surahId.toString().padStart(3, "0");
    const ayahPadded = currentAyah.numberInSurah.toString().padStart(3, "0");
    return `https://everyayah.com/data/Alafasy_128kbps/${surahPadded}${ayahPadded}.mp3`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.src = getAudioUrl();
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (ayahs && currentAyahIndex < ayahs.length - 1) {
      setCurrentAyahIndex(prev => prev + 1);
      setShowFeedback(false);
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentAyahIndex > 0) {
      setCurrentAyahIndex(prev => prev - 1);
      setShowFeedback(false);
      setIsPlaying(false);
    }
  };

  // Simulate AI recording
  const handleRecordDown = () => {
    setIsRecording(true);
    setShowFeedback(false);
  };

  const handleRecordUp = () => {
    setIsRecording(false);
    // Simulate processing delay
    setTimeout(() => {
      setSimulatedScore(Math.floor(Math.random() * 30) + 70); // 70-100 range
      setShowFeedback(true);
    }, 1000);
  };

  if (surahLoading || ayahsLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-[60vh] w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!surah || !ayahs || !currentAyah) return <AppLayout><div>Failed to load data</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <Link href="/learn" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6 font-medium">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Surahs
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-emerald-950 dark:text-emerald-50 mb-2">{surah.name}</h1>
          <p className="font-arabic text-2xl text-emerald-800 dark:text-emerald-300" style={{ fontFamily: "var(--font-arabic)" }}>{surah.nameArabic}</p>
        </div>

        {/* The Beautiful Quran Card */}
        <div className="relative mb-8">
          <Card className="overflow-hidden border-2 border-emerald-100 shadow-2xl bg-[#fdfdfc] dark:bg-emerald-950/80">
            {/* Decorative border */}
            <div className="absolute inset-0 pointer-events-none opacity-5 dark:opacity-10 bg-[url('/images/geometric-pattern.png')] bg-cover mix-blend-multiply"></div>
            
            <CardContent className="p-8 md:p-12 relative z-10 flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-10 text-emerald-600/60 text-sm font-medium">
                <span>Surah {surahId}</span>
                <span>Ayah {currentAyah.numberInSurah} of {surah.ayahCount}</span>
              </div>

              <div className="flex-1 flex items-center justify-center py-10">
                <p 
                  className="text-4xl md:text-5xl lg:text-6xl text-center leading-[2] md:leading-[2.5] text-emerald-950 dark:text-emerald-50" 
                  style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}
                >
                  {currentAyah.text}
                  <span className="inline-block mx-2 text-2xl text-emerald-500/50">﴾{currentAyah.numberInSurah}﴿</span>
                </p>
              </div>

              {/* Controls */}
              <div className="mt-10 flex items-center justify-center gap-6">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={togglePlay}
                  className="h-14 w-14 rounded-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                </Button>

                <div 
                  className="relative"
                  onMouseDown={handleRecordDown}
                  onMouseUp={handleRecordUp}
                  onMouseLeave={() => isRecording && handleRecordUp()}
                  onTouchStart={handleRecordDown}
                  onTouchEnd={handleRecordUp}
                >
                  <Button 
                    size="icon" 
                    className={`h-20 w-20 rounded-full transition-all shadow-lg ${
                      isRecording 
                        ? "bg-red-500 hover:bg-red-600 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]" 
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    <Mic className={`h-8 w-8 text-white ${isRecording ? "animate-pulse" : ""}`} />
                  </Button>
                  
                  {isRecording && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-medium text-red-500 animate-pulse">
                      Recording... Release to analyze
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Overlay */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-12">
            <Button variant="ghost" size="icon" onClick={handlePrev} disabled={currentAyahIndex === 0} className="rounded-full bg-white shadow-md text-emerald-700 hover:text-emerald-900 disabled:opacity-30">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-12">
            <Button variant="ghost" size="icon" onClick={handleNext} disabled={currentAyahIndex === ayahs.length - 1} className="rounded-full bg-white shadow-md text-emerald-700 hover:text-emerald-900 disabled:opacity-30">
              <ArrowRight className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* AI Feedback Panel */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="border-emerald-200 shadow-md overflow-hidden bg-gradient-to-br from-white to-emerald-50 dark:from-emerald-950 dark:to-emerald-900">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    
                    {/* Score Circle */}
                    <div className="shrink-0 flex flex-col items-center">
                      <div className={`relative h-32 w-32 rounded-full flex items-center justify-center border-8 ${
                        simulatedScore >= 90 ? "border-emerald-500 text-emerald-600" :
                        simulatedScore >= 80 ? "border-amber-500 text-amber-600" : "border-red-500 text-red-600"
                      }`}>
                        <span className="text-4xl font-bold">{simulatedScore}</span>
                      </div>
                      <span className="mt-3 font-medium text-emerald-950 dark:text-emerald-100">Overall Score</span>
                    </div>

                    {/* Detailed Bars */}
                    <div className="flex-1 w-full space-y-4">
                      <h3 className="font-semibold text-lg text-emerald-950 dark:text-emerald-50 mb-2">AI Analysis</h3>
                      
                      {[
                        { label: "Tajweed", score: simulatedScore + (Math.random() * 10 - 5) },
                        { label: "Pronunciation", score: simulatedScore + (Math.random() * 10 - 5) },
                        { label: "Fluency", score: simulatedScore + (Math.random() * 10 - 5) }
                      ].map(metric => {
                        const s = Math.min(100, Math.max(0, Math.round(metric.score)));
                        return (
                          <div key={metric.label}>
                            <div className="flex justify-between text-sm mb-1 font-medium text-emerald-800 dark:text-emerald-200">
                              <span>{metric.label}</span>
                              <span>{s}%</span>
                            </div>
                            <div className="h-2 w-full bg-emerald-100 dark:bg-emerald-950 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${s >= 90 ? 'bg-emerald-500' : s >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${s}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}

                      <div className="pt-4 flex gap-3 mt-4 border-t border-emerald-100/50">
                        <Button variant="outline" className="flex-1" onClick={() => setShowFeedback(false)}>
                          <RotateCcw className="mr-2 h-4 w-4" /> Try Again
                        </Button>
                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleNext}>
                          Next Ayah <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      </div>
    </AppLayout>
  );
}
