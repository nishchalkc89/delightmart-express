import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { StorePage } from '@/components/delight/store-shell';
import { ProductCard } from '@/components/delight/product-card';
import { CategorySidebar } from '@/components/delight/category-sidebar';
import { Pager, ToolbarSelect } from '@/components/delight/product-grid-page';
import { categories as knownCategories, dealsCategory, subcategoryImages, type ProductSort } from '@/services/catalog';
import { productsQuery, subcategoriesQuery, useCategories, useLoadingPage } from '@/hooks/use-catalog';
import { asset } from '@/lib/assets';
import type { ReactNode } from 'react';

type Search = { sub?: string | undefined; sort?: ProductSort | undefined; page?: number | undefined };
const sorts: Array<[ProductSort, string]> = [['featured', 'Popular'], ['price-asc', 'Price: Low to High'], ['price-desc', 'Price: High to Low'], ['name', 'Name: A to Z']];
const PAGE_SIZE = 30;
const filterOf = (slug: string, s: Search) => ({ category: slug, sub: s.sub, sort: s.sort ?? 'featured', page: s.page ?? 1, size: PAGE_SIZE });

export const Route = createFileRoute('/categories/$slug')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    sub: typeof s['sub'] === 'string' && s['sub'] ? s['sub'] : undefined,
    sort: sorts.some(([k]) => k === s['sort']) ? (s['sort'] as ProductSort) : undefined,
    page: Number(s['page']) > 1 ? Math.floor(Number(s['page'])) : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps }) => Promise.all([
    context.queryClient.ensureQueryData(productsQuery(filterOf(params.slug, deps))),
    context.queryClient.ensureQueryData(subcategoriesQuery(params.slug)),
  ]),
  head: ({ params }) => {
    const c = [...knownCategories, dealsCategory].find((x) => x.slug === params.slug);
    return { meta: [{ title: `${c?.name ?? 'Category'} — Delight Shopping Mart` }, { name: 'description', content: `Shop ${c?.name ?? 'products'} at Delight Shopping Mart, Tulsipur.` }, { property: 'og:title', content: `${c?.name ?? 'Category'} — Delight Shopping Mart` }, { property: 'og:description', content: 'Great products at local prices.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] };
  },
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const categories = useCategories();
  const category = categories.find((x) => x.slug === slug) ?? { ...dealsCategory, slug, name: 'Products', short: 'Products', tagline: '' };
  const [data, subs] = Route.useLoaderData();
  const isFetching = useLoadingPage();
  const isGroceries = slug === 'groceries';
  const set = (patch: Partial<Search>) => void nav({ search: (s: Search) => ({ ...s, page: undefined, ...patch }), resetScroll: false });
  const withImages = isGroceries ? subs.filter((s) => subcategoryImages[s.name]) : [];
  const chips = subs.filter((s) => !withImages.includes(s));

  return (
    <StorePage mobile={{ variant: 'back', actions: ['cart'], search: `Search in ${category.short}...` }}>
      <div className="lg:site-width lg:py-6">
        <p className="mb-4 hidden text-[14px] text-slate lg:block"><Link to="/">Home</Link> / <Link to="/categories">Categories</Link> / <span className="text-ink">{category.name}</span></p>

        {/* Title block */}
        <section className="relative flex h-[128px] items-center overflow-hidden px-4 lg:mb-6 lg:h-[150px] lg:rounded-2xl lg:bg-[#f5faf7] lg:px-8">
          <div className="relative z-10">
            <h1 className="max-w-[64%] text-[26px] font-extrabold leading-tight tracking-tight text-navy lg:max-w-none lg:text-[38px]">{category.name}</h1>
            <p className="mt-0.5 max-w-[60%] text-[13px] text-slate lg:max-w-none lg:text-[16px]">{isGroceries ? 'Daily Essentials for a Better Tomorrow' : category.tagline}</p>
          </div>
          {isGroceries
            ? <img src={asset('grocery-header')} alt="" className="absolute bottom-0 right-0 h-full w-auto max-w-[46%] object-contain object-right-bottom lg:max-w-none" />
            : <img src={category.image} alt="" className="absolute bottom-3 right-4 h-[78%] w-auto object-contain lg:right-8" />}
        </section>

        <div className="grid grid-cols-[108px_1fr] gap-0 min-[400px]:grid-cols-[118px_1fr] lg:grid-cols-[260px_1fr] lg:gap-6">
          <aside className="lg:sticky lg:top-4 lg:self-start"><CategorySidebar active={slug} /></aside>

          <div className="min-w-0 px-2.5 lg:px-0">
            {isGroceries && !search.sub && (
              <Link to="/categories/$slug" params={{ slug: 'groceries' }} search={{ sub: 'Rice & Grains' }} className="mb-4 block overflow-hidden rounded-xl">
                <img src={asset('grocery-promo')} alt="Grocery essentials — fresh products at great prices" className="w-full lg:h-[240px] lg:object-cover lg:object-left" />
              </Link>
            )}

            {withImages.length > 0 && (
              <section className="mb-3">
                <h2 className="mb-2.5 text-[16.5px] font-extrabold text-navy min-[400px]:text-[18px] lg:text-[22px]">Shop by Subcategory</h2>
                <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-8 lg:gap-3">
                  {withImages.map((s) => (
                    <button key={s.name} onClick={() => set({ sub: search.sub === s.name ? undefined : s.name })} className={`flex flex-col items-center rounded-lg px-0.5 pb-2 pt-1.5 text-center text-[11px] leading-tight text-ink lg:rounded-xl lg:pb-3 lg:text-[13.5px] ${search.sub === s.name ? 'bg-brand-100 ring-2 ring-brand' : 'bg-[#eef3f5]'}`}>
                      <img src={subcategoryImages[s.name]} alt="" className="h-[46px] w-auto object-contain lg:h-[64px]" />
                      <span className="mt-1">{s.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {subs.length > 0 && (
              <div className="no-scrollbar -mx-2.5 flex gap-2 overflow-x-auto px-2.5 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
                <Chip on={!search.sub} onClick={() => set({ sub: undefined })}>All</Chip>
                {(isGroceries ? subs : chips).map((s) => (
                  <Chip key={s.name} on={search.sub === s.name} onClick={() => set({ sub: s.name })}>{s.name} <span className="opacity-60">({s.count})</span></Chip>
                ))}
              </div>
            )}

            <section className="mt-4">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[16.5px] font-extrabold text-navy min-[400px]:text-[18px] lg:text-[22px]">
                  {search.sub ?? (category.virtual ? 'All Deals' : 'All Products')}
                  <span className="ml-2 text-[13px] font-medium text-slate lg:text-[15px]">{(data?.total ?? 0).toLocaleString('en-US')} items</span>
                </h2>
                <ToolbarSelect label="Sort by" value={sorts.find(([k]) => k === (search.sort ?? 'featured'))![1]} onChange={(v) => set({ sort: sorts.find(([, l]) => l === v)?.[0] })} options={sorts.map(([, l]) => l)} />
              </div>
              <div className={`grid grid-cols-2 gap-1.5 transition-opacity min-[400px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-3 xl:grid-cols-6 ${isFetching ? 'opacity-60' : ''}`}>
                {(data?.products ?? []).map((p) => <ProductCard key={p.id} product={p} variant="grid" button="Add to Cart" />)}
              </div>
              {data && !data.products.length && <p className="mt-6 rounded-xl border border-line bg-white p-8 text-center text-slate">No products here yet.</p>}
              <Pager page={data?.page ?? 1} pages={data?.pages ?? 1} onPage={(page) => { set({ page: page > 1 ? page : undefined }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </section>
          </div>
        </div>

        <Link to="/checkout" className="mx-4 mt-5 flex items-center gap-4 rounded-xl bg-[#eef8f3] px-5 py-3 lg:mx-0 lg:mt-8 lg:px-8 lg:py-4">
          <img src={asset('free-delivery-truck')} alt="" className="h-10 w-auto lg:h-12" />
          <span className="flex-1"><b className="block text-[18px] font-bold text-brand lg:text-[22px]">Free Delivery</b><span className="text-[14px] text-ink lg:text-[16px]">on orders above NPR 1,000</span></span>
          <ChevronRight className="size-6 text-brand" />
        </Link>
      </div>
    </StorePage>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium lg:text-[14px] ${on ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand/50'}`}>
      {children}
    </button>
  );
}
