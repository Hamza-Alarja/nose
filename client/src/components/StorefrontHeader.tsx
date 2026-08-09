import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useCustomerAuth } from "@/_core/hooks/useCustomerAuth";
import {
  ShoppingBag,
  Search,
  User,
  UserRound,
  Menu,
  X,
  Globe,
  Languages,
  House,
  Store,
  ShoppingCart,
  LogOut,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import logoImage from "@/logo.png";

export default function StorefrontHeader() {
  const { t, locale, setLocale, isRTL, formatPrice } = useI18n();
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const [location, navigate] = useLocation();
  const { data: storeSettings } = trpc.storeSettings.get.useQuery(undefined);
  const { totalItems, isOpen: isCartOpen, openCart, closeCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [scrolled, setScrolled] = useState(false);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { label: t.nav_home, href: "/" },
    { label: t.nav_shop, href: "/shop" },
    // { label: t.nav_about, href: "/about" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 260);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setActiveResultIndex(-1);
  }, [debouncedQuery]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        searchPanelRef.current &&
        !searchPanelRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchOpen]);

  const trimmedQuery = debouncedQuery.trim();
  const { data: searchResults = [] } = trpc.products.list.useQuery(
    { search: trimmedQuery || undefined },
    { enabled: Boolean(trimmedQuery) && searchOpen }
  );

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedQuery})`, "ig"));

    return parts.map((part, index) => {
      const isMatch = part.toLowerCase() === query.toLowerCase();
      return isMatch ? (
        <mark
          key={`${part}-${index}`}
          className="rounded bg-[#F7EFE5] px-1 py-0.5 text-[#171311]"
        >
          {part}
        </mark>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      );
    });
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const value = searchQuery.trim();
    if (!value) return;

    navigate(`/shop?search=${encodeURIComponent(value)}`);
    setSearchOpen(false);
    setSearchQuery("");
    setDebouncedQuery("");
    setActiveResultIndex(-1);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchResults.length) {
      if (event.key === "Enter") {
        event.preventDefault();
        const value = searchQuery.trim();
        if (value) {
          navigate(`/shop?search=${encodeURIComponent(value)}`);
          setSearchOpen(false);
          setSearchQuery("");
          setDebouncedQuery("");
          setActiveResultIndex(-1);
        }
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResultIndex(prev => (prev + 1) % searchResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResultIndex(prev =>
        prev <= 0 ? searchResults.length - 1 : prev - 1
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selectedProduct =
        searchResults[activeResultIndex >= 0 ? activeResultIndex : 0];
      if (selectedProduct) {
        navigate(`/product/${selectedProduct.id}`);
        setSearchOpen(false);
        setSearchQuery("");
        setDebouncedQuery("");
        setActiveResultIndex(-1);
      }
    }
  };

  const handleResultSelect = (productId: number) => {
    navigate(`/product/${productId}`);
    setSearchOpen(false);
    setSearchQuery("");
    setDebouncedQuery("");
    setActiveResultIndex(-1);
  };

  const desktopIconClassName =
    "h-[17px] w-[17px] stroke-[1.7] md:h-[18px] md:w-[18px]";
  const announcement =
    locale === "ar"
      ? storeSettings?.announcementAr ||
        storeSettings?.announcementEn ||
        t.promo_message
      : storeSettings?.announcementEn ||
        storeSettings?.announcementAr ||
        t.promo_message;
  const brandName = storeSettings?.storeName || "NOSE";
  const navbarLogo = (() => {
    const configuredLogo = storeSettings?.logoUrl?.trim();
    if (
      configuredLogo &&
      configuredLogo !== "/logo.png" &&
      configuredLogo !== "logo.png" &&
      !configuredLogo.startsWith("/logo.png")
    ) {
      return configuredLogo;
    }
    return logoImage;
  })();
  const mobileIconClassName = "h-5 w-5 stroke-[1.8]";
  const isHomeActive = location === "/";
  const isShopActive = location === "/shop" || location.startsWith("/product/");
  const isCartActive =
    location === "/checkout" ||
    location === "/order-confirmation" ||
    location === "/cart";

  const mobileNavigationLinks = [
    { label: locale === "ar" ? "الرئيسية" : "Home", href: "/" },
    { label: locale === "ar" ? "المتجر" : "Shop", href: "/shop" },
    {
      label: locale === "ar" ? "وصل حديثاً" : "New Arrivals",
      href: "/shop?filter=new",
    },
    {
      label: locale === "ar" ? "المجموعات" : "Collections",
      href: "/collections",
    },
    { label: locale === "ar" ? "من نحن" : "About", href: "/about" },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLanguageChange = () => {
    setLocale(locale === "en" ? "ar" : "en");
    closeMobileMenu();
  };

  const handleCartClick = () => {
    closeMobileMenu();
    if (isCartOpen) {
      closeCart();
    } else {
      openCart();
    }
  };

  return (
    <header className="storefront-header-shell fixed inset-x-0 top-0 z-70">
      <div className="bg-[#B78A46] px-4 py-1.5 text-center text-[10px] font-medium uppercase text-white">
        <span className={isRTL ? "font-arabic" : ""}>{announcement}</span>
      </div>

      <div
        className={`border-b border-[#E8DED1] bg-white transition-all duration-300 ${
          scrolled ? "shadow-[0_6px_18px_rgba(36,33,29,0.06)]" : "shadow-none"
        }`}
      >
        <div className="border-b border-[#E8DED1] bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center justify-start">
              <div className="hidden items-center gap-6 lg:flex">
                {navLinks.slice(0, 2).map(link => {
                  const active =
                    link.href === "/" ? isHomeActive : isShopActive;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className="storefront-nav-link"
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                className="storefront-nav-icon inline-flex lg:hidden items-center justify-center"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                <Menu className={desktopIconClassName} />
              </button>
            </div>

            <Link
              href="/"
              className="flex shrink-0 items-center justify-center overflow-hidden px-2 py-1"
            >
              <img
                src={navbarLogo}
                alt={brandName}
                className="h-30 w-auto object-contain"
              />
            </Link>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => setLocale(locale === "en" ? "ar" : "en")}
                className="storefront-nav-icon hidden lg:inline-flex items-center justify-center"
                aria-label="Switch language"
              >
                <Globe className={desktopIconClassName} />
              </button>
              <button
                type="button"
                className="storefront-nav-icon inline-flex items-center justify-center"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label={t.filter_search}
              >
                <Search className={desktopIconClassName} />
              </button>
              <Link
                href={isAuthenticated ? "/account" : "/account/login"}
                className="storefront-nav-icon hidden lg:inline-flex items-center justify-center"
                aria-label={isAuthenticated ? "Account" : "Sign in"}
              >
                <User className={desktopIconClassName} />
              </Link>
              <button
                type="button"
                className="storefront-nav-icon inline-flex items-center justify-center relative"
                onClick={handleCartClick}
                aria-label={t.nav_cart}
              >
                <ShoppingBag className={desktopIconClassName} />
                {totalItems > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4.25 min-w-4.25 items-center justify-center rounded-full bg-[#B78A46] px-1 text-[9px] font-semibold text-white ltr-num">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.button
                type="button"
                aria-label="Close menu"
                onClick={closeMobileMenu}
                className="fixed inset-0 z-[1000] bg-[#171311]/35 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.aside
                id="mobile-navigation"
                dir={isRTL ? "rtl" : "ltr"}
                aria-label={
                  locale === "ar" ? "قائمة التنقل" : "Mobile navigation"
                }
                className={`fixed inset-y-0 z-[1001] flex w-[min(86vw,360px)] flex-col bg-[#FFFDF9] px-6 pb-6 pt-5 shadow-[0_12px_32px_rgba(23,19,17,0.16)] ${isRTL ? "right-0" : "left-0"} lg:hidden`}
                initial={{ x: isRTL ? "100%" : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: isRTL ? "100%" : "-100%" }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between border-b border-[#E8DED1] pb-5">
                  <span className="font-heading text-xl uppercase tracking-[0.26em] text-[#24211D]">
                    NOSE
                  </span>
                  <button
                    type="button"
                    className="storefront-nav-icon inline-flex items-center justify-center"
                    onClick={closeMobileMenu}
                    aria-label="Close menu"
                  >
                    <X className={mobileIconClassName} />
                  </button>
                </div>

                <nav
                  className="flex flex-col gap-1 pt-6"
                  aria-label="Main navigation"
                >
                  {mobileNavigationLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobileMenu}
                      aria-current={
                        link.href === "/"
                          ? isHomeActive
                            ? "page"
                            : undefined
                          : link.href === "/shop" && isShopActive
                            ? "page"
                            : undefined
                      }
                      className={`border-b border-[#E8DED1]/70 px-1 py-3 text-sm font-medium ${isRTL ? "font-arabic" : "uppercase tracking-[0.16em]"} text-[#24211D] transition-colors hover:text-[#B78A46]`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-auto flex flex-col gap-1 border-t border-[#E8DED1] pt-4">
                  <Link
                    href={isAuthenticated ? "/account" : "/account/login"}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-1 py-3 text-sm font-medium text-[#24211D] ${isRTL ? "font-arabic" : "uppercase tracking-[0.16em]"}`}
                  >
                    <UserRound className="h-5 w-5" />
                    <span>
                      {isAuthenticated ? t.account_my_account : t.auth_sign_in}
                    </span>
                  </Link>
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        closeMobileMenu();
                        navigate("/account/login");
                      }}
                      className={`flex items-center gap-3 px-1 py-3 text-left text-sm font-medium text-[#24211D] ${isRTL ? "font-arabic" : "uppercase tracking-[0.16em]"}`}
                    >
                      <LogOut className="h-5 w-5" />
                      <span>{t.auth_sign_out}</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLanguageChange}
                    className={`flex items-center gap-3 px-1 py-3 text-left text-sm font-medium text-[#24211D] ${isRTL ? "font-arabic" : "uppercase tracking-[0.16em]"}`}
                  >
                    <Languages className="h-5 w-5" />
                    <span>{locale === "ar" ? "English" : "العربية"}</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      <div
        ref={searchPanelRef}
        className="relative z-[1100] px-4 pb-4 pt-2 sm:px-6 lg:px-8"
      >
        {searchOpen && (
          <div className="mx-auto max-w-2xl rounded-[1.2rem] border border-[#E8DED1] bg-[#FFFDF9] p-3 shadow-[0_10px_24px_rgba(23,19,17,0.08)]">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleInputKeyDown}
                placeholder={t.nav_search_placeholder}
                className={`flex-1 rounded-full border border-[#E8DED1] bg-white px-4 py-3 text-sm text-[#171311] focus:outline-none focus:ring-1 focus:ring-[#B78A46] ${isRTL ? "text-right font-arabic" : ""}`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </form>

            <AnimatePresence>
              {trimmedQuery && searchOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className={`mt-2 overflow-hidden rounded-[1rem] border border-[#E8DED1] bg-white shadow-[0_12px_28px_rgba(23,19,17,0.08)] ${isRTL ? "text-right" : "text-left"}`}
                >
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[#6A645E]">
                      {t.nav_search_placeholder
                        ? "No products found."
                        : "No products found."}
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {searchResults.map((product, index) => {
                        const displayName = isRTL
                          ? product.nameAr
                          : product.nameEn;
                        const image =
                          Array.isArray(product.images) && product.images[0]
                            ? product.images[0]
                            : "";

                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleResultSelect(product.id)}
                            className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${index === activeResultIndex ? "bg-[#F7EFE5]" : "hover:bg-[#F7EFE5]"} ${isRTL ? "text-right" : "text-left"}`}
                          >
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#E8DED1] bg-[#F9F2E8]">
                              {image ? (
                                <img
                                  src={image}
                                  alt={displayName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.24em] text-[#B78A46]">
                                  NOSE
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-[#171311]">
                                {highlightMatch(displayName, trimmedQuery)}
                              </div>
                              <div className="mt-1 text-xs text-[#6A645E] ltr-num">
                                {formatPrice(product.price)}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )}
      </div>

      <nav
        dir="ltr"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-1/2 z-50 w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 rounded-[1.4rem] border border-white/40 bg-white/85 px-3 py-2 shadow-[0_12px_35px_rgba(23,19,17,0.16)] backdrop-blur-xl lg:hidden"
        aria-label="Quick navigation"
      >
        <div className="grid grid-cols-3 items-center">
          <Link
            href="/"
            className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] transition-colors ${isHomeActive ? "text-[#B78A46]" : "text-[#6A645E]"}`}
            aria-label="Home"
            aria-current={isHomeActive ? "page" : undefined}
          >
            <House className="h-5 w-5" strokeWidth={isHomeActive ? 2.2 : 1.8} />
            <span>{locale === "ar" ? "الرئيسية" : "Home"}</span>
          </Link>

          <Link
            href="/shop"
            className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] transition-colors ${isShopActive ? "text-[#B78A46]" : "text-[#6A645E]"}`}
            aria-label="Shop"
            aria-current={isShopActive ? "page" : undefined}
          >
            <Store className="h-5 w-5" strokeWidth={isShopActive ? 2.2 : 1.8} />
            <span>{locale === "ar" ? "المتجر" : "Shop"}</span>
          </Link>

          <button
            type="button"
            className={`relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] transition-colors ${isCartActive ? "text-[#B78A46]" : "text-[#6A645E]"}`}
            onClick={handleCartClick}
            aria-label="Cart"
          >
            <div className="relative">
              <ShoppingCart
                className="h-5 w-5"
                strokeWidth={isCartActive ? 2.2 : 1.8}
              />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B78A46] px-1 text-[9px] font-semibold text-white ltr-num">
                  {totalItems}
                </span>
              )}
            </div>
            <span>{locale === "ar" ? "السلة" : "Cart"}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
