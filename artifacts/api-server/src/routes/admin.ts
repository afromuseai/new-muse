import { Router } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable, projectsTable } from "@workspace/db";
import { desc, count } from "drizzle-orm";
import { logger } from "../lib/logger";
import { getCredentialSummary, setProviderApiKey } from "../engine/providerCredentials.js";

const router = Router();

const COOKIE_NAME = "auth_token";

function verifyAdminToken(token: string): { userId: number; email: string; role: string } | null {
  try {
    const secret = process.env["SESSION_SECRET"];
    if (!secret) return null;
    const payload = jwt.verify(token, secret) as { userId: number; email: string; role: string };
    return payload.role === "admin" ? payload : null;
  } catch {
    return null;
  }
}

router.get("/admin/stats", async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const payload = verifyAdminToken(token);
  if (!payload) {
    res.status(403).json({ error: "Admin access required." });
    return;
  }

  try {
    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        plan: usersTable.plan,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));

    const planCounts = users.reduce(
      (acc, u) => {
        const key = u.role === "admin" ? "admin" : (u.plan as string);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const [projectCountRow] = await db.select({ value: count() }).from(projectsTable);
    const totalProjects = projectCountRow?.value ?? 0;

    res.json({
      users,
      planCounts: {
        Free:  planCounts["Free"]  ?? 0,
        Pro:   planCounts["Pro"]   ?? 0,
        Gold:  planCounts["Gold"]  ?? 0,
        Admin: planCounts["admin"] ?? 0,
      },
      totalUsers: users.length,
      totalProjects,
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch admin stats");
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// ─── GET /admin/engine-status — public, no secrets exposed ───────────────────
router.get("/admin/engine-status", (_req, res) => {
  const instrumental = getCredentialSummary("instrumental");
  res.json({
    instrumental: {
      apiKeySet:   instrumental.apiKeySet,
      endpointSet: instrumental.endpointSet,
      isLive:      instrumental.apiKeySet && instrumental.endpointSet,
    },
  });
});

// ─── POST /admin/set-api-key — admin-gated ────────────────────────────────────
router.post("/admin/set-api-key", (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }
  const payload = verifyAdminToken(token);
  if (!payload) {
    res.status(403).json({ error: "Admin access required." });
    return;
  }

  const { provider, key } = req.body as { provider?: string; key?: string };
  if (provider !== "instrumental") {
    res.status(400).json({ error: "Unsupported provider. Use \"instrumental\"." });
    return;
  }
  if (typeof key !== "string") {
    res.status(400).json({ error: "key must be a string." });
    return;
  }

  setProviderApiKey("instrumental", key);
  logger.info({ admin: payload.email, keyLength: key.trim().length }, "AI Music API key updated at runtime");
  res.json({ ok: true, apiKeySet: key.trim().length > 0 });
});

export default router;
