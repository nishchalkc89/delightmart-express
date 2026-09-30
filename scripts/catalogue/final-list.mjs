// Keeps ONLY the products in data/final-list.json on the website (the store's current list) and hides
// every other product. Nothing is deleted: hidden products can be switched back on in Admin → Products.
//
//   node scripts/catalogue/final-list.mjs            (dry run: shows what would change)
//   node scripts/catalogue/final-list.mjs --apply    (makes the changes)
//
// For each row: product code → SKU "DM-<code>" (shown in admin only), price = MRP, Tulsipur stock = closing
// stock. Products that sat in removed categories move to the closest active category.
// Needs SUPABASE_URL (or VITE_DELIGHT_SUPABASE_URL) and SUPABASE_SECRET_KEY in .env.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l))
  .map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')]; }));
const url = (env.SUPABASE_URL || env.VITE_DELIGHT_SUPABASE_URL || '').replace(/\/$/, '');
const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing SUPABASE_URL and SUPABASE_SECRET_KEY in .env'); process.exit(1); }
const APPLY = process.argv.includes('--apply');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

async function api(method, route, body, prefer = 'return=minimal') {
  const res = await fetch(`${url}/rest/v1/${route}`, { method, headers: { ...headers, Prefer: prefer }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!res.ok) throw new Error(`${method} ${route.split('?')[0]} failed (${res.status}): ${await res.text()}`);
  return res.status === 204 ? null : res.json().catch(() => null);
}
async function selectAll(table, columns) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${url}/rest/v1/${table}?select=${columns}&order=id`, { headers: { ...headers, Range: `${from}-${from + 999}` } });
    if (!res.ok) throw new Error(`Reading ${table} failed: ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const slugify = (s) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const titleCase = (s) => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));

// Where products from removed categories (and the few new ones) go.
function placeFor(name, catSlug, sub) {
  const n = name.toLowerCase();
  if (/swiss roll|cake/.test(n)) return ['snacks', 'Cakes & Bakery'];
  if (/biscuit|cookie/.test(n)) return ['snacks', 'Biscuits & Cookies'];
  if (/rabbit|rabit|candy|chocolate|chewgum/.test(n)) return ['snacks', 'Chocolates & Candy'];
  if (/tea\b|coffee|juice|drink|flavour 320ml|bubble tea/.test(n)) return ['groceries', 'Tea, Coffee & Drinks'];
  if (/earing|earring|jewel|925/.test(n)) return ['beauty-skincare', 'Jewellery'];
  if (/clip|kata|band|rubber|rabbar|bun cover|comb|hair/.test(n)) return ['beauty-skincare', 'Hair Accessories'];
  if (/mirror/.test(n)) return ['beauty-skincare', 'Beauty Tools'];
  if (/cotton swab|swabs|bud/.test(n)) return ['beauty-skincare', 'Personal Care'];
  if (/battery|fan\b/.test(n)) return ['kitchen-household', 'Batteries & Electricals'];
  if (/zipper|bag/.test(n)) return ['kitchen-household', 'Storage & Containers'];
  if (/candle|keyring|key ring/.test(n)) return ['gifts-puja', 'Gifts & Party'];
  return [catSlug, sub];
}

const list = JSON.parse(fs.readFileSync(path.join(root, 'data/final-list.json'), 'utf8'));
const categories = await selectAll('categories', 'id,slug,status');
const catBySlug = new Map(categories.map((c) => [c.slug, c]));
const catById = new Map(categories.map((c) => [c.id, c]));
const products = await selectAll('products', 'id,sku,name,slug,status,category_id,specifications,unit');
const bySku = new Map(products.map((p) => [p.sku, p]));
const slugs = new Set(products.map((p) => p.slug));

// Most sold products are "Popular" on the home page.
const topSold = new Set([...list].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 24).map((r) => r.code));

const plan = [];
for (const r of list) {
  const sku = `DM-${r.code}`;
  let p = bySku.get(sku);
  let renamed = false;
  if (!p) {
    // Older imports dropped trailing zeros (4.1470 → 4.147); accept that product only if the name matches.
    const short = bySku.get(`DM-${r.code.replace(/\.?0+$/, '')}`);
    if (short && norm(short.name) === norm(r.name)) { p = short; renamed = true; }
  }
  const cat = p ? catById.get(p.category_id) : null;
  const sub = p?.specifications?.subcategory ?? '';
  const [slug, subcategory] = !p || cat?.status !== 'ACTIVE' ? placeFor(r.name, cat?.slug ?? 'groceries', sub) : [cat.slug, sub];
  if (!catBySlug.get(slug)) throw new Error(`Unknown category ${slug} for ${r.name}`);
  plan.push({ r, p, sku, renamed, slug, subcategory, moved: Boolean(p && cat?.slug !== slug) });
}

const keep = new Set(plan.filter((x) => x.p).map((x) => x.p.id));
const hide = products.filter((p) => !keep.has(p.id) && p.status === 'ACTIVE');
console.log(`List: ${list.length} products — ${plan.filter((x) => x.p && !x.renamed).length} matched by code, ${plan.filter((x) => x.renamed).length} matched after fixing the code, ${plan.filter((x) => !x.p).length} new.`);
console.log(`Moved to another category: ${plan.filter((x) => x.moved).length}. Other products to hide: ${hide.length}.`);
for (const x of plan.filter((y) => y.moved || !y.p)) console.log(`  ${x.p ? 'move' : 'new '}  ${x.r.code.padEnd(8)} ${x.r.name.slice(0, 44).padEnd(45)} → ${x.slug} / ${x.subcategory}`);
if (!APPLY) { console.log('\nDry run. Add --apply to make these changes.'); process.exit(0); }

const now = new Date().toISOString();
for (const x of plan) {
  const row = {
    sku: x.sku, status: 'ACTIVE', price: Number(x.r.mrp), sale_price: null, category_id: catBySlug.get(x.slug).id,
    featured: topSold.has(x.r.code), updated_at: now,
  };
  if (x.p) {
    await api('PATCH', `products?id=eq.${x.p.id}`, { ...row, specifications: { ...(x.p.specifications ?? {}), subcategory: x.subcategory, product_code: x.r.code } });
  } else {
    const name = titleCase(x.r.name);
    let slug = slugify(name) || `product-${x.r.code}`;
    while (slugs.has(slug)) slug = `${slug}-${x.r.code.replace('.', '-')}`;
    slugs.add(slug);
    const [created] = await api('POST', 'products', { ...row, name, slug, unit: '1 pc', description: '', specifications: { subcategory: x.subcategory, product_code: x.r.code } }, 'return=representation');
    x.p = created;
  }
}
console.log('Products updated.');

// Tulsipur stock = closing stock from the list (Ghorahi keeps its own stock).
for (const batch of chunk(plan, 200)) {
  await api('POST', 'branch_inventory?on_conflict=branch_id,product_id', batch.map((x) => ({ branch_id: 'tulsipur', product_id: x.p.id, current_stock: Math.max(0, Math.round(Number(x.r.stock) || 0)), reserved_stock: 0, last_updated: now })), 'resolution=merge-duplicates,return=minimal');
}
console.log('Tulsipur stock set.');

for (const batch of chunk(hide, 200)) await api('PATCH', `products?id=in.(${batch.map((p) => p.id).join(',')})`, { status: 'INACTIVE', featured: false, updated_at: now });
console.log(`Hidden: ${hide.length} products.`);

// Categories with nothing left to show are switched off (removed ones stay removed).
const used = new Set(plan.map((x) => x.slug));
const empty = categories.filter((c) => c.status === 'ACTIVE' && !c.parent_id && !used.has(c.slug));
if (empty.length) await api('PATCH', `categories?id=in.(${empty.map((c) => c.id).join(',')})`, { status: 'INACTIVE' });
console.log(`Categories now on the website: ${[...used].join(', ')}${empty.length ? ` (switched off, empty: ${empty.map((c) => c.slug).join(', ')})` : ''}`);
