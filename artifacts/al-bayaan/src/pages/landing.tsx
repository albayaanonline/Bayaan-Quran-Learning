import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";
import { motion } from "framer-motion";
import { BookOpen, Mic, Trophy, ArrowRight, ShieldCheck } from "lucide-react";

export default function Landing() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-emerald-950 py-24 md:py-32 lg:py-40">
        <div className="absolute inset-0 bg-[url('/images/geometric-pattern.png')] opacity-10 bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/50 to-emerald-950"></div>
        <div className="container relative z-10 flex flex-col items-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-200 mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 mr-2"></span>
            The Premium AI Quran Companion
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="max-w-4xl text-5xl font-serif text-white sm:text-6xl md:text-7xl lg:text-8xl leading-tight"
          >
            <span className="block font-arabic text-gold-400 mb-4" style={{ fontFamily: "var(--font-arabic)" }}>البيان</span>
            Perfect your recitation.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl mt-6 text-xl text-emerald-100/80 leading-relaxed"
          >
            A sacred digital space to read, learn, and perfect your Tajweed with the guidance of advanced AI. Your daily companion for the Book of Allah.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Link href="/sign-up">
              <Button size="lg" className="h-14 px-8 text-lg bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-[0_0_40px_rgba(5,150,105,0.3)]">
                Start Learning Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-serif text-emerald-950 sm:text-4xl md:text-5xl">Designed for deep focus and precision.</h2>
            <p className="mt-4 text-lg text-emerald-800/70">Everything you need to build a consistent and meaningful relationship with the Quran.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<BookOpen className="h-8 w-8 text-emerald-600" />}
              title="Beautiful Reading Experience"
              description="Distraction-free reading with authentic Uthmani script, customizable fonts, and elegant illuminated manuscript styling."
            />
            <FeatureCard 
              icon={<Mic className="h-8 w-8 text-emerald-600" />}
              title="Real-time AI Tajweed"
              description="Recite directly into your device and receive instant, word-by-word feedback on your pronunciation and fluency."
            />
            <FeatureCard 
              icon={<Trophy className="h-8 w-8 text-emerald-600" />}
              title="Gamified Consistency"
              description="Build a daily habit with streaks, XP, achievements, and friendly community leaderboards."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-emerald-50 border-t border-emerald-100">
        <div className="container px-4 text-center">
          <h2 className="text-3xl font-serif text-emerald-950 sm:text-4xl">Ready to begin your journey?</h2>
          <p className="mt-4 text-emerald-800/80 max-w-2xl mx-auto mb-8">
            Join thousands of Muslims perfecting their recitation daily with Al Bayaan.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="h-14 px-8 text-lg bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-emerald-200">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-bold text-emerald-950">{title}</h3>
      <p className="text-emerald-800/70 leading-relaxed">{description}</p>
    </div>
  );
}
