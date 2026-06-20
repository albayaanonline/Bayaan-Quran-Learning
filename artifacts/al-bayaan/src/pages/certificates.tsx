import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, QrCode, CheckCircle2, XCircle, Search, Loader2, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

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
  completion: "bg-blue-100 text-blue-800 border-blue-200",
  hifdh: "bg-purple-100 text-purple-700 border-purple-200",
  tajweed: "bg-amber-100 text-amber-700 border-amber-200",
  exam: "bg-blue-100 text-blue-700 border-blue-200",
  exam_completion: "bg-blue-100 text-blue-700 border-blue-200",
};

async function generateQRDataUrl(text: string): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(text, { width: 120, margin: 1, color: { dark: "#064e3b", light: "#ffffff" } });
}

async function downloadCertificatePDF(cert: Certificate, labels: Record<string, string>) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const W = 297;
  const H = 210;

  doc.setFillColor(240, 253, 244);
  doc.rect(0, 0, W, H, "F");

  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(4);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setLineWidth(1);
  doc.setDrawColor(110, 231, 183);
  doc.rect(12, 12, W - 24, H - 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(5, 150, 105);
  doc.text("AL BAYAAN AI ACADEMY", W / 2, 28, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(16, 185, 129);
  doc.text("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", W / 2, 35, { align: "center" });

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(6, 78, 59);
  doc.text(labels.achievement, W / 2, 58, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(52, 78, 65);
  doc.text(labels.awardedFor, W / 2, 72, { align: "center" });

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(5, 150, 105);
  const titleLines = doc.splitTextToSize(cert.title, 220);
  doc.text(titleLines, W / 2, 88, { align: "center" });

  const afterTitle = 88 + (titleLines.length - 1) * 10;

  if (cert.description) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(75, 85, 99);
    const descLines = doc.splitTextToSize(cert.description, 200);
    doc.text(descLines, W / 2, afterTitle + 10, { align: "center" });
  }

  const date = new Date(cert.issuedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(52, 78, 65);
  doc.text(`${labels.subject} ${cert.subject ?? "Islamic Studies"}`, W / 2 - 50, H - 48, { align: "center" });
  doc.text(`${labels.issuedBy} ${cert.issuedBy ?? "Al Bayaan AI Academy"}`, W / 2 + 50, H - 48, { align: "center" });
  doc.text(`${labels.date} ${date}`, W / 2, H - 40, { align: "center" });

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(40, H - 33, W - 40, H - 33);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(`${labels.verifyCode} ${cert.verificationCode}`, W / 2, H - 27, { align: "center" });

  const verifyUrl = `${window.location.origin}/certificates`;
  doc.text(`${labels.verifyAt} ${verifyUrl}`, W / 2, H - 22, { align: "center" });

  try {
    const qrDataUrl = await generateQRDataUrl(verifyUrl + `?verify=${cert.verificationCode}`);
    doc.addImage(qrDataUrl, "PNG", W - 45, H - 48, 28, 28);
    doc.setFontSize(6);
    doc.setTextColor(107, 114, 128);
    doc.text(labels.scanVerify, W - 31, H - 18, { align: "center" });
  } catch {}

  doc.save(`Certificate-${cert.verificationCode}.pdf`);
}

function CertificateCard({ cert }: { cert: Certificate }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCertificatePDF(cert, {
        achievement: t("certs.achievement"),
        awardedFor: t("certs.awardedFor"),
        subject: t("certs.subject"),
        issuedBy: t("certs.issuedBy"),
        date: t("certs.date"),
        verifyCode: "Verification Code:",
        verifyAt: t("certs.verifyAt"),
        scanVerify: t("certs.scanVerify"),
      });
      toast({ title: t("certs.downloaded") });
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast({ title: t("certs.downloadFail"), description: t("certs.downloadFailSub"), variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const date = new Date(cert.issuedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`border-2 ${cert.isRevoked ? "border-gray-200 opacity-60" : "border-blue-200 hover:shadow-lg"} transition-shadow`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${cert.isRevoked ? "bg-gray-100" : "bg-blue-100"}`}>
              <Award className={`h-7 w-7 ${cert.isRevoked ? "text-gray-400" : "text-blue-700"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-slate-900 leading-snug">{cert.title}</h3>
                {cert.isRevoked
                  ? <Badge variant="outline" className="text-xs text-gray-500 shrink-0">{t("certs.revoked")}</Badge>
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
            <div className="flex gap-2 mt-4 pt-4 border-t border-blue-100 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading} className="gap-1.5 text-xs h-7">
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {downloading ? t("certs.downloading") : t("certs.download")}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/certificates?verify=${cert.verificationCode}`);
                toast({ title: t("certs.linkCopied") });
              }}>
                <Copy className="h-3.5 w-3.5" /> {t("certs.copyLink")}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={async () => {
                try {
                  const qrUrl = await generateQRDataUrl(`${window.location.origin}/certificates?verify=${cert.verificationCode}`);
                  const a = document.createElement("a");
                  a.href = qrUrl;
                  a.download = `QR-${cert.verificationCode}.png`;
                  a.click();
                  toast({ title: t("certs.qrDownloaded") });
                } catch {
                  toast({ title: t("certs.qrFail"), variant: "destructive" });
                }
              }}>
                <QrCode className="h-3.5 w-3.5" /> {t("certs.qrCode")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function VerifyPanel() {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ valid: boolean; certificate?: Certificate & { studentName: string }; message?: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const verify = async () => {
    if (!code.trim()) return;
    setChecking(true);
    setResult(null);
    try {
      const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
      const r = await fetch(`${basePath}/api/certificates/verify/${code.trim().toUpperCase()}`);
      const data = await r.json();
      setResult(data);
    } catch { setResult({ valid: false, message: t("certs.verifyFail") }); }
    finally { setChecking(false); }
  };

  return (
    <Card className="border-blue-100">
      <CardContent className="p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><QrCode className="h-4 w-4 text-blue-700" />{t("certs.verify")}</h3>
        <div className="flex gap-2">
          <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder={t("certs.verifyCode")} className="font-mono text-sm h-9" onKeyDown={e => e.key === "Enter" && verify()} />
          <Button size="sm" onClick={verify} disabled={checking} className="bg-blue-700 hover:bg-blue-700 h-9 px-4">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {result && (
          <div className={`mt-3 rounded-lg p-3 flex items-start gap-2.5 ${result.valid ? "bg-blue-50 border border-blue-200" : "bg-red-50 border border-red-200"}`}>
            {result.valid
              ? <CheckCircle2 className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
              : <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            }
            <div>
              {result.valid && result.certificate ? (
                <div>
                  <p className="font-semibold text-sm text-blue-950">{t("certs.validCert")}</p>
                  <p className="text-xs text-blue-800 mt-0.5">{t("certs.awardedTo")} <strong>{result.certificate.studentName}</strong></p>
                  <p className="text-xs text-blue-800">{t("certs.for")} {result.certificate.title}</p>
                  <p className="text-xs text-muted-foreground">{t("certs.issued")} {new Date(result.certificate.issuedAt).toLocaleDateString()}</p>
                </div>
              ) : (
                <p className="text-sm text-red-700">{result.message ?? t("certs.invalidCert")}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Certificates() {
  const { t } = useI18n();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const basePath = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
    fetch(`${basePath}/api/certificates`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCerts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <Award className="h-6 w-6 text-blue-700" /> {t("certs.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("certs.subtitle")}</p>
        </div>

        <VerifyPanel />

        {loading ? (
          <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-36" />)}</div>
        ) : certs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Award className="h-12 w-12 text-blue-300 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">{t("certs.noCerts")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("certs.noCertsSub")}</p>
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
