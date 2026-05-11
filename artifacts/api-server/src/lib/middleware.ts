import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = header.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    (req as any).userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
}
req.user = {
  id: decoded.userId,
  email: decoded.email,
  role: decoded.role,
  plan: decoded.plan, // 👈 THIS IS WHAT YOU NEED
};