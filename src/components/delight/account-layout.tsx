import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { StorePage } from './store-shell';
import { useAuth } from './auth-context';

/**
 * `/account` renders the approved My Account screen full-width.
 * Sub-pages (profile, addresses, orders, notifications) get a back header and a centred column.
 */
export function AccountLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, loading } = useAuth();
  const isHome = path === '/account' || path === '/account/';

  if (isHome) {
    return (
      <StorePage mobile={{ variant: 'account', actions: ['bell'], search: false }} nav="account">
        <Outlet />
      </StorePage>
    );
  }

  return (
    <StorePage mobile={{ variant: 'back', actions: ['bell'], search: false }} nav="account">
      <div className="mx-auto max-w-[860px] px-4 py-4 lg:py-8">
        <p className="mb-4 hidden text-[14px] text-slate lg:block"><Link to="/">Home</Link> / <Link to="/account">My Account</Link></p>
        {!user && !loading ? (
          <div className="rounded-xl border border-line bg-white p-8 text-center">
            <h1 className="text-[24px] font-extrabold text-navy">Sign in to your account</h1>
            <p className="mt-2 text-slate">Your orders, addresses and account details will appear here.</p>
            <Link to="/login" className="mt-5 inline-flex h-12 items-center rounded-lg bg-brand px-8 font-semibold text-white">Sign In</Link>
          </div>
        ) : user ? <Outlet /> : <p className="p-5 text-slate">Loading your account…</p>}
      </div>
    </StorePage>
  );
}
