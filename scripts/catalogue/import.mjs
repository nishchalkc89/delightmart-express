// Loads data/catalogue.csv into your Supabase database.
//
//   node scripts/catalogue/import.mjs            (import / update everything)
//   node scripts/catalogue/import.mjs --dry-run  (only show what would happen)
//
// Needs SUPABASE_URL (or VITE_DELIGHT_SUPABASE_URL) and SUPABASE_SECRET_KEY in .env.
// The secret key is only used here on your computer — never put it in the website code.
//
// What it does:
//   - creates/updates the categories from taxonomy.mjs and hides old categories that are no longer used
//   - creates/updates every product by its slug (name, category, subcategory, unit, price, sale price, featured)
//   - adds a stock record for NEW products only (stock you changed in the admin is never overwritten)
//   - hides (does not delete) products that are no longer in the file, so old orders keep working

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES } from './taxonomy.mjs';
import { readObjects } from './csv.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dryRun = process.argv.includes('--dry-run');

function loadEnv() {
  const file = path.join(root, '.env');
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(fs.readFileSync(file, 'utf8').split(/\r?\n/)
    .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]));
}
const env = { ...loadEnv(), ...process.env };
const url = (env.SUPABASE_URL || env.VITE_DELIGHT_SUPABASE_URL || '').replace(/\/$/, '');
const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL and SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}

// New-style keys (sb_secret_...) go in the apikey header only; older JWT keys also need Authorization.
const auth = key.startsWith('sb_') ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };

async function api(method, route, body, prefer = 'return=minimal') {
  const res = await fetch(`${url}/rest/v1/${route}`, {
    method,
    headers: { ...auth, 'Content-Type': 'application/json', Prefer: prefer },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${route.split('?')[0]} failed (${res.status}): ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function selectAll(table, columns) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${url}/rest/v1/${table}?select=${columns}&order=id`, {
      headers: { ...auth, Range: `${from}-${from + 999}` },
    });
    if (!res.ok) throw new Error(`Reading ${table} failed (${res.status}): ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

const chunk = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

const products = readObjects(fs.readFileSync(path.join(root, 'data/catalogue.csv'), 'utf8')).filter((p) => p.slug && p.name);
const categoryNames = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));
const unknown = products.filter((p) => !categoryNames[p.category]);
if (unknown.length) {
  console.error(`${unknown.length} products use a category that is not in taxonomy.mjs, e.g. "${unknown[0].category}" (${unknown[0].name})`);
  process.exit(1);
}
console.log(`${products.length} products in data/catalogue.csv`);
if (dryRun) {
  console.log('Dry run: nothing was changed.');
  process.exit(0);
}

// 1. Categories
const savedCategories = await api('POST', 'categories?on_conflict=slug',
  CATEGORIES.map((c, i) => ({ slug: c.slug, name: c.name, description: c.description, status: c.hidden ? 'INACTIVE' : 'ACTIVE', sort_order: i + 1, parent_id: null })),
  'resolution=merge-duplicates,return=representation');
const categoryId = Object.fromEntries(savedCategories.map((c) => [c.slug, c.id]));
const allCategories = await selectAll('categories', 'id,slug,status');
const oldCategories = allCategories.filter((c) => !categoryId[c.slug] && c.status === 'ACTIVE');
if (oldCategories.length) await api('PATCH', `categories?id=in.(${oldCategories.map((c) => c.id).join(',')})`, { status: 'INACTIVE' });
console.log(`Categories: ${savedCategories.length} saved, ${oldCategories.length} old ones hidden`);

// 2. Products
const existing = await selectAll('products', 'id,slug,status');
const existingSlugs = new Set(existing.map((p) => p.slug));
const saved = [];
for (const batch of chunk(products, 500)) {
  const rows = batch.map((p) => ({
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    category_id: categoryId[p.category],
    price: Number(p.price),
    sale_price: p.sale_price ? Number(p.sale_price) : null,
    unit: p.unit || '1 pc',
    status: 'ACTIVE',
    featured: p.featured === 'yes',
    description: `${p.name} (${p.unit}) — available at Delight Shopping Mart, Tulsipur. Order online for home delivery or pick it up from the store.`,
    specifications: { subcategory: p.subcategory, display_order: Number(p.display_order) || null },
  }));
  saved.push(...await api('POST', 'products?on_conflict=slug&select=id,slug', rows, 'resolution=merge-duplicates,return=representation'));
  process.stdout.write(`\rProducts saved: ${saved.length}/${products.length}`);
}
console.log();

// 3. Stock for new products only
const stockBySlug = Object.fromEntries(products.map((p) => [p.slug, Number(p.stock) || 0]));
const fresh = saved.filter((p) => !existingSlugs.has(p.slug));
for (const batch of chunk(fresh, 1000)) {
  await api('POST', 'inventory?on_conflict=product_id', batch.map((p) => ({ product_id: p.id, current_stock: stockBySlug[p.slug], low_stock_threshold: 5 })), 'resolution=ignore-duplicates,return=minimal');
}
console.log(`Stock added for ${fresh.length} new products`);

// 4. Hide products that are no longer in the list
const keep = new Set(products.map((p) => p.slug));
const hide = existing.filter((p) => !keep.has(p.slug) && p.status === 'ACTIVE');
for (const batch of chunk(hide, 200)) await api('PATCH', `products?id=in.(${batch.map((p) => p.id).join(',')})`, { status: 'INACTIVE' });
console.log(`Hidden ${hide.length} products that are not in the list`);
console.log('Done.');
