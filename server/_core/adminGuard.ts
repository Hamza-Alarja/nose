import type { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";
import { ENV } from "./env.js";

export async function verifyAdminSession(req: Request): Promise<boolean> {
  const token = req.cookies?.admin_session;
  if (!token || !ENV.cookieSecret) return false;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(ENV.cookieSecret)
    );
    return Boolean(payload.adminId && payload.email);
  } catch {
    return false;
  }
}

export function protectAdminRoutes(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const pathname = req.path || "";
  if (!pathname.startsWith("/admin") || pathname === "/login") {
    return next();
  }

  if (!req.cookies?.admin_session) {
    return res.redirect(
      302,
      `/login?next=${encodeURIComponent(req.originalUrl)}`
    );
  }

  verifyAdminSession(req).then(isAdmin => {
    if (isAdmin) return next();
    return res.redirect(
      302,
      `/login?next=${encodeURIComponent(req.originalUrl)}`
    );
  });
}
