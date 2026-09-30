import { createFileRoute } from '@tanstack/react-router';
import { Download, RefreshCw, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/delight/auth-context';
import { useCart } from '@/components/delight/cart-context';
import { useInstallApp } from '@/components/delight/pwa-register';
import { AccountCard, AccountTitle, Switch } from '@/components/delight/account-ui';
import { supabase } from '@/services/supabase';

export const Route = createFileRoute('/account/settings')({
  head: () => ({ meta: [{ title: 'App Settings — Delight' }, { name: 'description', content: 'Notification and app preferences for Delight Shopping Mart.' }] }),
  component: Page,
});

type Prefs = { orderUpdates: boolean; offers: boolean; whatsapp: boolean };
const defaults: Prefs = { orderUpdates: true, offers: true, whatsapp: false };
const prefRows: Array<[keyof Prefs, string, string]> = [
  ['orderUpdates', 'Order updates', 'When your order is confirmed, packed, out for delivery and delivered'],
  ['offers', 'Offers & deals', 'New coupon codes and weekly offers'],
  ['whatsapp', 'WhatsApp messages', 'Get order updates on WhatsApp too'],
];

function Page() {
  const { user } = useAuth();
  const cart = useCart();
  const app = useInstallApp();
  const [prefs, setPrefs] = useState<Prefs>(defaults);
  const [browserAlerts, setBrowserAlerts] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    const saved = user?.user_metadata['prefs'] as Partial<Prefs> | undefined;
    if (saved) setPrefs({ ...defaults, ...saved });
    setBrowserAlerts('Notification' in window ? Notification.permission : 'unsupported');
  }, [user]);

  async function setPref(key: keyof Prefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    const { error } = await supabase.auth.updateUser({ data: { prefs: next } });
    if (error) { toast.error(error.message); setPrefs(prefs); } else toast.success('Preference saved');
  }

  async function allowAlerts() {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setBrowserAlerts(result);
    if (result === 'granted') toast.success('Alerts turned on for this device');
    else toast.info('Alerts are blocked. You can allow them in your browser’s site settings.');
  }

  async function installApp() {
    const ok = await app.install();
    if (ok) toast.success('Delight app installed');
  }

  async function refreshApp() {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      const regs = await navigator.serviceWorker?.getRegistrations();
      await Promise.all((regs ?? []).map((r) => r.update()));
    } catch { /* nothing cached */ }
    toast.success('App refreshed — loading the latest version');
    setTimeout(() => window.location.reload(), 600);
  }

  return (
    <div>
      <AccountTitle title="App Settings" sub="Notifications and app preferences." />

      <AccountCard title="Notifications">
        <div className="divide-y divide-line">
          {prefRows.map(([key, title, sub]) => (
            <div key={key} className="flex items-center gap-4 py-3">
              <span className="min-w-0 flex-1"><b className="block text-[15px] font-semibold text-navy">{title}</b><span className="text-[13px] text-slate">{sub}</span></span>
              <Switch on={prefs[key]} onChange={(v) => void setPref(key, v)} label={title} />
            </div>
          ))}
          <div className="flex items-center gap-4 py-3">
            <span className="min-w-0 flex-1"><b className="block text-[15px] font-semibold text-navy">Alerts on this device</b><span className="text-[13px] text-slate">{browserAlerts === 'granted' ? 'Allowed' : browserAlerts === 'denied' ? 'Blocked in browser settings' : browserAlerts === 'unsupported' ? 'Not supported on this browser' : 'Show a pop-up when your order status changes'}</span></span>
            {browserAlerts === 'default' && <button onClick={() => void allowAlerts()} className="rounded-lg border border-brand px-3 py-1.5 text-[13px] font-semibold text-brand">Allow</button>}
          </div>
        </div>
      </AccountCard>

      <AccountCard title="Delight app">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eef8f3]"><Smartphone className="size-5 text-brand" /></span>
          <span className="min-w-0 flex-1">
            <b className="block text-[15px] font-semibold text-navy">{app.installed ? 'You are using the Delight app' : 'Install the Delight app'}</b>
            <span className="text-[13px] text-slate">{app.installed ? 'Opened from your home screen' : app.canInstall ? 'Faster, full screen, works like an app' : 'In your browser menu, choose “Add to Home screen” or “Install app”'}</span>
          </span>
          {!app.installed && app.canInstall && <button onClick={() => void installApp()} className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13.5px] font-semibold text-white"><Download className="size-4" /> Install</button>}
        </div>
        <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
          <span className="min-w-0 flex-1"><b className="block text-[15px] font-semibold text-navy">Refresh app</b><span className="text-[13px] text-slate">Clears saved pages and loads the newest version. Your cart and login stay.</span></span>
          <button onClick={() => void refreshApp()} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold text-navy"><RefreshCw className="size-4" /> Refresh</button>
        </div>
      </AccountCard>

      <AccountCard title="Cart">
        <div className="flex items-center gap-3">
          <span className="min-w-0 flex-1 text-[14px] text-slate">{cart.count ? `${cart.count} item${cart.count === 1 ? '' : 's'} saved in your cart on this device.` : 'Your cart is empty.'}</span>
          {cart.count > 0 && <button onClick={() => { if (window.confirm('Remove everything from your cart?')) { cart.clear(); toast.success('Cart cleared'); } }} className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold text-navy">Clear cart</button>}
        </div>
      </AccountCard>

      <p className="mt-4 text-center text-[12.5px] text-slate">Delight Shopping Mart · Tulsipur, Dang · App version 1.0</p>
    </div>
  );
}
