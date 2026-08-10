import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { jwtVerify } from "jose";
import type { User } from "../../drizzle/schema.js";
import { ENV } from "./env.js";

const ADMIN_COOKIE_NAME = "admin_session";
const CUSTOMER_COOKIE_NAME = "customer_session";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  admin: User | null;
  customer: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let admin: User | null = null;
  let customer: User | null = null;

  try {
    const adminToken = opts.req.cookies?.[ADMIN_COOKIE_NAME];
    if (adminToken) {
      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const { payload } = await jwtVerify(adminToken, secret);
      if (payload.adminId && payload.email) {
        admin = {
          id: Number(payload.adminId),
          openId: String(payload.email),
          email: String(payload.email),
          name: String(payload.fullName ?? ""),
          loginMethod: "admin",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        } as unknown as User;
        user = admin;
      }
    }
  } catch {
    admin = null;
    user = null;
  }

  try {
    const customerToken = opts.req.cookies?.[CUSTOMER_COOKIE_NAME];
    if (customerToken) {
      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const { payload } = await jwtVerify(customerToken, secret);
      if (payload.userId && payload.email) {
        customer = {
          id: Number(payload.userId),
          openId: String(payload.openId ?? payload.email),
          email: String(payload.email),
          name:
            String(payload.firstName ?? "") +
            (payload.lastName ? ` ${String(payload.lastName)}` : ""),
          loginMethod: "password",
          role: String(payload.role ?? "user"),
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        } as unknown as User;
        if (!user) {
          user = customer;
        }
      }
    }
  } catch {
    customer = null;
    if (!admin) user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    admin,
    customer,
  };
}
