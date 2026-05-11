/**
 * /api/stripe — Subscription management
 *
 * Handles Stripe checkout sessions and webhooks for plan upgrades.
 * Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET env vars.
 */

import { Router, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../access/middleware.js";
import { logger } from "../lib/logger.js";

const router = Router();

const PLAN_PRICES: Record<string, { monthly: string; yearly: string; planName: string }> = {
  "creator-pro": {
    monthly: process.env["STRIPE_CREATOR_PRO_MONTHLY_PRICE_ID"] ?? "",
    yearly:  process.env["STRIPE_CREATOR_PRO_YEARLY_PRICE_ID"] ?? "",
    planName: "Creator Pro",
  },
  "artist-pro": {
    monthly: process.env["STRIPE_ARTIST_PRO_MONTHLY_PRICE_ID"] ?? "",
    yearly:  process.env["STRIPE_ARTIST_PRO_YEARLY_PRICE_ID"] ?? "",
    planName: "Artist Pro",
  },
};

function getStripe() {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) return null;
  // Dynamic import to avoid crashing if stripe isn't installed
  const Stripe = require("stripe");
  return new Stripe(key, { apiVersion: "2025-03-31.basil" });
}

router.post("/stripe/create-checkout-session", requireAuth, async (req: AuthRequest, res: Response) => {
  const stripe = getStripe();

  if (!stripe) {
    res.status(503).json({
      error: "Payment processing is not yet configured. Please contact support.",
      code: "stripe_not_configured",
    });
    return;
  }

  const { plan, billingPeriod = "monthly" } = req.body as {
    plan?: string;
    billingPeriod?: "monthly" | "yearly";
  };

  if (!plan || !PLAN_PRICES[plan]) {
    res.status(400).json({ error: "Invalid plan. Must be 'creator-pro' or 'artist-pro'." });
    return;
  }

  const priceId = billingPeriod === "yearly"
    ? PLAN_PRICES[plan].yearly
    : PLAN_PRICES[plan].monthly;

  if (!priceId) {
    res.status(503).json({
      error: "Price not configured for this plan. Please contact support.",
      code: "price_not_configured",
    });
    return;
  }

  try {
    const [user] = await db
      .select({ email: usersTable.email, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const appUrl = process.env["APP_URL"]
      ?? (process.env["REPLIT_DEV_DOMAIN"] ? `https://${process.env["REPLIT_DEV_DOMAIN"]}` : "http://localhost:5000");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/studio?upgrade=success&plan=${plan}`,
      cancel_url: `${appUrl}/pricing?upgrade=cancelled`,
      metadata: {
        userId: String(req.userId),
        plan,
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId: String(req.userId),
          plan,
        },
        trial_period_days: plan === "creator-pro" ? 7 : undefined,
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    logger.error({ err }, "Stripe checkout session creation failed");
    res.status(500).json({ error: "Failed to create checkout session." });
  }
});

router.post("/stripe/webhook", async (req: Request, res: Response) => {
  const stripe = getStripe();

  if (!stripe) {
    res.status(503).json({ error: "Stripe not configured." });
    return;
  }

  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!webhookSecret) {
    res.status(503).json({ error: "Webhook secret not configured." });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  let event: { type: string; data: { object: Record<string, unknown> } };

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error({ err }, "Stripe webhook signature verification failed");
    res.status(400).json({ error: "Invalid webhook signature." });
    return;
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        metadata?: { userId?: string; plan?: string };
        subscription?: string;
        current_period_end?: number;
      };

      const userId = session.metadata?.userId ? parseInt(session.metadata.userId) : null;
      const plan = session.metadata?.plan;

      if (userId && plan && PLAN_PRICES[plan]) {
        const planName = PLAN_PRICES[plan].planName;
        await db
          .update(usersTable)
          .set({
            plan: planName,
            planExpiry: session.current_period_end
              ? new Date(session.current_period_end * 1000)
              : null,
          })
          .where(eq(usersTable.id, userId));

        logger.info({ userId, plan: planName }, "Plan upgraded via Stripe webhook");
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as {
        metadata?: { userId?: string };
      };

      const userId = subscription.metadata?.userId
        ? parseInt(subscription.metadata.userId)
        : null;

      if (userId) {
        await db
          .update(usersTable)
          .set({ plan: "Free", planExpiry: null })
          .where(eq(usersTable.id, userId));

        logger.info({ userId }, "Plan downgraded to Free via Stripe webhook (subscription cancelled)");
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as {
        subscription?: string;
        lines?: { data?: Array<{ metadata?: { userId?: string; plan?: string }; period?: { end?: number } }> };
      };

      const line = invoice.lines?.data?.[0];
      const userId = line?.metadata?.userId ? parseInt(line.metadata.userId) : null;
      const plan = line?.metadata?.plan;

      if (userId && plan && PLAN_PRICES[plan]) {
        await db
          .update(usersTable)
          .set({
            planExpiry: line?.period?.end
              ? new Date(line.period.end * 1000)
              : null,
          })
          .where(eq(usersTable.id, userId));
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, "Stripe webhook handler error");
    res.status(500).json({ error: "Webhook handler failed." });
  }
});

router.get("/stripe/plans", async (_req, res) => {
  res.json({
    plans: [
      {
        id: "creator-pro",
        name: "Creator Pro",
        pricing: {
          monthly: { amount: 2000, currency: "usd", label: "$20/mo" },
          yearly:  { amount: 19200, currency: "usd", label: "$192/yr", savings: "Save $48" },
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
          monthly: { amount: 4000, currency: "usd", label: "$40/mo" },
          yearly:  { amount: 38400, currency: "usd", label: "$384/yr", savings: "Save $96" },
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
