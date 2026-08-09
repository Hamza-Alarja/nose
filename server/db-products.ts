import { and, desc, eq, like, or, sql } from "drizzle-orm";
import {
  InsertProduct,
  InsertOrder,
  InsertOrderItem,
  orderItems,
  orders,
  products,
  discountCodes,
} from "../drizzle/schema";
import { getDb } from "./db";
import { nanoid } from "nanoid";
import { normalizeDiscountCode } from "./db-discounts";
import { calculateShippingFils, getStoreSettings } from "./db-store-settings";

const DEFAULT_TAX_AED = "0.00";
const DEFAULT_DISCOUNT_AED = "0.00";

function moneyToFils(value: string | number): number {
  const normalized = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Invalid monetary value");
  }
  const [whole, fraction = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function filsToMoney(fils: number): string {
  return (Math.max(0, fils) / 100).toFixed(2);
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function getAllProducts(opts?: {
  category?: string;
  search?: string;
  isNew?: boolean;
  active?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.active !== false) conditions.push(eq(products.isActive, true));
  if (opts?.category) {
    const normalizedCategory = String(opts.category).trim().toLowerCase();
    if (["men", "women", "gifts"].includes(normalizedCategory)) {
      conditions.push(eq(products.category, normalizedCategory));
    }
  }
  if (opts?.isNew) conditions.push(eq(products.isNew, true));
  if (opts?.search) {
    conditions.push(
      or(
        like(products.nameEn, `%${opts.search}%`),
        like(products.nameAr, `%${opts.search}%`)
      )
    );
  }
  return db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(products.createdAt));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(products).values(data);
  return result[0];
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(products).where(eq(products.id, id));
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function createOrder(
  orderData: Omit<InsertOrder, "orderNumber">,
  items: Omit<InsertOrderItem, "orderId">[]
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const orderNumber = `NOSE-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;
  const [result] = await db
    .insert(orders)
    .values({ ...orderData, orderNumber });
  const orderId = (result as any).insertId as number;
  if (items.length > 0) {
    await db.insert(orderItems).values(items.map(i => ({ ...i, orderId })));
  }
  return { orderId, orderNumber };
}

export type OrderRequestItem = {
  productId: number;
  variant?: string;
  quantity: number;
};

export class InsufficientStockError extends Error {
  constructor(
    public readonly productNameEn: string,
    public readonly productNameAr: string,
    public readonly available: number
  ) {
    super("Insufficient stock");
  }
}

export class InactiveProductError extends Error {
  constructor(public readonly productId: number) {
    super("Product is unavailable");
  }
}

export async function createOrderWithStock(
  orderData: Omit<InsertOrder, "orderNumber" | "totalAmount">,
  requestedItems: OrderRequestItem[],
  couponCode?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (requestedItems.length === 0) throw new Error("Order requires items");

  return db.transaction(async tx => {
    const snapshots: Omit<InsertOrderItem, "orderId">[] = [];
    let subtotalFils = 0;

    for (const requested of requestedItems) {
      if (!Number.isInteger(requested.quantity) || requested.quantity <= 0) {
        throw new Error("Quantity must be a positive integer");
      }

      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, requested.productId))
        .limit(1)
        .for("update");
      if (!product || !product.isActive) {
        throw new InactiveProductError(requested.productId);
      }

      const variants = Array.isArray(product.variants) ? product.variants : [];
      const selectedVariant = requested.variant
        ? variants.find(variant => variant.size === requested.variant)
        : undefined;

      if (requested.variant && !selectedVariant) {
        throw new InactiveProductError(product.id);
      }

      let unitPrice = String(product.price);
      if (selectedVariant) {
        unitPrice = String(selectedVariant.price);
        const lockedVariants = variants.map(variant => ({ ...variant }));
        const variantIndex = lockedVariants.findIndex(
          variant => variant.size === requested.variant
        );
        const available = lockedVariants[variantIndex]?.stock ?? 0;
        if (available < requested.quantity) {
          throw new InsufficientStockError(
            product.nameEn,
            product.nameAr,
            available
          );
        }

        lockedVariants[variantIndex] = {
          ...lockedVariants[variantIndex],
          stock: available - requested.quantity,
        };
        await tx
          .update(products)
          .set({ variants: lockedVariants })
          .where(eq(products.id, product.id));
      } else {
        const result = await tx
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} - ${requested.quantity}`,
          })
          .where(
            and(
              eq(products.id, product.id),
              sql`${products.stockQuantity} >= ${requested.quantity}`
            )
          );
        const affectedRows = Number((result as any)[0]?.affectedRows ?? 0);
        if (affectedRows !== 1) {
          const [latest] = await tx
            .select({ stockQuantity: products.stockQuantity })
            .from(products)
            .where(eq(products.id, product.id))
            .limit(1);
          throw new InsufficientStockError(
            product.nameEn,
            product.nameAr,
            latest?.stockQuantity ?? 0
          );
        }
      }

      subtotalFils += moneyToFils(unitPrice) * requested.quantity;
      snapshots.push({
        productId: product.id,
        productNameAr: product.nameAr,
        productNameEn: product.nameEn,
        productImage: Array.isArray(product.images)
          ? product.images[0]
          : undefined,
        variant: requested.variant,
        quantity: requested.quantity,
        unitPrice: filsToMoney(moneyToFils(unitPrice)),
      });
    }

    let couponSnapshot: {
      code: string;
      type: string;
      value: string;
      discountFils: number;
    } | null = null;
    if (couponCode) {
      const [coupon] = await tx
        .select()
        .from(discountCodes)
        .where(eq(discountCodes.code, normalizeDiscountCode(couponCode)))
        .limit(1)
        .for("update");
      const now = Date.now();
      if (
        !coupon ||
        !coupon.isActive ||
        (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) ||
        (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) ||
        (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
      )
        throw new Error("Invalid or unavailable coupon");
      const minimumFils = moneyToFils(String(coupon.minimumOrderAmount));
      if (subtotalFils < minimumFils)
        throw new Error(
          `Minimum order amount is AED ${Number(coupon.minimumOrderAmount).toFixed(2)}`
        );
      let couponDiscountFils =
        coupon.type === "percentage"
          ? Math.floor((subtotalFils * Number(coupon.value)) / 100)
          : moneyToFils(String(coupon.value));
      if (coupon.maximumDiscountAmount !== null)
        couponDiscountFils = Math.min(
          couponDiscountFils,
          moneyToFils(String(coupon.maximumDiscountAmount))
        );
      couponDiscountFils = Math.min(couponDiscountFils, subtotalFils);
      const updated = await tx
        .update(discountCodes)
        .set({ usedCount: sql`${discountCodes.usedCount} + 1` })
        .where(
          and(
            eq(discountCodes.id, coupon.id),
            sql`(${discountCodes.usageLimit} IS NULL OR ${discountCodes.usedCount} < ${discountCodes.usageLimit})`
          )
        );
      if (Number((updated as any)[0]?.affectedRows ?? 0) !== 1)
        throw new Error("Coupon usage limit reached");
      couponSnapshot = {
        code: coupon.code,
        type: coupon.type,
        value: String(coupon.value),
        discountFils: couponDiscountFils,
      };
    }

    const settings = await getStoreSettings();
    const shippingFils = calculateShippingFils({
      subtotalFils,
      settings: {
        shippingFee: settings.shippingFee,
        freeShippingEnabled: settings.freeShippingEnabled,
        freeShippingThreshold: settings.freeShippingThreshold,
      },
    });
    const taxFils = moneyToFils(DEFAULT_TAX_AED);
    const discountFils =
      couponSnapshot?.discountFils ?? moneyToFils(DEFAULT_DISCOUNT_AED);
    const totalFils = Math.max(
      0,
      subtotalFils + shippingFils + taxFils - discountFils
    );
    const subtotal = filsToMoney(subtotalFils);
    const shippingAmount = filsToMoney(shippingFils);
    const taxAmount = filsToMoney(taxFils);
    const discountAmount = filsToMoney(discountFils);
    const totalAmount = filsToMoney(totalFils);
    const orderNumber = `NOSE-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;
    const [result] = await tx.insert(orders).values({
      ...orderData,
      orderNumber,
      subtotalAmount: subtotal,
      shippingAmount,
      discountAmount,
      taxAmount,
      totalAmount,
      currency: settings.currency,
      couponCode: couponSnapshot?.code ?? null,
      couponType: couponSnapshot?.type ?? null,
      couponValue: couponSnapshot?.value ?? null,
    });
    const orderId = (result as any).insertId as number;
    await tx
      .insert(orderItems)
      .values(snapshots.map(item => ({ ...item, orderId })));

    return {
      orderId,
      orderNumber,
      subtotal,
      shippingAmount,
      discountAmount,
      taxAmount,
      totalAmount,
      currency: settings.currency,
      couponCode: couponSnapshot?.code ?? null,
      items: snapshots,
    };
  });
}

export async function releaseOrderStock(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  return db.transaction(async tx => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)
      .for("update");
    if (!order || order.status !== "pending") return false;

    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1)
        .for("update");
      if (!product) continue;

      if (item.variant) {
        const variants = Array.isArray(product.variants)
          ? product.variants.map(variant => ({ ...variant }))
          : [];
        const variantIndex = variants.findIndex(
          variant => variant.size === item.variant
        );
        if (variantIndex >= 0) {
          variants[variantIndex] = {
            ...variants[variantIndex],
            stock: variants[variantIndex].stock + item.quantity,
          };
          await tx
            .update(products)
            .set({ variants })
            .where(eq(products.id, product.id));
        }
      } else {
        await tx
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`,
          })
          .where(eq(products.id, product.id));
      }
    }

    await tx
      .update(orders)
      .set({ status: "cancelled" })
      .where(eq(orders.id, orderId));
    return true;
  });
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  return result[0] ?? null;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getAllOrders(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db
      .select()
      .from(orders)
      .where(eq(orders.status, status as any))
      .orderBy(desc(orders.createdAt));
  }
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      customerPhone: orders.customerPhone,
      customerEmail: orders.customerEmail,
      shippingAddress: orders.shippingAddress,
      city: orders.city,
      country: orders.country,
      status: orders.status,
      totalAmount: orders.totalAmount,
      subtotalAmount: orders.subtotalAmount,
      shippingAmount: orders.shippingAmount,
      discountAmount: orders.discountAmount,
      taxAmount: orders.taxAmount,
      currency: orders.currency,
      couponCode: orders.couponCode,
      couponType: orders.couponType,
      couponValue: orders.couponValue,
      paymentStatus: orders.paymentStatus,
      paymentLinkId: orders.paymentLinkId,
      paymentLinkUrl: orders.paymentLinkUrl,
      notes: orders.notes,
      userId: orders.userId,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      itemCount: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
    })
    .from(orders)
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(eq(orders.userId, userId))
    .groupBy(
      orders.id,
      orders.orderNumber,
      orders.customerName,
      orders.customerPhone,
      orders.customerEmail,
      orders.shippingAddress,
      orders.city,
      orders.country,
      orders.status,
      orders.totalAmount,
      orders.subtotalAmount,
      orders.shippingAmount,
      orders.discountAmount,
      orders.taxAmount,
      orders.currency,
      orders.couponCode,
      orders.couponType,
      orders.couponValue,
      orders.paymentStatus,
      orders.paymentLinkId,
      orders.paymentLinkUrl,
      orders.notes,
      orders.userId,
      orders.createdAt,
      orders.updatedAt
    )
    .orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(orders)
    .set({ status: status as any })
    .where(eq(orders.id, id));
}

export async function updateOrderPayment(
  id: number,
  paymentStatus: string,
  paymentLinkId?: string,
  paymentLinkUrl?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(orders)
    .set({
      paymentStatus: paymentStatus as any,
      ...(paymentLinkId ? { paymentLinkId } : {}),
      ...(paymentLinkUrl ? { paymentLinkUrl } : {}),
    })
    .where(eq(orders.id, id));
}

export async function getNewOrdersSince(since: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(orders)
    .where(sql`${orders.createdAt} > ${since}`)
    .orderBy(desc(orders.createdAt));
}
