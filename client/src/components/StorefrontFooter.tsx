import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Instagram, Twitter, Facebook } from "lucide-react";

export default function StorefrontFooter() {
  const { t, isRTL, locale } = useI18n();
  const { data: storeSettings } = trpc.storeSettings.get.useQuery(undefined);

  return (
    <footer className="bg-[#171311] text-[#F6F0E6]">
      <div className="container py-10">
        <div
          className={`grid gap-8 md:grid-cols-4 ${isRTL ? "text-right" : ""}`}
        >
          <div className="md:col-span-1">
            <span className="font-heading text-xl uppercase tracking-[0.24em] text-[#F6F0E6]">
              {storeSettings?.storeName || "NOSE"}
            </span>
            <p
              className={`mt-3 text-sm leading-7 text-[#E7D7BF] ${isRTL ? "font-arabic" : ""}`}
            >
              {locale === "ar"
                ? storeSettings?.storeAddressAr ||
                  storeSettings?.storeAddressEn ||
                  t.footer_tagline
                : storeSettings?.storeAddressEn ||
                  storeSettings?.storeAddressAr ||
                  t.footer_tagline}
            </p>
            <div
              className={`mt-4 flex gap-3 ${isRTL ? "flex-row-reverse justify-end" : ""}`}
            >
              {storeSettings?.instagramUrl ? (
                <a
                  href={storeSettings.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#B78A45]/25 p-2 text-[#E7D7BF] transition-colors hover:text-[#B78A45]"
                >
                  <Instagram size={16} />
                </a>
              ) : null}
              {storeSettings?.twitterUrl ? (
                <a
                  href={storeSettings.twitterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#B78A45]/25 p-2 text-[#E7D7BF] transition-colors hover:text-[#B78A45]"
                >
                  <Twitter size={16} />
                </a>
              ) : null}
              {storeSettings?.facebookUrl ? (
                <a
                  href={storeSettings.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#B78A45]/25 p-2 text-[#E7D7BF] transition-colors hover:text-[#B78A45]"
                >
                  <Facebook size={16} />
                </a>
              ) : null}
            </div>
          </div>

          <div>
            <h4
              className={`text-[11px] font-medium uppercase tracking-[0.32em] text-[#E7D7BF] ${isRTL ? "font-arabic" : ""}`}
            >
              {t.footer_shop}
            </h4>
            <ul className="mt-4 space-y-2">
              {[
                t.nav_shop,
                t.section_new_arrivals,
                t.section_bestsellers,
                t.section_collections,
              ].map(label => (
                <li key={label}>
                  <Link
                    href="/shop"
                    className={`text-sm text-[#E7D7BF] transition-colors hover:text-[#B78A45] ${isRTL ? "font-arabic" : ""}`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className={`text-[11px] font-medium uppercase tracking-[0.32em] text-[#E7D7BF] ${isRTL ? "font-arabic" : ""}`}
            >
              {t.footer_help}
            </h4>
            <ul className="mt-4 space-y-2">
              {["FAQ", "Shipping", "Returns", "Contact"].map(label => (
                <li key={label}>
                  <a
                    href="#"
                    className="text-sm text-[#E7D7BF] transition-colors hover:text-[#B78A45]"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className={`text-[11px] font-medium uppercase tracking-[0.32em] text-[#E7D7BF] ${isRTL ? "font-arabic" : ""}`}
            >
              {t.footer_legal}
            </h4>
            <ul className="mt-4 space-y-2">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                label => (
                  <li key={label}>
                    <a
                      href="#"
                      className="text-sm text-[#E7D7BF] transition-colors hover:text-[#B78A45]"
                    >
                      {label}
                    </a>
                  </li>
                )
              )}
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
