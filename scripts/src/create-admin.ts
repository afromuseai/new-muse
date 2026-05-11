import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = readline.createInterface({ input, output });

async function main() {
  console.log("\n=== AfroMuse AI — Create Admin Account ===\n");

  const email = (await rl.question("Admin email: ")).trim().toLowerCase();
  const name = (await rl.question("Admin name: ")).trim();
  const password = await rl.question("Admin password (min 8 chars): ");

  rl.close();

  if (!email || !name || !password) {
    console.error("All fields are required.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await bcryptjs.hash(password, 12);

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(usersTable)
      .set({ name, passwordHash, role: "admin" })
      .where(eq(usersTable.email, email))
      .returning();
    console.log(`\nUpdated existing user to admin: ${updated.email} (id: ${updated.id})`);
  } else {
    const [created] = await db
      .insert(usersTable)
      .values({ name, email, passwordHash, role: "admin" })
      .returning();
    console.log(`\nCreated admin account: ${created.email} (id: ${created.id})`);
  }

  console.log("Done! You can now log in with these credentials.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
