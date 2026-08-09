import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface CartItem {
  productId: number;
  nameEn: string;
  nameAr: string;
  image: string;
  price: number;
  variant?: string;
  quantity: number;
  stockQuantity?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, variant?: string) => void;
  updateQuantity: (
    productId: number,
    variant: string | undefined,
    qty: number
  ) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "nose_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const itemKey = (productId: number, variant?: string) =>
    `${productId}:${variant ?? ""}`;

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const key = itemKey(item.productId, item.variant);
      const existing = prev.find(i => itemKey(i.productId, i.variant) === key);
      const stockLimit = item.stockQuantity;
      const requestedQuantity = existing
        ? existing.quantity + item.quantity
        : item.quantity;
      const quantity =
        typeof stockLimit === "number" && Number.isFinite(stockLimit)
          ? Math.min(requestedQuantity, Math.max(0, stockLimit))
          : requestedQuantity;

      if (quantity <= 0) return prev;

      if (existing) {
        return prev.map(i =>
          itemKey(i.productId, i.variant) === key
            ? { ...i, quantity, stockQuantity: item.stockQuantity }
            : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeItem = (productId: number, variant?: string) => {
    const key = itemKey(productId, variant);
    setItems(prev => prev.filter(i => itemKey(i.productId, i.variant) !== key));
  };

  const updateQuantity = (
    productId: number,
    variant: string | undefined,
    qty: number
  ) => {
    const key = itemKey(productId, variant);
    if (qty <= 0) {
      setItems(prev =>
        prev.filter(i => itemKey(i.productId, i.variant) !== key)
      );
    } else {
      setItems(prev =>
        prev.map(i =>
          itemKey(i.productId, i.variant) === key
            ? {
                ...i,
                quantity:
                  typeof i.stockQuantity === "number" &&
                  Number.isFinite(i.stockQuantity)
                    ? Math.min(qty, Math.max(0, i.stockQuantity))
                    : qty,
              }
            : i
        )
      );
    }
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
