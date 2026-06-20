import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Mic, Brain, Trophy, Settings, Users, Search, ArrowRight, Play, Zap, Shield, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const ARTICLES = [
  {
    category: "Getting Started",
    icon: Zap,
    color: "from-emerald-500 to-teal-500",
    items: [
      { title: "How to create your account", time: "2 min read" },
      { title: "Setting up your learning profile", time: "3 min read" },
      { title: "Choosing your daily goal", time: "1 min read" },
      { title: "Understanding XP and levels", time: "2 min read" },
      { title: "Switching your language (EN/AR/SO)", time: "1 min read" },
    ],
  },
  {
    category: "Quran Recitation",
    icon: BookOpen,
    color: "from-blue-500 to-indigo-500",
    items: [
      { title: "How to start a recitation session", time: "2 min read" },
      { title: "Understanding your Tajweed score", time: "4 min read" },
      { title: "Reading the word-by-word comparison", time: "3 min read" },
      { title: "Choosing a Qari (reciter)", time: "1 min read" },
      { title: "Bookmarking your place in a Surah", time: "1 min read" },
    ],
  },
  {
    category: "AI Teacher",
    icon: Mic,
    color: "from-violet-500 to-purple-500",
    items: [
      { title: "How to use the AI Teacher chat", time: "2 min read" },
      { title: "Voice Teacher: speaking with the AI", time: "3 min read" },
      { title: "Tajweed Tutor: rule-by-rule practice", time: "4 min read" },
      { title: "Video Teacher: interactive lessons", time: "2 min read" },
      { title: "Getting the most from AI feedback", time: "5 min read" },
    ],
  },
  {
    category: "Hifdh & Progress",
    icon: Brain,
    color: "from-amber-500 to-orange-500",
    items: [
      { title: "Setting up your Hifdh plan", time: "3 min read" },
      { title: "Recording a revision session", time: "2 min read" },
      { title: "Understanding the revision schedule", time: "4 min read" },
      { title: "Reading your analytics dashboard", time: "3 min read" },
      { title: "Exporting your progress report", time: "1 min read" },
    ],
  },
  {
    category: "Achievements & Leaderboard",
    icon: Trophy,
    color: "from-rose-500 to-pink-500",
    items: [
      { title: "How achievements are unlocked", time: "2 min read" },
      { title: "What counts as a study streak?", time: "1 min read" },
      { title: "How the leaderboard ranking works", time: "2 min read" },
      { title: "Earning and using certificates", time: "3 min read" },
    ],
  },
  {
    category: "Account & Privacy",
    icon: Shield,
    color: "from-slate-500 to-slate-700",
    items: [
      { title: "Changing your name and photo", time: "1 min read" },
      { title: "Managing notification settings", time: "2 min read" },
      { title: "Connecting a parent account", time: "3 min read" },
      { title: "Downloading your personal data", time: "2 min read" },
      { title: "How to delete your account", time: "1 min read" },
    ],
  },
];

const POPULAR = [
  "How does Tajweed AI scoring work?",
  "Why can't the AI hear my microphone?",
  "How do I reset my streak?",
  "Can I use Al Bayaan offline?",
  "What is the difference between Murattal and Mujawwad?",
];

export default function Help() {
  const [search, setSearch] = useState("");

  const filtered = ARTICLES.filter((section) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return section.category.toLowerCase().includes(q) ||
      section.items.some((item) => item.title.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card sticky top-0 z-10 backdrop-blur-sm bg-card/80">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Al Bayaan" className="h-5 w-auto" />
            <span className="text-sm font-semibold">Help Center</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white py-14 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-serif font-bold mb-3">
            Help Center
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-white/60 text-lg mb-6">
            Find answers, guides, and support for Al Bayaan AI Academy.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder:text-white/35 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all backdrop-blur-sm"
            />
          </motion.div>
          {/* Popular searches */}
          {!search && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-4 flex flex-wrap justify-center gap-2">
              {POPULAR.slice(0, 3).map((p) => (
                <button key={p} onClick={() => setSearch(p)} className="text-xs bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 rounded-full text-white/60 hover:text-white transition-all">
                  {p}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Globe, label: "Video Tutorials",     desc: "Watch step-by-step guides",   color: "text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-300" },
            { icon: Users, label: "Community Forum",     desc: "Ask other Al Bayaan students", color: "text-violet-600 bg-violet-100 dark:bg-violet-950 dark:text-violet-300" },
            { icon: Mic,   label: "Contact Support",     desc: "Talk to our team directly",    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300", href: "/contact" },
          ].map((action, i) => (
            <motion.div key={action.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              {action.href ? (
                <Link href={action.href}>
                  <div className="group flex items-center gap-4 rounded-xl border bg-card p-4 hover:shadow-md transition-all cursor-pointer">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${action.color}`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-4 rounded-xl border bg-card p-4 cursor-default">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Soon</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Article Sections */}
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-5">Browse by Topic</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((section, i) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border bg-card overflow-hidden card-premium"
            >
              <div className={`p-4 bg-gradient-to-r ${section.color} flex items-center gap-3`}>
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <section.icon className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-white text-sm">{section.category}</h3>
              </div>
              <div className="p-4 space-y-1">
                {section.items.map((item) => {
                  if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !section.category.toLowerCase().includes(search.toLowerCase())) return null;
                  return (
                    <button key={item.title} className="w-full flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/60 transition-colors text-left group">
                      <span className="text-sm group-hover:text-primary transition-colors">{item.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{item.time}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="mb-4">No results for "{search}"</p>
            <Link href="/contact">
              <Button variant="outline">Contact Support</Button>
            </Link>
          </div>
        )}

        {/* Still stuck */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 text-center p-8 rounded-2xl border bg-gradient-to-br from-muted/50 to-background">
          <p className="font-bold text-lg mb-1">Can't find what you're looking for?</p>
          <p className="text-muted-foreground text-sm mb-4">Our support team responds within 24 hours, insha'Allah.</p>
          <Link href="/contact">
            <Button className="gap-2">
              <Users className="h-4 w-4" />
              Contact Support Team
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
