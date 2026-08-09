import { describe, expect, it } from "vitest";
import { calculateDiscountFils, normalizeDiscountCode } from "./db-discounts";

describe("discount codes", () => {
  it("normalizes codes case-insensitively", () => {
    expect(normalizeDiscountCode("  nose10 ")).toBe("NOSE10");
  });

  it("calculates percentage discounts and caps them", () => {
    expect(
      calculateDiscountFils({
        type: "percentage",
        value: 10,
        subtotalFils: 50000,
      })
    ).toBe(5000);
    expect(
      calculateDiscountFils({
        type: "percentage",
        value: 50,
        subtotalFils: 50000,
        maximumDiscountFils: 1000,
      })
    ).toBe(1000);
  });

  it("calculates fixed discounts without exceeding subtotal", () => {
    expect(
      calculateDiscountFils({ type: "fixed", value: 25, subtotalFils: 50000 })
    ).toBe(2500);
    expect(
      calculateDiscountFils({ type: "fixed", value: 999, subtotalFils: 5000 })
    ).toBe(5000);
  });
});
