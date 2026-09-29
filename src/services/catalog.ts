import type { Product } from '@/types/store';
import { asset } from '@/lib/assets';
import { productArt } from '@/lib/product-art';

export type Category = {
  name: string;
  short: string;
  slug: string;
  tagline: string;
  image: string;
  icon: string;
  side: string;
  circle?: string | undefined;
  /** Not a database category: "Deals & Offers" lists every discounted product. */
  virtual?: boolean | undefined;
};

/** Category drawn in the approved design (tile, nav icon, sidebar icon and, for some, a round photo). */
const designed = (slug: string, name: string, short: string, tagline: string): Category => ({
  slug, name, short, tagline, image: asset(`tile-${slug}`), icon: asset(`nav-${slug}`), side: asset(`side-${slug}`), circle: asset(`circle-${slug}`) || asset(`nav-${slug}`),
});
/** Category added for the store's full product range; uses a simple drawn icon everywhere. */
const drawn = (slug: string, name: string, short: string, tagline: string): Category => {
  const icon = asset(`icon-${slug}`);
  return { slug, name, short, tagline, image: icon, icon, side: icon, circle: icon };
};

// The store's categories, in display order (kept in step with scripts/catalogue/taxonomy.mjs).
export const categories: Category[] = [
  designed('groceries', 'Groceries & Staples', 'Groceries', 'Daily Essentials'),
  drawn('snacks', 'Snacks & Sweets', 'Snacks', 'Biscuits, Chips & Chocolates'),
  drawn('beverages', 'Beverages', 'Beverages', 'Tea, Coffee, Juice & Drinks'),
  drawn('dairy-frozen', 'Dairy, Bakery & Frozen', 'Dairy & Frozen', 'Fresh & Chilled'),
  designed('beauty-skincare', 'Beauty & Personal Care', 'Beauty', 'Look Good, Feel Good'),
  drawn('health-hygiene', 'Health & Hygiene', 'Health', 'Care for You & Family'),
  designed('baby-care', 'Baby Care', 'Baby Care', 'For Your Little Ones'),
  drawn('cleaning', 'Cleaning & Laundry', 'Cleaning', 'Clean Home, Happy Home'),
  designed('kitchen-household', 'Kitchen & Dining', 'Kitchen', 'Make Home Better'),
  drawn('home-living', 'Home & Living', 'Home', 'Storage, Decor & Utility'),
  designed('stationery', 'Stationery & School', 'Stationery', 'Study Made Easy'),
  designed('toys', 'Toys, Games & Sports', 'Toys', 'Play & Learn'),
  designed('ladies-wear', 'Fashion & Accessories', 'Fashion', 'Trendy Fashion'),
  drawn('electronics', 'Electronics & Appliances', 'Electronics', 'Smart Living'),
  drawn('gifts-puja', 'Gifts, Puja & Festive', 'Gifts & Puja', 'Celebrate Every Moment'),
  drawn('pet-care', 'Pet Care', 'Pets', 'For Your Furry Friends'),
  drawn('liquor-smoking', 'Liquor & Smoking (18+)', 'Liquor (18+)', 'For Adults Only'),
];
export const dealsCategory: Category = { ...designed('deals-offers', 'Deals & Offers', 'Deals', 'Save More'), virtual: true };
/** Categories shown in the desktop category bar (the rest are under "All Categories"). */
export const NAV_CATEGORIES = ['groceries', 'snacks', 'beverages', 'beauty-skincare', 'baby-care', 'cleaning', 'kitchen-household', 'ladies-wear', 'stationery'];

/** Design photos for grocery subcategories (other subcategories are shown as text chips). */
export const subcategoryImages: Record<string, string> = {
  'Rice & Grains': asset('sub-rice-grains'), 'Oil & Ghee': asset('sub-cooking-oil'), 'Noodles, Pasta & Soup': asset('sub-noodles-pasta'),
  'Spices & Masala': asset('sub-spices-masala'), 'Dal & Pulses': asset('cat-rice-dal'), 'Atta, Flour & Sooji': asset('a-atta'),
  'Cooking Essentials': asset('sub-canned-food'), 'Sauces, Pickles & Spreads': asset('sub-canned-food'),
};

export const subcategories: Array<{ name: string; image: string; category?: string }> = [
  { name: 'Rice & Grains', image: asset('sub-rice-grains') },
  { name: 'Oil & Ghee', image: asset('sub-cooking-oil') },
  { name: 'Noodles, Pasta & Soup', image: asset('sub-noodles-pasta') },
  { name: 'Spices & Masala', image: asset('sub-spices-masala') },
  { name: 'Biscuits & Cookies', image: asset('sub-biscuits-snacks'), category: 'snacks' },
  { name: 'Soft Drinks & Soda', image: asset('sub-beverages'), category: 'beverages' },
  { name: 'Milk, Butter & Cheese', image: asset('sub-dairy-eggs'), category: 'dairy-frozen' },
  { name: 'Sauces, Pickles & Spreads', image: asset('sub-canned-food') },
];

// Demo catalogue used when the database is not connected.
const p = (v: Omit<Product, 'image'> & { img: string }): Product => {
  const { img, ...rest } = v;
  return { ...rest, image: asset(img) };
};

export const products: Product[] = [
  p({ id: '1', slug: 'daawat-basmati-rice-5kg', name: 'Daawat Basmati Rice', brand: 'Daawat', category: 'Groceries', subcategory: 'Rice & Grains', unit: '5kg', price: 1199, oldPrice: 1499, img: 'p-rice', gallery: [asset('p-rice'), asset('rice-thumb-2'), asset('rice-thumb-3'), asset('rice-thumb-4')], discount: 20, stock: 8, rating: 4.6, reviews: 124, featured: true, description: 'Premium quality basmati rice with long grains and rich aroma. Perfect for everyday meals and special occasions.' }),
  p({ id: '2', slug: 'maggi-2-minute-noodles', name: 'Maggi 2-Minute Noodles', brand: 'Maggi', category: 'Groceries', subcategory: 'Noodles & Pasta', unit: '280g', price: 160, oldPrice: 190, img: 'p-maggi', discount: 15, stock: 120, rating: 4.7, reviews: 98, featured: true, description: 'Quick, comforting noodles with the classic masala taste.' }),
  p({ id: '3', slug: 'nivea-body-lotion-400ml', name: 'Nivea Body Lotion', brand: 'Nivea', category: 'Beauty & Skincare', unit: '400ml', price: 425, oldPrice: 475, img: 'p-nivea', discount: 10, stock: 45, rating: 4.5, reviews: 96, featured: true, description: 'Daily moisturising body lotion for smooth, nourished skin.' }),
  p({ id: '4', slug: 'nike-ladies-t-shirt', name: 'Nike Ladies T-Shirt', brand: 'Nike', category: 'Ladies Wear', unit: '(Assorted)', price: 799, oldPrice: 1050, img: 'p-tshirt', discount: 25, stock: 32, rating: 4.4, reviews: 64, featured: true, description: 'Comfortable everyday cotton t-shirt with a modern fit.' }),
  p({ id: '5', slug: 'pampers-baby-diapers', name: 'Pampers Baby Diapers', brand: 'Pampers', category: 'Baby Care', unit: 'M 60 Pcs', price: 1350, oldPrice: 1590, img: 'p-pampers', discount: 15, stock: 24, rating: 4.8, reviews: 72, featured: true, description: 'Soft and absorbent baby diapers for lasting comfort.' }),
  p({ id: '6', slug: 'classmate-notebook', name: 'Classmate Notebook', brand: 'Classmate', category: 'Stationery', unit: 'Single Line', price: 60, oldPrice: 70, img: 'p-notebook', discount: 10, stock: 200, rating: 4.5, reviews: 210, featured: true, description: 'Quality single-line notebook for school and office.' }),
  p({ id: '7', slug: 'wireless-headphones', name: 'Wireless Headphones', category: 'Kitchen & Household', unit: '', price: 2999, oldPrice: 4999, img: 'p-headphones', stock: 18, rating: 4.6, reviews: 120, description: 'Immersive wireless sound with a comfortable over-ear fit.' }),
  p({ id: '8', slug: 'running-shoes', name: 'Running Shoes', category: 'Ladies Wear', unit: '', price: 1899, oldPrice: 2999, img: 'p-shoes', stock: 26, rating: 4.5, reviews: 98, description: 'Lightweight sports shoes for daily runs and walks.' }),
  p({ id: '9', slug: 'smart-watch', name: 'Smart Watch', category: 'Kitchen & Household', unit: '', price: 3499, oldPrice: 5999, img: 'p-watch', stock: 15, rating: 4.4, reviews: 210, description: 'Fitness tracking, alerts and everyday smart features.' }),
  p({ id: '10', slug: 'travel-backpack', name: 'Travel Backpack', category: 'Stationery', unit: '', price: 1299, oldPrice: 2499, img: 'p-backpack', stock: 38, rating: 4.7, reviews: 74, description: 'Spacious, durable backpack for work and travel.' }),
  p({ id: '11', slug: 'cookware-set-5-pcs', name: 'Cookware Set (5 Pcs)', category: 'Kitchen & Household', unit: '', price: 2499, oldPrice: 3999, img: 'p-cookware', stock: 20, rating: 4.5, reviews: 92, description: 'Stainless steel cookware set for everyday cooking.' }),
  p({ id: '12', slug: 'teddy-bear-medium', name: 'Teddy Bear (Medium)', category: 'Toys', unit: '', price: 799, oldPrice: 1199, img: 'p-teddy', stock: 30, rating: 4.6, reviews: 92, description: 'Soft, cuddly teddy bear for kids of all ages.' }),
  p({ id: '13', slug: 'sunflower-oil-1l', name: 'Sunflower Oil', brand: 'Fortune', category: 'Groceries', subcategory: 'Cooking Oil', unit: '1L', price: 210, oldPrice: 260, img: 'p-oil', stock: 50, rating: 4.6, reviews: 76, isNew: true, description: 'Light, refined sunflower oil for everyday cooking.' }),
  p({ id: '14', slug: 'school-backpack', name: 'School Backpack', category: 'Stationery', unit: '', price: 1450, img: 'p-school-backpack', stock: 22, rating: 4.5, reviews: 64, isNew: true, description: 'Lightweight school backpack with padded straps.' }),
  p({ id: '15', slug: 'baby-wipes-72-pcs', name: 'Baby Wipes (72 pcs)', category: 'Baby Care', unit: '', price: 350, img: 'p-baby-wipes', stock: 60, rating: 4.4, reviews: 28, isNew: true, description: 'Gentle, fragrance-free wipes for delicate skin.' }),
  p({ id: '16', slug: 'ladies-kurti', name: 'Ladies Kurti', category: 'Ladies Wear', unit: '', price: 1250, img: 'p-kurti', stock: 18, rating: 4.5, reviews: 51, isNew: true, description: 'Printed cotton kurti for everyday comfort.' }),
  p({ id: '17', slug: 'sports-shoes', name: 'Sports Shoes', category: 'Ladies Wear', unit: '', price: 2499, img: 'p-sports-shoes', stock: 16, rating: 4.4, reviews: 87, isNew: true, description: 'Breathable sports shoes with cushioned soles.' }),
  p({ id: '18', slug: 'red-lentils-masoor-dal-1kg', name: 'Red Lentils (Masoor Dal)', category: 'Groceries', subcategory: 'Rice & Grains', unit: '1kg', price: 180, oldPrice: 220, img: 'p-lentils', stock: 70, rating: 4.7, reviews: 64, description: 'Clean, high-protein red lentils.' }),
  p({ id: '19', slug: 'fresh-eggs-30-pcs', name: 'Fresh Eggs (30 pcs)', category: 'Groceries', subcategory: 'Dairy & Eggs', unit: '', price: 450, oldPrice: 520, img: 'p-eggs', stock: 40, rating: 4.8, reviews: 88, description: 'Farm-fresh eggs delivered daily.' }),
  p({ id: '20', slug: 'fresh-banana-1kg', name: 'Fresh Banana', category: 'Groceries', unit: '1kg (Approx. 5-6 pcs)', price: 120, img: 'p-banana', stock: 60, rating: 4.8, reviews: 28, description: 'Fresh, naturally sweet bananas selected daily.' }),
  p({ id: '21', slug: 'jasmine-rice-5kg', name: 'Jasmine Rice', category: 'Groceries', subcategory: 'Rice & Grains', unit: '5kg', price: 1050, img: 'p-jasmine-rice', stock: 30, rating: 4.6, reviews: 86, description: 'Fragrant, soft jasmine rice.' }),
  p({ id: '22', slug: 'masoor-dal-1kg', name: 'Masoor Dal', category: 'Groceries', subcategory: 'Rice & Grains', unit: '1kg', price: 180, img: 'p-masoor-dal', stock: 45, rating: 4.6, reviews: 64, description: 'Everyday masoor dal.' }),
  p({ id: '23', slug: 'chana-dal-1kg', name: 'Chana Dal', category: 'Groceries', subcategory: 'Rice & Grains', unit: '1kg', price: 220, img: 'p-chana-dal', stock: 45, rating: 4.6, reviews: 52, description: 'Premium split chickpeas.' }),
];

export type Collections = { specialOffers: Product[]; popular: Product[]; justArrived: Product[]; groceryPopular: Product[] };

const demoCollection = (slugs: string[]) => slugs.map((s) => products.find((x) => x.slug === s)).filter((x): x is Product => Boolean(x));
const demoCollections: Collections = {
  specialOffers: demoCollection(['daawat-basmati-rice-5kg', 'maggi-2-minute-noodles', 'nivea-body-lotion-400ml', 'nike-ladies-t-shirt', 'pampers-baby-diapers', 'classmate-notebook']),
  popular: demoCollection(['wireless-headphones', 'running-shoes', 'smart-watch', 'travel-backpack', 'cookware-set-5-pcs', 'teddy-bear-medium']),
  justArrived: demoCollection(['sunflower-oil-1l', 'school-backpack', 'baby-wipes-72-pcs', 'ladies-kurti', 'maggi-2-minute-noodles', 'sports-shoes']),
  groceryPopular: demoCollection(['daawat-basmati-rice-5kg', 'maggi-2-minute-noodles', 'sunflower-oil-1l', 'red-lentils-masoor-dal-1kg', 'fresh-eggs-30-pcs', 'jasmine-rice-5kg']),
};

export const brands = Array.from({ length: 11 }, (_, i) => asset(`brand-${i + 1}`));

export const formatNpr = (n: number) => `NPR ${n.toLocaleString('en-US')}`;

/* ------------------------------------------------------------------ */
/* Live catalogue (Supabase)                                           */
/* ------------------------------------------------------------------ */

export const BANNER_POSITIONS = ['Homepage Slider', 'Below Slider', 'Shop More Row'] as const;
export type StoreBanner = { title: string; image: string; link: string; position: string };
export type Storefront = { categories: Category[]; banners: StoreBanner[]; collections: Collections; source: 'live' | 'demo' };
export type ProductSort = 'featured' | 'price-asc' | 'price-desc' | 'name' | 'newest';
export type ProductFilter = { category?: string | undefined; sub?: string | undefined; q?: string | undefined; sort?: ProductSort | undefined; inStock?: boolean | undefined; page?: number | undefined; size?: number | undefined };
export type ProductPage = { products: Product[]; total: number; page: number; pages: number };

const LIST_COLUMNS = 'id,slug,name,brand,unit,price,sale_price,featured,created_at,specifications,categories!inner(name,slug),inventory(current_stock,reserved_stock),product_images(url,is_primary,sort_order)';
const LIST_IN_STOCK = LIST_COLUMNS.replace('inventory(', 'inventory!inner(');

type DbProduct = {
  id: string; slug: string; name: string; brand: string | null; unit: string; price: number; sale_price: number | null;
  featured: boolean; created_at: string; description?: string; specifications: unknown;
  categories: { name: string; slug: string } | null;
  inventory: { current_stock: number; reserved_stock: number } | { current_stock: number; reserved_stock: number }[] | null;
  product_images: { url: string; is_primary: boolean; sort_order: number }[] | null;
};

const demoBySlug = new Map(products.map((x) => [x.slug, x]));

function fromDb(row: DbProduct): Product {
  const demo = demoBySlug.get(row.slug);
  const inv = Array.isArray(row.inventory) ? row.inventory[0] : row.inventory;
  const images = [...(row.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order).map((i) => i.url);
  const selling = Number(row.sale_price ?? row.price);
  const onSale = row.sale_price !== null && Number(row.sale_price) < Number(row.price);
  const spec = (row.specifications && typeof row.specifications === 'object' ? row.specifications : {}) as { subcategory?: string };
  const categorySlug = row.categories?.slug ?? 'groceries';
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.categories?.name ?? 'Groceries & Staples',
    categorySlug,
    subcategory: spec.subcategory ?? demo?.subcategory,
    brand: row.brand ?? demo?.brand,
    unit: row.unit ?? '',
    price: selling,
    oldPrice: onSale ? Number(row.price) : undefined,
    discount: onSale ? Math.round((1 - selling / Number(row.price)) * 100) : undefined,
    image: images[0] ?? demo?.image ?? productArt(row.name, spec.subcategory, categorySlug),
    art: !images[0] && !demo?.image,
    gallery: images.length > 1 ? images : demo?.gallery,
    stock: inv ? Math.max(0, inv.current_stock - inv.reserved_stock) : 0,
    rating: demo?.rating ?? 0,
    reviews: demo?.reviews ?? 0,
    featured: row.featured,
    isNew: Date.now() - new Date(row.created_at).getTime() < 14 * 86_400_000,
    description: row.description || demo?.description || '',
  };
}

async function client() {
  const { supabase, isSupabaseConfigured } = await import('./supabase');
  return isSupabaseConfigured ? supabase : null;
}

type Cat = { name: string; slug: string; description: string | null; image_url: string | null };
function withVisuals(rows: Cat[]): Category[] {
  return rows.map((c) => {
    const visual = categories.find((x) => x.slug === c.slug);
    if (visual) return { ...visual, name: c.name, image: c.image_url ?? visual.image };
    const icon = c.image_url ?? asset('nav-groceries');
    return { name: c.name, short: c.name, slug: c.slug, tagline: c.description ?? '', image: icon, icon, side: icon, circle: icon };
  });
}

/** Active categories from the database (with their pictures), plus the "Deals & Offers" listing. */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const db = await client();
    if (!db) return [...categories, dealsCategory];
    const { data, error } = await db.from('categories').select('name,slug,description,image_url,sort_order').eq('status', 'ACTIVE').is('parent_id', null).order('sort_order');
    if (error || !data?.length) return [...categories, dealsCategory];
    return [...withVisuals(data as Cat[]), dealsCategory];
  } catch {
    return [...categories, dealsCategory];
  }
}

function liveBanners(rows: Array<{ title: string; image_url: string; link_url: string | null; position: string; starts_at: string | null; ends_at: string | null }> | null): StoreBanner[] {
  const now = Date.now();
  return (rows ?? [])
    .filter((b) => (!b.starts_at || new Date(b.starts_at).getTime() <= now) && (!b.ends_at || new Date(b.ends_at).getTime() >= now))
    .map((b) => ({ title: b.title, image: b.image_url, link: b.link_url || '/products', position: b.position }));
}

/** Up to `size` products taking turns between categories, so a homepage row is not all one kind of product. */
function mixed(list: Product[], size = 12): Product[] {
  const groups = new Map<string, Product[]>();
  for (const p of list) if (p.categorySlug !== 'liquor-smoking') groups.set(p.categorySlug ?? '', [...(groups.get(p.categorySlug ?? '') ?? []), p]);
  const out: Product[] = [];
  for (let round = 0; out.length < size && round < list.length; round++) {
    for (const g of groups.values()) if (g[round] && out.length < size) out.push(g[round]!);
  }
  return out;
}

/** Everything the homepage needs: categories, banners and a few short product rows. */
export async function fetchStorefront(): Promise<Storefront> {
  const demo: Storefront = { categories: [...categories, dealsCategory], banners: [], collections: demoCollections, source: 'demo' };
  try {
    const db = await client();
    if (!db) return demo;
    const list = () => db.from('products').select(LIST_COLUMNS).eq('status', 'ACTIVE');
    const [cats, banners, offers, popular, fresh, grocery] = await Promise.all([
      fetchCategories(),
      db.from('banners').select('title,image_url,link_url,position,starts_at,ends_at').eq('status', 'ACTIVE').order('sort_order'),
      list().not('sale_price', 'is', null).order('featured', { ascending: false }).order('sku').limit(80),
      list().eq('featured', true).order('sku', { ascending: false }).limit(80),
      list().order('created_at', { ascending: false }).order('slug').limit(80),
      list().eq('categories.slug', 'groceries').order('featured', { ascending: false }).order('sku').limit(12),
    ]);
    const rows = (r: { data: unknown; error: unknown }) => (r.error ? [] : ((r.data ?? []) as DbProduct[]).map(fromDb));
    const collections: Collections = { specialOffers: mixed(rows(offers)), popular: mixed(rows(popular)), justArrived: mixed(rows(fresh)), groceryPopular: rows(grocery) };
    if (!collections.justArrived.length) return demo;
    return { categories: cats, banners: liveBanners(banners.error ? null : banners.data), collections, source: 'live' };
  } catch {
    return demo;
  }
}

const escapeLike = (s: string) => s.replace(/[%_,()\\]/g, ' ');

function demoPage(f: ProductFilter): ProductPage {
  const size = f.size ?? 30;
  const q = f.q?.toLowerCase().trim();
  const cat = categories.find((c) => c.slug === f.category);
  const list = products.filter((p) => (!f.category || (f.category === 'deals-offers' ? p.oldPrice : p.category === cat?.name || p.category === cat?.short))
    && (!q || `${p.name} ${p.category} ${p.brand ?? ''}`.toLowerCase().includes(q)));
  const page = Math.max(1, f.page ?? 1);
  return { products: list.slice((page - 1) * size, page * size), total: list.length, page, pages: Math.max(1, Math.ceil(list.length / size)) };
}

/** One page of products for a listing (category, all products, search), filtered and sorted in the database. */
export async function fetchProducts(f: ProductFilter): Promise<ProductPage> {
  const size = f.size ?? 30;
  const page = Math.max(1, f.page ?? 1);
  try {
    const db = await client();
    if (!db) return demoPage(f);
    let query = db.from('products').select(f.inStock ? LIST_IN_STOCK : LIST_COLUMNS, { count: 'exact' }).eq('status', 'ACTIVE');
    if (f.category === 'deals-offers') query = query.not('sale_price', 'is', null);
    else if (f.category) query = query.eq('categories.slug', f.category);
    if (f.sub) query = query.eq('specifications->>subcategory', f.sub);
    for (const word of escapeLike(f.q ?? '').split(/\s+/).filter(Boolean).slice(0, 6)) query = query.ilike('name', `%${word}%`);
    if (f.inStock) query = query.gt('inventory.current_stock', 0);
    const sort = f.sort ?? 'featured';
    if (sort === 'price-asc') query = query.order('price', { ascending: true });
    else if (sort === 'price-desc') query = query.order('price', { ascending: false });
    else if (sort === 'newest') query = query.order('created_at', { ascending: false });
    else if (sort === 'featured') query = query.order('featured', { ascending: false });
    query = query.order('name');
    const { data, error, count } = await query.range((page - 1) * size, page * size - 1);
    if (error) throw error;
    const total = count ?? 0;
    return { products: ((data ?? []) as unknown as DbProduct[]).map(fromDb), total, page, pages: Math.max(1, Math.ceil(total / size)) };
  } catch {
    return demoPage(f);
  }
}

/** Subcategories of a category with how many products each has, largest first. */
export async function fetchSubcategories(category: string): Promise<Array<{ name: string; count: number }>> {
  if (category === 'deals-offers') return [];
  try {
    const db = await client();
    if (!db) return [];
    const counts = new Map<string, number>();
    for (let from = 0; from < 20000; from += 1000) {
      const { data, error } = await db.from('products').select('sub:specifications->>subcategory,categories!inner(slug)').eq('status', 'ACTIVE').eq('categories.slug', category).range(from, from + 999);
      if (error) break;
      for (const row of (data ?? []) as unknown as Array<{ sub: string | null }>) if (row.sub) counts.set(row.sub, (counts.get(row.sub) ?? 0) + 1);
      if ((data ?? []).length < 1000) break;
    }
    return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

/** A single product (with its description) and a few related products from the same subcategory. */
export async function fetchProduct(slug: string): Promise<{ product: Product; related: Product[] } | null> {
  try {
    const db = await client();
    if (db) {
      const { data, error } = await db.from('products').select(`${LIST_COLUMNS},description`).eq('status', 'ACTIVE').eq('slug', slug).maybeSingle();
      if (!error && data) {
        const product = fromDb(data as unknown as DbProduct);
        let rel = db.from('products').select(LIST_COLUMNS).eq('status', 'ACTIVE').neq('slug', slug).eq('categories.slug', product.categorySlug ?? '');
        if (product.subcategory) rel = rel.eq('specifications->>subcategory', product.subcategory);
        const related = await rel.order('featured', { ascending: false }).limit(8);
        return { product, related: ((related.data ?? []) as unknown as DbProduct[]).map(fromDb) };
      }
      if (!error) return null;
    }
  } catch {
    // fall through to the demo catalogue
  }
  const product = products.find((x) => x.slug === slug);
  return product ? { product, related: products.filter((x) => x.category === product.category && x.id !== product.id).slice(0, 4) } : null;
}
