import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "../_core/env";
import {
  createCustomer,
  findCustomerByEmail,
  updateCustomerLastLogin,
  verifyPassword,
} from "../db-customers";

const CUSTOMER_COOKIE_NAME = "customer_session";
const JWT_EXPIRY = "7d";

function buildCustomerName(
  firstName?: string | null,
  lastName?: string | null
) {
  const nameParts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  return nameParts.join(" ");
}

export const customerAuthRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const normalizedEmail = input.email.trim().toLowerCase();
      const existingCustomer = await findCustomerByEmail(normalizedEmail);

      if (existingCustomer) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email already in use",
        });
      }

      await createCustomer(
        normalizedEmail,
        input.password,
        input.firstName,
        input.lastName,
        input.phone
      );

      const customer = await findCustomerByEmail(normalizedEmail);
      if (!customer) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create customer account",
        });
      }

      return { success: true, userId: customer.id } as const;
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const normalizedEmail = input.email.trim().toLowerCase();
      const customer = await findCustomerByEmail(normalizedEmail);

      const hasValidCredentials =
        customer?.passwordHash &&
        verifyPassword(input.password, customer.passwordHash);

      if (!customer || !hasValidCredentials) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      if (customer.isActive === false) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Customer account is inactive",
        });
      }

      await updateCustomerLastLogin(customer.id);

      const token = await new SignJWT({
        userId: customer.id,
        openId: customer.openId,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        role: customer.role,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(JWT_EXPIRY)
        .sign(new TextEncoder().encode(ENV.cookieSecret));

      ctx.res.cookie(CUSTOMER_COOKIE_NAME, token, {
        httpOnly: true,
        secure: ctx.req.protocol === "https",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      return { success: true, userId: customer.id } as const;
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(CUSTOMER_COOKIE_NAME, {
      httpOnly: true,
      secure: ctx.req.protocol === "https",
      sameSite: "lax",
      path: "/",
    });
    return { success: true } as const;
  }),

  me: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.req.cookies?.[CUSTOMER_COOKIE_NAME];
    if (!token) return null;

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(ENV.cookieSecret)
      );

      return {
        userId: payload.userId,
        openId: payload.openId as string,
        email: payload.email as string,
        firstName: payload.firstName as string | undefined,
        lastName: payload.lastName as string | undefined,
        phone: payload.phone as string | undefined,
        name: buildCustomerName(
          payload.firstName as string | null,
          payload.lastName as string | null
        ),
        role: payload.role as string,
      };
    } catch {
      return null;
    }
  }),
});
