import { createIsomorphicFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { STORE } from './store-info';

/** A Delight store (Tulsipur, Ghorahi…). Products are shared; stock, delivery and contact details are per store. */
export type Branch = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  mapsUrl: string | null;
  lat: number | null;
  lng: number | null;
  opens: string | null;
  closes: string | null;
  deliveryFee: number;
  crossFee: number;
  minOrder: number;
  minutes: number;
  deliveryAvailable: boolean;
  acceptingOrders: boolean;
};

export const BRANCH_COOKIE = 'delight_branch';
export const DEFAULT_BRANCH = 'tulsipur';
const VALID = /^[a-z][a-z0-9-]{1,30}$/;

/** Used until the database answers (and if the stores table is not set up yet). */
export const FALLBACK_BRANCHES: Branch[] = [
  { id: 'tulsipur', name: 'Delight Shopping Mart – Tulsipur', city: 'Tulsipur', address: STORE.address, phone: STORE.phone, whatsapp: STORE.whatsapp, email: STORE.email, mapsUrl: STORE.mapsUrl, lat: STORE.lat, lng: STORE.lng, opens: '07:00', closes: '21:00', deliveryFee: 0, crossFee: 100, minOrder: 0, minutes: 45, deliveryAvailable: true, acceptingOrders: true },
  { id: 'ghorahi', name: 'Delight Shopping Mart – Ghorahi', city: 'Ghorahi', address: 'Ghorahi, Dang, Lumbini Province, Nepal', phone: null, whatsapp: null, email: null, mapsUrl: null, lat: null, lng: null, opens: '07:00', closes: '21:00', deliveryFee: 0, crossFee: 100, minOrder: 0, minutes: 45, deliveryAvailable: true, acceptingOrders: false },
];

const readCookie = createIsomorphicFn()
  .server(() => getCookie(BRANCH_COOKIE) ?? null)
  .client(() => {
    try { return document.cookie.match(/(?:^|;\s*)delight_branch=([^;]+)/)?.[1] ?? null; } catch { return null; }
  });

/** True once the shopper has picked a store (the cookie is set). */
export function hasChosenBranch(): boolean {
  const v = readCookie();
  return Boolean(v && VALID.test(v));
}

/** The shopper's store, from the cookie (works on the server and in the browser). */
export function currentBranchId(): string {
  const v = readCookie();
  return v && VALID.test(v) ? v : DEFAULT_BRANCH;
}

export function writeBranchCookie(id: string) {
  if (!VALID.test(id)) return;
  document.cookie = `${BRANCH_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
}

type BranchRow = {
  id: string; name: string; city: string; address: string; phone: string | null; whatsapp: string | null; email: string | null; maps_url: string | null;
  latitude: number | null; longitude: number | null; opening_time: string | null; closing_time: string | null; delivery_fee: number; cross_branch_fee: number;
  min_order: number; estimated_delivery_minutes: number; delivery_available: boolean; accepting_orders: boolean;
};

export const BRANCH_COLUMNS = 'id,name,city,address,phone,whatsapp,email,maps_url,latitude,longitude,opening_time,closing_time,delivery_fee,cross_branch_fee,min_order,estimated_delivery_minutes,delivery_available,accepting_orders';

export function branchFromRow(r: BranchRow): Branch {
  return {
    id: r.id, name: r.name, city: r.city, address: r.address, phone: r.phone, whatsapp: r.whatsapp, email: r.email, mapsUrl: r.maps_url,
    lat: r.latitude === null ? null : Number(r.latitude), lng: r.longitude === null ? null : Number(r.longitude),
    opens: r.opening_time?.slice(0, 5) ?? null, closes: r.closing_time?.slice(0, 5) ?? null,
    deliveryFee: Number(r.delivery_fee), crossFee: Number(r.cross_branch_fee), minOrder: Number(r.min_order), minutes: Number(r.estimated_delivery_minutes),
    deliveryAvailable: r.delivery_available, acceptingOrders: r.accepting_orders,
  };
}

/** All stores in display order. Falls back to the built-in list if the database is not reachable. */
export async function fetchBranches(): Promise<Branch[]> {
  try {
    const { supabase, isSupabaseConfigured } = await import('@/services/supabase');
    if (!isSupabaseConfigured) return FALLBACK_BRANCHES;
    const { data, error } = await supabase.from('branches').select(BRANCH_COLUMNS).order('sort_order');
    if (error || !data?.length) return FALLBACK_BRANCHES;
    return (data as BranchRow[]).map(branchFromRow);
  } catch {
    return FALLBACK_BRANCHES;
  }
}

/** Short store label, e.g. "Tulsipur". */
export const branchCity = (branches: Branch[], id: string) => branches.find((b) => b.id === id)?.city ?? id.charAt(0).toUpperCase() + id.slice(1);

/** Extra delivery fee when the delivery town is another store's town. */
export function crossFeeFor(branches: Branch[], storeId: string, deliveryCity: string): number {
  const store = branches.find((b) => b.id === storeId);
  const city = deliveryCity.trim().toLowerCase();
  if (!store || !city) return 0;
  return branches.some((b) => b.id !== store.id && b.city.toLowerCase() === city) ? store.crossFee : 0;
}

/** "7:00 AM – 9:00 PM" */
export function hoursText(b: Pick<Branch, 'opens' | 'closes'>): string {
  const t = (v: string | null) => {
    if (!v) return '';
    const [h = 0, m = 0] = v.split(':').map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  };
  return b.opens && b.closes ? `${t(b.opens)} – ${t(b.closes)}` : '';
}
