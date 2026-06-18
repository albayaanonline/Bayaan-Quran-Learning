import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";
import {
  BookOpen, Mic, Trophy, ArrowRight, Star, Users, Zap, Brain,
  ShieldCheck, Globe, Play, ChevronDown,
} from "lucide-react";

const PROGRAMS = [
  { id: "quran", icon: "📖", title: "Quran", titleAr: "القرآن الكريم", desc: "Master recitation and Tajweed with real-time AI feedback", color: "from-emerald-950 to-emerald-900", border: "border-emerald-800/40" },
  { id: "hingaad", icon: "ا", title: "Hingaad", titleAr: "هنقاد", desc: "Learn Arabic reading from the letters up — the Baghdadi method", color: "from-violet-950 to-violet-900", border: "border-violet-800/40" },
  { id: "arabic", icon: "🗣️", title: "Arabic Language", titleAr: "اللغة العربية", desc: "Complete Arabic language courses for all levels", color: "from-blue-950 to-blue-900", border: "border-blue-800/40" },
  { id: "fiqh", icon: "⚖️", title: "Fiqh", titleAr: "الفقه الإسلامي", desc: "Structured Islamic jurisprudence curriculum with exams", color: "from-green-950 to-green-900", border: "border-green-800/40" },
  { id: "aqeedah", icon: "🌙", title: "Aqeedah", titleAr: "علم العقيدة", desc: "Study the core principles of Islamic belief and theology", color: "from-purple-950 to-purple-900", border: "border-purple-800/40" },
  { id: "hadith", icon: "📜", title: "Hadith", titleAr: "علوم الحديث", desc: "Learn prophetic traditions with sciences and commentary", color: "from-amber-950 to-amber-900", border: "border-amber-800/40" },
];

const QARIS = [
  { name: "Mishary Alafasy", country: "Kuwait", style: "Murattal", initials: "MA" },
  { name: "Abdul Basit", country: "Egypt", style: "Mujawwad", initials: "AB" },
  { name: "Al-Husary", country: "Egypt", style: "Murattal", initials: "AH" },
  { name: "As-Sudais", country: "Saudi Arabia", style: "Murattal", initials: "AS" },
  { name: "Al-Minshawi", country: "Egypt", style: "Murattal", initials: "AM" },
  { name: "Maher Al Muaiqly", country: "Saudi Arabia", style: "Murattal", initials: "MM" },
];

const STATS = [
  { value: "114", label: "Surahs", sub: "Full Quran" },
  { value: "6,236", label: "Ayahs", sub: "With Tajweed" },
  { value: "6+", label: "Programs", sub: "Islamic Sciences" },
  { value: "AI", label: "Powered", sub: "Real Feedback" },
];

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white overflow-x-hidden">
      {/* ── NAV ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-[#0a0f0a]/80 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Al Bayaan" className="h-7 w-auto brightness-0 invert" />
          <span className="font-semibold text-white/90 text-sm tracking-wide">Al Bayaan</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/sign-in" className="hover:text-white transition-colors">Programs</Link>
          <Link href="/sign-in" className="hover:text-white transition-colors">Library</Link>
          <Link href="/sign-in" className="hover:text-white transition-colors">AI Teacher</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 text-sm">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full px-5 text-sm shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              Get Started Free
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20">
        {/* Ambient bg */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
          {/* Islamic geometric pattern overlay */}
          <div className="absolute inset-0 bg-[url('/images/geometric-pattern.png')] opacity-[0.035] bg-repeat bg-[length:300px]" />
          {/* Grid */}
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300 mb-10 backdrop-blur-sm"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            AI-Powered Islamic Education Platform
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              className="text-7xl md:text-8xl lg:text-[110px] font-arabic text-white/95 leading-none mb-4 tracking-tight"
              style={{ fontFamily: "var(--font-arabic)", lineHeight: 1.15 }}
            >
              البيان
            </h1>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white/85 leading-tight mt-2">
              Perfect your recitation.<br className="hidden md:block" />
              <span className="text-emerald-400">Master your Deen.</span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8 text-lg text-white/50 max-w-2xl mx-auto leading-relaxed"
          >
            The world's most advanced Islamic learning platform — from Quran recitation to Fiqh, Arabic to Aqeedah. Powered by real AI. Built for every Muslim.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/sign-up">
              <Button size="lg" className="h-13 px-8 text-base bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full shadow-[0_0_40px_rgba(52,211,153,0.25)] hover:shadow-[0_0_60px_rgba(52,211,153,0.4)] transition-all duration-300">
                Start Learning Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="ghost" className="h-13 px-8 text-base text-white/70 hover:text-white hover:bg-white/5 rounded-full border border-white/10">
                <Play className="mr-2 h-4 w-4 fill-current" />
                Watch Demo
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-6 text-xs text-white/30"
          >
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Authentic Islamic content</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-emerald-500" /> Real AI — no fake scores</span>
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-emerald-500" /> Available in English, Arabic & Somali</span>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/20"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section className="relative py-20 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.08} className="text-center">
                <div className="text-4xl md:text-5xl font-serif text-emerald-400 font-bold">{stat.value}</div>
                <div className="text-white/80 font-medium mt-1">{stat.label}</div>
                <div className="text-white/30 text-xs mt-0.5">{stat.sub}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROGRAMS ──────────────────────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="container mx-auto">
          <FadeIn className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs text-emerald-400 tracking-[0.3em] uppercase font-medium mb-4">Complete Islamic Curriculum</div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white leading-tight">
              Six programs, one platform.
            </h2>
            <p className="mt-5 text-white/50 text-lg leading-relaxed">
              Whether you're starting from the Arabic alphabet or studying advanced jurisprudence — Al Bayaan has a structured path for you.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROGRAMS.map((prog, i) => (
              <FadeIn key={prog.id} delay={i * 0.06}>
                <Link href="/sign-up">
                  <div className={`group relative overflow-hidden rounded-2xl border ${prog.border} bg-gradient-to-br ${prog.color} p-6 cursor-pointer hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/20 min-h-[200px] flex flex-col`}>
                    <div className="absolute inset-0 bg-[url('/images/geometric-pattern.png')] opacity-[0.05] bg-repeat bg-[length:200px]" />
                    <div className="relative z-10 flex-1 flex flex-col">
                      <div className="text-4xl mb-4 font-arabic" style={prog.id === "hingaad" ? { fontFamily: "var(--font-arabic)", fontSize: "2.5rem" } : {}}>{prog.icon}</div>
                      <h3 className="text-xl font-bold text-white mb-1">{prog.title}</h3>
                      <p className="text-sm font-arabic text-white/40 mb-3" style={{ fontFamily: "var(--font-arabic)" }}>{prog.titleAr}</p>
                      <p className="text-sm text-white/60 leading-relaxed flex-1">{prog.desc}</p>
                      <div className="mt-4 flex items-center text-xs text-white/40 group-hover:text-white/70 transition-colors">
                        Explore program <ArrowRight className="ml-1.5 h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="py-28 px-4 bg-white/[0.02] border-y border-white/5">
        <div className="container mx-auto">
          <FadeIn className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs text-emerald-400 tracking-[0.3em] uppercase font-medium mb-4">Real AI, Real Results</div>
            <h2 className="text-3xl md:text-4xl font-serif text-white">Recite. Hear. Improve.</h2>
            <p className="mt-4 text-white/50">Our AI listens to your recitation, identifies every mistake, and guides you with precision — like having a Sheikh in your pocket.</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", icon: <Mic className="h-6 w-6" />, title: "Recite", desc: "Open any Surah and recite directly into your device. Our AI transcribes your voice in real time using Whisper speech recognition." },
              { step: "02", icon: <Brain className="h-6 w-6" />, title: "Analyze", desc: "Receive a full breakdown: accuracy score, Tajweed rules, word-by-word comparison, pronunciation errors, and fluency rating." },
              { step: "03", icon: <Star className="h-6 w-6" />, title: "Improve", desc: "Act on your personalized improvement tips. Track your progress over time and watch your score climb with each recitation." },
            ].map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.1}>
                <div className="relative p-8 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                  <div className="text-[80px] font-serif text-white/5 absolute top-4 right-6 leading-none select-none">{step.step}</div>
                  <div className="relative z-10">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-5">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-white/50 leading-relaxed text-sm">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── QARIS ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="container mx-auto">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs text-emerald-400 tracking-[0.3em] uppercase font-medium mb-4">Premium Audio</div>
            <h2 className="text-3xl md:text-4xl font-serif text-white">Learn from the world's greatest reciters.</h2>
            <p className="mt-4 text-white/50">Choose your favorite Qari and follow along with authentic, high-quality audio from the greatest voices of our time.</p>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {QARIS.map((qari, i) => (
              <FadeIn key={qari.name} delay={i * 0.05}>
                <div className="flex flex-col items-center p-4 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-emerald-500/20 transition-all text-center group cursor-default">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center text-emerald-300 text-sm font-bold mb-3 group-hover:scale-110 transition-transform">
                    {qari.initials}
                  </div>
                  <p className="text-xs font-semibold text-white/80 leading-tight">{qari.name}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{qari.country}</p>
                  <p className="text-[10px] text-emerald-500/60 mt-0.5">{qari.style}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section className="py-28 px-4 bg-white/[0.02] border-y border-white/5">
        <div className="container mx-auto">
          <FadeIn className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs text-emerald-400 tracking-[0.3em] uppercase font-medium mb-4">Platform Features</div>
            <h2 className="text-3xl md:text-4xl font-serif text-white">Everything you need to excel.</h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {[
              { icon: <Mic />, title: "Voice Teacher AI", desc: "Speak with an AI teacher. It listens, responds, and corrects your pronunciation in real time." },
              { icon: <BookOpen />, title: "Digital Library", desc: "Hundreds of Islamic books across 7 disciplines — with guided lessons and progress tracking." },
              { icon: <Brain />, title: "Hifdh Tracker", desc: "Plan, track, and revise your memorization with spaced-repetition AI scheduling." },
              { icon: <Trophy />, title: "Streaks & XP", desc: "Build daily habits with gamified streaks, experience points, and achievement certificates." },
              { icon: <Users />, title: "Leaderboard", desc: "Compete with peers globally. Rise through the ranks by studying consistently." },
              { icon: <Star />, title: "AI Study Planner", desc: "Get a personalized weekly study plan generated from your goals and available time." },
              { icon: <Zap />, title: "Tajweed Tutor", desc: "Dedicated Tajweed teacher explains every rule with examples and tests your application." },
              { icon: <Globe />, title: "Multilingual", desc: "Full support for English, Arabic, and Somali — with more languages coming soon." },
            ].map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.04}>
                <div className="p-6 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/20 transition-all group">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4 group-hover:bg-emerald-500/20 transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-sm">{f.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <FadeIn>
            <div className="text-6xl text-white/10 font-serif mb-6">"</div>
            <p className="text-2xl md:text-3xl font-arabic text-white/80 leading-loose mb-6" style={{ fontFamily: "var(--font-arabic)", lineHeight: 2 }}>
              اقْرَؤُوا الْقُرْآنَ فَإِنَّهُ يَأْتِي يَوْمَ الْقِيَامَةِ شَفِيعًا لِأَصْحَابِهِ
            </p>
            <p className="text-white/40 text-base italic">
              "Read the Quran, for it will come as an intercessor for its companion on the Day of Resurrection."
            </p>
            <p className="text-white/25 text-sm mt-2">— Sahih Muslim 804</p>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-950/30" />
        <div className="absolute inset-0 bg-[url('/images/geometric-pattern.png')] opacity-[0.06] bg-repeat bg-[length:250px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-600/15 rounded-full blur-[100px]" />
        <FadeIn className="relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-6 leading-tight">
            Your journey with the Quran starts today.
          </h2>
          <p className="text-white/50 text-lg mb-10">
            Join Al Bayaan. Learn at your own pace. Grow with real AI guidance.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="h-14 px-10 text-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full shadow-[0_0_50px_rgba(52,211,153,0.3)] hover:shadow-[0_0_70px_rgba(52,211,153,0.5)] transition-all duration-300">
              Begin for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-white/25 text-sm">No credit card required · Free forever</p>
        </FadeIn>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="py-10 px-4 border-t border-white/5">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Al Bayaan" className="h-6 w-auto brightness-0 invert opacity-50" />
            <span className="text-white/30 text-sm">Al Bayaan AI Quran</span>
          </div>
          <p className="text-white/20 text-xs">Built with ❤️ for the Muslim Ummah</p>
          <div className="flex items-center gap-4 text-xs text-white/25">
            <Link href="/sign-in" className="hover:text-white/50 transition-colors">Sign In</Link>
            <Link href="/sign-up" className="hover:text-white/50 transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
