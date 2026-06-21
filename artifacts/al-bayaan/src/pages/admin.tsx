import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, Mic, MessageSquare, TrendingUp, Star, Activity, Shield,
  RefreshCw, CreditCard, CheckCheck, X, Eye, Search, Filter,
  Clock, AlertCircle, ChevronDown, ChevronUp, FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";

const BASE = (import.meta.env.BASE_URL || "").replace(/\/$/, "");

interface AdminStats {
  totalUsers: number;
  activeToday: number;
  totalRecordings: number;
  totalConversations: number;
  avgXp: number;
  avgScore: number;
  levelDistribution: Record<string, number>;
  newUsersToday: number;
}

interface AdminUser {
  id: number;
  clerkId: string;
  displayName: string;
  avatarUrl: string | null;
  level: string;
  xp: number;
  streakDays: number;
  totalRecordings: number;
  onboardingComplete: boolean;
  createdAt: string;
  lastStudyDate: string | null;
}

interface PaymentSubmission {
  id: number;
  userId: string;
  studentName: string;
  studentEmail: string;
  planName: string;
  billing: string;
  method: string;
  amount: string;
  currency: string;
  reference: string;
  status: string;
  createdAt: string;
  courseName: string;
  proofImage: string | null;
  proofAnalysis: any;
  adminNotes: string | null;
  transactionNumber: string;
  paymentDate: string;
  senderNumber: string;
}

function StatCard({ label, value, icon: Icon, sub, color = "blue" }: {
  label: string; value: string | number; icon: any; sub?: string; color?: string;
}) {
  return (
    <Card className="border-blue-100">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <div className={`h-9 w-9 rounded-xl bg-${color}-100 flex items-center justify-center`}>
            <Icon className={`h-4 w-4 text-${color}-700`} />
          </div>
        </div>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:        { label: "Pending",      color: "bg-amber-100 text-amber-700" },
  pending_review: { label: "Under Review", color: "bg-blue-100 text-blue-700" },
  approved:       { label: "Approved",     color: "bg-emerald-100 text-emerald-700" },
  completed:      { label: "Completed",    color: "bg-emerald-100 text-emerald-700" },
  rejected:       { label: "Rejected",     color: "bg-red-100 text-red-700" },
};

const METHOD_LABELS: Record<string, string> = {
  zaad: "Zaad", edahab: "eDahab", evc: "EVC Plus",
  epirr: "E-Pirr", sahal: "Sahal", mpesa: "M-Pesa",
  stripe: "Card (Stripe)", paypal: "PayPal",
};

function PaymentRow({ p, onAction }: { p: PaymentSubmission; onAction: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const s = STATUS_MAP[p.status] ?? STATUS_MAP.pending;

  const act = async (action: "approve" | "reject") => {
    setProcessing(true);
    try {
      const r = await fetch(`${BASE}/api/admin/payments/${p.id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ adminNotes: notes }),
      });
      if (!r.ok) throw new Error();
      onAction();
    } catch {
      alert("Action failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="border border-blue-100 rounded-xl overflow-hidden">
      <button className="w-full text-left px-4 py-4 hover:bg-blue-50/40 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <CreditCard className="h-4 w-4 text-blue-700" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-slate-900 truncate">
                {p.studentName || p.userId.slice(-8)} · {p.planName} Plan
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground">{METHOD_LABELS[p.method] ?? p.method}</p>
                <span className="text-muted-foreground text-xs">·</span>
                <p className="text-xs font-mono text-muted-foreground">{p.reference}</p>
                {p.proofImage && (
                  <span className="flex items-center gap-1 text-[10px] text-blue-600">
                    <FileImage className="h-3 w-3" /> proof attached
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <p className="font-bold text-slate-900">${p.amount} <span className="font-normal text-muted-foreground text-xs">{p.currency}</span></p>
            <Badge className={`border-0 text-xs ${s.color}`}>{s.label}</Badge>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }) : ""}
            </span>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-blue-100">
            <div className="p-4 space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: "Student Name", value: p.studentName || "Not provided" },
                  { label: "Student Email", value: p.studentEmail || "Not provided" },
                  { label: "Course / Note", value: p.courseName || "Not specified" },
                  { label: "Plan", value: `${p.planName} — ${p.billing}` },
                  { label: "Transaction #", value: p.transactionNumber || "Not provided" },
                  { label: "Payment Date", value: p.paymentDate || "Not provided" },
                  { label: "Sender Number", value: p.senderNumber || "Not provided" },
                  { label: "Amount", value: `$${p.amount} ${p.currency}` },
                  { label: "Method", value: METHOD_LABELS[p.method] ?? p.method },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-slate-900 mt-0.5 break-words">{value}</p>
                  </div>
                ))}
              </div>

              {/* Proof Image */}
              {p.proofImage && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Proof Screenshot</p>
                  <div className="rounded-xl overflow-hidden border border-blue-200 max-w-sm cursor-zoom-in"
                    onClick={() => setImageOpen(true)}>
                    <img src={p.proofImage} alt="Payment proof" className="w-full max-h-48 object-contain bg-slate-50" />
                  </div>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setImageOpen(true)}>
                    <Eye className="h-3.5 w-3.5" /> View Full Screenshot
                  </Button>
                </div>
              )}

              {/* AI Analysis Report */}
              {p.proofAnalysis && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Payment Analysis Report</p>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Confidence Score</span>
                      <span className={`text-sm font-bold ${
                        p.proofAnalysis.confidenceScore >= 65 ? "text-emerald-600" :
                        p.proofAnalysis.confidenceScore >= 40 ? "text-amber-600" : "text-red-600"
                      }`}>{p.proofAnalysis.confidenceScore}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        p.proofAnalysis.confidenceScore >= 65 ? "bg-emerald-500" :
                        p.proofAnalysis.confidenceScore >= 40 ? "bg-amber-500" : "bg-red-500"
                      }`} style={{ width: `${p.proofAnalysis.confidenceScore}%` }} />
                    </div>
                    <div className="space-y-1">
                      {p.proofAnalysis.checks?.map((c: string, i: number) => (
                        <p key={i} className="text-xs text-slate-700">{c}</p>
                      ))}
                    </div>
                    <div className={`rounded-lg p-3 text-sm ${
                      p.proofAnalysis.recommendation === "APPROVE" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                      p.proofAnalysis.recommendation === "REVIEW_REQUIRED" ? "bg-amber-50 text-amber-800 border border-amber-200" :
                      "bg-red-50 text-red-800 border border-red-200"
                    }`}>
                      <strong>AI Recommendation: {p.proofAnalysis.recommendation?.replace(/_/g, " ")}</strong>
                      <p className="text-xs mt-0.5 opacity-80">{p.proofAnalysis.aiNote}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin notes + action */}
              {(p.status === "pending" || p.status === "pending_review") && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Notes (optional)</label>
                    <Textarea className="mt-1 min-h-[70px] text-sm" placeholder="Add a note for the student…"
                      value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => act("approve")} disabled={processing}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                      {processing ? "Processing…" : <><CheckCheck className="h-4 w-4" /> Approve Payment</>}
                    </Button>
                    <Button onClick={() => act("reject")} disabled={processing} variant="outline"
                      className="flex-1 border-red-200 text-red-700 hover:bg-red-50 gap-2">
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                    <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Approving will mark the payment as approved and notify the student. Only approve after confirming the payment.
                  </div>
                </div>
              )}

              {(p.status === "approved" || p.status === "completed") && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-700 text-sm">
                  <CheckCheck className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Payment Approved</p>
                    {p.adminNotes && <p className="text-xs opacity-80">{p.adminNotes}</p>}
                  </div>
                </div>
              )}

              {p.status === "rejected" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-sm">
                  <X className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Payment Rejected</p>
                    {p.adminNotes && <p className="text-xs opacity-80">{p.adminNotes}</p>}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full image lightbox */}
      <AnimatePresence>
        {imageOpen && p.proofImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setImageOpen(false)}>
            <motion.img src={p.proofImage} alt="Payment proof" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
            <button onClick={() => setImageOpen(false)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30">
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaymentsTab() {
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${BASE}/api/admin/payments?status=${statusFilter}`, { credentials: "include" });
      if (!r.ok) { setError("Failed to load payments"); return; }
      setPayments(await r.json());
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const filtered = payments.filter(p => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return (
      p.studentName?.toLowerCase().includes(q) ||
      p.studentEmail?.toLowerCase().includes(q) ||
      p.reference?.toLowerCase().includes(q) ||
      p.planName?.toLowerCase().includes(q) ||
      p.method?.toLowerCase().includes(q)
    );
  });

  const counts = payments.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", count: payments.length, color: "bg-blue-100 text-blue-800" },
          { label: "Under Review", count: (counts.pending || 0) + (counts.pending_review || 0), color: "bg-amber-100 text-amber-800" },
          { label: "Approved", count: (counts.approved || 0) + (counts.completed || 0), color: "bg-emerald-100 text-emerald-800" },
          { label: "Rejected", count: counts.rejected || 0, color: "bg-red-100 text-red-800" },
        ].map(({ label, count, color }) => (
          <Card key={label} className="border-blue-100">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <Badge className={`border-0 text-xs mt-1 ${color}`}>{label}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, reference…" className="pl-9"
            value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending_review", "pending", "approved", "rejected"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s ? "bg-blue-700 text-white border-blue-600" : "border-gray-200 hover:border-blue-300 capitalize"
              }`}>
              {s === "pending_review" ? "Under Review" : s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1 shrink-0">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[0,1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No payment submissions found</p>
          <p className="text-sm text-muted-foreground mt-1">Payment submissions will appear here after students submit proof</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <PaymentRow key={p.id} p={p} onAction={load} />
          ))}
        </div>
      )}
    </div>
  );
}

type AdminTab = "overview" | "payments";

export default function Admin() {
  const { t } = useI18n();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${BASE}/api/admin/stats`, { credentials: "include" }),
        fetch(`${BASE}/api/admin/users?limit=20`, { credentials: "include" }),
      ]);
      if (statsRes.status === 403) { setError("Access denied. Admin privileges required."); return; }
      if (!statsRes.ok) throw new Error(`Stats: HTTP ${statsRes.status}`);
      if (!usersRes.ok) throw new Error(`Users: HTTP ${usersRes.status}`);
      const [s, u] = await Promise.all([statsRes.json(), usersRes.json()]);
      setStats(s);
      setUsers(u.users ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">{t("admin.accessDenied")}</h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">{t("admin.setAdminIds")}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-700" />
              {t("admin.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t("admin.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> {t("gen.refresh")}
          </Button>
        </div>

        {/* Admin tab nav */}
        <div className="flex gap-1 border-b border-blue-100">
          <button onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview" ? "border-blue-700 text-blue-700" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <Users className="h-4 w-4" /> Overview
          </button>
          <button onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "payments" ? "border-blue-700 text-blue-700" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <CreditCard className="h-4 w-4" /> Payment Submissions
          </button>
        </div>

        {activeTab === "payments" ? (
          <PaymentsTab />
        ) : (
          <>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            ) : stats && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label={t("admin.totalUsers")} value={stats.totalUsers} icon={Users} sub={`+${stats.newUsersToday} ${t("admin.today")}`} />
                  <StatCard label={t("admin.activeToday")} value={stats.activeToday} icon={Activity} sub={t("admin.uniqueStudents")} />
                  <StatCard label={t("admin.totalRecordings")} value={stats.totalRecordings.toLocaleString()} icon={Mic} sub={t("admin.allTime")} />
                  <StatCard label={t("admin.conversations")} value={stats.totalConversations.toLocaleString()} icon={MessageSquare} sub={t("admin.withAI")} />
                  <StatCard label={t("admin.avgXp")} value={stats.avgXp.toLocaleString()} icon={Star} sub={t("admin.allUsers")} />
                  <StatCard label={t("admin.avgScore")} value={`${stats.avgScore}%`} icon={TrendingUp} sub={t("admin.recitationAcc")} />
                  <StatCard label={t("admin.newToday")} value={stats.newUsersToday} icon={Users} sub={t("admin.newReg")} color="blue" />
                  <StatCard label={t("admin.activeRate")} value={`${stats.totalUsers > 0 ? Math.round((stats.activeToday / stats.totalUsers) * 100) : 0}%`} icon={Activity} sub={t("admin.dailyActive")} color="purple" />
                </div>

                {Object.keys(stats.levelDistribution).length > 0 && (
                  <Card className="border-blue-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{t("admin.levelDist")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(stats.levelDistribution).map(([level, count]) => (
                          <div key={level} className="flex items-center gap-2">
                            <Badge variant="outline" className="border-blue-200 text-blue-800 capitalize">{level}</Badge>
                            <span className="font-bold text-slate-900">{count}</span>
                            <span className="text-xs text-muted-foreground">users</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-blue-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-700" />
                      {t("admin.topUsers")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-blue-100">
                            <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">{t("admin.colUser")}</th>
                            <th className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium">{t("teacher.colLevel")}</th>
                            <th className="text-right py-2.5 px-4 text-xs text-muted-foreground font-medium">{t("ldr.xp")}</th>
                            <th className="text-right py-2.5 px-4 text-xs text-muted-foreground font-medium">{t("admin.colStreak")}</th>
                            <th className="text-right py-2.5 px-4 text-xs text-muted-foreground font-medium">{t("teacher.recordings")}</th>
                            <th className="text-right py-2.5 px-4 text-xs text-muted-foreground font-medium">{t("admin.colLastActive")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u, i) => (
                            <tr key={u.id} className={`border-b border-blue-50 hover:bg-blue-50/50 transition-colors ${i === 0 ? "bg-blue-50/30" : ""}`}>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {u.avatarUrl ? (
                                    <img src={u.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
                                  ) : (
                                    <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs font-bold">
                                      {u.displayName?.[0] ?? "?"}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium text-slate-900">{u.displayName || "Student"}</p>
                                    {!u.onboardingComplete && <p className="text-xs text-amber-600">{t("admin.onboardingIncomplete")}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="border-blue-200 text-blue-800 text-xs capitalize">{u.level || "beginner"}</Badge>
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-slate-900">{u.xp.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right text-muted-foreground">{u.streakDays}d</td>
                              <td className="py-3 px-4 text-right text-muted-foreground">{u.totalRecordings}</td>
                              <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                                {u.lastStudyDate ? new Date(u.lastStudyDate).toLocaleDateString() : t("admin.never")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {users.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-8">{t("admin.noUsers")}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
