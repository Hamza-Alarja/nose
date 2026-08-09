import { eq } from "drizzle-orm";
import { adminUsers } from "../drizzle/schema";
import { getDb } from "./db";
import { scryptSync, randomBytes } from "crypto";

const SALT_LENGTH = 16;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const hash = scryptSync(password, salt, 64);
  return salt.toString("hex") + ":" + hash.toString("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  const [saltHex, hashHex] = hash.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const computedHash = scryptSync(password, salt, 64);
  return computedHash.toString("hex") === hashHex;
}

export async function getAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const normalizedEmail = email.trim().toLowerCase();
  const result = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, normalizedEmail))
    .limit(1);
  return result[0] ?? null;
}

export async function createAdminUser(
  email: string,
  password: string,
  fullName: string,
  preferredLanguage: string = "en"
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const passwordHash = hashPassword(password);
  await db.insert(adminUsers).values({
    email: email.toLowerCase(),
    passwordHash,
    fullName,
    preferredLanguage,
    isActive: true,
  });
}

export async function updateAdminLastLogin(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(adminUsers.id, id));
}
