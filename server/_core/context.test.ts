import { describe, expect, it, beforeEach } from "vitest";
import { createContext } from "./context";
import { SignJWT } from "jose";
import { ENV } from "./env";

const ADMIN_COOKIE_NAME = "admin_session";
const CUSTOMER_COOKIE_NAME = "customer_session";

beforeEach(() => {
  ENV.cookieSecret = "test-secret";
});

async function buildToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(ENV.cookieSecret));
}

describe("createContext", () => {
  it("populates only admin context when only admin_session exists", async () => {
    const adminToken = await buildToken({
      adminId: 1,
      email: "admin@example.com",
      fullName: "Admin User",
    });

    const ctx = await createContext({
      req: {
        protocol: "https",
        headers: { host: "localhost:3000" },
        cookies: { [ADMIN_COOKIE_NAME]: adminToken },
      } as any,
      res: {} as any,
    });

    expect(ctx.admin).toEqual(
      expect.objectContaining({ id: 1, email: "admin@example.com" })
    );
    expect(ctx.customer).toBeNull();
    expect(ctx.user).toEqual(ctx.admin);
  });

  it("populates only customer context when only customer_session exists", async () => {
    const customerToken = await buildToken({
      userId: 2,
      openId: "customer@example.com",
      email: "customer@example.com",
      firstName: "Customer",
      lastName: "Example",
      role: "user",
    });

    const ctx = await createContext({
      req: {
        protocol: "https",
        headers: { host: "localhost:3000" },
        cookies: { [CUSTOMER_COOKIE_NAME]: customerToken },
      } as any,
      res: {} as any,
    });

    expect(ctx.admin).toBeNull();
    expect(ctx.customer).toEqual(
      expect.objectContaining({ id: 2, email: "customer@example.com" })
    );
    expect(ctx.user).toEqual(ctx.customer);
  });

  it("populates both admin and customer context when both sessions exist", async () => {
    const adminToken = await buildToken({
      adminId: 1,
      email: "admin@example.com",
      fullName: "Admin User",
    });
    const customerToken = await buildToken({
      userId: 2,
      openId: "customer@example.com",
      email: "customer@example.com",
      firstName: "Customer",
      lastName: "Example",
      role: "user",
    });

    const ctx = await createContext({
      req: {
        protocol: "https",
        headers: { host: "localhost:3000" },
        cookies: {
          [ADMIN_COOKIE_NAME]: adminToken,
          [CUSTOMER_COOKIE_NAME]: customerToken,
        },
      } as any,
      res: {} as any,
    });

    expect(ctx.admin).toEqual(
      expect.objectContaining({ id: 1, email: "admin@example.com" })
    );
    expect(ctx.customer).toEqual(
      expect.objectContaining({ id: 2, email: "customer@example.com" })
    );
    expect(ctx.user).toEqual(ctx.admin);
  });

  it("ignores invalid admin and still populates valid customer context", async () => {
    const customerToken = await buildToken({
      userId: 2,
      openId: "customer@example.com",
      email: "customer@example.com",
      firstName: "Customer",
      lastName: "Example",
      role: "user",
    });

    const ctx = await createContext({
      req: {
        protocol: "https",
        headers: { host: "localhost:3000" },
        cookies: {
          [ADMIN_COOKIE_NAME]: "invalid-token",
          [CUSTOMER_COOKIE_NAME]: customerToken,
        },
      } as any,
      res: {} as any,
    });

    expect(ctx.admin).toBeNull();
    expect(ctx.customer).toEqual(
      expect.objectContaining({ id: 2, email: "customer@example.com" })
    );
    expect(ctx.user).toEqual(ctx.customer);
  });

  it("keeps valid admin context when customer session is invalid", async () => {
    const adminToken = await buildToken({
      adminId: 1,
      email: "admin@example.com",
      fullName: "Admin User",
    });

    const ctx = await createContext({
      req: {
        protocol: "https",
        headers: { host: "localhost:3000" },
        cookies: {
          [ADMIN_COOKIE_NAME]: adminToken,
          [CUSTOMER_COOKIE_NAME]: "invalid-token",
        },
      } as any,
      res: {} as any,
    });

    expect(ctx.admin).toEqual(
      expect.objectContaining({ id: 1, email: "admin@example.com" })
    );
    expect(ctx.customer).toBeNull();
    expect(ctx.user).toEqual(ctx.admin);
  });
});
