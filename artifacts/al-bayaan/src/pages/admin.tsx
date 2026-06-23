import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Users, Mic, MessageSquare, TrendingUp, Star, Activity, Shield,
  RefreshCw, CreditCard, CheckCheck, X, Eye, Search, Filter,
  Clock, AlertCircle, ChevronDown, ChevronUp, FileImage,
  BookOpen, FileText, Volume2, Video, Image, Plus, Download, Loader2, FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
      const r = await authFetch(`/api/admin/payments/${p.id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      const r = await authFetch(`/api/admin/payments?status=${statusFilter}`, { });
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

// ── Resources Management Tab ────────────────────────────────────────────────

interface ContentItem {
  id: number;
  type: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  fileUrl: string;
  thumbnailUrl: string;
  content: string;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
}

const CONTENT_TYPE_ICONS: Record<string, any> = {
  book: BookOpen, pdf: FileText, audio: Volume2, video: Video, image: Image,
  lesson: BookOpen, course: BookOpen, exam: FileText, quiz: FileText,
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  book: "bg-blue-100 text-blue-800", pdf: "bg-red-100 text-red-700",
  audio: "bg-blue-100 text-blue-700", video: "bg-purple-100 text-purple-700",
  lesson: "bg-amber-100 text-amber-700", course: "bg-teal-100 text-teal-700",
};

const CMS_SUBJECTS = ["quran","tajweed","hifdh","arabic","tafsir","fiqh","aqeedah","hadith","general"];
const CMS_LEVELS   = ["all","beginner","intermediate","advanced"];
const CMS_TYPES    = ["book","pdf","audio","video","lesson","course","exam","quiz"];

function ResourceCard({ item, onDownload, onTogglePublish, onDelete }: {
  item: ContentItem;
  onDownload: (id: number) => void;
  onTogglePublish: (id: number, current: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const Icon  = CONTENT_TYPE_ICONS[item.type]  ?? FileText;
  const color = CONTENT_TYPE_COLORS[item.type] ?? "bg-gray-100 text-gray-700";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-blue-100 hover:shadow-md transition-shadow h-full">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex items-start gap-3 mb-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-snug text-slate-900 line-clamp-2">{item.title}</h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${color}`}>{item.type}</Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.subject}</Badge>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${item.isPublished ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}`}>
                  {item.isPublished ? "Published" : "Unpublished"}
                </Badge>
              </div>
            </div>
          </div>
          {item.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">{item.description}</p>}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-blue-50 gap-1 flex-wrap">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{item.viewCount}</span>
              <span className="flex items-center gap-1"><Download className="h-3 w-3" />{item.downloadCount}</span>
            </div>
            <div className="flex gap-1">
              {item.fileUrl && (
                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={() => { window.open(item.fileUrl, "_blank"); onDownload(item.id); }}>
                  <Download className="h-3 w-3" /> Open
                </Button>
              )}
              <Button variant="outline" size="sm"
                className={`h-6 text-[10px] px-2 gap-1 ${item.isPublished ? "text-amber-700 border-amber-300 hover:bg-amber-50" : "text-emerald-700 border-emerald-300 hover:bg-emerald-50"}`}
                onClick={() => onTogglePublish(item.id, item.isPublished)}>
                {item.isPublished ? "Unpublish" : "Publish"}
              </Button>
              <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => onDelete(item.id)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AddResourceDialog({ onAdded }: { onAdded: () => void }) {
  const { toast } = useToast();
  const [open, setOpen]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm]   = useState({ type: "pdf", title: "", description: "", subject: "quran", level: "all", fileUrl: "", content: "", tags: "" });

  const save = async () => {
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const r = await authFetch(`/api/cms/content`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [], isPublished: true }),
      });
      if (r.ok) {
        toast({ title: "Resource added!" });
        setOpen(false);
        setForm({ type: "pdf", title: "", description: "", subject: "quran", level: "all", fileUrl: "", content: "", tags: "" });
        onAdded();
      } else { toast({ title: "Failed to add resource", variant: "destructive" }); }
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-700 hover:bg-blue-800 gap-2"><Plus className="h-4 w-4" />Add Resource</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add New Resource</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Content Type *</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{CMS_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Title *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-8 text-sm mt-1" placeholder="e.g., Tajweed Basics Guide" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="text-sm mt-1 min-h-[60px]" placeholder="Brief description…" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Subject</Label>
              <Select value={form.subject} onValueChange={v => setForm(f => ({ ...f, subject: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CMS_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Level</Label>
              <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CMS_LEVELS.map(l => <SelectItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">File URL (Google Drive, Dropbox, etc.)</Label>
            <Input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} className="h-8 text-sm mt-1" placeholder="https://…" />
          </div>
          <div>
            <Label className="text-xs">Text Content (for lessons/notes)</Label>
            <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="text-sm mt-1 min-h-[80px]" placeholder="Paste lesson text here…" />
          </div>
          <div>
            <Label className="text-xs">Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="h-8 text-sm mt-1" placeholder="tajweed, beginner, rules" />
          </div>
          <Button onClick={save} disabled={saving} className="w-full bg-blue-700 hover:bg-blue-800">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Add Resource"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResourcesTab() {
  const { toast } = useToast();
  const [items, setItems]           = useState<ContentItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");

  const load = () => {
    setLoading(true);
    authFetch(`/api/cms/content`, { })
      .then(r => r.ok ? r.json() : [])
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDownload = async (id: number) => {
    await authFetch(`/api/cms/content/${id}/download`, { method: "POST" }).catch(() => {});
  };

  const handleTogglePublish = async (id: number, current: boolean) => {
    try {
      const r = await authFetch(`/api/cms/content/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !current }),
      });
      if (r.ok) { toast({ title: current ? "Resource unpublished" : "Resource published" }); load(); }
      else { toast({ title: "Failed to update", variant: "destructive" }); }
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this resource? This cannot be undone.")) return;
    try {
      const r = await authFetch(`/api/cms/content/${id}`, { method: "DELETE" });
      if (r.ok) { toast({ title: "Resource deleted" }); load(); }
      else { toast({ title: "Failed to delete", variant: "destructive" }); }
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const filtered = items.filter(item => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (filterSubject !== "all" && item.subject !== filterSubject) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-700" /> Resources Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} resource{items.length !== 1 ? "s" : ""} total · {items.filter(i => i.isPublished).length} published</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-2 h-8">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <AddResourceDialog onAdded={load} />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources…" className="pl-9 h-9 text-sm" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CMS_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {CMS_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <FolderOpen className="h-12 w-12 text-blue-300 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">{items.length === 0 ? "No resources yet" : "No results found"}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {items.length === 0 ? "Add books, PDFs, and lessons using the button above" : "Try adjusting your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => (
            <ResourceCard key={item.id} item={item} onDownload={handleDownload} onTogglePublish={handleTogglePublish} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Admin Tab Type ────────────────────────────────────────────────────────────
type AdminTab = "overview" | "payments" | "resources";

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
        authFetch(`/api/admin/stats`, { }),
        authFetch(`/api/admin/users?limit=20`, { }),
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
        <div className="flex gap-1 border-b border-blue-100 overflow-x-auto">
          <button onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "overview" ? "border-blue-700 text-blue-700" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <Users className="h-4 w-4" /> Overview
          </button>
          <button onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "payments" ? "border-blue-700 text-blue-700" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <CreditCard className="h-4 w-4" /> Payment Submissions
          </button>
          <button onClick={() => setActiveTab("resources")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "resources" ? "border-blue-700 text-blue-700" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <FolderOpen className="h-4 w-4" /> Resources Management
          </button>
        </div>

        {activeTab === "payments" ? (
          <PaymentsTab />
        ) : activeTab === "resources" ? (
          <ResourcesTab />
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
