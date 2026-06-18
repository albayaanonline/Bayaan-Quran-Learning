import { Router } from "express";
import { db, paymentRecordsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const PLAN_PRICES: Record<string, { monthly: number; annual: number; name: string }> = {
  student: { monthly: 9.99, annual: 7.99, name: "Student" },
  family: { monthly: 19.99, annual: 15.99, name: "Family" },
  institute: { monthly: 99, annual: 79, name: "Institute" },
};

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

  logger.info({ userId: req.userId, planId, billing, method, amount }, "Payment initiated");

  let responseData: any;

  if (method === "zaad") {
    responseData = {
      success: true,
      instructions: `To pay via Zaad:\n1. Open your Zaad app or dial *712#\n2. Choose "Send Money"\n3. Enter merchant number: 615-ALBAYAAN\n4. Amount: $${amount} USD\n5. Reference: ${reference}\n6. Send the confirmation SMS to support@albayaan.com`,
      reference,
      amount,
      currency,
    };
  } else if (method === "evc") {
    responseData = {
      success: true,
      instructions: `To pay via EVC Plus:\n1. Dial *799#\n2. Choose "Pay Bill"\n3. Enter Al Bayaan merchant code: 85432\n4. Amount: $${amount}\n5. Your reference: ${reference}\n6. Confirm with your PIN`,
      reference,
      amount,
      currency,
    };
  } else if (method === "edahab") {
    responseData = {
      success: true,
      instructions: `To pay via eDahab:\n1. Open eDahab app\n2. Select "Pay to Business"\n3. Business name: Al Bayaan Academy\n4. Account: albayaan@edahab.so\n5. Amount: $${amount}\n6. Note: ${reference} ${plan.name}`,
      reference,
      amount,
      currency,
    };
  } else if (method === "stripe") {
    if (!process.env.STRIPE_SECRET_KEY) {
      res.json({
        success: false,
        instructions: "Stripe card payments are coming soon. Please use Zaad, EVC, or eDahab for now, or contact support@albayaan.com",
      });
      return;
    }
    res.json({ success: true, redirectUrl: `/api/payments/stripe-checkout?plan=${planId}&billing=${billing}` });
    return;
  } else if (method === "paypal") {
    if (!process.env.PAYPAL_CLIENT_ID) {
      res.json({
        success: false,
        instructions: "PayPal payments are coming soon. Please use Zaad, EVC, or eDahab for now, or contact support@albayaan.com",
      });
      return;
    }
    res.json({ success: true, redirectUrl: `/api/payments/paypal-checkout?plan=${planId}&billing=${billing}` });
    return;
  } else {
    res.status(400).json({ error: "Unknown payment method" });
    return;
  }

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
      metadata: { instructions: responseData.instructions },
    });
  } catch (dbErr) {
    logger.error({ dbErr }, "Failed to save payment record — returning instructions anyway");
  }

  res.json(responseData);
});

router.get("/payments/history", requireAuth, async (req: any, res) => {
  try {
    const rows = await db
      .select()
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

export default router;
