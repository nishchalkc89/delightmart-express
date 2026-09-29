import { Link } from '@tanstack/react-router';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { ProductCard } from './product-card';
import { CategorySidebar } from './category-sidebar';
import type { Product } from '@/types/store';

/** Shared layout for product listing pages (all products, search): title, toolbar, sidebar and grid. */
export function ProductGridPage({ title, subtitle, crumb, toolbar, products, empty }: { title: string; subtitle: string; crumb: string; toolbar?: ReactNode; products: Product[]; empty?: ReactNode }) {
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
            <div className="mt-4 grid grid-cols-2 gap-2.5 min-[480px]:grid-cols-3 md:grid-cols-4 lg:gap-3.5 xl:grid-cols-5">
              {products.map((p) => <ProductCard key={p.id} product={p} variant="grid" badge={p.isNew ? 'new' : 'discount'} button="Add to Cart" />)}
            </div>
          ) : (
            empty ?? (
              <div className="mt-6 rounded-xl border border-line bg-white p-10 text-center">
                <Search className="mx-auto size-10 text-slate" />
                <h2 className="mt-3 text-[18px] font-bold text-navy">No matching products</h2>
                <p className="mt-1 text-[14px] text-slate">Try another product, brand or category.</p>
              </div>
            )
          )}
        </div>
      </div>
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
