import type { Express, Request } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import {
  releaseOrderStock,
  updateOrderPayment,
  updateOrderStatus,
} from "./db-products";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getRawBodyBuffer, processZiinaWebhookEvent } from "./_core/ziina";

function verifyZiinaSignature(req: Request): boolean {
  const signatureHeader = [
    req.get("x-ziina-signature"),
    req.get("x-ziina-signature-sha256"),
    req.get("x-ziina-signature-v1"),
  ].find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0
  );
  const secret =
    process.env.ZIINA_WEBHOOK_SECRET ??
    process.env.ZIINA_WEBHOOK_SIGNING_SECRET;

  if (!signatureHeader || !secret) {
    return false;
  }

  const signature = signatureHeader.trim();
  const actual = signature.replace(/^sha256=/i, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/i.test(actual)) {
    return false;
  }

  const payload = getRawBodyBuffer(req);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function registerWebhooks(app: Express) {
  // Ziina payment webhook
  app.post("/api/webhooks/ziina", async (req, res) => {
    try {
      if (!verifyZiinaSignature(req)) {
        return res
          .status(401)
          .json({ error: "Unauthorized webhook signature" });
      }

      const body = req.body;
      const result = await processZiinaWebhookEvent(
        {
          event: body?.event,
          status: body?.status ?? body?.payment_status,
          id: body?.id ?? body?.payment_intent_id,
          payment_intent_id: body?.payment_intent_id,
        },
        {
          async findOrderByPaymentIntentId(paymentIntentId) {
            const db = await getDb();
            if (!db) return null;
            const rows = await db
              .select()
              .from(orders)
              .where(eq(orders.paymentLinkId, String(paymentIntentId)))
              .limit(1);
            return rows[0] ?? null;
          },
          async updateOrderPayment(orderId, paymentStatus) {
            await updateOrderPayment(orderId, paymentStatus);
          },
          async updateOrderStatus(orderId, status) {
            await updateOrderStatus(orderId, status);
          },
          async releaseOrderStock(orderId) {
            await releaseOrderStock(orderId);
          },
        }
      );

      res.json(result);
    } catch (err) {
      console.error("[Ziina Webhook] Error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });
}
