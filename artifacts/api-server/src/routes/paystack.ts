/**
 * /api/paystack — Subscription management via Paystack
 *
 * Handles payment initialization, verification, and webhooks for plan upgrades.
 * Requires PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY env vars.
 */

import { Router, type Request, type Response } from "express";
import { createHmac } from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../access/middleware.js";
import { logger } from "../lib/logger.js";

const router = Router();

const SECRET_KEY = process.env["PAYSTACK_SECRET_KEY"] ?? "";
const PUBLIC_KEY = process.env["PAYSTACK_PUBLIC_KEY"] ?? "";

const PAYSTACK_API = "https://api.paystack.co";

// Pricing in GHS pesewas (1 GHS = 100 pesewas) — Paystack account is GHS-enabled
const PLAN_PRICING: Record<string, {
  planName: string;
  monthly: { amount: number; label: string };
  yearly: { amount: number; label: string; savings: string };
}> = {
  "creator-pro": {
    planName: "Creator Pro",
    monthly: { amount: 29900, label: "GHS 299/mo" },
    yearly:  { amount: 287040, label: "GHS 2,870/yr", savings: "Save GHS 718" },
  },
  "artist-pro": {
    planName: "Artist Pro",
    monthly: { amount: 59900, label: "GHS 599/mo" },
    yearly:  { amount: 575040, label: "GHS 5,750/yr", savings: "Save GHS 1,438" },
  },
};

function getAppUrl(): string {
  if (process.env["APP_URL"]) return process.env["APP_URL"];
  if (process.env["REPLIT_DEV_DOMAIN"]) return `https://${process.env["REPLIT_DEV_DOMAIN"]}`;
  return "http://localhost:5000";
}

// POST /api/paystack/initialize — start a payment
router.post("/paystack/initialize", requireAuth, async (req: AuthRequest, res: Response) => {
  if (!SECRET_KEY) {
    res.status(503).json({ error: "Payment processing is not configured.", code: "paystack_not_configured" });
    return;
  }

  const { plan, billingPeriod = "monthly" } = req.body as {
    plan?: string;
    billingPeriod?: "monthly" | "yearly";
  };

  if (!plan || !PLAN_PRICING[plan]) {
    res.status(400).json({ error: "Invalid plan. Must be 'creator-pro' or 'artist-pro'." });
    return;
  }

  try {
    const [user] = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const pricing = PLAN_PRICING[plan][billingPeriod];
    const reference = `afromuse_${req.userId}_${Date.now()}`;
    const callbackUrl = `${getAppUrl()}/payment/callback`;

    const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: pricing.amount,
        reference,
        callback_url: callbackUrl,
        currency: "GHS",
        metadata: {
          userId: String(req.userId),
          plan,
          planName: PLAN_PRICING[plan].planName,
          billingPeriod,
          custom_fields: [
            { display_name: "Plan", variable_name: "plan", value: PLAN_PRICING[plan].planName },
            { display_name: "Billing", variable_name: "billing", value: billingPeriod },
          ],
        },
      }),
    });

    const data = await response.json() as {
      status: boolean;
      message: string;
      data?: { authorization_url: string; reference: string; access_code: string };
    };

    if (!data.status || !data.data) {
      logger.error({ data }, "Paystack initialization failed");
      res.status(500).json({ error: "Failed to initialize payment." });
      return;
    }

    res.json({ url: data.data.authorization_url, reference: data.data.reference });
  } catch (err) {
    logger.error({ err }, "Paystack initialize error");
    res.status(500).json({ error: "Failed to start payment." });
  }
});

// GET /api/paystack/verify?reference=xxx — verify after callback
router.get("/paystack/verify", requireAuth, async (req: AuthRequest, res: Response) => {
  if (!SECRET_KEY) {
    res.status(503).json({ error: "Payment processing is not configured." });
    return;
  }

  const { reference } = req.query as { reference?: string };

  if (!reference) {
    res.status(400).json({ error: "Missing reference." });
    return;
  }

  try {
    const response = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
    });

    const data = await response.json() as {
      status: boolean;
      data?: {
        status: string;
        metadata?: {
          userId?: string;
          plan?: string;
          planName?: string;
          billingPeriod?: string;
        };
      };
    };

    if (!data.status || data.data?.status !== "success") {
      res.status(400).json({ error: "Payment not successful.", status: data.data?.status });
      return;
    }

    const meta = data.data.metadata;
    const userId = meta?.userId ? parseInt(meta.userId) : null;
    const planName = meta?.planName;
    const billingPeriod = meta?.billingPeriod ?? "monthly";

    if (!userId || !planName) {
      res.status(400).json({ error: "Missing payment metadata." });
      return;
    }

    // Confirm the verified user matches the logged-in user
    if (userId !== req.userId) {
      res.status(403).json({ error: "Payment does not belong to this account." });
      return;
    }

    const expiryDate = new Date();
    if (billingPeriod === "yearly") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    await db
      .update(usersTable)
      .set({ plan: planName, planExpiry: expiryDate })
      .where(eq(usersTable.id, userId));

    logger.info({ userId, planName, billingPeriod }, "Plan upgraded via Paystack verify");
    res.json({ success: true, plan: planName, planExpiry: expiryDate });
  } catch (err) {
    logger.error({ err }, "Paystack verify error");
    res.status(500).json({ error: "Verification failed." });
  }
});

// POST /api/paystack/webhook — Paystack event webhook
router.post("/paystack/webhook", async (req: Request, res: Response) => {
  if (!SECRET_KEY) {
    res.status(503).json({ error: "Not configured." });
    return;
  }

  const signature = req.headers["x-paystack-signature"] as string;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));

  const hash = createHmac("sha512", SECRET_KEY).update(rawBody).digest("hex");

  if (hash !== signature) {
    logger.warn("Paystack webhook signature mismatch");
    res.status(400).json({ error: "Invalid signature." });
    return;
  }

  const event = req.body as { event: string; data?: Record<string, unknown> };

  try {
    if (event.event === "charge.success") {
      const charge = event.data as {
        reference?: string;
        metadata?: { userId?: string; planName?: string; billingPeriod?: string };
      };

      const userId = charge.metadata?.userId ? parseInt(charge.metadata.userId) : null;
      const planName = charge.metadata?.planName;
      const billingPeriod = charge.metadata?.billingPeriod ?? "monthly";

      if (userId && planName) {
        const expiryDate = new Date();
        if (billingPeriod === "yearly") {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        }

        await db
          .update(usersTable)
          .set({ plan: planName, planExpiry: expiryDate })
          .where(eq(usersTable.id, userId));

        logger.info({ userId, planName, billingPeriod }, "Plan upgraded via Paystack webhook");
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, "Paystack webhook handler error");
    res.status(500).json({ error: "Webhook handler failed." });
  }
});

// GET /api/paystack/plans — plan config for frontend
router.get("/paystack/plans", (_req, res) => {
  res.json({
    publicKey: PUBLIC_KEY,
    currency: "GHS",
    plans: [
      {
        id: "creator-pro",
        name: "Creator Pro",
        pricing: {
          monthly: { amount: 29900, label: "GHS 299/mo" },
          yearly:  { amount: 287040, label: "GHS 2,870/yr", savings: "Save GHS 718" },
        },
        trial: "7 days free",
        features: [
          "Full lyric controls (Depth, Hook Repeat, Voice, Feel)",
          "Full rewrite stack (Humanize, Catchier, Harder)",
          "Full Audio Studio V2",
          "MP3 / WAV / Stems export",
          "Unlimited project saves",
          "Priority generation speed",
        ],
      },
      {
        id: "artist-pro",
        name: "Artist Pro",
        pricing: {
          monthly: { amount: 59900, label: "GHS 599/mo" },
          yearly:  { amount: 575040, label: "GHS 5,750/yr", savings: "Save GHS 1,438" },
        },
        trial: null,
        features: [
          "Everything in Creator Pro",
          "Artist DNA (personalized style)",
          "Voice Clone (coming soon)",
          "Persistent memory across sessions",
          "Advanced demo production",
          "Priority support",
        ],
      },
    ],
  });
});

export default router;
