import { ReactNode } from "react";
import { Link } from "wouter";
import { Lock, Crown, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import TrialCountdown from "./TrialCountdown";

interface Props {
  feature?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter ($5/mo)",
  standard: "Standard ($10/mo)",
  premium: "Premium ($15/mo)",
};

export default function SubscriptionGate({ feature, children, fallback }: Props) {
  const { status, isLoading, isPending, hasAccess, hasFeature } = useSubscription();

  if (isLoading || isPending || !status) return <>{children}</>;

  const allowed = feature ? hasFeature(feature) : hasAccess;

  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  const isTrialExpired = status?.trialStatus === "expired";
  const hasNoPlan = !status?.subscriptionPlan;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="max-w-md w-full mx-auto">
        {/* Lock icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/60 dark:to-indigo-950/40 flex items-center justify-center shadow-lg">
              <Lock className="h-9 w-9 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-md">
              <Crown className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        </div>

        {isTrialExpired && hasNoPlan ? (
          <>
            <h2 className="text-xl font-bold text-foreground mb-2">Free Trial Expired</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Your 2-day free trial has ended. Subscribe to a plan to continue accessing this content and all premium features.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-foreground mb-2">Subscription Required</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              This content is available with a paid subscription. Choose a plan that fits your needs.
            </p>
          </>
        )}

        {/* Plan options */}
        <div className="space-y-2.5 mb-6 text-left">
          {[
            { id: "starter", price: "$5/mo or $50/yr", features: ["Basic Quran courses", "Limited AI usage", "Basic resources"], color: "border-blue-200 dark:border-blue-800/40" },
            { id: "standard", price: "$10/mo or $100/yr", features: ["More courses & AI", "Certificates", "Voice & Tajweed teacher"], color: "border-indigo-200 dark:border-indigo-800/40", popular: true },
            { id: "premium", price: "$15/mo or $150/yr", features: ["Full platform access", "Unlimited AI", "All certificates & courses"], color: "border-amber-200 dark:border-amber-800/40" },
          ].map((plan) => (
            <div key={plan.id} className={`relative rounded-xl border-2 p-3.5 ${plan.color} bg-card/50`}>
              {plan.popular && (
                <span className="absolute -top-2.5 left-3 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                  Most Popular
                </span>
              )}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold capitalize">{plan.id}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.price}</p>
                  <ul className="mt-1.5 space-y-0.5">
                    {plan.features.map((f) => (
                      <li key={f} className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5 text-blue-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Link href="/payments">
          <Button className="w-full bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white font-semibold shadow-lg shadow-blue-900/20 gap-2">
            Choose a Plan
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>

        <p className="text-xs text-muted-foreground mt-3">
          Mobile money payment — Zaad, eDahab, EVC, E-Pirr
        </p>
      </div>
    </div>
  );
}
