import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, AlertCircle, CheckCircle, XCircle, Scale, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

const SECTIONS = [
  {
    icon: CheckCircle,
    title: "Acceptance of Terms",
    content: `By creating an account or using Al Bayaan AI Academy ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.

These terms apply to all users of the platform, including students, teachers, parents, and administrators. We may update these terms from time to time, and continued use of the platform constitutes acceptance of the updated terms.`,
  },
  {
    icon: FileText,
    title: "Use of the Platform",
    content: `You may use Al Bayaan AI Academy for personal, non-commercial learning purposes. You agree to:

• Provide accurate and truthful information when creating your account.
• Keep your account credentials secure and not share them with others.
• Use the platform only for lawful purposes.
• Not attempt to reverse-engineer, copy, or exploit our AI systems.
• Respect other users and maintain a respectful learning environment.
• Not upload or share content that is offensive, infringing, or illegal.

You must be at least 13 years old to use the platform, or have parental consent if under 18.`,
  },
  {
    icon: Scale,
    title: "Intellectual Property",
    content: `All content on Al Bayaan AI Academy — including the platform design, AI models, learning content, audio recordings, and software — is owned by or licensed to Al Bayaan AI Academy.

**Your Content**: You retain ownership of content you create (recitations, notes). By uploading content, you grant us a license to process it for the purpose of providing our services.

**Quran Content**: Quran text and audio is sourced from reputable, open-access sources in accordance with Islamic scholarly standards. We attribute sources appropriately.

**Prohibited Uses**: You may not reproduce, distribute, or create derivative works from our platform content without explicit written permission.`,
  },
  {
    icon: AlertCircle,
    title: "AI-Generated Content",
    content: `Al Bayaan uses artificial intelligence to provide feedback, generate study plans, and assist with learning. Please be aware that:

• AI feedback is intended as a learning aid, not a substitute for qualified Islamic scholarship.
• Tajweed analysis is powered by AI and may occasionally make errors — always verify with a qualified teacher for certification purposes.
• AI-generated responses should be cross-referenced with authoritative Islamic sources.
• We continually improve our AI models, but accuracy cannot be guaranteed 100%.

We are committed to responsible AI that aligns with Islamic values and scholarly standards.`,
  },
  {
    icon: XCircle,
    title: "Termination",
    content: `We reserve the right to suspend or terminate your account if you:

• Violate these Terms of Service.
• Engage in abusive, harmful, or illegal behavior.
• Attempt to compromise the security or integrity of the platform.
• Use the platform for commercial purposes without authorization.

You may delete your account at any time from the profile settings. Upon account deletion, your personal data will be removed within 30 days, except where retention is required by law.`,
  },
  {
    icon: HelpCircle,
    title: "Limitation of Liability",
    content: `Al Bayaan AI Academy is provided "as is" without warranties of any kind. To the maximum extent permitted by law:

• We are not liable for indirect, incidental, or consequential damages.
• Our total liability is limited to the amount you paid in the 12 months prior to any claim.
• We are not responsible for internet connectivity issues affecting your experience.
• We do not guarantee uninterrupted access to the platform.

Nothing in these terms excludes liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.`,
  },
];

export default function Terms() {
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

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-serif font-bold mb-3">Terms of Service</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Please read these terms carefully before using Al Bayaan AI Academy.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-full">
            <span>Last updated: June 20, 2026</span>
          </div>
        </motion.div>

        <div className="space-y-6">
          {SECTIONS.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.06 }}
              className="rounded-2xl border bg-card p-6 card-premium"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-3">{section.title}</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {section.content.split(/\*\*(.*?)\*\*/).map((part, j) =>
                      j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Questions? Contact us at <a href="mailto:legal@albayaan.app" className="text-primary hover:underline">legal@albayaan.app</a></p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
            <Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
