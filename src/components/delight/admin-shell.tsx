import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  BadgePercent, Bell, ChartColumn, Mail, ChevronDown, ClipboardList, Folder, Images, LayoutDashboard, MapPin, Menu, Package,
  Search, Settings, Star, Store, Truck, UserRound, UsersRound, WalletCards, X,
} from 'lucide-react';
import { Logo } from './logo';
import { useAuth } from './auth-context';
import { supabase } from '@/services/supabase';
import { asset } from '@/lib/assets';

const nav = [
  ['/admin', LayoutDashboard, 'Dashboard'],
  ['/admin/orders', ClipboardList, 'Orders'],
  ['/admin/products', Package, 'Products'],
  ['/admin/categories', Folder, 'Categories'],
  ['/admin/inventory', Store, 'Inventory'],
  ['/admin/customers', UserRound, 'Customers'],
  ['/admin/offers', BadgePercent, 'Offers & Coupons'],
  ['/admin/banners', Images, 'Banners & Content'],
  ['/admin/delivery', Truck, 'Delivery Management'],
  ['/admin/payments', WalletCards, 'Payments'],
  ['/admin/reviews', Star, 'Reviews'],
  ['/admin/subscribers', Mail, 'Subscribers'],
  ['/admin/reports', ChartColumn, 'Reports'],
  ['/admin/users', UsersRound, 'Users & Roles'],
  ['/admin/settings', Settings, 'Settings'],
] as const;

const searchHints: Record<string, string> = {
  '/admin': 'Search orders, products, customers...',
  '/admin/orders': 'Search orders, customers, products...',
  '/admin/reports': 'Search orders, customers, products, reports...',
  '/admin/delivery': 'Search orders, customers, products, deliveries...',
  '/admin/payments': 'Search orders, customers, products, payments...',
  '/admin/users': 'Search users, orders, products...',
  '/admin/settings': 'Search settings, store, orders, users...',
};

function Sidebar({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#01352a_0%,#013328_60%,#002e24_100%)] text-white">
      <div className="px-5 pb-4 pt-3"><Logo variant="admin" className="h-[70px] w-auto" /></div>
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 no-scrollbar">
        {nav.map(([to, Icon, label]) => {
          const active = to === '/admin' ? path === '/admin' || path === '/admin/' : path.startsWith(to);
          return (
            <Link key={to} to={to} onClick={onNavigate} className={`flex h-[46px] items-center gap-3.5 whitespace-nowrap rounded-lg px-3.5 text-[15px] transition-colors ${active ? 'bg-[#006147] shadow-[0_2px_8px_rgb(0_0_0/0.18)]' : 'text-white/95 hover:bg-white/8'}`}>
              <Icon className="size-[22px]" strokeWidth={1.6} />
              <span className="flex-1">{label}</span>
              {label === 'Orders' && <span className="grid h-[22px] min-w-[22px] place-items-center rounded-full bg-[#e3101a] px-1.5 text-[12px] font-semibold">12</span>}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 mt-4 rounded-xl bg-[#002a21] p-4">
        <b className="text-[15px] font-semibold">Delight Shopping Mart</b>
        <div className="mt-2 flex items-center gap-3 text-[14px] leading-5 text-white/90">
          <img src={asset('leaf')} alt="" className="size-8 rounded-full" />
          <span>Better Products<br />Happier Days</span>
        </div>
        <p className="mt-4 text-[13px] text-white/80">Version 1.0.0</p>
      </div>
    </div>
  );
}

export function AdminShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { user, loading, displayName } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    // Local development preview: the admin UI is viewable without a staff account.
    // Production access is still enforced here and by Supabase RLS.
    if (import.meta.env.DEV) { setAllowed(true); setChecking(false); return; }
    if (!user) { setAllowed(false); setChecking(false); return; }
    void supabase.from('user_roles').select('role').eq('user_id', user.id).then(({ data }) => {
      setAllowed(Boolean(data?.some((row) => row.role !== 'CUSTOMER')));
      setChecking(false);
    });
  }, [user, loading]);

  if (checking || loading) return <div className="grid min-h-screen place-items-center bg-page text-slate">Checking access…</div>;
  if (!allowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-page p-6">
        <div className="max-w-md rounded-2xl border border-line bg-white p-8 text-center">
          <Logo className="mx-auto h-16 w-auto" />
          <h1 className="mt-5 text-[24px] font-extrabold text-navy">Staff access required</h1>
          <p className="mt-2 text-slate">Sign in with an authorized store account to open management screens.</p>
          <Link to="/login" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[#077a52] px-6 font-semibold text-white">Sign In</Link>
        </div>
      </div>
    );
  }

  const name = user ? displayName : 'Nishchal Kc';
  return (
    <div className="min-h-screen bg-page">
      {open && <div className="fixed inset-0 z-40 bg-navy/50 xl:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[243px] transition-transform xl:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar path={path} onNavigate={() => setOpen(false)} />
        <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-2 top-2 p-1 text-white xl:hidden"><X className="size-5" /></button>
      </aside>
      <div className="xl:pl-[243px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-5 bg-white px-5 shadow-[0_1px_0_#eef1f4]">
          <button aria-label="Toggle menu" onClick={() => setOpen(!open)} className="text-navy"><Menu className="size-7" strokeWidth={1.7} /></button>
          <label className="hidden h-[42px] max-w-[530px] flex-1 items-center gap-3 rounded-lg border border-line bg-[#f7f9fb] px-4 md:flex">
            <Search className="size-5 text-slate" />
            <input className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-slate" placeholder={searchHints[path] ?? 'Search products, orders, customers...'} aria-label="Search" />
          </label>
          <div className="ml-auto flex items-center gap-7">
            <button className="flex h-[42px] items-center gap-2.5 rounded-lg border border-line px-4 text-[15px] text-navy"><MapPin className="size-5 fill-[#0a8a5b] text-white" /> Tulsipur Store <ChevronDown className="ml-2 size-4 text-slate" /></button>
            <button aria-label="Notifications" className="relative text-navy"><Bell className="size-6" strokeWidth={1.7} /><span className="absolute -right-1.5 -top-1.5 grid size-[18px] place-items-center rounded-full bg-[#e3101a] text-[11px] font-semibold text-white">3</span></button>
            <button className="flex items-center gap-3">
              <img src={asset('av-nishchal')} alt="" className="size-11 rounded-full object-cover" />
              <span className="hidden text-left leading-5 sm:block"><b className="block text-[15px] font-semibold text-navy">{name}</b><span className="text-[14px] text-slate">Super Admin</span></span>
              <ChevronDown className="size-4 text-slate" />
            </button>
          </div>
        </header>
        <main className="px-4 pb-8 pt-4"><Outlet /></main>
      </div>
    </div>
  );
}
