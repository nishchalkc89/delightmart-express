// Turns the store's product list (data/store-products.csv) into the website catalogue (data/catalogue.csv).
//
//   node scripts/catalogue/prepare.mjs
//
// For every product it:
//   - sorts it into a category and subcategory (rules in taxonomy.mjs)
//   - tidies the name and reads the pack size ("500g", "1ltr", "12pcs") as the unit
//   - sets an ESTIMATED price from the subcategory and pack size (replace with real prices later)
//   - gives some products a small discount and marks well-known brands as featured
//
// data/catalogue.csv is what gets imported. You can open it in Excel, correct prices or
// categories, save it, and run the import again: scripts/catalogue/import.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, classify } from './taxonomy.mjs';
import { parseCsv, toCsv } from './csv.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = process.argv[2] ?? path.join(root, 'data/store-products.csv');
const target = path.join(root, 'data/catalogue.csv');

// [price for one ordinary item, price per 100 g/ml, lowest, highest] — rough Tulsipur shelf prices in NPR.
const PRICING = {
  'Rice & Grains': [180, 25, 60, 4500], 'Atta, Flour & Sooji': [120, 12, 40, 3500], 'Dal & Pulses': [180, 22, 50, 1200],
  'Oil & Ghee': [350, 32, 80, 3200], 'Spices & Masala': [90, 60, 20, 900], 'Salt, Sugar & Jaggery': [60, 12, 20, 600],
  'Noodles, Pasta & Soup': [45, 35, 20, 600], 'Breakfast & Cereals': [350, 70, 60, 1800], 'Dry Fruits, Nuts & Seeds': [350, 170, 60, 3500],
  'Sauces, Pickles & Spreads': [220, 55, 50, 2200], 'Cooking Essentials': [120, 60, 20, 900], 'Fruits & Vegetables': [120, 15, 30, 600],
  'Biscuits & Cookies': [60, 55, 10, 900], 'Chips, Namkeen & Snacks': [60, 65, 10, 900], 'Chocolates & Candy': [100, 180, 5, 3500],
  'Tea & Coffee': [250, 140, 30, 3500], 'Health & Energy Drinks': [350, 90, 40, 2500], 'Soft Drinks & Soda': [80, 12, 30, 400],
  'Juices & Squash': [120, 18, 25, 700], 'Water': [30, 3, 20, 150],
  'Milk, Butter & Cheese': [250, 90, 40, 2800], 'Ice Cream & Frozen': [250, 55, 40, 1800], 'Bread, Cakes & Bakery': [80, 45, 20, 700], 'Eggs & Meat': [450, 70, 60, 1600],
  'Skin Care': [450, 260, 60, 3500], 'Hair Care': [350, 110, 50, 2500], 'Bath & Body': [180, 105, 40, 1500], 'Oral Care': [120, 110, 30, 800],
  'Makeup & Nail Care': [350, 900, 50, 3500], 'Fragrance & Deodorant': [450, 380, 120, 4500], "Men's Grooming": [300, 180, 50, 2500],
  'Feminine Hygiene': [180, 40, 60, 900], 'Health & Wellness': [250, 120, 20, 2500],
  'Diapers & Wipes': [650, 30, 150, 3500], 'Baby Food & Formula': [900, 190, 150, 4500], 'Baby Bath & Skin Care': [350, 140, 80, 2000], 'Baby Accessories': [450, 0, 60, 4500],
  'Detergent & Laundry': [250, 28, 20, 2800], 'Dishwash': [120, 30, 10, 700], 'Floor, Toilet & Glass Cleaners': [250, 30, 40, 1800],
  'Tissues & Paper': [120, 40, 30, 800], 'Fresheners & Repellents': [220, 70, 30, 900],
  'Cookware': [1800, 0, 300, 6500], 'Kitchen Tools': [250, 0, 30, 2500], 'Cups, Mugs & Glassware': [350, 0, 60, 3500],
  'Dinnerware & Serving': [450, 0, 60, 4500], 'Bottles & Lunch Boxes': [550, 45, 80, 3500],
  'Storage & Organisers': [450, 0, 50, 4500], 'Home Decor & Furnishing': [650, 0, 80, 5500], 'Bags, Umbrellas & Travel': [850, 0, 150, 5500],
  'Tools, Hardware & Auto': [350, 0, 30, 3500], 'Everyday Essentials': [250, 50, 20, 2500],
  'Notebooks & Paper': [120, 0, 20, 900], 'Pens, Pencils & Erasers': [40, 0, 10, 900], 'Art & Craft': [250, 0, 30, 2500], 'School & Office Supplies': [150, 0, 20, 2500],
  Toys: [850, 0, 100, 6500], 'Games & Puzzles': [450, 0, 60, 3500], 'Sports & Fitness': [650, 0, 100, 6500],
  Jewellery: [250, 0, 50, 2500], 'Hair Accessories': [80, 0, 10, 600], 'Bags, Watches & Eyewear': [850, 0, 150, 4500], Footwear: [1200, 0, 250, 5500], Clothing: [950, 0, 150, 5500],
  'Kitchen Appliances': [3500, 0, 800, 12000], 'Personal Care Appliances': [1800, 0, 500, 6500], 'Lights & Electricals': [350, 0, 40, 4500],
  'Mobile & Audio': [950, 0, 150, 6500], 'Appliances & Gadgets': [1500, 0, 150, 9000],
  'Gifts & Party': [250, 0, 20, 3500], 'Puja Items': [80, 0, 10, 900],
  'Pet Food & Accessories': [450, 60, 80, 6500],
  Beer: [350, 60, 180, 900], Wine: [1800, 230, 600, 9000], 'Whisky, Rum & Spirits': [1500, 380, 250, 14000], 'Hookah & Smoking': [350, 0, 30, 3500],
};
// Well-known premium/imported names cost more.
const PREMIUM = /ferrero|raffaello|toblerone|lindt|nutella|glenlivet|chivas|johnnie|jack daniel|absolut|singleton|vat 69|black label|bioderma|cetaphil|l'?oreal|loreal|maybelline|huda|mac\b|bellavita|borges|pintola|kinder|hershey|royal canin|similac|aptamil|philips|baltra/i;
const BUDGET = /\brs ?\d+\b|\bsingle\b|small|mini\b/i;
// Names people look for first; used to pick featured products for the homepage.
const POPULAR = /\b(maggi|wai ?wai|coca|coke|pepsi|sprite|fanta|dairy milk|kitkat|oreo|parle|britannia|good ?day|lays|kurkure|colgate|dettol|lifebuoy|surf excel|ariel|tide|harpic|lizol|dove|nivea|pond'?s|garnier|himalaya|pampers|huggies|nescafe|horlicks|tokla|red bull|real juice|frooti|amul|daawat|india gate|fortune|haldiram|bikaji|patanjali|dabur|vaseline|sunsilk|head ?& ?shoulders|pantene|whisper|stayfree|tuborg|old durbar|8848|classmate|doms|cello)\b/i;

const UNIT_WORDS = new Set(['g', 'gm', 'gms', 'kg', 'ml', 'l', 'ltr', 'lt', 'litre', 'pcs', 'pc', 'x', 'mm', 'cm']);

function hash(text) {
  let h = 2166136261;
  for (const c of text) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

function tidyName(raw) {
  return raw.replace(/\s+/g, ' ').trim()
    .split(' ')
    .map((w) => (/^[a-z][a-z'&.-]*$/.test(w) && !UNIT_WORDS.has(w) ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Reads the pack size from the name, e.g. "Maggi 280g" -> { text: '280g', grams: 280 }. */
function packSize(name) {
  const n = name.toLowerCase().replace(/,/g, '');
  const m = [...n.matchAll(/(\d+(?:\.\d+)?)\s*(?:x\s*(\d+(?:\.\d+)?)\s*)?(kg|kgs|gm|gms|gram|grams|g|ml|ltr|litre|liter|lt|l|pcs|pc|pieces|sheets|pads|bags|s)\b/g)];
  if (!m.length) return null;
  const weighed = m.find((x) => /^(kg|kgs|gm|gms|gram|grams|g|ml|ltr|litre|liter|lt|l)$/.test(x[3]));
  const [, a, b, unitRaw] = weighed ?? m[0];
  let qty = Number(a) * (b ? Number(b) : 1);
  const unit = unitRaw.replace(/^(gms?|grams?)$/, 'g').replace(/^kgs$/, 'kg').replace(/^(litre|liter|lt|ltr)$/, 'l');
  const text = `${b ? `${a} x ${b}` : a}${{ g: 'g', kg: 'kg', ml: 'ml', l: 'L', pcs: ' pcs', pc: ' pc', pieces: ' pcs', sheets: ' sheets', pads: ' pads', bags: ' bags', s: ' pcs' }[unit] ?? unit}`;
  let grams = null;
  if (unit === 'g' || unit === 'ml') grams = qty;
  if (unit === 'kg' || unit === 'l') grams = qty * 1000;
  if (grams !== null && (grams <= 0 || grams > 60000)) grams = null;
  return { text, grams, count: grams === null ? qty : null };
}

function nicePrice(p) {
  if (p < 100) return Math.max(5, Math.round(p / 5) * 5);
  if (p < 1000) return Math.round(p / 5) * 5;
  if (p < 5000) return Math.round(p / 10) * 10;
  return Math.round(p / 50) * 50;
}

function estimatePrice(sub, name, size) {
  const [base, per100, lo, hi] = PRICING[sub] ?? [250, 60, 20, 5000];
  let price = base;
  if (size?.grams && per100) price = per100 * (size.grams / 100) ** 0.9 + base * 0.12; // bigger packs are a bit cheaper per gram
  if (PREMIUM.test(name)) price *= 1.6;
  if (/coffee|nescafe|\bbru\b/i.test(name)) price *= 1.8;
  if (BUDGET.test(name)) price *= 0.6;
  const rs = name.match(/\brs\.? ?(\d{1,4})\b/i); // "Rs 50" in the name is the printed price
  if (rs) price = Number(rs[1]);
  price *= 0.88 + hash(name) * 0.24; // small natural spread so similar items do not all cost the same
  return nicePrice(Math.min(hi, Math.max(lo, price)));
}

const rows = parseCsv(fs.readFileSync(source, 'utf8'));
const header = rows.shift().map((h) => h.trim());
const col = (name) => header.indexOf(name);
const [cName, cCode, cCat, cSlug, cUom, cOrder] = ['Product Name', 'Product Code', 'Category', 'Slug', 'UoM', 'Display Order'].map(col);

const seenSlug = new Map();
const seenSku = new Map();
const out = [];
for (const r of rows) {
  const rawName = (r[cName] ?? '').trim();
  if (!rawName) continue;
  const name = tidyName(rawName);
  const { cat, sub } = classify(rawName, r[cCat]);
  const size = packSize(rawName);
  let slug = (r[cSlug] || rawName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const n = (seenSlug.get(slug) ?? 0) + 1; seenSlug.set(slug, n);
  if (n > 1) slug = `${slug}-${n}`;
  let sku = `DM-${String(r[cCode] ?? '').trim() || slug}`;
  const k = (seenSku.get(sku) ?? 0) + 1; seenSku.set(sku, k);
  if (k > 1) sku = `${sku}-${k}`;

  const price = estimatePrice(sub, rawName, size);
  const h = hash(slug);
  const onSale = h < 0.16 && price >= 50;
  const sale = onSale ? nicePrice(price * (0.8 + hash(`${slug}sale`) * 0.15)) : '';
  const unit = size?.text ?? ({ pkt: '1 pkt', pack: '1 pack', set: '1 set', box: '1 box', bottle: '1 bottle', bttl: '1 bottle', btl: '1 bottle', can: '1 can', jar: '1 jar', kg: '1 kg', ltr: '1 L' }[String(r[cUom] ?? '').trim().toLowerCase()] ?? '1 pc');
  out.push({
    sku, slug, name, category: cat, subcategory: sub, unit,
    price, sale_price: sale !== '' && sale < price ? sale : '',
    stock: 8 + Math.floor(hash(`${slug}stock`) * 52),
    featured: POPULAR.test(rawName) && h > 0.55 ? 'yes' : '',
    display_order: r[cOrder] ?? '',
  });
}

fs.writeFileSync(target, toCsv(out));
const byCat = Object.fromEntries(CATEGORIES.map((c) => [c.slug, 0]));
for (const p of out) byCat[p.category]++;
console.log(`Wrote ${out.length} products to ${path.relative(root, target)}`);
console.table(CATEGORIES.map((c) => ({ category: c.name, products: byCat[c.slug] })));
