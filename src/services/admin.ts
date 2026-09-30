import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/delight/auth-context';
import type { Database } from '@/integrations/supabase/types';
import { supabase } from './supabase';
import { products as demoCatalog } from './catalog';

export type OrderStatusDb = Database['public']['Enums']['order_status'];
export const ORDER_STATUSES: OrderStatusDb[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'FAILED'];

/* ------------------------------------------------------------------ */
/* Shapes used by the admin screens                                    */
/* ------------------------------------------------------------------ */

export type AdminOrder = {
  id: string; number: string; status: OrderStatusDb; total: number; subtotal: number; discount: number; deliveryFee: number;
  paymentMethod: string; createdAt: string; instructions: string;
  customer: { name: string; phone: string; email: string };
  items: { name: string; quantity: number; unitPrice: number; lineTotal: number; image: string }[];
};

export type AdminProduct = {
  id: string; name: string; slug: string; sku: string; category: string; price: number; oldPrice: number;
  stock: number; threshold: number; active: boolean; image: string; updatedAt: string;
  /** True when the product has its own photo (not a sample-data picture). */
  hasPhoto?: boolean;
  /** Units sold in orders that were not cancelled. */
  sold?: number;
};

export type AdminCustomer = { id: string; name: string; phone: string; email: string; orders: number; spent: number; lastOrder: string | null; joined: string; status: string; avatar: string | null };

const imageBySlug = new Map(demoCatalog.map((p) => [p.slug, p.image]));
const imageByName = new Map(demoCatalog.map((p) => [p.name.toLowerCase(), p.image]));

/* ------------------------------------------------------------------ */
/* Reads (RLS returns rows only for staff accounts)                    */
/* ------------------------------------------------------------------ */

export async function fetchAdminOrders(limit = 1000): Promise<AdminOrder[]> {
  const { data, error } = await supabase.from('orders')
    .select('id,order_number,status,total,subtotal,discount,delivery_fee,payment_method,created_at,delivery_instructions,user_id,order_items(product_name,quantity,unit_price,line_total)')
    .order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  const ids = [...new Set((data ?? []).map((o) => o.user_id))];
  const { data: people } = ids.length ? await supabase.from('profiles').select('id,full_name,phone,email').in('id', ids) : { data: [] };
  const byId = new Map((people ?? []).map((p) => [p.id, p]));
  return (data ?? []).map((o) => {
    const p = byId.get(o.user_id);
    const phone = p?.phone ?? /Phone: ([0-9+ ]+)/.exec(o.delivery_instructions ?? '')?.[1]?.trim() ?? '';
    const recipient = /Recipient: ([^.]+)\./.exec(o.delivery_instructions ?? '')?.[1]?.trim();
    return {
      id: o.id, number: o.order_number, status: o.status, total: Number(o.total), subtotal: Number(o.subtotal), discount: Number(o.discount), deliveryFee: Number(o.delivery_fee),
      paymentMethod: o.payment_method, createdAt: o.created_at, instructions: o.delivery_instructions ?? '',
      customer: { name: p?.full_name || recipient || 'Customer', phone, email: p?.email ?? '' },
      items: o.order_items.map((i) => ({ name: i.product_name, quantity: i.quantity, unitPrice: Number(i.unit_price), lineTotal: Number(i.line_total), image: imageByName.get(i.product_name.toLowerCase()) ?? '' })),
    };
  });
}

const ADMIN_PRODUCT_COLUMNS = 'id,name,slug,sku,price,sale_price,status,updated_at,categories(name),inventory(current_stock,reserved_stock,low_stock_threshold,last_updated),product_images(url,is_primary)';

/** All products for the admin screens, read 1000 at a time (the database's page limit). */
async function fetchAllProductRows() {
  const { count, error } = await supabase.from('products').select('id', { count: 'exact', head: true });
  if (error) throw error;
  const pages = Math.max(1, Math.ceil((count ?? 0) / 1000));
  const results = await Promise.all(Array.from({ length: pages }, (_, i) => supabase.from('products').select(ADMIN_PRODUCT_COLUMNS).order('name').order('id').range(i * 1000, i * 1000 + 999)));
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
  return results.flatMap((r) => r.data ?? []);
}

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const [data, sales] = await Promise.all([
    fetchAllProductRows(),
    supabase.from('order_items').select('product_id,quantity,orders!inner(status)').neq('orders.status', 'CANCELLED').limit(10000),
  ]);
  const sold = new Map<string, number>();
  for (const s of (sales.data ?? []) as Array<{ product_id: string | null; quantity: number }>) if (s.product_id) sold.set(s.product_id, (sold.get(s.product_id) ?? 0) + s.quantity);
  return data.map((p) => {
    const inv = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory;
    const img = p.product_images?.find((i) => i.is_primary)?.url ?? p.product_images?.[0]?.url ?? imageBySlug.get(p.slug) ?? '';
    const onSale = p.sale_price !== null && Number(p.sale_price) < Number(p.price);
    return {
      id: p.id, name: p.name, slug: p.slug, sku: p.sku, category: p.categories?.name ?? '—',
      price: Number(onSale ? p.sale_price : p.price), oldPrice: onSale ? Number(p.price) : 0,
      stock: inv ? inv.current_stock - inv.reserved_stock : 0, threshold: inv?.low_stock_threshold ?? 10,
      active: p.status === 'ACTIVE', image: img, updatedAt: inv?.last_updated ?? p.updated_at,
      hasPhoto: Boolean(p.product_images?.length), sold: sold.get(p.id) ?? 0,
    };
  });
}

export async function fetchAdminCustomers(): Promise<AdminCustomer[]> {
  const [{ data: people, error }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,phone,email,status,created_at,avatar_url').order('created_at', { ascending: false }).limit(200),
    supabase.from('orders').select('user_id,total,created_at,status'),
  ]);
  if (error) throw error;
  return (people ?? []).map((p) => {
    const mine = (orders ?? []).filter((o) => o.user_id === p.id && o.status !== 'CANCELLED');
    return {
      id: p.id, name: p.full_name || p.email || 'Customer', phone: p.phone ?? '', email: p.email ?? '', avatar: p.avatar_url,
      orders: mine.length, spent: mine.reduce((s, o) => s + Number(o.total), 0),
      lastOrder: mine.map((o) => o.created_at).sort().at(-1) ?? null, joined: p.created_at, status: p.status,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export async function updateOrderStatus(id: string, status: OrderStatusDb) {
  const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function setProductActive(id: string, active: boolean) {
  const { error } = await supabase.from('products').update({ status: active ? 'ACTIVE' : 'INACTIVE', updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function setStock(productId: string, current: number, next: number, reason = 'Manual stock update') {
  const { error } = await supabase.from('inventory').update({ current_stock: next, last_updated: new Date().toISOString() }).eq('product_id', productId);
  if (error) throw error;
  const { data: u } = await supabase.auth.getUser();
  await supabase.from('inventory_adjustments').insert({ product_id: productId, quantity_delta: next - current, reason, changed_by: u.user?.id ?? null });
}

/* ------------------------------------------------------------------ */
/* Hook: live data when available, the approved demo data otherwise    */
/* ------------------------------------------------------------------ */

export function useAdminData<T>(load: () => Promise<T[]>, _demo?: T[]) {
  const [rows, setRows] = useState<T[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    // The admin always shows the store's real data (an empty list means nothing yet), never sample rows.
    try {
      setRows(await load());
    } catch (e) {
      setRows([]);
      toast.error(e instanceof Error ? `Could not load data: ${e.message}` : 'Could not load data');
    } finally {
      setLive(true);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  return { rows, setRows, live, loading, reload };
}

export const statusLabel = (s: string) => s.toLowerCase().split('_').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

/** Name shown for the signed-in staff account (from its profile, e.g. "Delight Shopping Mart"). */
export function useStaffName() {
  const { user, displayName } = useAuth();
  const { data } = useQuery({
    queryKey: ['staff-name', user?.id],
    enabled: Boolean(user),
    staleTime: 10 * 60_000,
    queryFn: async () => (await supabase.from('profiles').select('full_name').eq('id', user!.id).maybeSingle()).data?.full_name ?? null,
  });
  return data || displayName;
}

/** Stock level below which a product counts as "low stock". */
export async function setThreshold(productId: string, threshold: number) {
  const { error } = await supabase.from('inventory').update({ low_stock_threshold: threshold }).eq('product_id', productId);
  if (error) throw error;
}

export type StockMove = { at: string; delta: number; reason: string };

/** Stock changes for one product, newest first: manual updates plus items sold in orders. */
export async function fetchStockHistory(productId: string): Promise<StockMove[]> {
  const [adj, sold] = await Promise.all([
    supabase.from('inventory_adjustments').select('created_at,quantity_delta,reason').eq('product_id', productId).order('created_at', { ascending: false }).limit(20),
    supabase.from('order_items').select('quantity,orders!inner(order_number,created_at,status)').eq('product_id', productId).limit(20),
  ]);
  const moves: StockMove[] = (adj.data ?? []).map((a) => ({ at: a.created_at, delta: a.quantity_delta, reason: a.reason }));
  for (const s of (sold.data ?? []) as unknown as Array<{ quantity: number; orders: { order_number: string; created_at: string; status: string } }>) {
    moves.push({ at: s.orders.created_at, delta: -s.quantity, reason: `Sold (order ${s.orders.order_number})${s.orders.status === 'CANCELLED' ? ' · cancelled, returned to stock' : ''}` });
  }
  return moves.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
}
