import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { protectAdminRoutes } from "./adminGuard";

describe("protectAdminRoutes", () => {
  it("redirects unauthenticated admin requests to the login page", () => {
    const req = {
      path: "/admin",
      originalUrl: "/admin",
      cookies: {},
    } as unknown as Request;

    const res = {
      redirect: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    protectAdminRoutes(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(302, "/login?next=%2Fadmin");
    expect(next).not.toHaveBeenCalled();
  });
});
