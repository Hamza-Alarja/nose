import { useAdminAuth } from "@/_core/hooks/useAdminAuth";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  LogOut,
  Bell,
  Settings,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { ReactNode, useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAuthenticated, loading, logout } = useAdminAuth();
  const { t, locale, setLocale, isRTL } = useI18n();
  const [location] = useLocation();
  const lastOrderCount = useRef<number | null>(null);
  const [lastChecked] = useState(() => Date.now());

  // Poll for new orders every 25 seconds
  const { data: newOrders } = trpc.orders.newOrdersSince.useQuery(
    { since: lastChecked },
    {
      enabled: isAuthenticated,
      refetchInterval: 25_000,
    }
  );

  useEffect(() => {
    if (newOrders === undefined) return;
    if (lastOrderCount.current === null) {
      lastOrderCount.current = newOrders.length;
      return;
    }
    if (newOrders.length > lastOrderCount.current) {
      toast.success(t.admin_new_order_alert, { duration: 8000 });
      // Play a subtle beep
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch {}
    }
    lastOrderCount.current = newOrders.length;
  }, [newOrders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8B76B8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FBF7F2] flex flex-col items-center justify-center gap-4">
        <p className="text-[#8A8078]">{t.admin_sign_in_prompt}</p>
        <Button
          onClick={() => (window.location.href = "/login?next=/admin")}
          className="bg-[#2E2A25] hover:bg-[#4A3F35] text-white rounded-sm"
        >
          {t.auth_sign_in}
        </Button>
      </div>
    );
  }

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: t.admin_dashboard },
    { href: "/admin/products", icon: Package, label: t.admin_products },
    { href: "/admin/orders", icon: ShoppingCart, label: t.admin_orders },
    {
      href: "/admin/discount-codes",
      icon: Tag,
      label: locale === "ar" ? "رموز الخصم" : "Discount Codes",
    },
    {
      href: "/admin/store-settings",
      icon: Settings,
      label: locale === "ar" ? "إعدادات المتجر" : "Store Settings",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F1EC] flex">
      {/* Sidebar */}
      <aside
        className={`w-56 bg-[#2E2A25] text-[#FBF7F2] flex flex-col fixed top-0 ${isRTL ? "right-0" : "left-0"} h-full z-40`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/">
            <span className="font-heading text-xl tracking-[0.2em] uppercase">
              Nose
            </span>
          </Link>
          <p className="text-xs text-[#D9C4A3] mt-0.5">
            {isRTL ? t.admin_panel_title : t.admin_panel_title}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const active =
              location === item.href ||
              (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors cursor-pointer ${active ? "bg-white/15 text-white" : "text-[#D9C4A3] hover:bg-white/10 hover:text-white"} ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <item.icon size={16} />
                  <span className={isRTL ? "font-arabic" : ""}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          {/* Language toggle */}
          <button
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            className="w-full flex items-center justify-center px-3 py-2 rounded-sm text-sm text-[#D9C4A3] hover:bg-white/10 hover:text-white transition-colors"
          >
            {locale === "en" ? "العربية" : "English"}
          </button>
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-[#D9C4A3] hover:bg-white/10 hover:text-white transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <LogOut size={14} />
            <span>{t.admin_sign_out}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 ${isRTL ? "mr-56" : "ml-56"} min-h-screen`}>
        {children}
      </main>
    </div>
  );
}
