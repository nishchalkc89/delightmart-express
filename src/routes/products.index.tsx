import { createFileRoute } from '@tanstack/react-router';
import { StorePage } from '@/components/delight/store-shell';
import { InfiniteLoader, ProductGridPage, ResetButton, ToolbarSelect } from '@/components/delight/product-grid-page';
import { productsQuery, useCategories, useInfiniteProducts, useLoadingPage } from '@/hooks/use-catalog';
import type { ProductSort } from '@/services/catalog';

const sorts: Array<[ProductSort, string]> = [['featured', 'Featured'], ['price-asc', 'Price: Low to High'], ['price-desc', 'Price: High to Low'], ['name', 'Name: A to Z']];
type Search = { category?: string | undefined; sort?: ProductSort | undefined; stock?: boolean | undefined };

export const Route = createFileRoute('/products/')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: typeof s['category'] === 'string' && s['category'] ? s['category'] : undefined,
    sort: sorts.some(([k]) => k === s['sort']) ? (s['sort'] as ProductSort) : undefined,
    stock: s['stock'] === true || s['stock'] === 'true' ? true : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(productsQuery(filterOf(deps))),
  head: () => ({ meta: [{ title: 'All Products — Delight Shopping Mart' }, { name: 'description', content: 'Browse products available at Delight Shopping Mart.' }, { property: 'og:title', content: 'Shop All Products — Delight' }, { property: 'og:description', content: 'Groceries, fashion, home essentials and more.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: ProductsPage,
});

const filterOf = (s: Search) => ({ category: s.category, sort: s.sort ?? 'featured', inStock: s.stock, page: 1 });

function ProductsPage() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const categories = useCategories();
  const data = Route.useLoaderData();
  const isFetching = useLoadingPage();
  const set = (patch: Partial<Search>) => void nav({ search: (s: Search) => ({ ...s, ...patch }) });
  const list = useInfiniteProducts(filterOf(search), data);
  const byName = (name: string) => categories.find((c) => c.name === name)?.slug;
  const current = categories.find((c) => c.slug === search.category)?.name ?? 'All Categories';

  return (
    <StorePage mobile={{ variant: 'back', actions: ['cart'], search: 'Search products...' }}>
      <ProductGridPage
        crumb="All Products"
        title={search.category ? current : 'All Products'}
        subtitle={`${(data?.total ?? 0).toLocaleString('en-US')} products · Fresh choices and everyday essentials`}
        products={list.products}
        loading={isFetching}
        footer={<InfiniteLoader auto={false} hasMore={list.hasMore} loading={list.loadingMore} onMore={list.loadMore} shown={list.products.length} total={list.total} columns="grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-5" />}
        toolbar={<>
          <ToolbarSelect label="Category" value={current} onChange={(v) => set({ category: byName(v) })} options={['All Categories', ...categories.map((c) => c.name)]} />
          <ToolbarSelect label="Availability" value={search.stock ? 'In Stock Only' : 'All Products'} onChange={(v) => set({ stock: v === 'In Stock Only' ? true : undefined })} options={['All Products', 'In Stock Only']} />
          <ToolbarSelect label="Sort by" value={sorts.find(([k]) => k === (search.sort ?? 'featured'))![1]} onChange={(v) => set({ sort: sorts.find(([, l]) => l === v)?.[0] })} options={sorts.map(([, l]) => l)} />
          <ResetButton onClick={() => void nav({ search: {} })} />
        </>}
      />
    </StorePage>
  );
}
