import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, ArrowRight, MessageCircle, Phone } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    monthly: 5,
    yearly: 50,
    color: "from-slate-800 to-slate-900",
    border: "border-slate-700/50",
    highlight: false,
    features: ["Full Quran access", "AI recitation feedback", "Basic progress tracking", "Community leaderboard"],
  },
  {
    name: "Standard",
    monthly: 10,
    yearly: 100,
    color: "from-blue-900 to-blue-950",
    border: "border-blue-600/50",
    highlight: true,
    features: ["Everything in Starter", "Hifdh tracker & planner", "Digital library (500+ books)", "AI Study Planner", "Voice & Tajweed Teacher", "Parent dashboard"],
  },
  {
    name: "Premium",
    monthly: 15,
    yearly: 150,
    color: "from-indigo-900 to-purple-950",
    border: "border-indigo-500/50",
    highlight: false,
    features: ["Everything in Standard", "Live classroom sessions", "AI Video Teacher", "Certificates & Exams", "Content Generator", "Priority support"],
  },
];

const PAYMENT_METHODS = [
  {
    name: "ZAAD",
    number: "+252 63 6042512",
    logo: "/logos/zaad.png",
    instructions: "Send to the number above and upload your proof of payment.",
  },
  {
    name: "EDAHAB",
    number: "+252 65 6042512",
    logo: "/logos/edahab.png",
    instructions: "Send to the number above and upload your proof of payment.",
  },
  {
    name: "EVC Plus",
    number: "+252 612035767",
    logo: "/logos/evc-plus.png",
    instructions: "Send to the number above and upload your proof of payment.",
  },
  {
    name: "EPIRR Ethiopia",
    number: "+251 0979695586",
    logo: "/logos/ethio-telecom.jpeg",
    instructions: "Send to the number above and upload your proof of payment.",
  },
];

const WHATSAPP_METHODS = [
  { name: "Sahal", logo: "/logos/golis.png" },
  { name: "M-Pesa", logo: "/logos/somtel.png" },
];

const WHATSAPP_NUMBER = "252656042512";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#080f24] text-white overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-[#080f24]/85 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Al Bayaan" className="h-7 w-auto brightness-0 invert" />
          <span className="font-semibold text-white/90 text-sm tracking-wide">Al Bayaan</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <Link href="/about" className="hover:text-white transition-colors duration-200">About</Link>
          <Link href="/pricing" className="text-white font-semibold">Pricing</Link>
          <Link href="/sign-in" className="hover:text-white transition-colors duration-200">Programs</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 text-sm">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-full px-5 text-sm">
              Get Started Free
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-36 pb-20 px-4 text-center relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>
        <FadeIn className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-300 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            Invest in your <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">Deen</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Choose a plan that fits your journey. Cancel or change anytime. All plans include a full AI-powered learning experience.
          </p>
        </FadeIn>
      </section>

      {/* ── PRICING CARDS ── */}
      <section className="px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          {/* Toggle label */}
          <FadeIn delay={0.1} className="flex flex-col items-center mb-12 gap-2">
            <div className="flex items-center gap-8 text-sm text-white/50">
              <span className="font-semibold text-white">Monthly</span>
              <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full">Yearly — Save ~17%</span>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <FadeIn key={plan.name} delay={0.15 + i * 0.1}>
                <div className={`relative rounded-2xl border ${plan.border} bg-gradient-to-br ${plan.color} p-7 flex flex-col h-full ${plan.highlight ? "ring-2 ring-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.2)]" : ""}`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-3">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-bold text-white">${plan.monthly}</span>
                      <span className="text-white/40 text-sm">/month</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-semibold text-blue-300">${plan.yearly}</span>
                      <span className="text-white/40 text-sm">/year</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                        <Check className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href="/payments">
                    <Button
                      className={`w-full rounded-xl font-semibold ${plan.highlight
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/15"}`}
                    >
                      Subscribe — {plan.name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAYMENT METHODS ── */}
      <section className="py-24 px-4 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <div className="text-xs text-blue-400 tracking-[0.3em] uppercase font-semibold mb-4">Payment Methods</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Pay your way</h2>
            <p className="text-white/40 max-w-xl mx-auto">
              We accept mobile money payments across East Africa and the Horn. After sending payment, submit your proof through the Payment Center.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {PAYMENT_METHODS.map((method, i) => (
              <FadeIn key={method.name} delay={i * 0.08}>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition-all duration-300 p-6 flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-xl bg-white flex items-center justify-center mb-4 overflow-hidden shadow-md">
                    <img
                      src={method.logo}
                      alt={method.name}
                      className="h-12 w-12 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <h3 className="text-white font-bold text-base mb-2">{method.name}</h3>
                  <div className="flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/25 rounded-lg px-3 py-2 mb-3">
                    <Phone className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span className="text-blue-300 font-mono text-sm font-semibold">{method.number}</span>
                  </div>
                  <p className="text-white/35 text-xs leading-relaxed">{method.instructions}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* WhatsApp methods */}
          <FadeIn delay={0.4}>
            <div className="rounded-2xl border border-green-500/25 bg-green-500/5 p-7">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center gap-4 shrink-0">
                  {WHATSAPP_METHODS.map((m) => (
                    <div key={m.name} className="flex flex-col items-center gap-2">
                      <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-md">
                        <img
                          src={m.logo}
                          alt={m.name}
                          className="h-10 w-10 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                      <span className="text-white/60 text-xs font-semibold">{m.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-white font-bold text-lg mb-2">Sahal & M-Pesa</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">
                    Please contact administration through WhatsApp before sending payment. We will provide you with the exact account details.
                  </p>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=Assalamu%20Alaykum%2C%20I%20would%20like%20to%20subscribe%20to%20Al%20Bayaan%20AI%20Academy`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Contact on WhatsApp
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── HOW TO PAY ── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">How to subscribe</h2>
            <p className="text-white/40">Three simple steps to activate your account</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Choose your plan", desc: "Pick the plan that fits your goals — Starter, Standard, or Premium." },
              { step: "02", title: "Send payment", desc: "Transfer the amount to one of the mobile money numbers above. Note your transaction ID." },
              { step: "03", title: "Submit proof", desc: "Sign in and go to Payments. Upload your screenshot or transaction reference. We verify within 24 hours." },
            ].map((s, i) => (
              <FadeIn key={s.step} delay={i * 0.1}>
                <div className="p-6 rounded-2xl border border-white/8 bg-white/[0.03] relative overflow-hidden">
                  <div className="text-[80px] font-bold text-white/4 absolute top-2 right-4 leading-none select-none">{s.step}</div>
                  <div className="relative z-10">
                    <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Step {s.step}</p>
                    <h3 className="text-white font-bold text-base mb-2">{s.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.4} className="mt-10 text-center">
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-8 bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white font-bold rounded-full">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-4 border-t border-white/5 bg-[#050c1c]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Al Bayaan" className="h-6 w-auto brightness-0 invert opacity-50" />
            <span className="text-white/40 text-sm">© 2025 Al Bayaan AI Academy</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/30">
            <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-white/60 transition-colors">Pricing</Link>
            <Link href="/payments" className="hover:text-white/60 transition-colors">Payments</Link>
            <Link href="/about" className="hover:text-white/60 transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
