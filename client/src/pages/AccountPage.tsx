import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useCustomerAuth } from "@/_core/hooks/useCustomerAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Package, LogOut, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function AccountPage() {
  const { t, isRTL, formatPrice } = useI18n();
  const { customer, isAuthenticated, isLoading, logout } = useCustomerAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");

  const { data: orders, isLoading: ordersLoading } =
    trpc.orders.myOrders.useQuery(undefined, { enabled: isAuthenticated });

  const handleLogout = async () => {
    await logout();
    navigate("/account/login");
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8B76B8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FBF7F2] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <User size={48} strokeWidth={1} className="text-[#8A8078]" />
        <p className={`text-[#8A8078] ${isRTL ? "font-arabic" : ""}`}>
          {isRTL
            ? "يرجى تسجيل الدخول لعرض حسابك"
            : "Please sign in to view your account"}
        </p>
        <Button
          onClick={() => navigate("/account/login")}
          className="bg-[#2E2A25] hover:bg-[#4A3F35] text-white rounded-sm"
        >
          {isRTL ? "تسجيل الدخول" : "Sign In"}
        </Button>
      </div>
    );
  }

  const orderCount = orders?.length ?? 0;
  const paidCount =
    orders?.filter(order => order.paymentStatus === "paid").length ?? 0;
  const pendingCount =
    orders?.filter(order => order.status === "pending").length ?? 0;
  const totalSpent = orders
    ? orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
    : 0;
  const lastOrder = orders?.[0];

  return (
    <div className="min-h-screen bg-[#FBF7F2] py-10">
      <div className="container max-w-4xl">
        <div className="rounded-sm border border-[#EAE4DC] bg-white p-8 shadow-sm">
          <div
            className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${isRTL ? "text-right" : ""}`}
          >
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#8A8078]">
                {isRTL ? "لوحة العميل" : "Customer Dashboard"}
              </p>
              <h1
                className={`font-heading text-4xl font-light text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
              >
                {customer?.firstName || customer?.email}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6B6051]">
                {isRTL
                  ? `تحكم في تفاصيل حسابك، راجع حالات طلباتك الأخيرة، وتابع الدفع الخاص بك من مكان واحد. لديك ${pendingCount} طلب${pendingCount === 1 ? "" : "ات"} قيد الانتظار.`
                  : `Manage your profile details, review recent order statuses, and monitor payment progress from one unified dashboard. You have ${pendingCount} pending order${pendingCount === 1 ? "" : "s"} awaiting fulfillment.`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className={`border-[#EAE4DC] text-[#8A8078] hover:text-[#2E2A25] rounded-sm ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <LogOut size={14} className="me-1" />
              {isRTL ? "خروج" : "Sign Out"}
            </Button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-sm border border-[#EAE4DC] bg-[#FEFCF7] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[#8A8078]">
                {isRTL ? "طلبات" : "Orders"}
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#2E2A25]">
                {orderCount}
              </p>
              <p className="mt-1 text-sm text-[#6B6051]">
                {isRTL
                  ? "الطلبات المسجلة في حسابك"
                  : "Total orders linked to your account."}
              </p>
            </div>
            <div className="rounded-sm border border-[#EAE4DC] bg-[#FEFCF7] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[#8A8078]">
                {isRTL ? "مدفوع" : "Paid"}
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#2E2A25]">
                {paidCount}
              </p>
              <p className="mt-1 text-sm text-[#6B6051]">
                {isRTL
                  ? "المعاملات التي تم تأكيدها بنجاح"
                  : "Orders successfully paid."}
              </p>
            </div>
            <div className="rounded-sm border border-[#EAE4DC] bg-[#FEFCF7] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[#8A8078]">
                {isRTL ? "الإجمالي المصروف" : "Total spent"}
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#2E2A25] ltr-num">
                {formatPrice(String(totalSpent.toFixed(2)))}
              </p>
              <p className="mt-1 text-sm text-[#6B6051]">
                {isRTL
                  ? "القيمة الإجمالية لجميع طلباتك"
                  : "Aggregate order value from your account."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className={isRTL ? "text-right" : ""}>
            <h2
              className={`font-heading text-2xl font-light text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
            >
              {isRTL ? "تفاصيل الحساب" : "Account details"}
            </h2>
            <p className="mt-2 text-sm text-[#6B6051] max-w-2xl">
              {isRTL
                ? "استعرض بياناتك الشخصية وأضف تحديثات جديدة إلى حسابك في أي وقت."
                : "Review your profile attributes and keep your account information current."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                activeTab === "profile"
                  ? "bg-[#2E2A25] text-white"
                  : "border border-[#EAE4DC] text-[#2E2A25] hover:bg-[#F5F1EC]"
              } ${isRTL ? "font-arabic" : ""}`}
            >
              {isRTL ? "الملف الشخصي" : "Profile"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                activeTab === "orders"
                  ? "bg-[#2E2A25] text-white"
                  : "border border-[#EAE4DC] text-[#2E2A25] hover:bg-[#F5F1EC]"
              } ${isRTL ? "font-arabic" : ""}`}
            >
              {isRTL ? "سجل الطلبات" : "Order history"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-sm border border-[#EAE4DC] bg-white p-6 shadow-sm">
          {activeTab === "profile" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-[#8A8078]">
                  {isRTL ? "الاسم الأول" : "First name"}
                </p>
                <p className="text-sm text-[#2E2A25]">
                  {customer?.firstName ?? "—"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-[#8A8078]">
                  {isRTL ? "اسم العائلة" : "Last name"}
                </p>
                <p className="text-sm text-[#2E2A25]">
                  {customer?.lastName ?? "—"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-[#8A8078]">
                  {isRTL ? "البريد الإلكتروني" : "Email"}
                </p>
                <p className="text-sm text-[#2E2A25]">
                  {customer?.email ?? "—"}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-[#8A8078]">
                  {isRTL ? "الهاتف" : "Phone"}
                </p>
                <p className="text-sm text-[#2E2A25]">
                  {customer?.phone ?? "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {ordersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="h-24 rounded-sm bg-[#EAE4DC] animate-pulse"
                    />
                  ))}
                </div>
              ) : !orders || orders.length === 0 ? (
                <div className="text-center text-[#8A8078]">
                  <Package size={48} strokeWidth={1} className="mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#2E2A25] mb-2">
                    {isRTL ? "لم يتم العثور على طلبات" : "No orders found"}
                  </h3>
                  <p className="mx-auto max-w-xl text-sm leading-6">
                    {isRTL
                      ? "يبدو أنه لم يتم تسجيل أي طلبات بعد. ابدأ بالتسوق الآن لاكتشاف العطور المميزة واطلب أول منتج لك."
                      : "It looks like you haven’t placed any orders yet. Start shopping to discover exclusive fragrances and place your first order."}
                  </p>
                  <div className="mt-6">
                    <Link href="/shop">
                      <Button className="bg-[#2E2A25] hover:bg-[#4A3F35] text-white rounded-sm">
                        {isRTL ? "ابدأ التسوق" : "Start shopping"}
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {lastOrder && (
                    <div className="rounded-sm border border-[#EAE4DC] bg-[#FBF8F1] p-4 text-sm text-[#2E2A25]">
                      <p className="font-medium text-[#2E2A25] mb-1">
                        {isRTL ? "أحدث طلب" : "Latest order"}
                      </p>
                      <p className="text-[#6B6051]">
                        {isRTL
                          ? "تابع حالة الطلب الأخير ومعلومات الدفع في الوقت الفعلي."
                          : "Track the latest order status and payment details in real time."}
                      </p>
                    </div>
                  )}
                  <div className="grid gap-4">
                    {orders.map(order => (
                      <div
                        key={order.id}
                        className="rounded-sm border border-[#EAE4DC] bg-[#FCFBF8] p-4 sm:p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className={isRTL ? "text-right" : ""}>
                            <p className="text-xs uppercase tracking-[0.24em] text-[#8A8078]">
                              {isRTL ? "طلب" : "Order"}
                            </p>
                            <p className="text-sm font-semibold text-[#2E2A25] ltr-num">
                              {order.orderNumber}
                            </p>
                            <p className="text-xs text-[#6B6051] mt-1">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-sm ${statusColor(order.status)} ${isRTL ? "font-arabic" : ""}`}
                            >
                              {statusLabel(order.status)}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-sm ${order.paymentStatus === "paid" ? "bg-[#A9C9A5]/30 text-[#2E2A25]" : "bg-[#E8B8E0]/30 text-[#2E2A25]"}`}
                            >
                              {order.paymentStatus === "paid"
                                ? t.payment_paid
                                : order.paymentStatus === "refunded"
                                  ? t.payment_refunded
                                  : t.payment_unpaid}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className={isRTL ? "text-right" : ""}>
                            <p className="text-sm text-[#6B6051]">
                              {order.itemCount ?? 0} {t.items_label}
                            </p>
                            <p className="text-sm font-medium text-[#2E2A25] ltr-num">
                              {formatPrice(String(order.totalAmount))}
                            </p>
                          </div>
                          <Link href={`/account/orders/${order.orderNumber}`}>
                            <Button size="sm" className="rounded-sm">
                              {isRTL ? "عرض التفاصيل" : "View details"}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
