import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartLine, Product } from '@/types/store';

type RefreshResult = { removed: string[]; priceChanged: string[]; reduced: string[] };
type CartValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (p: Product, q?: number) => void;
  setQuantity: (id: string, q: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Replace saved products with their current details; drops items that are gone or sold out. */
  refresh: (current: Product[]) => RefreshResult;
};

const CartContext = createContext<CartValue | undefined>(undefined);
const KEY = 'delight-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setLines((JSON.parse(saved) as CartLine[]).filter((l) => l.quantity > 0));
    } catch { /* storage unavailable */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage unavailable (private mode) */ }
  }, [lines, ready]);

  const value = useMemo<CartValue>(() => ({
    lines,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal: lines.reduce((s, l) => s + l.quantity * l.product.price, 0),
    add: (p, q = 1) => {
      if (p.stock <= 0 || q <= 0) return;
      setLines((v) => {
        const found = v.find((x) => x.product.id === p.id);
        return found
          ? v.map((x) => (x.product.id === p.id ? { product: p, quantity: Math.min(x.quantity + q, p.stock) } : x))
          : [...v, { product: p, quantity: Math.min(q, p.stock) }];
      });
    },
    setQuantity: (id, q) => setLines((v) => (q < 1 ? v.filter((x) => x.product.id !== id) : v.map((x) => (x.product.id === id ? { ...x, quantity: Math.min(q, x.product.stock) } : x)))),
    remove: (id) => setLines((v) => v.filter((x) => x.product.id !== id)),
    clear: () => setLines([]),
    refresh: (current) => {
      const byId = new Map(current.map((p) => [p.id, p]));
      const result: RefreshResult = { removed: [], priceChanged: [], reduced: [] };
      const next: CartLine[] = [];
      for (const line of lines) {
        const p = byId.get(line.product.id);
        if (!p || p.stock <= 0) { result.removed.push(line.product.name); continue; }
        if (p.price !== line.product.price) result.priceChanged.push(p.name);
        const quantity = Math.min(line.quantity, p.stock);
        if (quantity < line.quantity) result.reduced.push(p.name);
        next.push({ product: p, quantity });
      }
      setLines(next);
      return result;
    },
  }), [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart requires CartProvider');
  return value;
}
