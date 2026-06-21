import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Clock, Zap, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { useUser } from "@clerk/react";
import { useSubscription } from "@/hooks/useSubscription";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(endDate: string | null | Date): TimeLeft {
  const ms = new Date(endDate ?? 0).getTime() - Date.now();
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

function CountdownBoxes({ timeLeft, accent }: { timeLeft: TimeLeft; accent: "blue" | "amber" | "red" | "green" }) {
  const colors = {
    blue: {
      box: "bg-blue-500/15 border border-blue-400/20",
      number: "text-blue-200",
      label: "text-blue-400/70",
    },
    amber: {
      box: "bg-amber-500/15 border border-amber-400/20",
      number: "text-amber-200",
      label: "text-amber-400/70",
    },
    red: {
      box: "bg-red-500/15 border border-red-400/20",
      number: "text-red-200",
      label: "text-red-400/70",
    },
    green: {
      box: "bg-emerald-500/15 border border-emerald-400/20",
      number: "text-emerald-200",
      label: "text-emerald-400/70",
    },
  }[accent];

  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {[
        { label: "Days", value: timeLeft.days },
        { label: "Hours", value: timeLeft.hours },
        { label: "Minutes", value: timeLeft.minutes },
        { label: "Seconds", value: timeLeft.seconds },
      ].map(({ label, value }) => (
        <div key={label} className={`rounded-xl text-center py-3 sm:py-4 px-2 ${colors.box} backdrop-blur-sm`}>
          <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold tabular-nums ${colors.number}`}>
            {pad(value)}
          </div>
          <div className={`text-[10px] sm:text-xs font-semibold uppercase tracking-widest mt-1 ${colors.label}`}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

function GuestBanner() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 2, hours: 0, minutes: 0, seconds: 0 });
  const demoEnd = useState(() => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))[0];

  useEffect(() => {
    const update = () => setTimeLeft(getTimeLeft(demoEnd));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [demoEnd]);

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="relative rounded-2xl border border-blue-500/20 bg-white/[0.04] backdrop-blur-md p-6 sm:p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 to-indigo-600/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 justify-center mb-2">
            <div className="h-6 w-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-white/60 uppercase tracking-widest">Free Trial Preview</p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white/90 text-center mb-1">
            Your Free Trial Expires In
          </h3>
          <p className="text-xs text-blue-300/60 text-center mb-6">
            Create your free account to activate your 2-day trial.
          </p>

          <CountdownBoxes timeLeft={timeLeft} accent="blue" />

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <Link href="/sign-up" className="w-full sm:flex-1">
              <Button className="w-full h-11 bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white font-bold rounded-full shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] transition-all duration-300">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing" className="w-full sm:flex-1">
              <Button variant="outline" className="w-full h-11 border-white/15 text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300">
                Subscribe Now
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-center text-[11px] text-white/30 leading-relaxed">
            After your free trial expires, a subscription is required to continue accessing courses and AI services.
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthenticatedBanner() {
  const { status, isLoading } = useSubscription();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!status?.trialEndDate) return;
    const update = () => setTimeLeft(getTimeLeft(status.trialEndDate));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [status?.trialEndDate]);

  if (isLoading || !status) return null;

  if (status.hasActiveSubscription) {
    return (
      <div className="relative max-w-2xl mx-auto">
        <div className="relative rounded-2xl border border-emerald-500/20 bg-white/[0.04] backdrop-blur-md p-6 sm:p-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/8 to-teal-600/5 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-bold text-white/90">{status.planLabel} Plan — Active</p>
              <p className="text-sm text-emerald-400/70 mt-0.5">You have full access to your plan features</p>
            </div>
            <Link href="/dashboard">
              <Button className="h-10 px-6 bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white font-semibold rounded-full transition-all duration-300">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status.trialStatus === "expired") {
    return (
      <div className="relative max-w-2xl mx-auto">
        <div className="relative rounded-2xl border border-red-500/20 bg-white/[0.04] backdrop-blur-md p-6 sm:p-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/8 to-orange-600/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 justify-center mb-4">
              <div className="h-6 w-6 rounded-lg bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              </div>
              <p className="text-sm font-semibold text-red-300/80">Free Trial Expired</p>
            </div>
            <p className="text-center text-white/50 text-sm mb-6">
              Your 2-day free trial has ended. Subscribe to continue accessing all courses and AI services.
            </p>
            <Link href="/pricing">
              <Button className="w-full h-11 bg-gradient-to-r from-red-700 to-orange-600 hover:from-red-600 hover:to-orange-500 text-white font-bold rounded-full transition-all duration-300">
                Subscribe Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="mt-4 text-center text-[11px] text-white/30 leading-relaxed">
              After your free trial expires, a subscription is required to continue accessing courses and AI services.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isUrgent = timeLeft.days === 0;
  const accent = isUrgent ? "red" : "amber";

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className={`relative rounded-2xl border backdrop-blur-md p-6 sm:p-8 overflow-hidden ${
        isUrgent ? "border-red-500/20 bg-white/[0.04]" : "border-amber-500/20 bg-white/[0.04]"
      }`}>
        <div className={`absolute inset-0 pointer-events-none ${
          isUrgent ? "bg-gradient-to-br from-red-600/8 to-orange-600/5" : "bg-gradient-to-br from-amber-600/8 to-yellow-600/5"
        }`} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 justify-center mb-2">
            <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${isUrgent ? "bg-red-500/20" : "bg-amber-500/20"}`}>
              <Zap className={`h-3.5 w-3.5 ${isUrgent ? "text-red-400" : "text-amber-400"}`} />
            </div>
            <p className={`text-sm font-semibold uppercase tracking-widest ${isUrgent ? "text-red-300/80" : "text-amber-300/80"}`}>
              Active Trial
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white/90 text-center mb-6">
            Your Free Trial Expires In
          </h3>

          <CountdownBoxes timeLeft={timeLeft} accent={accent} />

          <div className="mt-6">
            <Link href="/pricing">
              <Button className={`w-full h-11 font-bold text-white rounded-full transition-all duration-300 ${
                isUrgent
                  ? "bg-gradient-to-r from-red-700 to-orange-600 hover:from-red-600 hover:to-orange-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                  : "bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
              }`}>
                Subscribe Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-center text-[11px] text-white/30 leading-relaxed">
            After your free trial expires, a subscription is required to continue accessing courses and AI services.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageTrialBanner() {
  const { isLoaded, isSignedIn } = useUser();

  return (
    <div className="relative mt-10 w-full max-w-2xl mx-auto px-4">
      {!isLoaded ? null : isSignedIn ? (
        <AuthenticatedBanner />
      ) : (
        <GuestBanner />
      )}
    </div>
  );
}
