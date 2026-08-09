export function parseMonetaryValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getCheckoutSummaryAmounts(params: {
  subtotal: number;
  shipping: number;
  discountAmount?: string | number | null;
  discountAmountFils?: string | number | null;
}) {
  const { subtotal, shipping, discountAmount, discountAmountFils } = params;
  const discount = discountAmountFils
    ? parseMonetaryValue(discountAmountFils) / 100
    : parseMonetaryValue(discountAmount);
  return {
    discount,
    total: Math.max(0, subtotal + shipping - discount),
  };
}
