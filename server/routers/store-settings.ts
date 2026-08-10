import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc.js";
import { getStoreSettings, upsertStoreSettings } from "../db-store-settings.js";

const nullableUrl = z
  .string()
  .trim()
  .refine(value => value === "" || /^https?:\/\//i.test(value), {
    message: "Must be a valid URL or empty",
  });

const storeSettingsInputSchema = z.object({
  storeName: z.string().trim().min(1).max(255),
  announcementEn: z.string().trim().max(500).default(""),
  announcementAr: z.string().trim().max(500).default(""),
  shippingFee: z.coerce.number().min(0),
  freeShippingEnabled: z.boolean(),
  freeShippingThreshold: z.coerce.number().min(0),
  currency: z.string().trim().min(3).max(3),
  supportEmail: z.string().trim().email().or(z.literal("")),
  phoneNumber: z.string().trim().max(64).default(""),
  whatsappNumber: z.string().trim().max(64).default(""),
  instagramUrl: nullableUrl.default(""),
  facebookUrl: nullableUrl.default(""),
  tiktokUrl: nullableUrl.default(""),
  twitterUrl: nullableUrl.default(""),
  storeAddressEn: z.string().trim().max(500).default(""),
  storeAddressAr: z.string().trim().max(500).default(""),
  businessHoursEn: z.string().trim().max(500).default(""),
  businessHoursAr: z.string().trim().max(500).default(""),
  logoUrl: nullableUrl.default(""),
  faviconUrl: nullableUrl.default(""),
  adminLoginLogoUrl: nullableUrl.default(""),
});

const storeSettingsUpdateSchema = storeSettingsInputSchema.partial();

export const storeSettingsRouter = router({
  get: publicProcedure.query(async () => {
    return getStoreSettings();
  }),

  update: adminProcedure
    .input(storeSettingsUpdateSchema)
    .mutation(async ({ input }) => {
      const existing = await getStoreSettings();
      const next = {
        ...existing,
        ...input,
        shippingFee: String(
          input.shippingFee ?? existing.shippingFee ?? "25.00"
        ),
        freeShippingThreshold: String(
          input.freeShippingThreshold ??
            existing.freeShippingThreshold ??
            "200.00"
        ),
        storeName: input.storeName ?? existing.storeName,
      };

      const parsed = storeSettingsInputSchema.parse(next);
      await upsertStoreSettings({
        ...parsed,
        shippingFee: parsed.shippingFee.toFixed(2),
        freeShippingThreshold: parsed.freeShippingThreshold.toFixed(2),
      } as any);

      return { success: true };
    }),
});
