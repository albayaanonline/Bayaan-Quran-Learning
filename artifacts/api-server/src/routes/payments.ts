import { Router } from "express";
import { db, paymentRecordsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const PLAN_PRICES: Record<string, { monthly: number; annual: number; name: string }> = {
  student:   { monthly: 9.99,  annual: 7.99,  name: "Student" },
  family:    { monthly: 19.99, annual: 15.99, name: "Family" },
  institute: { monthly: 99,    annual: 79,    name: "Institute" },
};

// ── Stripe real checkout session ─────────────────────────────────────────────
async function createStripeCheckoutSession(params: {
  planId: string;
  planName: string;
  amount: number;
  billing: string;
  userId: string;
  reference: string;
}): Promise<{ url: string } | null> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return null;

  try {
    const appUrl = process.env.APP_URL ?? "https://albayaan.replit.app";
    const unitAmount = Math.round(params.amount * 100);
    const interval = params.billing === "annual" ? "year" : "month";

    const body = new URLSearchParams({
      "mode": "subscription",
      "payment_method_types[0]": "card",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(unitAmount),
      "line_items[0][price_data][product_data][name]": `Al Bayaan ${params.planName} Plan`,
      "line_items[0][price_data][product_data][description]": `${params.billing === "annual" ? "Annual" : "Monthly"} subscription to Al Bayaan AI Academy`,
      "line_items[0][price_data][recurring][interval]": interval,
      "line_items[0][quantity]": "1",
      "success_url": `${appUrl}/payments?status=success&ref=${params.reference}`,
      "cancel_url": `${appUrl}/payments?status=cancelled`,
      "metadata[userId]": params.userId,
      "metadata[planId]": params.planId,
      "metadata[reference]": params.reference,
    });

    const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!resp.ok) {
      const err = await resp.text();
      logger.error({ err }, "Stripe session creation failed");
      return null;
    }

    const session = await resp.json() as any;
    return { url: session.url };
  } catch (err) {
    logger.error({ err }, "Stripe checkout error");
    return null;
  }
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
        method: "stripe",
        instructions: "Stripe card payments are not yet configured for this deployment. Please use Zaad, EVC Plus, or eDahab, or contact support@albayaan.com to set up card payments.",
      });
      return;
    }

    const session = await createStripeCheckoutSession({
      planId, planName: plan.name, amount, billing, userId: req.userId, reference,
    });

    if (!session) {
      res.json({
        success: false,
        method: "stripe",
        instructions: "Stripe checkout could not be initiated. Please try again or use Zaad/EVC/eDahab.",
      });
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
        metadata: { stripeCheckoutUrl: session.url },
      });
    } catch (dbErr) {
      logger.error({ dbErr }, "Failed to save Stripe payment record");
    }

    res.json({ success: true, redirectUrl: session.url, reference });
    return;
  } else if (method === "paypal") {
    res.json({
      success: false,
      method: "paypal",
      instructions: "PayPal payments are coming soon. Please use Zaad, EVC Plus, or eDahab for now, or contact support@albayaan.com.",
    });
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

// ── Stripe webhook — marks payment as completed when Stripe confirms ─────────
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
          .set({ status: "completed", metadata: { stripeSessionId: session.id } })
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
