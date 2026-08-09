import { useMemo } from "react";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Package,
  Truck,
  XCircle,
} from "lucide-react";

const statusSteps = [
  { key: "pending", label: "Order received" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "completed", label: "Delivered" },
];

export default function CustomerOrderDetailsPage() {
  const { t, isRTL, formatPrice } = useI18n();
  const [, params] = useRoute("/account/orders/:orderNumber");
  const orderNumber = params?.orderNumber ?? "";

  const { data, isLoading, isError } = trpc.orders.myOrderDetail.useQuery(
    { orderNumber },
    { enabled: !!orderNumber }
  );

  const orderStatus = data?.order.status ?? "pending";

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: t.order_status_pending,
      processing: t.order_status_processing,
      shipped: t.order_status_shipped,
      completed: t.order_status_completed,
      cancelled: t.order_status_cancelled,
    };
    return map[status] ?? status;
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-[#E8B8A0]/30 text-[#2E2A25]",
      processing: "bg-[#C9B8E8]/30 text-[#2E2A25]",
      shipped: "bg-[#A9C9A5]/30 text-[#2E2A25]",
      completed: "bg-[#A9C9A5]/50 text-[#2E2A25]",
      cancelled: "bg-red-100 text-red-600",
    };
    return map[status] ?? "bg-[#EAE4DC] text-[#8A8078]";
  };

  const trackingSteps = useMemo(() => {
    if (orderStatus === "cancelled") {
      return [
        { label: t.tracking_order_cancelled, active: true, completed: true },
      ];
    }

    return statusSteps.map(step => {
      const active = step.key === orderStatus;
      const completed =
        statusSteps.findIndex(s => s.key === step.key) <
        statusSteps.findIndex(s => s.key === orderStatus);
      return {
        label:
          step.key === "pending"
            ? t.tracking_received
            : step.key === "processing"
              ? t.tracking_processing
              : step.key === "shipped"
                ? t.tracking_shipped
                : t.tracking_delivered,
        active,
        completed,
      };
    });
  }, [orderStatus, t]);

  return (
    <div className="min-h-screen bg-[#FBF7F2] py-10">
      <div className="container max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/account">
            <Button
              variant="outline"
              size="sm"
              className="border-[#2E2A25] text-[#2E2A25] rounded-sm"
            >
              <ArrowLeft size={16} className="me-2" />
              {t.back_to_orders}
            </Button>
          </Link>
          <div className={isRTL ? "text-right" : ""}>
            <p className="text-sm text-[#8A8078]">{t.order_number}</p>
            <h1
              className={`font-heading text-3xl font-light text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
            >
              {orderNumber}
            </h1>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            <div className="rounded-sm border border-[#EAE4DC] bg-white p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p
                    className={`text-sm text-[#8A8078] ${isRTL ? "font-arabic" : ""}`}
                  >
                    {t.order_status}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-sm px-3 py-1 text-xs font-medium ${statusColor(orderStatus)} ${isRTL ? "font-arabic" : ""}`}
                  >
                    {statusLabel(orderStatus)}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-[#2E2A25] ltr-num">
                  <p>
                    <span className="font-medium">{t.order_date}: </span>
                    {data
                      ? new Date(data.order.createdAt).toLocaleDateString()
                      : "—"}
                  </p>
                  <p>
                    <span className="font-medium">{t.order_total}: </span>
                    {data ? formatPrice(String(data.order.totalAmount)) : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-[#EAE4DC] bg-white p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[#2E2A25]">
                <ClipboardList size={16} />
                <span className={isRTL ? "font-arabic" : ""}>
                  {t.order_details}
                </span>
              </div>
              {!data ? (
                <div className="space-y-3">
                  <div className="h-6 rounded-sm bg-[#EAE4DC] animate-pulse" />
                  <div className="h-6 rounded-sm bg-[#EAE4DC] animate-pulse" />
                  <div className="h-6 rounded-sm bg-[#EAE4DC] animate-pulse" />
                </div>
              ) : (
                <div className="space-y-3 text-sm text-[#2E2A25]">
                  <div>
                    <p className="font-medium text-[#2E2A25]">
                      {t.shipping_address}
                    </p>
                    <p>{data.order.shippingAddress}</p>
                    {data.order.city ? <p>{data.order.city}</p> : null}
                  </div>
                  <div>
                    <p className="font-medium text-[#2E2A25]">
                      {t.payment_paid}
                    </p>
                    <p>{data.order.paymentStatus}</p>
                  </div>
                  {data.order.notes ? (
                    <div>
                      <p className="font-medium text-[#2E2A25]">
                        {t.order_notes}
                      </p>
                      <p>{data.order.notes}</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="rounded-sm border border-[#EAE4DC] bg-white p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[#2E2A25]">
                <Package size={16} />
                <span className={isRTL ? "font-arabic" : ""}>
                  {t.order_items}
                </span>
              </div>
              {!data ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(index => (
                    <div
                      key={index}
                      className="h-20 rounded-sm bg-[#EAE4DC] animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.items.map(item => (
                    <li
                      key={item.id}
                      className={`flex items-center gap-3 rounded-sm border border-[#EAE4DC] p-4 ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <div className="h-16 w-16 overflow-hidden rounded-sm bg-[#F0EBE3]">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productNameEn}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div
                        className={`flex-1 text-sm ${isRTL ? "text-right" : "text-left"}`}
                      >
                        <p
                          className={`font-medium text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
                        >
                          {isRTL ? item.productNameAr : item.productNameEn}
                        </p>
                        {item.variant ? (
                          <p className="text-xs text-[#8A8078]">
                            {item.variant}
                          </p>
                        ) : null}
                        <p className="text-xs text-[#8A8078] ltr-num">
                          ×{item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-medium ltr-num">
                        {formatPrice(
                          String(
                            parseFloat(String(item.unitPrice)) * item.quantity
                          )
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-sm border border-[#EAE4DC] bg-white p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[#2E2A25]">
                <Truck size={16} />
                <span className={isRTL ? "font-arabic" : ""}>
                  {t.order_tracking}
                </span>
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(index => (
                      <div
                        key={index}
                        className="h-4 rounded-sm bg-[#EAE4DC] animate-pulse"
                      />
                    ))}
                  </div>
                ) : isError ? (
                  <div className="text-sm text-[#8A8078]">
                    Unable to load order tracking.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trackingSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span
                          className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold ${
                            step.completed || step.active
                              ? "border-[#2E2A25] bg-[#2E2A25] text-white"
                              : "border-[#EAE4DC] bg-white text-[#8A8078]"
                          }`}
                        >
                          {step.completed || step.active ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <div className="grow">
                          <p
                            className={`text-sm font-medium text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
                          >
                            {step.label}
                          </p>
                          <p className="text-xs text-[#8A8078]">
                            {step.active
                              ? t.tracking_current_status
                              : step.completed
                                ? t.tracking_completed
                                : t.tracking_pending}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {data ? (
              <div className="rounded-sm border border-[#EAE4DC] bg-white p-6 text-sm text-[#2E2A25]">
                <div className="space-y-2 border-b border-[#EAE4DC] pb-3">
                  <div className="flex justify-between">
                    <span>{t.checkout_subtotal}</span>
                    <span className="ltr-num">
                      {formatPrice(String(data.order.subtotalAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.checkout_shipping}</span>
                    <span className="ltr-num">
                      {formatPrice(String(data.order.shippingAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.checkout_discount}</span>
                    <span className="ltr-num">
                      {formatPrice(String(data.order.discountAmount ?? "0.00"))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.checkout_tax}</span>
                    <span className="ltr-num">
                      {formatPrice(String(data.order.taxAmount))}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex justify-between text-sm font-medium">
                  <span>{t.checkout_total}</span>
                  <span className="ltr-num">
                    {formatPrice(String(data.order.totalAmount))}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
