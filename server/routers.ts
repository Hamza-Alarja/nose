import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { productsRouter } from "./routers/products";
import { ordersRouter } from "./routers/orders";
import { adminAuthRouter } from "./routers/admin-auth";
import { customerAuthRouter } from "./routers/customer-auth";
import { discountCodesRouter } from "./routers/discount-codes";
import { storeSettingsRouter } from "./routers/store-settings";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  customerAuth: customerAuthRouter,
  products: productsRouter,
  orders: ordersRouter,
  adminAuth: adminAuthRouter,
  discountCodes: discountCodesRouter,
  storeSettings: storeSettingsRouter,
});

export type AppRouter = typeof appRouter;
