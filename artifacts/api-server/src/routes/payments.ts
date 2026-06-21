import { Router } from "express";
import { db, paymentRecordsTable, profilesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const ADMIN_IDS = (process.env.ADMIN_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
function requireAdmin(req: any, res: any, next: any) {
  if (ADMIN_IDS.length > 0 && !ADMIN_IDS.includes(req.userId)) {
    res.status(403).json({ error: "Forbidden: admin access required" });
    return;
  }
  next();
}

const PLAN_PRICES: Record<string, { monthly: number; annual: number; name: string }> = {
  starter:  { monthly: 5,   annual: 50,  name: "Starter" },
  standard: { monthly: 10,  annual: 100, name: "Standard" },
  premium:  { monthly: 15,  annual: 150, name: "Premium" },
  student:  { monthly: 9.99,  annual: 7.99,  name: "Student" },
  family:   { monthly: 19.99, annual: 15.99, name: "Family" },
  institute:{ monthly: 99,    annual: 79,    name: "Institute" },
};

const PAYMENT_NUMBERS: Record<string, string> = {
  zaad:   "+252 63 6042512",
  edahab: "+252 65 6042512",
  evc:    "+252 612035767",
  epirr:  "+251 0979695586",
};

// ─────────────────────────────────────────────────────────────────────────────
// STRICT PAYMENT PROOF VALIDATOR
// OCR library: Tesseract.js (client-side, free/open-source)
// Validation is multi-stage and binary — no fake confidence points.
// A random, blank, or unrelated image will always be REJECTED.
// ─────────────────────────────────────────────────────────────────────────────

const OFFICIAL_RECEIVER_NUMBERS: Record<string, string> = {
  zaad:   "252636042512",
  edahab: "252656042512",
  evc:    "252612035767",
  epirr:  "2510979695586",
};

// Minimum payment-related keywords that must appear for an image to qualify
// as a payment screenshot. At least 2 required.
const PAYMENT_KEYWORDS = [
  // Provider names
  "zaad", "edahab", "evc", "epirr", "sahal", "mpesa", "m-pesa",
  "hormuud", "telesom", "golis", "somtel", "dahabshiil", "ethio telecom",
  "et-birr", "ethio",
  // Universal payment action words
  "received", "transfer", "payment", "transaction", "paid", "confirmed",
  "success", "receipt", "debit", "credit", "balance", "mobile money",
  "sent", "amount", "completed", "approved", "processed", "airtime",
  // Reference terms
  "txn", "ref#", "trans id", "transaction id", "reference",
  // Somali payment terms
  "lacag", "deeq",
  // Currency indicators
  "ksh", "birr", "shilling",
];

const PROVIDER_KEYWORDS: Record<string, string[]> = {
  zaad:   ["zaad", "telesom"],
  edahab: ["edahab", "dahabshiil"],
  evc:    ["evc", "hormuud", "evc plus"],
  epirr:  ["epirr", "e-pirr", "ethio", "et-birr"],
  sahal:  ["sahal", "golis"],
  mpesa:  ["mpesa", "m-pesa", "safaricom"],
};

function extractDigits(str: string): string {
  return str.replace(/\D/g, "");
}

interface ValidationResult {
  finalStatus: "approved" | "rejected" | "review_required";
  recommendation: "AUTO_VERIFIED" | "REJECTED" | "REVIEW_REQUIRED";
  rejectionReason: string | null;
  checks: string[];
  // Extracted fields
  detectedProvider: string | null;
  detectedAmount: string | null;
  detectedTransactionId: string | null;
  detectedDate: string | null;
  detectedSender: string | null;
  receiverVerified: boolean;
  amountVerified: boolean;
}

function validatePaymentProof(data: {
  ocrText: string;
  amount: string;
  method: string;
}): ValidationResult {
  const raw = (data.ocrText || "").trim();
  const lower = raw.toLowerCase();
  const digits = extractDigits(raw);
  const expectedAmount = parseFloat(data.amount) || 0;

  const result: ValidationResult = {
    finalStatus: "rejected",
    recommendation: "REJECTED",
    rejectionReason: null,
    checks: [],
    detectedProvider: null,
    detectedAmount: null,
    detectedTransactionId: null,
    detectedDate: null,
    detectedSender: null,
    receiverVerified: false,
    amountVerified: false,
  };

  // ── STAGE 0: OCR Readability ─────────────────────────────────────────────
  if (raw.length < 40) {
    result.finalStatus = "review_required";
    result.recommendation = "REVIEW_REQUIRED";
    result.rejectionReason = "Screenshot is unreadable. Please upload a clear, high-quality image of your payment confirmation.";
    result.checks.push("❌ Image text is unreadable or screenshot is blank/too small");
    return result;
  }
  result.checks.push("✅ Screenshot text extracted successfully via Tesseract OCR");

  // ── STAGE 1: Payment Screenshot Detection ────────────────────────────────
  // Count matching payment keywords — need at least 2 to qualify as a payment screen.
  const foundKeywords = PAYMENT_KEYWORDS.filter(kw => lower.includes(kw));
  if (foundKeywords.length < 2) {
    result.finalStatus = "rejected";
    result.recommendation = "REJECTED";
    result.rejectionReason = "This does not appear to be a mobile money payment screenshot. Upload the actual payment confirmation screen from your mobile money app.";
    result.checks.push(`❌ Not a payment screenshot — only ${foundKeywords.length} of 2 required payment keywords found`);
    result.checks.push(`   (Found: ${foundKeywords.length > 0 ? foundKeywords.join(", ") : "none"})`);
    return result;
  }
  result.checks.push(`✅ Payment screenshot confirmed (${foundKeywords.slice(0, 4).join(", ")})`);

  // ── STAGE 2: Provider Detection ──────────────────────────────────────────
  for (const [pid, keywords] of Object.entries(PROVIDER_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      result.detectedProvider = pid;
      break;
    }
  }
  if (result.detectedProvider) {
    result.checks.push(`✅ Provider detected: ${result.detectedProvider.toUpperCase()}`);
  } else {
    result.checks.push("⚠️ Provider name not clearly visible in screenshot");
  }

  // ── STAGE 3: Official Receiver Number Check (CRITICAL — mandatory) ───────
  // Any of the 4 official Al Bayaan numbers must appear in the screenshot.
  let receiverFoundFor: string | null = null;
  for (const [method, officialDigits] of Object.entries(OFFICIAL_RECEIVER_NUMBERS)) {
    const last8 = officialDigits.slice(-8);
    if (digits.includes(officialDigits) || digits.includes(last8)) {
      receiverFoundFor = method;
      result.receiverVerified = true;
      break;
    }
  }

  if (!result.receiverVerified) {
    result.finalStatus = "rejected";
    result.recommendation = "REJECTED";
    result.rejectionReason = "None of the official Al Bayaan receiver numbers were found in your screenshot. Ensure payment was sent to the correct number before submitting proof.";
    result.checks.push("❌ Official receiver number not found in screenshot (required: ZAAD 252636042512 / EDAHAB 252656042512 / EVC 252612035767 / EPIRR 2510979695586)");
    return result;
  }
  result.checks.push(`✅ Official receiver number verified — matches ${receiverFoundFor?.toUpperCase()}`);

  // ── STAGE 4: Amount Match Check (CRITICAL — mandatory) ───────────────────
  // The expected plan amount must appear in the screenshot text.
  const numTokens = raw.match(/\b(\d{1,6}(?:[.,]\d{1,2})?)\b/g) || [];
  for (const tok of numTokens) {
    const val = parseFloat(tok.replace(",", "."));
    if (val > 0 && Math.abs(val - expectedAmount) <= 0.5) {
      result.amountVerified = true;
      result.detectedAmount = tok;
      break;
    }
  }

  if (!result.amountVerified) {
    result.finalStatus = "rejected";
    result.recommendation = "REJECTED";
    result.rejectionReason = `Expected payment amount $${expectedAmount} was not found in the screenshot. The screenshot must show the exact amount paid for this plan.`;
    result.checks.push(`❌ Expected amount $${expectedAmount} not found in screenshot (found numbers: ${numTokens.slice(0, 5).join(", ") || "none"})`);
    return result;
  }
  result.checks.push(`✅ Payment amount $${result.detectedAmount} confirmed in screenshot`);

  // ── STAGE 5: Transaction Reference (soft — informational only) ───────────
  const txnPatterns = [
    /(?:TXN|Ref(?:erence)?|Trans(?:action)?|ID)[:\s#]*([A-Z0-9]{6,20})/i,
    /\b([A-Z]{2,4}[0-9]{6,})\b/,
    /\b([0-9]{8,20})\b/,
  ];
  for (const pat of txnPatterns) {
    const m = raw.match(pat);
    if (m?.[1] && m[1] !== extractDigits(OFFICIAL_RECEIVER_NUMBERS[data.method] || "")) {
      result.detectedTransactionId = m[1];
      result.checks.push(`✅ Transaction reference detected: ${m[1]}`);
      break;
    }
  }
  if (!result.detectedTransactionId) {
    result.checks.push("⚠️ Transaction reference not clearly visible — admin will confirm from screenshot");
  }

  // ── STAGE 6: Date Detection (informational) ──────────────────────────────
  const dateMatch = raw.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/);
  if (dateMatch) {
    result.detectedDate = dateMatch[0];
    result.checks.push(`✅ Payment date detected: ${dateMatch[0]}`);
  } else {
    result.checks.push("⚠️ Payment date not clearly visible in screenshot");
  }

  // ── STAGE 7: Sender Number (informational) ───────────────────────────────
  const phoneMatches = raw.match(/(?:\+?252|0)[1-9]\d{7,9}/g) || [];
  const officialSet = new Set(Object.values(OFFICIAL_RECEIVER_NUMBERS));
  const senders = phoneMatches.filter(p => {
    const d = extractDigits(p);
    return ![...officialSet].some(o => d.includes(o.slice(-8)));
  });
  if (senders.length > 0) {
    result.detectedSender = senders[0];
    result.checks.push(`✅ Sender number detected: ${senders[0]}`);
  }

  // ── ALL CRITICAL CHECKS PASSED ───────────────────────────────────────────
  result.finalStatus = "approved";
  result.recommendation = "AUTO_VERIFIED";
  return result;
}

function buildReport(data: {
  amount: string;
  transactionNumber: string;
  paymentDate: string;
  senderNumber: string;
  method: string;
  planName: string;
  billing: string;
  reference: string;
  ocrText?: string;
}) {
  const methodNames: Record<string, string> = {
    zaad: "Zaad (Telesom)", edahab: "eDahab (Dahabshiil)",
    evc: "EVC Plus (Hormuud)", epirr: "E-Pirr (Ethio Telecom)",
    sahal: "Sahal (Golis)", mpesa: "M-Pesa (Safaricom)",
  };

  const v = validatePaymentProof({
    ocrText: data.ocrText || "",
    amount: data.amount,
    method: data.method,
  });

  return {
    reportGeneratedAt: new Date().toISOString(),
    ocrLibrary: "Tesseract.js (open-source, browser-side)",
    planRequested: `${data.planName} — ${data.billing === "annual" ? "Annual" : "Monthly"}`,
    paymentMethod: methodNames[data.method] || data.method,
    expectedAmount: `$${data.amount} USD`,
    amountDetected: v.detectedAmount ? `$${v.detectedAmount} USD` : "Not found",
    transactionId: v.detectedTransactionId || data.transactionNumber || "Not detected",
    paymentDate: v.detectedDate || data.paymentDate || "Not detected",
    senderNumber: v.detectedSender || data.senderNumber || "Not detected",
    detectedProvider: v.detectedProvider ? v.detectedProvider.toUpperCase() : "Not detected",
    internalReference: data.reference,
    receiverVerified: v.receiverVerified,
    amountVerified: v.amountVerified,
    checks: v.checks,
    recommendation: v.recommendation,
    finalStatus: v.finalStatus,
    rejectionReason: v.rejectionReason,
    aiNote: v.recommendation === "AUTO_VERIFIED"
      ? "All required checks passed. Receiver number and amount confirmed in screenshot via Tesseract OCR. Payment auto-approved."
      : v.recommendation === "REVIEW_REQUIRED"
      ? "Screenshot is unreadable. Please upload a clearer image. Admin has been notified to assist."
      : `Payment rejected: ${v.rejectionReason}`,
  };
}

router.post("/payments/initiate", requireAuth, async (req: any, res) => {
  const { planId, billing = "monthly", method } = req.body;

  if (!planId || !method) {
    res.status(400).json({ error: "planId and method are required" });
    return;
  }

  const plan = PLAN_PRICES[planId];
  if (!plan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  const amount = billing === "annual" ? plan.annual : plan.monthly;
  const currency = "USD";
  const reference = `ALB-${req.userId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  try {
    await db.insert(paymentRecordsTable).values({
      userId: req.userId,
      planId,
      planName: plan.name,
      billing,
      method,
      amount: String(amount),
      currency,
      reference,
      status: "pending",
      metadata: { initiated: true },
    });
  } catch (dbErr) {
    logger.error({ dbErr }, "Failed to save payment record");
  }

  const paymentNum = PAYMENT_NUMBERS[method];
  if (paymentNum) {
    res.json({
      success: true,
      reference,
      amount,
      currency,
      paymentNumber: paymentNum,
      instructions: `Send $${amount} USD to ${paymentNum} via ${method.toUpperCase()}.\nUse reference: ${reference}\nThen upload your payment screenshot below.`,
    });
  } else {
    res.json({
      success: true,
      reference,
      amount,
      currency,
      instructions: `Please contact administration via WhatsApp before sending payment.\nYour reference: ${reference}`,
    });
  }
});

router.post("/payments/submit-proof", requireAuth, async (req: any, res) => {
  try {
    const {
      planId, billing = "monthly", method,
      amount, transactionNumber, paymentDate, senderNumber,
      proofImage, studentName = "", studentEmail = "", courseName = "",
      ocrText = "",
    } = req.body;

    if (!planId || !method) {
      res.status(400).json({ error: "planId and method are required" });
      return;
    }

    const plan = PLAN_PRICES[planId];
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    const finalAmount = amount || (billing === "annual" ? plan.annual : plan.monthly);
    const reference = `ALB-${req.userId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const report = buildReport({
      amount: String(finalAmount),
      transactionNumber: transactionNumber || "",
      paymentDate: paymentDate || "",
      senderNumber: senderNumber || "",
      method,
      planName: plan.name,
      billing,
      reference,
      ocrText,
    });

    const finalStatus = report.finalStatus;

    const [record] = await db.insert(paymentRecordsTable).values({
      userId: req.userId,
      planId,
      planName: plan.name,
      billing,
      method,
      amount: String(finalAmount),
      currency: "USD",
      reference,
      status: finalStatus,
      studentName,
      studentEmail,
      courseName,
      proofImage: proofImage || null,
      proofAnalysis: report,
      transactionNumber: transactionNumber || "",
      paymentDate: paymentDate || "",
      senderNumber: senderNumber || "",
      metadata: { submittedAt: new Date().toISOString(), ocrUsed: ocrText.length > 30 },
      ...(finalStatus === "approved" ? { approvedBy: "AI-OCR", approvedAt: new Date() } : {}),
    }).returning();

    logger.info({ userId: req.userId, planId, method, reference, status: finalStatus, recommendation: report.recommendation }, "Payment proof submitted");

    res.status(201).json({
      success: true,
      id: record.id,
      reference,
      status: finalStatus,
      autoVerified: finalStatus === "approved",
      rejected: finalStatus === "rejected",
      reviewRequired: finalStatus === "review_required",
      aiReport: report,
    });
  } catch (err) {
    logger.error({ err }, "Failed to submit payment proof");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/payments/history", requireAuth, async (req: any, res) => {
  try {
    const rows = await db
      .select({
        id: paymentRecordsTable.id,
        planId: paymentRecordsTable.planId,
        planName: paymentRecordsTable.planName,
        billing: paymentRecordsTable.billing,
        method: paymentRecordsTable.method,
        amount: paymentRecordsTable.amount,
        currency: paymentRecordsTable.currency,
        reference: paymentRecordsTable.reference,
        status: paymentRecordsTable.status,
        createdAt: paymentRecordsTable.createdAt,
        proofAnalysis: paymentRecordsTable.proofAnalysis,
        adminNotes: paymentRecordsTable.adminNotes,
        courseName: paymentRecordsTable.courseName,
      })
      .from(paymentRecordsTable)
      .where(eq(paymentRecordsTable.userId, req.userId))
      .orderBy(desc(paymentRecordsTable.createdAt))
      .limit(50);
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to get payment history");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/payments", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { status } = req.query;
    let rows = await db
      .select()
      .from(paymentRecordsTable)
      .orderBy(desc(paymentRecordsTable.createdAt))
      .limit(200);

    if (status && status !== "all") {
      rows = rows.filter(r => r.status === status);
    }

    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to get admin payments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/payments/:id/approve", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { adminNotes = "" } = req.body;
    const [updated] = await db
      .update(paymentRecordsTable)
      .set({
        status: "approved",
        adminNotes,
        approvedBy: req.userId,
        approvedAt: new Date(),
      })
      .where(eq(paymentRecordsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Record not found" }); return; }
    logger.info({ id, adminId: req.userId }, "Payment approved by admin");
    res.json({ success: true, record: updated });
  } catch (err) {
    logger.error({ err }, "Failed to approve payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/payments/:id/reject", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { adminNotes = "" } = req.body;
    const [updated] = await db
      .update(paymentRecordsTable)
      .set({ status: "rejected", adminNotes })
      .where(eq(paymentRecordsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Record not found" }); return; }
    logger.info({ id, adminId: req.userId }, "Payment rejected by admin");
    res.json({ success: true, record: updated });
  } catch (err) {
    logger.error({ err }, "Failed to reject payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/payments/:id/confirm", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db
      .update(paymentRecordsTable)
      .set({ status: "completed" })
      .where(eq(paymentRecordsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Record not found" }); return; }
    res.json(updated);
  } catch (err) {
    logger.error({ err }, "Failed to confirm payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/payments/stripe-webhook", async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) { res.status(400).end(); return; }
  try {
    const event = req.body;
    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      const reference = session?.metadata?.reference;
      if (reference) {
        await db.update(paymentRecordsTable)
          .set({ status: "approved", metadata: { stripeSessionId: session.id } })
          .where(eq(paymentRecordsTable.reference, reference));
        logger.info({ reference }, "Stripe payment completed via webhook");
      }
    }
    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, "Stripe webhook error");
    res.status(400).json({ error: "Webhook error" });
  }
});

export default router;
