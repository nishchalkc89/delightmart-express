import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  Bell, Camera, ChevronRight, CircleHelp, Clock, Crown, FileText, Heart, LogOut, MapPin, Package, Pencil,
  RotateCcw, Settings, ShieldCheck, Star, Tag, UserRound, Wallet, CreditCard,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/delight/auth-context';
import { getMyOrders } from '@/services/orders';
import { supabase } from '@/services/supabase';

export const Route = createFileRoute('/account/')({
  head: () => ({ meta: [{ title: 'My Account — Delight Shopping Mart' }, { name: 'description', content: 'Your Delight shopping account and orders.' }, { property: 'og:title', content: 'My Account — Delight' }, { property: 'og:description', content: 'Manage your orders and addresses.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const menu = [
  [MapPin, 'Manage Addresses', '/account/addresses'],
  [UserRound, 'Personal Information', '/account/profile'],
  [CreditCard, 'Payment Methods', '/account/payments'],
  [Bell, 'Notifications', '/account/notifications'],
  [Tag, 'Offers & Coupons', '/account/offers'],
  [CircleHelp, 'Help & Support', '/account/help'],
  [ShieldCheck, 'Privacy & Security', '/account/security'],
  [Settings, 'App Settings', '/account/settings'],
] as const;

function Page() {
  const { user, displayName, signOut } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState(0);
  const [addresses, setAddresses] = useState(0);

  useEffect(() => {
    if (!user) return;
    void getMyOrders(user.id).then((o) => setOrders(o.length)).catch(() => undefined);
    void supabase.from('addresses').select('id', { count: 'exact', head: true }).eq('user_id', user.id).then(({ count }) => setAddresses(count ?? 0));
  }, [user]);

  const avatar = user?.user_metadata['avatar_url'] as string | undefined;
  const phone = user?.user_metadata['phone'] as string | undefined;
  const initials = displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  async function logout() {
    await signOut();
    void nav({ to: '/login', replace: true });
  }

  const stats = [
    [FileText, String(orders), 'Total Orders'],
    [Heart, '0', 'Saved Items'],
    [MapPin, String(addresses), 'Saved Addresses'],
    [Wallet, 'NPR 0', 'Wallet Balance'],
  ] as const;

  return (
    <div className="mx-auto max-w-[860px] px-4 pb-6 pt-1 lg:pt-8">
      {/* Profile card */}
      <section className="overflow-hidden rounded-2xl border border-line">
        <div className="flex items-center gap-4 bg-[#f0faf5] px-4 py-4 lg:px-6 lg:py-5">
          <div className="relative shrink-0">
            {avatar
              ? <img src={avatar} alt="" className="size-[76px] rounded-full object-cover lg:size-[96px]" />
              : <span className="grid size-[76px] place-items-center rounded-full bg-brand text-[26px] font-bold text-white lg:size-[96px] lg:text-[32px]">{user ? initials : <UserRound className="size-9" />}</span>}
            <span className="absolute -bottom-0.5 -right-0.5 grid size-7 place-items-center rounded-full border-2 border-white bg-white shadow"><Camera className="size-4 text-brand" /></span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[22px] font-extrabold text-navy lg:text-[28px]">{user ? displayName : 'Welcome!'}</h1>
            {user ? (
              <>
                {phone && <p className="text-[15px] text-slate lg:text-[17px]">{phone}</p>}
                <p className="truncate text-[15px] text-slate lg:text-[17px]">{user.email}</p>
              </>
            ) : <p className="text-[14px] text-slate">Sign in to see your orders and saved items</p>}
          </div>
          {user
            ? <Link to="/account/profile" className="flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-[#d8f1e4] px-3 py-2 text-[14px] font-medium text-brand lg:px-4 lg:text-[16px]"><Pencil className="size-4" /> Edit Profile</Link>
            : <Link to="/login" className="shrink-0 rounded-lg bg-brand px-4 py-2 text-[14px] font-semibold text-white">Sign In</Link>}
        </div>
        <div className="grid grid-cols-4 bg-white py-3.5">
          {stats.map(([Icon, value, label], i) => (
            <div key={label} className={`flex flex-col items-center gap-1 text-center ${i < 3 ? 'border-r border-line' : ''}`}>
              <Icon className="size-6 text-brand" strokeWidth={1.8} />
              <b className="text-[16px] font-bold text-navy lg:text-[18px]">{value}</b>
              <span className="text-[12px] leading-tight text-slate lg:text-[14px]">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Delight Plus */}
      <section className="mt-3.5 flex items-center gap-3 rounded-2xl border border-[#f6e7b8] bg-[#fffcf1] px-4 py-3.5 lg:px-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#fdeec0]"><Crown className="size-6 fill-[#f5b40b] text-[#f5b40b]" /></span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2"><b className="text-[18px] font-extrabold text-navy">Delight Plus</b><span className="rounded-md bg-[#fde9a8] px-2 py-0.5 text-[11px] font-semibold text-[#7a5a00]">New</span></p>
          <p className="text-[13px] leading-snug text-slate">Get exclusive offers, free delivery and more!</p>
        </div>
        <Link to="/account/offers" className="shrink-0 rounded-lg bg-[#dcf2e6] px-4 py-2 text-[15px] font-semibold text-brand">Explore</Link>
      </section>

      {/* My Orders */}
      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-[20px] font-extrabold text-navy lg:text-[22px]">My Orders</h2>
        <Link to="/account/orders" className="flex items-center gap-1 text-[15px] font-medium text-brand">View All <ChevronRight className="size-4" /></Link>
      </div>
      <section className="mt-2.5 grid grid-cols-4 rounded-2xl border border-line bg-white py-4">
        {([[Package, 'Current Order', 'Track your order', '/orders'], [Clock, 'Order History', 'View past orders', '/account/orders'], [RotateCcw, 'Reorder', 'Buy again', '/products'], [Star, 'Reviews', 'Rate products', '/account/orders']] as const).map(([Icon, a, b, to], i) => (
          <Link key={a} to={to} className={`flex flex-col items-center gap-1 px-1 text-center ${i < 3 ? 'border-r border-line' : ''}`}>
            <Icon className="size-7 text-brand" strokeWidth={1.7} />
            <b className="mt-1 text-[13px] font-semibold leading-tight text-navy lg:text-[15px]">{a}</b>
            <span className="text-[11.5px] leading-tight text-slate lg:text-[13px]">{b}</span>
          </Link>
        ))}
      </section>

      {/* My Account */}
      <h2 className="mt-5 text-[20px] font-extrabold text-navy lg:text-[22px]">My Account</h2>
      <nav className="mt-2.5 rounded-2xl border border-line bg-white px-4">
        {menu.map(([Icon, label, to]) => (
          <Link key={label} to={to} className="flex items-center gap-4 border-b border-line py-3.5 last:border-0">
            <Icon className="size-6 text-ink" strokeWidth={1.6} />
            <span className="flex-1 text-[16px] text-navy">{label}</span>
            <ChevronRight className="size-5 text-slate" />
          </Link>
        ))}
      </nav>

      {user && (
        <button onClick={logout} className="mt-3.5 flex w-full items-center gap-4 rounded-2xl border border-[#fbe1dd] bg-[#fef6f4] px-4 py-3.5 text-left">
          <LogOut className="size-6 text-red" strokeWidth={1.7} />
          <span className="flex-1 text-[16px] font-medium text-red">Logout</span>
          <ChevronRight className="size-5 text-slate" />
        </button>
      )}
    </div>
  );
}
