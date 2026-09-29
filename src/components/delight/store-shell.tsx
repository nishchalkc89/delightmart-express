import { Link, useNavigate, useRouter, useRouterState } from '@tanstack/react-router';
import {
  Bell, ChevronDown, ChevronLeft, Facebook, Heart, Home, Instagram, LayoutGrid, Linkedin, MapPin,
  Menu, Music2, ScanLine, Search, ShoppingBag, ShoppingCart, UserRound, Youtube,
} from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Logo } from './logo';
import { useCart } from './cart-context';
import { useAuth } from './auth-context';
import { categories } from '@/services/catalog';
import { asset } from '@/lib/assets';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

/* ------------------------------------------------------------------ */
/* Desktop                                                             */
/* ------------------------------------------------------------------ */

function TopBar() {
  return (
    <div className="hidden bg-[#f1f8f6] text-[13px] text-ink lg:block">
      <div className="site-width flex h-9 items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><MapPin className="size-4 fill-ink text-[#f1f8f6]" />Tulsipur, Dang</span>
          <span className="h-4 w-px bg-ink/40" />
          <span>Open Daily: 7 AM - 9 PM</span>
        </div>
        <div className="flex items-center gap-10">
          <nav className="flex items-center gap-3">
            <Link to="/products" className="hover:text-brand">Shop Local</Link><span className="text-ink/40">|</span>
            <a href="mailto:info@delightmart.com.np" className="hover:text-brand">Help</a><span className="text-ink/40">|</span>
            <Link to="/orders" className="hover:text-brand">Track Order</Link><span className="text-ink/40">|</span>
            <a href="tel:+9779841234567" className="hover:text-brand">Contact</a>
          </nav>
          <div className="flex items-center gap-4 text-navy">
            <a href="https://facebook.com" aria-label="Facebook"><Facebook className="size-[18px] fill-navy" strokeWidth={0} /></a>
            <a href="https://instagram.com" aria-label="Instagram"><Instagram className="size-[18px]" /></a>
            <a href="https://youtube.com" aria-label="YouTube"><Youtube className="size-5 fill-navy text-[#f1f8f6]" /></a>
          </div>
          <span className="flex items-center gap-1.5 font-semibold text-brand">
            <span className="text-brand">❖</span> Happier Tulsipur <Heart className="size-5 fill-red text-red" />
          </span>
        </div>
      </div>
    </div>
  );
}

function DesktopSearch() {
  const nav = useNavigate();
  const [query, setQuery] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault();
    void nav({ to: '/search', search: { q: query.trim() } });
  }
  return (
    <form onSubmit={submit} className="flex h-[48px] w-full max-w-[720px] overflow-hidden rounded-lg border border-[#dfe3e8] bg-white shadow-[0_1px_2px_rgb(16_24_40/0.04)]">
      <label className="flex flex-1 items-center gap-3 pl-5">
        <Search className="size-5 text-ink" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-slate" placeholder="Search for groceries, fashion, baby products, stationery..." aria-label="Search products" />
      </label>
      <button className="w-[112px] rounded-lg bg-red text-[16px] font-semibold text-white hover:bg-red/90">Search</button>
    </form>
  );
}

function HeaderAction({ to, icon: Icon, label, count }: { to: string; icon: typeof Heart; label: string; count?: number }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-0.5 text-[13px] text-ink hover:text-brand">
      <span className="relative">
        <Icon className="size-6" strokeWidth={1.7} />
        {count !== undefined && <span className="cart-count !-right-2 !-top-2 !size-5">{count}</span>}
      </span>
      {label}
    </Link>
  );
}

function DesktopHeader() {
  const { count } = useCart();
  const { user } = useAuth();
  return (
    <header className="hidden bg-white lg:block">
      <div className="site-width flex h-[92px] items-center justify-between gap-10">
        <Link to="/" aria-label="Delight Shopping Mart home"><Logo className="h-[60px] w-auto" /></Link>
        <DesktopSearch />
        <div className="flex items-center gap-9 pr-2">
          <HeaderAction to={user ? '/account' : '/login'} icon={UserRound} label="Account" />
          <HeaderAction to="/account" icon={Heart} label="Wishlist" count={0} />
          <HeaderAction to="/cart" icon={ShoppingCart} label="Cart" count={count} />
        </div>
      </div>
    </header>
  );
}

function CategoryNav() {
  return (
    <nav className="hidden bg-white lg:block">
      <div className="site-width flex h-[72px] items-stretch border-b border-line pb-1.5">
        <Link to="/categories" className="my-auto mr-5 flex h-[46px] shrink-0 items-center gap-2.5 rounded-lg bg-brand px-5 text-[15px] font-semibold text-white shadow-sm hover:bg-brand-dark">
          <Menu className="size-5" /> All Categories <ChevronDown className="size-4" />
        </Link>
        <div className="flex flex-1 items-stretch justify-between">
          {categories.map((c, i) => (
            <Link key={c.slug} to="/categories/$slug" params={{ slug: c.slug }} className={`group flex flex-1 flex-col items-center justify-center gap-1 px-2 text-[13.5px] text-ink hover:text-brand ${i ? 'border-l border-line' : ''}`}>
              <img src={c.icon} alt="" className="size-8 object-contain transition-transform group-hover:-translate-y-0.5" />
              <span className="whitespace-nowrap">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
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

function Location() {
  return (
    <button className="flex items-center gap-1 whitespace-nowrap text-[13.5px] font-medium text-ink min-[400px]:text-[14.5px]">
      <MapPin className="size-[18px] shrink-0 fill-ink text-white" /> Tulsipur, Dang <ChevronDown className="size-4 shrink-0 text-brand" />
    </button>
  );
}

function MobileSearch({ placeholder }: { placeholder: string }) {
  const nav = useNavigate();
  const [query, setQuery] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); void nav({ to: '/search', search: { q: query.trim() } }); }} className="mt-3 flex h-12 items-center gap-3 rounded-xl border border-[#dde6ea] bg-[#f5fbfc] px-4">
      <Search className="size-5 text-ink" />
      <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-slate" placeholder={placeholder} aria-label="Search" />
      <ScanLine className="size-5 text-ink" />
    </form>
  );
}

function MobileMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const close = () => onOpenChange(false);
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

function MobileHeader({ variant = 'home', actions = ['wishlist', 'cart'], search = 'Search for groceries, fashion, baby products...' }: MobileHeaderProps) {
  const { count } = useCart();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-white px-4 pb-3 pt-3 lg:hidden">
      <div className="flex h-12 items-center gap-2">
        {variant === 'home' && <button aria-label="Open menu" onClick={() => setOpen(true)} className="-ml-1 p-1"><Menu className="size-6 text-ink" strokeWidth={1.8} /></button>}
        {variant === 'back' && <button aria-label="Go back" onClick={() => router.history.back()} className="-ml-1 p-1"><ChevronLeft className="size-6 text-ink" strokeWidth={1.8} /></button>}
        <Link to="/" className="shrink-0"><Logo variant="mobile" className="h-9 w-auto min-[400px]:h-10" /></Link>
        <div className="ml-auto flex items-center gap-3">
          <Location />
          {actions.includes('search') && <Link to="/search" search={{ q: '' }} aria-label="Search"><Search className="size-6 text-ink" /></Link>}
          {actions.includes('wishlist') && <Link to="/account" aria-label="Wishlist" className="relative"><Heart className="size-6 text-ink" strokeWidth={1.7} /><span className="cart-count">0</span></Link>}
          {actions.includes('bell') && <Link to="/account/notifications" aria-label="Notifications" className="relative"><Bell className="size-6 text-ink" strokeWidth={1.8} /><span className="cart-count">3</span></Link>}
          {actions.includes('cart') && <Link to="/cart" aria-label="Cart" className="relative"><ShoppingCart className="size-6 text-ink" strokeWidth={1.7} /><span className="cart-count">{count}</span></Link>}
        </div>
      </div>
      {search && <MobileSearch placeholder={search} />}
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
  'Quick Links': [['Home', '/'], ['All Categories', '/categories'], ['Offers & Deals', '/categories'], ['New Arrivals', '/products'], ['Track Order', '/orders']],
  'Customer Service': [['Help Center', '/account'], ['Returns & Refunds', '/account/orders'], ['Shipping Information', '/checkout'], ['FAQs', '/account'], ['Contact Us', '/account']],
  'About Delight': [['Our Story', '/'], ['Store Location', '/'], ['Careers', '/'], ['Terms & Conditions', '/'], ['Privacy Policy', '/']],
} as const;

function MobileFooter({ socials }: { socials: Array<typeof Facebook> }) {
  return (
    <div className="site-width py-8 lg:hidden">
      <Logo variant="footer" className="h-[52px] w-auto" />
      <p className="mt-3 text-[14px] leading-6 text-white/85">Your Local Shopping Mart<br />Tulsipur, Dang, Nepal</p>
      <a href="tel:+9779841234567" className="text-[14px] text-white/85">+977 9841234567</a>
      <div className="mt-4 flex gap-2.5">
        {socials.map((Icon, i) => <a key={i} href="#" aria-label="Social link" className="grid size-9 place-items-center rounded-full bg-white text-footer"><Icon className="size-4" /></a>)}
      </div>

      <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-white/15 pt-6 sm:grid-cols-3">
        {Object.entries(footerCols).map(([title, links]) => (
          <div key={title}>
            <h3 className="text-[15.5px] font-bold">{title}</h3>
            <span className="mt-1.5 block h-0.5 w-8 bg-red" />
            <ul className="mt-3 space-y-2 text-[14px] text-white/80">
              {links.map(([label, to]) => <li key={label}><Link to={to} className="hover:text-white">{label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-7 border-t border-white/15 pt-6">
        <h3 className="text-[15.5px] font-bold">Download Our App</h3>
        <p className="text-[14px] text-white/80">Shop Anytime, Anywhere</p>
        <div className="mt-3 flex gap-2.5">
          <img src={asset('google-play')} alt="Get it on Google Play" className="h-10 w-auto" />
          <img src={asset('app-store')} alt="Download on the App Store" className="h-10 w-auto" />
        </div>
      </div>

      <div className="mt-7 space-y-1 border-t border-white/15 pt-5 text-[12.5px] text-white/70">
        <p>© 2024 Delight Shopping Mart Pvt. Ltd. All rights reserved.</p>
        <p className="flex items-center gap-1.5">Made with <Heart className="size-3.5 fill-red text-red" /> for a Happier Tulsipur</p>
      </div>
    </div>
  );
}

export function StoreFooter() {
  const socials = [Facebook, Instagram, Youtube, Music2, Linkedin];
  return (
    <footer className="bg-footer text-white">
      <MobileFooter socials={socials} />
      <div className="hidden lg:block">
      <div className="site-width grid grid-cols-[1.35fr_0.85fr_1fr_1fr_1.5fr] py-9">
        <div className="border-r border-white/15 pr-8">
          <Logo variant="footer" className="h-[66px] w-auto" />
          <p className="mt-4 text-[14px] leading-6 text-white/85">Your Local Shopping Mart<br />Tulsipur, Dang, Nepal</p>
          <div className="mt-5 flex gap-3">
            {socials.map((Icon, i) => <a key={i} href="#" aria-label="Social link" className="grid size-8 place-items-center rounded-full bg-white text-footer"><Icon className="size-4" /></a>)}
          </div>
          <p className="mt-5 text-[13px] text-white/55">Shop Local &nbsp;|&nbsp; Support Local &nbsp;|&nbsp; Grow Together</p>
        </div>
        {Object.entries(footerCols).map(([title, links]) => (
          <div key={title} className="pl-12">
            <h3 className="text-[17px] font-bold">{title}</h3>
            <ul className="mt-4 space-y-2 text-[15px] text-white/85">
              {links.map(([label, to]) => <li key={label}><Link to={to} className="hover:text-white">{label}</Link></li>)}
            </ul>
          </div>
        ))}
        <div className="flex gap-6 border-l border-white/15 pl-10">
          <div>
            <h3 className="text-[17px] font-bold">Download Our App</h3>
            <p className="mt-2 text-[15px] text-white/85">Shop Anytime, Anywhere</p>
            <img src={asset('google-play')} alt="Get it on Google Play" className="mt-4 h-11 w-auto" />
            <img src={asset('app-store')} alt="Download on the App Store" className="mt-2 h-11 w-auto" />
          </div>
          <div className="pt-3 text-center">
            <img src={asset('qr')} alt="QR code to download the app" className="size-[88px] rounded bg-white" />
            <p className="mt-2 text-[12px] text-white/85">Scan to Download</p>
          </div>
        </div>
      </div>
      <div className="site-width flex items-center justify-between border-t border-white/15 py-5 text-[13px] text-white/85">
        <span>© 2024 Delight Shopping Mart Pvt. Ltd. All rights reserved.</span>
        <span className="flex items-center gap-2">Made with <Heart className="size-4 fill-red text-red" /> for a Happier Tulsipur</span>
      </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Page wrapper                                                        */
/* ------------------------------------------------------------------ */

export function StorePage({ children, mobile, nav = 'default', hideMobileNav = false }: { children: ReactNode; mobile?: MobileHeaderProps | false; nav?: 'default' | 'account'; hideMobileNav?: boolean }) {
  return (
    <div className={`min-h-screen bg-white ${hideMobileNav ? '' : 'pb-[84px] lg:pb-0'}`}>
      <TopBar />
      <DesktopHeader />
      <CategoryNav />
      {mobile !== false && <MobileHeader {...mobile} />}
      <main>{children}</main>
      <StoreFooter />
      {!hideMobileNav && <MobileNav variant={nav} />}
    </div>
  );
}

