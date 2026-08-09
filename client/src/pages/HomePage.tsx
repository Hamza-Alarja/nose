import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import ProductCard from "@/components/ProductCard";
import MobileIntroVideo from "@/components/MobileIntroVideo";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import menImage from "../men.png";
import femaleImage from "../female.png";
import giftsImage from "../gifts.png";

const collections = [
  {
    nameEn: "Men's Perfumes",
    nameAr: "عطور رجالية",
    color: "#E8D8C3",
    image: menImage,
    href: "/shop?category=men",
  },
  {
    nameEn: "Women's Perfumes",
    nameAr: "عطور نسائية",
    color: "#E9DFF2",
    image: femaleImage,
    href: "/shop?category=women",
  },
  {
    nameEn: "Gifts",
    nameAr: "هدايا",
    color: "#EFD8C7",
    image: giftsImage,
    href: "/shop?category=gifts",
  },
];

export default function HomePage() {
  const { t, isRTL, locale } = useI18n();

  const { data: newArrivals = [], isLoading: isNewArrivalsLoading } =
    trpc.products.list.useQuery({ active: true, isNew: true });
  const { data: featuredProducts = [] } = trpc.products.list.useQuery({
    active: true,
  });

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const storyImage =
    (featuredProducts?.[0]?.images as string[] | undefined)?.[0] ??
    (newArrivals?.[0]?.images as string[] | undefined)?.[0] ??
    "";

  return (
    <div className="min-h-screen bg-transparent">
      <MobileIntroVideo />
      <section className="hero-section relative border-b border-[#E8DED1]">
        <div className="hero-wallpaper">
          <div className="hero-inner relative z-10 flex">
            <div className="container flex w-full items-center">
              <div
                dir="ltr"
                className="grid w-full min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.45 }}
                  dir={isRTL ? "rtl" : "ltr"}
                  className={`hero-content flex min-w-0 w-full max-w-[700px] flex-col items-start text-left ${isRTL ? "items-end text-right" : ""}`}
                ></motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.08 }}
                  className="hidden min-h-[340px] lg:block"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <div className="container">
          <div className={`mb-10 flex items-end justify-between `}>
            <div className={isRTL ? "text-right" : ""}>
              <p className="mb-1 text-[11px] uppercase tracking-[0.32em] text-[#7A6752]">
                {locale === "ar" ? "الجديد" : "New"}
              </p>
              <h2
                className={`font-heading text-3xl font-light text-[#171311] md:text-4xl ${isRTL ? "font-arabic" : ""}`}
              >
                {t.section_new_arrivals}
              </h2>
            </div>
            <Link href="/shop?filter=new">
              <span
                className={`flex items-center gap-1 text-xs font-medium text-[#B78A45] transition-colors hover:text-[#171311] ${isRTL ? "flex-row-reverse font-arabic" : ""}`}
              >
                {t.see_all} <ArrowIcon size={12} />
              </span>
            </Link>
          </div>

          {isNewArrivalsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="animate-pulse rounded-[1.25rem] border border-[#E8DDCB] bg-white p-3"
                >
                  <div className="aspect-4/5 rounded-[1rem] bg-[#F4EBDD]" />
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-[#F4EBDD]" />
                    <div className="h-3 w-1/2 rounded bg-[#F4EBDD]" />
                  </div>
                </div>
              ))}
            </div>
          ) : newArrivals.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-2.5 pb-3 md:hidden">
                {newArrivals.slice(0, 4).map(p => (
                  <div key={p.id} className="min-w-0">
                    <ProductCard {...p} images={p.images as string[]} />
                  </div>
                ))}
              </div>
              <div className="hidden max-w-[760px] md:mx-auto md:grid md:grid-cols-3 md:gap-4 lg:hidden">
                {newArrivals.slice(0, 2).map(p => (
                  <ProductCard
                    key={p.id}
                    {...p}
                    images={p.images as string[]}
                  />
                ))}
              </div>
              <div className="hidden max-w-[1120px] lg:mx-auto lg:grid lg:grid-cols-4 lg:gap-5">
                {newArrivals.slice(0, 4).map(p => (
                  <ProductCard
                    key={p.id}
                    {...p}
                    images={p.images as string[]}
                  />
                ))}
              </div>
            </>
          ) : (
            <div
              className={`rounded-[1.25rem] border border-[#E8DDCB] bg-white py-12 text-center text-[#5F584F] ${isRTL ? "font-arabic" : ""}`}
            >
              <p className="text-sm">
                {locale === "ar"
                  ? "لا توجد عروض جديدة بعد."
                  : "No new arrivals yet."}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#F7EFE5] px-4 py-16 sm:px-6 lg:px-8">
        <div className="container">
          <div className={`mb-10 ${isRTL ? "text-right" : ""}`}>
            <p className="mb-1 text-[11px] uppercase tracking-[0.32em] text-[#7A6752]">
              {locale === "ar" ? "تصفح" : "Browse"}
            </p>
            <h2
              className={`font-heading text-3xl font-light text-[#171311] md:text-4xl ${isRTL ? "font-arabic" : ""}`}
            >
              {t.section_collections}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {collections.map(col => (
              <Link key={col.nameEn} href={col.href}>
                <motion.div
                  transition={{ duration: 0.25 }}
                  className="group overflow-hidden rounded-[1.75rem] border border-[#E8DDCB] bg-white shadow-[0_14px_30px_rgba(23,19,17,0.08)]"
                  style={{ backgroundColor: `${col.color}80` }}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={col.image}
                      alt={isRTL ? col.nameAr : col.nameEn}
                      loading="lazy"
                      className="h-[140px] w-full object-cover transition-transform duration-500 ease-out sm:h-[160px] lg:h-[180px]"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[rgba(255,255,255,0.92)] to-transparent" />
                  </div>
                  <div
                    className={`relative z-10 flex min-h-[calc(100%-140px)] flex-col justify-between gap-4 p-6 text-[#171311] ${isRTL ? "text-right" : "text-left"}`}
                  >
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.32em] text-[#7A6752]">
                        {locale === "ar" ? "مجموعة" : "Collection"}
                      </p>
                      <h3
                        className={`mt-3 font-heading text-2xl font-light leading-tight ${isRTL ? "font-arabic" : ""}`}
                      >
                        {isRTL ? col.nameAr : col.nameEn}
                      </h3>
                    </div>
                    <div
                      className={`flex items-center justify-between gap-2 text-sm ${isRTL ? "flex-row-reverse justify-end font-arabic" : ""}`}
                    >
                      <span className="font-medium text-[#5F584F]">
                        {t.see_all}
                      </span>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FFFDF9] text-[#B78A45] shadow-[0_8px_20px_rgba(183,138,69,0.12)]">
                        <ArrowIcon size={14} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <div className="container">
          <div className={`mb-10 flex items-end justify-between `}>
            <div className={isRTL ? "text-right" : ""}>
              <p className="mb-1 text-[11px] uppercase tracking-[0.32em] text-[#7A6752]">
                {locale === "ar" ? "الأكثر طلباً" : "Top Picks"}
              </p>
              <h2
                className={`font-heading text-3xl font-light text-[#171311] md:text-4xl ${isRTL ? "font-arabic" : ""}`}
              >
                {t.section_bestsellers}
              </h2>
            </div>
            <Link href="/shop">
              <span
                className={`flex items-center gap-1 text-xs font-medium text-[#B78A45] transition-colors hover:text-[#171311] ${isRTL ? "flex-row-reverse font-arabic" : ""}`}
              >
                {t.see_all} <ArrowIcon size={12} />
              </span>
            </Link>
          </div>

          {featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
              {featuredProducts.slice(0, 4).map(p => (
                <ProductCard key={p.id} {...p} images={p.images as string[]} />
              ))}
            </div>
          ) : (
            <div
              className={`rounded-[1.25rem] border border-[#E8DDCB] bg-white py-12 text-center text-[#5F584F] ${isRTL ? "font-arabic" : ""}`}
            >
              <p className="text-sm">
                {locale === "ar" ? "لا توجد منتجات بعد" : "No products yet."}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden rounded-[1.6rem] border border-[#E8DDCB] bg-[linear-gradient(120deg,#FFFDF9_0%,#F7EFE5_100%)] shadow-[0_10px_24px_rgba(23,19,17,0.04)]"
          ></motion.div>
        </div>
      </section>
    </div>
  );
}
