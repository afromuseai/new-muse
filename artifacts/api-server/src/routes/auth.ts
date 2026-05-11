import { Router } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendVerificationEmail } from "../email.js";
import {
  validateRegistrationEmail,
  normalizeGmailAddress,
} from "../lib/emailValidation.js";

const router = Router();

const COOKIE_NAME = "auth_token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7 * 1000,
};

function getJwtSecret(): string {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

function signToken(payload: { userId: number; email: string; role: string }) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

function effectivePlan(user: { role: string; plan: string }): string {
  return user.role === "admin" ? "Gold" : user.plan;
}

function verifyToken(
  token: string,
): { userId: number; email: string; role: string } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as {
      userId: number;
      email: string;
      role: string;
    };
  } catch {
    return null;
  }
}

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getBaseUrl(req: import("express").Request): string {
  const appUrl = process.env["APP_URL"];
  if (appUrl) return appUrl.replace(/\/$/, "");
  const replitDomain =
    process.env["REPLIT_DEV_DOMAIN"] ??
    process.env["REPLIT_DOMAINS"]?.split(",")[0];
  if (replitDomain) return `https://${replitDomain}`;
  const protocol =
    (req.headers["x-forwarded-proto"] as string | undefined) ??
    req.protocol ??
    "https";
  const host =
    (req.headers["x-forwarded-host"] as string | undefined) ?? req.headers.host;
  return `${protocol}://${host}`;
}

router.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required." });
    return;
  }

  const emailValidation = validateRegistrationEmail(email);
  if (!emailValidation.valid) {
    res.status(400).json({ error: emailValidation.error });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  const normalizedEmail = emailValidation.normalizedEmail!;

  try {
    // Check both the exact address and the normalized (dot-trick-proof) address
    const existing = await db
      .select({ id: usersTable.id, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const passwordHash = await bcryptjs.hash(password, 12);
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(usersTable).values({
      name,
      email: normalizedEmail,
      passwordHash,
      role: "user",
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    const baseUrl = getBaseUrl(req);
    await sendVerificationEmail(
      normalizedEmail,
      name,
      verificationToken,
      baseUrl,
    );

    res.status(201).json({ requiresVerification: true, email: normalizedEmail });
    return;
  } 
  
  catch {
    res.status(500).json({ error: "Registration failed. Please try again." });
    return;
  }

});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    const emailValidation = validateRegistrationEmail(email);

    if (!emailValidation.valid) {
      res.status(400).json({ error: emailValidation.error });
      return;
    }

    const lookupEmail = emailValidation.normalizedEmail!;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, lookupEmail))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const valid = await bcryptjs.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({error: "Please verify your email before logging in.",
          requiresVerification: true,
          email: user.email,
        });
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: effectivePlan(user),
      token,
    });
  } catch {
    res.status(500).json({ error: "Login failed. Please try again." });
    return;
  }
});

router.get("/auth/verify-email", async (req, res) => {
  const { token } = req.query as { token?: string };

  if (!token) {
    res.status(400).json({ error: "Verification token is required." });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.verificationToken, token))
      .limit(1);

    if (!user) {
      res.status(400).json({ error: "Invalid or expired verification link." });
      return;
    }

    if (user.emailVerified) {
      const authToken = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      res.cookie(COOKIE_NAME, authToken, COOKIE_OPTIONS);
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: effectivePlan(user),
        token: authToken,
        alreadyVerified: true,
      });
      return;
    }

    if (
      user.verificationTokenExpiry &&
      new Date() > user.verificationTokenExpiry
    ) {
      res.status(400).json({error:"This verification link has expired. Please request a new one.",
          expired: true,
          email: user.email,
        });
      return;
    }

    await db
      .update(usersTable)
      .set({
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      })
      .where(eq(usersTable.id, user.id));

    const authToken = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    res.cookie(COOKIE_NAME, authToken, COOKIE_OPTIONS);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: effectivePlan(user),
      token: authToken,
    });
  } catch {
    res.status(500).json({ error: "Verification failed. Please try again." });
    return;
  }
});

router.post("/auth/resend-verification", async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email) {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  try {
    const lookupEmail = normalizeGmailAddress(email);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, lookupEmail))
      .limit(1);

    if (!user) {
      res.json({ success: true });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ error: "This email is already verified." });
      return;
    }

    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db
      .update(usersTable)
      .set({ verificationToken, verificationTokenExpiry })
      .where(eq(usersTable.id, user.id));

    const baseUrl = getBaseUrl(req);
    await sendVerificationEmail(
      user.email,
      user.name,
      verificationToken,
      baseUrl,
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to resend verification email." });
    return;
  }
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ success: true });
});

router.get("/auth/me", async (req, res) => {
  let token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    const auth = req.headers?.authorization as string | undefined;
    if (auth?.startsWith("Bearer ")) token = auth.slice(7);
  }
  if (!token) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.status(401).json({ error: "Session expired. Please log in again." });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);
    if (!user) {
      res.clearCookie(COOKIE_NAME, { path: "/" });
      res.status(401).json({ error: "User not found." });
      return;
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: effectivePlan(user),
      emailVerified: user.emailVerified,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch user." });
    return;
  }
});

export default router;
