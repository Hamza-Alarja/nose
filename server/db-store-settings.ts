import { eq } from "drizzle-orm";
import { getDb } from "./db.js";
import {
  storeSettings,
  type InsertStoreSettings,
  type StoreSettings,
} from "../drizzle/schema.js";

export const DEFAULT_STORE_SETTINGS = {
  id: 1,
  storeName: "NOSE",
  announcementEn:
    "Free shipping on orders over 200 AED · Use code NOSE10 for 10% off",
  announcementAr:
    "شحن مجاني للطلبات فوق ٢٠٠ درهم · استخدم كود NOSE10 للحصول على خصم ١٠٪",
  shippingFee: "25.00",
  freeShippingEnabled: false,
  freeShippingThreshold: "200.00",
  currency: "AED",
  supportEmail: "support@nose.com",
  phoneNumber: "+971000000000",
  whatsappNumber: "+971000000000",
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  twitterUrl: "",
  storeAddressEn: "Dubai, United Arab Emirates",
  storeAddressAr: "دبي، الإمارات العربية المتحدة",
  businessHoursEn: "Sun - Thu · 10:00 AM - 8:00 PM",
  businessHoursAr: "الأحد - الخميس · 10:00 صباحاً - 8:00 مساءً",
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",
  adminLoginLogoUrl: "/logo.png",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} satisfies StoreSettings;

let inMemoryStoreSettings: StoreSettings | null = null;

function cloneDefaultStoreSettings(): StoreSettings {
  return {
    ...DEFAULT_STORE_SETTINGS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function moneyToFils(value: string | number): number {
  const normalized = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Invalid monetary value");
  }
  const [whole, fraction = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const db = await getDb();
  if (!db) {
    if (!inMemoryStoreSettings) {
      inMemoryStoreSettings = cloneDefaultStoreSettings();
    }
    return {
      ...inMemoryStoreSettings,
      createdAt: inMemoryStoreSettings.createdAt,
      updatedAt: inMemoryStoreSettings.updatedAt,
    };
  }

  const rows = await db.select().from(storeSettings).limit(1);
  if (rows.length > 0) {
    return rows[0];
  }

  const created = await db.insert(storeSettings).values({
    ...DEFAULT_STORE_SETTINGS,
    id: 1,
  });

  const insertId = Number((created as any)?.insertId ?? 1);
  const [saved] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.id, insertId))
    .limit(1);

  return saved ?? DEFAULT_STORE_SETTINGS;
}

export async function upsertStoreSettings(
  input: InsertStoreSettings
): Promise<StoreSettings> {
  const db = await getDb();
  if (!db) {
    const existing = inMemoryStoreSettings ?? cloneDefaultStoreSettings();
    const next = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    } as StoreSettings;
    inMemoryStoreSettings = next;
    return next;
  }

  const existing = await db.select().from(storeSettings).limit(1);
  if (existing.length === 0) {
    const created = await db.insert(storeSettings).values({
      ...DEFAULT_STORE_SETTINGS,
      ...input,
      id: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const insertId = Number((created as any)?.insertId ?? 1);
    const [saved] = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.id, insertId))
      .limit(1);

    return saved ?? { ...DEFAULT_STORE_SETTINGS, ...input };
  }

  await db
    .update(storeSettings)
    .set({
      ...input,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(storeSettings.id, existing[0].id));

  const [updated] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.id, existing[0].id))
    .limit(1);

  return updated ?? { ...DEFAULT_STORE_SETTINGS, ...input };
}

export function calculateShippingFils(input: {
  subtotalFils: number;
  settings: Pick<
    StoreSettings,
    "shippingFee" | "freeShippingEnabled" | "freeShippingThreshold"
  >;
}): number {
  const shippingFeeFils = moneyToFils(
    String(input.settings.shippingFee ?? "0.00")
  );
  const thresholdFils = moneyToFils(
    String(input.settings.freeShippingThreshold ?? "0.00")
  );

  if (
    input.settings.freeShippingEnabled === true &&
    input.subtotalFils >= thresholdFils
  ) {
    return 0;
  }

  return shippingFeeFils;
}
