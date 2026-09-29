import { createServerFn } from '@tanstack/react-start';

const PRODUCT_COLUMNS = 'id,slug,name,brand,unit,price,sale_price,description,featured,created_at,categories(name,slug),inventory(current_stock,reserved_stock),product_images(url,is_primary,sort_order)';

/**
 * Reads the public catalogue on the server. Only ACTIVE products and categories are returned,
 * so it exposes nothing beyond what the storefront shows. Used when the browser's anonymous
 * read is blocked by row-level security.
 */
export const getCatalogServer = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const [products, categories, banners] = await Promise.all([
      supabaseAdmin.from('products').select(PRODUCT_COLUMNS).eq('status', 'ACTIVE').order('created_at', { ascending: true }),
      supabaseAdmin.from('categories').select('name,slug,description,image_url,sort_order').eq('status', 'ACTIVE').is('parent_id', null).order('sort_order'),
      supabaseAdmin.from('banners').select('title,image_url,link_url,position,starts_at,ends_at').eq('status', 'ACTIVE').order('sort_order'),
    ]);
    if (products.error) return { json: '' };
    return { json: JSON.stringify({ products: products.data, categories: categories.data ?? [], banners: banners.data ?? [] }) };
  } catch {
    return { json: '' };
  }
});
