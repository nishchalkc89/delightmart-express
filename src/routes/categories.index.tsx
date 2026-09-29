import { createFileRoute, Link } from '@tanstack/react-router';
import { StorePage } from '@/components/delight/store-shell';
import { categories, subcategories } from '@/services/catalog';

export const Route = createFileRoute('/categories/')({
  head: () => ({ meta: [{ title: 'Categories — Delight Shopping Mart' }, { name: 'description', content: 'Browse every shopping category at Delight.' }, { property: 'og:title', content: 'Shop by Category — Delight' }, { property: 'og:description', content: 'Find groceries, fashion, home and family essentials.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  return (
    <StorePage mobile={{ variant: 'back', actions: ['cart'], search: 'Search categories...' }}>
      <div className="site-width py-4 lg:py-8">
        <p className="eyebrow mb-1.5 hidden lg:flex">Shop by Category</p>
        <h1 className="text-[28px] font-extrabold tracking-tight text-navy lg:text-[38px]">All Categories</h1>
        <p className="text-[14px] text-slate lg:text-[16px]">Everything you need under one roof</p>
        <div className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-9 lg:gap-3">
          {categories.map((c) => (
            <Link key={c.slug} to="/categories/$slug" params={{ slug: c.slug }} className="group rounded-xl bg-[#f6f8fb] px-2 pb-3 pt-2 text-center">
              <img src={c.image} alt="" className="mx-auto h-[72px] w-auto object-contain transition-transform group-hover:scale-105 lg:h-[88px]" />
              <p className="mt-2 text-[13px] font-semibold text-navy lg:text-[15px]">{c.name}</p>
              <p className="text-[11px] text-slate lg:text-[12px]">{c.tagline}</p>
            </Link>
          ))}
        </div>
        <h2 className="mt-8 text-[20px] font-extrabold text-navy lg:text-[26px]">Popular in Groceries</h2>
        <div className="mt-3 grid grid-cols-4 gap-2 lg:grid-cols-8 lg:gap-3">
          {subcategories.map((s) => (
            <Link key={s.name} to="/categories/$slug" params={{ slug: 'groceries' }} className="flex flex-col items-center rounded-xl bg-[#eef3f5] px-1 pb-2 pt-2 text-center text-[11.5px] text-ink lg:text-[14px]">
              <img src={s.image} alt="" className="h-[50px] w-auto object-contain lg:h-[72px]" />
              <span className="mt-1">{s.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </StorePage>
  );
}
