import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminProcedure,
  customerProcedure,
  publicProcedure,
  router,
} from "../_core/trpc.js";
import {
  buildZiinaPaymentIntentRequest,
  convertAmountToFils,
  extractZiinaRedirectUrl,
  sanitizeZiinaErrorBody,
} from "../_core/ziina.js";
import {
  createOrderWithStock,
  InactiveProductError,
  InsufficientStockError,
  getAllOrders,
  getNewOrdersSince,
  getOrderById,
  getOrderByNumber,
  getOrderItems,
  getOrdersByUserId,
  releaseOrderStock,
  updateOrderPayment,
  updateOrderStatus,
} from "../db-products.js";
import { notifyOwner } from "../_core/notification.js";

async function createZiinaPaymentLink(opts: {
  amountFils: number;
  currency: string;
  description: string;
  orderNumber: string;
  baseUrl: string;
  apiKey: string;
  isProduction: boolean;
}) {
  try {
    if (!opts.apiKey) {
      console.error("[Ziina] diagnostic", {
        errorClass: "missing_api_key",
        tokenPresent: false,
        requestUrl: "https://api-v2.ziina.com/api/payment_intent",
        requestFieldNames: [
          "amount",
          "currency_code",
          "operation_id",
          "message",
          "success_url",
          "cancel_url",
          "failure_url",
          "test",
          "allow_tips",
        ],
        amount: opts.amountFils,
        currency_code: opts.currency,
        test: !opts.isProduction,
        appUrlOrigin: (() => {
          try {
            return new URL(opts.baseUrl).origin;
          } catch {
            return opts.baseUrl;
          }
        })(),
      });
      throw new Error("Unable to start Ziina checkout");
    }

    const request = buildZiinaPaymentIntentRequest({
      amountFils: opts.amountFils,
      currency: opts.currency,
      description: opts.description,
      orderNumber: opts.orderNumber,
      baseUrl: opts.baseUrl,
      apiKey: opts.apiKey,
      isProduction: opts.isProduction,
    });
    const resp = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(request.body),
    });
    let bodyText: string | null = null;
    let parsedBody: any = null;

    if (typeof (resp as Response).text === "function") {
      bodyText = await (resp as Response).text();
      if (bodyText) {
        try {
          parsedBody = JSON.parse(bodyText);
        } catch {
          parsedBody = null;
        }
      }
    } else if (typeof (resp as Response).json === "function") {
      parsedBody = await (resp as Response).json();
    }

    if (!resp.ok) {
      const errorPayload = sanitizeZiinaErrorBody(bodyText);
      console.error("[Ziina] diagnostic", {
        status: resp.status,
        statusText: resp.statusText,
        errorCode: errorPayload.errorCode,
        errorMessage: errorPayload.errorMessage,
        fieldValidationErrors: errorPayload.fieldValidationErrors,
        tokenPresent: true,
        requestUrl: request.url,
        requestFieldNames: Object.keys(request.body),
        amount: request.body.amount,
        currency_code: request.body.currency_code,
        test: request.body.test,
        appUrlOrigin: (() => {
          try {
            return new URL(opts.baseUrl).origin;
          } catch {
            return opts.baseUrl;
          }
        })(),
      });

      if (resp.status === 401) {
        throw new Error("Ziina authentication failed");
      }
      if (resp.status === 403) {
        throw new Error("Ziina authorization failed");
      }
      if (resp.status === 400) {
        throw new Error("Ziina validation failed");
      }
      throw new Error("Unable to start Ziina checkout");
    }

    const data = parsedBody ?? (bodyText ? (JSON.parse(bodyText) as any) : {});
    const redirectUrl = extractZiinaRedirectUrl(data);
    if (!redirectUrl) {
      console.error("[Ziina] diagnostic", {
        errorClass: "missing_redirect_url",
        tokenPresent: true,
        requestUrl: request.url,
        requestFieldNames: Object.keys(request.body),
        amount: request.body.amount,
        currency_code: request.body.currency_code,
        test: request.body.test,
        appUrlOrigin: (() => {
          try {
            return new URL(opts.baseUrl).origin;
          } catch {
            return opts.baseUrl;
          }
        })(),
      });
      throw new Error("Unable to start Ziina checkout");
    }
    return { id: data.id, url: redirectUrl };
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Ziina")) {
      console.error("[Ziina] exception", e.message);
    } else {
      console.error("[Ziina] diagnostic", {
        errorClass: "network_failure",
        tokenPresent: Boolean(opts.apiKey),
        requestUrl: "https://api-v2.ziina.com/api/payment_intent",
        requestFieldNames: [
          "amount",
          "currency_code",
          "operation_id",
          "message",
          "success_url",
          "cancel_url",
          "failure_url",
          "test",
          "allow_tips",
        ],
        amount: opts.amountFils,
        currency_code: opts.currency,
        test: !opts.isProduction,
        appUrlOrigin: (() => {
          try {
            return new URL(opts.baseUrl).origin;
          } catch {
            return opts.baseUrl;
          }
        })(),
      });
    }
    throw new Error("Unable to start Ziina checkout");
  }
}

export const ordersRouter = router({
  create: publicProcedure
    .input(
      z.object({
        customerName: z.string().min(1),
        customerPhone: z.string().min(1),
        customerEmail: z.string().email().optional(),
        shippingAddress: z.string().min(1),
        city: z.string().optional(),
        notes: z.string().optional(),
        couponCode: z.string().trim().min(1).optional(),
        items: z
          .array(
            z.object({
              productId: z.number().int().positive(),
              variant: z.string().optional(),
              quantity: z.number().int().positive(),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const customerId = ctx.customer?.id ?? null;
      let order;
      try {
        order = await createOrderWithStock(
          {
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            customerEmail: input.customerEmail,
            shippingAddress: input.shippingAddress,
            city: input.city,
            notes: input.notes,
            userId: customerId,
          },
          input.items,
          input.couponCode
        );
      } catch (error) {
        if (error instanceof InsufficientStockError) {
          const message = ctx.req.headers["accept-language"]
            ?.toString()
            .startsWith("ar")
            ? `المتوفر من ${error.productNameAr} هو ${error.available} فقط.`
            : `Only ${error.available} units of ${error.productNameEn} are available.`;
          throw new TRPCError({ code: "CONFLICT", message });
        }
        if (error instanceof InactiveProductError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more products are unavailable",
          });
        }
        if (
          error instanceof Error &&
          (error.message.includes("coupon") ||
            error.message.includes("Coupon") ||
            error.message.includes("Minimum order"))
        ) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        throw error;
      }
      const {
        orderId,
        orderNumber,
        subtotal,
        shippingAmount,
        discountAmount,
        taxAmount,
        totalAmount,
        currency,
        couponCode,
        items: orderItems,
      } = order;

      // Ziina payment link
      const ziinaKey = process.env.ZIINA_API_KEY;
      let paymentUrl: string | null = null;
      if (!ziinaKey) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Unable to start Ziina checkout",
        });
      }

      try {
        const baseUrl = process.env.APP_URL ?? "http://localhost:3001";
        const amountFils = convertAmountToFils(totalAmount);
        const ziina = await createZiinaPaymentLink({
          amountFils,
          currency,
          description: `Nose Order ${orderNumber}`,
          orderNumber,
          baseUrl,
          apiKey: ziinaKey,
          isProduction: process.env.NODE_ENV === "production",
        });
        await updateOrderPayment(orderId, "unpaid", ziina.id, ziina.url);
        paymentUrl = ziina.url;
      } catch (error) {
        await updateOrderPayment(orderId, "unpaid").catch(() => undefined);
        await updateOrderStatus(orderId, "cancelled").catch(() => undefined);
        await releaseOrderStock(orderId).catch(() => undefined);
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Unable to start Ziina checkout",
        });
      }

      // Notify owner (best effort; do not block order creation)
      const itemsList = orderItems
        .map(
          i =>
            `• ${i.productNameEn} (${i.variant ?? "standard"}) × ${i.quantity} @ AED ${i.unitPrice}`
        )
        .join("\n");
      try {
        await notifyOwner({
          title: `🛒 New Order ${orderNumber}`,
          content: `**Customer:** ${input.customerName}\n**Phone:** ${input.customerPhone}\n**Email:** ${input.customerEmail ?? "—"}\n**Address:** ${input.shippingAddress}, ${input.city ?? ""}\n\n**Items:**\n${itemsList}\n\n**Subtotal:** ${currency} ${subtotal}\n**Shipping:** ${currency} ${shippingAmount}\n**Discount:** ${currency} ${discountAmount}\n**Tax:** ${currency} ${taxAmount}\n**Total:** ${currency} ${totalAmount}\n\n**Order #:** ${orderNumber}`,
        });
      } catch (error) {
        console.warn("[Orders] Failed to notify owner:", error);
      }

      return {
        orderId,
        orderNumber,
        paymentUrl,
        subtotal,
        shippingAmount,
        discountAmount,
        taxAmount,
        totalAmount,
        currency,
        couponCode,
      };
    }),

  byNumber: publicProcedure
    .input(z.object({ orderNumber: z.string() }))
    .query(async ({ input }) => {
      const order = await getOrderByNumber(input.orderNumber);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      const items = await getOrderItems(order.id);
      return { order, items };
    }),

  myOrders: customerProcedure.query(async ({ ctx }) => {
    const orders = await getOrdersByUserId(ctx.customer.id);
    return orders;
  }),

  myOrderDetail: customerProcedure
    .input(
      z
        .object({
          orderId: z.number().optional(),
          orderNumber: z.string().optional(),
        })
        .refine(
          data => data.orderId !== undefined || data.orderNumber !== undefined,
          {
            message: "orderId or orderNumber is required",
          }
        )
    )
    .query(async ({ input, ctx }) => {
      const order = input.orderId
        ? await getOrderById(input.orderId)
        : await getOrderByNumber(input.orderNumber!);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.userId !== ctx.customer.id)
        throw new TRPCError({ code: "FORBIDDEN" });
      const items = await getOrderItems(order.id);
      return { order, items };
    }),

  // Admin
  adminList: adminProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getAllOrders(input?.status);
    }),

  adminDetail: adminProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const order = await getOrderById(input.orderId);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      const items = await getOrderItems(order.id);
      return { order, items };
    }),

  adminUpdateStatus: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum([
          "pending",
          "processing",
          "shipped",
          "completed",
          "cancelled",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      await updateOrderStatus(input.orderId, input.status);
      return { success: true };
    }),

  newOrdersSince: adminProcedure
    .input(z.object({ since: z.number() }))
    .query(async ({ input }) => {
      return getNewOrdersSince(new Date(input.since));
    }),
});
