import { createFileRoute, Link, notFound, useNavigate } from '@tanstack/react-router';
import { ArrowRight, CircleCheck, Headphones, Heart, Leaf, Minus, Percent, Play, Plus, RefreshCw, Share2, ShieldCheck, ShoppingCart, Truck, Waves, Award, Soup } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { StorePage } from '@/components/delight/store-shell';
import { ProductCard, Stars } from '@/components/delight/product-card';
import { ProductReviews } from '@/components/delight/product-reviews';
import { useCart } from '@/components/delight/cart-context';
import { formatNpr } from '@/services/catalog';
import { productQuery } from '@/hooks/use-catalog';
import { ART_BACKGROUND } from '@/lib/product-art';

export const Route = createFileRoute('/products/$slug')({
  loader: async ({ params, context }) => {
    const found = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!found) throw notFound();
    return { product: found.product, related: found.related.slice(0, 6) };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.product.name ?? 'Product'} — Delight Shopping Mart` }, { name: 'description', content: loaderData?.product.description ?? 'Product details at Delight Shopping Mart.' }, { property: 'og:title', content: `${loaderData?.product.name ?? 'Product'} — Delight` }, { property: 'og:description', content: loaderData?.product.description ?? 'Shop at Delight.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: ProductPage,
});

function ProductPage() {
  const { product: p, related } = Route.useLoaderData();
  const { add } = useCart();
  const nav = useNavigate();
  const [q, setQ] = useState(1);
  const [active, setActive] = useState(0);
  const [liked, setLiked] = useState(false);
  const gallery = p.gallery ?? [p.image];

  function addToCart() {
    add(p, q);
    toast.success(`${p.name} added to cart`);
  }

  return (
    <StorePage mobile={{ variant: 'back', actions: ['search', 'cart'], search: false }}>
      <div className="mx-auto max-w-[1180px] px-3 pt-2 lg:px-6 lg:pt-8">
        <p className="mb-5 hidden text-[14px] text-slate lg:block"><Link to="/">Home</Link> / <Link to="/categories/$slug" params={{ slug: p.categorySlug ?? 'groceries' }}>{p.category}</Link> / <span className="text-ink">{p.name}</span></p>

        {/* Gallery + info */}
        <section className="grid grid-cols-[42px_1fr_1.08fr] gap-2 min-[400px]:grid-cols-[46px_1fr_1.08fr] lg:grid-cols-[96px_1fr_1fr] lg:gap-8">
          <div className="flex flex-col gap-2 lg:gap-3">
            {gallery.map((src, i) => (
              <button key={src + i} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`} className={`relative aspect-square overflow-hidden rounded-md border-2 lg:rounded-lg ${active === i ? 'border-brand' : 'border-transparent'}`}>
                <img src={src} alt="" className={p.art ? "h-full w-full object-contain p-1.5" : "h-full w-full object-cover"} />
                {i === 3 && <span className="absolute inset-0 grid place-items-center"><span className="grid size-5 place-items-center rounded-full bg-ink/80 lg:size-9"><Play className="size-2.5 fill-white text-white lg:size-4" /></span></span>}
              </button>
            ))}
          </div>
          <div className="flex items-start justify-center pt-2">
            {p.art
              ? <div className="grid aspect-square w-full max-w-[480px] place-items-center rounded-2xl" style={{ background: ART_BACKGROUND[p.categorySlug ?? ''] ?? '#f3f6f8' }}><img src={p.image} alt={p.name} className="w-[55%]" /></div>
              : <img src={gallery[active]} alt={p.name} className="w-full max-w-[480px] object-contain drop-shadow-sm" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between">
              {p.discount ? <span className="rounded-[5px] bg-red px-1.5 py-0.5 text-[11px] font-bold text-white lg:px-2.5 lg:py-1 lg:text-[15px]">{p.discount}% OFF</span> : <span />}
              <div className="flex items-center gap-3 lg:gap-5">
                <button aria-label="Share" onClick={() => { void navigator.clipboard?.writeText(window.location.href); toast.success('Link copied'); }}><Share2 className="size-[18px] text-ink lg:size-6" /></button>
                <button aria-label="Wishlist" onClick={() => setLiked(!liked)}><Heart className={`size-[18px] lg:size-6 ${liked ? 'fill-red text-red' : 'text-ink'}`} /></button>
              </div>
            </div>
            <h1 className="mt-2.5 text-[16.5px] font-extrabold leading-tight text-navy min-[400px]:text-[18px] lg:mt-4 lg:text-[34px]">{p.name}</h1>
            <p className="text-[12.5px] text-slate lg:text-[18px]">{p.unit}</p>
            {p.reviews > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-ink lg:mt-2 lg:text-[16px]">
                <Stars rating={p.rating} className="size-3 lg:size-5" /> <span>{p.rating}</span> <span className="text-slate">({p.reviews} reviews)</span>
              </div>
            )}
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 lg:mt-3 lg:gap-x-4">
              <strong className="text-[19px] font-extrabold text-red lg:text-[36px]">{formatNpr(p.price)}</strong>
              {p.oldPrice && <del className="text-[12px] text-slate lg:text-[20px]">{formatNpr(p.oldPrice)}</del>}
            </div>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#e7f6ee] px-2 py-0.5 text-[11px] font-semibold text-brand lg:mt-3 lg:px-3 lg:py-1 lg:text-[16px]">
              <CircleCheck className="size-3.5 fill-brand text-white lg:size-5" /> {p.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
            <p className="mt-2 text-[11.5px] leading-[1.45] text-slate lg:mt-4 lg:text-[17px] lg:leading-7">{p.description}</p>
            <dl className="mt-2 space-y-0.5 text-[11.5px] lg:mt-4 lg:space-y-1.5 lg:text-[17px]">
              {p.brand && <div className="flex gap-2"><dt className="font-semibold text-navy">Brand:</dt><dd className="text-slate">{p.brand}</dd></div>}
              <div className="flex gap-2"><dt className="font-semibold text-navy">Size:</dt><dd className="text-slate">{p.unit || '1 pc'}</dd></div>
              <div className="flex gap-2"><dt className="font-semibold text-navy">Category:</dt><dd><Link to="/categories/$slug" params={{ slug: p.categorySlug ?? 'groceries' }} search={p.subcategory ? { sub: p.subcategory } : {}} className="text-brand">{p.subcategory ?? p.category}</Link></dd></div>
            </dl>
            <div className="mt-2.5 flex items-center gap-4 lg:mt-5 lg:gap-8">
              <button aria-label="Decrease quantity" onClick={() => setQ(Math.max(1, q - 1))} className="grid size-7 place-items-center rounded-full bg-[#eef1f4] lg:size-12"><Minus className="size-3.5 lg:size-5" /></button>
              <b className="w-4 text-center text-[14px] lg:text-[20px]">{q}</b>
              <button aria-label="Increase quantity" onClick={() => setQ(Math.min(p.stock, q + 1))} className="grid size-7 place-items-center rounded-full bg-[#eef1f4] lg:size-12"><Plus className="size-3.5 lg:size-5" /></button>
            </div>
          </div>
        </section>

        <section className="mt-3 grid grid-cols-2 gap-2 lg:mt-8 lg:gap-4">
          <button onClick={addToCart} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-brand/60 bg-[#f7fcfa] text-[15px] font-semibold text-brand lg:h-14 lg:text-[19px]"><ShoppingCart className="size-5 fill-brand lg:size-6" /> Add to Cart</button>
          <button onClick={() => { add(p, q); void nav({ to: '/checkout' }); }} className="h-11 rounded-lg bg-red text-[15px] font-semibold text-white shadow-md shadow-red/20 lg:h-14 lg:text-[19px]">Buy Now</button>
        </section>

        <section className="mt-3 grid grid-cols-4 rounded-xl bg-[#f3f9fc] py-3 lg:mt-5 lg:py-5">
          {([[Truck, 'Free Delivery', 'above NPR 1,000'], [RefreshCw, 'Easy Returns', '7 Days'], [ShieldCheck, '100% Authentic', 'Products'], [Headphones, '24/7 Support', "We're here to help"]] as const).map(([Icon, a, b], i) => (
            <div key={a} className={`px-1.5 lg:px-6 ${i < 3 ? 'border-r border-line' : ''}`}>
              <Icon className="size-5 fill-brand/10 text-brand lg:size-8" />
              <b className="mt-1 block text-[10.5px] font-semibold leading-tight text-navy lg:mt-2 lg:text-[16px]">{a}</b>
              <span className="block text-[10px] leading-tight text-slate lg:text-[15px]">{b}</span>
            </div>
          ))}
        </section>

        <section className="mt-3 rounded-xl bg-[#eef8f3] px-3 py-3 lg:mt-5 lg:px-8 lg:py-6">
          <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-navy lg:text-[24px]"><Leaf className="size-5 fill-brand text-brand lg:size-7" /> Product Highlights</h2>
          <div className="mt-2 grid grid-cols-4 text-center lg:mt-4">
            {([[Award, 'Genuine Product'], [Leaf, 'Quality Checked'], [Percent, 'Best Local Price'], [Truck, 'Fast Delivery']] as const).map(([Icon, label]) => (
              <div key={label} className="flex flex-col items-center gap-1.5 px-1">
                <span className="grid size-10 place-items-center rounded-full border border-line bg-white lg:size-16"><Icon className="size-5 text-brand lg:size-7" /></span>
                <span className="text-[11.5px] leading-tight text-navy lg:text-[16px]">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <ProductReviews productId={p.id} />

        <section className="mt-5 lg:mt-10">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-[19px] font-extrabold text-navy lg:text-[28px]">You May Also Like</h2>
            <Link to="/products" className="flex items-center gap-1 text-[13.5px] font-semibold text-brand lg:text-[16px]">View All <ArrowRight className="size-4" /></Link>
          </div>
          <div className="grid grid-cols-4 gap-1.5 lg:gap-4">
            {related.map((x) => <ProductCard key={x.id} product={x} variant="grid" badge="none" button="Add" />)}
          </div>
        </section>

        <section className="mt-3 flex items-center gap-3 rounded-xl bg-[#fdeff1] px-3 py-3 lg:mt-6 lg:gap-5 lg:px-7 lg:py-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f46b6f] lg:size-14"><Percent className="size-5 text-white lg:size-7" strokeWidth={3} /></span>
          <span className="min-w-0 flex-1"><b className="block text-[15px] font-extrabold text-red lg:text-[22px]">Get Extra 5% OFF</b><span className="text-[11.5px] text-ink lg:text-[16px]">On orders above NPR 3,000</span></span>
          <button onClick={() => { void navigator.clipboard?.writeText('DELIGHT5'); toast.success('Code DELIGHT5 copied'); }} className="shrink-0 rounded-md border border-red bg-white px-2.5 py-2 text-[11.5px] font-semibold text-red lg:px-6 lg:py-3 lg:text-[16px]">Use Code: DELIGHT5</button>
        </section>
        <div className="h-6 lg:h-12" />
      </div>
    </StorePage>
  );
}
