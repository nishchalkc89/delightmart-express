import type { Database } from '@/integrations/supabase/types';
import { supabase } from './supabase';

type AppRole = Database['public']['Enums']['app_role'];
type DeliveryStatus = Database['public']['Enums']['delivery_status'];

const slugify = (s: string) => s.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Uploads an image to a public storage bucket and returns its public URL. */
export async function uploadImage(bucket: 'product-images' | 'category-images' | 'banners' | 'store-branding', file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file (PNG or JPG)');
  if (file.size > 2 * 1024 * 1024) throw new Error('Image must be 2MB or smaller');
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  fail(error);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/* ---------------------------------- Categories ---------------------------------- */

export type CategoryRow = { id: string; name: string; slug: string; description: string | null; image_url: string | null; parent_id: string | null; status: string; sort_order: number; created_at: string; products: number };

export async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase.from('categories').select('id,name,slug,description,image_url,parent_id,status,sort_order,created_at').order('sort_order');
  fail(error);
  const counts = await Promise.all((data ?? []).map((c) => supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', c.id)));
  return (data ?? []).map((c, i) => ({ ...c, products: counts[i]?.count ?? 0 }));
}

export async function saveCategory(input: { id?: string | undefined; name: string; description: string; parentId: string | null; status: 'ACTIVE' | 'INACTIVE'; imageUrl: string | null }) {
  const row = { name: input.name.trim(), slug: slugify(input.name), description: input.description.trim() || null, parent_id: input.parentId, status: input.status, image_url: input.imageUrl, updated_at: new Date().toISOString() };
  const { error } = input.id ? await supabase.from('categories').update(row).eq('id', input.id) : await supabase.from('categories').insert(row);
  fail(error);
}

export async function setCategoryStatus(id: string, active: boolean) {
  fail((await supabase.from('categories').update({ status: active ? 'ACTIVE' : 'INACTIVE' }).eq('id', id)).error);
}

export async function deleteCategory(id: string) {
  fail((await supabase.from('categories').delete().eq('id', id)).error);
}

/* ---------------------------------- Products ---------------------------------- */

export type ProductInput = {
  id?: string | undefined; name: string; sku: string; categoryId: string; brand: string; description: string;
  price: number; salePrice: number | null; unit: string; stock: number; threshold: number; featured: boolean; active: boolean; imageUrl: string | null;
};

export async function fetchProductForEdit(id: string): Promise<ProductInput> {
  const { data, error } = await supabase.from('products').select('id,name,sku,category_id,brand,description,price,sale_price,unit,featured,status,inventory(current_stock,low_stock_threshold),product_images(url,is_primary)').eq('id', id).single();
  fail(error);
  const inv = Array.isArray(data!.inventory) ? data!.inventory[0] : data!.inventory;
  return {
    id: data!.id, name: data!.name, sku: data!.sku, categoryId: data!.category_id, brand: data!.brand ?? '', description: data!.description,
    price: Number(data!.price), salePrice: data!.sale_price === null ? null : Number(data!.sale_price), unit: data!.unit,
    stock: inv?.current_stock ?? 0, threshold: inv?.low_stock_threshold ?? 10, featured: data!.featured, active: data!.status === 'ACTIVE',
    imageUrl: data!.product_images?.find((i) => i.is_primary)?.url ?? data!.product_images?.[0]?.url ?? null,
  };
}

export async function saveProduct(p: ProductInput) {
  const row = {
    name: p.name.trim(), slug: slugify(p.name), sku: p.sku.trim().toUpperCase(), category_id: p.categoryId, brand: p.brand.trim() || null,
    description: p.description.trim(), price: p.price, sale_price: p.salePrice, unit: p.unit.trim() || '1 pc', featured: p.featured,
    status: (p.active ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE', updated_at: new Date().toISOString(),
  };
  let id = p.id;
  if (id) {
    fail((await supabase.from('products').update(row).eq('id', id)).error);
  } else {
    const { data, error } = await supabase.from('products').insert(row).select('id').single();
    fail(error);
    id = data!.id;
  }
  fail((await supabase.from('inventory').upsert({ product_id: id, current_stock: p.stock, low_stock_threshold: p.threshold, last_updated: new Date().toISOString() }, { onConflict: 'product_id' })).error);
  if (p.imageUrl) {
    const { data: existing } = await supabase.from('product_images').select('id,url').eq('product_id', id).eq('is_primary', true).maybeSingle();
    if (!existing) fail((await supabase.from('product_images').insert({ product_id: id, url: p.imageUrl, is_primary: true, alt_text: p.name })).error);
    else if (existing.url !== p.imageUrl) fail((await supabase.from('product_images').update({ url: p.imageUrl, alt_text: p.name }).eq('id', existing.id)).error);
  }
  return id;
}

export async function deleteProduct(id: string) {
  // Products referenced by past orders are deactivated instead of deleted to keep order history intact.
  const { count } = await supabase.from('order_items').select('id', { count: 'exact', head: true }).eq('product_id', id);
  if (count) {
    fail((await supabase.from('products').update({ status: 'INACTIVE' }).eq('id', id)).error);
    return 'deactivated' as const;
  }
  fail((await supabase.from('products').delete().eq('id', id)).error);
  return 'deleted' as const;
}

/* ---------------------------------- Coupons & offers ---------------------------------- */

export type CouponRow = { id: string; code: string; discount_type: string; discount_value: number; min_order: number; usage_limit: number | null; used_count: number; starts_at: string | null; ends_at: string | null; status: string };

export async function fetchCoupons(): Promise<CouponRow[]> {
  const { data, error } = await supabase.from('coupons').select('id,code,discount_type,discount_value,min_order,usage_limit,used_count,starts_at,ends_at,status').order('created_at', { ascending: false });
  fail(error);
  return (data ?? []).map((c) => ({ ...c, discount_value: Number(c.discount_value), min_order: Number(c.min_order) }));
}

export async function saveCoupon(c: { code: string; type: 'PERCENTAGE' | 'FIXED'; value: number; minOrder: number; usageLimit: number | null; startsAt: string | null; endsAt: string | null; active: boolean }) {
  const { error } = await supabase.from('coupons').insert({ code: c.code.trim().toUpperCase(), discount_type: c.type, discount_value: c.value, min_order: c.minOrder, usage_limit: c.usageLimit, starts_at: c.startsAt, ends_at: c.endsAt, status: c.active ? 'ACTIVE' : 'INACTIVE' });
  fail(error);
}

export async function setCouponStatus(id: string, active: boolean) {
  fail((await supabase.from('coupons').update({ status: active ? 'ACTIVE' : 'INACTIVE' }).eq('id', id)).error);
}

export async function deleteCoupon(id: string) {
  fail((await supabase.from('coupons').delete().eq('id', id)).error);
}

/* ---------------------------------- Banners ---------------------------------- */

export type BannerRow = { id: string; title: string; image_url: string; link_url: string | null; position: string; status: string; starts_at: string | null; ends_at: string | null; sort_order: number };

export async function fetchBanners(): Promise<BannerRow[]> {
  const { data, error } = await supabase.from('banners').select('id,title,image_url,link_url,position,status,starts_at,ends_at,sort_order').order('sort_order');
  fail(error);
  return data ?? [];
}

export async function saveBanner(b: { id?: string | undefined; title: string; imageUrl: string; linkUrl: string; position: string; startsAt: string | null; endsAt: string | null; active: boolean }) {
  const row = { title: b.title.trim(), image_url: b.imageUrl, link_url: b.linkUrl.trim() || null, position: b.position, starts_at: b.startsAt, ends_at: b.endsAt, status: b.active ? 'ACTIVE' : 'INACTIVE' };
  fail((b.id ? await supabase.from('banners').update(row).eq('id', b.id) : await supabase.from('banners').insert(row)).error);
}

export async function setBannerStatus(id: string, active: boolean) {
  fail((await supabase.from('banners').update({ status: active ? 'ACTIVE' : 'INACTIVE' }).eq('id', id)).error);
}

export async function deleteBanner(id: string) {
  fail((await supabase.from('banners').delete().eq('id', id)).error);
}

/* ---------------------------------- Staff, roles, delivery ---------------------------------- */

export type StaffRow = { id: string; name: string; email: string; phone: string; status: string; joined: string; avatar: string | null; roles: AppRole[] };

export async function fetchUsersWithRoles(): Promise<StaffRow[]> {
  const [{ data: people, error }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,email,phone,status,created_at,avatar_url').order('created_at', { ascending: false }),
    supabase.from('user_roles').select('user_id,role'),
  ]);
  fail(error);
  return (people ?? []).map((p) => ({
    id: p.id, name: p.full_name || p.email || 'User', email: p.email ?? '', phone: p.phone ?? '', status: p.status, joined: p.created_at, avatar: p.avatar_url,
    roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
  }));
}

export async function setUserRole(userId: string, role: AppRole) {
  // One staff role per person: remove other staff roles, keep CUSTOMER.
  const staff: AppRole[] = ['SUPER_ADMIN', 'MANAGER', 'ORDER_STAFF', 'INVENTORY_STAFF', 'DELIVERY_STAFF'];
  fail((await supabase.from('user_roles').delete().eq('user_id', userId).in('role', staff.filter((r) => r !== role))).error);
  if (role !== 'CUSTOMER') fail((await supabase.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id,role' })).error);
}

export async function setProfileStatus(userId: string, active: boolean) {
  fail((await supabase.from('profiles').update({ status: active ? 'ACTIVE' : 'INACTIVE', updated_at: new Date().toISOString() }).eq('id', userId)).error);
}

export type DeliveryRow = { orderId: string; orderNumber: string; customer: string; phone: string; address: string; total: number; orderStatus: string; createdAt: string; staffId: string | null; status: DeliveryStatus | null; estimated: string | null };

export async function fetchDeliveries(): Promise<DeliveryRow[]> {
  const [{ data: orders, error }, { data: assignments }] = await Promise.all([
    supabase.from('orders').select('id,order_number,user_id,total,status,created_at,delivery_instructions,estimated_delivery_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('delivery_assignments').select('order_id,staff_id,status'),
  ]);
  fail(error);
  const ids = [...new Set((orders ?? []).map((o) => o.user_id))];
  const { data: people } = ids.length ? await supabase.from('profiles').select('id,full_name,phone').in('id', ids) : { data: [] };
  return (orders ?? []).map((o) => {
    const a = (assignments ?? []).find((x) => x.order_id === o.id);
    const p = (people ?? []).find((x) => x.id === o.user_id);
    const text = o.delivery_instructions ?? '';
    return {
      orderId: o.id, orderNumber: o.order_number, total: Number(o.total), orderStatus: o.status, createdAt: o.created_at, estimated: o.estimated_delivery_at,
      customer: p?.full_name || /Recipient: ([^.]+)\./.exec(text)?.[1] || 'Customer',
      phone: p?.phone || /Phone: ([0-9+ ]+)/.exec(text)?.[1]?.trim() || '',
      address: /Deliver to: (.*?)\. Recipient:/.exec(text)?.[1] ?? 'Tulsipur',
      staffId: a?.staff_id ?? null, status: a?.status ?? null,
    };
  });
}

/** Assigns delivery staff and keeps the order status in step with the delivery status. */
export async function assignDelivery(orderId: string, staffId: string | null, status: DeliveryStatus) {
  const now = new Date().toISOString();
  fail((await supabase.from('delivery_assignments').upsert({ order_id: orderId, staff_id: staffId, status, assigned_at: staffId ? now : null, delivered_at: status === 'DELIVERED' ? now : null, updated_at: now }, { onConflict: 'order_id' })).error);
  const orderStatus = ({ PENDING: null, READY: 'READY_FOR_DELIVERY', OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY', DELIVERED: 'DELIVERED', FAILED: 'FAILED' } as const)[status];
  if (orderStatus) fail((await supabase.from('orders').update({ status: orderStatus, updated_at: now }).eq('id', orderId)).error);
}

/* ---------------------------------- Payments & reviews ---------------------------------- */

export type PaymentRow = { id: string; orderNumber: string; customer: string; provider: string; status: string; amount: number; createdAt: string; txn: string | null };

export async function fetchPayments(): Promise<PaymentRow[]> {
  const { data, error } = await supabase.from('payments').select('id,provider,provider_transaction_id,status,amount,created_at,orders(order_number,user_id,delivery_instructions)').order('created_at', { ascending: false }).limit(200);
  fail(error);
  const ids = [...new Set((data ?? []).map((p) => p.orders?.user_id).filter(Boolean) as string[])];
  const { data: people } = ids.length ? await supabase.from('profiles').select('id,full_name').in('id', ids) : { data: [] };
  return (data ?? []).map((p) => ({
    id: p.id, orderNumber: p.orders?.order_number ?? '—', provider: p.provider, status: p.status, amount: Number(p.amount), createdAt: p.created_at, txn: p.provider_transaction_id,
    customer: (people ?? []).find((x) => x.id === p.orders?.user_id)?.full_name || /Recipient: ([^.]+)\./.exec(p.orders?.delivery_instructions ?? '')?.[1] || 'Customer',
  }));
}

export type ReviewRow = { id: string; product: string; productSlug: string; customer: string; rating: number; review: string; status: string; createdAt: string };

export async function fetchReviews(): Promise<ReviewRow[]> {
  const { data, error } = await supabase.from('reviews').select('id,rating,review,status,created_at,user_id,products(name,slug)').order('created_at', { ascending: false }).limit(200);
  fail(error);
  const ids = [...new Set((data ?? []).map((r) => r.user_id))];
  const { data: people } = ids.length ? await supabase.from('profiles').select('id,full_name').in('id', ids) : { data: [] };
  return (data ?? []).map((r) => ({ id: r.id, product: r.products?.name ?? 'Product', productSlug: r.products?.slug ?? '', customer: (people ?? []).find((p) => p.id === r.user_id)?.full_name ?? 'Customer', rating: r.rating, review: r.review, status: r.status, createdAt: r.created_at }));
}

export async function setReviewStatus(id: string, status: 'PUBLISHED' | 'HIDDEN' | 'PENDING') {
  fail((await supabase.from('reviews').update({ status }).eq('id', id)).error);
}

export async function deleteReview(id: string) {
  fail((await supabase.from('reviews').delete().eq('id', id)).error);
}
