import { Link, useNavigate, useRouter, useRouterState } from '@tanstack/react-router';
import {
  Bell, ChevronDown, ChevronLeft, ChevronRight, Facebook, Heart, Home, Instagram, LayoutGrid, Linkedin, MapPin,
  Menu, Music2, ScanLine, Search, ShoppingBag, ShoppingCart, UserRound, Youtube,
} from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Logo } from './logo';
import { SmartSearch } from './smart-search';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useCart } from './cart-context';
import { useAuth } from './auth-context';
import { useWishlist } from './wishlist-context';
import { StoreButton, useBranch } from './branch-context';
import { hoursText } from '@/lib/branch';
import { STORE } from '@/lib/store-info';
import { NAV_CATEGORIES, type Category } from '@/services/catalog';
import { useCategories } from '@/hooks/use-catalog';
import { asset } from '@/lib/assets';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

/* ------------------------------------------------------------------ */
/* Desktop                                                             */
/* ------------------------------------------------------------------ */

function TopBar() {
  const { branch } = useBranch();
  const hours = hoursText(branch);
  return (
    <div className="hidden bg-[#f1f8f6] text-[13px] text-ink lg:block">
      <div className="site-width flex h-9 items-center justify-between">
        <div className="flex items-center gap-4">
          <StoreButton className="text-[13px]" />
          <span className="h-4 w-px bg-ink/40" />
          <span>Open Daily: {hours || '7 AM – 9 PM'}</span>
        </div>
        <div className="flex items-center gap-10">
          <nav className="flex items-center gap-3">
            <Link to="/products" className="hover:text-brand">Shop Local</Link><span className="text-ink/40">|</span>
            <Link to="/account/help" className="hover:text-brand">Help</Link><span className="text-ink/40">|</span>
            <Link to="/orders" className="hover:text-brand">Track Order</Link><span className="text-ink/40">|</span>
            <Link to="/store-location" className="hover:text-brand">Contact</Link>
          </nav>
          <div className="flex items-center gap-4 text-navy">
            {STORE.socials.facebook && <a href={STORE.socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook className="size-[18px] fill-navy" strokeWidth={0} /></a>}
            {STORE.socials.instagram && <a href={STORE.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram className="size-[18px]" /></a>}
            {STORE.socials.youtube && <a href={STORE.socials.youtube} target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube className="size-5 fill-navy text-[#f1f8f6]" /></a>}
          </div>
          <span className="flex items-center gap-1.5 font-semibold text-brand">
            <span className="text-brand">❖</span> Happier Dang <Heart className="size-5 fill-red text-red" />
          </span>
        </div>
      </div>
    </div>
  );
}

function HeaderAction({ to, icon: Icon, label, count }: { to: string; icon: typeof Heart; label: string; count?: number }) {
  return (
    <Link to={to as '/'} className="flex flex-col items-center gap-0.5 text-[13px] text-ink hover:text-brand">
      <span className="relative">
        <Icon className="size-6" strokeWidth={1.7} />
        {count !== undefined && <span className="cart-count !-right-2 !-top-2 !size-5">{count}</span>}
      </span>
      {label}
    </Link>
  );
}

function DesktopHeader({ compact }: { compact: boolean }) {
  const { count } = useCart();
  const wishlist = useWishlist();
  const { user } = useAuth();
  return (
    <header className="bg-white">
      <div className={`site-width flex items-center justify-between gap-10 transition-[height] duration-200 ${compact ? 'h-[64px]' : 'h-[92px]'}`}>
        <Link to="/" aria-label="Delight Shopping Mart home"><Logo className={`w-auto transition-[height] duration-200 ${compact ? 'h-[44px]' : 'h-[60px]'}`} /></Link>
        <SmartSearch variant="desktop" />
        <div className="flex items-center gap-9 pr-2">
          <HeaderAction to={user ? '/account' : '/login'} icon={UserRound} label="Account" />
          <HeaderAction to="/wishlist" icon={Heart} label="Wishlist" count={wishlist.count} />
          <HeaderAction to="/cart" icon={ShoppingCart} label="Cart" count={count} />
        </div>
      </div>
    </header>
  );
}

function CategoryNav({ compact }: { compact: boolean }) {
  const all = useCategories();
  const shown = [...NAV_CATEGORIES, 'deals-offers'].map((slug) => all.find((c) => c.slug === slug)).filter((c): c is Category => Boolean(c));
  return (
    <nav className="bg-white">
      <div className={`site-width flex items-stretch border-b border-line transition-[height] duration-200 ${compact ? 'h-[50px] pb-1' : 'h-[72px] pb-1.5'}`}>
        <Link to="/categories" className={`my-auto mr-5 flex shrink-0 ${compact ? 'h-[38px]' : 'h-[46px]'} items-center gap-2.5 rounded-lg bg-brand px-5 text-[15px] font-semibold text-white shadow-sm hover:bg-brand-dark`}>
          <Menu className="size-5" /> All Categories <ChevronDown className="size-4" />
        </Link>
        <div className="flex flex-1 items-stretch justify-between">
          {shown.map((c, i) => (
            <Link key={c.slug} to="/categories/$slug" params={{ slug: c.slug }} className={`group flex flex-1 items-center justify-center px-2 text-[13.5px] text-ink hover:text-brand ${compact ? 'flex-row gap-1.5' : 'flex-col gap-1'} ${i ? 'border-l border-line' : ''}`}>
              <img src={c.icon} alt="" className={`object-contain transition-transform group-hover:-translate-y-0.5 ${compact ? 'size-6' : 'size-8'}`} />
              <span className="whitespace-nowrap">{c.short}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

/**
 * Desktop header + category bar stay at the top while scrolling and shrink a little once the page is scrolled.
 * (The address/opening-hours strip above scrolls away.)
 */
function StickyDesktopNav() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    // Shrinks after 160px and grows back only near the top, so the size change itself can't make it flicker.
    const onScroll = () => setCompact((was) => (was ? window.scrollY > 40 : window.scrollY > 160));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className={`sticky top-0 z-40 hidden bg-white lg:block ${compact ? 'shadow-[0_4px_16px_rgb(16_24_40/0.08)]' : ''}`}>
      <DesktopHeader compact={compact} />
      <CategoryNav compact={compact} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile                                                              */
/* ------------------------------------------------------------------ */

export type MobileHeaderProps = {
  variant?: 'home' | 'back' | 'account';
  actions?: Array<'search' | 'cart' | 'wishlist' | 'bell'>;
  search?: string | false;
};

/** Delivery location in the phone header: pick a saved address (signed in) or see where we deliver. */
function MobileMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const close = () => onOpenChange(false);
  const categories = useCategories();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader><SheetTitle><Logo variant="mobile" className="h-11 w-auto" /></SheetTitle></SheetHeader>
        <nav className="mt-2 grid gap-1 px-2">
          {categories.map((c) => (
            <Link key={c.slug} onClick={close} to="/categories/$slug" params={{ slug: c.slug }} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium hover:bg-brand-50">
              <img src={c.side} alt="" className="size-8 object-contain" />{c.name}
            </Link>
          ))}
          <div className="my-2 border-t" />
          <Link onClick={close} to="/orders" className="rounded-lg px-3 py-2.5 font-semibold hover:bg-brand-50">Track Order</Link>
          <Link onClick={close} to="/account" className="rounded-lg px-3 py-2.5 font-semibold hover:bg-brand-50">My Account</Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MobileHeader({ variant = 'home', actions = ['wishlist', 'cart'], search = 'Search for groceries, snacks, baby products...' }: MobileHeaderProps) {
  const { count } = useCart();
  const wishlist = useWishlist();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-white px-4 pb-3 pt-3 lg:hidden">
      <div className="flex h-12 items-center gap-2">
        {variant === 'home' && <button aria-label="Open menu" onClick={() => setOpen(true)} className="-ml-1 p-1"><Menu className="size-6 text-ink" strokeWidth={1.8} /></button>}
        {variant === 'back' && <button aria-label="Go back" onClick={() => router.history.back()} className="-ml-1 p-1"><ChevronLeft className="size-6 text-ink" strokeWidth={1.8} /></button>}
        <Link to="/" className="shrink-0"><Logo variant="mobile" className="h-9 w-auto min-[400px]:h-10" /></Link>
        <div className="ml-auto flex items-center gap-3">
          <StoreButton compact className="text-[13.5px] min-[400px]:text-[14.5px]" />
          {actions.includes('search') && <Link to="/search" search={{ q: '' }} aria-label="Search"><Search className="size-6 text-ink" /></Link>}
          {actions.includes('wishlist') && <Link to="/wishlist" aria-label="Wishlist" className="relative"><Heart className="size-6 text-ink" strokeWidth={1.7} />{wishlist.count > 0 && <span className="cart-count">{wishlist.count}</span>}</Link>}
          {actions.includes('bell') && <NotificationBell />}
          {actions.includes('cart') && <Link to="/cart" aria-label="Cart" className="relative"><ShoppingCart className="size-6 text-ink" strokeWidth={1.7} /><span className="cart-count">{count}</span></Link>}
        </div>
      </div>
      {search && <SmartSearch variant="mobile" placeholder={search} />}
      {variant === 'home' && <MobileMenu open={open} onOpenChange={setOpen} />}
    </header>
  );
}

export function MobileNav({ variant = 'default' }: { variant?: 'default' | 'account' }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();
  const links = variant === 'account'
    ? ([['/', Home, 'Home'], ['/categories', LayoutGrid, 'Categories'], ['/search', Search, 'Search'], ['/cart', ShoppingCart, 'Cart'], ['/account', UserRound, 'Account']] as const)
    : ([['/', Home, 'Home'], ['/categories', LayoutGrid, 'Categories'], ['/search', Search, 'Search'], ['/orders', ShoppingBag, 'Orders'], ['/account', UserRound, 'Account']] as const);
  const isActive = (to: string) => (to === '/' ? path === '/' : path.startsWith(to) || (to === '/search' && path.startsWith('/products/')));
  const activeColor = variant === 'account' ? 'text-brand' : 'text-red';
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-line bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgb(16_24_40/0.06)] lg:hidden">
      <div className="grid grid-cols-5">
        {links.map(([to, Icon, label]) => {
          const active = isActive(to);
          return (
            <Link key={to} to={to} className={`relative flex h-[68px] flex-col items-center justify-center gap-1 text-[13px] ${active ? `${activeColor} font-semibold` : 'text-slate'}`}>
              <span className="relative">
                <Icon className={`size-6 ${active && variant === 'default' ? 'fill-red' : ''}`} strokeWidth={active && variant === 'default' ? 2.2 : 1.7} />
                {to === '/cart' && <span className="cart-count">{count}</span>}
              </span>
              {label}
              {active && variant === 'account' && <span className="absolute bottom-1 h-1 w-14 rounded-full bg-brand" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

const footerCols = {
  'Quick Links': [['Home', '/'], ['All Categories', '/categories'], ['All Products', '/products'], ['My Wishlist', '/wishlist'], ['Track Order', '/orders']],
  'Customer Service': [['Help Center', '/account/help'], ['Returns & Refunds', '/returns'], ['Shipping Information', '/shipping'], ['FAQs', '/account/help'], ['Contact Us', '/store-location']],
  'About Delight': [['Our Story', '/about'], ['Store Location', '/store-location'], ['Careers', '/careers'], ['Terms & Conditions', '/terms'], ['Privacy Policy', '/privacy']],
} as const;


/** App store badges, shown as "coming soon" until the apps are published. */
function AppBadges({ size }: { size: 'sm' | 'md' }) {
  return (
    <div className={size === 'md' ? 'mt-4 space-y-2' : 'mt-3 flex flex-wrap gap-2.5'}>
      {(['google-play', 'app-store'] as const).map((badge) => (
        <span key={badge} className="relative block w-fit" title="Coming soon">
          <img src={asset(badge)} alt={badge === 'google-play' ? 'Android app coming soon' : 'iPhone app coming soon'} className={`${size === 'md' ? 'h-11' : 'h-10'} w-auto opacity-45 grayscale`} />
          <span className="absolute -right-2 -top-2 rounded-full bg-red px-2 py-0.5 text-[10.5px] font-bold text-white shadow">Coming soon</span>
        </span>
      ))}
    </div>
  );
}

function MobileFooter({ socials }: { socials: ReadonlyArray<readonly [typeof Facebook, string, string]> }) {
  return (
    <div className="site-width py-8 lg:hidden">
      <Logo variant="footer" className="h-[52px] w-auto" />
      <p className="mt-3 text-[14px] leading-6 text-white/85">Your Local Shopping Mart<br />Tulsipur &amp; Ghorahi, Dang, Nepal</p>
      <div className="mt-4 flex gap-2.5">
        {socials.map(([Icon, href, name]) => <a key={name} href={href} target="_blank" rel="noreferrer" aria-label={name} className="grid size-9 place-items-center rounded-full bg-white text-footer"><Icon className="size-4" /></a>)}
      </div>

      <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-white/15 pt-6 sm:grid-cols-3">
        {Object.entries(footerCols).map(([title, links]) => (
          <div key={title}>
            <h3 className="text-[15.5px] font-bold">{title}</h3>
            <span className="mt-1.5 block h-0.5 w-8 bg-red" />
            <ul className="mt-3 space-y-2 text-[14px] text-white/80">
              {links.map(([label, to]) => <li key={label}><Link to={to as '/'} className="hover:text-white">{label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-7 border-t border-white/15 pt-6">
        <h3 className="text-[15.5px] font-bold">Download Our App</h3>
        <p className="text-[14px] text-white/80">Our Android and iPhone apps are coming soon.</p>
        <AppBadges size="sm" />
      </div>


      <div className="mt-7 space-y-1 border-t border-white/15 pt-5 text-[12.5px] text-white/70">
        <p>© 2024 Delight Shopping Mart Pvt. Ltd. All rights reserved.</p>
        <p className="flex items-center gap-1.5">Made with <Heart className="size-3.5 fill-red text-red" /> for a Happier Dang</p>
      </div>
    </div>
  );
}

export function StoreFooter() {
  // Only icons with a real page link are shown.
  const socials = ([[Facebook, STORE.socials.facebook, 'Facebook'], [Instagram, STORE.socials.instagram, 'Instagram'], [Youtube, STORE.socials.youtube, 'YouTube'], [Music2, STORE.socials.tiktok, 'TikTok'], [Linkedin, STORE.socials.linkedin, 'LinkedIn']] as const).filter(([, href]) => href);
  return (
    <footer className="bg-footer text-white standalone:hidden">
      <MobileFooter socials={socials} />
      <div className="hidden lg:block">
      <div className="site-width grid grid-cols-[1.35fr_0.85fr_1fr_1fr_1.5fr] py-9">
        <div className="border-r border-white/15 pr-8">
          <Logo variant="footer" className="h-[66px] w-auto" />
          <p className="mt-4 text-[14px] leading-6 text-white/85">Your Local Shopping Mart<br />Tulsipur &amp; Ghorahi, Dang, Nepal</p>
          <div className="mt-5 flex gap-3">
            {socials.map(([Icon, href, name]) => <a key={name} href={href} target="_blank" rel="noreferrer" aria-label={name} className="grid size-8 place-items-center rounded-full bg-white text-footer"><Icon className="size-4" /></a>)}
          </div>
          <p className="mt-5 text-[13px] text-white/55">Shop Local &nbsp;|&nbsp; Support Local &nbsp;|&nbsp; Grow Together</p>
        </div>
        {Object.entries(footerCols).map(([title, links]) => (
          <div key={title} className="pl-12">
            <h3 className="text-[17px] font-bold">{title}</h3>
            <ul className="mt-4 space-y-2 text-[15px] text-white/85">
              {links.map(([label, to]) => <li key={label}><Link to={to as '/'} className="hover:text-white">{label}</Link></li>)}
            </ul>
          </div>
        ))}
        <div className="flex gap-6 border-l border-white/15 pl-10">
          <div>
            <h3 className="text-[17px] font-bold">Download Our App</h3>
            <p className="mt-2 text-[15px] text-white/85">Android &amp; iPhone apps<br />are coming soon.</p>
            <AppBadges size="md" />
          </div>
        </div>
      </div>
      <div className="site-width flex items-center justify-between border-t border-white/15 py-5 text-[13px] text-white/85">
        <span>© 2024 Delight Shopping Mart Pvt. Ltd. All rights reserved.</span>
        <span className="flex items-center gap-2">Made with <Heart className="size-4 fill-red text-red" /> for a Happier Dang</span>
      </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Page wrapper                                                        */
/* ------------------------------------------------------------------ */

export function StorePage({ children, mobile, nav = 'default', hideMobileNav = false, appScreen = false }: { children: ReactNode; mobile?: MobileHeaderProps | false; nav?: 'default' | 'account'; hideMobileNav?: boolean; /** Full-screen page in the installed app (no website header). */ appScreen?: boolean }) {
  const { count } = useCart();
  return (
    <div className={`min-h-screen bg-white ${hideMobileNav ? '' : count ? 'pb-[150px] lg:pb-0' : 'pb-[84px] lg:pb-0'}`}>
      <TopBar />
      <StickyDesktopNav />
      {mobile !== false && (appScreen ? <div className="standalone:hidden"><MobileHeader {...mobile} /></div> : <MobileHeader {...mobile} />)}
      <main>{children}</main>
      <StoreFooter />
      {!hideMobileNav && <FloatingCart />}
      {!hideMobileNav && <MobileNav variant={nav} />}
    </div>
  );
}

/** Bell with the number of unread store messages (hidden when there are none). */
function NotificationBell() {
  const { user } = useAuth();
  const { data: unread = 0 } = useQuery({
    queryKey: ['unread-notifications', user?.id],
    enabled: Boolean(user),
    staleTime: 60_000,
    queryFn: async () => (await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).is('read_at', null)).count ?? 0,
  });
  return (
    <Link to="/account/notifications" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} className="relative">
      <Bell className="size-6 text-ink" strokeWidth={1.8} />
      {unread > 0 && <span className="cart-count">{unread}</span>}
    </Link>
  );
}

/** Phone-only "View cart" pill above the bottom menu while the cart has items. */
function FloatingCart() {
  const { count, subtotal, lines } = useCart();
  if (!count) return null;
  const last = lines[lines.length - 1]?.product;
  return (
    <Link to="/cart" className="fixed inset-x-3 bottom-[76px] z-40 flex items-center gap-3 rounded-2xl bg-brand px-3 py-2.5 text-white shadow-[0_8px_24px_rgb(8_112_76/0.35)] lg:hidden">
      {last && <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white"><img src={last.image} alt="" className={last.art ? 'size-6' : 'size-full object-contain'} /></span>}
      <span className="min-w-0 flex-1 leading-tight"><b className="block text-[14px] font-bold">{count} item{count === 1 ? '' : 's'} · NPR {subtotal.toLocaleString('en-US')}</b><span className="text-[11.5px] opacity-85">Delivery in 15–20 minutes</span></span>
      <span className="flex items-center gap-1 text-[14.5px] font-bold">View Cart <ChevronRight className="size-4" /></span>
    </Link>
  );
}

