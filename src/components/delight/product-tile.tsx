import type { Product } from '@/types/store';
import { ART_BACKGROUND } from '@/lib/product-art';

// Shown instead of a photo until the store uploads a real one: the product name on a soft
// category colour (no drawn icon, no "coming soon" text).
const tint = (p: Product) => ART_BACKGROUND[p.categorySlug ?? ''] ?? '#f3f6f8';
const initials = (name: string) => name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');

/** Full-size tile (product cards and the product page). */
export function NameTile({ product, size = 'card' }: { product: Product; size?: 'card' | 'large' }) {
  const large = size === 'large';
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-[10%] text-center" style={{ background: tint(product) }}>
      {product.brand && <span className={`mb-1 font-semibold uppercase tracking-[0.14em] text-slate ${large ? 'text-[14px]' : 'text-[10.5px] lg:text-[11.5px]'}`}>{product.brand}</span>}
      <span className={`line-clamp-4 font-extrabold leading-tight text-navy ${large ? 'text-[30px] lg:text-[36px]' : 'text-[15px] lg:text-[18px]'}`}>{product.name}</span>
      {product.unit && product.unit !== '1 pc' && <span className={`mt-2 rounded-full bg-white/80 px-2.5 py-0.5 font-semibold text-ink ${large ? 'text-[15px]' : 'text-[11px] lg:text-[12px]'}`}>{product.unit}</span>}
    </div>
  );
}

/** Small square thumbnail (cart, search suggestions). */
export function ProductThumb({ product, className = '' }: { product: Product; className?: string }) {
  if (product.noPhoto) {
    return <span className={`grid place-items-center text-[13px] font-extrabold text-navy ${className}`} style={{ background: tint(product) }} aria-hidden>{initials(product.name)}</span>;
  }
  return <img src={product.image} alt="" className={`object-contain ${className}`} />;
}
