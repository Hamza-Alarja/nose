import { and, eq, like } from "drizzle-orm";
import { discountCodes, products } from "../drizzle/schema.js";
import { getDb } from "./db.js";

export type DiscountType = "percentage" | "fixed";
export const normalizeDiscountCode = (code: string) =>
  code.trim().toUpperCase();

export function calculateDiscountFils(input: {
  type: DiscountType;
  value: number;
  subtotalFils: number;
  maximumDiscountFils?: number | null;
}) {
  let discount =
    input.type === "percentage"
      ? Math.floor((input.subtotalFils * input.value) / 100)
      : Math.round(input.value * 100);
  if (
    input.maximumDiscountFils !== null &&
    input.maximumDiscountFils !== undefined
  )
    discount = Math.min(discount, input.maximumDiscountFils);
  return Math.max(0, Math.min(discount, input.subtotalFils));
}

export async function listDiscountCodes(search?: string, active?: boolean) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (search)
    conditions.push(
      like(discountCodes.code, `%${normalizeDiscountCode(search)}%`)
    );
  if (active !== undefined) conditions.push(eq(discountCodes.isActive, active));
  return db
    .select()
    .from(discountCodes)
    .where(conditions.length ? and(...conditions) : undefined);
}

export async function getDiscountCode(tx: any, code: string) {
  const [discount] = await tx
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.code, normalizeDiscountCode(code)))
    .limit(1)
    .for("update");
  return discount;
}

export async function validateDiscountPreview(
  code: string,
  items: { productId: number; variant?: string; quantity: number }[]
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.transaction(async tx => {
    const discount = await getDiscountCode(tx, code);
    if (!discount)
      return {
        valid: false,
        code: normalizeDiscountCode(code),
        discountAmount: "0.00",
        subtotal: "0.00",
        message: "Invalid coupon code",
      };
    const now = Date.now();
    if (!discount.isActive)
      return {
        valid: false,
        code: discount.code,
        discountAmount: "0.00",
        subtotal: "0.00",
        message: "Coupon is inactive",
      };
    if (discount.startsAt && new Date(discount.startsAt).getTime() > now)
      return {
        valid: false,
        code: discount.code,
        discountAmount: "0.00",
        subtotal: "0.00",
        message: "Coupon is not active yet",
      };
    if (discount.expiresAt && new Date(discount.expiresAt).getTime() < now)
      return {
        valid: false,
        code: discount.code,
        discountAmount: "0.00",
        subtotal: "0.00",
        message: "Coupon expired",
      };
    if (
      discount.usageLimit !== null &&
      discount.usedCount >= discount.usageLimit
    )
      return {
        valid: false,
        code: discount.code,
        discountAmount: "0.00",
        subtotal: "0.00",
        message: "Coupon usage limit reached",
      };
    let subtotalFils = 0;
    for (const item of items) {
      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);
      if (!product || !product.isActive)
        return {
          valid: false,
          code: discount.code,
          discountAmount: "0.00",
          subtotal: "0.00",
          message: "Product unavailable",
        };
      const variant =
        item.variant && Array.isArray(product.variants)
          ? product.variants.find(v => v.size === item.variant)
          : undefined;
      const price = variant?.price ?? product.price;
      subtotalFils += Math.round(Number(price) * 100) * item.quantity;
    }
    const subtotal = subtotalFils / 100;
    const minimum = Number(discount.minimumOrderAmount);
    if (subtotal < minimum)
      return {
        valid: false,
        code: discount.code,
        discountAmount: "0.00",
        subtotal: subtotal.toFixed(2),
        message: `Minimum order amount is AED ${minimum.toFixed(2)}`,
      };
    const discountAmount =
      calculateDiscountFils({
        type: discount.type,
        value: Number(discount.value),
        subtotalFils,
        maximumDiscountFils:
          discount.maximumDiscountAmount === null
            ? null
            : Math.round(Number(discount.maximumDiscountAmount) * 100),
      }) / 100;
    return {
      valid: true,
      code: discount.code,
      discountAmount: discountAmount.toFixed(2),
      subtotal: subtotal.toFixed(2),
      message: "Coupon applied",
      type: discount.type,
      value: String(discount.value),
    };
  });
}
