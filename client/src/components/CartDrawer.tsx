import { useI18n } from "@/contexts/I18nContext";
import { useCart } from "@/contexts/CartContext";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function CartDrawer() {
  const { t, isRTL, formatPrice } = useI18n();
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    subtotal,
    totalItems,
  } = useCart();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1140] bg-black/30 transition-opacity"
        onClick={closeCart}
      />
      {/* Drawer */}
      <div
        className={`fixed top-0 ${isRTL ? "left-0" : "right-0"} z-[1150] flex h-full w-full max-w-sm flex-col bg-[#FBF7F2] shadow-2xl`}
        style={{ animation: "slideIn 250ms cubic-bezier(0.23,1,0.32,1)" }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(${isRTL ? "-100%" : "100%"}); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE4DC] px-5 py-4">
          <h2
            className={`font-heading text-xl font-light text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
          >
            {t.cart_title}
            {totalItems > 0 && (
              <span className="ms-2 text-sm font-sans text-[#8A8078] ltr-num">
                ({totalItems})
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#8A8078] transition-colors hover:bg-[#F3EBDD] hover:text-[#2E2A25]"
            aria-label={isRTL ? "إغلاق السلة" : "Close cart"}
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-[#8A8078]">
              <ShoppingBag size={48} strokeWidth={1} />
              <p className={`text-sm ${isRTL ? "font-arabic" : ""}`}>
                {t.cart_empty}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-[#2E2A25] text-[#2E2A25] hover:bg-[#2E2A25] hover:text-white"
                onClick={closeCart}
              >
                {t.cart_continue}
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map(item => (
                <li
                  key={`${item.productId}:${item.variant ?? ""}`}
                  className="flex gap-3"
                >
                  {/* Image */}
                  <div className="w-16 h-20 bg-[#EAE4DC] rounded overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={isRTL ? item.nameAr : item.nameEn}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#C9B8E8]/30 to-[#A9C9A5]/30" />
                    )}
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium text-[#2E2A25] truncate ${isRTL ? "font-arabic text-right" : ""}`}
                    >
                      {isRTL ? item.nameAr : item.nameEn}
                    </p>
                    {item.variant && (
                      <p className="text-xs text-[#8A8078] mt-0.5">
                        {item.variant}
                      </p>
                    )}
                    <p className="text-sm text-[#8B76B8] mt-1 ltr-num font-medium">
                      {formatPrice(item.price)}
                    </p>
                    {/* Qty controls */}
                    <div
                      className={`flex items-center gap-2 mt-2 ${isRTL ? "flex-row-reverse justify-end" : ""}`}
                    >
                      <button
                        className="w-6 h-6 rounded border border-[#EAE4DC] flex items-center justify-center text-[#2E2A25] hover:bg-[#EAE4DC] transition-colors"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variant,
                            item.quantity - 1
                          )
                        }
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-sm w-6 text-center ltr-num">
                        {item.quantity}
                      </span>
                      <button
                        className="w-6 h-6 rounded border border-[#EAE4DC] flex items-center justify-center text-[#2E2A25] hover:bg-[#EAE4DC] transition-colors"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variant,
                            item.quantity + 1
                          )
                        }
                        disabled={
                          typeof item.stockQuantity === "number" &&
                          item.quantity >= item.stockQuantity
                        }
                        aria-label="Increase quantity"
                      >
                        <Plus size={10} />
                      </button>
                      <button
                        className="ms-auto text-xs text-[#8A8078] hover:text-red-500 transition-colors"
                        onClick={() => removeItem(item.productId, item.variant)}
                      >
                        {t.cart_remove}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-[#EAE4DC] space-y-3">
            <div
              className={`flex items-center justify-between text-sm ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <span className={`text-[#8A8078] ${isRTL ? "font-arabic" : ""}`}>
                {t.cart_subtotal}
              </span>
              <span className="font-medium text-[#2E2A25] ltr-num">
                {formatPrice(subtotal)}
              </span>
            </div>
            <Button
              className="w-full bg-[#2E2A25] hover:bg-[#4A3F35] text-white rounded-sm"
              onClick={() => {
                closeCart();
                navigate("/checkout");
              }}
            >
              <span className={isRTL ? "font-arabic" : ""}>
                {t.cart_checkout}
              </span>
            </Button>
            <button
              className={`w-full text-xs text-[#8A8078] hover:text-[#2E2A25] transition-colors ${isRTL ? "font-arabic" : ""}`}
              onClick={closeCart}
            >
              {t.cart_continue}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
