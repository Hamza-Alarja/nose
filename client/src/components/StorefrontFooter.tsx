import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Instagram, Twitter, Facebook } from "lucide-react";

export default function StorefrontFooter() {
  const { t, isRTL, locale } = useI18n();
  const { data: storeSettings } = trpc.storeSettings.get.useQuery(undefined);

  const shopLinks = [
    { label: t.nav_shop, href: "/shop" },
    { label: t.section_new_arrivals, href: "/shop?filter=new" },
    { label: t.section_bestsellers, href: "/shop" },
    { label: t.category_men, href: "/shop?category=men" },
    { label: t.category_women, href: "/shop?category=women" },
  ];

  const storeInfoItems = [
    locale === "ar" ? "شحن داخل الإمارات" : "Delivery across the UAE",
    locale === "ar" ? "دفع آمن وسهل" : "Secure and easy payment",
    locale === "ar" ? "منتجات مختارة بعناية" : "Carefully selected products",
  ];

  const storeAddressText =
    locale === "ar"
      ? storeSettings?.storeAddressAr ||
        storeSettings?.storeAddressEn ||
        t.footer_tagline
      : storeSettings?.storeAddressEn ||
        storeSettings?.storeAddressAr ||
        t.footer_tagline;

  const locationText = t.footer_location;
  const shouldShowLocation =
    !storeAddressText.includes(locationText) &&
    !storeAddressText.toLowerCase().includes("dubai") &&
    !storeAddressText.includes("دبي");

  return (
    <footer className="bg-[#171311] text-[#F6F0E6]">
      <div className="container py-10 md:py-12">
        <div
          className={`grid gap-8 md:grid-cols-[1.2fr_1fr_1.1fr] ${isRTL ? "text-right" : "text-left"}`}
        >
          <div className="max-w-md">
            <span
              className={`inline-block font-heading text-2xl uppercase text-[#F6F0E6] ${
                isRTL ? "tracking-normal font-arabic" : "tracking-[0.22em]"
              }`}
            >
              {storeSettings?.storeName || "NOSE"}
            </span>
            <p
              className={`mt-4 text-sm leading-7 text-[#E7D7BF] ${isRTL ? "font-arabic" : ""}`}
            >
              {storeAddressText}
            </p>
            {shouldShowLocation ? (
              <p
                className={`mt-3 text-sm leading-7 text-[#D9C8AF] ${isRTL ? "font-arabic" : ""}`}
              >
                {locationText}
              </p>
            ) : null}
          </div>

          <div>
            <h4
              className={`text-[11px] font-medium uppercase text-[#E7D7BF] ${
                isRTL ? "font-arabic tracking-normal" : "tracking-[0.32em]"
              }`}
            >
              {t.footer_shop}
            </h4>
            <ul className="mt-4 space-y-3">
              {shopLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm text-[#E7D7BF] transition-colors hover:text-[#B78A45] ${isRTL ? "font-arabic" : ""}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className={`text-[11px] font-medium uppercase text-[#E7D7BF] ${
                isRTL ? "font-arabic tracking-normal" : "tracking-[0.32em]"
              }`}
            >
              {t.footer_store_info}
            </h4>
            <ul className="mt-4 space-y-3">
              {storeInfoItems.map(item => (
                <li
                  key={item}
                  className={`text-sm text-[#E7D7BF] ${isRTL ? "font-arabic" : ""}`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className={`mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#B78A45]/20 pt-6 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <p className={`text-xs text-[#8C857D] ${isRTL ? "font-arabic" : ""}`}>
            {t.footer_rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
