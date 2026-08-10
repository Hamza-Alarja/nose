import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "../db-products.js";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc.js";
import { storagePut } from "../storage.js";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
  return next({ ctx });
});

const normalizeOptionalNumericValue = (value: unknown) => {
  if (value === undefined || value === null) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  return value;
};

const normalizePriceValue = (value: unknown) => {
  if (typeof value === "string") {
    return value.trim();
  }
  return value;
};

const allowedCategories = ["men", "women", "gifts"] as const;
const categorySchema = z
  .string()
  .trim()
  .refine(
    value =>
      allowedCategories.includes(value as (typeof allowedCategories)[number]),
    {
      message: "Invalid category",
    }
  );

const productInput = z.object({
  sku: z.string().min(1),
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  scentNotesEn: z.string().optional(),
  scentNotesAr: z.string().optional(),
  category: categorySchema.optional(),
  price: z.union([z.string(), z.number()]).refine(value => {
    if (typeof value === "string") return value.trim().length > 0;
    return Number.isFinite(value);
  }),
  compareAtPrice: z.union([z.string(), z.number()]).nullable().optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  images: z.array(z.string()).optional(),
  variants: z.array(z.any()).optional(),
  isNew: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const productsRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          category: categorySchema.optional(),
          search: z.string().optional(),
          isNew: z.boolean().optional(),
          active: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const result = await getAllProducts(input ?? {});
      return Array.isArray(result) ? result : [];
    }),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const product = await getProductById(input.id);
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return product;
    }),

  create: adminProcedure.input(productInput).mutation(async ({ input }) => {
    try {
      const normalizedPrice = normalizePriceValue(input.price);
      const normalizedCompareAtPrice = normalizeOptionalNumericValue(
        input.compareAtPrice
      );
      const normalizedStockQuantity =
        input.stockQuantity === undefined || input.stockQuantity === null
          ? 0
          : Number(input.stockQuantity);

      await createProduct({
        ...input,
        price: normalizedPrice,
        compareAtPrice:
          normalizedCompareAtPrice === undefined ||
          normalizedCompareAtPrice === null ||
          normalizedCompareAtPrice === ""
            ? null
            : String(normalizedCompareAtPrice),
        stockQuantity: Number.isFinite(normalizedStockQuantity)
          ? normalizedStockQuantity
          : 0,
        images: input.images ?? [],
        variants: input.variants ?? [],
        isNew: input.isNew ?? false,
        isActive: input.isActive ?? true,
      } as any);
      return { success: true };
    } catch (error) {
      console.error("CREATE PRODUCT ERROR:", error);
      throw error;
    }
  }),

  update: adminProcedure
    .input(z.object({ id: z.number(), ...productInput.shape }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const normalizedPrice = normalizePriceValue(data.price);
      const normalizedCompareAtPrice = normalizeOptionalNumericValue(
        data.compareAtPrice
      );
      const normalizedStockQuantity =
        data.stockQuantity === undefined || data.stockQuantity === null
          ? undefined
          : Number(data.stockQuantity);

      await updateProduct(id, {
        ...data,
        price: normalizedPrice,
        compareAtPrice:
          normalizedCompareAtPrice === undefined ||
          normalizedCompareAtPrice === null ||
          normalizedCompareAtPrice === ""
            ? null
            : String(normalizedCompareAtPrice),
        stockQuantity: Number.isFinite(normalizedStockQuantity as number)
          ? normalizedStockQuantity
          : undefined,
      } as any);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteProduct(input.id);
      return { success: true };
    }),

  uploadImage: adminProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        contentType: z.string().optional(),
        dataBase64: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const safeName = input.filename
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^\.+/, "");
      const key = `products/${Date.now()}-${safeName}`;
      const data = Buffer.from(input.dataBase64, "base64");

      try {
        const result = await storagePut(
          key,
          data,
          input.contentType ?? "application/octet-stream"
        );
        return { url: result.url };
      } catch {
        return {
          url: `data:${input.contentType ?? "application/octet-stream"};base64,${input.dataBase64}`,
        };
      }
    }),
});
