import { describe, expect, it } from "vitest";
import { TRPCClientError } from "@trpc/client";
import { UNAUTHED_ERR_MSG } from "../shared/const";
import { getUnauthorizedRedirectTarget } from "../client/src/lib/authRedirect";

describe("getUnauthorizedRedirectTarget", () => {
  const createError = () =>
    new TRPCClientError(UNAUTHED_ERR_MSG, {
      result: {
        error: {
          message: UNAUTHED_ERR_MSG,
          data: { code: "UNAUTHORIZED" },
        },
      },
    });

  it("redirects customer routes to the customer login page", () => {
    const error = createError();

    expect(
      getUnauthorizedRedirectTarget(error, {
        pathname: "/account/orders",
        search: "",
      })
    ).toBe("/account/login?next=%2Faccount%2Forders");
  });

  it("redirects admin routes to the admin login page", () => {
    const error = createError();

    expect(
      getUnauthorizedRedirectTarget(error, {
        pathname: "/admin/orders",
        search: "",
      })
    ).toBe("/login?next=%2Fadmin%2Forders");
  });

  it("does not redirect from auth entry pages", () => {
    const error = createError();

    expect(
      getUnauthorizedRedirectTarget(error, {
        pathname: "/account/login",
        search: "",
      })
    ).toBeNull();
    expect(
      getUnauthorizedRedirectTarget(error, { pathname: "/login", search: "" })
    ).toBeNull();
    expect(
      getUnauthorizedRedirectTarget(error, {
        pathname: "/account/register",
        search: "",
      })
    ).toBeNull();
  });
});
