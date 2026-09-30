import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StorePage } from '@/components/delight/store-shell';
import { MobileHead, SectionHead } from '@/components/delight/section';
import { ProductCard } from '@/components/delight/product-card';
import { AppPromo, BannerLink, CarouselArrow, CommunityNewsletter, DealTimer, JustArrivedTitle, Newsletter } from '@/components/delight/home-parts';
import { brands, NAV_CATEGORIES, type Category, type Collections, type StoreBanner } from '@/services/catalog';
import { storefrontQuery } from '@/hooks/use-catalog';
import { NewsletterForm } from '@/components/delight/newsletter-form';
import { useRecentlyViewed } from '@/lib/recently-viewed';
import { asset } from '@/lib/assets';
import { shouldOnboard } from '@/lib/onboarding';
import storeHero from '@/assets/store-hero.jpg';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Delight Shopping Mart — Tulsipur, Dang' }, { name: 'description', content: 'Shop groceries, fashion, baby care and home essentials locally in Tulsipur.' }, { property: 'og:title', content: 'Delight Shopping Mart — Tulsipur' }, { property: 'og:description', content: 'Everything you need under one roof.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  component: Index,
});

function Index() {
  const nav = useNavigate();
  useEffect(() => {
    if (shouldOnboard()) void nav({ to: '/welcome', replace: true });
  }, [nav]);
  const { categories, collections, banners } = Route.useLoaderData();
  return (
    <StorePage mobile={{ variant: 'home', actions: ['wishlist', 'cart'] }}>
      <div className="hidden lg:block"><DesktopHome categories={categories} collections={collections} banners={banners} /></div>
      <div className="lg:hidden"><MobileHome categories={categories} collections={collections} banners={banners} /></div>
    </StorePage>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop                                                             */
/* ------------------------------------------------------------------ */

const heroList = [['Groceries', 'Fashion', 'Baby Care', 'Stationery', 'Toys'], ['Kitchen Items', 'Beauty & Skincare', 'Fast Food', 'And More']];

function Bullets({ rows, className, gap = 'gap-x-3.5' }: { rows: string[][]; className: string; gap?: string }) {
  return (
    <div className={className}>
      {rows.map((row, r) => (
        <p key={r} className={`flex flex-wrap items-center ${gap}`}>
          {row.map((item, i) => <span key={item} className={`flex items-center whitespace-nowrap ${gap}`}>{i > 0 && <span className="size-1 rounded-full bg-current" />}{item}</span>)}
        </p>
      ))}
    </div>
  );
}

/** Photos shown in the hero slider (the text and buttons stay the same on every slide). */
const heroSlides = [
  { src: asset('hero-desktop'), alt: 'Family shopping at Delight Shopping Mart', position: 'center' },
  { src: storeHero, alt: 'Mother and daughter shopping for fresh groceries', position: '72% center' },
  { src: asset('hero-mobile'), alt: 'Shopper with a bag of fresh groceries', position: 'center' },
];

/** Auto-advancing slide index; pauses while the pointer is over the slider. */
function useSlides(count: number, delay = 5000) {
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || count < 2) return;
    const t = setInterval(() => setSlide((v) => (v + 1) % count), delay);
    return () => clearInterval(t);
  }, [paused, count, delay]);
  return { slide, setSlide, pause: () => setPaused(true), resume: () => setPaused(false) };
}

// Phones start with the photo from the mobile design.
const mobileSlides = [heroSlides[2]!, heroSlides[0]!, heroSlides[1]!];

function HeroImages({ slide, className, slides = heroSlides }: { slide: number; className: string; slides?: typeof heroSlides }) {
  return (
    <>
      {slides.map((h, i) => (
        <img key={h.alt} src={h.src} alt={h.alt} aria-hidden={i !== slide} style={{ objectPosition: h.position }}
          className={`absolute inset-y-0 right-0 h-full object-cover transition-opacity duration-700 ${className} ${i === slide ? 'opacity-100' : 'opacity-0'}`} />
      ))}
    </>
  );
}

function DesktopHero() {
  const { slide, setSlide, pause, resume } = useSlides(heroSlides.length);
  const n = heroSlides.length;
  const feats = [['hero-feat-1', 'Fast & Reliable', 'Local Delivery'], ['hero-feat-2', 'Fresh & Quality', 'Products'], ['hero-feat-3', 'Your Trusted', 'Shopping Mart']] as const;
  return (
    <section className="site-width relative mt-5" onMouseEnter={pause} onMouseLeave={resume}>
      <div className="relative h-[444px] overflow-hidden rounded-2xl bg-[#f3f7f3] 2xl:h-[500px]">
        <div className="absolute inset-y-0 right-0 w-[min(58%,960px)]">
          <HeroImages slide={slide} className="w-full" />
          <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#f3f7f3] to-transparent" />
        </div>
        <div className="relative z-10 flex h-full flex-col justify-center pl-[38px] 2xl:pl-14">
          <p className="flex items-center gap-4 text-[13px] font-semibold tracking-[0.2em] text-navy">YOUR LOCAL SHOPPING MART <span className="h-0.5 w-12 bg-red" /></p>
          <h1 className="mt-5 text-[54px] font-extrabold leading-[1.02] tracking-[-0.02em] text-[#0b3d2e] 2xl:text-[60px]">Everything You Need<br /><span className="text-red">Under One Roof</span></h1>
          <Bullets rows={heroList} className="mt-5 space-y-1 text-[19px] text-ink" />
          <Link to="/products" className="mt-6 flex h-[54px] w-[216px] items-center justify-center gap-3 rounded-lg bg-red text-[18px] font-semibold text-white shadow-md shadow-red/20 hover:bg-red/90">Shop Now <ArrowRight className="size-5" /></Link>
          <div className="mt-6 flex gap-10">
            {feats.map(([icon, a, b]) => (
              <div key={a} className="flex items-center gap-3 text-[15px] leading-5 text-ink">
                <img src={asset(icon)} alt="" className="size-[54px]" />
                <span>{a}<br />{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-3 left-[calc(42%+2rem)] z-10 flex h-8 items-center gap-3 rounded-full bg-white/90 px-5 shadow-sm">
          {heroSlides.map((h, i) => <button key={h.alt} aria-label={`Slide ${i + 1}`} onClick={() => setSlide(i)} className={`size-2.5 rounded-full transition-colors ${slide === i ? 'bg-red' : 'bg-[#9aa3ad]'}`} />)}
        </div>
      </div>
      <CarouselArrow dir="left" onClick={() => setSlide((slide + n - 1) % n)} className="absolute -left-5 top-1/2 z-20 -translate-y-1/2" />
      <CarouselArrow dir="right" onClick={() => setSlide((slide + 1) % n)} className="absolute -right-5 top-1/2 z-20 -translate-y-1/2" />
    </section>
  );
}

function Services() {
  const items = [['service-1', 'Great Offers', 'Every Week'], ['service-2', 'Fresh Products', 'Sourced with Care'], ['service-3', 'Local Delivery', 'Across Tulsipur'], ['service-4', 'Safe & Secure', 'Shopping'], ['service-5', 'Friendly Support', "We're here to help"]] as const;
  return (
    <section className="site-width mt-4 grid grid-cols-5 gap-3">
      {items.map(([icon, a, b]) => (
        <div key={a} className="flex h-[98px] items-center justify-center gap-5 rounded-xl bg-[#f6f8fb]">
          <img src={asset(icon)} alt="" className="h-[52px] w-auto" />
          <span className="leading-6"><b className="block text-[17px] font-semibold text-navy">{a}</b><span className="text-[15px] text-slate">{b}</span></span>
        </div>
      ))}
    </section>
  );
}

function WhyShop() {
  const items = [['why-1', 'Fast & Reliable Delivery', 'Across Tulsipur'], ['why-2', 'Quality Products', 'Trusted by Families'], ['why-3', 'Exciting Offers', 'Every Week'], ['why-4', 'Friendly Support', "We're here to help"], ['why-5', 'Your Local Store', 'Shop Local, Grow Together']] as const;
  return (
    <section className="site-width mt-6 flex items-center rounded-2xl bg-[#eff8f3] px-6 py-5">
      <div className="w-[300px] shrink-0 border-r border-line pr-6">
        <h3 className="text-[23px] font-extrabold leading-7 text-navy">Why Shop at<br />Delight Shopping Mart?</h3>
        <span className="mt-3 block h-0.5 w-10 bg-red" />
      </div>
      {items.map(([icon, a, b], i) => (
        <div key={a} className={`flex flex-1 items-center justify-center gap-3 px-3 ${i < 4 ? 'border-r border-line' : ''}`}>
          <img src={asset(icon)} alt="" className="h-[48px] w-auto" />
          <span className="text-[13px] leading-5 text-ink"><b className="block text-[14px] font-semibold text-navy">{a}</b>{b}</span>
        </div>
      ))}
    </section>
  );
}

type Data = { categories: Category[]; collections: Collections; banners: StoreBanner[] };

/** Admin-managed banner slider; replaces the designed hero when banners exist. */
function BannerSlider({ items, className }: { items: StoreBanner[]; className: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);
  const b = items[i % items.length]!;
  return (
    <section className={`relative overflow-hidden rounded-2xl bg-[#f3f7f3] ${className}`}>
      <a href={b.link}><img src={b.image} alt={b.title} className="h-full w-full object-cover" /></a>
      {items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-white/90 px-4 py-2 shadow-sm">
          {items.map((x, k) => <button key={x.image + k} aria-label={`Banner ${k + 1}`} onClick={() => setI(k)} className={`size-2.5 rounded-full ${k === i % items.length ? 'bg-red' : 'bg-[#9aa3ad]'}`} />)}
        </div>
      )}
    </section>
  );
}
const at = (banners: StoreBanner[], position: string) => banners.filter((b) => b.position === position);

/** The nine categories shown in the homepage grids (same as the desktop category bar). */
const topNine = (categories: Category[]) => [...NAV_CATEGORIES, 'deals-offers'].map((slug) => categories.find((c) => c.slug === slug)).filter((c): c is Category => Boolean(c)).slice(0, 9);

function PopularCategories({ categories }: Pick<Data, 'categories'>) {
  return (
    <section className="site-width mt-12">
      <SectionHead eyebrow="Shop by Category" title="Popular Categories" link="View All Categories" to="/categories" />
      <div className="grid grid-cols-9 gap-4">
        {topNine(categories).map((c) => (
          <Link key={c.slug} to="/categories/$slug" params={{ slug: c.slug }} className="group rounded-xl border border-line bg-[#f7f9fb] px-2 pb-3 pt-4 text-center hover:border-brand/40">
            <img src={c.image} alt="" className="mx-auto h-[70px] w-auto object-contain transition-transform group-hover:scale-105" />
            <p className="mt-2 text-[14px] font-semibold text-navy">{c.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ExploreCategories({ categories }: Pick<Data, 'categories'>) {
  return (
    <section className="site-width mt-10">
      <SectionHead eyebrow="Shop by Category" title="Explore Our" accent="Categories" link="View All Categories" to="/categories" />
      <div className="grid grid-cols-9 gap-3">
        {topNine(categories).map((c) => (
          <Link key={c.slug} to="/categories/$slug" params={{ slug: c.slug }} className="group rounded-xl bg-[#f6f8fb] px-2 pb-3 pt-2 text-center">
            <img src={c.image} alt="" className="mx-auto h-[88px] w-auto object-contain transition-transform group-hover:scale-105" />
            <p className="mt-2 text-[15px] font-semibold text-navy">{c.name}</p>
            <p className="text-[12px] text-slate">{c.tagline}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Brands() {
  return (
    <section className="site-width mt-8">
      <SectionHead eyebrow="Top Brands" title="Trusted Brands at Delight" link="Shop All Products" to="/products" />
      <div className="marquee relative overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
        <div className="marquee-track flex w-max gap-3.5">
          {[...brands, ...brands].map((b, i) => (
            <div key={i} aria-hidden={i >= brands.length} className="grid h-[80px] w-[130px] shrink-0 place-items-center rounded-lg border border-line bg-white shadow-sm">
              <img src={b} alt={i < brands.length ? 'Brand logo' : ''} className="max-h-[64px] w-auto" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [['trust-1', 'Free Delivery', 'On orders above NPR 1,000'], ['trust-2', 'Secure Payment', 'Safe & trusted'], ['trust-3', 'Easy Returns', 'Hassle-free returns'], ['trust-4', '24/7 Support', "We're here to help"], ['trust-5', 'Local Store', 'Proudly in Tulsipur']] as const;
  return (
    <section className="site-width grid grid-cols-5 py-7">
      {items.map(([icon, a, b], i) => (
        <div key={a} className={`flex items-center justify-center gap-4 ${i < 4 ? 'border-r border-line' : ''}`}>
          <img src={asset(icon)} alt="" className="h-[46px] w-auto" />
          <span className="leading-6"><b className="block text-[15px] font-semibold text-navy">{a}</b><span className="text-[14px] text-slate">{b}</span></span>
        </div>
      ))}
    </section>
  );
}

function DesktopHome({ categories, collections, banners }: Data) {
  const slider = at(banners, 'Homepage Slider');
  const below = at(banners, 'Below Slider');
  const shopMore = at(banners, 'Shop More Row');
  return (
    <>
      {slider.length ? <div className="site-width mt-5"><BannerSlider items={slider} className="h-[444px]" /></div> : <DesktopHero />}
      <Services />
      <PopularCategories categories={categories} />
      <section className="site-width mt-12">
        <SectionHead eyebrow="Today's Best Deals" title="Today's" accent="Special Offers" link="View All Deals" to="/categories/deals-offers" extra={<DealTimer />} />
        <div className="grid grid-cols-6 gap-3.5">{collections.specialOffers.slice(0, 6).map((p) => <ProductCard key={p.id} product={p} />)}</div>
      </section>
      {below.length ? (
        <section className="site-width mt-3 grid gap-3.5" style={{ gridTemplateColumns: `repeat(${Math.min(below.length, 3)}, minmax(0, 1fr))` }}>
          {below.slice(0, 3).map((b) => <a key={b.image} href={b.link} className="block overflow-hidden rounded-xl"><img src={b.image} alt={b.title} className="h-[185px] w-full object-cover" /></a>)}
        </section>
      ) : (
        <section className="site-width mt-3 grid grid-cols-[1.03fr_1fr_1.03fr] gap-3.5">
          <BannerLink src={asset('promo-groceries')} alt="Groceries for a Better Tomorrow" to="/categories/groceries" />
          <BannerLink src={asset('promo-fashion')} alt="Fashion for Every You" to="/categories/ladies-wear" />
          <BannerLink src={asset('promo-stationery')} alt="Stationery & School Essentials" to="/categories/stationery" />
        </section>
      )}
      <RecentlyViewed variant="desktop" />
      <section className="site-width mt-8">
        <SectionHead eyebrow="Featured Products" title="Popular Products" link="View All Products" />
        <div className="grid grid-cols-6 gap-3.5">{collections.popular.slice(0, 6).map((p) => <ProductCard key={p.id} product={p} badge="none" />)}</div>
      </section>
      <WhyShop />
      <ExploreCategories categories={categories} />
      <section className="site-width mt-5 grid grid-cols-[1.2fr_1.06fr_1fr] gap-3.5">
        <BannerLink src={asset('season-monsoon')} alt="Monsoon Essentials" />
        <BannerLink src={asset('season-school')} alt="Back to School" to="/categories/stationery" />
        <BannerLink src={asset('season-fresh')} alt="Fresh Food Everyday" to="/categories/groceries" />
      </section>
      <section className="site-width mt-8">
        <SectionHead eyebrow="New Arrivals" title="Just Arrived" link="View All New Arrivals" extra={<JustArrivedTitle />} />
        <div className="grid grid-cols-6 gap-3.5">{collections.justArrived.slice(0, 6).map((p) => <ProductCard key={p.id} product={p} badge="new" showUnit={false} />)}</div>
      </section>
      <section className="site-width mt-8 grid grid-cols-[1.28fr_1fr] gap-3.5">
        <Newsletter />
        <AppPromo />
      </section>
      <section className="site-width mt-10">
        <SectionHead eyebrow="Special Offers" title="Shop More," accent="Save More" link="View All Offers" to="/categories/deals-offers" />
        {shopMore.length ? (
          <div className="grid gap-3.5" style={{ gridTemplateColumns: `repeat(${Math.min(shopMore.length, 4)}, minmax(0, 1fr))` }}>
            {shopMore.slice(0, 4).map((b) => <a key={b.image} href={b.link} className="block overflow-hidden rounded-xl"><img src={b.image} alt={b.title} className="h-[171px] w-full object-cover" /></a>)}
          </div>
        ) : (
        <div className="grid grid-cols-[1.04fr_1fr_1fr_1.04fr] gap-3.5">
          <BannerLink src={asset('save-groceries')} alt="Up to 30% off daily essentials" to="/categories/groceries" />
          <BannerLink src={asset('save-fashion')} alt="Trendy styles for every you" to="/categories/ladies-wear" />
          <BannerLink src={asset('save-baby')} alt="Baby care" to="/categories/baby-care" />
          <BannerLink src={asset('save-kitchen')} alt="Make home better" to="/categories/kitchen-household" />
        </div>
        )}
      </section>
      <Brands />
      <section className="site-width mt-8"><CommunityNewsletter /></section>
      <TrustStrip />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile                                                              */
/* ------------------------------------------------------------------ */

function MobileHome({ categories, collections, banners }: Data) {
  const { slide, setSlide } = useSlides(heroSlides.length);
  const slider = at(banners, 'Homepage Slider');
  const below = at(banners, 'Below Slider');
  const services = [['service-3', 'Fast & Reliable', 'Delivery'], ['service-4', 'Quality', 'Products'], ['service-1', 'Great', 'Offers'], ['service-5', '24/7', 'Support']] as const;
  return (
    <div className="px-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pt-1">
        {categories.filter((c) => c.circle).map((c) => (
          <Link key={c.slug} to="/categories/$slug" params={{ slug: c.slug }} className="flex w-[62px] shrink-0 flex-col items-center gap-1.5 text-[12px] text-ink">
            <img src={c.circle} alt="" className="size-[56px] rounded-full" />
            <span className="whitespace-nowrap">{c.short}</span>
          </Link>
        ))}
        <Link to="/categories" className="flex w-[56px] shrink-0 flex-col items-center gap-1.5 text-[12px] text-ink">
          <span className="grid size-[56px] place-items-center rounded-full bg-[#eef3f7]"><ChevronRight className="size-6" /></span>More
        </Link>
      </div>

      {slider.length ? <BannerSlider items={slider} className="mt-4 h-[170px] min-[480px]:h-[230px]" /> : (
      <section className="relative mt-4 h-[196px] overflow-hidden rounded-2xl bg-[#eef6ee] min-[480px]:h-[240px]">
        <div className="absolute inset-y-0 right-0 w-[54%]"><HeroImages slide={slide} slides={mobileSlides} className="w-full" /></div>
        <div className="absolute inset-y-0 left-[44%] w-10 bg-gradient-to-r from-[#eef6ee] to-transparent" />
        <div className="relative z-10 flex h-full max-w-[56%] flex-col justify-center pl-4">
          <p className="text-[11.5px] font-semibold text-brand">Your Local Shopping Mart</p>
          <h1 className="mt-1 text-[19px] font-extrabold leading-[1.12] text-navy min-[480px]:text-[24px]">Everything You Need<br /><span className="text-red">Under One Roof</span></h1>
          <Bullets rows={[['Groceries', 'Fashion', 'Baby Care'], ['Stationery', 'Toys', 'And More']]} className="mt-2 space-y-0.5 text-[11px] text-ink" gap="gap-x-1.5" />
          <Link to="/products" className="mt-3 flex h-9 w-[112px] items-center justify-center gap-2 rounded-md bg-red text-[13px] font-semibold text-white">Shop Now <ArrowRight className="size-4" /></Link>
        </div>
        <div className="absolute bottom-2 left-[42%] z-10 flex h-5 items-center gap-2 rounded-full bg-white/90 px-3">
          {heroSlides.map((h, i) => <button key={h.alt} aria-label={`Slide ${i + 1}`} onClick={() => setSlide(i)} className={`size-2 rounded-full ${slide === i ? 'bg-red' : 'bg-[#c3c9cf]'}`} />)}
        </div>
      </section>
      )}

      <section className="mt-3 grid grid-cols-4 rounded-xl bg-[#f3f9fb] py-3">
        {services.map(([icon, a, b], i) => (
          <div key={a} className={`flex flex-col items-center gap-1 text-center text-[12px] leading-4 text-navy ${i < 3 ? 'border-r border-line' : ''}`}>
            <img src={asset(icon)} alt="" className="h-9 w-auto" />
            <span>{a}<br />{b}</span>
          </div>
        ))}
      </section>

      <section className="mt-6">
        <MobileHead title="Today's" accent="Special Offers" to="/categories/deals-offers" extra={<DealTimer compact />} />
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
          {collections.specialOffers.map((p) => <div key={p.id} className="w-[31%] shrink-0 sm:w-[23%]"><ProductCard product={p} variant="mobile" /></div>)}
        </div>
      </section>

      <section className="mt-6">
        <MobileHead title="Shop by Category" to="/categories" />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {categories.slice(0, 6).map((c) => (
            <Link key={c.slug} to="/categories/$slug" params={{ slug: c.slug }} className="w-[92px] shrink-0 rounded-xl bg-[#f6f8fb] px-1 pb-2 pt-2 text-center text-[12.5px] text-ink">
              <img src={c.image} alt="" className="mx-auto h-[56px] w-auto object-contain" />
              <span className="mt-1 block whitespace-nowrap">{c.short}</span>
            </Link>
          ))}
          <Link to="/categories" className="flex w-[64px] shrink-0 flex-col items-center justify-center gap-2 text-[13px] text-ink">
            <span className="grid size-11 place-items-center rounded-full border border-line bg-white shadow-sm"><ChevronRight className="size-5" /></span>More
          </Link>
        </div>
      </section>

      <section className="mt-3 grid grid-cols-2 gap-2.5">
        {below.length ? below.slice(0, 2).map((b) => <a key={b.image} href={b.link} className="block overflow-hidden rounded-xl"><img src={b.image} alt={b.title} className="aspect-[2/1] w-full object-cover" /></a>) : (
          <>
            <BannerLink src={asset('m-banner-groceries')} alt="Healthy Living Everyday" to="/categories/groceries" />
            <BannerLink src={asset('m-banner-fashion')} alt="Style for Every You" to="/categories/ladies-wear" />
          </>
        )}
      </section>

      <section className="mt-6">
        <MobileHead title="Featured Products" />
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2">
          {collections.popular.map((p) => <div key={p.id} className="w-[31%] shrink-0 sm:w-[23%]"><ProductCard product={p} variant="mobile" badge="none" showUnit={false} /></div>)}
        </div>
      </section>

      <RecentlyViewed variant="mobile" />
      <MobileRow title="Daily" accent="Essentials" to="/categories/groceries" products={collections.groceryPopular} />

      <section className="mt-6">
        <MobileHead title="Why Shop at" accent="Delight?" to="/categories" />
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4">
          {([['why-1', 'Fast & Reliable Delivery', 'Across Tulsipur'], ['why-2', 'Quality Products', 'Trusted by Families'], ['why-3', 'Exciting Offers', 'Every Week'], ['why-4', 'Friendly Support', "We're here to help"], ['why-5', 'Your Local Store', 'Shop Local, Grow Together']] as const).map(([icon, a, b]) => (
            <div key={a} className="flex w-[150px] shrink-0 items-center gap-2 rounded-xl bg-[#eff8f3] px-3 py-3">
              <img src={asset(icon)} alt="" className="h-9 w-auto" />
              <span className="text-[11.5px] leading-4 text-ink"><b className="block text-[12.5px] font-semibold text-navy">{a}</b>{b}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <MobileHead title="Explore Our" accent="Categories" to="/categories" />
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.slug} to="/categories/$slug" params={{ slug: c.slug }} className="rounded-xl bg-[#f6f8fb] px-1 pb-2 pt-2 text-center">
              <img src={c.image} alt="" className="mx-auto h-[48px] w-auto object-contain" />
              <span className="mt-1 block text-[11px] font-medium leading-tight text-navy">{c.short}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="no-scrollbar -mx-4 mt-6 flex gap-2.5 overflow-x-auto px-4">
        {([['promo-groceries', 'Groceries for a Better Tomorrow', '/categories/groceries'], ['promo-fashion', 'Fashion for Every You', '/categories/ladies-wear'], ['promo-stationery', 'Stationery & School Essentials', '/categories/stationery'], ['season-monsoon', 'Monsoon Essentials', '/products'], ['season-school', 'Back to School', '/categories/stationery'], ['season-fresh', 'Fresh Food Everyday', '/categories/groceries']] as const).map(([img, alt, to]) => (
          <BannerLink key={img} src={asset(img)} alt={alt} to={to} className="w-[78%] shrink-0 sm:w-[46%]" />
        ))}
      </section>

      <MobileRow title="Just" accent="Arrived" to="/products" products={collections.justArrived} badge="new" />

      <section className="mt-6">
        <MobileHead title="Shop More," accent="Save More" to="/categories/deals-offers" />
        <div className="grid grid-cols-2 gap-2.5">
          <BannerLink src={asset('save-groceries')} alt="Up to 30% off daily essentials" to="/categories/groceries" />
          <BannerLink src={asset('save-fashion')} alt="Trendy styles for every you" to="/categories/ladies-wear" />
          <BannerLink src={asset('save-baby')} alt="Baby care" to="/categories/baby-care" />
          <BannerLink src={asset('save-kitchen')} alt="Make home better" to="/categories/kitchen-household" />
        </div>
      </section>

      <section className="mt-6 flex items-center gap-3 overflow-hidden rounded-2xl bg-[#eef7f2] px-4 py-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-extrabold text-navy">Download Our App</h3>
          <p className="text-[12.5px] text-ink">Shop Anytime, Anywhere</p>
          <div className="mt-2.5 flex gap-2">
            <Link to="/app"><img src={asset('google-play')} alt="Get the Delight app on Android" className="h-8 w-auto" /></Link>
            <Link to="/app"><img src={asset('app-store')} alt="Get the Delight app on iPhone" className="h-8 w-auto" /></Link>
          </div>
        </div>
        <img src={asset('app-phone')} alt="" className="-mb-4 h-[112px] w-auto self-end" />
      </section>

      <section className="mt-6 pb-2">
        <MobileHead title="Trusted" accent="Brands" />
        <div className="marquee relative -mx-4 overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="marquee-track flex w-max gap-2.5 [animation-duration:30s]">
            {[...brands, ...brands].map((b, i) => (
              <div key={i} aria-hidden={i >= brands.length} className="grid h-[58px] w-[96px] shrink-0 place-items-center rounded-lg border border-line bg-white shadow-sm">
                <img src={b} alt={i < brands.length ? 'Brand logo' : ''} className="max-h-[44px] w-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-[#fdeef0] px-4 py-5">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-slate">JOIN OUR COMMUNITY</p>
        <h3 className="mt-1 text-[19px] font-extrabold text-navy">Stay Updated with Delight</h3>
        <p className="mt-1 text-[13px] text-slate">Latest offers, new arrivals and exclusive deals.</p>
        <NewsletterForm size="sm" source="home" className="mt-3" />
      </section>

      <section className="mt-5 grid grid-cols-2 gap-2.5 pb-4">
        {([['trust-1', 'Free Delivery', 'Orders above NPR 1,000'], ['trust-2', 'Secure Payment', 'Safe & trusted'], ['trust-3', 'Easy Returns', 'Hassle-free returns'], ['trust-4', '24/7 Support', "We're here to help"]] as const).map(([icon, a, b]) => (
          <div key={a} className="flex items-center gap-2.5 rounded-xl bg-[#f6f8fb] px-3 py-3">
            <img src={asset(icon)} alt="" className="h-8 w-auto" />
            <span className="text-[11.5px] leading-4 text-slate"><b className="block text-[12.5px] font-semibold text-navy">{a}</b>{b}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

/** Horizontally scrolling product row used on the mobile homepage. */
function MobileRow({ title, accent, to, products, badge = 'discount' }: { title: string; accent?: string; to: string; products: Collections['popular']; badge?: 'discount' | 'new' | 'none' }) {
  if (!products.length) return null;
  return (
    <section className="mt-6">
      <MobileHead title={title} {...(accent ? { accent } : {})} to={to} />
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {products.map((p) => <div key={p.id} className="w-[31%] shrink-0 sm:w-[22%]"><ProductCard product={p} variant="mobile" badge={badge} /></div>)}
      </div>
    </section>
  );
}

/** Products this device opened recently (hidden until there are some). */
function RecentlyViewed({ variant }: { variant: 'desktop' | 'mobile' }) {
  const recent = useRecentlyViewed();
  if (recent.length < 2) return null;
  if (variant === 'mobile') return <MobileRow title="Recently" accent="Viewed" to="/products" products={recent} badge="none" />;
  return (
    <section className="site-width mt-8">
      <SectionHead eyebrow="Pick up where you left off" title="Recently" accent="Viewed" link="View All Products" />
      <div className="grid grid-cols-6 gap-3.5">{recent.slice(0, 6).map((p) => <ProductCard key={p.id} product={p} badge="none" />)}</div>
    </section>
  );
}
