import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function hashPassword(password: string) {
  return bcryptjs.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcryptjs.compare(password, hash);
}

// ✅ ONLY ONE VERSION (matches your DB: serial = number)
export function generateToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

// ✅ ONLY ONE VERSION
export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { userId: number };
}