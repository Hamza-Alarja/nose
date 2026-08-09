import express from "express";
import { createServer } from "http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerWebhooks } from "./webhooks";

describe("ziina webhooks", () => {
  const originalSecret = process.env.ZIINA_WEBHOOK_SECRET;
  let server: ReturnType<typeof createServer> | undefined;
  let port = 0;

  beforeAll(async () => {
    process.env.ZIINA_WEBHOOK_SECRET = "test-secret";

    const app = express();
    app.use(
      express.json({
        verify: (req, _res, buf) => {
          (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
        },
      })
    );
    registerWebhooks(app);

    server = createServer(app);
    await new Promise<void>(resolve => {
      server!.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();
    if (address && typeof address !== "string") {
      port = address.port;
    }
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close(err => (err ? reject(err) : resolve()));
      });
    }
    if (originalSecret === undefined) {
      delete process.env.ZIINA_WEBHOOK_SECRET;
    } else {
      process.env.ZIINA_WEBHOOK_SECRET = originalSecret;
    }
  });

  it("rejects requests without a valid signature", async () => {
    const response = await fetch(
      `http://127.0.0.1:${port}/api/webhooks/ziina`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-ziina-signature": "sha256=deadbeef",
        },
        body: JSON.stringify({ id: "pay_123", status: "paid" }),
      }
    );

    expect(response.status).toBe(401);
  });
});
