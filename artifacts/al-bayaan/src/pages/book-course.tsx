import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, BookOpen, CheckCircle2, Circle, Lock,
  PlayCircle, ArrowRight, BookMarked, Clock, Star, Video,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  number: number;
  title: string;
  titleArabic: string;
  description: string;
  duration: string;
  type: "video" | "reading" | "practice" | "quiz";
}

interface BookDetail {
  id: string;
  title: string;
  titleArabic: string;
  author: string;
  authorArabic: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  lessonCount: number;
  coverGradient: [string, string];
  accentColor: string;
  tags: string[];
  featured?: boolean;
  lessons: Lesson[];
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  advanced: "bg-red-100 text-red-700 border-red-200",
};

const LESSON_TYPE_ICON: Record<string, React.ReactNode> = {
  video: <Video className="h-3.5 w-3.5" />,
  reading: <BookOpen className="h-3.5 w-3.5" />,
  practice: <PlayCircle className="h-3.5 w-3.5" />,
  quiz: <Star className="h-3.5 w-3.5" />,
};

const CATEGORY_ROUTES: Record<string, string | null> = {
  quran: "/learn",
  arabic: "/video-teacher",
  tajweed: "/tajweed-teacher",
  hingaad: "/tajweed-teacher",
  fiqh: "/video-teacher",
  aqeedah: "/video-teacher",
  hadith: "/video-teacher",
  tafsir: "/video-teacher",
};

export default function BookCourse() {
  const { bookId } = useParams<{ bookId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [savingLesson, setSavingLesson] = useState<number | null>(null);

  useEffect(() => {
    if (!bookId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/library/books/${bookId}`, { credentials: "include" }),
      fetch("/api/library/progress", { credentials: "include" }),
    ])
      .then(async ([br, pr]) => {
        if (!br.ok) throw new Error("Course not found");
        const [bd, pd] = await Promise.all([br.json(), pr.ok ? pr.json() : { progress: [] }]);
        setBook(bd.book);
        const entry = (pd.progress ?? []).find((p: any) => p.bookId === bookId);
        setCompletedLessons(entry?.completedLessons ?? 0);
        // Auto-expand the current lesson
        if (entry?.completedLessons > 0) {
          setExpandedLesson(entry.completedLessons + 1);
        } else {
          setExpandedLesson(1);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookId]);

  const markLessonComplete = useCallback(async (lessonNum: number) => {
    if (!book || savingLesson) return;
    const newCompleted = Math.max(completedLessons, lessonNum);
    setSavingLesson(lessonNum);
    try {
      const res = await fetch(`/api/library/progress/${bookId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedLessons: newCompleted }),
      });
      if (!res.ok) throw new Error("Failed to save progress");
      setCompletedLessons(newCompleted);
      // Move to next lesson
      const next = lessonNum + 1;
      if (next <= book.lessonCount) {
        setExpandedLesson(next);
        toast({ title: "Lesson complete!", description: `Moving to lesson ${next}`, duration: 2000 });
      } else {
        toast({ title: "🎉 Course complete!", description: "You've finished all lessons!", duration: 4000 });
      }
    } catch {
      toast({ title: "Error", description: "Could not save progress. Try again.", variant: "destructive" });
    } finally {
      setSavingLesson(null);
    }
  }, [book, bookId, completedLessons, savingLesson, toast]);

  const openAITeacher = () => {
    const route = book ? CATEGORY_ROUTES[book.category] : null;
    if (route) navigate(route);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 rounded-2xl" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !book) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto text-center py-20">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="text-xl font-bold text-emerald-950 mb-2">Course Not Found</h2>
          <p className="text-muted-foreground mb-6">{error ?? "This course could not be loaded."}</p>
          <Button onClick={() => navigate("/library")} variant="outline">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Library
          </Button>
        </div>
      </AppLayout>
    );
  }

  const pct = book.lessonCount > 0 ? Math.round((completedLessons / book.lessonCount) * 100) : 0;
  const currentLesson = completedLessons + 1;
  const isComplete = completedLessons >= book.lessonCount;
  const aiRoute = CATEGORY_ROUTES[book.category];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        {/* Back */}
        <button
          onClick={() => navigate("/library")}
          className="flex items-center gap-1.5 text-sm text-emerald-700 hover:text-emerald-900 transition-colors font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Library
        </button>

        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden border border-emerald-100 shadow-md"
        >
          <div
            className="relative px-8 py-10"
            style={{ background: `linear-gradient(135deg, ${book.coverGradient[0]}, ${book.coverGradient[1]})` }}
          >
            <div className="absolute inset-0 bg-[url('/images/geometric-pattern.png')] opacity-5 bg-repeat bg-[length:120px]" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className={`text-xs border ${DIFFICULTY_COLORS[book.difficulty]} bg-white/90`}>
                    {DIFFICULTY_LABELS[book.difficulty]}
                  </Badge>
                  <Badge className="text-xs bg-white/20 text-white border-white/30">
                    {book.category.charAt(0).toUpperCase() + book.category.slice(1)}
                  </Badge>
                  {book.featured && (
                    <Badge className="text-xs bg-yellow-400/20 text-yellow-200 border-yellow-300/30">
                      <Star className="h-2.5 w-2.5 mr-1" /> Featured
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-1 leading-tight">
                  {book.title}
                </h1>
                <p
                  className="text-white/70 font-arabic text-xl mb-4"
                  style={{ fontFamily: "var(--font-arabic)" }}
                >
                  {book.titleArabic}
                </p>
                <p className="text-white/60 text-sm mb-4">by {book.author}</p>
                <p className="text-white/80 text-sm leading-relaxed max-w-xl">{book.description}</p>
              </div>

              {/* Course CTA */}
              <div className="shrink-0 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 min-w-[200px]">
                <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  {book.lessonCount} lessons
                </div>
                {!isComplete ? (
                  <>
                    <p className="text-white text-sm font-semibold mb-2">
                      {completedLessons === 0 ? "Not started" : `Lesson ${completedLessons} of ${book.lessonCount}`}
                    </p>
                    <Progress value={pct} className="h-2 bg-white/20 mb-4" />
                    <Button
                      className="w-full bg-white text-emerald-900 hover:bg-white/90 font-semibold shadow-sm"
                      onClick={() => navigate(`/library/${bookId}/lesson/${currentLesson}`)}
                    >
                      {completedLessons === 0 ? "Start Learning" : "Continue"}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-white text-sm font-semibold mb-2">Course Complete! 🎉</p>
                    <Progress value={100} className="h-2 bg-white/20 mb-4" />
                    <Button
                      className="w-full bg-white text-emerald-900 hover:bg-white/90 font-semibold"
                      onClick={() => navigate("/certificates")}
                    >
                      <Star className="h-4 w-4 mr-1" /> View Certificate
                    </Button>
                  </>
                )}
                {aiRoute && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-white/70 hover:text-white hover:bg-white/10 text-xs"
                    onClick={openAITeacher}
                  >
                    <Video className="h-3.5 w-3.5 mr-1.5" />
                    Open AI Teacher
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white px-8 py-3 flex flex-wrap gap-2 border-t border-emerald-50">
            {book.tags.map(tag => (
              <span key={tag} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Completed", value: `${completedLessons}`, sub: `of ${book.lessonCount}` },
            { label: "Progress", value: `${pct}%`, sub: "done" },
            { label: isComplete ? "Status" : "Up Next", value: isComplete ? "Done ✓" : `Lesson ${currentLesson}`, sub: isComplete ? "All complete" : "current" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-emerald-100 rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-emerald-800">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className="text-[10px] text-emerald-600">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Lessons List */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookMarked className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-serif font-bold text-emerald-950">Curriculum</h2>
            <span className="text-sm text-muted-foreground">({book.lessonCount} lessons)</span>
          </div>

          <div className="space-y-2">
            {book.lessons.map((lesson, idx) => {
              const isCompleted = lesson.number <= completedLessons;
              const isCurrent = lesson.number === currentLesson && !isComplete;
              const isLocked = lesson.number > currentLesson;
              const isExpanded = expandedLesson === lesson.number;

              return (
                <motion.div
                  key={lesson.number}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                  className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                    isCurrent
                      ? "border-emerald-400 shadow-sm bg-emerald-50/50"
                      : isCompleted
                      ? "border-emerald-100 bg-white"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  {/* Lesson Header */}
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-emerald-50/50 transition-colors"
                    onClick={() => {
                      if (!isLocked) setExpandedLesson(isExpanded ? null : lesson.number);
                    }}
                  >
                    {/* Status Icon */}
                    <div className="shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : isCurrent ? (
                        <PlayCircle className="h-5 w-5 text-emerald-600" />
                      ) : isLocked ? (
                        <Lock className="h-5 w-5 text-gray-300" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" />
                      )}
                    </div>

                    {/* Number */}
                    <span
                      className={`text-xs font-bold w-7 shrink-0 ${
                        isCompleted ? "text-emerald-600" : isCurrent ? "text-emerald-700" : "text-gray-400"
                      }`}
                    >
                      {lesson.number}
                    </span>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isLocked ? "text-gray-400" : isCompleted ? "text-emerald-900" : isCurrent ? "text-emerald-900 font-semibold" : "text-gray-700"
                        }`}
                      >
                        {lesson.title}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] bg-emerald-600 text-white rounded-full px-2 py-0.5 font-normal">
                            Current
                          </span>
                        )}
                      </p>
                      <p
                        className="text-[10px] text-muted-foreground font-arabic"
                        style={{ fontFamily: "var(--font-arabic)", direction: "rtl" }}
                      >
                        {lesson.titleArabic}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`flex items-center gap-1 text-[10px] ${isLocked ? "text-gray-300" : "text-muted-foreground"}`}>
                        {LESSON_TYPE_ICON[lesson.type]}
                        {lesson.duration}
                      </span>
                      {!isLocked && (
                        isExpanded
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && !isLocked && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 border-t border-emerald-100 bg-white">
                          <p className="text-sm text-gray-600 leading-relaxed mt-3 mb-4">
                            {lesson.description}
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            {/* Primary action: open the lesson page */}
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => navigate(`/library/${bookId}/lesson/${lesson.number}`)}
                            >
                              {isCompleted ? (
                                <><BookOpen className="h-3.5 w-3.5 mr-1.5" />Review Lesson</>
                              ) : isCurrent ? (
                                <><PlayCircle className="h-3.5 w-3.5 mr-1.5" />Start Lesson</>
                              ) : (
                                <><BookOpen className="h-3.5 w-3.5 mr-1.5" />Open Lesson</>
                              )}
                            </Button>
                            {isCompleted && (
                              <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                                <CheckCircle2 className="h-4 w-4" /> Completed
                              </span>
                            )}
                            {aiRoute && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={openAITeacher}
                              >
                                <Video className="h-3.5 w-3.5 mr-1.5" />
                                Ask AI Teacher
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
