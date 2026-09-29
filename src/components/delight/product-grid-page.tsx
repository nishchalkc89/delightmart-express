import { Link } from '@tanstack/react-router';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { ProductCard } from './product-card';
import { CategorySidebar } from './category-sidebar';
import type { Product } from '@/types/store';

/** Shared layout for product listing pages (all products, search): title, toolbar, sidebar and grid. */
export function ProductGridPage({ title, subtitle, crumb, toolbar, products, empty, footer, loading }: { title: string; subtitle: string; crumb: string; toolbar?: ReactNode; products: Product[]; empty?: ReactNode; footer?: ReactNode; loading?: boolean | undefined }) {
  return (
    <div className="lg:site-width px-4 py-3 lg:px-0 lg:py-6">
      <p className="mb-3 hidden text-[14px] text-slate lg:block"><Link to="/">Home</Link> / <span className="text-ink">{crumb}</span></p>
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
        <aside className="hidden lg:sticky lg:top-4 lg:block lg:self-start"><CategorySidebar /></aside>
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold tracking-tight text-navy lg:text-[36px]">{title}</h1>
          <p className="text-[14px] text-slate lg:text-[16px]">{subtitle}</p>
          {toolbar && <div className="mt-4 flex flex-wrap items-center gap-2.5">{toolbar}</div>}
          {products.length ? (
            <div className={`mt-4 grid grid-cols-2 gap-2.5 transition-opacity min-[480px]:grid-cols-3 md:grid-cols-4 lg:gap-3.5 xl:grid-cols-5 ${loading ? 'opacity-60' : ''}`}>
              {products.map((p) => <ProductCard key={p.id} product={p} variant="grid" badge="discount" button="Add to Cart" />)}
            </div>
          ) : loading ? null : (
            empty ?? (
              <div className="mt-6 rounded-xl border border-line bg-white p-10 text-center">
                <Search className="mx-auto size-10 text-slate" />
                <h2 className="mt-3 text-[18px] font-bold text-navy">No matching products</h2>
                <p className="mt-1 text-[14px] text-slate">Try another product, brand or category.</p>
              </div>
            )
          )}
          {footer}
        </div>
      </div>
    </div>
  );
}

/** Loads the next products when the shopper scrolls near the end of the grid; shows loading cards meanwhile. */
export function InfiniteLoader({ hasMore, loading, onMore, shown, total, columns = 'grid-cols-2 min-[400px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' }: { hasMore: boolean; loading: boolean; onMore: () => void; shown: number; total: number; columns?: string }) {
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) onMore(); }, { rootMargin: '700px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onMore, shown]);
  if (!shown) return null;
  return (
    <div ref={sentinel} className="mt-3">
      {loading && (
        <div className={`grid gap-2.5 lg:gap-3 ${columns}`} aria-label="Loading more products">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-xl bg-[#eef1f4]" />
              <div className="mt-2 h-5 w-16 rounded bg-[#eef1f4]" />
              <div className="mt-2 h-3.5 w-full rounded bg-[#f1f4f7]" />
              <div className="mt-1.5 h-3.5 w-2/3 rounded bg-[#f1f4f7]" />
            </div>
          ))}
        </div>
      )}
      {hasMore && !loading && (
        <button type="button" onClick={onMore} className="mx-auto mt-2 flex h-10 items-center gap-2 rounded-full border border-line bg-white px-5 text-[13.5px] font-semibold text-navy">Show more products</button>
      )}
      {!hasMore && <p className="py-5 text-center text-[13px] text-slate">You’ve seen all {total.toLocaleString('en-US')} products ✓</p>}
    </div>
  );
}

export function ToolbarSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-lg border border-line bg-white px-3 text-[14px] text-navy outline-none focus:border-brand">
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

export function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex h-11 items-center gap-2 rounded-lg border border-line bg-white px-4 text-[14px] font-semibold text-navy hover:bg-page">
      <SlidersHorizontal className="size-4" /> Reset
    </button>
  );
}
