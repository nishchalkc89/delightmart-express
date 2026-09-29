import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { StorePage } from '@/components/delight/store-shell';
import { ProductCard } from '@/components/delight/product-card';
import { CategorySidebar } from '@/components/delight/category-sidebar';
import { categories as demoCategories, subcategories } from '@/services/catalog';
import { catalogQuery, useStorefront } from '@/hooks/use-catalog';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/categories/$slug')({
  head: ({ params }) => {
    const c = demoCategories.find((x) => x.slug === params.slug);
    return { meta: [{ title: `${c?.name ?? 'Category'} — Delight Shopping Mart` }, { name: 'description', content: 'Browse category products at Delight Shopping Mart.' }, { property: 'og:title', content: `${c?.name ?? 'Category'} — Delight Shopping Mart` }, { property: 'og:description', content: 'Great products at local prices.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const { categories, collections, products } = useStorefront();
  const category = categories.find((x) => x.slug === slug) ?? categories[0]!;
  const isGroceries = category.slug === 'groceries';
  const list = isGroceries ? collections.groceryPopular : products.filter((x) => x.category === category.name);
  const shown = list.length ? list : collections.specialOffers;

  return (
    <StorePage mobile={{ variant: 'back', actions: ['cart'], search: `Search in ${category.name}...` }}>
      <div className="lg:site-width lg:py-6">
        <p className="mb-4 hidden text-[14px] text-slate lg:block"><Link to="/">Home</Link> / <Link to="/categories">Categories</Link> / <span className="text-ink">{category.name}</span></p>

        {/* Title block */}
        <section className="relative flex h-[128px] items-center overflow-hidden px-4 lg:mb-6 lg:h-[160px] lg:rounded-2xl lg:bg-[#f5faf7] lg:px-8">
          <div className="relative z-10">
            <h1 className="text-[30px] font-extrabold tracking-tight text-navy lg:text-[40px]">{category.name}</h1>
            <p className="mt-0.5 max-w-[60%] text-[13px] text-slate lg:max-w-none lg:text-[16px]">{isGroceries ? 'Daily Essentials for a Better Tomorrow' : category.tagline}</p>
          </div>
          {isGroceries
            ? <img src={asset('grocery-header')} alt="" className="absolute bottom-0 right-0 h-full w-auto max-w-[46%] object-contain object-right-bottom lg:max-w-none" />
            : <img src={category.image} alt="" className="absolute bottom-2 right-4 h-[85%] w-auto object-contain" />}
        </section>

        <div className="grid grid-cols-[108px_1fr] gap-0 min-[400px]:grid-cols-[118px_1fr] lg:grid-cols-[260px_1fr] lg:gap-6">
          <aside className="lg:sticky lg:top-4 lg:self-start"><CategorySidebar active={category.slug} /></aside>

          <div className="min-w-0 px-2.5 lg:px-0">
            {isGroceries && (
              <Link to="/products" className="block overflow-hidden rounded-xl">
                <img src={asset('grocery-promo')} alt="Grocery essentials — fresh products at great prices" className="w-full lg:h-[260px] lg:object-cover lg:object-left" />
              </Link>
            )}

            {isGroceries && (
              <section className="mt-4">
                <Head title="Shop by Subcategory" />
                <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-8 lg:gap-3">
                  {subcategories.map((s) => (
                    <Link key={s.name} to="/search" search={{ q: s.name.split(' ')[0] ?? '' }} className="flex flex-col items-center rounded-lg bg-[#eef3f5] px-0.5 pb-2 pt-1.5 text-center text-[11px] leading-tight text-ink lg:rounded-xl lg:pb-3 lg:text-[14px]">
                      <img src={s.image} alt="" className="h-[46px] w-auto object-contain lg:h-[72px]" />
                      <span className="mt-1">{s.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-4">
              <Head title="Popular Products" />
              <div className="grid grid-cols-2 gap-1.5 min-[400px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-3 xl:grid-cols-6">
                {shown.map((p) => <ProductCard key={p.id} product={p} variant="grid" button="Add to Cart" />)}
              </div>
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

function Head({ title }: { title: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h2 className="text-[16.5px] font-extrabold text-navy min-[400px]:text-[18px] lg:text-[24px]">{title}</h2>
      <Link to="/products" className="flex items-center gap-1 text-[13px] font-semibold text-brand lg:text-[15px]">View All <ArrowRight className="size-4" /></Link>
    </div>
  );
}
