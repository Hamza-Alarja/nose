import { describe, expect, it, vi } from "vitest";
import {
  buildZiinaPaymentIntentRequest,
  buildZiinaRedirectUrls,
  convertAmountToFils,
  createDeterministicOperationId,
  extractZiinaRedirectUrl,
  processZiinaWebhookEvent,
} from "./_core/ziina";

describe("Ziina v2 payment intent helpers", () => {
  it("builds the official v2 payment intent request with the expected headers and body", () => {
    const req = buildZiinaPaymentIntentRequest({
      amountFils: 27500,
      currency: "AED",
      description: "Nose Order NOSE-123",
      orderNumber: "NOSE-123",
      baseUrl: "http://localhost:3001",
      apiKey: "test-key",
      isProduction: false,
    });

    expect(req.url).toBe("https://api-v2.ziina.com/api/payment_intent");
    expect(req.headers.Authorization).toBe("Bearer test-key");
    expect(req.headers["Content-Type"]).toBe("application/json");
    expect(req.body).toMatchObject({
      amount: 27500,
      currency_code: "AED",
      message: "Nose Order NOSE-123",
      allow_tips: false,
      test: true,
    });
    expect(req.body.success_url).toBe(
      "http://localhost:3001/order-confirmation?order=NOSE-123&payment=success"
    );
    expect(req.body.cancel_url).toBe(
      "http://localhost:3001/checkout?order=NOSE-123&payment=cancelled"
    );
    expect(req.body.failure_url).toBe(
      "http://localhost:3001/checkout?order=NOSE-123&payment=failed"
    );
    expect(req.body.operation_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("uses test mode in development and live mode in production", () => {
    expect(
      buildZiinaPaymentIntentRequest({
        amountFils: 100,
        currency: "AED",
        description: "test",
        orderNumber: "NOSE-1",
        baseUrl: "http://localhost:3001",
        apiKey: "key",
        isProduction: false,
      }).body.test
    ).toBe(true);

    expect(
      buildZiinaPaymentIntentRequest({
        amountFils: 100,
        currency: "AED",
        description: "test",
        orderNumber: "NOSE-2",
        baseUrl: "http://localhost:3001",
        apiKey: "key",
        isProduction: true,
      }).body.test
    ).toBe(false);
  });

  it("derives a stable operation_id for the same order number", () => {
    expect(createDeterministicOperationId("NOSE-100")).toBe(
      createDeterministicOperationId("NOSE-100")
    );
  });

  it("converts AED amounts to fils safely", () => {
    expect(convertAmountToFils("275.00")).toBe(27500);
    expect(convertAmountToFils("10.05")).toBe(1005);
  });

  it("builds separate success, cancel, and failure URLs", () => {
    expect(buildZiinaRedirectUrls("http://localhost:3001", "NOSE-100")).toEqual(
      {
        successUrl:
          "http://localhost:3001/order-confirmation?order=NOSE-100&payment=success",
        cancelUrl:
          "http://localhost:3001/checkout?order=NOSE-100&payment=cancelled",
        failureUrl:
          "http://localhost:3001/checkout?order=NOSE-100&payment=failed",
      }
    );
  });

  it("uses redirect_url as the hosted checkout URL and ignores success_url fallback", () => {
    expect(
      extractZiinaRedirectUrl({
        id: "pay_123",
        redirect_url: "https://hosted.example/checkout",
        success_url: "https://example.com/success",
        embedded_url: "https://example.com/embed",
      })
    ).toBe("https://hosted.example/checkout");

    expect(
      extractZiinaRedirectUrl({
        id: "pay_123",
        success_url: "https://example.com/success",
      })
    ).toBeNull();
  });
});

describe("Ziina webhook processing", () => {
  it("updates a completed payment once and ignores duplicate events", async () => {
    const updateOrderPayment = vi.fn().mockResolvedValue(undefined);
    const updateOrderStatus = vi.fn().mockResolvedValue(undefined);
    const order = { id: 42, paymentStatus: "unpaid", status: "pending" };
    const findOrderByPaymentIntentId = vi
      .fn()
      .mockImplementation(async () => order);

    const first = await processZiinaWebhookEvent(
      {
        event: "payment_intent.status.updated",
        status: "completed",
        id: "pay_123",
      },
      { findOrderByPaymentIntentId, updateOrderPayment, updateOrderStatus }
    );
    const second = await processZiinaWebhookEvent(
      {
        event: "payment_intent.status.updated",
        status: "completed",
        id: "pay_123",
      },
      { findOrderByPaymentIntentId, updateOrderPayment, updateOrderStatus }
    );

    expect(first).toMatchObject({ received: true, updated: true });
    expect(second).toMatchObject({
      received: true,
      updated: false,
      ignored: true,
    });
    expect(updateOrderPayment).toHaveBeenCalledTimes(1);
    expect(updateOrderStatus).toHaveBeenCalledTimes(1);
  });

  it("restores stock once for failed or canceled payments and ignores unknown intents safely", async () => {
    const releaseOrderStock = vi.fn().mockResolvedValue(true);
    const updateOrderPayment = vi.fn().mockResolvedValue(undefined);
    const updateOrderStatus = vi.fn().mockResolvedValue(undefined);
    const order = { id: 7, paymentStatus: "unpaid", status: "pending" };
    const findOrderByPaymentIntentId = vi
      .fn()
      .mockImplementation(async (paymentIntentId: string) => {
        if (paymentIntentId === "pay_unknown") return null;
        return order;
      });

    const first = await processZiinaWebhookEvent(
      {
        event: "payment_intent.status.updated",
        status: "failed",
        id: "pay_789",
      },
      {
        findOrderByPaymentIntentId,
        releaseOrderStock,
        updateOrderPayment,
        updateOrderStatus,
      }
    );
    const second = await processZiinaWebhookEvent(
      {
        event: "payment_intent.status.updated",
        status: "canceled",
        id: "pay_789",
      },
      {
        findOrderByPaymentIntentId,
        releaseOrderStock,
        updateOrderPayment,
        updateOrderStatus,
      }
    );
    const unknown = await processZiinaWebhookEvent(
      {
        event: "payment_intent.status.updated",
        status: "completed",
        id: "pay_unknown",
      },
      {
        findOrderByPaymentIntentId,
        releaseOrderStock,
        updateOrderPayment,
        updateOrderStatus,
      }
    );

    expect(first).toMatchObject({ received: true, updated: true });
    expect(second).toMatchObject({
      received: true,
      updated: false,
      ignored: true,
    });
    expect(unknown).toMatchObject({ received: true, ignored: true });
    expect(releaseOrderStock).toHaveBeenCalledTimes(1);
  });
});
