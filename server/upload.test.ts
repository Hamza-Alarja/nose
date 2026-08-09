import express from "express";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createServer } from "node:http";

const { verifyAdminSession, storagePut } = vi.hoisted(() => ({
  verifyAdminSession: vi.fn(),
  storagePut: vi.fn(),
}));

vi.mock("./_core/adminGuard", () => ({ verifyAdminSession }));
vi.mock("./storage", () => ({ storagePut }));

import { registerUploadRoutes } from "./_core/upload";

function formFile(bytes: Uint8Array, type: string, name: string) {
  const form = new FormData();
  form.append("file", new Blob([bytes], { type }), name);
  return form;
}

describe("product image upload", () => {
  let server: ReturnType<typeof createServer>;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    registerUploadRoutes(app);
    server = createServer(app);
    await new Promise<void>(resolve => {
      server.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("No test port");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  beforeEach(() => {
    verifyAdminSession.mockReset();
    storagePut.mockReset();
    verifyAdminSession.mockResolvedValue(true);
    storagePut.mockResolvedValue({
      key: "products/test.jpg",
      url: "https://cdn.example.com/products/test.jpg",
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  });

  it("rejects unauthenticated uploads before parsing the file", async () => {
    verifyAdminSession.mockResolvedValue(false);
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: formFile(new Uint8Array([0xff, 0xd8, 0xff]), "image/jpeg", "x.jpg"),
    });

    expect(response.status).toBe(403);
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("accepts a valid JPEG and returns only its public URL", async () => {
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: formFile(
        new Uint8Array([0xff, 0xd8, 0xff]),
        "image/jpeg",
        "test.jpg"
      ),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: "https://cdn.example.com/products/test.jpg",
    });
    expect(storagePut).toHaveBeenCalledWith(
      expect.stringMatching(/^products\/[0-9a-f-]+\.jpg$/),
      expect.any(Buffer),
      "image/jpeg"
    );
  });

  it.each([
    [
      "image/png",
      "png",
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ],
    [
      "image/webp",
      "webp",
      new Uint8Array([
        0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
      ]),
    ],
  ])("accepts %s images", async (type, extension, bytes) => {
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: formFile(bytes, type, `test.${extension}`),
    });
    expect(response.status).toBe(200);
  });

  it("rejects HTML and invalid image signatures", async () => {
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: formFile(
        new TextEncoder().encode("<script>alert(1)</script>"),
        "text/html",
        "x.html"
      ),
    });
    expect(response.status).toBe(400);
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("rejects executable extensions even when the MIME type is spoofed", async () => {
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: formFile(
        new Uint8Array([0xff, 0xd8, 0xff]),
        "image/jpeg",
        "payload.exe"
      ),
    });
    expect(response.status).toBe(400);
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("rejects oversized images", async () => {
    const bytes = new Uint8Array(5 * 1024 * 1024 + 1);
    bytes.set([0xff, 0xd8, 0xff]);
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: formFile(bytes, "image/jpeg", "large.jpg"),
    });
    expect(response.status).toBe(413);
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("rejects multiple files and missing files", async () => {
    const form = formFile(
      new Uint8Array([0xff, 0xd8, 0xff]),
      "image/jpeg",
      "one.jpg"
    );
    form.append(
      "file",
      new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" }),
      "two.jpg"
    );
    const multiple = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: form,
    });
    expect(multiple.status).toBe(400);

    const missing = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: new FormData(),
    });
    expect(missing.status).toBe(400);
  });

  it("returns a safe error when R2 upload fails", async () => {
    storagePut.mockRejectedValue(new Error("secret internal detail"));
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: formFile(
        new Uint8Array([0xff, 0xd8, 0xff]),
        "image/jpeg",
        "test.jpg"
      ),
    });
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "upload_storage_failed",
      message: "upload_storage_failed",
    });
  });
});
