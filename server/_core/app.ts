import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import { registerWebhooks } from "../webhooks.js";
import { protectAdminRoutes } from "./adminGuard.js";
import { registerUploadRoutes } from "./upload.js";

export function buildApp() {
  const app = express();

  app.use(
    express.json({
      limit: "2mb",
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    })
  );

  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());
  app.use(protectAdminRoutes);
  registerUploadRoutes(app);
  registerWebhooks(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}

export const app = buildApp();
