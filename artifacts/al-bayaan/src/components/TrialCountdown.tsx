import { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(endDate: string | null): TimeLeft {
  if (!endDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const ms = new Date(endDate).getTime() - Date.now();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(ms / (1000 * 60 * 60 * 24)),
    hours: Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((ms % (1000 * 60)) / 1000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface Props {
  compact?: boolean;
}

export default function TrialCountdown({ compact = false }: Props) {
  const { status, isLoading } = useSubscription();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!status?.trialEndDate) return;

    const update = () => setTimeLeft(getTimeLeft(status.trialEndDate));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [status?.trialEndDate]);

  if (isLoading || !status) return null;

  // If they have an active paid subscription, show that instead
  if (status.hasActiveSubscription) {
    if (compact) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>{status.planLabel} Plan</span>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800/40 p-4 flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            {status.planLabel} Plan — Active
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
            Full access to your plan features
          </p>
        </div>
      </div>
    );
  }

  // Trial expired, no subscription
  if (status.trialStatus === "expired") {
    if (compact) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Trial expired</span>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800/40 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm font-semibold text-red-800 dark:text-red-200">Free trial has expired</p>
        </div>
        <p className="text-xs text-red-600 dark:text-red-400 mb-3">
          Subscribe to continue accessing all courses and AI teachers.
        </p>
        <Link href="/payments">
          <Button size="sm" className="w-full bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold">
            Subscribe Now
          </Button>
        </Link>
      </div>
    );
  }

  // Trial active — show countdown
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
        <Clock className="h-3.5 w-3.5" />
        <span>Trial: {timeLeft.days}d {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m left</span>
      </div>
    );
  }

  const isUrgent = timeLeft.days === 0;

  return (
    <div className={`rounded-xl border p-4 ${
      isUrgent
        ? "border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:bg-red-950/20 dark:border-red-800/40"
        : "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50/50 dark:bg-amber-950/20 dark:border-amber-800/40"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isUrgent ? "bg-red-100 dark:bg-red-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}>
          <Zap className={`h-4 w-4 ${isUrgent ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`} />
        </div>
        <div>
          <p className={`text-sm font-semibold ${isUrgent ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200"}`}>
            Your free trial expires in
          </p>
        </div>
      </div>

      {/* Countdown boxes */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: "Days", value: timeLeft.days },
          { label: "Hours", value: timeLeft.hours },
          { label: "Minutes", value: timeLeft.minutes },
          { label: "Seconds", value: timeLeft.seconds },
        ].map(({ label, value }) => (
          <div key={label} className={`rounded-lg text-center py-2 px-1 ${
            isUrgent
              ? "bg-red-100/80 dark:bg-red-900/40"
              : "bg-amber-100/80 dark:bg-amber-900/40"
          }`}>
            <div className={`text-xl font-bold tabular-nums ${
              isUrgent ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"
            }`}>
              {pad(value)}
            </div>
            <div className={`text-[9px] font-semibold uppercase tracking-wider mt-0.5 ${
              isUrgent ? "text-red-500 dark:text-red-400" : "text-amber-500 dark:text-amber-400"
            }`}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <Link href="/payments">
        <Button
          size="sm"
          className={`w-full font-semibold text-white ${
            isUrgent
              ? "bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400"
              : "bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400"
          }`}
        >
          Subscribe to Continue
        </Button>
      </Link>
    </div>
  );
}
