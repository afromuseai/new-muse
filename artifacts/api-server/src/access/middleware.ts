/**
 * AfroMuse Backend Access Control — Middleware
 *
 * Route middleware for feature gating. Import and use on any route that
 * requires a specific feature to be available on the user's plan.
 *
 * Usage:
 *   import { requireFeature, requireAuth } from "../access/middleware.js";
 *
 *   router.post("/some-pro-route", requireAuth, requireFeature("canExportWav"), handler);
 */

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable, usageLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { checkAccess } from "./featureGate.js";
import type { FeatureKey } from "./types.js";

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
  userRole?: string;
  userPlan?: string;
  resolvedPlan?: string;
}

function extractJwtFromRequest(req: Request): JwtPayload | null {
  try {
    let token = req.cookies?.auth_token;
    if (!token) {
      const auth = req.headers?.authorization as string | undefined;
      if (auth?.startsWith("Bearer ")) token = auth.slice(7);
    }
    if (!token) return null;

    const secret = process.env["SESSION_SECRET"];
    if (!secret) return null;

    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Middleware: verifies JWT and attaches user info to the request.
 * Returns 401 if not authenticated.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const payload = extractJwtFromRequest(req);
  if (!payload) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  req.userId = payload.userId;
  req.userEmail = payload.email;
  req.userRole = payload.role;
  next();
}

/**
 * Middleware: attaches user info if authenticated, but does not block unauthenticated requests.
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const payload = extractJwtFromRequest(req);
  if (payload) {
    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.userRole = payload.role;
  }
  next();
}

/**
 * Middleware: fetches the user's current plan from the DB and attaches it to req.
 * Requires requireAuth to run first.
 */
export async function attachPlanFromDb(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.userId) {
    req.userPlan = "Free";
    req.resolvedPlan = "free";
    next();
    return;
  }
  try {
    const [user] = await db
      .select({ plan: usersTable.plan, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, req.userId))
      .limit(1);

    if (user) {
      req.userPlan = user.plan;
      req.userRole = user.role;
    } else {
      req.userPlan = "Free";
    }
    req.resolvedPlan = req.userPlan;
  } catch {
    req.userPlan = "Free";
    req.resolvedPlan = "free";
  }
  next();
}

/**
 * Middleware factory: gates the route behind a feature check.
 * Returns 403 with a JSON error if the feature is not available.
 * Must be used after requireAuth + attachPlanFromDb.
 */
export function requireFeature(feature: FeatureKey) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const rawPlan = req.userPlan ?? "Free";
    const role = req.userRole;
    const result = checkAccess(rawPlan, feature, role);

    if (!result.allowed) {
      res.status(403).json({
        error: result.reason ?? "This feature requires an upgrade.",
        feature,
        upgradeRequired: result.upgradeRequired,
        requiredPlan: result.requiredPlan,
      });
      return;
    }

    next();
  };
}

/**
 * Track feature usage in the DB (non-blocking — fire and forget).
 */
export function trackUsage(feature: FeatureKey, metadata?: Record<string, unknown>) {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    next();
    if (req.userId) {
      try {
        await db.insert(usageLogsTable).values({
          userId: req.userId,
          feature,
          plan: req.userPlan ?? "Free",
          metadata: metadata ?? null,
        });
      } catch {
        // Non-critical — don't fail the request
      }
    }
  };
}

/**
 * Legacy: attach the resolved plan to the request for use in handlers.
 */
export function attachPlan(req: AuthRequest, _res: Response, next: NextFunction): void {
  const payload = extractJwtFromRequest(req);
  if (payload) {
    req.userId = payload.userId;
    req.userRole = payload.role;
  }
  req.resolvedPlan = req.userPlan ?? "Free";
  next();
}
