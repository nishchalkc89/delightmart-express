// Matching uploaded photo files to products (Admin → Products → Bulk Photos).
//
// Ways a file is matched, most reliable first:
//   1. Product code at the start of the file name: "5.296.jpg", "DM-5.296.jpg", "5.296 Rico jelly.jpg",
//      "5.296-2.jpg" / "5.296 (2).jpg" / "5.296_back.jpg" (= an extra photo of the same product).
//   2. The product's web address name ("rico-pudding-jelly-fruit-flvr.jpg").
//   3. The exact product name, then a close name (same sizes/numbers, most words in common).
//   4. Phone photos ("IMG_20261001_1234.jpg"): in the order they were taken, against the photo checklist.

export type PhotoProduct = { id: string; name: string; slug: string; code: string; category: string; hasPhoto?: boolean | undefined };
export type PhotoMatch = { product: PhotoProduct | undefined; how: string; extra: boolean };

const stripExt = (s: string) => s.replace(/\.[a-z0-9]{2,5}$/i, '').trim();
const words = (s: string) => stripExt(s).toLowerCase().replace(/[^a-z0-9.]+/g, ' ').trim();
const tokens = (s: string) => new Set(words(s).split(' ').filter((w) => w.length > 1));
const CODE_AT_START = /^(?:dm[-_ ]?)?(\d{1,3}\.\d{1,5})(?=$|[\s_\-().])/i;
const EXTRA_SUFFIX = /(?:[-_ ](?:\d{1,2}|back|side|b|2nd)|\s*\(\d{1,2}\))$/i;

/** True for camera names like IMG_20261001_1234, PXL_..., DSC0001, WhatsApp Image ... */
export const isCameraName = (fileName: string) => /^(img|pxl|dsc|dscn|photo|image|whatsapp image|screenshot|mvimg|p\d{5,})[\s_-]?/i.test(stripExt(fileName));

export function buildIndex(products: PhotoProduct[]) {
  return {
    byCode: new Map(products.map((p) => [p.code.toLowerCase(), p])),
    bySlug: new Map(products.map((p) => [p.slug, p])),
    byName: new Map(products.map((p) => [words(p.name), p])),
  };
}

export function matchPhoto(fileName: string, products: PhotoProduct[], index = buildIndex(products)): PhotoMatch {
  const base = stripExt(fileName);
  // 1. Product code at the start.
  const m = CODE_AT_START.exec(base);
  if (m) {
    const code = m[1]!.toLowerCase();
    const rest = base.slice(m[0].length).trim();
    const extra = rest !== '' && EXTRA_SUFFIX.test(` ${rest}`) && !/[a-z]{4,}/i.test(rest.replace(/back|side/i, ''));
    const exact = index.byCode.get(code);
    if (exact) return { product: exact, how: 'Product code', extra };
    // Spreadsheets often drop a trailing zero (4.1470 → 4.147): accept only if exactly one product fits.
    const padded = products.filter((p) => p.code.toLowerCase().replace(/0+$/, '') === code.replace(/0+$/, ''));
    if (padded.length === 1) return { product: padded[0], how: `Product code (${padded[0]!.code})`, extra };
  }
  const cleaned = base.replace(EXTRA_SUFFIX, '');
  const extra = cleaned !== base;
  // 2. Web address name.
  const bySlug = index.bySlug.get(cleaned.toLowerCase());
  if (bySlug) return { product: bySlug, how: 'Web address', extra };
  // 3a. Exact name.
  const byName = index.byName.get(words(cleaned));
  if (byName) return { product: byName, how: 'Exact name', extra };
  // 3b. Close name: every number in the file name (sizes like 250, 46) must be in the product name,
  // most words in common, at least 70%, and no tie between two products.
  const want = tokens(cleaned);
  if (want.size < 2 || isCameraName(fileName)) return { product: undefined, how: '', extra: false };
  const numbers = cleaned.match(/\d+(\.\d+)?/g) ?? [];
  let best: PhotoProduct | undefined;
  let bestScore = 0;
  let tie = false;
  for (const p of products) {
    const digits: string[] = p.name.match(/\d+(\.\d+)?/g) ?? [];
    if (!numbers.every((n) => digits.includes(n))) continue;
    const have = tokens(p.name);
    let shared = 0;
    for (const w of want) if (have.has(w)) shared++;
    const score = shared / Math.max(want.size, have.size);
    if (score > bestScore) { bestScore = score; best = p; tie = false; } else if (score === bestScore) tie = true;
  }
  return bestScore >= 0.7 && !tie ? { product: best, how: `Similar name (${Math.round(bestScore * 100)}%)`, extra } : { product: undefined, how: '', extra: false };
}

/** Products still needing a photo, in the order staff should photograph them (category, then name). */
export function photoChecklist(products: PhotoProduct[]) {
  return products.filter((p) => !p.hasPhoto).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

/** Shrinks a photo to at most `max` pixels on its longest side and re-encodes it as JPEG (phone photos are 3–8 MB). */
export async function shrinkPhoto(file: File, max = 1400, quality = 0.85): Promise<File> {
  if (file.size < 500 * 1024 || typeof createImageBitmap !== 'function') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) return file;
    return new File([blob], `${stripExt(file.name)}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    return file; // e.g. HEIC photos the browser cannot read: uploaded as they are (and rejected if too big)
  }
}
