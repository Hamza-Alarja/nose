import AdminLayout from "./AdminLayout";
import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import { Package, ShoppingCart, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { t, isRTL, formatPrice } = useI18n();

  const { data: products = [] } = trpc.products.list.useQuery({});
  const { data: orders = [] } = trpc.orders.adminList.useQuery(undefined);

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount ?? 0),
    0
  );
  const pendingOrders = orders.filter(
    order => order.status === "pending"
  ).length;

  const stats = [
    { label: t.admin_products, value: String(products.length), icon: Package },
    { label: t.admin_orders, value: String(orders.length), icon: ShoppingCart },
    {
      label: t.admin_dashboard,
      value: formatPrice(totalRevenue),
      icon: TrendingUp,
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <h1
          className={`font-heading text-2xl font-light text-[#2E2A25] mb-6 ${isRTL ? "font-arabic text-right" : ""}`}
        >
          {t.admin_dashboard}
        </h1>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-sm border border-[#EAE4DC] p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#8A8078]">{stat.label}</p>
                    <p className="text-2xl font-medium text-[#2E2A25] mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-sm bg-[#F5F1EC] flex items-center justify-center text-[#2E2A25]">
                    <Icon size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-white rounded-sm border border-[#EAE4DC] p-5">
          <h2
            className={`text-lg font-medium text-[#2E2A25] ${isRTL ? "font-arabic text-right" : ""}`}
          >
            {t.admin_quick_overview}
          </h2>
          <p className="mt-3 text-sm text-[#8A8078]">
            {t.admin_pending_orders_summary.replace(
              "{count}",
              String(pendingOrders)
            )}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
