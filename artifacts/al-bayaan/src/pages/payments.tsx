import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2, CreditCard, Star, Crown, BookOpen, Loader2, History,
  Clock, Upload, FileImage, ChevronRight, Shield, AlertCircle,
  CheckCheck, X, ArrowLeft, MessageSquare, ExternalLink, Zap, ScanLine,
} from "lucide-react";
import { createWorker } from "tesseract.js";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const BASE = (import.meta.env.BASE_URL || "").replace(/\/$/, "");

const WA_NUMBER = "252656042512";
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Assalamu Alaikum! I need help with Sahal/M-Pesa payment for Al Bayaan AI Academy.")}`;

interface Plan {
  id: string;
  name: string;
  price: { monthly: number; annual: number };
  icon: React.ReactNode;
  color: string;
  ring: string;
  popular?: boolean;
  features: string[];
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: { monthly: 5, annual: 50 },
    icon: <BookOpen className="h-5 w-5" />,
    color: "from-slate-600 to-slate-800",
    ring: "ring-slate-300",
    features: [
      "Full Quran access (114 Surahs)",
      "Basic Tajweed feedback",
      "AI Teacher (20 messages/day)",
      "Progress tracking",
      "Community leaderboard",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: { monthly: 10, annual: 100 },
    icon: <Star className="h-5 w-5" />,
    color: "from-blue-700 to-blue-900",
    ring: "ring-blue-400",
    popular: true,
    badge: "Most Popular",
    features: [
      "Everything in Starter",
      "Unlimited AI Teacher",
      "Voice Teacher access",
      "Hifdh tracking",
      "Advanced Tajweed analytics",
      "Download certificates",
      "Priority support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: { monthly: 15, annual: 150 },
    icon: <Crown className="h-5 w-5" />,
    color: "from-amber-600 to-amber-800",
    ring: "ring-amber-400",
    badge: "Best Value",
    features: [
      "Everything in Standard",
      "Video Teacher access",
      "Live Classroom access",
      "Parent dashboard (5 members)",
      "AI Content Generator",
      "Custom study plans",
      "Teacher messaging",
      "Dedicated support",
    ],
  },
];

interface PaymentMethod {
  id: string;
  name: string;
  logo: string;
  number?: string;
  country: string;
  desc: string;
  contact?: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "zaad",
    name: "Zaad",
    logo: "/logos/zaad.png",
    number: "+252 63 6042512",
    country: "🇸🇴 Somalia (Telesom)",
    desc: "Zaad Mobile Money",
  },
  {
    id: "edahab",
    name: "eDahab",
    logo: "/logos/edahab.png",
    number: "+252 65 6042512",
    country: "🇸🇴 Somalia (Dahabshiil)",
    desc: "eDahab Digital Wallet",
  },
  {
    id: "evc",
    name: "EVC Plus",
    logo: "/logos/evc-plus.png",
    number: "+252 612035767",
    country: "🇸🇴 Somalia (Hormuud)",
    desc: "EVC Plus Mobile Payment",
  },
  {
    id: "epirr",
    name: "E-Pirr",
    logo: "/logos/ethio-telecom.jpeg",
    number: "+251 0979695586",
    country: "🇪🇹 Ethiopia (Ethio Telecom)",
    desc: "E-Pirr Ethiopia",
  },
  {
    id: "sahal",
    name: "Sahal",
    logo: "/logos/golis.png",
    country: "🇸🇴 Somalia (Golis)",
    desc: "Contact admin via WhatsApp",
    contact: true,
  },
  {
    id: "mpesa",
    name: "M-Pesa",
    logo: "/logos/somtel.png",
    country: "🇸🇴 Somalia / Kenya (M-Pesa)",
    desc: "Contact admin via WhatsApp",
    contact: true,
  },
];

const STEPS = [
  { n: 1, title: "Choose your plan", desc: "Select Starter, Standard, or Premium" },
  { n: 2, title: "Send payment", desc: "Transfer to the number shown below" },
  { n: 3, title: "Take a screenshot", desc: "Capture your payment confirmation" },
  { n: 4, title: "Upload screenshot", desc: "Submit your proof here" },
  { n: 5, title: "Wait for review", desc: "Admin verifies your payment" },
  { n: 6, title: "Access activated", desc: "Your course access is unlocked" },
];

interface PaymentRecord {
  id: number;
  planName: string;
  billing: string;
  method: string;
  amount: string;
  currency: string;
  reference: string;
  status: string;
  createdAt: string;
  adminNotes?: string;
  courseName?: string;
  proofAnalysis?: any;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:        { label: "Pending",        color: "bg-amber-100 text-amber-700",   icon: <Clock className="h-3 w-3" /> },
  pending_review: { label: "Under Review",   color: "bg-blue-100 text-blue-700",     icon: <Shield className="h-3 w-3" /> },
  approved:       { label: "Approved ✓",     color: "bg-emerald-100 text-emerald-700", icon: <CheckCheck className="h-3 w-3" /> },
  completed:      { label: "Completed ✓",    color: "bg-emerald-100 text-emerald-700", icon: <CheckCheck className="h-3 w-3" /> },
  rejected:       { label: "Rejected",       color: "bg-red-100 text-red-700",       icon: <X className="h-3 w-3" /> },
};

const METHOD_LABELS: Record<string, string> = {
  zaad: "Zaad", edahab: "eDahab", evc: "EVC Plus",
  epirr: "E-Pirr", sahal: "Sahal", mpesa: "M-Pesa",
  stripe: "Card (Stripe)", paypal: "PayPal",
};

function PaymentHistory() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/payments/history`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setRecords(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  if (records.length === 0) {
    return (
      <Card className="border-dashed border-blue-200">
        <CardContent className="p-12 text-center">
          <History className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-slate-700">No payment history yet</p>
          <p className="text-sm text-muted-foreground mt-1">Your submissions will appear here after you pay</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((r, i) => {
        const s = STATUS_MAP[r.status] ?? STATUS_MAP.pending;
        return (
          <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-blue-100 hover:border-blue-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{r.planName} Plan <span className="text-muted-foreground font-normal">· {r.billing}</span></p>
                      <p className="text-xs text-muted-foreground">{METHOD_LABELS[r.method] ?? r.method} · Ref: <span className="font-mono">{r.reference}</span></p>
                      {r.courseName && <p className="text-xs text-blue-700 mt-0.5">{r.courseName}</p>}
                      {r.adminNotes && r.status === "rejected" && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {r.adminNotes}</p>
                      )}
                      {r.adminNotes && r.status === "approved" && (
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCheck className="h-3 w-3" /> {r.adminNotes}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-slate-900">${r.amount} <span className="text-muted-foreground font-normal text-xs">{r.currency}</span></p>
                    <Badge className={`text-[10px] mt-1 border-0 flex items-center gap-1 ${s.color}`}>
                      {s.icon} {s.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

type Step = "plans" | "method" | "instructions" | "upload" | "done";

export default function Payments() {
  const { toast } = useToast();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [step, setStep] = useState<Step>("plans");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pay" | "history">("pay");

  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [courseName, setCourseName] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [submittedRef, setSubmittedRef] = useState("");
  const [autoVerified, setAutoVerified] = useState(false);
  const [rejected, setRejected] = useState(false);

  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrText, setOcrText] = useState("");
  const [ocrDone, setOcrDone] = useState(false);
  const [ocrError, setOcrError] = useState(false);

  const performOCR = useCallback(async (imageData: string) => {
    setOcrRunning(true);
    setOcrProgress(0);
    setOcrDone(false);
    setOcrError(false);
    setOcrText("");
    try {
      const worker = await createWorker("eng", 1, {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round((m.progress || 0) * 100));
          }
        },
      });
      const { data } = await worker.recognize(imageData);
      await worker.terminate();
      const extracted = data.text || "";
      setOcrText(extracted);
      setOcrDone(true);
      if (!transactionNumber) {
        const txnMatch = extracted.match(/(?:TXN|Ref(?:erence)?|Trans(?:action)?)[:\s#]*([A-Z0-9]{6,20})/i);
        if (txnMatch?.[1]) setTransactionNumber(txnMatch[1]);
      }
    } catch {
      setOcrError(true);
      setOcrDone(true);
    } finally {
      setOcrRunning(false);
    }
  }, [transactionNumber]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Images only", description: "Please upload an image file (PNG, JPG, etc.)", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setProofImage(result);
      setProofFileName(file.name);
      setOcrDone(false);
      setOcrText("");
      performOCR(result);
    };
    reader.readAsDataURL(file);
  }, [toast, performOCR]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const submitProof = async () => {
    if (!selectedPlan || !selectedMethod) return;
    if (!proofImage) {
      toast({ title: "Screenshot required", description: "Please upload your payment screenshot", variant: "destructive" });
      return;
    }
    if (!transactionNumber.trim()) {
      toast({ title: "Transaction number required", description: "Please enter the transaction/reference number from your payment", variant: "destructive" });
      return;
    }
    if (ocrRunning) {
      toast({ title: "OCR in progress", description: "Please wait while we scan your screenshot", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      const r = await fetch(`${BASE}/api/payments/submit-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planId: selectedPlan.id,
          billing,
          method: selectedMethod.id,
          amount: billing === "annual" ? selectedPlan.price.annual : selectedPlan.price.monthly,
          transactionNumber,
          paymentDate,
          senderNumber,
          proofImage,
          studentName,
          studentEmail,
          courseName,
          ocrText,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to submit");
      setAiReport(data.aiReport);
      setSubmittedRef(data.reference);
      setAutoVerified(data.autoVerified === true);
      setRejected(data.rejected === true);
      setStep("done");
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const planPrice = selectedPlan ? (billing === "annual" ? selectedPlan.price.annual : selectedPlan.price.monthly) : 0;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900">Payment Center</h1>
            <p className="text-sm text-muted-foreground">Choose a plan · Pay · Upload proof · Get access</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-blue-100">
          {(["pay", "history"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === t ? "border-blue-700 text-blue-700" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t === "pay" ? "Make a Payment" : "Payment History"}
            </button>
          ))}
        </div>

        {activeTab === "history" ? (
          <PaymentHistory />
        ) : (
          <div className="space-y-8">

            {/* Step indicator */}
            <div className="hidden md:grid grid-cols-6 gap-2">
              {STEPS.map((s, i) => {
                const stepOrder: Step[] = ["plans", "method", "instructions", "upload", "upload", "done"];
                const done = (
                  (step === "method" && i < 1) ||
                  (step === "instructions" && i < 2) ||
                  (step === "upload" && i < 3) ||
                  (step === "done" && i < 6)
                );
                const active = stepOrder[i] === step;
                return (
                  <div key={s.n} className={`flex flex-col items-center text-center gap-1 ${done ? "opacity-60" : active ? "" : "opacity-30"}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      done ? "bg-emerald-500 text-white" : active ? "bg-blue-700 text-white" : "bg-blue-100 text-blue-700"
                    }`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                    </div>
                    <p className="text-[10px] font-semibold text-slate-700">{s.title}</p>
                    <p className="text-[9px] text-muted-foreground">{s.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* STEP: Plan selection */}
            <AnimatePresence mode="wait">
              {step === "plans" && (
                <motion.div key="plans" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-6">
                  {/* Billing toggle */}
                  <div className="flex items-center justify-center gap-3">
                    <span className={`text-sm font-medium ${billing === "monthly" ? "text-slate-900" : "text-muted-foreground"}`}>Monthly</span>
                    <button onClick={() => setBilling(b => b === "monthly" ? "annual" : "monthly")}
                      className={`relative w-12 h-6 rounded-full transition-colors ${billing === "annual" ? "bg-blue-700" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${billing === "annual" ? "left-6" : "left-0.5"}`} />
                    </button>
                    <span className={`text-sm font-medium flex items-center gap-2 ${billing === "annual" ? "text-slate-900" : "text-muted-foreground"}`}>
                      Annual <Badge className="bg-emerald-100 text-emerald-700 border-0">Save ~17%</Badge>
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {PLANS.map((plan, i) => {
                      const price = billing === "annual" ? plan.price.annual : plan.price.monthly;
                      return (
                        <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                          <Card className={`relative h-full flex flex-col cursor-pointer hover:shadow-lg transition-all border-2 ${
                            plan.popular ? `ring-2 ${plan.ring} border-blue-200` : "border-blue-100"
                          }`}
                            onClick={() => { setSelectedPlan(plan); setStep("method"); }}>
                            {plan.badge && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge className={`border-0 px-3 py-1 text-white bg-gradient-to-r ${plan.color}`}>{plan.badge}</Badge>
                              </div>
                            )}
                            <CardHeader className="pb-3 pt-6">
                              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${plan.color} text-white flex items-center justify-center mb-3`}>
                                {plan.icon}
                              </div>
                              <CardTitle className="text-lg">{plan.name}</CardTitle>
                              <div className="mt-2">
                                <div className="flex items-end gap-1">
                                  <span className="text-3xl font-bold text-slate-900">${price}</span>
                                  <span className="text-sm text-muted-foreground mb-1">/{billing === "annual" ? "year" : "month"}</span>
                                </div>
                                {billing === "annual" && (
                                  <p className="text-xs text-emerald-600 mt-0.5">${plan.price.monthly}/mo if monthly</p>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                              <ul className="space-y-2 flex-1 mb-4">
                                {plan.features.map(f => (
                                  <li key={f} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground">{f}</span>
                                  </li>
                                ))}
                              </ul>
                              <Button className={`w-full bg-gradient-to-r ${plan.color} text-white border-0 hover:opacity-90`}>
                                Choose {plan.name} <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP: Payment method */}
              {step === "method" && selectedPlan && (
                <motion.div key="method" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-5">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setStep("plans")} className="gap-1">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {selectedPlan.name} Plan — ${planPrice}/{billing === "annual" ? "year" : "month"}
                      </p>
                      <p className="text-sm text-muted-foreground">Choose your payment method</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {PAYMENT_METHODS.map(method => (
                      <motion.button key={method.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedMethod(method); setStep("instructions"); }}
                        className="flex items-center gap-4 p-4 rounded-2xl border-2 border-blue-100 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group">
                        <div className="h-14 w-20 rounded-xl bg-white border border-blue-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          <img src={method.logo} alt={method.name} className="h-12 w-full object-contain p-1" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{method.name}</p>
                          <p className="text-xs text-muted-foreground">{method.country}</p>
                          {method.contact ? (
                            <p className="text-xs text-amber-600 mt-0.5">WhatsApp required</p>
                          ) : (
                            <p className="text-xs text-blue-700 font-mono mt-0.5">{method.number}</p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-700 ml-auto shrink-0 transition-colors" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP: Instructions */}
              {step === "instructions" && selectedPlan && selectedMethod && (
                <motion.div key="instructions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-5">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setStep("method")} className="gap-1">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <div>
                      <p className="font-semibold text-slate-900">Pay via {selectedMethod.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedMethod.country}</p>
                    </div>
                  </div>

                  {selectedMethod.contact ? (
                    /* WhatsApp contact flow for Sahal/M-Pesa */
                    <Card className="border-amber-200 bg-amber-50/50">
                      <CardContent className="p-6 space-y-5">
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-20 rounded-xl bg-white border border-amber-200 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={selectedMethod.logo} alt={selectedMethod.name} className="h-12 w-full object-contain p-1" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-slate-900">{selectedMethod.name} Payment</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              For {selectedMethod.name} payments, please contact administration through WhatsApp before sending payment.
                            </p>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-2">
                          <p className="text-sm font-semibold text-slate-700">Your selected plan:</p>
                          <p className="text-blue-700 font-bold">{selectedPlan.name} Plan — ${planPrice}/{billing === "annual" ? "year" : "month"}</p>
                        </div>

                        <a href={WA_URL} target="_blank" rel="noopener noreferrer">
                          <Button className="w-full bg-[#25D366] hover:bg-[#1da855] text-white gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Contact Admin on WhatsApp
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>

                        <p className="text-xs text-center text-muted-foreground">
                          After confirming with admin, upload your payment proof below
                        </p>

                        <Button variant="outline" className="w-full" onClick={() => setStep("upload")}>
                          I've paid — Upload Proof <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    /* Direct payment flow */
                    <div className="space-y-4">
                      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-5">
                            <div className="h-16 w-24 rounded-xl bg-white border border-blue-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                              <img src={selectedMethod.logo} alt={selectedMethod.name} className="h-14 w-full object-contain p-1" />
                            </div>
                            <div className="space-y-3 flex-1">
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Send To</p>
                                <p className="text-2xl font-bold text-slate-900 font-mono">{selectedMethod.number}</p>
                                <p className="text-sm text-blue-700">{selectedMethod.name} · {selectedMethod.country}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Amount</p>
                                <p className="text-2xl font-bold text-emerald-700">${planPrice} USD</p>
                                <p className="text-xs text-muted-foreground">{selectedPlan.name} Plan · {billing === "annual" ? "Annual" : "Monthly"}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-blue-100">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Payment Instructions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {[
                            `Open your ${selectedMethod.name} app or dial the USSD code`,
                            `Send $${planPrice} USD to ${selectedMethod.number}`,
                            "Add a note with your name and 'Al Bayaan Academy'",
                            "Take a screenshot of the confirmation",
                            "Click the button below to upload your proof",
                          ].map((instruction, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="h-6 w-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                {i + 1}
                              </div>
                              <p className="text-sm text-slate-700">{instruction}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white h-12 gap-2 text-base" onClick={() => setStep("upload")}>
                        I've Paid — Upload Screenshot <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP: Upload proof */}
              {step === "upload" && selectedPlan && selectedMethod && (
                <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-5">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setStep("instructions")} className="gap-1">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <div>
                      <p className="font-semibold text-slate-900">Upload Payment Proof</p>
                      <p className="text-sm text-muted-foreground">Fill in the details and attach your screenshot</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-4">
                      <Card className="border-blue-100">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-700" /> Payment Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction / Reference Number *</Label>
                            <Input className="mt-1" placeholder="e.g. TXN123456789" value={transactionNumber} onChange={e => setTransactionNumber(e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Date *</Label>
                            <Input type="date" className="mt-1" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Phone/Sender Number</Label>
                            <Input className="mt-1" placeholder="e.g. +252 61 1234567" value={senderNumber} onChange={e => setSenderNumber(e.target.value)} />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-blue-100">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Your Details (Optional)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                            <Input className="mt-1" placeholder="Your full name" value={studentName} onChange={e => setStudentName(e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                            <Input type="email" className="mt-1" placeholder="your@email.com" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course / Note (Optional)</Label>
                            <Input className="mt-1" placeholder="e.g. Quran + Tajweed, for my child…" value={courseName} onChange={e => setCourseName(e.target.value)} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <Card className="border-blue-100">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <FileImage className="h-4 w-4 text-blue-700" /> Payment Screenshot *
                          </CardTitle>
                          <CardDescription className="text-xs">Upload your payment confirmation screenshot (PNG, JPG — max 5MB)</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <input ref={fileRef} type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
                          {proofImage ? (
                            <div className="space-y-3">
                              <div className="relative rounded-xl overflow-hidden border-2 border-emerald-300 bg-emerald-50">
                                <img src={proofImage} alt="Payment proof" className="w-full max-h-52 object-contain" />
                                <button onClick={() => { setProofImage(null); setProofFileName(""); }}
                                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 border shadow flex items-center justify-center hover:bg-red-50">
                                  <X className="h-3.5 w-3.5 text-red-600" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 text-emerald-700 text-sm">
                                <CheckCircle2 className="h-4 w-4" /> {proofFileName}
                              </div>
                            </div>
                          ) : (
                            <div
                              onDrop={handleDrop}
                              onDragOver={e => e.preventDefault()}
                              onClick={() => fileRef.current?.click()}
                              className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group">
                              <Upload className="h-10 w-10 text-blue-300 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                              <p className="font-medium text-slate-700">Click or drag to upload</p>
                              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, JPEG up to 5MB</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className={`border-2 ${ocrRunning ? "border-blue-300 bg-blue-50/80" : ocrDone && !ocrError ? "border-emerald-300 bg-emerald-50/60" : ocrError ? "border-amber-300 bg-amber-50/60" : "border-blue-100 bg-blue-50/50"}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <ScanLine className={`h-5 w-5 shrink-0 mt-0.5 ${ocrRunning ? "text-blue-600 animate-pulse" : ocrDone && !ocrError ? "text-emerald-600" : "text-blue-700"}`} />
                            <div className="text-sm flex-1">
                              <p className="font-semibold text-slate-900">
                                {ocrRunning ? "🔍 Scanning screenshot with OCR…" : ocrDone && !ocrError ? "✅ Screenshot scanned via OCR" : ocrError ? "⚠️ OCR scan failed — manual entry required" : "AI OCR Verification"}
                              </p>
                              {ocrRunning && (
                                <div className="mt-2 space-y-1">
                                  <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                                  </div>
                                  <p className="text-xs text-blue-600">Extracting text from your screenshot… {ocrProgress}%</p>
                                </div>
                              )}
                              {!ocrRunning && !ocrDone && (
                                <p className="text-muted-foreground text-xs mt-0.5">Upload your screenshot above — OCR will scan it automatically to verify receiver number and amount.</p>
                              )}
                              {ocrDone && !ocrError && ocrText.length > 0 && (
                                <p className="text-emerald-700 text-xs mt-0.5">Text extracted from screenshot. Your payment will be verified against our official numbers.</p>
                              )}
                              {ocrError && (
                                <p className="text-amber-700 text-xs mt-0.5">Could not read the screenshot. Fill in details manually — admin will verify.</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className={`rounded-xl p-4 text-sm flex items-start gap-2 border ${ocrDone && !ocrError ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>{ocrDone && !ocrError ? "Screenshot scanned. High-confidence payments are <strong>automatically verified</strong>. Others go to admin review." : "Our AI scans your screenshot to verify the payment automatically. Low-confidence payments go to admin review."}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={submitProof}
                    disabled={processing || !proofImage || !transactionNumber.trim()}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white h-12 gap-2 text-base"
                  >
                    {processing ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Submitting & Analyzing…</>
                    ) : (
                      <><Upload className="h-5 w-5" /> Submit Payment Proof</>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* STEP: Done */}
              {step === "done" && aiReport && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">

                  {/* ── Status Banner ── */}
                  <div className={`rounded-2xl p-6 text-center border-2 ${
                    autoVerified ? "bg-emerald-50 border-emerald-300" :
                    rejected     ? "bg-red-50 border-red-300" :
                    "bg-amber-50 border-amber-200"
                  }`}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.15 }}
                      className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                        autoVerified ? "bg-emerald-500" : rejected ? "bg-red-500" : "bg-amber-400"
                      }`}>
                      {autoVerified
                        ? <CheckCheck className="h-8 w-8 text-white" />
                        : rejected
                        ? <X className="h-8 w-8 text-white" />
                        : <Clock className="h-8 w-8 text-white" />
                      }
                    </motion.div>

                    {autoVerified && (
                      <>
                        <h2 className="text-xl font-bold text-emerald-800">Payment Verified</h2>
                        <p className="text-emerald-700 text-sm mt-1">All checks passed. Access will be activated shortly.</p>
                      </>
                    )}
                    {rejected && (
                      <>
                        <h2 className="text-xl font-bold text-red-800">Payment Proof Rejected</h2>
                        <p className="text-red-700 text-sm mt-1 font-medium">{aiReport.rejectionReason}</p>
                      </>
                    )}
                    {!autoVerified && !rejected && (
                      <>
                        <h2 className="text-xl font-bold text-amber-800">Screenshot Under Review</h2>
                        <p className="text-amber-700 text-sm mt-1">Your image could not be fully read. Admin will review manually.</p>
                      </>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 font-mono">Ref: {submittedRef}</p>
                  </div>

                  {/* ── Extracted Data (only when not rejected with unreadable) ── */}
                  {aiReport.recommendation !== "REVIEW_REQUIRED" && (
                    <Card className="border-slate-200">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <ScanLine className="h-4 w-4 text-blue-600" /> Verification Report — Tesseract OCR
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { label: "Plan", value: aiReport.planRequested },
                            { label: "Method", value: aiReport.paymentMethod },
                            { label: "Expected Amount", value: aiReport.expectedAmount },
                            { label: "Amount in Screenshot", value: aiReport.amountDetected },
                            { label: "Transaction ID", value: aiReport.transactionId },
                            { label: "Date Detected", value: aiReport.paymentDate },
                            { label: "Sender Number", value: aiReport.senderNumber },
                            { label: "Provider Detected", value: aiReport.detectedProvider },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-slate-50 rounded-lg p-2.5">
                              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
                              <p className={`font-medium mt-0.5 break-words ${value === "Not found" || value === "Not detected" ? "text-red-600" : "text-slate-800"}`}>{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Per-check results */}
                        <div className="space-y-1 pt-1 border-t">
                          {aiReport.checks?.map((c: string, i: number) => {
                            const pass = c.startsWith("✅");
                            const fail = c.startsWith("❌");
                            return (
                              <p key={i} className={`text-xs flex items-start gap-2 ${fail ? "text-red-700 font-medium" : pass ? "text-emerald-700" : "text-amber-700"}`}>
                                <span className="shrink-0">{pass ? "✅" : fail ? "❌" : "⚠️"}</span>
                                <span>{c.replace(/^[✅❌⚠️]\s*/, "")}</span>
                              </p>
                            );
                          })}
                        </div>

                        {/* Verdict */}
                        <div className={`rounded-lg p-3 border text-xs font-medium ${
                          autoVerified ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                          rejected     ? "bg-red-50 border-red-200 text-red-800" :
                          "bg-amber-50 border-amber-200 text-amber-800"
                        }`}>
                          <span className="uppercase tracking-wider text-[10px] block mb-0.5 opacity-70">Verdict</span>
                          {aiReport.aiNote}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* ── Actions ── */}
                  <div className="flex gap-3">
                    {rejected ? (
                      <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => {
                        setStep("proof"); setAiReport(null); setProofImage(null);
                        setProofFileName(""); setOcrText(""); setOcrDone(false);
                        setOcrError(false); setRejected(false); setAutoVerified(false);
                      }}>
                        <Upload className="h-4 w-4 mr-2" /> Upload Correct Screenshot
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" className="flex-1" onClick={() => setActiveTab("history")}>
                          <History className="h-4 w-4 mr-2" /> View History
                        </Button>
                        <Button className="flex-1 bg-blue-700 hover:bg-blue-800 text-white" onClick={() => {
                          setStep("plans"); setSelectedPlan(null); setSelectedMethod(null);
                          setProofImage(null); setProofFileName(""); setTransactionNumber("");
                          setPaymentDate(""); setSenderNumber(""); setStudentName("");
                          setStudentEmail(""); setCourseName(""); setAiReport(null);
                          setOcrText(""); setOcrDone(false); setOcrError(false);
                          setAutoVerified(false); setRejected(false);
                        }}>
                          New Payment
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Contact admin fallback */}
                  {rejected && (
                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 flex items-start gap-3 border">
                      <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
                      <p>Still having trouble? <a href="https://wa.me/252656042512" target="_blank" rel="noopener noreferrer" className="text-green-700 font-semibold underline">Contact admin on WhatsApp</a> and send your screenshot directly.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Accepted Payment Methods display */}
            {step === "plans" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <Card className="border-blue-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700">Accepted Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                      {PAYMENT_METHODS.map(m => (
                        <div key={m.id} className="flex flex-col items-center gap-2">
                          <div className="h-12 w-16 rounded-lg border border-blue-100 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                            <img src={m.logo} alt={m.name} className="h-10 w-full object-contain p-1" />
                          </div>
                          <span className="text-[10px] font-medium text-center leading-tight">{m.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
