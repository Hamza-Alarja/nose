import { TRPCClientError } from "@trpc/client";
import { UNAUTHED_ERR_MSG } from "@shared/const";

export type AuthRedirectLocation = {
  pathname: string;
  search?: string;
};

const AUTH_ENTRY_PATHS = new Set([
  "/login",
  "/account/login",
  "/account/register",
]);

export function getUnauthorizedRedirectTarget(
  error: unknown,
  location: AuthRedirectLocation | null | undefined
) {
  if (!(error instanceof TRPCClientError)) return null;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
  if (!isUnauthorized) return null;

  const currentPath =
    location?.pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");
  const currentSearch =
    location?.search ??
    (typeof window !== "undefined" ? window.location.search : "");

  if (!currentPath || AUTH_ENTRY_PATHS.has(currentPath)) {
    return null;
  }

  const next = `${currentPath}${currentSearch}`;

  if (currentPath.startsWith("/admin")) {
    return `/login?next=${encodeURIComponent(next)}`;
  }

  return `/account/login?next=${encodeURIComponent(next)}`;
}
