import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc.js";
import {
  getAdminByEmail,
  verifyPassword,
  updateAdminLastLogin,
} from "../db-admin.js";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "../_core/env.js";

const ADMIN_COOKIE_NAME = "admin_session";
const JWT_EXPIRY = "7d";

export const adminAuthRouter = router({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const normalizedEmail = input.email.trim().toLowerCase();
      const admin = await getAdminByEmail(normalizedEmail);
      const adminFound = Boolean(admin);
      const adminActive = admin?.isActive === true;

      if (!admin) {
        console.info("[Admin login diagnostic]", {
          normalizedEmail,
          adminFound: false,
          adminActive: false,
          passwordCompare: false,
        });
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Admin record not found for this email",
        });
      }

      let passwordCompare = false;
      try {
        passwordCompare = verifyPassword(input.password, admin.passwordHash);
      } catch {
        passwordCompare = false;
      }

      console.info("[Admin login diagnostic]", {
        normalizedEmail,
        adminFound,
        adminActive,
        passwordCompare,
      });

      if (!passwordCompare) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            "Password verification failed: expected a scrypt salt:hash credential",
        });
      }
      if (!admin.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin account is inactive",
        });
      }

      // Update last login
      await updateAdminLastLogin(admin.id);

      // Create JWT token
      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const token = await new SignJWT({
        adminId: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        preferredLanguage: admin.preferredLanguage,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(JWT_EXPIRY)
        .sign(secret);

      // Set secure cookie
      ctx.res.cookie(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: ctx.req.protocol === "https",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      return { success: true, adminId: admin.id };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(ADMIN_COOKIE_NAME, {
      httpOnly: true,
      secure: ctx.req.protocol === "https",
      sameSite: "lax",
      path: "/",
    });
    return { success: true };
  }),

  me: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.req.cookies?.[ADMIN_COOKIE_NAME];
    if (!token) return null;

    try {
      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const { payload } = await jwtVerify(token, secret);
      return {
        adminId: payload.adminId,
        email: payload.email as string,
        fullName: payload.fullName as string,
        preferredLanguage: payload.preferredLanguage as string,
      };
    } catch {
      return null;
    }
  }),
});
