// Demo data matching the approved admin reference screens. Replace with Supabase queries when wiring data.
import { asset } from '@/lib/assets';

export const people = {
  sujan: { name: 'Sujan Thapa', phone: '9801234567', email: 'sujan@example.com', avatar: asset('av-sujan') },
  aarati: { name: 'Aarati KC', phone: '9812345678', email: 'aarati@example.com', avatar: asset('av-aarati') },
  bikash: { name: 'Bikash Oli', phone: '9845678901', email: 'bikash@example.com', avatar: asset('av-bikash') },
  sangita: { name: 'Sangita Magar', phone: '9809876543', email: 'sangita@example.com', avatar: asset('av-sangita') },
  ramesh: { name: 'Ramesh BK', phone: '9811122233', email: 'ramesh@example.com', avatar: asset('av-ramesh') },
  sita: { name: 'Sita Sharma', phone: '9843216540', email: 'sita@example.com', avatar: asset('av-sita') },
  kiran: { name: 'Kiran Nepali', phone: '9807766554', email: 'kiran@example.com', avatar: asset('av-kiran') },
  prabin: { name: 'Prabin Chaudhary', phone: '9819988776', email: 'prabin@example.com', avatar: asset('av-prabin') },
  anjali: { name: 'Anjali Gurung', phone: '9823456789', email: 'anjali@example.com', avatar: asset('av-anjali') },
  dipesh: { name: 'Dipesh Rana', phone: '9806677889', email: 'dipesh@example.com', avatar: asset('av-dipesh') },
  nishchal: { name: 'Nishchal Kc', phone: '9801234567', email: 'nishchal@example.com', avatar: asset('av-nishchal') },
};
export type Person = (typeof people)[keyof typeof people];

export const adminProducts = [
  { name: 'Daawat Basmati Rice 5kg', short: 'Daawat Basmati Rice 5kg', sku: 'SKU00123', category: 'Groceries', invCategory: 'Rice & Dal', price: 1250, old: 1420, stock: 8, threshold: 10, img: asset('a-rice'), active: true, updated: '21 Sep 2026' },
  { name: 'Maggi Noodles 70g', short: 'Maggi Noodles 70g', sku: 'SKU00124', category: 'Snacks & Beverages', invCategory: 'Snacks & Beverages', price: 85, old: 100, stock: 120, threshold: 20, img: asset('a-maggi'), active: true, updated: '21 Sep 2026' },
  { name: 'Nivea Body Lotion 400ml', short: 'Nivea Body Lotion 400ml', sku: 'SKU00125', category: 'Personal Care', invCategory: 'Personal Care', price: 450, old: 530, stock: 45, threshold: 20, img: asset('a-nivea'), active: true, updated: '20 Sep 2026' },
  { name: 'Coca-Cola 1.5L', short: 'Coca-Cola 1.5L', sku: 'SKU00126', category: 'Snacks & Beverages', invCategory: 'Snacks & Beverages', price: 150, old: 0, stock: 0, threshold: 10, img: asset('a-coke'), active: false, updated: '20 Sep 2026' },
  { name: 'Surf Excel 1kg', short: 'Surf Excel 1kg', sku: 'SKU00127', category: 'Household Essentials', invCategory: 'Household Essentials', price: 320, old: 360, stock: 6, threshold: 10, img: asset('a-surf'), active: true, updated: '19 Sep 2026' },
  { name: 'Fresh Red Apples 1kg', short: 'Fresh Red Apples 1kg', sku: 'SKU00128', category: 'Fruits & Vegetables', invCategory: 'Fruits & Vegetables', price: 280, old: 310, stock: 50, threshold: 15, img: asset('a-apples'), active: true, updated: '19 Sep 2026' },
  { name: 'Atta 5kg', short: 'Atta 5kg', sku: 'SKU00129', category: 'Atta, Rice & Dal', invCategory: 'Atta, Rice & Dal', price: 340, old: 0, stock: 25, threshold: 10, img: asset('a-atta'), active: true, updated: '18 Sep 2026' },
  { name: 'Colgate Toothpaste 100g', short: 'Colgate Toothpaste 100g', sku: 'SKU00130', category: 'Personal Care', invCategory: 'Personal Care', price: 180, old: 200, stock: 14, threshold: 20, img: asset('a-colgate'), active: true, updated: '18 Sep 2026' },
  { name: 'Notebook Single Line', short: 'Notebook Single Line', sku: 'SKU00131', category: 'Stationery & Office', invCategory: 'Stationery & Office', price: 50, old: 0, stock: 200, threshold: 50, img: asset('a-notebook'), active: true, updated: '17 Sep 2026' },
  { name: 'T-Shirt (Men)', short: 'T-Shirt (Men)', sku: 'SKU00132', category: 'Fashion & Lifestyle', invCategory: 'Fashion & Lifestyle', price: 499, old: 0, stock: 32, threshold: 15, img: asset('a-tshirt'), active: true, updated: '17 Sep 2026' },
];

export const categoryTone: Record<string, 'teal' | 'orange' | 'blue' | 'purple' | 'green' | 'amber' | 'pink'> = {
  Groceries: 'teal',
  'Snacks & Beverages': 'orange',
  'Personal Care': 'blue',
  'Household Essentials': 'purple',
  'Fruits & Vegetables': 'green',
  'Atta, Rice & Dal': 'amber',
  'Stationery & Office': 'pink',
  'Fashion & Lifestyle': 'pink',
};

/** The approved sample products in the shape the admin data service returns. */
export const demoAdminProducts = adminProducts.map((p, i) => ({
  id: `demo-${i}`, name: p.name, slug: p.sku, sku: p.sku, category: p.category, price: p.price, oldPrice: p.old,
  stock: p.stock, threshold: p.threshold, active: p.active, image: p.img, updatedAt: p.updated, invCategory: p.invCategory, short: p.short,
}));

export const npr = (n: number) => `NPR ${n.toLocaleString('en-US')}`;
