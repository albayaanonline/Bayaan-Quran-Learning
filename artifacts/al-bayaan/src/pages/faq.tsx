import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, ChevronUp, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const CATEGORIES = [
  { id: "all",      label: "All Questions" },
  { id: "general",  label: "General" },
  { id: "quran",    label: "Quran & Tajweed" },
  { id: "ai",       label: "AI Features" },
  { id: "account",  label: "Account" },
  { id: "pricing",  label: "Pricing" },
];

const FAQS = [
  {
    cat: "general",
    q: "What is Al Bayaan AI Academy?",
    a: "Al Bayaan AI Academy is an AI-powered Islamic learning platform designed to help Muslims master Quran recitation, Tajweed rules, Arabic language, and other Islamic sciences. We combine cutting-edge AI technology with authentic Islamic scholarship to deliver a world-class learning experience available in English, Arabic, and Somali.",
  },
  {
    cat: "general",
    q: "Who is Al Bayaan designed for?",
    a: "Al Bayaan is for everyone — from complete beginners learning to read Arabic letters, to advanced students studying Tajweed rules, to Huffadh looking to maintain their memorization. We support students of all ages, parents monitoring their children, and teachers managing online halaqahs.",
  },
  {
    cat: "pricing",
    q: "Is Al Bayaan free to use?",
    a: "Yes! Al Bayaan has a generous free tier that gives you access to Quran recitation practice, AI feedback on a number of sessions per month, Hifdh tracking, and the digital library. Premium plans unlock unlimited AI sessions, live classroom access, advanced analytics, and more.",
  },
  {
    cat: "quran",
    q: "How does the AI Tajweed analysis work?",
    a: "Our AI uses state-of-the-art speech recognition (Whisper) to transcribe your recitation, then compares it word-by-word to the correct Quranic text. It identifies specific Tajweed rules you applied or missed — including Madd, Ghunna, Qalqalah, Idgham, and more — and gives you a detailed score and improvement tips. The AI is trained on thousands of correct recitations from certified reciters.",
  },
  {
    cat: "quran",
    q: "Which Qaris (reciters) are available?",
    a: "We offer high-quality audio from six world-renowned reciters: Mishary Rashid Alafasy, Sheikh Abdul Basit Abd us-Samad, Sheikh Al-Husary, Sheikh As-Sudais, Sheikh Al-Minshawi, and Sheikh Maher Al Muaiqly. More reciters will be added soon.",
  },
  {
    cat: "quran",
    q: "Can I use Al Bayaan for Hifdh (memorization)?",
    a: "Absolutely. Our Hifdh Tracker lets you mark surahs as memorized, record revision sessions, and track your accuracy over time. The AI suggests a personalized revision schedule based on the Ebbinghaus forgetting curve to ensure your memorization stays strong.",
  },
  {
    cat: "ai",
    q: "Can I have a full conversation with the AI Teacher?",
    a: "Yes! The AI Teacher feature lets you ask any Islamic question and receive a knowledgeable response powered by advanced language models. You can discuss Tafsir, Fiqh, Arabic grammar, and more. The AI responds in whichever language you prefer — English, Arabic, or Somali.",
  },
  {
    cat: "ai",
    q: "How accurate is the AI feedback?",
    a: "Our AI achieves high accuracy for Tajweed rule detection and recitation scoring, but it is not infallible. We recommend using AI feedback as a learning aid alongside guidance from a qualified teacher — especially for certification or Ijazah purposes. We continuously improve our models based on user feedback.",
  },
  {
    cat: "ai",
    q: "What is the Video AI Teacher?",
    a: "The Video AI Teacher is an interactive video experience where an AI teacher explains Quran lessons, Tajweed rules, and Islamic topics with narration and visual aids. It makes complex concepts easy to understand without needing a live human teacher at every step.",
  },
  {
    cat: "account",
    q: "Can I use Al Bayaan on my phone?",
    a: "Yes! Al Bayaan is fully responsive and works on all devices — phones, tablets, and computers. We recommend adding it to your phone's home screen for a native app-like experience. A dedicated mobile app is coming soon.",
  },
  {
    cat: "account",
    q: "How do I change my display language?",
    a: "You can switch between English, Arabic (RTL), and Somali from the language selector at the bottom of the sidebar. The entire interface, AI responses, and feedback will update to your chosen language.",
  },
  {
    cat: "account",
    q: "How do I delete my account?",
    a: "You can request account deletion from your profile settings. All personal data will be permanently deleted within 30 days. Note that learning progress cannot be recovered after deletion.",
  },
  {
    cat: "general",
    q: "What is the Islamic content review process?",
    a: "All Islamic content on Al Bayaan — including Quran text, Tajweed rules, and AI Teacher responses — is reviewed by Islamic scholars to ensure authenticity and accuracy. We follow the mainstream Sunni scholarly tradition and source content from reliable, recognized Islamic institutions.",
  },
  {
    cat: "account",
    q: "Is there a family or parent account?",
    a: "Yes! Our Family Plan allows parents to create accounts for their children, monitor their learning progress, and receive notifications about their study streaks and achievements. The Parent Dashboard gives a clear overview of each child's activity.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border bg-card transition-all duration-200 overflow-hidden ${open ? "shadow-md" : ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left gap-4 hover:bg-muted/40 transition-colors"
      >
        <span className="font-medium text-sm md:text-base">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 text-primary shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-5 pb-5">
              <div className="h-px bg-border mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = FAQS.filter((faq) => {
    const matchesCat = activeCategory === "all" || faq.cat === activeCategory;
    const matchesSearch = !searchQuery || faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
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
            <span className="text-sm font-semibold">Al Bayaan AI Academy</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold mb-3">Frequently Asked Questions</h1>
          <p className="text-muted-foreground text-lg">Everything you need to know about Al Bayaan AI Academy.</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No questions found. Try a different search.</p>
            </div>
          ) : (
            filtered.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <FAQItem q={faq.q} a={faq.a} />
              </motion.div>
            ))
          )}
        </div>

        {/* Still need help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center p-8 rounded-2xl bg-muted/50 border"
        >
          <h3 className="font-bold text-lg mb-2">Still have questions?</h3>
          <p className="text-muted-foreground text-sm mb-4">Our support team is ready to help you.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/contact">
              <Button className="gap-2">Contact Support</Button>
            </Link>
            <Link href="/help">
              <Button variant="outline" className="gap-2">Help Center</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
