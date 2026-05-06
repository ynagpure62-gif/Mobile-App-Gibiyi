import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface CartItem {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  isInCart: (id: number) => boolean;
  totalAmount: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "@logo_store_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data) => {
        if (data) setItems(JSON.parse(data));
      })
      .catch(() => {});
  }, []);

  const persist = useCallback((newItems: CartItem[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems)).catch(() => {});
  }, []);

  const addItem = useCallback(
    (item: CartItem) => {
      setItems((prev) => {
        if (prev.find((i) => i.id === item.id)) return prev;
        const next = [...prev, item];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeItem = useCallback(
    (id: number) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const isInCart = useCallback(
    (id: number) => items.some((i) => i.id === id),
    [items],
  );

  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        isInCart,
        totalAmount,
        itemCount,
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
