import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, QrCode, CheckCircle2, XCircle, Search, Loader2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface Certificate {
  id: number;
  type: string;
  title: string;
  description: string;
  subject: string;
  issuedBy: string;
  issuedAt: string;
  verificationCode: string;
  isRevoked: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  completion: "bg-emerald-100 text-emerald-700 border-emerald-200",
  hifdh: "bg-purple-100 text-purple-700 border-purple-200",
  tajweed: "bg-amber-100 text-amber-700 border-amber-200",
  exam: "bg-blue-100 text-blue-700 border-blue-200",
};

function CertificateCard({ cert }: { cert: Certificate }) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const date = new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const r = await fetch(`/api/certificates/${cert.id}/pdf`, { credentials: "include" });
      if (!r.ok) throw new Error("PDF generation failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificate-${cert.verificationCode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Certificate PDF downloaded" });
    } catch {
      toast({ title: "Download failed", description: "Could not generate PDF. Please try again.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`border-2 ${cert.isRevoked ? "border-gray-200 opacity-60" : "border-emerald-200 hover:shadow-lg"} transition-shadow`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${cert.isRevoked ? "bg-gray-100" : "bg-emerald-100"}`}>
              <Award className={`h-7 w-7 ${cert.isRevoked ? "text-gray-400" : "text-emerald-600"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-emerald-950 leading-snug">{cert.title}</h3>
                {cert.isRevoked
                  ? <Badge variant="outline" className="text-xs text-gray-500 shrink-0">Revoked</Badge>
                  : <Badge variant="outline" className={`text-xs shrink-0 ${TYPE_COLORS[cert.type] ?? "bg-gray-100 text-gray-700"}`}>{cert.type}</Badge>
                }
              </div>
              {cert.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{cert.description}</p>}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-muted-foreground">{date}</span>
                <span className="text-xs font-mono bg-gray-100 rounded px-1.5 py-0.5">{cert.verificationCode}</span>
              </div>
            </div>
          </div>

          {!cert.isRevoked && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-emerald-100">
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading} className="gap-1.5 text-xs h-7">
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {downloading ? "Generating…" : "Download PDF"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/verify/${cert.verificationCode}`);
                toast({ title: "Verification link copied!" });
              }}>
                <ExternalLink className="h-3.5 w-3.5" /> Share Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function VerifyPanel() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ valid: boolean; certificate?: Certificate & { studentName: string }; message?: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const verify = async () => {
    if (!code.trim()) return;
    setChecking(true);
    setResult(null);
    try {
      const r = await fetch(`/api/certificates/verify/${code.trim().toUpperCase()}`);
      const data = await r.json();
      setResult(data);
    } catch { setResult({ valid: false, message: "Verification failed" }); }
    finally { setChecking(false); }
  };

  return (
    <Card className="border-emerald-100">
      <CardContent className="p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><QrCode className="h-4 w-4 text-emerald-600" />Verify a Certificate</h3>
        <div className="flex gap-2">
          <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Enter verification code…" className="font-mono text-sm h-9" onKeyDown={e => e.key === "Enter" && verify()} />
          <Button size="sm" onClick={verify} disabled={checking} className="bg-emerald-600 hover:bg-emerald-700 h-9 px-4">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {result && (
          <div className={`mt-3 rounded-lg p-3 flex items-start gap-2.5 ${result.valid ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
            {result.valid
              ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              : <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            }
            <div>
              {result.valid && result.certificate ? (
                <div>
                  <p className="font-semibold text-sm text-emerald-900">✓ Valid Certificate</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Awarded to: <strong>{result.certificate.studentName}</strong></p>
                  <p className="text-xs text-emerald-700">For: {result.certificate.title}</p>
                  <p className="text-xs text-muted-foreground">Issued: {new Date(result.certificate.issuedAt).toLocaleDateString()}</p>
                </div>
              ) : (
                <p className="text-sm text-red-700">{result.message ?? "Invalid certificate"}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Certificates() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/certificates", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCerts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-emerald-950 flex items-center gap-2">
            <Award className="h-6 w-6 text-emerald-600" /> My Certificates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your Islamic learning achievements and verifiable certificates</p>
        </div>

        <VerifyPanel />

        {loading ? (
          <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-36" />)}</div>
        ) : certs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Award className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">No certificates yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Complete exams and courses to earn your first certificate</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {certs.map(cert => <CertificateCard key={cert.id} cert={cert} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
