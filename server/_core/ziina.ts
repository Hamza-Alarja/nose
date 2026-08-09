import { createHash } from "crypto";
import type { Request } from "express";

export type ZiinaPaymentIntentRequest = {
  url: string;
  headers: {
    Authorization: string;
    "Content-Type": string;
  };
  body: {
    amount: number;
    currency_code: string;
    operation_id: string;
    message: string;
    success_url: string;
    cancel_url: string;
    failure_url: string;
    test: boolean;
    allow_tips: false;
  };
};

export type ZiinaRedirectUrls = {
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
};

export type ZiinaPaymentIntentResponse = {
  id?: string;
  redirect_url?: string;
  embedded_url?: string;
  status?: string;
  success_url?: string;
  cancel_url?: string;
};

export type ZiinaWebhookEvent = {
  event?: string;
  status?: string;
  id?: string;
  payment_intent_id?: string;
};

export type ZiinaWebhookDeps = {
  findOrderByPaymentIntentId: (paymentIntentId: string) => Promise<any>;
  updateOrderPayment?: (
    orderId: number,
    paymentStatus: string
  ) => Promise<void>;
  updateOrderStatus?: (orderId: number, status: string) => Promise<void>;
  releaseOrderStock?: (orderId: number) => Promise<boolean | void>;
};

export function convertAmountToFils(amount: string | number): number {
  if (typeof amount === "number") {
    return Math.round(amount * 100);
  }

  const normalized = String(amount).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Invalid monetary amount");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const scaledFraction = fraction.padEnd(2, "0").slice(0, 2);
  return Number(whole) * 100 + Number(scaledFraction);
}

export function buildZiinaRedirectUrls(
  baseUrl: string,
  orderNumber: string
): ZiinaRedirectUrls {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  return {
    successUrl: `${normalizedBaseUrl}/order-confirmation?order=${encodeURIComponent(orderNumber)}&payment=success`,
    cancelUrl: `${normalizedBaseUrl}/checkout?order=${encodeURIComponent(orderNumber)}&payment=cancelled`,
    failureUrl: `${normalizedBaseUrl}/checkout?order=${encodeURIComponent(orderNumber)}&payment=failed`,
  };
}

export function createDeterministicOperationId(orderNumber: string): string {
  const hash = createHash("sha256").update(orderNumber).digest();
  const bytes = Array.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [
    bytes
      .slice(0, 4)
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join(""),
    bytes
      .slice(4, 6)
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join(""),
    bytes
      .slice(6, 8)
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join(""),
    bytes
      .slice(8, 10)
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join(""),
    bytes
      .slice(10, 16)
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join(""),
  ].join("-");
}

export function buildZiinaPaymentIntentRequest(opts: {
  amountFils: number;
  currency: string;
  description: string;
  orderNumber: string;
  baseUrl: string;
  apiKey: string;
  isProduction: boolean;
}): ZiinaPaymentIntentRequest {
  const { successUrl, cancelUrl, failureUrl } = buildZiinaRedirectUrls(
    opts.baseUrl,
    opts.orderNumber
  );
  return {
    url: "https://api-v2.ziina.com/api/payment_intent",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: {
      amount: opts.amountFils,
      currency_code: opts.currency,
      operation_id: createDeterministicOperationId(opts.orderNumber),
      message: opts.description,
      success_url: successUrl,
      cancel_url: cancelUrl,
      failure_url: failureUrl,
      test: !opts.isProduction,
      allow_tips: false,
    },
  };
}

export function extractZiinaRedirectUrl(
  paymentIntent: Partial<ZiinaPaymentIntentResponse> | null | undefined
): string | null {
  const redirectUrl =
    typeof paymentIntent?.redirect_url === "string"
      ? paymentIntent.redirect_url.trim()
      : "";
  return redirectUrl.length > 0 ? redirectUrl : null;
}

export type SanitizedZiinaError = {
  errorCode?: string;
  errorMessage?: string;
  fieldValidationErrors?: Array<{ field: string; message: string }>;
};

function redactSensitiveUrls(value: string): string {
  return value.replace(/https?:\/\/[^\s]+/g, "[redacted-url]");
}

export function sanitizeZiinaErrorBody(
  rawBody: string | null | undefined
): SanitizedZiinaError {
  if (!rawBody) return {};

  try {
    const parsed = JSON.parse(rawBody) as any;
    const errorCode =
      typeof parsed?.error?.code === "string"
        ? parsed.error.code
        : typeof parsed?.code === "string"
          ? parsed.code
          : undefined;
    const errorMessage =
      typeof parsed?.error?.message === "string"
        ? parsed.error.message
        : typeof parsed?.message === "string"
          ? parsed.message
          : undefined;

    const fieldValidationErrors = Array.isArray(parsed?.errors)
      ? parsed.errors
          .map((entry: unknown) => {
            if (typeof entry === "string")
              return { field: "unknown", message: entry };
            if (entry && typeof entry === "object") {
              const field =
                typeof (entry as any).field === "string"
                  ? (entry as any).field
                  : typeof (entry as any).name === "string"
                    ? (entry as any).name
                    : "unknown";
              const message =
                typeof (entry as any).message === "string"
                  ? (entry as any).message
                  : typeof (entry as any).error === "string"
                    ? (entry as any).error
                    : "validation error";
              return { field, message };
            }
            return null;
          })
          .filter(
            (
              item: { field: string; message: string } | null
            ): item is { field: string; message: string } => Boolean(item)
          )
      : [];

    return {
      errorCode,
      errorMessage: errorMessage
        ? redactSensitiveUrls(errorMessage)
        : undefined,
      fieldValidationErrors,
    };
  } catch {
    return {
      errorMessage: redactSensitiveUrls(rawBody.slice(0, 500)),
    };
  }
}

export function getRawBodyBuffer(req: Request): Buffer {
  const raw = (req as Request & { rawBody?: unknown }).rawBody;
  if (Buffer.isBuffer(raw)) return raw;
  if (typeof raw === "string") return Buffer.from(raw);
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body);
  if (req.body == null) return Buffer.alloc(0);
  return Buffer.from(JSON.stringify(req.body));
}

export async function processZiinaWebhookEvent(
  payload: ZiinaWebhookEvent,
  deps: ZiinaWebhookDeps
): Promise<{ received: true; updated?: boolean; ignored?: boolean }> {
  const eventName = payload.event;
  if (eventName !== "payment_intent.status.updated") {
    return { received: true, ignored: true };
  }

  const paymentIntentId = payload.id ?? payload.payment_intent_id;
  if (!paymentIntentId) {
    return { received: true, ignored: true };
  }

  const order = await deps.findOrderByPaymentIntentId(paymentIntentId);
  if (!order) {
    return { received: true, ignored: true };
  }

  const status = payload.status;
  if (status === "completed") {
    if (
      order.paymentStatus === "paid" ||
      order.status === "processing" ||
      order.status === "completed" ||
      order.status === "shipped"
    ) {
      return { received: true, updated: false, ignored: true };
    }
    await deps.updateOrderPayment?.(order.id, "paid");
    await deps.updateOrderStatus?.(order.id, "processing");
    order.paymentStatus = "paid";
    order.status = "processing";
    return { received: true, updated: true };
  }

  if (status === "failed" || status === "canceled") {
    if (order.status === "cancelled" || order.paymentStatus === "paid") {
      return { received: true, updated: false, ignored: true };
    }
    if (order.paymentStatus === "unpaid" && order.status === "pending") {
      await deps.updateOrderPayment?.(order.id, "unpaid");
      await deps.updateOrderStatus?.(order.id, "cancelled");
      await deps.releaseOrderStock?.(order.id);
      order.paymentStatus = "unpaid";
      order.status = "cancelled";
      return { received: true, updated: true };
    }
    return { received: true, updated: false, ignored: true };
  }

  return { received: true, ignored: true };
}
