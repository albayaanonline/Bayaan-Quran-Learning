import { useQuery } from "@tanstack/react-query";
import { useUser, useAuth } from "@clerk/react";

export interface SubscriptionStatus {
  trialStatus: "active" | "expired" | "none";
  trialStartDate: string | null;
  trialEndDate: string | null;
  trialDaysLeft: number;
  trialHoursLeft: number;
  trialMinutesLeft: number;
  trialSecondsLeft: number;
  trialActive: boolean;
  subscriptionPlan: "starter" | "standard" | "premium" | null;
  subscriptionStatus: "active" | "cancelled" | "expired" | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  subscriptionBilling: "monthly" | "annual" | null;
  hasActiveSubscription: boolean;
  hasAccess: boolean;
  effectivePlan: string | null;
  permissions: string[];
  planLabel: string | null;
  displayName: string;
}

const BASE = ((import.meta.env.VITE_API_BASE_URL as string) || "").replace(/\/$/, "");

export function useSubscription() {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();

  const query = useQuery<SubscriptionStatus>({
    queryKey: ["subscription-status"],
    queryFn: async () => {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${BASE}/api/subscription/status`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) throw new Error("Failed to fetch subscription status");
      return res.json();
    },
    enabled: isLoaded && !!isSignedIn,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const status = query.data;

  const hasFeature = (feature: string): boolean => {
    if (query.isLoading || query.isPending || !status) return true;
    if (!status.hasAccess) return false;
    if (status.permissions.includes("all")) return true;
    return status.permissions.includes(feature);
  };

  return {
    ...query,
    status,
    hasAccess: status?.hasAccess ?? true,
    trialActive: status?.trialActive ?? false,
    hasActiveSubscription: status?.hasActiveSubscription ?? false,
    effectivePlan: status?.effectivePlan ?? null,
    planLabel: status?.planLabel ?? null,
    hasFeature,
  };
}
