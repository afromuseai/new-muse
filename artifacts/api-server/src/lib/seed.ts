import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { logger } from "./logger";

const SEED_ACCOUNTS = [
  {
    email: "afromuseai@gmail.com",
    name: "AfroMuse Admin",
    password: "naesakim",
    role: "admin",
    plan: "Gold",
  },
  {
    email: "jayla2g5@gmail.com",
    name: "Jayla",
    password: "tester123",
    role: "user",
    plan: "Gold",
  },
];

export async function seedAccounts() {
  for (const account of SEED_ACCOUNTS) {
    try {
      const existing = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, account.email))
        .limit(1);

      if (existing.length > 0) {
        logger.info({ email: account.email }, "Seed account already exists — skipping");
        continue;
      }

      const passwordHash = await bcryptjs.hash(account.password, 12);

      await db.insert(usersTable).values({
        name: account.name,
        email: account.email,
        passwordHash,
        role: account.role,
        plan: account.plan,
        emailVerified: true,
      });

      logger.info({ email: account.email, role: account.role, plan: account.plan }, "Seed account created");
    } catch (err) {
      logger.error({ err, email: account.email }, "Failed to seed account");
    }
  }
}
