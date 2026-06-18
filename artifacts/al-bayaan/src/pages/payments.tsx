import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, CreditCard, Smartphone, Star, Zap, Crown, BookOpen, Loader2, History, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface PaymentRecord {
  id: number;
  planId: string;
  planName: string;
  billing: string;
  method: string;
  amount: string;
  currency: string;
  reference: string;
  status: string;
  createdAt: string;
}

function PaymentHistory() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payments/history", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setRecords(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-16" />)}</div>;

  if (records.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-10 text-center">
          <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No payment history yet</p>
          <p className="text-sm text-muted-foreground mt-1">Your initiated payments will appear here</p>
        </CardContent>
      </Card>
    );
  }

  const METHOD_LABELS: Record<string, string> = {
    zaad: "Zaad", evc: "EVC Plus", edahab: "eDahab",
    stripe: "Card (Stripe)", paypal: "PayPal",
  };
  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-3">
      {records.map(r => (
        <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{r.planName} Plan <span className="text-muted-foreground font-normal">· {r.billing}</span></p>
                    <p className="text-xs text-muted-foreground">{METHOD_LABELS[r.method] ?? r.method} · Ref: <span className="font-mono">{r.reference}</span></p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm">${r.amount} <span className="text-muted-foreground font-normal text-xs">{r.currency}</span></p>
                  <Badge className={`text-xs mt-1 border-0 ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>{r.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

interface Plan {
  id: string;
  name: string;
  nameAr: string;
  price: { monthly: number; annual: number };
  currency: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    nameAr: "مجاني",
    price: { monthly: 0, annual: 0 },
    currency: "USD",
    icon: <BookOpen className="h-5 w-5" />,
    color: "gray",
    features: [
      "Access to Quran recitation",
      "Basic Tajweed feedback",
      "5 AI Teacher messages/day",
      "Progress tracking",
      "Community leaderboard",
    ],
  },
  {
    id: "student",
    name: "Student",
    nameAr: "طالب",
    price: { monthly: 9.99, annual: 7.99 },
    currency: "USD",
    icon: <Star className="h-5 w-5" />,
    color: "emerald",
    popular: true,
    features: [
      "Everything in Free",
      "Unlimited AI Teacher",
      "Voice Teacher access",
      "Video Teacher access",
      "Hifdh tracking",
      "Tajweed analytics",
      "Download certificates",
      "Priority support",
    ],
  },
  {
    id: "family",
    name: "Family",
    nameAr: "عائلي",
    price: { monthly: 19.99, annual: 15.99 },
    currency: "USD",
    icon: <Zap className="h-5 w-5" />,
    color: "blue",
    features: [
      "Everything in Student",
      "Up to 5 family members",
      "Parent dashboard",
      "AI Content Generator",
      "Advanced analytics",
      "Teacher-parent messaging",
      "Custom study plans",
    ],
  },
  {
    id: "institute",
    name: "Institute",
    nameAr: "مؤسسة",
    price: { monthly: 99, annual: 79 },
    currency: "USD",
    icon: <Crown className="h-5 w-5" />,
    color: "purple",
    features: [
      "Everything in Family",
      "Unlimited students",
      "Teacher dashboard",
      "Exam builder",
      "Custom branding",
      "Bulk certificates",
      "API access",
      "Dedicated support",
    ],
  },
];

const PAYMENT_METHODS = [
  { id: "zaad", name: "Zaad", country: "🇸🇴 Somalia", logo: "📱", desc: "Hormuud Telesom mobile money" },
  { id: "evc", name: "EVC Plus", country: "🇸🇴 Somalia", logo: "📲", desc: "Hormuud EVC mobile payment" },
  { id: "edahab", name: "eDahab", country: "🇸🇴 Somalia", logo: "💳", desc: "Dahabshiil digital wallet" },
  { id: "stripe", name: "Card (Stripe)", country: "🌍 International", logo: "💳", desc: "Visa, Mastercard, AMEX" },
  { id: "paypal", name: "PayPal", country: "🌍 International", logo: "🔵", desc: "PayPal account or card" },
];

function PlanCard({ plan, billing, onSelect }: { plan: Plan; billing: "monthly" | "annual"; onSelect: () => void }) {
  const price = billing === "annual" ? plan.price.annual : plan.price.monthly;
  const colorMap: Record<string, { card: string; badge: string; btn: string }> = {
    gray: { card: "border-gray-200", badge: "bg-gray-100 text-gray-700", btn: "bg-gray-800 hover:bg-gray-900 text-white" },
    emerald: { card: "border-emerald-200 ring-2 ring-emerald-500", badge: "bg-emerald-100 text-emerald-700", btn: "bg-emerald-600 hover:bg-emerald-700 text-white" },
    blue: { card: "border-blue-200", badge: "bg-blue-100 text-blue-700", btn: "bg-blue-600 hover:bg-blue-700 text-white" },
    purple: { card: "border-purple-200", badge: "bg-purple-100 text-purple-700", btn: "bg-purple-600 hover:bg-purple-700 text-white" },
  };
  const c = colorMap[plan.color];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`relative h-full flex flex-col ${c.card}`}>
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-emerald-600 text-white border-0 px-3 py-1">Most Popular</Badge>
          </div>
        )}
        <CardHeader className="pb-4">
          <div className={`h-10 w-10 rounded-xl ${c.badge} flex items-center justify-center mb-3`}>
            {plan.icon}
          </div>
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          <CardDescription className="text-sm font-arabic">{plan.nameAr}</CardDescription>
          <div className="mt-2">
            {price === 0 ? (
              <span className="text-3xl font-bold">Free</span>
            ) : (
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold">${price}</span>
                <span className="text-sm text-muted-foreground mb-1">/month</span>
              </div>
            )}
            {billing === "annual" && price > 0 && (
              <p className="text-xs text-emerald-600 mt-1">Save 20% with annual billing</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ul className="space-y-2 flex-1 mb-4">
            {plan.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
          <Button onClick={onSelect} className={`w-full ${c.btn}`} disabled={plan.id === "free"}>
            {plan.id === "free" ? "Current Plan" : `Get ${plan.name}`}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Payments() {
  const { toast } = useToast();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === "free") return;
    setSelectedPlan(plan);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !selectedMethod) {
      toast({ title: "Select payment method", description: "Please choose how you want to pay.", variant: "destructive" });
      return;
    }
    setProcessing(true);
    try {
      const r = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId: selectedPlan.id, billing, method: selectedMethod }),
      });
      const data = await r.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast({ title: "Payment initiated", description: data.instructions || "Follow the instructions to complete payment." });
      }
    } catch {
      toast({ title: "Error", description: "Could not initiate payment. Please try again.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold text-emerald-950 flex items-center justify-center gap-2">
            <CreditCard className="h-7 w-7 text-emerald-600" />
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground">Invest in your Islamic education. Cancel anytime.</p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm ${billing === "monthly" ? "text-foreground font-medium" : "text-muted-foreground"}`}>Monthly</span>
          <button
            onClick={() => setBilling(b => b === "monthly" ? "annual" : "monthly")}
            className={`relative w-12 h-6 rounded-full transition-colors ${billing === "annual" ? "bg-emerald-600" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${billing === "annual" ? "left-6" : "left-0.5"}`} />
          </button>
          <span className={`text-sm ${billing === "annual" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            Annual <Badge className="bg-emerald-100 text-emerald-700 border-0 ml-1">Save 20%</Badge>
          </span>
        </div>

        {/* Plans grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => (
            <PlanCard key={plan.id} plan={plan} billing={billing} onSelect={() => handleSelectPlan(plan)} />
          ))}
        </div>

        {/* Payment method selection */}
        {selectedPlan && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-emerald-600" />
                  Pay for {selectedPlan.name} Plan — ${billing === "annual" ? selectedPlan.price.annual : selectedPlan.price.monthly}/month
                </CardTitle>
                <CardDescription>Choose your payment method</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PAYMENT_METHODS.map(method => (
                    <button key={method.id} onClick={() => setSelectedMethod(method.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedMethod === method.id ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"
                      }`}>
                      <span className="text-2xl">{method.logo}</span>
                      <div>
                        <p className="font-semibold text-sm">{method.name}</p>
                        <p className="text-xs text-muted-foreground">{method.country}</p>
                        <p className="text-xs text-muted-foreground">{method.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setSelectedPlan(null)}>Back</Button>
                  <Button onClick={handlePayment} disabled={processing || !selectedMethod}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
                    {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing…</> : `Pay with ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name || "selected method"}`}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  🔒 Secure payment. Your data is protected. Cancel anytime from settings.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Features comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accepted Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              {PAYMENT_METHODS.map(m => (
                <div key={m.id} className="flex flex-col items-center gap-1">
                  <span className="text-2xl">{m.logo}</span>
                  <span className="text-xs font-medium">{m.name}</span>
                  <span className="text-[10px] text-muted-foreground">{m.country}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <div>
          <h2 className="text-lg font-semibold text-emerald-950 flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-emerald-600" /> Payment History
          </h2>
          <PaymentHistory />
        </div>
      </div>
    </AppLayout>
  );
}
