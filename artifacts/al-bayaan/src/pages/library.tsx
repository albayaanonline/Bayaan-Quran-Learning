import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Search, BookOpen, Star, Clock } from "lucide-react";

interface Book {
  id: string; title: string; titleArabic: string;
  author: string; authorArabic: string; description: string;
  category: string; difficulty: "beginner" | "intermediate" | "advanced";
  lessonCount: number; coverGradient: [string, string]; accentColor: string;
  tags: string[]; featured?: boolean; thumbnailUrl?: string;
}

const CATEGORY_IMAGES: Record<string, string> = {
  quran:    "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=400&q=75",
  arabic:   "https://images.unsplash.com/photo-1527525443983-6e60c75fff46?auto=format&fit=crop&w=400&q=75",
  hadith:   "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=400&q=75",
  fiqh:     "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&w=400&q=75",
  aqeedah:  "https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=400&q=75",
  tafsir:   "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?auto=format&fit=crop&w=400&q=75",
  seerah:   "https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=400&q=75",
  tajweed:  "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=75",
  hingaad:  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=75",
};

const CATEGORIES = [
  { id: "all", label: "All", icon: "📚" },
  { id: "quran", label: "Quran", icon: "📖" },
  { id: "hingaad", label: "Hingaad", icon: "ا" },
  { id: "arabic", label: "Arabic", icon: "🗣️" },
  { id: "fiqh", label: "Fiqh", icon: "⚖️" },
  { id: "aqeedah", label: "Aqeedah", icon: "🌙" },
  { id: "hadith", label: "Hadith", icon: "📜" },
  { id: "tafsir", label: "Tafsir", icon: "✨" },
];

const DIFFICULTY_COLORS = {
  beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  advanced: "bg-red-100 text-red-700 border-red-200",
};

function BookCard({ book, completedLessons, onOpen }: { book: Book; completedLessons: number; onOpen: () => void }) {
  const pct = book.lessonCount > 0 ? Math.round((completedLessons / book.lessonCount) * 100) : 0;
  const started = completedLessons > 0;
  const imgUrl = book.thumbnailUrl ?? CATEGORY_IMAGES[book.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      onClick={onOpen}
      className="group cursor-pointer rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 bg-white flex flex-col"
    >
      {/* Book Cover */}
      <div
        className="relative h-44 flex flex-col items-center justify-center px-4 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${book.coverGradient[0]}, ${book.coverGradient[1]})` }}
      >
        {imgUrl && (
          <img
            src={imgUrl}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-65 transition-opacity duration-300"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute inset-0 bg-[url('/images/geometric-pattern.png')] opacity-5 bg-repeat bg-[length:120px]" />
        {book.featured && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] text-white font-semibold z-10">
            <Star className="h-2.5 w-2.5 fill-current" /> Featured
          </div>
        )}
        {started && (
          <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] text-white font-semibold z-10">
            {pct}% done
          </div>
        )}
        <p className="text-white text-2xl font-arabic text-center relative z-10 leading-relaxed"
          style={{ fontFamily: "var(--font-arabic)", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
          {book.titleArabic}
        </p>
      </div>

      {/* Progress bar */}
      {started && (
        <Progress value={pct} className="h-1 rounded-none" style={{ "--progress-fill": book.accentColor } as any} />
      )}

      {/* Book Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 flex-1">
            {book.title}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{book.author}</p>
        <p className="text-xs text-gray-600 leading-relaxed flex-1 line-clamp-2">{book.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${DIFFICULTY_COLORS[book.difficulty]}`}>
              {book.difficulty}
            </Badge>
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />{book.lessonCount} lessons
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium group-hover:underline">
            {started ? "Continue →" : "Start →"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Library() {
  const [, navigate] = useLocation();
  const [books, setBooks] = useState<Book[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Read URL param for initial category
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) setCategory(cat);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/library/books", { credentials: "include" }),
      fetch("/api/library/progress", { credentials: "include" }),
    ])
      .then(async ([br, pr]) => {
        if (!br.ok) throw new Error("Failed to load books");
        const [bd, pd] = await Promise.all([br.json(), pr.ok ? pr.json() : { progress: [] }]);
        setBooks(bd.books ?? []);
        const map: Record<string, number> = {};
        for (const p of pd.progress ?? []) map[p.bookId] = p.completedLessons;
        setProgressMap(map);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = books.filter(b => {
    const matchesCat = category === "all" || b.category === category;
    const matchesSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const startedCount = Object.keys(progressMap).length;
  const completedCount = books.filter(b => (progressMap[b.id] ?? 0) >= b.lessonCount && b.lessonCount > 0).length;

  const handleOpenBook = (bookId: string) => {
    navigate(`/library/${bookId}`);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-emerald-950 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-emerald-600" />
              Islamic Digital Library
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {books.length} books across {CATEGORIES.length - 1} Islamic sciences
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-bold text-emerald-700">{startedCount}</p>
              <p className="text-[10px] text-muted-foreground">In Progress</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-bold text-emerald-700">{completedCount}</p>
              <p className="text-[10px] text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                category === cat.id
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              <span className={cat.id === "hingaad" ? "font-arabic text-base leading-tight" : ""}>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books, authors, topics…"
            className="pl-10 border-emerald-200"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Error */}
        {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">Error: {error}</p>}

        {/* Books grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
                <Skeleton className="h-44 rounded-none" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No books found</p>
            <p className="text-sm mt-1">Try a different category or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((book, i) => (
              <motion.div key={book.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <BookCard
                  book={book}
                  completedLessons={progressMap[book.id] ?? 0}
                  onOpen={() => handleOpenBook(book.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
