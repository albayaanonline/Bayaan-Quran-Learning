import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Database, Globe, Mail } from "lucide-react";
import { motion } from "framer-motion";

const SECTIONS = [
  {
    icon: Database,
    title: "Information We Collect",
    content: `We collect information you provide directly to us, such as when you create an account, complete your profile, or interact with our services. This includes:
    
• **Account Information**: Name, email address, and profile photo when you sign up.
• **Learning Data**: Your Quran recitations, progress, scores, and study sessions to power personalized AI feedback.
• **Usage Data**: Pages visited, features used, and time spent on the platform.
• **Communications**: Messages sent through our platform to teachers or support.

We do not collect payment card details directly — payments are processed by secure third-party providers.`,
  },
  {
    icon: Eye,
    title: "How We Use Your Information",
    content: `We use the information we collect to:

• Provide, maintain, and improve our learning platform.
• Generate personalized AI feedback on your Quran recitations.
• Track your learning progress and send you streak reminders.
• Communicate with you about your account, updates, and support.
• Ensure the safety and security of our platform.
• Comply with legal obligations.

We do not sell your personal data to third parties, ever.`,
  },
  {
    icon: Globe,
    title: "Information Sharing",
    content: `We share your information only in the following limited circumstances:

• **Service Providers**: Trusted third-party services that help us operate the platform (e.g., cloud hosting, authentication via Clerk, AI processing).
• **Teachers**: If you join a live classroom, your name and progress may be visible to your teacher.
• **Parents**: If you are enrolled in a family plan, a parent account may view your progress.
• **Legal Requirements**: When required by law or to protect our rights and users.

All service providers are bound by data processing agreements and privacy standards.`,
  },
  {
    icon: Lock,
    title: "Data Security",
    content: `We take the security of your data seriously:

• All data is encrypted in transit using TLS 1.3.
• Voice recordings are processed and deleted after generating feedback.
• We use Clerk for authentication — a trusted, SOC 2 certified provider.
• Databases are encrypted at rest.
• We conduct regular security audits and vulnerability assessments.

No method of transmission over the internet is 100% secure, but we strive to use commercially acceptable means to protect your information.`,
  },
  {
    icon: Shield,
    title: "Your Rights",
    content: `You have the following rights regarding your personal data:

• **Access**: Request a copy of the data we hold about you.
• **Correction**: Update or correct inaccurate information.
• **Deletion**: Request deletion of your account and associated data.
• **Portability**: Export your learning progress data.
• **Opt-out**: Unsubscribe from marketing emails at any time.

To exercise any of these rights, contact us at privacy@albayaan.app. We will respond within 30 days.`,
  },
  {
    icon: Mail,
    title: "Contact Us",
    content: `If you have any questions about this Privacy Policy or our data practices, please contact us:

• **Email**: privacy@albayaan.app
• **Support**: help@albayaan.app
• **Address**: Al Bayaan AI Academy

We are committed to resolving any privacy concerns you have promptly and transparently.`,
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-serif font-bold mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Your privacy matters to us. We are committed to protecting your personal data and being transparent about how we use it.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-full">
            <span>Last updated: June 20, 2026</span>
          </div>
        </motion.div>

        {/* Summary banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 mb-10"
        >
          <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
            <strong>In plain English:</strong> We collect your name, email, and learning data to run the platform. We never sell your data. Voice recordings are deleted after processing. You can delete your account anytime. We use industry-standard security.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
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

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>© 2026 Al Bayaan AI Academy. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
            <Link href="/help" className="hover:text-primary transition-colors">Help Center</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
