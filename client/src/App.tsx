import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import StorefrontHeader from "./components/StorefrontHeader";
import StorefrontFooter from "./components/StorefrontFooter";
import CartDrawer from "./components/CartDrawer";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import AccountPage from "./pages/AccountPage";
import CustomerLoginPage from "./pages/account/CustomerLoginPage";
import CustomerOrderDetailsPage from "./pages/account/CustomerOrderDetailsPage";
import CustomerRegisterPage from "./pages/account/CustomerRegisterPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDiscountCodes from "./pages/admin/AdminDiscountCodes";
import AdminStoreSettings from "./pages/admin/AdminStoreSettings";
import { useLocation } from "wouter";
import { useEffect } from "react";

function StorefrontLayout({
  children,
  isHome,
  isProduct,
}: {
  children: React.ReactNode;
  isHome: boolean;
  isProduct?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBF7F2]">
      <StorefrontHeader />
      <CartDrawer />
      <main
        className={`flex-1 pb-24 lg:pb-0 ${isHome ? "" : isProduct ? "pt-6 sm:pt-6 lg:pt-6" : "pt-24 sm:pt-28 lg:pt-24"}`}
      >
        {children}
      </main>
      <StorefrontFooter />
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);

  if (isAdmin) {
    return (
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/discount-codes" component={AdminDiscountCodes} />
        <Route path="/admin/store-settings" component={AdminStoreSettings} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  const isHome = location === "/";
  const isProduct = location.startsWith("/product/");

  return (
    <StorefrontLayout isHome={isHome} isProduct={isProduct}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/account/login" component={CustomerLoginPage} />
        <Route path="/account/register" component={CustomerRegisterPage} />
        <Route
          path="/account/orders/:orderNumber"
          component={CustomerOrderDetailsPage}
        />
        <Route path="/account" component={AccountPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/shop" component={ShopPage} />
        <Route path="/collections" component={ShopPage} />
        <Route path="/product/:id" component={ProductDetailPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/order-confirmation" component={OrderConfirmationPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </StorefrontLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="bottom-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
