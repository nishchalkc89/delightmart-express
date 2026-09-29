import { createFileRoute } from '@tanstack/react-router';
import { Clock, CreditCard, Database, Download, Image, Mail, Palette, Settings, Shield, Store, Trash2, Truck } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Card, Field, PageHeader, SelectBox, Toggle } from '@/components/delight/admin-ui';
import { supabase } from '@/services/supabase';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/admin/settings')({
  head: () => ({ meta: [{ title: 'Settings — Delight Admin' }, { name: 'description', content: 'Configure the Delight Shopping Mart store.' }, { property: 'og:title', content: 'Store Settings — Delight Admin' }, { property: 'og:description', content: 'Store and delivery settings.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

type Settings = { id: string; store_name: string; address: string; phone: string | null; email: string | null; opening_time: string | null; closing_time: string | null; currency: string; timezone: string; delivery_radius_km: number | null; delivery_fee: number | null; min_order: number | null; estimated_delivery_minutes: number | null; delivery_available: boolean };

// Values shown in the approved Settings screen, used until the store's saved settings load.
const defaults: Settings = { id: '', store_name: 'Delight Shopping Mart', address: 'Tulsipur Sub-Metropolitan City, Ward No. 6\nDang, Lumbini Province, Nepal', phone: '+977 9841234567', email: 'info@delightmart.com.np', opening_time: '07:00', closing_time: '21:00', currency: 'NPR', timezone: 'Asia/Kathmandu', delivery_radius_km: 5, delivery_fee: 0, min_order: 0, estimated_delivery_minutes: 20, delivery_available: true };

const tabs = [[Settings, 'General'], [Store, 'Store Information'], [CreditCard, 'Payment Settings'], [Truck, 'Delivery Settings'], [Mail, 'Email & Notifications'], [Palette, 'Appearance'], [Shield, 'System']] as const;

function Section({ icon: Icon, title, sub, action, children }: { icon: typeof Store; title: string; sub: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start gap-4">
        <Icon className="mt-0.5 size-8 shrink-0 text-navy" strokeWidth={1.6} />
        <div className="flex-1"><h2 className="text-[17px] font-bold text-navy">{title}</h2><p className="text-[13.5px] text-slate">{sub}</p></div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function Input({ value, onChange, type = 'text', multiline = false }: { value: string; onChange: (v: string) => void; type?: string; multiline?: boolean }) {
  const cls = 'w-full rounded-lg border border-line bg-white px-3.5 text-[14px] text-navy outline-none focus:border-[#077a52]';
  return multiline
    ? <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={`${cls} resize-none py-2.5 leading-5`} />
    : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={`${cls} h-10`} />;
}

function Page() {
  const [tab, setTab] = useState(0);
  const [s, setS] = useState<Settings>(defaults);
  const [altPhone, setAltPhone] = useState('+977 9807654321');
  const [website, setWebsite] = useState('https://delightmart.com.np');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.from('store_settings').select('id,store_name,address,phone,email,opening_time,closing_time,currency,timezone,delivery_radius_km,delivery_fee,min_order,estimated_delivery_minutes,delivery_available').order('updated_at', { ascending: false }).limit(1).maybeSingle().then(({ data }) => {
      if (data) setS(data);
    });
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) { setS((v) => ({ ...v, [key]: value })); }

  async function save() {
    if (!s.id) { toast.info('Settings saved locally. Connect the store database to persist them.'); return; }
    setBusy(true);
    const { error } = await supabase.from('store_settings').update({ store_name: s.store_name, address: s.address, phone: s.phone, email: s.email, opening_time: s.opening_time, closing_time: s.closing_time, timezone: s.timezone, delivery_radius_km: s.delivery_radius_km, delivery_fee: s.delivery_fee, min_order: s.min_order, estimated_delivery_minutes: s.estimated_delivery_minutes, delivery_available: s.delivery_available, updated_at: new Date().toISOString() }).eq('id', s.id);
    setBusy(false);
    if (error) toast.error(error.message); else toast.success('Settings saved');
  }

  const saveBtn = <button onClick={save} disabled={busy} className="rounded-lg bg-[#dcf2e6] px-5 py-2.5 text-[14.5px] font-medium text-[#077a52]">{busy ? 'Saving…' : 'Save Changes'}</button>;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your store preferences, configuration and system settings." />
      <Card className="mb-4">
        <div className="flex gap-10 overflow-x-auto px-6">
          {tabs.map(([Icon, label], i) => (
            <button key={label} onClick={() => setTab(i)} className={`relative flex items-center gap-2.5 whitespace-nowrap py-5 text-[15px] ${i === tab ? 'font-semibold text-[#077a52]' : 'text-slate hover:text-navy'}`}>
              <Icon className="size-5" />{label}
              {i === tab && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#077a52]" />}
            </button>
          ))}
        </div>
      </Card>

      {tab === 3 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Section icon={Truck} title="Delivery Settings" sub="Control delivery area, fees and estimated time." action={saveBtn}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Delivery Radius (km)"><Input type="number" value={String(s.delivery_radius_km ?? '')} onChange={(v) => update('delivery_radius_km', Number(v))} /></Field>
              <Field label="Delivery Fee (NPR)"><Input type="number" value={String(s.delivery_fee ?? '')} onChange={(v) => update('delivery_fee', Number(v))} /></Field>
              <Field label="Minimum Order (NPR)"><Input type="number" value={String(s.min_order ?? '')} onChange={(v) => update('min_order', Number(v))} /></Field>
              <Field label="Estimated Delivery (minutes)"><Input type="number" value={String(s.estimated_delivery_minutes ?? '')} onChange={(v) => update('estimated_delivery_minutes', Number(v))} /></Field>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <span><b className="block text-[15px] font-medium text-navy">Delivery Available</b><span className="text-[13px] text-slate">Accept delivery orders right now</span></span>
              <Toggle on={s.delivery_available} onChange={(v) => update('delivery_available', v)} />
            </div>
          </Section>
          <Section icon={Clock} title="Opening Hours" sub="Customers see these hours across the store.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Opens"><Input type="time" value={s.opening_time ?? ''} onChange={(v) => update('opening_time', v)} /></Field>
              <Field label="Closes"><Input type="time" value={s.closing_time ?? ''} onChange={(v) => update('closing_time', v)} /></Field>
            </div>
          </Section>
        </div>
      ) : tab > 1 ? (
        <Card className="p-8 text-center">
          <h2 className="text-[20px] font-bold text-navy">{tabs[tab]![1]}</h2>
          <p className="mt-2 text-slate">These settings will be available once the related services are connected.</p>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.12fr_1fr]">
          <Section icon={Store} title="Store Information" sub="Update your store details and contact information." action={saveBtn}>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <Field label="Store Name" required><Input value={s.store_name} onChange={(v) => update('store_name', v)} /></Field>
              <Field label="Email Address" required><Input type="email" value={s.email ?? ''} onChange={(v) => update('email', v)} /></Field>
              <Field label="Phone Number" required><Input value={s.phone ?? ''} onChange={(v) => update('phone', v)} /></Field>
              <Field label="Alternate Phone"><Input value={altPhone} onChange={setAltPhone} /></Field>
              <Field label="Store Address" required><Input multiline value={s.address} onChange={(v) => update('address', v)} /></Field>
              <Field label="Website"><Input value={website} onChange={setWebsite} /></Field>
            </div>
          </Section>

          <Section icon={Image} title="Store Logo & Branding" sub="Upload your store logo and brand assets.">
            <div className="grid gap-5 sm:grid-cols-[1fr_245px]">
              <div className="grid place-items-center rounded-lg border border-line bg-[#f8fafc] px-4 py-6 text-center">
                <img src={asset('settings-logo')} alt="Delight Shopping Mart logo" className="h-[80px] w-auto mix-blend-multiply" />
                <p className="mt-3 text-[14px] font-medium text-navy">Click to upload logo</p>
                <p className="text-[12.5px] text-slate">PNG, JPG (Max 2MB)</p>
              </div>
              <div className="space-y-3">
                <Field label="Favicon"><span className="flex items-center gap-4"><img src={asset('favicon-cart')} alt="" className="size-12 rounded-md border border-line object-contain" /><button className="rounded-lg border border-line px-4 py-2 text-[14px] font-medium text-navy">Change</button></span></Field>
                <Field label="Brand Color"><span className="flex h-10 items-center gap-3 rounded-lg border border-line pr-3"><span className="h-full w-9 rounded-l-lg bg-[#0B6B3A]" /> <span className="text-[14px] text-navy">#0B6B3A</span></span></Field>
                <Field label="Secondary Color"><span className="flex h-10 items-center gap-3 rounded-lg border border-line pr-3"><span className="h-full w-9 rounded-l-lg bg-[#F4B400]" /> <span className="text-[14px] text-navy">#F4B400</span></span></Field>
              </div>
            </div>
          </Section>

          <Section icon={Settings} title="Business Settings" sub="Configure your business preferences.">
            <ul className="divide-y divide-line">
              {([['Enable Online Orders', 'Allow customers to place orders online', true], ['Require Email Verification', 'Customers must verify email before ordering', true], ['Allow Guest Checkout', 'Let customers place orders without creating an account', false], ['Enable Product Reviews', 'Allow customers to write reviews', true], ['Maintenance Mode', 'Temporarily disable the store for maintenance', false]] as const).map(([a, b, on]) => (
                <li key={a} className="flex items-center justify-between py-2.5">
                  <span><b className="block text-[14.5px] font-medium text-navy">{a}</b><span className="text-[13px] text-slate">{b}</span></span>
                  <Toggle on={on} />
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Clock} title="Timezone & Currency" sub="Set your store timezone and currency.">
            <div className="space-y-4">
              <Field label="Timezone"><SelectBox label="(GMT+05:45) Kathmandu, Nepal" className="w-full" /></Field>
              <Field label="Currency"><SelectBox label="NPR (Nepalese Rupee)" className="w-full" /></Field>
              <Field label="Date Format"><SelectBox label="DD MMM YYYY (25 Sep 2026)" className="w-full" /></Field>
            </div>
          </Section>

          <Card className="flex items-center gap-4 p-5">
            <Trash2 className="size-8 shrink-0 text-[#e3101a]" strokeWidth={1.6} />
            <span className="flex-1"><b className="block text-[17px] font-bold text-[#e3101a]">Danger Zone</b><span className="text-[13.5px] text-slate">These actions are irreversible. Please be careful.</span></span>
            <button onClick={() => toast.error('Resetting store data requires confirmation from a Super Admin.')} className="flex items-center gap-2 rounded-lg border border-[#f5b5b8] bg-[#fdf3f3] px-5 py-2.5 text-[14.5px] font-medium text-[#e3101a]"><Trash2 className="size-4" /> Reset Store Data</button>
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <Database className="size-8 shrink-0 text-navy" strokeWidth={1.6} />
            <span className="flex-1"><b className="block text-[17px] font-bold text-navy">Export &amp; Backup</b><span className="text-[13.5px] text-slate">Download your store data and backups.</span></span>
            <button onClick={() => toast.success('Export started')} className="flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 text-[14.5px] font-medium text-navy"><Download className="size-4" /> Export All Data</button>
          </Card>
        </div>
      )}
    </div>
  );
}
