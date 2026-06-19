import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, CreditCard, Smartphone, Star, Zap, Crown, BookOpen, Loader2, History, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
    fetch(`${basePath}/api/payments/history`, { credentials: "include" })
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
          <p className="font-medium">{t("pay.noHistory")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("pay.noHistorySub")}</p>
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
                    <p className="font-medium text-sm">{r.planName} {t("pay.plan")} <span className="text-muted-foreground font-normal">· {r.billing}</span></p>
                    <p className="text-xs text-muted-foreground">{METHOD_LABELS[r.method] ?? r.method} · Ref: <span className="font-mono">{r.reference}</span></p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(r.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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
  nameKey: string;
  nameAr: string;
  nameSo: string;
  price: { monthly: number; annual: number };
  currency: string;
  featuresKeys: string[];
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    nameKey: "Free",
    nameAr: "مجاني",
    nameSo: "Bilaash",
    price: { monthly: 0, annual: 0 },
    currency: "USD",
    icon: <BookOpen className="h-5 w-5" />,
    color: "gray",
    featuresKeys: [
      "Helitaanka tilmaamida Quraanka / Access to Quran recitation",
      "Jawaab-celin Tajwiid aasaasiga / Basic Tajweed feedback",
      "5 farriimo AI macalinka/maalin / 5 AI Teacher messages/day",
      "La socod horumarkaaga / Progress tracking",
      "Liiska tartanka / Community leaderboard",
    ],
  },
  {
    id: "student",
    nameKey: "Student",
    nameAr: "طالب",
    nameSo: "Arday",
    price: { monthly: 9.99, annual: 7.99 },
    currency: "USD",
    icon: <Star className="h-5 w-5" />,
    color: "emerald",
    popular: true,
    featuresKeys: [
      "Wax kasta oo Bilaash / Everything in Free",
      "AI Macalinka aan xaddidnayn / Unlimited AI Teacher",
      "Macalinka Codka / Voice Teacher access",
      "Macalinka Muuqaalka / Video Teacher access",
      "La socod Xafidka / Hifdh tracking",
      "Falanqaynta Tajwiid / Tajweed analytics",
      "Soo deji shahaadooyinka / Download certificates",
      "Taageerada mudnaanta / Priority support",
    ],
  },
  {
    id: "family",
    nameKey: "Family",
    nameAr: "عائلي",
    nameSo: "Qoyska",
    price: { monthly: 19.99, annual: 15.99 },
    currency: "USD",
    icon: <Zap className="h-5 w-5" />,
    color: "blue",
    featuresKeys: [
      "Wax kasta oo Arday / Everything in Student",
      "Ilaa 5 xubnood qoyska / Up to 5 family members",
      "Guddiga waalidka / Parent dashboard",
      "Wax soo saarka machadka AI / AI Content Generator",
      "Falanqayn horumarsan / Advanced analytics",
      "Xiriirka macalinka-waalidka / Teacher-parent messaging",
      "Qorshayaasha barashada gaarka ah / Custom study plans",
    ],
  },
  {
    id: "institute",
    nameKey: "Institute",
    nameAr: "مؤسسة",
    nameSo: "Machadka",
    price: { monthly: 99, annual: 79 },
    currency: "USD",
    icon: <Crown className="h-5 w-5" />,
    color: "purple",
    featuresKeys: [
      "Wax kasta oo Qoyska / Everything in Family",
      "Ardayda aan xaddidnayn / Unlimited students",
      "Guddiga macalinka / Teacher dashboard",
      "Dhisaha imtixaanka / Exam builder",
      "Astaan gaarka ah / Custom branding",
      "Shahaadooyinka badan / Bulk certificates",
      "Gelitaanka API / API access",
      "Taageero go'an / Dedicated support",
    ],
  },
];

const PAYMENT_METHODS = [
  { id: "zaad", name: "Zaad", country: "🇸🇴 Soomaaliya", logo: "📱", desc: "Lacagta mobilka Hormuud Telesom" },
  { id: "evc", name: "EVC Plus", country: "🇸🇴 Soomaaliya", logo: "📲", desc: "Lacag bixinta mobilka Hormuud EVC" },
  { id: "edahab", name: "eDahab", country: "🇸🇴 Soomaaliya", logo: "💳", desc: "Xafiilad dhijitaalka Dahabshiil" },
  { id: "stripe", name: "Card (Stripe)", country: "🌍 Caalamiga", logo: "💳", desc: "Visa, Mastercard, AMEX" },
  { id: "paypal", name: "PayPal", country: "🌍 Caalamiga", logo: "🔵", desc: "Xisaabta PayPal ama kaarka" },
];

function PlanCard({ plan, billing, onSelect, locale }: { plan: Plan; billing: "monthly" | "annual"; onSelect: () => void; locale: string }) {
  const { t } = useI18n();
  const price = billing === "annual" ? plan.price.annual : plan.price.monthly;
  const colorMap: Record<string, { card: string; badge: string; btn: string }> = {
    gray: { card: "border-gray-200", badge: "bg-gray-100 text-gray-700", btn: "bg-gray-800 hover:bg-gray-900 text-white" },
    emerald: { card: "border-emerald-200 ring-2 ring-emerald-500", badge: "bg-emerald-100 text-emerald-700", btn: "bg-emerald-600 hover:bg-emerald-700 text-white" },
    blue: { card: "border-blue-200", badge: "bg-blue-100 text-blue-700", btn: "bg-blue-600 hover:bg-blue-700 text-white" },
    purple: { card: "border-purple-200", badge: "bg-purple-100 text-purple-700", btn: "bg-purple-600 hover:bg-purple-700 text-white" },
  };
  const c = colorMap[plan.color];
  const displayName = locale === "so" ? plan.nameSo : locale === "ar" ? plan.nameAr : plan.nameKey;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`relative h-full flex flex-col ${c.card}`}>
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-emerald-600 text-white border-0 px-3 py-1">{t("pay.mostPopular")}</Badge>
          </div>
        )}
        <CardHeader className="pb-4">
          <div className={`h-10 w-10 rounded-xl ${c.badge} flex items-center justify-center mb-3`}>
            {plan.icon}
          </div>
          <CardTitle className="text-lg">{displayName}</CardTitle>
          <CardDescription className="text-sm">{plan.nameAr}</CardDescription>
          <div className="mt-2">
            {price === 0 ? (
              <span className="text-3xl font-bold">{t("pay.free")}</span>
            ) : (
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold">${price}</span>
                <span className="text-sm text-muted-foreground mb-1">{t("pay.perMonth")}</span>
              </div>
            )}
            {billing === "annual" && price > 0 && (
              <p className="text-xs text-emerald-600 mt-1">{t("pay.save20Annual")}</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ul className="space-y-2 flex-1 mb-4">
            {plan.featuresKeys.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
          <Button onClick={onSelect} className={`w-full ${c.btn}`} disabled={plan.id === "free"}>
            {plan.id === "free" ? t("pay.currentPlan") : `${t("pay.getPlan")} ${displayName}`}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Payments() {
  const { t, locale } = useI18n();
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
      toast({ title: t("pay.selectMethod"), description: t("pay.selectMethodSub"), variant: "destructive" });
      return;
    }
    setProcessing(true);
    try {
      const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
      const r = await fetch(`${basePath}/api/payments/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId: selectedPlan.id, billing, method: selectedMethod }),
      });
      const data = await r.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast({ title: t("pay.initiated"), description: data.instructions || "" });
      }
    } catch {
      toast({ title: t("general.error"), description: t("pay.error"), variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const selectedMethodName = PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name || "";

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold text-emerald-950 flex items-center justify-center gap-2">
            <CreditCard className="h-7 w-7 text-emerald-600" />
            {t("pay.title")}
          </h1>
          <p className="text-muted-foreground">{t("pay.subtitle")}</p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm ${billing === "monthly" ? "text-foreground font-medium" : "text-muted-foreground"}`}>{t("pay.monthly")}</span>
          <button
            onClick={() => setBilling(b => b === "monthly" ? "annual" : "monthly")}
            className={`relative w-12 h-6 rounded-full transition-colors ${billing === "annual" ? "bg-emerald-600" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${billing === "annual" ? "left-6" : "left-0.5"}`} />
          </button>
          <span className={`text-sm ${billing === "annual" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {t("pay.annual")} <Badge className="bg-emerald-100 text-emerald-700 border-0 ml-1">{t("pay.save20")}</Badge>
          </span>
        </div>

        {/* Plans grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => (
            <PlanCard key={plan.id} plan={plan} billing={billing} onSelect={() => handleSelectPlan(plan)} locale={locale} />
          ))}
        </div>

        {/* Payment method selection */}
        {selectedPlan && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-emerald-600" />
                  {t("pay.payFor")} {locale === "so" ? selectedPlan.nameSo : locale === "ar" ? selectedPlan.nameAr : selectedPlan.nameKey} {t("pay.plan")} — ${billing === "annual" ? selectedPlan.price.annual : selectedPlan.price.monthly}{t("pay.perMonth")}
                </CardTitle>
                <CardDescription>{t("pay.chooseMethod")}</CardDescription>
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
                  <Button variant="outline" onClick={() => setSelectedPlan(null)}>{t("general.back")}</Button>
                  <Button onClick={handlePayment} disabled={processing || !selectedMethod}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
                    {processing
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("pay.processing")}</>
                      : `${t("pay.payWith")} ${selectedMethodName}`}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">{t("pay.secure")}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Accepted payment methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("pay.acceptedMethods")}</CardTitle>
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
            <History className="h-5 w-5 text-emerald-600" /> {t("pay.history")}
          </h2>
          <PaymentHistory />
        </div>
      </div>
    </AppLayout>
  );
}
