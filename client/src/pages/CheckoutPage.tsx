import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { getCheckoutSummaryAmounts } from "@shared/checkout";

const schema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(7),
  customerEmail: z.string().email().optional().or(z.literal("")),
  shippingAddress: z.string().min(5),
  city: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const { t, isRTL, formatPrice } = useI18n();
  const { items, subtotal, clearCart } = useCart();
  const { data: storeSettings } = trpc.storeSettings.get.useQuery(undefined);
  const estimatedShipping =
    storeSettings?.freeShippingEnabled &&
    subtotal >= Number(storeSettings.freeShippingThreshold ?? 0)
      ? 0
      : Number(storeSettings?.shippingFee ?? 0);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: string;
  } | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const couponValidation = trpc.discountCodes.validate.useQuery(
    {
      code: couponInput,
      items: items.map(item => ({
        productId: item.productId,
        variant: item.variant,
        quantity: item.quantity,
      })),
    },
    { enabled: false }
  );
  const { discount: estimatedDiscount, total: estimatedTotal } =
    getCheckoutSummaryAmounts({
      subtotal,
      shipping: estimatedShipping,
      discountAmount: appliedCoupon?.discountAmount,
    });
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: user?.name ?? "",
      customerEmail: user?.email ?? "",
    },
  });

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: data => {
      if (data.paymentUrl) {
        clearCart();
        window.location.assign(data.paymentUrl);
      } else {
        toast.error(t.error_generic);
      }
    },
    onError: err => {
      toast.error(err.message || t.error_generic);
    },
  });

  const onSubmit = (data: FormData) => {
    createOrder.mutate({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || undefined,
      shippingAddress: data.shippingAddress,
      city: data.city,
      notes: data.notes,
      items: items.map(i => ({
        productId: i.productId,
        variant: i.variant,
        quantity: i.quantity,
      })),
      couponCode: appliedCoupon?.code,
    });
  };

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponMessage("");
    const result = await couponValidation.refetch();
    if (result.data?.valid) {
      setAppliedCoupon({
        code: result.data.code,
        discountAmount: result.data.discountAmount,
      });
      setCouponMessage(isRTL ? "تم تطبيق رمز الخصم" : "Coupon applied");
    } else {
      setAppliedCoupon(null);
      const message = result.data?.message ?? "";
      setCouponMessage(
        isRTL
          ? message.includes("expired")
            ? "انتهت صلاحية رمز الخصم"
            : message.includes("Minimum")
              ? `الحد الأدنى للطلب هو AED ${result.data?.subtotal ?? ""}`
              : "رمز الخصم غير صالح"
          : message || "Invalid coupon code"
      );
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FBF7F2] flex flex-col items-center justify-center gap-4">
        <ShoppingBag size={48} strokeWidth={1} className="text-[#8A8078]" />
        <p className={`text-[#8A8078] ${isRTL ? "font-arabic" : ""}`}>
          {t.cart_empty}
        </p>
        <Link href="/shop">
          <Button className="bg-[#2E2A25] hover:bg-[#4A3F35] text-white rounded-sm">
            {t.cart_continue}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF7F2] py-10">
      <div className="container max-w-4xl">
        <h1
          className={`font-heading text-3xl font-light text-[#2E2A25] mb-8 ${isRTL ? "font-arabic text-right" : ""}`}
        >
          {t.checkout_title}
        </h1>

        <div
          className={`grid grid-cols-1 lg:grid-cols-5 gap-8 ${isRTL ? "lg:flex lg:flex-row-reverse" : ""}`}
        >
          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${isRTL ? "text-right" : ""}`}
              >
                {/* Name */}
                <div>
                  <label
                    className={`block text-xs font-medium text-[#2E2A25] mb-1 ${isRTL ? "font-arabic" : ""}`}
                  >
                    {t.checkout_name} *
                  </label>
                  <input
                    {...register("customerName")}
                    className={`w-full px-3 py-2 text-sm border rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B76B8] ${errors.customerName ? "border-red-400" : "border-[#EAE4DC]"} ${isRTL ? "text-right" : ""}`}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                  {errors.customerName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.customerName.message}
                    </p>
                  )}
                </div>
                {/* Phone */}
                <div>
                  <label
                    className={`block text-xs font-medium text-[#2E2A25] mb-1 ${isRTL ? "font-arabic" : ""}`}
                  >
                    {t.checkout_phone} *
                  </label>
                  <input
                    {...register("customerPhone")}
                    type="tel"
                    className={`w-full px-3 py-2 text-sm border rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B76B8] ${errors.customerPhone ? "border-red-400" : "border-[#EAE4DC]"}`}
                    dir="ltr"
                  />
                  {errors.customerPhone && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.customerPhone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className={isRTL ? "text-right" : ""}>
                <label
                  className={`block text-xs font-medium text-[#2E2A25] mb-1 ${isRTL ? "font-arabic" : ""}`}
                >
                  {t.checkout_email}
                </label>
                <input
                  {...register("customerEmail")}
                  type="email"
                  className="w-full px-3 py-2 text-sm border border-[#EAE4DC] rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B76B8]"
                  dir="ltr"
                />
              </div>

              {/* Address */}
              <div className={isRTL ? "text-right" : ""}>
                <label
                  className={`block text-xs font-medium text-[#2E2A25] mb-1 ${isRTL ? "font-arabic" : ""}`}
                >
                  {t.checkout_address} *
                </label>
                <textarea
                  {...register("shippingAddress")}
                  rows={3}
                  className={`w-full px-3 py-2 text-sm border rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B76B8] resize-none ${errors.shippingAddress ? "border-red-400" : "border-[#EAE4DC]"} ${isRTL ? "text-right" : ""}`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
                {errors.shippingAddress && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.shippingAddress.message}
                  </p>
                )}
              </div>

              {/* City */}
              <div className={isRTL ? "text-right" : ""}>
                <label
                  className={`block text-xs font-medium text-[#2E2A25] mb-1 ${isRTL ? "font-arabic" : ""}`}
                >
                  {t.checkout_city}
                </label>
                <input
                  {...register("city")}
                  className={`w-full px-3 py-2 text-sm border border-[#EAE4DC] rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B76B8] ${isRTL ? "text-right" : ""}`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              {/* Notes */}
              <div className={isRTL ? "text-right" : ""}>
                <label
                  className={`block text-xs font-medium text-[#2E2A25] mb-1 ${isRTL ? "font-arabic" : ""}`}
                >
                  {t.checkout_notes}
                </label>
                <textarea
                  {...register("notes")}
                  rows={2}
                  className={`w-full px-3 py-2 text-sm border border-[#EAE4DC] rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B76B8] resize-none ${isRTL ? "text-right" : ""}`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <Button
                type="submit"
                disabled={createOrder.isPending}
                className={`w-full py-3 bg-[#2E2A25] hover:bg-[#4A3F35] text-white rounded-sm text-sm font-medium tracking-wide ${isRTL ? "font-arabic" : ""}`}
              >
                {createOrder.isPending ? t.loading : t.checkout_place_order}
              </Button>

              <p
                className={`text-xs text-[#8A8078] text-center ${isRTL ? "font-arabic" : ""}`}
              >
                {isRTL
                  ? "ستُحوَّل إلى بوابة Ziina الآمنة للدفع"
                  : "You will be redirected to Ziina's secure payment gateway"}
              </p>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-sm border border-[#EAE4DC] p-5 sticky top-24">
              <h2
                className={`font-heading text-lg font-light text-[#2E2A25] mb-4 ${isRTL ? "font-arabic text-right" : ""}`}
              >
                {t.checkout_order_summary}
              </h2>
              <ul className="space-y-3 mb-4">
                {items.map(item => (
                  <li
                    key={`${item.productId}:${item.variant}`}
                    className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <div className="w-12 h-14 bg-[#F0EBE3] rounded-sm overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#C9B8E8]/20 to-[#A9C9A5]/20" />
                      )}
                    </div>
                    <div
                      className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}
                    >
                      <p
                        className={`text-xs font-medium text-[#2E2A25] truncate ${isRTL ? "font-arabic" : ""}`}
                      >
                        {isRTL ? item.nameAr : item.nameEn}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-[#8A8078]">{item.variant}</p>
                      )}
                      <p className="text-xs text-[#8A8078] ltr-num">
                        ×{item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[#2E2A25] ltr-num">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mb-4 flex gap-2">
                <input
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  placeholder={isRTL ? "رمز الخصم" : "Coupon code"}
                  className="min-w-0 flex-1 rounded-sm border border-[#EAE4DC] px-3 py-2 text-sm"
                  dir="ltr"
                />
                {appliedCoupon ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponInput("");
                      setCouponMessage("");
                    }}
                  >
                    {isRTL ? "إزالة" : "Remove"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponValidation.isFetching}
                  >
                    {isRTL ? "تطبيق" : "Apply"}
                  </Button>
                )}
              </div>
              {couponMessage && (
                <p
                  className={`mb-3 text-xs ${appliedCoupon ? "text-green-700" : "text-red-600"} ${isRTL ? "font-arabic text-right" : ""}`}
                >
                  {couponMessage}
                </p>
              )}
              <div className="border-t border-[#EAE4DC] pt-3 space-y-2">
                {[
                  [t.checkout_subtotal, subtotal],
                  [t.checkout_shipping, estimatedShipping],
                  [t.checkout_discount, estimatedDiscount],
                  [t.checkout_tax, 0],
                ].map(([label, amount]) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <span
                      className={`text-sm text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
                    >
                      {label}
                    </span>
                    <span className="text-sm text-[#2E2A25] ltr-num">
                      {formatPrice(amount as number)}
                    </span>
                  </div>
                ))}
                <div
                  className={`flex items-center justify-between pt-2 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <span
                    className={`text-sm font-medium text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
                  >
                    {t.checkout_total}
                  </span>
                  <span className="text-lg font-medium text-[#2E2A25] ltr-num">
                    {formatPrice(estimatedTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
