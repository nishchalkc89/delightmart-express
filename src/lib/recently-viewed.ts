import { useEffect, useState } from 'react';
import type { Product } from '@/types/store';

const KEY = 'delight-recently-viewed';
const MAX = 12;

function read(): Product[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Product[]; } catch { return []; }
}

/** Remember a product the shopper opened (newest first, on this device only). */
export function rememberViewed(p: Product) {
  try { localStorage.setItem(KEY, JSON.stringify([p, ...read().filter((x) => x.id !== p.id)].slice(0, MAX))); } catch { /* storage unavailable */ }
}

/** Products this device viewed recently, optionally leaving one out (e.g. the product being shown). */
export function useRecentlyViewed(exclude?: string) {
  const [list, setList] = useState<Product[]>([]);
  useEffect(() => { setList(read().filter((p) => p.id !== exclude)); }, [exclude]);
  return list;
}
