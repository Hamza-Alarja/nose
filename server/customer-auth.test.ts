import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";

ENV.cookieSecret = "test-secret";
const CUSTOMER_COOKIE_NAME = "customer_session";

interface MockCustomer {
  id: number;
  openId: string;
  email: string;
  passwordHash: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  isActive?: boolean;
}

type DbCustomersMock = {
  findCustomerByEmail: (email: string) => Promise<MockCustomer | null>;
  createCustomer: (...args: unknown[]) => Promise<void>;
  verifyPassword: (password: string, hash: string) => boolean;
};

vi.mock("./db-customers", (): DbCustomersMock => ({
  findCustomerByEmail: vi.fn().mockResolvedValue(null),
  createCustomer: vi.fn().mockResolvedValue(undefined),
  verifyPassword: vi.fn().mockReturnValue(false),
  updateCustomerLastLogin: vi.fn().mockResolvedValue(undefined),
}));

const {
  findCustomerByEmail,
  createCustomer,
  verifyPassword,
  updateCustomerLastLogin,
} = vi.mocked(await import("./db-customers"));

function makePublicCtx(cookie?: Record<string, string>): TrpcContext {
  return {
    user: null,
    admin: null,
    customer: null,
    req: {
      protocol: "https",
      headers: { host: "localhost:3000" },
      cookies: cookie,
    } as any,
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any,
  };
}

async function buildToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(ENV.cookieSecret));
}

describe("customerAuth router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a new customer and sets a session cookie", async () => {
    const customer = {
      id: 1,
      openId: "alice@example.com",
      email: "alice@example.com",
      passwordHash: "salt:hash",
      firstName: "Alice",
      lastName: "Smith",
      role: "user",
    };

    vi.mocked(findCustomerByEmail)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(customer);

    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customerAuth.register({
      email: "alice@example.com",
      password: "password123",
      firstName: "Alice",
      lastName: "Smith",
      phone: "+971501234567",
    });

    expect(result).toEqual({ success: true, userId: 1 });
    expect(createCustomer).toHaveBeenCalledWith(
      "alice@example.com",
      "password123",
      "Alice",
      "Smith",
      "+971501234567"
    );
    expect(ctx.res.cookie).not.toHaveBeenCalled();
  });

  it("rejects customer registration when email is already in use", async () => {
    vi.mocked(findCustomerByEmail).mockResolvedValueOnce({
      id: 2,
      openId: "bob@example.com",
      email: "bob@example.com",
      passwordHash: "salt:hash",
      firstName: "Bob",
      lastName: "Jones",
      role: "user",
    });

    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.customerAuth.register({
        email: "bob@example.com",
        password: "password123",
      })
    ).rejects.toThrow("Email already in use");
  });

  it("logs in a customer with valid credentials", async () => {
    const customer = {
      id: 3,
      openId: "carol@example.com",
      email: "carol@example.com",
      passwordHash: "salt:hash",
      firstName: "Carol",
      lastName: "White",
      role: "user",
      isActive: true,
    };

    vi.mocked(findCustomerByEmail).mockResolvedValueOnce(customer);
    vi.mocked(verifyPassword).mockReturnValue(true);

    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customerAuth.login({
      email: "carol@example.com",
      password: "password123",
    });

    expect(result).toEqual({ success: true, userId: 3 });
    expect(ctx.res.cookie).toHaveBeenCalledWith(
      CUSTOMER_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      })
    );
  });

  it("rejects login with invalid credentials", async () => {
    vi.mocked(findCustomerByEmail).mockResolvedValueOnce(null);

    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.customerAuth.login({
        email: "dave@example.com",
        password: "password123",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("returns customer profile from a valid session token", async () => {
    const token = await buildToken({
      userId: 4,
      openId: "eve@example.com",
      email: "eve@example.com",
      firstName: "Eve",
      lastName: "Adams",
      role: "user",
    });

    const ctx = makePublicCtx({ [CUSTOMER_COOKIE_NAME]: token });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customerAuth.me();

    expect(result).toEqual({
      userId: 4,
      openId: "eve@example.com",
      email: "eve@example.com",
      firstName: "Eve",
      lastName: "Adams",
      name: "Eve Adams",
      role: "user",
    });
  });

  it("clears the customer session cookie on logout", async () => {
    const ctx = makePublicCtx();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customerAuth.logout();

    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalledWith(CUSTOMER_COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
  });
});
