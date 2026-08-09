import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { discountCodes } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import {
  listDiscountCodes,
  normalizeDiscountCode,
  validateDiscountPreview,
} from "../db-discounts";

const codeInput = z
  .object({
    code: z
      .string()
      .trim()
      .min(1)
      .transform(value => value.toUpperCase()),
    type: z.enum(["percentage", "fixed"]),
    value: z.number().positive(),
    minimumOrderAmount: z.number().nonnegative().default(0),
    maximumDiscountAmount: z.number().positive().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .superRefine((input, ctx) => {
    if (input.type === "percentage" && (input.value < 1 || input.value > 100))
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percentage must be between 1 and 100",
      });
  });

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin")
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  return next({ ctx });
});

export const discountCodesRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          active: z.boolean().optional(),
        })
        .optional()
    )
    .query(({ input }) => listDiscountCodes(input?.search, input?.active)),
  create: adminProcedure.input(codeInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    try {
      await db
        .insert(discountCodes)
        .values({
          code: normalizeDiscountCode(input.code),
          type: input.type,
          value: input.value.toFixed(2),
          minimumOrderAmount: input.minimumOrderAmount.toFixed(2),
          maximumDiscountAmount:
            input.maximumDiscountAmount?.toFixed(2) ?? null,
          usageLimit: input.usageLimit ?? null,
          startsAt: input.startsAt ?? null,
          expiresAt: input.expiresAt ?? null,
          isActive: input.isActive,
        });
      return { success: true };
    } catch {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Discount code already exists",
      });
    }
  }),
  update: adminProcedure
    .input(z.object({ id: z.number(), data: codeInput.partial() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const data = input.data;
      if (
        data.type === "percentage" &&
        data.value !== undefined &&
        (data.value < 1 || data.value > 100)
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Percentage must be between 1 and 100",
        });
      await db
        .update(discountCodes)
        .set({
          ...(data.code ? { code: normalizeDiscountCode(data.code) } : {}),
          ...(data.type ? { type: data.type } : {}),
          ...(data.value !== undefined ? { value: data.value.toFixed(2) } : {}),
          ...(data.minimumOrderAmount !== undefined
            ? { minimumOrderAmount: data.minimumOrderAmount.toFixed(2) }
            : {}),
          ...(data.maximumDiscountAmount !== undefined
            ? {
                maximumDiscountAmount:
                  data.maximumDiscountAmount?.toFixed(2) ?? null,
              }
            : {}),
          ...(data.usageLimit !== undefined
            ? { usageLimit: data.usageLimit }
            : {}),
          ...(data.startsAt !== undefined ? { startsAt: data.startsAt } : {}),
          ...(data.expiresAt !== undefined
            ? { expiresAt: data.expiresAt }
            : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        })
        .where(eq(discountCodes.id, input.id));
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(discountCodes).where(eq(discountCodes.id, input.id));
      return { success: true };
    }),
  validate: publicProcedure
    .input(
      z.object({
        code: z.string().min(1),
        items: z.array(
          z.object({
            productId: z.number().int().positive(),
            variant: z.string().optional(),
            quantity: z.number().int().positive(),
          })
        ),
      })
    )
    .query(({ input }) => validateDiscountPreview(input.code, input.items)),
});
