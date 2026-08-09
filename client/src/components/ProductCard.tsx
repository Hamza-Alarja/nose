import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import { Check, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ProductCardProps {
  id: number;
  nameEn: string;
  nameAr: string;
  price: string | number;
  compareAtPrice?: string | number | null;
  images: string[];
  isNew?: boolean;
  stockQuantity: number;
  category?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
}

export default function ProductCard({
  id,
  nameEn,
  nameAr,
  price,
  compareAtPrice,
  images,
  isNew,
  stockQuantity,
  category,
  descriptionEn,
  descriptionAr,
}: ProductCardProps) {
  const { t, isRTL, locale, formatPrice } = useI18n();
  const { addItem, openCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const displayName = isRTL ? nameAr : nameEn;
  const mainImage = images?.[0] ?? "";
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  const inStock = stockQuantity > 0;
  const description = isRTL ? descriptionAr : descriptionEn;

  const badge = isNew ? { label: t.product_new } : null;
  const collectionLabel =
    category === "men"
      ? t.category_men
      : category === "women"
        ? t.category_women
        : category === "gifts"
          ? t.category_gifts
          : null;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    addItem({
      productId: id,
      nameEn,
      nameAr,
      image: mainImage,
      price: numPrice,
      quantity: 1,
      stockQuantity,
    });

    setIsAdded(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setIsAdded(false), 1200);

    toast.custom(
      toastId => (
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className={`flex max-w-[calc(100vw-24px)] items-center justify-between gap-3 rounded-[16px] border border-[#E8DDCB] bg-[#FFFDF9]/95 px-3.5 py-3 shadow-[0_18px_40px_rgba(23,19,17,0.12)] backdrop-blur ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <div className="min-w-0">
            <p
              className={`text-sm font-medium text-[#171311] ${isRTL ? "text-right" : "text-left"}`}
            >
              {t.cart_added_to_cart_title}
            </p>
            <p
              className={`mt-0.5 text-xs text-[#8A8078] ${isRTL ? "text-right" : "text-left"}`}
            >
              {t.cart_added_to_cart_description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              toast.dismiss(toastId);
              openCart();
            }}
            className="shrink-0 rounded-full bg-[#171311] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFFDF9]"
          >
            {t.cart_view_cart}
          </button>
        </div>
      ),
      {
        duration: 3000,
        position: window.innerWidth < 768 ? "bottom-center" : "bottom-right",
        className: "!bg-transparent !shadow-none !p-0 !border-0",
      }
    );
  };

  return (
    <Link href={`/product/${id}`} className="group block h-full min-w-0">
      <motion.div
        transition={{ duration: 0.25, ease: "easeOut" }}
        dir={isRTL ? "rtl" : "ltr"}
        className={`flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-[18px] border border-[#E8DDCB] bg-[#FFFDF9] shadow-[0_10px_24px_rgba(23,19,17,0.04)] transition-all duration-300  sm:rounded-[22px] lg:rounded-[26px] ${isRTL ? "text-right" : "text-left"}`}
      >
        <div className="flex h-full flex-col p-[10px] sm:p-[14px] lg:p-[18px] xl:p-[20px]">
          <div className="relative overflow-hidden rounded-[14px] bg-[#fff] sm:rounded-[16px] lg:rounded-[18px]">
            <div className="flex items-center justify-center overflow-hidden rounded-[14px] bg-[#fff] p-[6px] sm:rounded-[16px] sm:p-[8px] lg:rounded-[18px] lg:p-[10px]">
              <div className="h-[150px] w-full overflow-hidden sm:h-[162px] lg:h-[200px] xl:h-[220px]">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={displayName}
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-400 group-hover:scale-[1.02] md:group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#fff]">
                    <span className="font-heading text-5xl font-light text-[#B78A45]/70">
                      N
                    </span>
                  </div>
                )}
              </div>
            </div>

            {badge && (
              <span
                className={`absolute left-2.5 top-2.5 rounded-full border border-[#E8DDCB] bg-[#FFFDF9]/90 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#7E6750] backdrop-blur-sm ${isRTL ? "font-arabic" : ""}`}
              >
                {badge.label}
              </span>
            )}
          </div>

          <div className="mt-[12px] flex flex-1 flex-col px-[2px]">
            {collectionLabel && (
              <p
                className={`line-clamp-1 text-[8px] uppercase tracking-[0.22em] text-[#A98A67] sm:text-[9px] lg:text-[10px] ${isRTL ? "font-arabic" : ""}`}
              >
                {collectionLabel}
              </p>
            )}

            <h3
              className={`mt-[5px] line-clamp-2 min-h-[2.1rem] text-[16px] font-medium leading-[1.1] text-[#171311] sm:min-h-[2.3rem] sm:text-[17px] lg:min-h-[2.4rem] lg:text-[20px] ${isRTL ? "font-arabic text-right" : "font-heading"}`}
            >
              {displayName}
            </h3>

            {description ? (
              <p
                className={`mt-[6px] line-clamp-2 text-[10px] leading-[1.4] text-[#706A64] sm:text-[11px] lg:text-[12px] ${isRTL ? "text-right" : ""}`}
              >
                {description}
              </p>
            ) : null}

            <div className="mt-[10px] border-t border-[rgba(23,19,17,0.08)] pt-[10px]" />

            <div
              className={`mt-[10px] flex items-end justify-between gap-[10px] md:gap-[16px]`}
            >
              <div className="min-w-0 ">
                <div
                  className={` text-[8px] font-semibold uppercase tracking-[0.18em] text-[#A98A67] sm:text-[9px] lg:text-[10px] ${isRTL ? "font-arabic" : ""}`}
                >
                  {locale === "ar" ? "السعر" : "PRICE"}
                </div>
                <div className="text-[13px] font-[700] leading-none whitespace-nowrap text-[#171311] ltr-num sm:text-[14px] lg:text-[16px]">
                  {formatPrice(numPrice)}
                </div>
                {compareAtPrice &&
                  parseFloat(String(compareAtPrice)) > numPrice && (
                    <div className="mt-[2px] text-[10px] text-[#6A645E] line-through ltr-num">
                      {formatPrice(parseFloat(String(compareAtPrice)))}
                    </div>
                  )}
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`inline-flex h-[28px] items-center justify-center gap-[4px] rounded-[8px] bg-[#11100F] px-[7px] text-[7px] font-semibold uppercase tracking-[0.04em] text-white transition-all duration-200 hover:bg-[#24211D] active:scale-[0.98] md:h-[32px] md:min-w-[96px] md:rounded-[9px] md:px-[8px] md:text-[8px] lg:h-[34px] lg:min-w-[104px] lg:px-[9px] lg:text-[8px] ${!inStock ? "cursor-not-allowed bg-[#D9CDBF] text-[#6A645E] hover:bg-[#D9CDBF]" : ""} ${isRTL ? "font-arabic flex-row-reverse" : ""}`}
                aria-label={
                  inStock ? t.product_add_to_cart : t.product_out_of_stock
                }
              >
                {isAdded ? (
                  <Check size={11} className="shrink-0 md:size-[13px]" />
                ) : (
                  <ShoppingBag size={11} className="shrink-0 md:size-[13px]" />
                )}
                <span className="truncate">
                  {isAdded
                    ? locale === "ar"
                      ? "تمت الإضافة"
                      : "Added"
                    : inStock
                      ? locale === "ar"
                        ? "أضف إلى السلة"
                        : "Add to Cart"
                      : locale === "ar"
                        ? "نفد المخزون"
                        : "Out of Stock"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
