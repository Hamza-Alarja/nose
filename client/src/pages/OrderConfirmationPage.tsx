import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Package } from "lucide-react";
import { useSearch, Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function OrderConfirmationPage() {
  const { t, isRTL, formatPrice } = useI18n();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const orderNumber = params.get("order") ?? "";

  const { data, isLoading } = trpc.orders.byNumber.useQuery(
    { orderNumber },
    { enabled: !!orderNumber }
  );

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: t.order_status_pending,
      processing: t.order_status_processing,
      shipped: t.order_status_shipped,
      completed: t.order_status_completed,
      cancelled: t.order_status_cancelled,
    };
    return map[s] ?? s;
  };

  const paymentState = data?.order
    ? (() => {
        const paymentStatus = String(data.order.paymentStatus ?? "unpaid");
        const orderStatus = String(data.order.status ?? "pending");
        if (paymentStatus === "paid") return "paid";
        if (paymentStatus === "refunded") return "refunded";
        if (
          orderStatus === "completed" ||
          orderStatus === "processing" ||
          orderStatus === "shipped"
        ) {
          return "paid";
        }
        if (orderStatus === "cancelled") return "cancelled";
        if (orderStatus === "failed") return "failed";
        if (orderStatus === "canceled") return "cancelled";
        return "pending";
      })()
    : "pending";

  const confirmationTitle = (() => {
    if (paymentState === "paid")
      return isRTL ? "تم تأكيد الطلب" : "Order Confirmed";
    if (paymentState === "failed")
      return isRTL ? "فشل الدفع" : "Payment Failed";
    if (paymentState === "cancelled")
      return isRTL ? "تم إلغاء الدفع" : "Payment Cancelled";
    return isRTL ? "الدفع قيد الانتظار" : "Payment Pending";
  })();

  const confirmationMessage = (() => {
    if (paymentState === "paid") {
      return isRTL ? "تم تأكيد الطلب بنجاح." : "Your order has been confirmed.";
    }
    if (paymentState === "failed") {
      return isRTL
        ? "فشل الدفع. يرجى المحاولة مرة أخرى."
        : "Payment failed. Please try again.";
    }
    if (paymentState === "cancelled") {
      return isRTL ? "تم إلغاء الدفع." : "Payment was cancelled.";
    }
    return isRTL
      ? "لم يتم تأكيد الدفع بعد. سيستمر التحديث عند استلام حالة Ziina."
      : "Payment confirmation is still being processed.";
  })();

  return (
    <div className="min-h-screen bg-[#FBF7F2] py-16">
      <div className="container max-w-lg">
        {isLoading ? (
          <div className="text-center py-20 animate-pulse">
            <div className="w-16 h-16 bg-[#EAE4DC] rounded-full mx-auto mb-4" />
            <div className="h-6 bg-[#EAE4DC] rounded w-1/2 mx-auto mb-2" />
            <div className="h-4 bg-[#EAE4DC] rounded w-3/4 mx-auto" />
          </div>
        ) : (
          <div className={`text-center ${isRTL ? "font-arabic" : ""}`}>
            <div className="flex justify-center mb-6">
              <CheckCircle2
                size={64}
                strokeWidth={1}
                className="text-[#A9C9A5]"
              />
            </div>
            <h1
              className={`font-heading text-3xl font-light text-[#2E2A25] mb-3 ${isRTL ? "font-arabic" : ""}`}
            >
              {confirmationTitle}
            </h1>
            <p
              className={`text-sm text-[#8A8078] mb-2 ${isRTL ? "font-arabic" : ""}`}
            >
              {confirmationMessage}
            </p>
            {orderNumber && (
              <p className="text-sm font-medium text-[#2E2A25] mb-8 ltr-num">
                {t.order_number}
                {orderNumber}
              </p>
            )}

            {data && (
              <div className="bg-white rounded-sm border border-[#EAE4DC] p-5 mb-6 text-left">
                <div
                  className={`flex items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <span
                    className={`text-xs font-medium text-[#8A8078] uppercase tracking-wide ${isRTL ? "font-arabic" : ""}`}
                  >
                    {t.order_items}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-sm bg-[#C9B8E8]/30 text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
                  >
                    {statusLabel(data.order.status)}
                  </span>
                </div>
                <ul className="space-y-3 mb-4">
                  {data.items.map(item => (
                    <li
                      key={item.id}
                      className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <div className="w-10 h-12 bg-[#F0EBE3] rounded-sm overflow-hidden flex-shrink-0">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#EAE4DC]" />
                        )}
                      </div>
                      <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
                        <p
                          className={`text-xs font-medium text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
                        >
                          {isRTL ? item.productNameAr : item.productNameEn}
                        </p>
                        {item.variant && (
                          <p className="text-xs text-[#8A8078]">
                            {item.variant}
                          </p>
                        )}
                        <p className="text-xs text-[#8A8078] ltr-num">
                          ×{item.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-medium ltr-num">
                        {formatPrice(
                          parseFloat(String(item.unitPrice)) * item.quantity
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-[#EAE4DC] pt-3 space-y-2">
                  {[
                    [t.checkout_subtotal, data.order.subtotalAmount],
                    [t.checkout_shipping, data.order.shippingAmount],
                    [t.checkout_discount, data.order.discountAmount],
                    [t.checkout_tax, data.order.taxAmount],
                  ].map(([label, amount]) => (
                    <div
                      key={label}
                      className={`flex justify-between text-sm ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <span className={isRTL ? "font-arabic" : ""}>
                        {label}
                      </span>
                      <span className="ltr-num">
                        {formatPrice(String(amount ?? "0.00"))}
                      </span>
                    </div>
                  ))}
                  <div
                    className={`flex justify-between text-sm font-medium pt-2 ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <span className={isRTL ? "font-arabic" : ""}>
                      {t.checkout_total}
                    </span>
                    <span className="ltr-num">
                      {formatPrice(String(data.order.totalAmount))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div
              className={`flex gap-3 justify-center ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <Link href="/shop">
                <Button
                  variant="outline"
                  className="border-[#2E2A25] text-[#2E2A25] rounded-sm"
                >
                  <span className={isRTL ? "font-arabic" : ""}>
                    {t.cart_continue}
                  </span>
                </Button>
              </Link>
              <Link href="/account">
                <Button className="bg-[#2E2A25] hover:bg-[#4A3F35] text-white rounded-sm">
                  <span className={isRTL ? "font-arabic" : ""}>
                    {t.order_history}
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
