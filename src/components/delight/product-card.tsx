import { Heart, Minus, Plus, Star, StarHalf } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useState, type MouseEvent } from 'react';
import { toast } from 'sonner';
import { useCart } from './cart-context';
import { formatNpr } from '@/services/catalog';
import type { Product } from '@/types/store';
import { ART_BACKGROUND } from '@/lib/product-art';

export function Stars({ rating, reviews, className = 'size-4' }: { rating: number; reviews?: number; className?: string }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3 && rating - full < 0.8;
  const rounded = rating - full >= 0.8 ? full + 1 : full;
  return (
    <span className="flex items-center gap-0.5 text-star">
      {Array.from({ length: 5 }, (_, i) => {
        if (i < rounded) return <Star key={i} className={`${className} fill-star`} strokeWidth={0} />;
        if (i === full && half) return <span key={i} className="relative"><Star className={`${className} fill-[#e5e7eb]`} strokeWidth={0} /><StarHalf className={`${className} absolute inset-0 fill-star`} strokeWidth={0} /></span>;
        return <Star key={i} className={`${className} fill-[#e5e7eb]`} strokeWidth={0} />;
      })}
      {reviews !== undefined && <span className="ml-1.5 text-[0.95em] text-slate">({reviews})</span>}
    </span>
  );
}

type Props = {
  product: Product;
  /** `desktop` = large homepage card, `mobile` and `grid` = compact cards for phones and listings. */
  variant?: 'desktop' | 'mobile' | 'grid';
  badge?: 'discount' | 'new' | 'none';
  /** Kept for older call sites; every card now uses the ADD button. */
  button?: string;
  showUnit?: boolean;
};

/** ADD button that turns into a − qty + stepper once the product is in the cart (like quick-commerce apps). */
export function AddButton({ product, size = 'md', className = '' }: { product: Product; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const cart = useCart();
  const qty = cart.lines.find((l) => l.product.id === product.id)?.quantity ?? 0;
  const h = size === 'sm' ? 'h-8 min-w-[64px] text-[12.5px]' : size === 'lg' ? 'h-11 min-w-[120px] text-[16px]' : 'h-9 min-w-[76px] text-[14px]';
  const out = product.stock <= 0;
  if (out) return <span className={`grid place-items-center rounded-lg border border-line bg-white px-2 font-semibold text-slate ${h} ${className}`}>Sold out</span>;
  if (!qty) {
    return (
      <button type="button" aria-label={`Add ${product.name} to cart`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); cart.add(product); }}
        className={`rounded-lg border border-red bg-white px-3 font-extrabold tracking-wide text-red shadow-[0_2px_6px_rgb(16_24_40/0.12)] transition-colors hover:bg-red-50 ${h} ${className}`}>
        ADD
      </button>
    );
  }
  const step = (e: MouseEvent, n: number) => { e.preventDefault(); e.stopPropagation(); cart.setQuantity(product.id, n); if (n > product.stock) toast.info(`Only ${product.stock} in stock`); };
  return (
    <span className={`flex items-center justify-between rounded-lg bg-red font-bold text-white shadow-[0_2px_6px_rgb(227_16_26/0.3)] ${h} ${className}`}>
      <button type="button" aria-label="Remove one" onClick={(e) => step(e, qty - 1)} className="grid h-full w-8 place-items-center"><Minus className="size-4" strokeWidth={3} /></button>
      <span aria-live="polite">{qty}</span>
      <button type="button" aria-label="Add one more" onClick={(e) => step(e, qty + 1)} className="grid h-full w-8 place-items-center"><Plus className="size-4" strokeWidth={3} /></button>
    </span>
  );
}

export function ProductCard({ product, variant = 'desktop', badge = 'discount', showUnit = true }: Props) {
  const [liked, setLiked] = useState(false);
  const big = variant === 'desktop';
  const off = product.oldPrice ? product.oldPrice - product.price : 0;

  return (
    <article className="group relative flex h-full min-w-0 flex-col">
      <Link to="/products/$slug" params={{ slug: product.slug }} className="relative block">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-line"
          style={{ background: product.art ? ART_BACKGROUND[product.categorySlug ?? ''] ?? '#f3f6f8' : '#ffffff' }}>
          <img src={product.image} alt={product.name} loading="lazy"
            className={`absolute inset-0 m-auto transition-transform duration-300 group-hover:scale-105 ${product.art ? 'h-[52%] w-[52%]' : 'h-[88%] w-[88%] object-contain'}`} />
        </div>
        {badge === 'discount' && product.discount ? <span className="absolute left-0 top-2 rounded-r-md bg-red px-1.5 py-0.5 text-[10.5px] font-bold text-white lg:text-[12px]">{product.discount}% OFF</span> : null}
        {badge === 'new' && <span className="absolute left-0 top-2 rounded-r-md bg-brand px-2 py-0.5 text-[11px] font-semibold text-white lg:text-[12px]">NEW</span>}
      </Link>
      <button aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => setLiked(!liked)} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white/85">
        <Heart className={`size-4 ${liked ? 'fill-red text-red' : 'text-ink'}`} strokeWidth={1.8} />
      </button>
      <div className="relative -mt-5 flex justify-end pr-1.5"><AddButton product={product} size={big ? 'md' : 'sm'} /></div>

      <Link to="/products/$slug" params={{ slug: product.slug }} className="mt-1.5 flex flex-1 flex-col">
        <div className={big ? 'flex flex-wrap items-center gap-x-1.5 gap-y-0.5' : 'flex flex-col items-start gap-0.5'}>
          <strong className={`rounded-md bg-brand px-1.5 py-0.5 font-extrabold text-white ${big ? 'text-[15px]' : 'text-[13px]'}`}>{formatNpr(product.price)}</strong>
          {product.oldPrice ? <del className={`text-slate ${big ? 'text-[13.5px]' : 'text-[11.5px]'}`}>{formatNpr(product.oldPrice)}</del> : !big && <span aria-hidden className="text-[11.5px]">&nbsp;</span>}
        </div>
        <p className={`mt-1 border-b border-dashed border-line pb-1 font-bold text-brand ${big ? 'text-[12.5px]' : 'text-[11px]'}`}>{off > 0 ? `NPR ${off.toLocaleString('en-US')} OFF` : ' '}</p>
        <h3 className={`mt-1 line-clamp-2 font-semibold leading-snug text-ink ${big ? 'min-h-[2.6em] text-[14.5px]' : 'min-h-[2.6em] text-[12.5px]'}`}>{product.name}</h3>
        {showUnit && <p className={`mt-0.5 line-clamp-1 text-slate ${big ? 'text-[13px]' : 'text-[11.5px]'}`}>{product.unit || ' '}</p>}
        {product.reviews > 0 && <div className={`mt-1 ${big ? 'text-[13px]' : 'text-[11px]'}`}><Stars rating={product.rating} reviews={product.reviews} className={big ? 'size-3.5' : 'size-3'} /></div>}
      </Link>
    </article>
  );
}
