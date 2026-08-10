import "dotenv/config";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { adminUsers } from "../drizzle/schema.js";
import { getDb } from "../server/db.js";
import { createAdminUser, getAdminByEmail } from "../server/db-admin.js";

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(question);
    return answer.trim();
  } finally {
    rl.close();
  }
}

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed. Check DATABASE_URL in .env.");
    process.exit(1);
  }

  const existing = await db.select().from(adminUsers).limit(1);
  if (existing.length > 0) {
    console.error(
      "Admin users already exist. This script is only for first-time setup."
    );
    process.exit(1);
  }

  const email =
    process.env.ADMIN_EMAIL?.trim() || (await prompt("Admin email: "));
  if (!email) {
    console.error("Admin email is required.");
    process.exit(1);
  }

  const password =
    process.env.ADMIN_PASSWORD?.trim() || (await prompt("Admin password: "));
  if (!password) {
    console.error("Admin password is required.");
    process.exit(1);
  }

  const fullName = process.env.ADMIN_FULL_NAME?.trim() || "Administrator";

  const existingAdmin = await getAdminByEmail(email);
  if (existingAdmin) {
    console.error(`An admin with email ${email} already exists.`);
    process.exit(1);
  }

  await createAdminUser(email, password, fullName);
  console.log(`Created admin user ${email}. Please login at /login.`);
}

main().catch(error => {
  console.error("Failed to create admin user:", error);
  process.exit(1);
});
