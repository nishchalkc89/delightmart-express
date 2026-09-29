import { createFileRoute } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { StorePage } from '@/components/delight/store-shell';
import { InfiniteLoader, ProductGridPage } from '@/components/delight/product-grid-page';
import { productsQuery, useInfiniteProducts, useLoadingPage } from '@/hooks/use-catalog';

type SearchParams = { q: string };

export const Route = createFileRoute('/search')({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s['q'] === 'string' ? s['q'] : '',
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => (deps.q.trim() ? context.queryClient.ensureQueryData(productsQuery({ q: deps.q.trim(), page: 1 })) : null),
  head: () => ({ meta: [{ title: 'Search — Delight Shopping Mart' }, { name: 'description', content: 'Search products at Delight Shopping Mart.' }, { property: 'og:title', content: 'Search Delight Shopping Mart' }, { property: 'og:description', content: 'Find products quickly.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const popular = ['Rice', 'Maggi', 'Oil', 'Diapers', 'Notebook', 'Lotion', 'Biscuit', 'Shampoo'];

function Page() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const q = search.q.trim();
  const [value, setValue] = useState(search.q);
  useEffect(() => setValue(search.q), [search.q]);
  const data = Route.useLoaderData();
  const isFetching = useLoadingPage();
  const list = useInfiniteProducts({ q, page: 1 }, q ? data : null);

  function go(text: string) {
    void nav({ search: { q: text.trim() } });
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    go(value);
  }

  const total = q ? data?.total ?? 0 : 0;
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
          {popular.map((p) => <button key={p} onClick={() => { setValue(p); go(p); }} className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand">{p}</button>)}
        </div>
      </div>
      <ProductGridPage
        crumb="Search"
        title={q ? `Results for “${q}”` : 'Search Products'}
        subtitle={q ? `${total.toLocaleString('en-US')} product${total === 1 ? '' : 's'} found` : 'Type a product, brand or category, e.g. “Dairy Milk” or “shampoo”.'}
        products={q ? list.products : []}
        loading={isFetching}
        footer={q ? <InfiniteLoader auto={false} hasMore={list.hasMore} loading={list.loadingMore} onMore={list.loadMore} shown={list.products.length} total={list.total} columns="grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-5" /> : null}
        empty={q ? undefined : <div />}
      />
    </StorePage>
  );
}
