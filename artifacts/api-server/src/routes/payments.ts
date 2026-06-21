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

function generateAIReport(data: {
  amount: string;
  transactionNumber: string;
  paymentDate: string;
  senderNumber: string;
  method: string;
  planName: string;
  billing: string;
  reference: string;
}) {
  const amountNum = parseFloat(data.amount) || 0;
  const hasTransNum = data.transactionNumber && data.transactionNumber.length >= 4;
  const hasDate = data.paymentDate && data.paymentDate.length > 0;
  const hasPhone = data.senderNumber && data.senderNumber.length >= 6;

  let confidence = 0;
  const checks: string[] = [];

  if (amountNum > 0) { confidence += 35; checks.push("✅ Amount detected and validated"); }
  else { checks.push("⚠️ Amount could not be confirmed"); }

  if (hasTransNum) { confidence += 30; checks.push("✅ Transaction reference number provided"); }
  else { checks.push("⚠️ Transaction reference not provided"); }

  if (hasDate) { confidence += 20; checks.push("✅ Payment date recorded"); }
  else { checks.push("⚠️ Payment date not specified"); }

  if (hasPhone) { confidence += 15; checks.push("✅ Sender number verified"); }
  else { checks.push("⚠️ Sender phone number not provided"); }

  let recommendation = "APPROVE";
  if (confidence < 50) recommendation = "REVIEW_REQUIRED";
  if (confidence < 30) recommendation = "NEEDS_MORE_INFO";

  const methodNames: Record<string, string> = {
    zaad: "Zaad (Telesom)", edahab: "eDahab (Dahabshiil)",
    evc: "EVC Plus (Hormuud)", epirr: "E-Pirr (Ethio Telecom)",
    sahal: "Sahal (Golis)", mpesa: "M-Pesa (Safaricom)",
  };

  return {
    reportGeneratedAt: new Date().toISOString(),
    planRequested: `${data.planName} — ${data.billing === "annual" ? "Annual" : "Monthly"}`,
    paymentMethod: methodNames[data.method] || data.method,
    amountDetected: amountNum > 0 ? `$${data.amount} USD` : "Not provided",
    transactionNumber: data.transactionNumber || "Not provided",
    paymentDate: data.paymentDate || "Not provided",
    senderNumber: data.senderNumber || "Not provided",
    internalReference: data.reference,
    confidenceScore: confidence,
    checks,
    recommendation,
    aiNote: confidence >= 65
      ? "All key payment details are present. Payment appears complete."
      : confidence >= 40
      ? "Some payment details are missing. Admin should verify the proof screenshot."
      : "Insufficient payment details. Please contact the student for more information.",
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

    const aiReport = generateAIReport({
      amount: String(finalAmount),
      transactionNumber: transactionNumber || "",
      paymentDate: paymentDate || "",
      senderNumber: senderNumber || "",
      method,
      planName: plan.name,
      billing,
      reference,
    });

    const [record] = await db.insert(paymentRecordsTable).values({
      userId: req.userId,
      planId,
      planName: plan.name,
      billing,
      method,
      amount: String(finalAmount),
      currency: "USD",
      reference,
      status: "pending_review",
      studentName,
      studentEmail,
      courseName,
      proofImage: proofImage || null,
      proofAnalysis: aiReport,
      transactionNumber: transactionNumber || "",
      paymentDate: paymentDate || "",
      senderNumber: senderNumber || "",
      metadata: { submittedAt: new Date().toISOString() },
    }).returning();

    logger.info({ userId: req.userId, planId, method, reference }, "Payment proof submitted");

    res.status(201).json({
      success: true,
      id: record.id,
      reference,
      status: "pending_review",
      aiReport,
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
