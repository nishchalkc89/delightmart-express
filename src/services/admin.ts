import { useCallback, useEffect, useState } from 'react';
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
};

export type AdminCustomer = { id: string; name: string; phone: string; email: string; orders: number; spent: number; lastOrder: string | null; joined: string; status: string; avatar: string | null };

const imageBySlug = new Map(demoCatalog.map((p) => [p.slug, p.image]));
const imageByName = new Map(demoCatalog.map((p) => [p.name.toLowerCase(), p.image]));

/* ------------------------------------------------------------------ */
/* Reads (RLS returns rows only for staff accounts)                    */
/* ------------------------------------------------------------------ */

export async function fetchAdminOrders(limit = 50): Promise<AdminOrder[]> {
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

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase.from('products')
    .select('id,name,slug,sku,price,sale_price,status,updated_at,categories(name),inventory(current_stock,reserved_stock,low_stock_threshold,last_updated),product_images(url,is_primary)')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((p) => {
    const inv = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory;
    const img = p.product_images?.find((i) => i.is_primary)?.url ?? p.product_images?.[0]?.url ?? imageBySlug.get(p.slug) ?? '';
    const onSale = p.sale_price !== null && Number(p.sale_price) < Number(p.price);
    return {
      id: p.id, name: p.name, slug: p.slug, sku: p.sku, category: p.categories?.name ?? '—',
      price: Number(onSale ? p.sale_price : p.price), oldPrice: onSale ? Number(p.price) : 0,
      stock: inv ? inv.current_stock - inv.reserved_stock : 0, threshold: inv?.low_stock_threshold ?? 10,
      active: p.status === 'ACTIVE', image: img, updatedAt: inv?.last_updated ?? p.updated_at,
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

export function useAdminData<T>(load: () => Promise<T[]>, demo: T[]) {
  const [rows, setRows] = useState<T[]>(demo);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await load();
      if (data.length) { setRows(data); setLive(true); } else { setRows(demo); setLive(false); }
    } catch {
      setRows(demo); setLive(false);
    } finally {
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
