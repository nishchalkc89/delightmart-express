import { Link } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { ProductCard } from './product-card';
import { CategorySidebar } from './category-sidebar';
import type { Product } from '@/types/store';

/** Shared layout for product listing pages (all products, search): title, toolbar, sidebar and grid. */
export function ProductGridPage({ title, subtitle, crumb, toolbar, products, empty, page = 1, pages = 1, onPage, loading }: { title: string; subtitle: string; crumb: string; toolbar?: ReactNode; products: Product[]; empty?: ReactNode; page?: number; pages?: number; onPage?: ((page: number) => void) | undefined; loading?: boolean | undefined }) {
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
          {onPage && <Pager page={page} pages={pages} onPage={onPage} />}
        </div>
      </div>
    </div>
  );
}

/** Page numbers under a product grid: ‹ 1 … 4 5 6 … 20 ›. */
export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  if (pages < 2) return null;
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const btn = 'grid h-10 min-w-10 place-items-center rounded-lg border px-3 text-[14px] font-semibold';
  return (
    <nav aria-label="Pages" className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page" className={`${btn} border-line bg-white text-navy disabled:opacity-40`}><ChevronLeft className="size-4" /></button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1]! > 1 && <span className="px-1 text-slate">…</span>}
          <button onClick={() => onPage(n)} aria-current={n === page ? 'page' : undefined} className={`${btn} ${n === page ? 'border-brand bg-brand text-white' : 'border-line bg-white text-navy hover:border-brand/50'}`}>{n}</button>
        </span>
      ))}
      <button disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page" className={`${btn} border-line bg-white text-navy disabled:opacity-40`}><ChevronRight className="size-4" /></button>
    </nav>
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
