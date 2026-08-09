import { describe, expect, it } from "vitest";
import { getCheckoutSummaryAmounts } from "@/lib/checkout";

describe("checkout summary amounts", () => {
  it("uses the server discount amount for the discount row and total", () => {
    const { discount, total } = getCheckoutSummaryAmounts({
      subtotal: 250,
      shipping: 0,
      discountAmount: "25.00",
    });

    expect(discount).toBe(25);
    expect(total).toBe(225);
  });

  it("uses discountAmountFils when returned by the server", () => {
    const { discount, total } = getCheckoutSummaryAmounts({
      subtotal: 250,
      shipping: 0,
      discountAmountFils: "2500",
    });

    expect(discount).toBe(25);
    expect(total).toBe(225);
  });

  it("returns zero discount and original total when coupon is removed", () => {
    const { discount, total } = getCheckoutSummaryAmounts({
      subtotal: 250,
      shipping: 0,
      discountAmount: null,
    });

    expect(discount).toBe(0);
    expect(total).toBe(250);
  });
});
