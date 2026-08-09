import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import ProductCard from "@/components/ProductCard";
import { Search, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearch } from "wouter";

type SortOption = "newest" | "price_asc" | "price_desc";

export default function ShopPage() {
  const { t, isRTL } = useI18n();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);

  const [searchQuery, setSearchQuery] = useState(params.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [sort, setSort] = useState<SortOption>("newest");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const filter = params.get("filter") ?? "";

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: products, isLoading } = trpc.products.list.useQuery({
    search: debouncedSearch || undefined,
    category: category || undefined,
    ...(filter === "new" ? { isNew: true, active: true } : {}),
  });

  const sortedProducts = products
    ? [...products].sort((a, b) => {
        if (sort === "price_asc")
          return parseFloat(String(a.price)) - parseFloat(String(b.price));
        if (sort === "price_desc")
          return parseFloat(String(b.price)) - parseFloat(String(a.price));
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
    : [];

  const categories = [
    { value: "", labelEn: t.filter_all, labelAr: t.filter_all },
    { value: "men", labelEn: t.category_men, labelAr: t.category_men },
    { value: "women", labelEn: t.category_women, labelAr: t.category_women },
    { value: "gifts", labelEn: t.category_gifts, labelAr: t.category_gifts },
  ];

  const activeCategoryLabel =
    categories.find(item => item.value === category)?.[
      isRTL ? "labelAr" : "labelEn"
    ] ?? (isRTL ? "الكل" : "All");

  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(183,138,69,0.12),_transparent_30%),linear-gradient(135deg,#FBF7F2_0%,#F6EFE6_100%)] py-6 sm:py-8 lg:py-12"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-[24px] border border-[#E7DDD0] bg-white/80 p-3 shadow-sm backdrop-blur sm:p-4">
          <div
            className={`flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between ${isRTL ? "lg:flex-row-reverse" : ""}`}
          >
            <div
              className={`flex flex-1 flex-col gap-3 sm:flex-row ${isRTL ? "sm:flex-row-reverse" : ""}`}
            >
              <div className="relative flex-1">
                <Search
                  size={15}
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#8A8078] ${isRTL ? "right-3" : "left-3"}`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t.nav_search_placeholder}
                  className={`w-full rounded-full border border-[#E7DDD0] bg-[#FBF7F2] py-2.5 pr-10 pl-10 text-sm text-[#2E2A25] shadow-sm outline-none transition focus:border-[#B78A45] focus:ring-2 focus:ring-[#B78A45]/15 ${isRTL ? "text-right font-arabic" : ""}`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div
                className={`flex flex-wrap gap-2 ${isRTL ? "justify-end" : "justify-start"}`}
              >
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
                      category === cat.value
                        ? "border-[#171311] bg-[#171311] text-white shadow-sm"
                        : "border-[#E7DDD0] bg-white text-[#2E2A25] hover:border-[#B78A45] hover:bg-[#F8EFE6]"
                    } ${isRTL ? "font-arabic" : ""}`}
                  >
                    {isRTL ? cat.labelAr : cat.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div
                key={i}
                className="animate-pulse rounded-[24px] border border-[#E7DDD0] bg-white p-3"
              >
                <div className="aspect-[4/5] rounded-[18px] bg-[#EAE4DC]" />
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-[#EAE4DC]" />
                  <div className="h-3 w-1/2 rounded-full bg-[#EAE4DC]" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div
            className={`rounded-[24px] border border-dashed border-[#D8CDBB] bg-white/70 py-16 text-center text-[#8A8078] ${isRTL ? "font-arabic" : ""}`}
          >
            <p className="text-lg font-semibold text-[#2E2A25]">
              {isRTL
                ? "لا توجد منتجات متوافقة مع التصفية الحالية"
                : "No products match the current filters"}
            </p>
            <p className="mt-2 text-sm">
              {isRTL
                ? "جرب تصنيفاً أو كلمة بحث مختلفة."
                : "Try a different category or search term."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
            {sortedProducts.map(p => (
              <ProductCard key={p.id} {...p} images={p.images as string[]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
