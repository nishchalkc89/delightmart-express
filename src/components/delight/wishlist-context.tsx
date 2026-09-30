import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from './auth-context';
import { fetchProductsByIds } from '@/services/catalog';
import { supabase } from '@/services/supabase';
import type { Product } from '@/types/store';

type WishlistValue = { items: Product[]; count: number; has: (id: string) => boolean; toggle: (p: Product) => void; remove: (id: string) => void };

const WishlistContext = createContext<WishlistValue | undefined>(undefined);
const KEY = 'delight-wishlist';

/**
 * Saved items. Kept on the device for everyone; for signed-in customers it is also saved to their account
 * (wishlist_items), so it follows them to other phones and computers.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  const synced = useRef<string | null>(null);

  useEffect(() => {
    try { const saved = localStorage.getItem(KEY); if (saved) setItems(JSON.parse(saved) as Product[]); } catch { /* storage unavailable */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
  }, [items, ready]);

  // After sign-in: add this device's saved items to the account, then show the account's full list with current prices.
  useEffect(() => {
    if (!ready || !user || synced.current === user.id) return;
    synced.current = user.id;
    void (async () => {
      const local = items.map((p) => p.id);
      if (local.length) await supabase.from('wishlist_items').upsert(local.map((product_id) => ({ user_id: user.id, product_id })), { onConflict: 'user_id,product_id', ignoreDuplicates: true });
      const { data, error } = await supabase.from('wishlist_items').select('product_id,created_at').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) return; // table not set up yet: keep the device list
      try { setItems(await fetchProductsByIds((data ?? []).map((r) => r.product_id))); } catch { /* keep device list */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);
  useEffect(() => { if (!user) synced.current = null; }, [user]);

  const remove = useCallback((id: string) => {
    setItems((v) => v.filter((p) => p.id !== id));
    if (user) void supabase.from('wishlist_items').delete().eq('user_id', user.id).eq('product_id', id);
  }, [user]);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const toggle = useCallback((p: Product) => {
    const saved = itemsRef.current.some((x) => x.id === p.id);
    if (saved) {
      setItems((v) => v.filter((x) => x.id !== p.id));
      if (user) void supabase.from('wishlist_items').delete().eq('user_id', user.id).eq('product_id', p.id);
      toast('Removed from your wishlist');
    } else {
      setItems((v) => [p, ...v.filter((x) => x.id !== p.id)]);
      if (user) void supabase.from('wishlist_items').insert({ user_id: user.id, product_id: p.id });
      toast.success('Saved to your wishlist');
    }
  }, [user]);

  const value = useMemo<WishlistValue>(() => ({ items, count: items.length, has: (id) => items.some((p) => p.id === id), toggle, remove }), [items, toggle, remove]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error('useWishlist requires WishlistProvider');
  return value;
}
