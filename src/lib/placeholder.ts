// Picture shown for products that do not have a photo yet: a soft tile with the brand and product name.

const palettes: Record<string, [string, string]> = {
  groceries: ['#eef8f1', '#08704c'], snacks: ['#fff3e3', '#b45f06'], beverages: ['#eaf4ff', '#1f5fae'],
  'dairy-frozen': ['#eef5ff', '#2c5f9e'], 'beauty-skincare': ['#fdeef4', '#b0306a'], 'health-hygiene': ['#ffeef0', '#c02945'],
  'baby-care': ['#eef7ff', '#2f78c4'], cleaning: ['#e9f7f4', '#0d7a67'], 'kitchen-household': ['#f3f5ee', '#5b6b1f'],
  'home-living': ['#f2efff', '#5a43b8'], stationery: ['#fff8e6', '#a06a00'], toys: ['#fff0ea', '#c4471d'],
  'ladies-wear': ['#fbeef8', '#a02f86'], electronics: ['#fff9e0', '#8a6500'], 'gifts-puja': ['#ffeef5', '#b02a6a'],
  'pet-care': ['#f6efe8', '#7a4f24'], 'liquor-smoking': ['#f7edf1', '#7c1a39'],
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Splits text into at most `max` lines of roughly `width` characters. */
function lines(text: string, width: number, max: number) {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if ((line + ' ' + word).trim().length > width && line) { out.push(line); line = word; }
    else line = (line + ' ' + word).trim();
    if (out.length === max) break;
  }
  if (line && out.length < max) out.push(line);
  if (out.length === max && text.length > out.join(' ').length + 1) out[max - 1] = `${out[max - 1]!.slice(0, width - 1)}…`;
  return out;
}

const cache = new Map<string, string>();

export function productPlaceholder(name: string, unit: string, categorySlug: string): string {
  const key = `${categorySlug}|${name}|${unit}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [bg, fg] = palettes[categorySlug] ?? ['#f1f4f6', '#13213a'];
  const clean = name.replace(new RegExp(`\\s*${unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'), '').trim() || name;
  const [brand = '', ...rest] = clean.split(' ');
  const title = lines(rest.join(' '), 17, 2);
  const brandSize = brand.length > 9 ? 22 : 28;
  const text = [
    `<text x="100" y="${title.length ? 82 : 100}" font-size="${brandSize}" font-weight="800" fill="${fg}">${esc(brand.slice(0, 14))}</text>`,
    ...title.map((l, i) => `<text x="100" y="${112 + i * 22}" font-size="17" font-weight="600" fill="${fg}" fill-opacity="0.78">${esc(l)}</text>`),
    unit ? `<rect x="62" y="${title.length ? 150 : 124}" width="76" height="24" rx="12" fill="${fg}" fill-opacity="0.1"/><text x="100" y="${title.length ? 167 : 141}" font-size="13" font-weight="700" fill="${fg}">${esc(unit.slice(0, 11))}</text>` : '',
  ].join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="18" fill="${bg}"/><g font-family="Plus Jakarta Sans,Arial,sans-serif" text-anchor="middle">${text}</g></svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  cache.set(key, url);
  return url;
}
