import type { Product } from '@/types/store';
import { asset } from '@/lib/assets';

export type Category = {
  name: string;
  short: string;
  slug: string;
  tagline: string;
  image: string;
  icon: string;
  side: string;
  circle?: string;
};

// Demo catalogue matching the approved Delight reference screens.
export const categories: Category[] = [
  { name: 'Groceries', short: 'Groceries', slug: 'groceries', tagline: 'Daily Essentials', image: asset('tile-groceries'), icon: asset('nav-groceries'), side: asset('side-groceries'), circle: asset('circle-groceries') },
  { name: 'Ladies Wear', short: 'Ladies Wear', slug: 'ladies-wear', tagline: 'Trendy Fashion', image: asset('tile-ladies-wear'), icon: asset('nav-ladies-wear'), side: asset('side-ladies-wear'), circle: asset('circle-ladies-wear') },
  { name: 'Baby Care', short: 'Baby Care', slug: 'baby-care', tagline: 'For Your Little Ones', image: asset('tile-baby-care'), icon: asset('nav-baby-care'), side: asset('side-baby-care'), circle: asset('circle-baby-care') },
  { name: 'Stationery', short: 'Stationery', slug: 'stationery', tagline: 'Study Made Easy', image: asset('tile-stationery'), icon: asset('nav-stationery'), side: asset('side-stationery'), circle: asset('circle-stationery') },
  { name: 'Toys', short: 'Toys', slug: 'toys', tagline: 'Play & Learn', image: asset('tile-toys'), icon: asset('nav-toys'), side: asset('side-toys'), circle: asset('circle-toys') },
  { name: 'Kitchen & Household', short: 'Kitchen', slug: 'kitchen-household', tagline: 'Make Home Better', image: asset('tile-kitchen-household'), icon: asset('nav-kitchen-household'), side: asset('side-kitchen-household'), circle: asset('circle-kitchen-household') },
  { name: 'Beauty & Skincare', short: 'Beauty', slug: 'beauty-skincare', tagline: 'Look Good, Feel Good', image: asset('tile-beauty-skincare'), icon: asset('nav-beauty-skincare'), side: asset('side-beauty-skincare') },
  { name: 'Cafe & Fast Food', short: 'Cafe', slug: 'cafe-fast-food', tagline: 'Tasty & Fresh', image: asset('tile-cafe-fast-food'), icon: asset('nav-cafe-fast-food'), side: asset('side-cafe-fast-food') },
  { name: 'Deals & Offers', short: 'Deals', slug: 'deals-offers', tagline: 'Save More', image: asset('tile-deals-offers'), icon: asset('nav-deals-offers'), side: asset('side-deals-offers') },
];

export const subcategories = [
  { name: 'Rice & Grains', image: asset('sub-rice-grains') },
  { name: 'Cooking Oil', image: asset('sub-cooking-oil') },
  { name: 'Noodles & Pasta', image: asset('sub-noodles-pasta') },
  { name: 'Spices & Masala', image: asset('sub-spices-masala') },
  { name: 'Biscuits & Snacks', image: asset('sub-biscuits-snacks') },
  { name: 'Beverages', image: asset('sub-beverages') },
  { name: 'Dairy & Eggs', image: asset('sub-dairy-eggs') },
  { name: 'Canned Food', image: asset('sub-canned-food') },
];

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

const collectionSlugs = {
  specialOffers: ['daawat-basmati-rice-5kg', 'maggi-2-minute-noodles', 'nivea-body-lotion-400ml', 'nike-ladies-t-shirt', 'pampers-baby-diapers', 'classmate-notebook'],
  popular: ['wireless-headphones', 'running-shoes', 'smart-watch', 'travel-backpack', 'cookware-set-5-pcs', 'teddy-bear-medium'],
  justArrived: ['sunflower-oil-1l', 'school-backpack', 'baby-wipes-72-pcs', 'ladies-kurti', 'maggi-2-minute-noodles', 'sports-shoes'],
  groceryPopular: ['daawat-basmati-rice-5kg', 'maggi-2-minute-noodles', 'sunflower-oil-1l', 'nivea-body-lotion-400ml', 'red-lentils-masoor-dal-1kg', 'fresh-eggs-30-pcs'],
  related: ['jasmine-rice-5kg', 'sunflower-oil-1l', 'masoor-dal-1kg', 'chana-dal-1kg'],
};
export type Collections = Record<keyof typeof collectionSlugs, Product[]>;

/** Homepage/category collections from whatever catalogue is loaded; missing items are topped up so rows stay full. */
export function buildCollections(list: Product[]): Collections {
  const pick = (slugs: string[], size = slugs.length) => {
    const chosen = slugs.map((s) => list.find((x) => x.slug === s)).filter((x): x is Product => Boolean(x));
    for (const p of list) { if (chosen.length >= size) break; if (!chosen.includes(p)) chosen.push(p); }
    return chosen.slice(0, size);
  };
  return {
    specialOffers: pick(collectionSlugs.specialOffers),
    popular: pick(collectionSlugs.popular),
    justArrived: pick(collectionSlugs.justArrived),
    groceryPopular: pick(collectionSlugs.groceryPopular),
    related: pick(collectionSlugs.related),
  };
}

export const collections = buildCollections(products);

export const brands = Array.from({ length: 11 }, (_, i) => asset(`brand-${i + 1}`));

export const getProduct = (slug: string) => products.find((x) => x.slug === slug);
export const formatNpr = (n: number) => `NPR ${n.toLocaleString('en-US')}`;

/* ------------------------------------------------------------------ */
/* Live catalogue (Supabase)                                           */
/* ------------------------------------------------------------------ */

export type Catalog = { products: Product[]; categories: Category[]; source: 'live' | 'demo' };

const demoBySlug = new Map(products.map((x) => [x.slug, x]));

type DbProduct = {
  id: string; slug: string; name: string; brand: string | null; unit: string; price: number; sale_price: number | null;
  description: string; featured: boolean; created_at: string;
  categories: { name: string; slug: string } | null;
  inventory: { current_stock: number; reserved_stock: number } | { current_stock: number; reserved_stock: number }[] | null;
  product_images: { url: string; is_primary: boolean; sort_order: number }[] | null;
};

function fromDb(row: DbProduct): Product {
  const demo = demoBySlug.get(row.slug);
  const inv = Array.isArray(row.inventory) ? row.inventory[0] : row.inventory;
  const images = [...(row.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order).map((i) => i.url);
  const selling = row.sale_price ?? row.price;
  const onSale = row.sale_price !== null && row.sale_price < row.price;
  const fresh = Date.now() - new Date(row.created_at).getTime() < 14 * 86_400_000;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.categories?.name ?? demo?.category ?? 'Groceries',
    subcategory: demo?.subcategory,
    brand: row.brand ?? demo?.brand,
    unit: row.unit ?? demo?.unit ?? '',
    price: Number(selling),
    oldPrice: onSale ? Number(row.price) : undefined,
    discount: onSale ? Math.round((1 - Number(selling) / Number(row.price)) * 100) : undefined,
    image: images[0] ?? demo?.image ?? asset('logo'),
    gallery: images.length > 1 ? images : demo?.gallery,
    stock: inv ? Math.max(0, inv.current_stock - inv.reserved_stock) : 0,
    rating: demo?.rating ?? 4.5,
    reviews: demo?.reviews ?? 0,
    featured: row.featured,
    isNew: demo?.isNew ?? fresh,
    description: row.description || demo?.description || '',
  };
}

/** Loads the active catalogue from Supabase. Falls back to the demo catalogue when the database is unreachable or empty. */
export async function fetchCatalog(): Promise<Catalog> {
  const demo: Catalog = { products, categories, source: 'demo' };
  try {
    const { supabase } = await import('./supabase');
    const [{ data: rows, error }, { data: cats }] = await Promise.all([
      supabase.from('products').select('id,slug,name,brand,unit,price,sale_price,description,featured,created_at,categories(name,slug),inventory(current_stock,reserved_stock),product_images(url,is_primary,sort_order)').eq('status', 'ACTIVE').order('created_at', { ascending: true }),
      supabase.from('categories').select('name,slug,description,image_url,sort_order').eq('status', 'ACTIVE').is('parent_id', null).order('sort_order'),
    ]);
    if (error || !rows?.length) return demo;
    const liveCategories = (cats ?? []).map((c) => {
      const visual = categories.find((x) => x.slug === c.slug);
      return visual ? { ...visual, name: c.name, image: c.image_url ?? visual.image } : { name: c.name, short: c.name, slug: c.slug, tagline: c.description ?? '', image: c.image_url ?? asset('tile-groceries'), icon: c.image_url ?? asset('nav-groceries'), side: c.image_url ?? asset('side-groceries') };
    });
    return { products: (rows as unknown as DbProduct[]).map(fromDb), categories: liveCategories.length ? liveCategories : categories, source: 'live' };
  } catch {
    return demo;
  }
}
