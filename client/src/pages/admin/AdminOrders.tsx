import AdminLayout from "./AdminLayout";
import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUSES = [
  "all",
  "pending",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;

export default function AdminOrders() {
  const { t, isRTL, formatPrice } = useI18n();
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data: orders, refetch } = trpc.orders.adminList.useQuery({
    status: filterStatus === "all" ? undefined : filterStatus,
  });

  const { data: orderDetail } = trpc.orders.adminDetail.useQuery(
    { orderId: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );

  const updateStatus = trpc.orders.adminUpdateStatus.useMutation({
    onSuccess: () => {
      toast.success(t.admin_status_updated);
      refetch();
    },
    onError: e => toast.error(e.message),
  });

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-[#E8B8A0]/30 text-[#2E2A25]",
      processing: "bg-[#C9B8E8]/30 text-[#2E2A25]",
      shipped: "bg-[#A9C9A5]/30 text-[#2E2A25]",
      completed: "bg-[#A9C9A5]/50 text-[#2E2A25]",
      cancelled: "bg-red-100 text-red-600",
    };
    return map[s] ?? "bg-[#EAE4DC] text-[#8A8078]";
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t.order_status_pending,
      processing: t.order_status_processing,
      shipped: t.order_status_shipped,
      completed: t.order_status_completed,
      cancelled: t.order_status_cancelled,
    };
    return labels[status] ?? status;
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1
          className={`font-heading text-2xl font-light text-[#2E2A25] mb-6 ${isRTL ? "font-arabic text-right" : ""}`}
        >
          {t.admin_orders}
        </h1>

        {/* Status Filter */}
        <div
          className={`flex gap-2 flex-wrap mb-6 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors capitalize ${
                filterStatus === s
                  ? "bg-[#2E2A25] text-white"
                  : "border border-[#EAE4DC] text-[#2E2A25] hover:bg-[#EAE4DC]"
              } ${isRTL ? "font-arabic" : ""}`}
            >
              {s === "all" ? t.admin_filter_all : statusLabel(s)}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-sm border border-[#EAE4DC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F1EC] border-b border-[#EAE4DC]">
                <tr className={isRTL ? "text-right" : "text-left"}>
                  <th className="px-4 py-3 text-xs font-medium text-[#8A8078] uppercase tracking-wide">
                    {t.order_number}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-[#8A8078] uppercase tracking-wide">
                    {t.checkout_name}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-[#8A8078] uppercase tracking-wide">
                    {t.order_date}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-[#8A8078] uppercase tracking-wide">
                    {t.order_total}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-[#8A8078] uppercase tracking-wide">
                    {t.order_status}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-[#8A8078] uppercase tracking-wide">
                    {t.admin_payment}
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4DC]">
                {orders?.map(order => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#FBF7F2] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#2E2A25] ltr-num">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-[#2E2A25]">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3 text-[#8A8078] ltr-num">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium ltr-num">
                      {formatPrice(parseFloat(String(order.totalAmount)))}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={e =>
                          updateStatus.mutate({
                            orderId: order.id,
                            status: e.target.value as any,
                          })
                        }
                        className={`text-xs px-2 py-1 rounded-sm border-0 focus:outline-none focus:ring-1 focus:ring-[#8B76B8] cursor-pointer ${statusColor(order.status)}`}
                      >
                        {[
                          "pending",
                          "processing",
                          "shipped",
                          "completed",
                          "cancelled",
                        ].map(s => (
                          <option key={s} value={s}>
                            {statusLabel(s)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-sm ${order.paymentStatus === "paid" ? "bg-[#A9C9A5]/30 text-[#2E2A25]" : "bg-[#E8B8A0]/30 text-[#2E2A25]"}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedOrderId(order.id)}
                        className="p-1 text-[#8A8078] hover:text-[#2E2A25] transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!orders || orders.length === 0) && (
              <div
                className={`text-center py-10 text-[#8A8078] text-sm ${isRTL ? "font-arabic" : ""}`}
              >
                {t.admin_no_orders}
              </div>
            )}
          </div>
        </div>

        {/* Order Detail Modal */}
        {selectedOrderId && orderDetail && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-sm border border-[#EAE4DC] w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <div
                className={`flex items-center justify-between p-5 border-b border-[#EAE4DC] ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <h2 className="font-medium text-[#2E2A25] ltr-num">
                  {t.order_number}
                  {orderDetail.order.orderNumber}
                </h2>
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="p-1 text-[#8A8078] hover:text-[#2E2A25]"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div
                  className={`grid grid-cols-2 gap-3 text-sm ${isRTL ? "text-right" : ""}`}
                >
                  <div>
                    <p className="text-xs text-[#8A8078]">{t.checkout_name}</p>
                    <p className="font-medium">
                      {orderDetail.order.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8A8078]">{t.checkout_phone}</p>
                    <p className="font-medium ltr-num">
                      {orderDetail.order.customerPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8A8078]">{t.checkout_email}</p>
                    <p className="font-medium">
                      {orderDetail.order.customerEmail ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8A8078]">{t.checkout_city}</p>
                    <p className="font-medium">
                      {orderDetail.order.city ?? "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-[#8A8078]">
                      {t.checkout_address}
                    </p>
                    <p className="font-medium">
                      {orderDetail.order.shippingAddress}
                    </p>
                  </div>
                  {orderDetail.order.notes && (
                    <div className="col-span-2">
                      <p className="text-xs text-[#8A8078]">
                        {t.checkout_notes}
                      </p>
                      <p className="font-medium">{orderDetail.order.notes}</p>
                    </div>
                  )}
                </div>
                <div className="border-t border-[#EAE4DC] pt-4">
                  <p className="text-xs text-[#8A8078] mb-2">{t.order_items}</p>
                  <ul className="space-y-2">
                    {orderDetail.items.map(item => (
                      <li
                        key={item.id}
                        className={`flex justify-between text-sm ${isRTL ? "flex-row-reverse" : ""}`}
                      >
                        <span>
                          {item.productNameEn}{" "}
                          {item.variant ? `(${item.variant})` : ""} ×
                          {item.quantity}
                        </span>
                        <span className="ltr-num">
                          {formatPrice(
                            parseFloat(String(item.unitPrice)) * item.quantity
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div
                    className={`flex justify-between font-medium mt-3 pt-3 border-t border-[#EAE4DC] ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <span>{t.checkout_total}</span>
                    <span className="ltr-num">
                      {formatPrice(
                        parseFloat(String(orderDetail.order.totalAmount))
                      )}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 border-t border-[#EAE4DC] pt-3 text-sm">
                    {[
                      [t.checkout_subtotal, orderDetail.order.subtotalAmount],
                      [t.checkout_shipping, orderDetail.order.shippingAmount],
                      [t.checkout_discount, orderDetail.order.discountAmount],
                      [t.checkout_tax, orderDetail.order.taxAmount],
                    ].map(([label, amount]) => (
                      <div
                        key={label}
                        className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}
                      >
                        <span>{label}</span>
                        <span className="ltr-num">
                          {formatPrice(String(amount ?? "0.00"))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
