import { Router } from "express";
import jwt from "jsonwebtoken";
import { db, projectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function getJwtSecret(): string {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

function extractToken(req: any): string | null {
  const cookie = req.cookies?.auth_token;
  if (cookie) return cookie;
  const auth = req.headers?.authorization as string | undefined;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

function getUserId(req: any): number | null {
  try {
    const token = extractToken(req);
    if (!token) return null;
    const payload = jwt.verify(token, getJwtSecret()) as { userId: number };
    return payload.userId;
  } catch {
    return null;
  }
}

router.get("/projects", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const rows = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.userId, userId))
      .orderBy(projectsTable.updatedAt);
    const sessions = rows.map((r) => r.data).reverse();
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: "Failed to load projects" });
  }
});

router.post("/projects", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const session = req.body as { sessionId?: string; sessionTitle?: string; [k: string]: unknown };
  if (!session?.sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }
  try {
    const now = new Date().toISOString();
    const existing = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(and(eq(projectsTable.sessionId, session.sessionId), eq(projectsTable.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(projectsTable)
        .set({
          sessionTitle: session.sessionTitle ?? "Untitled",
          data: { ...session, updatedAt: now },
          updatedAt: new Date(),
        })
        .where(and(eq(projectsTable.sessionId, session.sessionId), eq(projectsTable.userId, userId)));
    } else {
      await db.insert(projectsTable).values({
        userId,
        sessionId: session.sessionId,
        sessionTitle: session.sessionTitle ?? "Untitled",
        data: { ...session, createdAt: now, updatedAt: now },
      });
    }

    const [row] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.sessionId, session.sessionId), eq(projectsTable.userId, userId)))
      .limit(1);

    res.json({ session: row.data });
  } catch (err) {
    res.status(500).json({ error: "Failed to save project" });
  }
});

router.delete("/projects/:sessionId", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { sessionId } = req.params;
  try {
    await db
      .delete(projectsTable)
      .where(and(eq(projectsTable.sessionId, sessionId), eq(projectsTable.userId, userId)));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
