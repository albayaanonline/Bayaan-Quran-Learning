import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MessageCircle, BookOpen, Users, Send, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: "Email Support",
    desc: "For account, billing, or general enquiries",
    detail: "Albayaan1college@gmail.com",
    href: "mailto:Albayaan1college@gmail.com",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    desc: "Chat with us directly on WhatsApp",
    detail: "+252 656 042 512",
    href: "https://wa.me/252656042512?text=Assalamu%20Alaikum%2C%20I%27m%20interested%20in%20Al%20Bayaan.",
    color: "from-green-500 to-blue-700",
  },
  {
    icon: BookOpen,
    title: "Help Center",
    desc: "Browse articles, guides, and tutorials",
    detail: "View Help Center →",
    href: "/help",
    color: "from-blue-600 to-teal-500",
  },
  {
    icon: Users,
    title: "Islamic Scholars",
    desc: "Questions about Islamic content & rulings",
    detail: "Albayaan1college@gmail.com",
    href: "mailto:Albayaan1college@gmail.com",
    color: "from-amber-500 to-orange-500",
  },
];

const SUBJECTS = [
  "General Enquiry",
  "Technical Issue",
  "Billing & Payments",
  "Feature Request",
  "Islamic Content Question",
  "Teacher / School Partnership",
  "Privacy & Data",
  "Other",
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: SUBJECTS[0], message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

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

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold mb-3">Contact Us</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            We're here to help. Choose the best way to reach us below.
          </p>
        </motion.div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {CONTACT_METHODS.map((method, i) => {
            const isExternal = method.href?.startsWith("http") || method.href?.startsWith("mailto:");
            const inner = (
              <div className={`group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${method.color} text-white h-full cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg`}>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <method.icon className="h-7 w-7 mb-3 opacity-90" />
                <h3 className="font-bold mb-1">{method.title}</h3>
                <p className="text-xs text-white/70 mb-2 leading-relaxed">{method.desc}</p>
                <p className="text-xs font-medium text-white/90">{method.detail}</p>
              </div>
            );
            return (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                {method.href ? (
                  isExternal ? (
                    <a href={method.href} target="_blank" rel="noopener noreferrer">{inner}</a>
                  ) : (
                    <Link href={method.href}>{inner}</Link>
                  )
                ) : inner}
              </motion.div>
            );
          })}
        </div>

        {/* Contact Form */}
        <div className="grid md:grid-cols-5 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-3"
          >
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-5">Send us a message</h2>

              {sent ? (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-blue-700 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground text-sm">We'll get back to you within 24 hours, insha'Allah.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setSent(false)}>Send another</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your name"
                        className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@email.com"
                        className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Subject</label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    >
                      {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe your question or issue..."
                      className="w-full px-3.5 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="md:col-span-2 space-y-4"
          >
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="font-bold mb-4">Response Times</h3>
              <div className="space-y-3">
                {[
                  { label: "General Support", time: "Within 24 hours" },
                  { label: "Technical Issues", time: "Within 12 hours" },
                  { label: "Billing Issues",   time: "Within 6 hours" },
                  { label: "Urgent Issues",    time: "Within 2 hours" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-xs bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-blue-950 to-slate-900 text-white p-5">
              <p className="text-sm font-arabic text-center mb-2 opacity-70" style={{ fontFamily: "var(--font-arabic)", lineHeight: 2 }}>
                وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ
              </p>
              <p className="text-xs text-white/50 text-center italic">"And when My servants ask you about Me — indeed I am near." — Quran 2:186</p>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <h3 className="font-bold mb-3 text-sm">Contact Details</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">📧</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href="mailto:Albayaan1college@gmail.com" className="text-sm font-medium text-primary hover:underline break-all">Albayaan1college@gmail.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">💬</span>
                  <div>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                    <a href="https://wa.me/252656042512" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">+252 656 042 512</a>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">📍</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">Location not specified</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <h3 className="font-bold mb-2 text-sm">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/faq" className="block text-sm text-muted-foreground hover:text-primary transition-colors">→ View FAQ</Link>
                <Link href="/help" className="block text-sm text-muted-foreground hover:text-primary transition-colors">→ Help Center</Link>
                <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-primary transition-colors">→ Privacy Policy</Link>
                <Link href="/terms" className="block text-sm text-muted-foreground hover:text-primary transition-colors">→ Terms of Service</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
