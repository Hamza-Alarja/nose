import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ProductCard from "@/components/ProductCard";
import { toast } from "sonner";

const defaultProductImage =
  "https://placehold.co/900x900/f8f4ee/b78a46?text=NOSE";

type ScentMap = {
  top: string[];
  heart: string[];
  base: string[];
  general: string[];
};

export default function ProductDetailPage() {
  const { t, isRTL, locale, formatPrice } = useI18n();
  const { id } = useParams<{ id: string }>();
  const { items: cartItems, addItem, openCart } = useCart();

  const {
    data: product,
    isLoading,
    isError,
  } = trpc.products.byId.useQuery({
    id: Number.parseInt(id, 10),
  });

  const { data: storeSettings } = trpc.storeSettings.get.useQuery(undefined);
  const { data: relatedProducts = [] } = trpc.products.list.useQuery(
    { category: product?.category ?? undefined, active: true },
    { enabled: Boolean(product?.category) }
  );
  const { data: activeProducts = [] } = trpc.products.list.useQuery(
    { active: true },
    { enabled: Boolean(product?.id) }
  );

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [qty, setQty] = useState(1);

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  const images = useMemo(() => {
    if (!Array.isArray(product?.images) || product.images.length === 0) {
      return [] as string[];
    }
    return product.images.filter(Boolean);
  }, [product]);

  const variants = useMemo(() => {
    if (!Array.isArray(product?.variants)) {
      return [] as { size: string; price: number; stock: number }[];
    }
    return product.variants as { size: string; price: number; stock: number }[];
  }, [product]);

  const displayName = locale === "ar" ? product?.nameAr : product?.nameEn;
  const displayDesc =
    locale === "ar" ? product?.descriptionAr : product?.descriptionEn;
  const displayScent =
    locale === "ar" ? product?.scentNotesAr : product?.scentNotesEn;
  const displayCategory =
    product?.category === "men"
      ? t.category_men
      : product?.category === "women"
        ? t.category_women
        : product?.category === "gifts"
          ? t.category_gifts
          : product?.category || "Perfume";

  const selectedVariantRecord = variants.find(
    variant => variant.size === selectedVariant
  );
  const currentPrice = selectedVariantRecord
    ? Number(selectedVariantRecord.price)
    : Number(product?.price ?? 0);
  const availableStock = selectedVariantRecord
    ? Math.max(0, Number(selectedVariantRecord.stock ?? 0))
    : Math.max(0, Number(product?.stockQuantity ?? 0));
  const compareAtPrice = product?.compareAtPrice
    ? Number(product.compareAtPrice)
    : null;
  const currentCartQuantity = useMemo(
    () =>
      cartItems
        .filter(
          item =>
            item.productId === product?.id && item.variant === selectedVariant
        )
        .reduce((sum, item) => sum + item.quantity, 0),
    [cartItems, product?.id, selectedVariant]
  );
  const remainingStock = Math.max(0, availableStock - currentCartQuantity);
  const discountPercent =
    compareAtPrice && compareAtPrice > currentPrice
      ? Math.round(((compareAtPrice - currentPrice) / compareAtPrice) * 100)
      : null;

  const related = useMemo(() => {
    if (!product) {
      return [];
    }

    const sameCategory = relatedProducts.filter(
      relatedProduct =>
        relatedProduct.id !== product.id &&
        relatedProduct.category === product.category
    );

    const existingIds = new Set(sameCategory.map(item => item.id));

    const fallbackProducts = activeProducts.filter(
      relatedProduct =>
        relatedProduct.id !== product.id && !existingIds.has(relatedProduct.id)
    );

    return [...sameCategory, ...fallbackProducts].slice(0, 8);
  }, [product, relatedProducts, activeProducts]);

  const carouselOptions = {
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    skipSnaps: false,
    slidesToScroll: 1,
  } as const;

  const trackableImages = images.length > 0 ? images : [defaultProductImage];
  const safeImage = trackableImages[selectedImage] ?? trackableImages[0];
  const secondaryImage = trackableImages[1] ?? null;

  const scentNotes = useMemo(() => {
    const rawText = displayScent?.trim();
    if (!rawText) {
      return {
        top: [] as string[],
        heart: [] as string[],
        base: [] as string[],
        general: [] as string[],
      } satisfies ScentMap;
    }

    const entries = rawText
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean);

    const sections = {
      top: [] as string[],
      heart: [] as string[],
      base: [] as string[],
      general: [] as string[],
    } satisfies ScentMap;

    let current: keyof ScentMap | null = null;

    for (const line of entries) {
      const lower = line.toLowerCase();
      const sectionMatch = line.match(
        /^(top|heart|base)\s+notes\s*[:\-]?\s*(.*)$/i
      );

      if (sectionMatch) {
        const sectionKey = sectionMatch[1].toLowerCase() as keyof ScentMap;
        const value = sectionMatch[2]?.trim();
        if (value) {
          sections[sectionKey].push(value);
        }
        current = sectionKey;
        continue;
      }

      if (lower.startsWith("top notes")) {
        current = "top";
        continue;
      }

      if (lower.startsWith("heart notes")) {
        current = "heart";
        continue;
      }

      if (lower.startsWith("base notes")) {
        current = "base";
        continue;
      }

      if (current) {
        sections[current].push(line);
        continue;
      }

      sections.general.push(line);
    }

    return sections;
  }, [displayScent]);

  const scentColumns = [
    { key: "top", label: locale === "ar" ? "الأعلى" : "Top" },
    { key: "heart", label: locale === "ar" ? "القلب" : "Heart" },
    { key: "base", label: locale === "ar" ? "القاعدة" : "Base" },
  ] as const;

  const hasStructuredScentNotes = scentColumns.some(
    column => scentNotes[column.key].length > 0
  );

  useEffect(() => {
    setSelectedImage(0);
    setQty(1);
  }, [product?.id]);

  useEffect(() => {
    if (variants.length === 0) {
      setSelectedVariant(undefined);
      return;
    }

    setSelectedVariant(prev => {
      if (
        prev &&
        variants.some(variant => variant.size === prev && variant.stock > 0)
      ) {
        return prev;
      }
      const firstAvailable = variants.find(variant => variant.stock > 0);
      return firstAvailable?.size ?? undefined;
    });
  }, [variants]);

  useEffect(() => {
    setQty(current => {
      if (remainingStock <= 0) {
        return 0;
      }
      return Math.min(Math.max(1, current), remainingStock);
    });
  }, [remainingStock]);

  useEffect(() => {
    if (!product || typeof window === "undefined") {
      return;
    }

    const pageTitle = `${displayName ?? "NOSE"} | NOSE`;
    document.title = pageTitle;

    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute(
        "content",
        displayDesc || `${displayName ?? "NOSE"} by NOSE`
      );
    }

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", window.location.href);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", pageTitle);
    }

    const ogDescription = document.querySelector(
      'meta[property="og:description"]'
    );
    if (ogDescription) {
      ogDescription.setAttribute(
        "content",
        displayDesc || `${displayName ?? "NOSE"} by NOSE`
      );
    }

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && trackableImages[0]) {
      ogImage.setAttribute("content", trackableImages[0]);
    }
  }, [displayDesc, displayName, product, trackableImages]);

  if (isLoading) {
    return (
      <div className="product-detail-page" dir={isRTL ? "rtl" : "ltr"}>
        <div className="product-page-skeleton grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:gap-12">
          <div className="space-y-3">
            <div className="h-[360px] rounded-[18px] border border-[#E6DCCB] bg-[#EDE5D9] md:h-[640px]" />
            <div className="flex gap-2">
              <div className="h-16 w-16 rounded-[14px] bg-[#EDE5D9]" />
              <div className="h-16 w-16 rounded-[14px] bg-[#EDE5D9]" />
              <div className="h-16 w-16 rounded-[14px] bg-[#EDE5D9]" />
              <div className="h-16 w-16 rounded-[14px] bg-[#EDE5D9]" />
              <div className="h-16 w-16 rounded-[14px] bg-[#EDE5D9]" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 w-20 rounded bg-[#EDE5D9]" />
            <div className="h-12 w-3/4 rounded bg-[#EDE5D9]" />
            <div className="h-6 w-24 rounded bg-[#EDE5D9]" />
            <div className="h-20 rounded bg-[#EDE5D9]" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div
        className="product-detail-page flex min-h-[60vh] items-center justify-center"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="glass-panel max-w-xl rounded-[24px] border border-[#E6DCCB] px-6 py-8 text-center">
          <p className="font-heading text-3xl text-[#171311]">
            {t.page_product_not_found}
          </p>
          <p className="mt-3 text-sm text-[#6A645E]">{t.error_generic}</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#171311] px-4 py-2 text-sm font-medium text-[#FFFDF9] transition-colors hover:bg-[#2A241F]"
          >
            <BackIcon size={16} />
            {t.back}
          </Link>
        </div>
      </div>
    );
  }

  const stockMessage =
    remainingStock <= 0
      ? t.product_out_of_stock
      : remainingStock <= 5
        ? t.product_only_x_left.replace("{count}", String(remainingStock))
        : t.product_in_stock;

  const addDisabled = remainingStock <= 0 || qty <= 0;
  const selectedVariantIsUnavailable = Boolean(
    selectedVariant &&
    variants.some(
      variant => variant.size === selectedVariant && variant.stock <= 0
    )
  );

  return (
    <div className="product-detail-page" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-0 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] text-[#6A645E] sm:mb-8">
          <Link href="/" className="transition-colors hover:text-[#171311]">
            {t.nav_home}
          </Link>
          <span>/</span>
          <Link href="/shop" className="transition-colors hover:text-[#171311]">
            {t.nav_shop}
          </Link>
          <span>/</span>
          <span className="text-[#171311]">{displayName}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch lg:gap-10 xl:gap-14">
          <section className="min-w-0 lg:h-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-[24px] border border-[#E8DDCB] bg-[#FCF8F2] lg:flex lg:h-full lg:flex-col"
            >
              <div className="flex h-full min-h-[480px] items-center justify-center overflow-hidden">
                <motion.img
                  key={safeImage}
                  initial={{ opacity: 0.5, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  src={safeImage}
                  alt={displayName ?? "Product image"}
                  className="h-full w-full object-cover"
                />
              </div>

              {trackableImages.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label={isRTL ? "الصورة السابقة" : "Previous image"}
                    onClick={() =>
                      setSelectedImage(current => Math.max(0, current - 1))
                    }
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#D8C8AB] bg-white/85 text-[#171311] shadow-sm transition-colors hover:bg-white"
                  >
                    <PrevIcon size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={isRTL ? "الصورة التالية" : "Next image"}
                    onClick={() =>
                      setSelectedImage(current =>
                        Math.min(trackableImages.length - 1, current + 1)
                      )
                    }
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#D8C8AB] bg-white/85 text-[#171311] shadow-sm transition-colors hover:bg-white"
                  >
                    <NextIcon size={16} />
                  </button>
                </>
              )}
            </motion.div>

            {trackableImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {trackableImages.slice(0, 5).map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    aria-label={
                      isRTL
                        ? `تبديل الصورة ${index + 1}`
                        : `Select image ${index + 1}`
                    }
                    onClick={() => setSelectedImage(index)}
                    className={`min-h-16 min-w-16 overflow-hidden rounded-[12px] border transition-all ${
                      selectedImage === index
                        ? "border-[#B78A46] ring-1 ring-[#B78A46]/35"
                        : "border-[#E6DCCB]"
                    }`}
                  >
                    <img
                      src={img}
                      alt={displayName ?? "Thumbnail"}
                      className="h-16 w-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section
            className={`min-w-0 lg:h-full ${isRTL ? "text-right" : "text-left"}`}
          >
            <div className="flex min-h-0 flex-col lg:h-full rounded-[24px] border border-[#E8DDCB] bg-[#FFFDF9] p-4 shadow-[0_18px_40px_rgba(23,19,17,0.04)] sm:p-6 lg:p-8">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.26em] text-[#B78A46]">
                <span>{displayCategory}</span>
                {product.isNew && (
                  <span className="rounded-full bg-[#ECF3D9] px-2 py-1 text-[#3A4E28]">
                    {t.product_new}
                  </span>
                )}
              </div>

              <div className="mt-4">
                <h1
                  className={`font-heading text-[2.2rem] leading-[0.96] text-[#171311] sm:text-[2.7rem] lg:text-[3.1rem] ${isRTL ? "font-arabic" : ""}`}
                >
                  {displayName}
                </h1>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#A98A67]">
                  {locale === "ar" ? "السعر" : "PRICE"}
                </div>
                <div className="font-heading text-[2rem] text-[#171311] sm:text-[2.3rem] ltr-num">
                  {formatPrice(currentPrice)}
                </div>
                {compareAtPrice && compareAtPrice > currentPrice && (
                  <>
                    <span className="text-[14px] text-[#6A645E] line-through ltr-num">
                      {formatPrice(compareAtPrice)}
                    </span>
                    {discountPercent ? (
                      <span className="rounded-full bg-[#B78A46]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B78A46]">
                        -{discountPercent}%
                      </span>
                    ) : null}
                  </>
                )}
              </div>

              {displayDesc && (
                <p
                  className={`mt-5 max-w-[620px] text-[14px] leading-7 text-[#2F2A24] sm:text-[15px] ${isRTL ? "font-arabic" : ""}`}
                >
                  {displayDesc}
                </p>
              )}

              <div className="mt-8 border-t border-[#E6DCCB] pt-6" />

              {variants.length > 0 && (
                <section className="space-y-3">
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-[0.26em] text-[#B78A46] ${isRTL ? "font-arabic" : ""}`}
                  >
                    {t.product_size}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {variants.map(variant => {
                      const disabled = variant.stock <= 0;
                      const isSelected = selectedVariant === variant.size;
                      return (
                        <button
                          key={variant.size}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSelectedVariant(variant.size)}
                          aria-pressed={isSelected}
                          className={`rounded-[14px] border px-3 py-3 text-left transition-all ${
                            isSelected
                              ? "border-[#B78A46] bg-[#171311] text-[#FFFDF9]"
                              : disabled
                                ? "cursor-not-allowed border-[#E6DCCB] bg-[#F5EFE5] text-[#9C948C]"
                                : "border-[#E6DCCB] bg-white text-[#171311] hover:border-[#B78A46]"
                          }`}
                        >
                          <div className="text-sm font-medium">
                            {variant.size}
                          </div>
                          <div className="mt-1 text-xs ltr-num">
                            {formatPrice(Number(variant.price))}
                          </div>
                          <div
                            className={`mt-1 text-[11px] ${isSelected ? "text-[#F3E7DA]" : "text-[#6A645E]"}`}
                          >
                            {disabled
                              ? t.product_out_of_stock
                              : `${variant.stock} ${t.product_qty}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#B78A46]">
                  {t.product_qty}
                </div>
                <div
                  className={`inline-flex items-center gap-2 text-sm ${availableStock <= 0 ? "text-[#A84D3C]" : "text-[#171311]"}`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  {stockMessage}
                </div>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQty(current => Math.max(1, current - 1))}
                  disabled={qty <= 1}
                  aria-label={isRTL ? "خفض الكمية" : "Decrease quantity"}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E6DCCB] bg-white text-[#171311] transition-colors hover:border-[#B78A46] hover:text-[#B78A46] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus size={16} />
                </button>

                <div className="flex h-10 min-w-14 items-center justify-center rounded-full border border-[#E6DCCB] bg-[#F8F4EE] px-4 text-base font-semibold ltr-num">
                  {qty}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setQty(current => Math.min(remainingStock, current + 1))
                  }
                  disabled={qty >= remainingStock || remainingStock === 0}
                  aria-label={isRTL ? "زيادة الكمية" : "Increase quantity"}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E6DCCB] bg-white text-[#171311] transition-colors hover:border-[#B78A46] hover:text-[#B78A46] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  onClick={() => {
                    if (addDisabled) return;
                    const requestedQty = Math.min(
                      Math.max(1, qty),
                      remainingStock
                    );
                    if (requestedQty <= 0) return;
                    if (requestedQty !== qty) {
                      setQty(requestedQty);
                    }
                    addItem({
                      productId: product.id,
                      nameEn: product.nameEn,
                      nameAr: product.nameAr,
                      image: safeImage,
                      price: currentPrice,
                      variant: selectedVariant,
                      quantity: requestedQty,
                      stockQuantity: availableStock,
                    });
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
                        position:
                          window.innerWidth < 768
                            ? "bottom-center"
                            : "bottom-right",
                        className:
                          "!bg-transparent !shadow-none !p-0 !border-0",
                      }
                    );
                  }}
                  disabled={addDisabled || selectedVariantIsUnavailable}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#171311] text-[12px] font-semibold uppercase tracking-[0.24em] text-[#FFFDF9] transition-colors hover:bg-[#2A241F]"
                >
                  <ShoppingBag size={16} />
                  {availableStock > 0
                    ? t.product_add_to_cart
                    : t.product_out_of_stock}
                </Button>
              </div>

              <div className="mt-4 flex items-center gap-3 overflow-hidden text-[10px] leading-none text-[#2F2A24]">
                <div className="inline-flex min-w-0 shrink-0 items-center gap-1 border-l border-[#E6DCCB] pl-3 first:border-l-0 first:pl-0">
                  <ShieldCheck size={14} className="text-[#B78A46]" />
                  <span className="whitespace-nowrap">
                    {t.product_secure_checkout}
                  </span>
                </div>
                <div className="inline-flex min-w-0 shrink-0 items-center gap-1 border-l border-[#E6DCCB] pl-3 first:border-l-0 first:pl-0">
                  <Truck size={14} className="text-[#B78A46]" />
                  <span className="whitespace-nowrap">
                    {t.product_delivery_uae}
                  </span>
                </div>
                <div className="inline-flex min-w-0 shrink-0 items-center gap-1 border-l border-[#E6DCCB] pl-3 first:border-l-0 first:pl-0">
                  <BadgeCheck size={14} className="text-[#B78A46]" />
                  <span className="whitespace-nowrap">
                    {t.product_authentic_products}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {related.length > 0 && (
          <section className="mt-14 md:mt-20">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2
                className={`font-heading text-[2rem] text-[#171311] sm:text-[2.4rem] ${isRTL ? "font-arabic" : ""}`}
              >
                {locale === "ar" ? "قد يعجبك أيضاً" : "You May Also Like"}
              </h2>
            </div>
            <div className="relative">
              <Carousel opts={carouselOptions} className="overflow-visible">
                <CarouselContent className="pb-6">
                  {related.map(relatedProduct => (
                    <CarouselItem
                      key={relatedProduct.id}
                      className="min-w-[80%] sm:min-w-[45%] md:min-w-[32%] xl:min-w-[24%]"
                    >
                      <ProductCard
                        id={relatedProduct.id}
                        nameEn={relatedProduct.nameEn}
                        nameAr={relatedProduct.nameAr}
                        price={relatedProduct.price}
                        compareAtPrice={relatedProduct.compareAtPrice}
                        images={
                          Array.isArray(relatedProduct.images)
                            ? relatedProduct.images
                            : []
                        }
                        isNew={relatedProduct.isNew}
                        stockQuantity={Number(
                          relatedProduct.stockQuantity ?? 0
                        )}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious
                  className={isRTL ? "-right-12 left-auto" : "-left-12"}
                />
                <CarouselNext
                  className={isRTL ? "-left-12 right-auto" : "-right-12"}
                />
              </Carousel>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
