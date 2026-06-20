import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Mic, Brain, Trophy, Star, CheckCircle2, Users, Globe, Zap, Heart, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const FEATURES = [
  { icon: Brain, label: "AI Quran Teacher", desc: "24/7 AI teacher answers any Islamic question in English, Arabic, or Somali" },
  { icon: Mic, label: "Voice Tajweed Analysis", desc: "Recite and get instant feedback on 10+ Tajweed rules with scoring" },
  { icon: BookOpen, label: "Complete Hifdh System", desc: "Memorize any Surah with AI coaching, spaced repetition, and progress tracking" },
  { icon: Trophy, label: "Gamification", desc: "XP, streaks, leaderboards, achievements, and certificates to keep you motivated" },
  { icon: Globe, label: "3 Languages", desc: "Full support for English, Arabic (RTL), and Somali — including AI responses" },
  { icon: Zap, label: "Live Classrooms", desc: "Join live sessions with real teachers via Jitsi, Zoom, or Google Meet" },
];

const TESTIMONIALS = [
  { name: "Sister Amina", role: "Parent, Mogadishu", quote: "My daughter memorized Surah Al-Mulk in 3 weeks with Al Bayaan. The AI teacher explains everything in Somali which is perfect for us.", stars: 5 },
  { name: "Brother Omar", role: "Student, London", quote: "The Tajweed analysis is incredible. I could never find my errors before, but now I get a full report after every recitation.", stars: 5 },
  { name: "Sheikh Ibrahim", role: "Teacher, Toronto", quote: "I use Al Bayaan for my online halaqah. The exam builder and messaging system makes it easy to manage 30 students.", stars: 5 },
];

const STATS = [
  { value: "114", label: "Surahs", sub: "Full Quran" },
  { value: "10+", label: "Tajweed Rules", sub: "Analyzed" },
  { value: "3", label: "Languages", sub: "EN / AR / SO" },
  { value: "Free", label: "To Start", sub: "No credit card" },
];

function StarRating({ count }: { count: number }) {
  return <div className="flex gap-0.5">{Array.from({ length: count }, (_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>;
}

export default function Marketing() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/marketing/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (r.ok) {
        setSubmitted(true);
        setEmail("");
        toast({ title: "You're on the list!", description: "We'll send you updates and Islamic learning tips." });
      }
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-600 to-blue-800 text-white">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Badge className="bg-blue-700 text-blue-100 border-blue-600 mb-6">🕌 World-class Islamic Education</Badge>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold leading-tight mb-6">
            Learn Quran with<br />
            <span className="text-blue-300">AI Excellence</span>
          </h1>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto mb-8">
            Al Bayaan AI Academy — your personal Quran teacher, Tajweed coach, and Islamic learning companion. Available 24/7 in English, Arabic, and Somali.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="bg-blue-400 hover:bg-teal-400 text-slate-900 font-bold px-8">
                Start Learning Free <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="border-blue-400 text-blue-100 hover:bg-blue-800">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-sm text-blue-400 mt-4">No credit card required • Free forever plan • Cancel anytime</p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="bg-blue-800/50 border-y border-blue-700">
        <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <p className="text-3xl font-bold text-blue-300">{s.value}</p>
              <p className="font-semibold">{s.label}</p>
              <p className="text-xs text-blue-400">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-serif font-bold text-center mb-2">Everything You Need</h2>
        <p className="text-blue-300 text-center mb-10">A complete Islamic learning ecosystem</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="bg-blue-800/60 border-blue-700 hover:bg-blue-800/80 transition-colors h-full">
                <CardContent className="p-5">
                  <div className="h-10 w-10 rounded-xl bg-blue-700 flex items-center justify-center mb-3">
                    <f.icon className="h-5 w-5 text-blue-300" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{f.label}</h3>
                  <p className="text-sm text-blue-300">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-blue-900/60 border-y border-blue-700">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-serif font-bold text-center mb-10">What Students Say</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="bg-blue-800/50 border-blue-700 h-full">
                  <CardContent className="p-5 flex flex-col h-full">
                    <StarRating count={t.stars} />
                    <p className="text-blue-100 text-sm mt-3 flex-1 italic">"{t.quote}"</p>
                    <div className="mt-4 pt-3 border-t border-blue-700">
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-blue-400">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Email capture */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Heart className="h-10 w-10 text-blue-400 mx-auto mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Stay Connected</h2>
        <p className="text-blue-300 mb-6">Get Islamic learning tips, Quran reminders, and platform updates.</p>
        {submitted ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 text-blue-300">
            <CheckCircle2 className="h-5 w-5" />
            <span>JazakAllah Khairan! You're on the list.</span>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-blue-800/50 border-blue-600 text-white placeholder:text-blue-400"
            />
            <Button type="submit" disabled={loading} className="bg-blue-400 text-slate-900 font-bold hover:bg-teal-400 shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
            </Button>
          </form>
        )}
        <p className="text-xs text-blue-600 mt-3">No spam. Unsubscribe anytime.</p>
      </section>

      {/* CTA */}
      <section className="bg-blue-700 text-center py-12 px-4">
        <h2 className="text-2xl font-serif font-bold mb-3">Begin Your Journey Today</h2>
        <p className="text-blue-200 mb-6">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
        <Link href="/sign-up">
          <Button size="lg" className="bg-white text-blue-950 font-bold hover:bg-blue-100 px-8">
            Start Free — No Account Needed for Demo <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </section>

      <footer className="bg-blue-950 text-center py-8 text-blue-600 text-sm">
        <p>Al Bayaan AI Academy © 2026 | Built with ❤️ for the Ummah</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/sign-in">Sign In</Link>
          <Link href="/sign-up">Sign Up</Link>
          <Link href="/learn">Learn Quran</Link>
        </div>
      </footer>
    </div>
  );
}
