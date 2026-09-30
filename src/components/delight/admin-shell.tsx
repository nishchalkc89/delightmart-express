import { Link, Outlet, useNavigate, useRouter, useRouterState } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  BadgePercent, ChartColumn, LogOut, Mail, ChevronDown, ClipboardList, Folder, Images, LayoutDashboard, MapPin, Menu, Package,
  Search, Settings, Star, Store, Truck, UserRound, UsersRound, WalletCards, X,
} from 'lucide-react';
import { Logo } from './logo';
import { useAuth } from './auth-context';
import { supabase } from '@/services/supabase';
import { useStaffName } from '@/services/admin';
import { AdminScopeProvider, fetchBranches, fetchStaffAccess, saveScope, savedScope, setAdminScopeValue, type AdminScope, type AdminScopeValue, type StaffAccess } from '@/services/admin-scope';
import type { Branch } from '@/lib/branch';
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

/** Header search: order numbers and phone numbers open Orders, anything else opens Products (or the page you are on). */
function searchTarget(path: string, q: string): { to: '/admin/orders' | '/admin/products' | '/admin/inventory'; search: { q: string } } {
  const orderLike = /^#?dlt[-\s]?\d/i.test(q) || /^\+?[\d\s-]{7,}$/.test(q);
  if (orderLike || path === '/admin/orders') return { to: '/admin/orders', search: { q } };
  if (path === '/admin/inventory') return { to: '/admin/inventory', search: { q } };
  return { to: '/admin/products', search: { q } };
}

function HeaderSearch({ path }: { path: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const hint = path === '/admin/orders' ? 'Search orders by number, customer or phone...' : path === '/admin/inventory' ? 'Search stock by product name or SKU...' : 'Search products, SKUs or order numbers (DLT-…)';
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); const v = q.trim(); if (v) void navigate(searchTarget(path, v)); }} className="hidden h-[42px] max-w-[530px] flex-1 items-center gap-3 rounded-lg border border-line bg-[#f7f9fb] px-4 focus-within:border-[#077a52] md:flex">
      <Search className="size-5 text-slate" />
      <input value={q} onChange={(e) => setQ(e.target.value)} className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-slate" placeholder={hint} aria-label="Search the admin" />
      {q && <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="text-slate hover:text-navy"><X className="size-4" /></button>}
    </form>
  );
}

function Sidebar({ path, onNavigate, pending }: { path: string; onNavigate?: () => void; pending: number }) {
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
              {label === 'Orders' && pending > 0 && <span title="New orders waiting" className="grid h-[22px] min-w-[22px] place-items-center rounded-full bg-[#e3101a] px-1.5 text-[12px] font-semibold">{pending}</span>}
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const { user, loading, signOut } = useAuth();
  const staffName = useStaffName();
  const [access, setAccess] = useState<StaffAccess | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [checking, setChecking] = useState(true);
  const [pending, setPending] = useState(0);
  const [scope, setScopeState] = useState<AdminScope>('all');
  const role = access?.role ?? null;

  // Admin always needs a signed-in staff account (the database enforces the same rules).
  useEffect(() => {
    if (loading) return;
    if (!user) { router.history.replace(`/admin/login?redirect=${encodeURIComponent(path)}`); return; }
    setChecking(true);
    void Promise.all([fetchStaffAccess(user.id), fetchBranches()]).then(([a, b]) => {
      setAccess(a);
      setBranches(b);
      const ids = a.isSuper ? b.map((x) => x.id) : a.branchIds;
      const saved = savedScope();
      setScopeState(saved && (ids.includes(saved) || (saved === 'all' && a.isSuper)) ? saved : a.isSuper ? 'all' : ids[0] ?? 'all');
    }).finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const allowed = useMemo(() => (access?.isSuper ? branches : branches.filter((b) => access?.branchIds.includes(b.id))), [access, branches]);
  // Loaders read the scope when pages mount, so set it before rendering them.
  setAdminScopeValue(scope, allowed.map((b) => b.id));
  const scopeValue = useMemo<AdminScopeValue>(() => ({
    branches, allowed, isSuper: Boolean(access?.isSuper), role: access?.role ?? null, scope,
    setScope: (s) => { saveScope(s); setScopeState(s); },
    stockBranch: scope === 'all' ? (allowed.length === 1 ? allowed[0]!.id : null) : scope,
    label: scope === 'all' ? 'All stores' : `${branches.find((b) => b.id === scope)?.city ?? scope} store`,
  }), [branches, allowed, access, scope]);

  // Number of new orders waiting to be confirmed (shown next to Orders), for the stores in view.
  useEffect(() => {
    if (!role) return;
    const ids = scope === 'all' ? allowed.map((b) => b.id) : [scope];
    const load = () => void supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'PENDING').in('branch_id', ids).then(({ count }) => setPending(count ?? 0));
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [role, path, scope, allowed]);

  async function logout() {
    await signOut();
    router.history.replace('/admin/login');
  }

  if (loading || checking || !user) return <div className="grid min-h-screen place-items-center bg-page text-slate">Checking access…</div>;
  if (!role) {
    return (
      <div className="grid min-h-screen place-items-center bg-page p-6">
        <div className="max-w-md rounded-2xl border border-line bg-white p-8 text-center">
          <Logo className="mx-auto h-16 w-auto" />
          <h1 className="mt-5 text-[24px] font-extrabold text-navy">No admin access</h1>
          <p className="mt-2 text-slate">You are signed in as {user.email}, which is a customer account. Sign in with the store admin account.</p>
          <button onClick={() => void logout()} className="mt-5 inline-flex h-11 items-center rounded-lg bg-[#077a52] px-6 font-semibold text-white">Sign in as admin</button>
        </div>
      </div>
    );
  }

  if (!allowed.length) {
    return (
      <div className="grid min-h-screen place-items-center bg-page p-6">
        <div className="max-w-md rounded-2xl border border-line bg-white p-8 text-center">
          <Logo className="mx-auto h-16 w-auto" />
          <h1 className="mt-5 text-[24px] font-extrabold text-navy">No store assigned</h1>
          <p className="mt-2 text-slate">{user.email} is a staff account but is not linked to a store yet. Ask the owner to choose your store in Users &amp; Roles.</p>
          <button onClick={() => void logout()} className="mt-5 inline-flex h-11 items-center rounded-lg bg-[#077a52] px-6 font-semibold text-white">Sign out</button>
        </div>
      </div>
    );
  }

  const name = staffName;
  const roleWords = role.split('_').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ');
  const roleLabel = access?.isSuper ? 'Owner · All stores' : `${allowed.map((b) => b.city).join(' & ')} · ${roleWords}`;
  return (
    <AdminScopeProvider value={scopeValue}>
    <div className="min-h-screen bg-page">
      {open && <div className="fixed inset-0 z-40 bg-navy/50 xl:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[243px] transition-transform xl:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar path={path} onNavigate={() => setOpen(false)} pending={pending} />
        <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-2 top-2 p-1 text-white xl:hidden"><X className="size-5" /></button>
      </aside>
      <div className="xl:pl-[243px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-5 bg-white px-5 shadow-[0_1px_0_#eef1f4]">
          <button aria-label="Toggle menu" onClick={() => setOpen(!open)} className="text-navy"><Menu className="size-7" strokeWidth={1.7} /></button>
          <HeaderSearch key={path} path={path} />
          <div className="ml-auto flex items-center gap-5">
            <StoreSwitcher value={scopeValue} />
            <Link to="/" target="_blank" className="hidden h-[42px] items-center gap-2.5 rounded-lg border border-line px-4 text-[15px] text-navy sm:flex"><MapPin className="size-5 fill-[#0a8a5b] text-white" /> View Store</Link>
            <div className="relative">
              <button onClick={() => setMenu(!menu)} aria-expanded={menu} className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-[#077a52] text-[16px] font-bold text-white">{name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                <span className="hidden text-left leading-5 sm:block"><b className="block text-[15px] font-semibold text-navy">{name}</b><span className="text-[14px] text-slate">{roleLabel}</span></span>
                <ChevronDown className="size-4 text-slate" />
              </button>
              {menu && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-xl border border-line bg-white shadow-lg" onMouseLeave={() => setMenu(false)}>
                  <p className="border-b border-line px-4 py-3 text-[13px] text-slate">Signed in as<br /><b className="text-navy">{user.email}</b></p>
                  <Link to="/admin/settings" onClick={() => setMenu(false)} className="block px-4 py-2.5 text-[14px] text-navy hover:bg-page">Settings</Link>
                  <button onClick={() => void logout()} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[14px] font-semibold text-[#e3101a] hover:bg-page"><LogOut className="size-4" /> Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main key={scope} className="px-4 pb-8 pt-4"><Outlet /></main>
      </div>
    </div>
    </AdminScopeProvider>
  );
}

/** Store switcher for the owner (All stores / each store); a fixed label for store staff. */
function StoreSwitcher({ value }: { value: AdminScopeValue }) {
  const { allowed, isSuper, scope, setScope } = value;
  const options: Array<[string, string]> = [...(isSuper || allowed.length > 1 ? [['all', 'All stores'] as [string, string]] : []), ...allowed.map((b): [string, string] => [b.id, `${b.city} store`])];
  if (options.length === 1) {
    return <span className="flex h-[42px] items-center gap-2 rounded-lg bg-[#e3f6ec] px-4 text-[14px] font-semibold text-[#077a52]"><Store className="size-4" /> {allowed[0]!.city} store</span>;
  }
  return (
    <label className="relative flex h-[42px] items-center rounded-lg border border-[#0a8a5b] bg-[#f0fbf5] text-[14px] font-semibold text-[#077a52]">
      <Store className="pointer-events-none absolute left-3 size-4" />
      <select aria-label="Store" value={scope} onChange={(e) => setScope(e.target.value)} className="h-full cursor-pointer appearance-none rounded-lg bg-transparent pl-9 pr-9 outline-none">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4" />
    </label>
  );
}
