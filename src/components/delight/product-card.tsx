import { Heart, ShoppingCart, Star, StarHalf } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCart } from './cart-context';
import { formatNpr } from '@/services/catalog';
import type { Product } from '@/types/store';

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
  /** `desktop` = homepage card, `mobile` = compact card with stacked price, `grid` = category grid card. */
  variant?: 'desktop' | 'mobile' | 'grid';
  badge?: 'discount' | 'new' | 'none';
  button?: string;
  showUnit?: boolean;
};

export function ProductCard({ product, variant = 'desktop', badge = 'discount', button, showUnit = true }: Props) {
  const { add } = useCart();
  const [liked, setLiked] = useState(false);
  const label = button ?? (variant === 'mobile' ? 'Add' : 'Add to Cart');
  const isMobile = variant !== 'desktop';

  function addToCart() {
    add(product);
    toast.success(`${product.name} added to cart`);
  }

  return (
    <article className={`group relative flex min-w-0 flex-col rounded-lg border border-line bg-white ${isMobile ? 'p-2' : 'px-4 pb-3 pt-2.5'} transition-shadow hover:shadow-[0_6px_18px_rgb(16_24_40/0.08)]`}>
      {badge === 'discount' && product.discount ? (
        <span className="absolute left-1.5 top-1.5 z-10 rounded-[4px] bg-red px-1.5 py-0.5 text-[10.5px] font-bold text-white lg:text-[13px]">{product.discount}% OFF</span>
      ) : null}
      {badge === 'new' && <span className="absolute left-4 top-2.5 z-10 rounded-[5px] bg-brand px-2.5 py-0.5 text-[13px] font-semibold text-white">New</span>}
      <button aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => setLiked(!liked)} className="absolute right-2.5 top-2.5 z-10">
        <Heart className={`size-[18px] lg:size-5 ${liked ? 'fill-red text-red' : 'text-ink'}`} strokeWidth={1.7} />
      </button>
      <Link to="/products/$slug" params={{ slug: product.slug }} className="block">
        <div className={`flex items-center justify-center ${variant === 'desktop' ? 'h-[118px]' : variant === 'grid' ? 'h-[92px]' : 'h-[96px]'}`}>
          <img src={product.image} alt={product.name} loading="lazy" className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" />
        </div>
        <h3 className={`mt-2 line-clamp-1 font-medium text-ink ${isMobile ? 'text-[12.5px]' : 'text-[15px]'}`}>{product.name}</h3>
        {showUnit && product.unit && <p className={`line-clamp-1 text-slate ${isMobile ? 'text-[12px]' : 'text-[15px]'}`}>{product.unit}</p>}
        <div className={`mt-1 ${isMobile ? '' : 'flex items-baseline gap-3'}`}>
          <strong className={`block font-bold text-red ${isMobile ? 'text-[14px]' : 'text-[17px]'}`}>{formatNpr(product.price)}</strong>
          {product.oldPrice && <del className={`block text-slate ${isMobile ? 'text-[12px]' : 'text-[14px]'}`}>{formatNpr(product.oldPrice)}</del>}
        </div>
        <div className={`mt-1 ${isMobile ? 'text-[11px]' : 'text-[14px]'}`}><Stars rating={product.rating} reviews={product.reviews} className={isMobile ? 'size-3' : 'size-4'} /></div>
      </Link>
      <button onClick={addToCart} aria-label={`Add ${product.name} to cart`} className={`mt-2.5 flex items-center justify-center rounded-md bg-brand font-semibold text-white hover:bg-brand-dark ${variant === 'grid' ? 'h-8 gap-1 whitespace-nowrap text-[11px]' : isMobile ? 'h-8 gap-2 text-[12.5px]' : 'h-[34px] gap-2 text-[14px]'}`}>
        <ShoppingCart className={`${variant === 'grid' ? 'size-3.5' : 'size-4'} shrink-0 fill-white`} /> {label}
      </button>
    </article>
  );
}
