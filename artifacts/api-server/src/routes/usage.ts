/**
 * /api/usage — Usage statistics and analytics
 *
 * Returns per-user usage stats and (for admins) conversion funnel data.
 */

import { Router } from "express";
import { db, usersTable, usageLogsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../access/middleware.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/usage/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db
      .select({
        plan: usersTable.plan,
        planExpiry: usersTable.planExpiry,
        usageStats: usersTable.usageStats,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const logs = await db
      .select({
        feature: usageLogsTable.feature,
        count: count(),
      })
      .from(usageLogsTable)
      .where(eq(usageLogsTable.userId, req.userId!))
      .groupBy(usageLogsTable.feature);

    const featureCounts: Record<string, number> = {};
    for (const log of logs) {
      featureCounts[log.feature] = Number(log.count);
    }

    res.json({
      plan: user.plan,
      planExpiry: user.planExpiry,
      memberSince: user.createdAt,
      featureUsage: featureCounts,
      usageStats: user.usageStats,
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch usage stats");
    res.status(500).json({ error: "Failed to fetch usage stats." });
  }
});

router.get("/usage/admin/funnel", requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== "admin") {
    res.status(403).json({ error: "Admin access required." });
    return;
  }

  try {
    const planCounts = await db
      .select({
        plan: usersTable.plan,
        count: count(),
      })
      .from(usersTable)
      .groupBy(usersTable.plan);

    const featureUsage = await db
      .select({
        feature: usageLogsTable.feature,
        plan: usageLogsTable.plan,
        count: count(),
      })
      .from(usageLogsTable)
      .groupBy(usageLogsTable.feature, usageLogsTable.plan);

    const totalUsers = planCounts.reduce((sum, p) => sum + Number(p.count), 0);

    res.json({
      totalUsers,
      planDistribution: planCounts.map((p) => ({
        plan: p.plan,
        count: Number(p.count),
        percentage: totalUsers > 0 ? Math.round((Number(p.count) / totalUsers) * 100) : 0,
      })),
      featureUsage: featureUsage.map((f) => ({
        feature: f.feature,
        plan: f.plan,
        count: Number(f.count),
      })),
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch funnel data");
    res.status(500).json({ error: "Failed to fetch funnel data." });
  }
});

export default router;
