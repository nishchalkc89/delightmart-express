import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { StorePage } from '@/components/delight/store-shell';
import { ProductGridPage } from '@/components/delight/product-grid-page';
import { catalogQuery, useCatalog } from '@/hooks/use-catalog';

export const Route = createFileRoute('/search')({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s['q'] === 'string' ? s['q'] : '' }),
  head: () => ({ meta: [{ title: 'Search — Delight Shopping Mart' }, { name: 'description', content: 'Search products at Delight Shopping Mart.' }, { property: 'og:title', content: 'Search Delight Shopping Mart' }, { property: 'og:description', content: 'Find products quickly.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: Page,
});

const popular = ['Rice', 'Maggi', 'Oil', 'Diapers', 'Notebook', 'Lotion'];

function Page() {
  const search = Route.useSearch();
  const nav = useNavigate();
  const { data } = useCatalog();
  const [value, setValue] = useState(search.q);

  const results = useMemo(() => {
    const q = search.q.trim().toLowerCase();
    return q ? data.products.filter((p) => `${p.name} ${p.category} ${p.subcategory ?? ''} ${p.brand ?? ''} ${p.description}`.toLowerCase().includes(q)) : data.products;
  }, [search.q, data.products]);

  function submit(e: FormEvent) {
    e.preventDefault();
    void nav({ to: '/search', search: { q: value.trim() } });
  }

  return (
    <StorePage mobile={{ variant: 'back', actions: ['cart'], search: false }}>
      <div className="px-4 pt-2 lg:site-width lg:px-0 lg:pt-6">
        <form onSubmit={submit} className="flex h-12 max-w-[760px] items-center gap-3 overflow-hidden rounded-xl border border-[#dde6ea] bg-[#f5fbfc] pl-4 lg:h-14">
          <Search className="size-5 text-ink" />
          <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-slate" placeholder="What are you looking for?" aria-label="Search products" />
          <button className="h-full bg-red px-5 text-[15px] font-semibold text-white lg:px-8">Search</button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-slate">Popular:</span>
          {popular.map((p) => <button key={p} onClick={() => { setValue(p); void nav({ to: '/search', search: { q: p } }); }} className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand">{p}</button>)}
        </div>
      </div>
      <ProductGridPage crumb="Search" title={search.q ? `Results for “${search.q}”` : 'Search Products'} subtitle={`${results.length} product${results.length === 1 ? '' : 's'} found`} products={results} />
    </StorePage>
  );
}
