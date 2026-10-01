// Writes a short tagline and a proper description for every product on the website, and moves
// products that the automatic sorting put in the wrong category.
//
//   node scripts/catalogue/describe.mjs            (dry run: prints what it would write)
//   node scripts/catalogue/describe.mjs --apply
//
// The tagline (specifications.tagline) is shown on the product tile until a photo is uploaded;
// the description is shown on the product page. Needs SUPABASE_SECRET_KEY in .env.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l))
  .map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')]; }));
const url = (env.SUPABASE_URL || env.VITE_DELIGHT_SUPABASE_URL || '').replace(/\/$/, '');
const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes('--apply');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

// Products the automatic sorting put in the wrong place: [name pattern, category slug, subcategory].
const MOVES = [
  [/lips strawerry candy|amos peelerz|rich cream fudge|hazelnut cream with cocoa|alfredo no sugar|coco world coconut bar|jellido|jelly jar/i, 'snacks', 'Chocolates & Candy'],
  [/soda biscuit/i, 'snacks', 'Biscuits & Cookies'],
  [/bath flowers scrubber|bath ball/i, 'beauty-skincare', 'Personal Care'],
  [/madoc royal|royal\/lacmi/i, 'snacks', 'Chocolates & Candy'],
  [/raping paper|wrapping paper/i, 'gifts-puja', 'Gifts & Party'],
];

// [pattern, tagline, what it is / how it's used]. First match wins; patterns are tried on the product name.
const RULES = [
  // Specific products first (so a word inside another word, like "nut" in "Vinut", cannot win).
  [/no sugar added/i, 'Sugar-free chocolate', 'Chocolate with no added sugar, for a sweet treat with less sugar.'],
  [/scrubber|bath ball|bath flower/i, 'Soft bath scrubber', 'A soft bath scrubber for a refreshing, foamy bath.'],
  [/butterfly clip/i, 'Butterfly paper clips', 'Clips to hold papers together neatly.'],
  [/balloon/i, 'Party balloons', 'Colourful balloons for birthdays and celebrations.'],
  [/bubble tea/i, 'Ready-to-drink bubble tea', 'Bubble tea with fruity jelly pieces, ready to drink.'],
  [/juice|drink|joiner/i, 'Refreshing fruit drink', 'A chilled fruit drink, refreshing on a hot day.'],
  [/\boats?\b|oat choco/i, 'Chocolate oat breakfast', 'A quick chocolate oat breakfast, ready with hot water or milk.'],
  [/seasoning/i, 'Pizza & pasta seasoning', 'A herb seasoning mix for pizza, pasta and garlic bread.'],
  [/cocomio/i, 'Chocolate wafer bar', 'A crispy wafer bar coated in chocolate.'],
  [/madoc|lacmi/i, 'Rich milk chocolate', 'Smooth milk chocolate for sharing, gifting or a sweet break.'],
  [/wafer.*(choc|cocolate)/i, 'Chocolate wafers', 'Crispy wafers with chocolate flavour.'],
  // Snacks
  [/marshmallow/i, 'Soft, fluffy marshmallows', 'Light and fluffy marshmallows, great on their own, in hot chocolate or for parties.'],
  [/chewgum|chewing gum/i, 'Fresh, long-lasting chewing gum', 'Chewing gum for fresh breath on the go.'],
  [/soan papdi/i, 'Classic flaky Indian sweet', 'Melt-in-the-mouth soan papdi made with desi ghee, a favourite for festivals and guests.'],
  [/jelly|gelly|jellies|pudding/i, 'Fruity jelly sweets', 'Soft, fruity jelly sweets that kids and grown-ups love.'],
  [/toffee|caramel/i, 'Rich, chewy toffee', 'Smooth caramel toffee sweets, perfect for a little treat.'],
  [/fudge/i, 'Creamy fudge treat', 'Rich and creamy fudge for a sweet moment.'],
  [/peelerz|lollipop|candy|pops\b|magic pops|milk candy|white rab/i, 'Sweet candy treat', 'Colourful sweets for kids, parties and everyday treats.'],
  [/coconut bar|cocos/i, 'Chocolate with coconut', 'Chocolate with a soft coconut filling, ideal for sharing.'],
  [/hazelnut|nusco|nutella|choco jaam/i, 'Chocolate hazelnut treat', 'Smooth chocolate hazelnut spread, delicious on bread, biscuits and snacks.'],
  [/truffle|truffica/i, 'Smooth chocolate truffles', 'Assorted chocolate truffles with a soft centre, lovely for gifting.'],
  [/(choc|chocolate).*(heart|love|rose|decor|box)|(heart|love|rose|decor).*(choc|chocolate)|chocolate box|coin box/i, 'Chocolates for gifting', 'A box of chocolates, a sweet gift for birthdays, festivals and loved ones.'],
  [/85%|73%|dark/i, 'Rich dark chocolate', 'Intense dark chocolate for those who love a deeper cocoa taste.'],
  [/compound/i, 'Chocolate for baking & desserts', 'Compound chocolate that melts smoothly, ideal for cakes, desserts and home baking.'],
  [/almond|\bnuts?\b/i, 'Chocolate with crunchy nuts', 'Chocolate with crunchy nuts in every bite.'],
  [/oreo|orego|cookies cream/i, 'Cream-filled chocolate cookies', 'Chocolate cookies with a creamy filling.'],
  [/choc|cocolate|chocolate/i, 'Rich chocolate treat', 'Smooth, rich chocolate for a sweet break, sharing or gifting.'],
  [/wafer ball|wafer/i, 'Crispy wafer biscuits', 'Light, crispy wafers with a creamy filling.'],
  [/cracker/i, 'Light, crispy crackers', 'Crisp, light crackers, great with tea or as a quick snack.'],
  [/swiss roll|cake/i, 'Soft Swiss roll cake', 'Soft sponge cake rolled with a creamy filling, perfect with tea.'],
  [/biscuit|cookie/i, 'Crunchy biscuits', 'Tasty biscuits for tea time, tiffin boxes and snacking.'],
  [/seaweed|chips|namkeen/i, 'Crispy savoury snack', 'A crispy, savoury snack for any time of the day.'],
  [/rolls/i, 'Crispy chocolate rolls', 'Crispy rolls with a smooth filling.'],
  // Groceries
  [/buldak|kimchi|shin\b/i, 'Spicy Korean instant noodles', 'Bold, spicy Korean noodles ready in minutes.'],
  [/noodle/i, 'Quick, tasty instant noodles', 'Instant noodles ready in a few minutes, a quick and filling meal.'],
  [/pasta sauce/i, 'Ready-to-use pasta sauce', 'Tomato pasta sauce for an easy Italian-style meal at home.'],
  [/pasta/i, 'Italian-style pasta', 'Pasta that cooks evenly, ready for your favourite sauce.'],
  [/seasoning/i, 'Pizza & pasta seasoning', 'A herb seasoning mix for pizza, pasta and garlic bread.'],
  [/oregano|rosemary/i, 'Dried herbs for cooking', 'Aromatic dried herbs for pizza, pasta, soups and grills.'],
  [/peri peri|garlic|onion powder|chilli garlic/i, 'Flavourful seasoning', 'A tasty seasoning to spice up snacks, fries, meats and vegetables.'],
  [/paan masala/i, 'Sweet paan mouth freshener', 'Paan-flavoured mouth freshener mix, nice after meals.'],
  [/chicken masala|meat masala|masala/i, 'Spice mix for curries', 'A ready spice blend for rich, tasty curries at home.'],
  [/mayonnaise/i, 'Creamy mayonnaise', 'Creamy mayonnaise for sandwiches, burgers, salads and dips.'],
  [/mustrad|mustard/i, 'Tangy mustard sauce', 'Tangy mustard sauce for burgers, hot dogs and sandwiches.'],
  [/olive/i, 'Pitted olives', 'Pitted olives for pizza, salads and snacks.'],
  [/oat/i, 'Chocolate oat breakfast', 'A quick chocolate oat breakfast, ready with hot water or milk.'],
  [/cocoa powder/i, 'Cocoa powder for baking', 'Cocoa powder for cakes, brownies and hot chocolate.'],
  [/green tea|tea\b/i, 'Fragrant green tea', 'Light, fragrant tea for a refreshing cup any time of the day.'],
  [/bubble tea/i, 'Ready-to-drink bubble tea', 'Bubble tea with fruity jelly pieces, ready to drink.'],
  [/juice|drink|flavour 320ml|joiner/i, 'Refreshing fruit drink', 'A chilled fruit drink, refreshing on a hot day.'],
  // Baby
  [/diaper|dipaper/i, 'Soft, absorbent diapers', 'Soft, absorbent diapers to keep your baby dry and comfortable day and night.'],
  [/wipes/i, 'Gentle baby wipes', 'Soft, gentle wet wipes for baby’s skin, handy at home and on the go.'],
  [/nipple/i, 'Soft feeding bottle nipple', 'A soft silicone nipple for baby feeding bottles.'],
  [/pacifier/i, 'Soft baby pacifier', 'A soft pacifier to comfort and soothe your baby.'],
  [/teether/i, 'Baby teether', 'A safe teether to soothe your baby’s gums while teething.'],
  [/aspirator/i, 'Baby nasal aspirator', 'Gently clears a stuffy nose for babies and toddlers.'],
  [/feeder/i, 'Baby food feeder', 'A feeder to help your baby try new foods safely.'],
  [/spoon/i, 'Soft baby spoon', 'A soft silicone spoon that is gentle on little gums.'],
  [/toothbrush/i, 'Toothbrush for clean teeth', 'A toothbrush with soft bristles for a gentle, thorough clean.'],
  [/nail clipper|nail cutter|scissors/i, 'Nail clipper', 'A handy nail clipper for neat, safe nail care.'],
  // Beauty
  [/lipstick/i, 'Matte liquid lipstick', 'A long-lasting matte liquid lipstick with rich colour.'],
  [/earing|earring|jewel|925/i, 'Fashion earrings', 'Pretty fashion earrings to complete your look.'],
  [/comb|brush/i, 'Comb & hair brush', 'A comb brush for everyday hair styling.'],
  [/clip|kata|band|rubber|rabbar|bun cover|hair/i, 'Hair accessory', 'A pretty hair accessory for everyday style.'],
  [/mirror/i, 'Pocket mirror', 'A compact pocket mirror for touch-ups on the go.'],
  [/cotton swab|swabs/i, 'Paper cotton swabs', 'Soft cotton swabs for everyday personal care.'],
  [/scrubber|bath ball|bath flower/i, 'Soft bath scrubber', 'A soft bath scrubber for a refreshing, foamy bath.'],
  // Home & cleaning
  [/toilet paper|tissue/i, 'Soft tissue paper', 'Soft, strong tissues for home, office and car.'],
  [/fridge bottle/i, 'Fridge water bottle', 'A water bottle that keeps water handy and chilled in the fridge.'],
  [/bottle/i, 'Water bottle', 'A handy water bottle for school, office, gym and travel.'],
  [/beer mug|mug/i, 'Glass mug', 'A sturdy glass mug for cold drinks.'],
  [/glass jar|jar/i, 'Glass storage jar', 'A clear glass jar for storing snacks, grains and more.'],
  [/glass/i, 'Glass tumbler', 'A stylish glass for serving drinks.'],
  [/zipper bag/i, 'Zip-lock storage bags', 'Resealable zip bags to keep food and small items fresh and tidy.'],
  [/battery/i, 'AA batteries', 'Reliable AA batteries for remotes, toys, clocks and more.'],
  [/\bfan\b/i, 'Portable table fan', 'A compact table fan for a cool breeze at your desk or bedside.'],
  // Gifts & stationery & toys
  [/balloon/i, 'Party balloons', 'Colourful balloons for birthdays and celebrations.'],
  [/candle/i, 'Birthday number candle', 'A number candle to top your birthday cake.'],
  [/straw/i, 'Party straws', 'Colourful drinking straws for parties.'],
  [/keyring/i, 'Keyring', 'A cute keyring for your keys or bag.'],
  [/raping paper|wrapping paper/i, 'Gift wrapping paper', 'Wrapping paper to make every gift look special.'],
  [/book cover|paper cover/i, 'Book cover', 'Covers to keep school books neat and protected.'],
  [/marker/i, 'Permanent marker', 'A permanent marker for labelling and crafts.'],
  [/pencil box|box set/i, 'Pencil box set', 'A pencil box to keep school supplies organised.'],
  [/lead|mechanical pencil/i, 'Mechanical pencil & leads', 'For smooth, sharp writing and drawing, no sharpening needed.'],
  [/pencil/i, 'Pencil', 'A pencil for school, office and drawing.'],
  [/eraser|enaser/i, 'Eraser pen', 'An erasable pen for neat, correctable writing.'],
  [/pen\b|pen0|pen /i, 'Smooth-writing pen', 'A smooth-writing pen for school, office and everyday notes.'],
  [/butterfly clip/i, 'Butterfly paper clips', 'Clips to hold papers together neatly.'],
  [/ball/i, 'Soft play ball', 'A soft ball, safe for indoor and outdoor play.'],
  [/card/i, 'Collectible game cards', 'Fun collectible cards for kids aged 6 and up.'],
  [/water toy/i, 'Water play toy', 'A fun water toy for summer play.'],
  [/cube/i, 'Chicken cube treats', 'Tasty chicken cube treats.'],
];

const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
async function api(method, route, body) {
  const res = await fetch(`${url}/rest/v1/${route}`, { method, headers: { ...headers, Prefer: 'return=minimal' }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!res.ok) throw new Error(`${method} ${route.split('?')[0]} failed (${res.status}): ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const categories = await (await fetch(`${url}/rest/v1/categories?select=id,slug`, { headers })).json();
const catId = Object.fromEntries(categories.map((c) => [c.slug, c.id]));
const products = await (await fetch(`${url}/rest/v1/products?select=id,name,unit,specifications,categories(slug)&status=eq.ACTIVE&order=name`, { headers })).json();

let moved = 0, missing = 0;
const updates = [];
for (const p of products) {
  const spec = { ...(p.specifications ?? {}) };
  let category = p.categories?.slug;
  const move = MOVES.find(([re]) => re.test(p.name));
  if (move && (move[1] !== category || spec.subcategory !== move[2])) { category = move[1]; spec.subcategory = move[2]; moved++; }
  const rule = RULES.find(([re]) => re.test(p.name));
  if (!rule) missing++;
  const tagline = rule ? rule[1] : 'Everyday essential';
  const detail = rule ? rule[2] : 'An everyday essential from Delight Shopping Mart.';
  const size = p.unit && !/^1 (pc|pcs|box)$/i.test(p.unit) ? ` Pack size: ${p.unit}.` : '';
  const description = `${detail}${size} Available at Delight Shopping Mart in Tulsipur and Ghorahi, delivered to your door.`;
  spec.tagline = tagline;
  updates.push({ id: p.id, name: p.name, category, tagline, description, specifications: spec, moved: Boolean(move) });
}

for (const u of (process.argv.includes('--all') ? updates : updates.slice(0, 12))) console.log(`${u.name.slice(0, 44).padEnd(45)} | ${u.tagline}`);
console.log(`… ${updates.length} products, ${moved} moved to the right category, ${missing} without a specific description.`);
for (const u of updates.filter((x) => x.moved)) console.log(`  move: ${u.name} → ${u.category} / ${u.specifications.subcategory}`);
if (!APPLY) { console.log('Dry run. Add --apply to save.'); process.exit(0); }

for (const batch of chunk(updates, 20)) {
  await Promise.all(batch.map((u) => api('PATCH', `products?id=eq.${u.id}`, { description: u.description, specifications: u.specifications, category_id: catId[u.category], updated_at: new Date().toISOString() })));
}
console.log('Saved.');
