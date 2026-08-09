import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  calculateShippingFils,
  DEFAULT_STORE_SETTINGS,
} from "./db-store-settings";

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    admin: null,
    customer: null,
    req: { protocol: "https", headers: { host: "localhost:3000" } } as any,
    res: { clearCookie: () => undefined } as any,
  };
}

function makeAdminCtx(): TrpcContext {
  const admin = {
    id: 1,
    openId: "admin-user",
    email: "admin@nose.com",
    name: "Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: admin,
    admin,
    customer: null,
    req: { protocol: "https", headers: { host: "localhost:3000" } } as any,
    res: { clearCookie: () => undefined } as any,
  };
}

describe("store settings", () => {
  it("creates a default settings record when requested publicly", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const settings = await caller.storeSettings.get();

    expect(settings.storeName).toBe(DEFAULT_STORE_SETTINGS.storeName);
    expect(settings.currency).toBe(DEFAULT_STORE_SETTINGS.currency);
  });

  it("allows admins to update settings and preserves validation", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const update = await caller.storeSettings.update({
      storeName: "NOSE UAE",
      announcementEn: "Free shipping all week",
      announcementAr: "شحن مجاني طوال الأسبوع",
      shippingFee: 10,
      freeShippingEnabled: true,
      freeShippingThreshold: 150,
      currency: "AED",
      supportEmail: "support@example.com",
      phoneNumber: "+971555123456",
      whatsappNumber: "+971555123456",
      instagramUrl: "https://instagram.com/nose",
      facebookUrl: "https://facebook.com/nose",
      tiktokUrl: "https://tiktok.com/@nose",
      twitterUrl: "https://x.com/nose",
      storeAddressEn: "Dubai",
      storeAddressAr: "دبي",
      businessHoursEn: "Mon-Sat 9am-7pm",
      businessHoursAr: "الاثنين - السبت 9 صباحاً - 7 مساءً",
      logoUrl: "https://example.com/logo.png",
      faviconUrl: "https://example.com/favicon.png",
      adminLoginLogoUrl: "https://example.com/admin-login.png",
    });

    expect(update.success).toBe(true);

    const next = await caller.storeSettings.get();
    expect(next.storeName).toBe("NOSE UAE");
    expect(Number(next.freeShippingThreshold)).toBe(150);
  });

  it("rejects invalid free shipping threshold values", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.storeSettings.update({
        ...DEFAULT_STORE_SETTINGS,
        freeShippingThreshold: -1,
      })
    ).rejects.toThrow();
  });

  it("calculates shipping using store settings rather than a hardcoded default", () => {
    const shipping = calculateShippingFils({
      subtotalFils: 20000,
      settings: {
        ...DEFAULT_STORE_SETTINGS,
        shippingFee: 25,
        freeShippingEnabled: true,
        freeShippingThreshold: 200,
      },
    });

    expect(shipping).toBe(0);
  });
});
