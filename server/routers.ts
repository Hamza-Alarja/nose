import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router } from "./_core/trpc.js";
import { productsRouter } from "./routers/products.js";
import { ordersRouter } from "./routers/orders.js";
import { adminAuthRouter } from "./routers/admin-auth.js";
import { customerAuthRouter } from "./routers/customer-auth.js";
import { discountCodesRouter } from "./routers/discount-codes.js";
import { storeSettingsRouter } from "./routers/store-settings.js";

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
