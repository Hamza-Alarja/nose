import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import { randomBytes, scryptSync } from "crypto";

const SALT_LENGTH = 16;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeOptionalString(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [saltHex, hashHex] = hash.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const computedHash = scryptSync(password, salt, 64);
  return computedHash.toString("hex") === hashHex;
}

export async function findCustomerByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;

  const normalizedEmail = normalizeEmail(email);
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  return result[0] ?? null;
}

export async function createCustomer(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  phone?: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("DB unavailable");
  }

  const normalizedEmail = normalizeEmail(email);
  const passwordHash = hashPassword(password);

  await db.insert(users).values({
    openId: normalizedEmail,
    email: normalizedEmail,
    loginMethod: "password",
    role: "user",
    passwordHash,
    firstName: normalizeOptionalString(firstName),
    lastName: normalizeOptionalString(lastName),
    phone: normalizeOptionalString(phone),
    isActive: true,
    lastSignedIn: new Date().toISOString(),
  });
}

export async function updateCustomerLastLogin(id: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(users)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(users.id, id));
}
