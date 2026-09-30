import { createFileRoute } from '@tanstack/react-router';
import { Clock, CreditCard, Database, Download, Image, Settings, Store, Truck } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Badge, Card, downloadCsv, Field, PageHeader, Toggle } from '@/components/delight/admin-ui';
import { paymentOptions } from '@/components/delight/checkout-ui';
import { fetchAdminCustomers, fetchAdminOrders, fetchAdminProducts, fmtDate, statusLabel } from '@/services/admin';
import { supabase } from '@/services/supabase';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/admin/settings')({
  head: () => ({ meta: [{ title: 'Settings — Delight Admin' }, { name: 'description', content: 'Configure the Delight Shopping Mart store.' }, { property: 'og:title', content: 'Store Settings — Delight Admin' }, { property: 'og:description', content: 'Store and delivery settings.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

type Settings = { id: string; store_name: string; address: string; phone: string | null; email: string | null; opening_time: string | null; closing_time: string | null; currency: string; timezone: string; delivery_radius_km: number | null; delivery_fee: number | null; min_order: number | null; estimated_delivery_minutes: number | null; delivery_available: boolean };

// Values shown in the approved Settings screen, used until the store's saved settings load.
const defaults: Settings = { id: '', store_name: 'Delight Shopping Mart', address: 'Tulsipur Sub-Metropolitan City, Ward No. 6\nDang, Lumbini Province, Nepal', phone: '+977 9841234567', email: 'info@delightshoppingmart.com', opening_time: '07:00', closing_time: '21:00', currency: 'NPR', timezone: 'Asia/Kathmandu', delivery_radius_km: 5, delivery_fee: 0, min_order: 0, estimated_delivery_minutes: 20, delivery_available: true };

const tabs = [[Store, 'Store Information'], [Truck, 'Delivery & Hours'], [CreditCard, 'Payment Methods']] as const;

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
  const [exporting, setExporting] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.from('store_settings').select('id,store_name,address,phone,email,opening_time,closing_time,currency,timezone,delivery_radius_km,delivery_fee,min_order,estimated_delivery_minutes,delivery_available').order('updated_at', { ascending: false }).limit(1).maybeSingle().then(({ data }) => {
      if (data) setS(data);
    });
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) { setS((v) => ({ ...v, [key]: value })); }

  async function save() {
    if (!s.id) { toast.error('Store settings have not loaded yet. Refresh the page and try again.'); return; }
    if (!s.store_name.trim()) { toast.error('Store name is required'); return; }
    setBusy(true);
    const { error } = await supabase.from('store_settings').update({ store_name: s.store_name, address: s.address, phone: s.phone, email: s.email, opening_time: s.opening_time, closing_time: s.closing_time, timezone: s.timezone, delivery_radius_km: s.delivery_radius_km, delivery_fee: s.delivery_fee, min_order: s.min_order, estimated_delivery_minutes: s.estimated_delivery_minutes, delivery_available: s.delivery_available, updated_at: new Date().toISOString() }).eq('id', s.id);
    setBusy(false);
    if (error) toast.error(error.message); else toast.success('Settings saved');
  }

  async function exportAll() {
    setExporting(true);
    try {
      const [products, orders, customers] = await Promise.all([fetchAdminProducts(), fetchAdminOrders(5000), fetchAdminCustomers()]);
      const day = new Date().toISOString().slice(0, 10);
      downloadCsv(`delight-products-${day}.csv`, [['Name', 'SKU', 'Category', 'Price', 'MRP', 'Stock', 'Active'], ...products.map((p) => [p.name, p.sku, p.category, p.price, p.oldPrice, p.stock, p.active ? 'Yes' : 'No'])]);
      downloadCsv(`delight-orders-${day}.csv`, [['Order', 'Date', 'Customer', 'Phone', 'Total', 'Payment', 'Status'], ...orders.map((o) => [o.number, fmtDate(o.createdAt), o.customer.name, o.customer.phone, o.total, o.paymentMethod, statusLabel(o.status)])]);
      downloadCsv(`delight-customers-${day}.csv`, [['Name', 'Phone', 'Email', 'Orders', 'Total spent', 'Joined'], ...customers.map((c) => [c.name, c.phone, c.email, c.orders, c.spent, fmtDate(c.joined)])]);
      toast.success('Downloaded 3 files: products, orders and customers');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not export the data'); } finally { setExporting(false); }
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

      {tab === 1 ? (
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
          <Section icon={Clock} title="Opening Hours" sub="Customers see these hours across the store." action={saveBtn}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Opens"><Input type="time" value={s.opening_time ?? ''} onChange={(v) => update('opening_time', v)} /></Field>
              <Field label="Closes"><Input type="time" value={s.closing_time ?? ''} onChange={(v) => update('closing_time', v)} /></Field>
            </div>
          </Section>
        </div>
      ) : tab === 2 ? (
        <Section icon={CreditCard} title="Payment Methods" sub="What customers can choose on the payment step at checkout.">
          <ul className="divide-y divide-line">
            {paymentOptions.map((p) => (
              <li key={p.value} className="flex items-center gap-4 py-3.5">
                <img src={asset(p.icon)} alt="" className="h-8 w-10 object-contain" />
                <span className="flex-1"><b className="block text-[14.5px] font-medium text-navy">{p.title}</b><span className="text-[13px] text-slate">{p.sub}</span></span>
                {p.available ? <Badge tone="green">Active</Badge> : <Badge tone="amber">Needs merchant account</Badge>}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-[#f0faf5] p-4 text-[13.5px] leading-5 text-navy">Cash on Delivery works today. eSewa, Khalti and cards are shown to customers as “coming soon”. To switch them on, the store first needs a merchant account with each provider; the developer then connects the account keys.</p>
        </Section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.12fr_1fr]">
          <Section icon={Store} title="Store Information" sub="Update your store details and contact information." action={saveBtn}>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <Field label="Store Name" required><Input value={s.store_name} onChange={(v) => update('store_name', v)} /></Field>
              <Field label="Email Address" required><Input type="email" value={s.email ?? ''} onChange={(v) => update('email', v)} /></Field>
              <Field label="Phone Number" required><Input value={s.phone ?? ''} onChange={(v) => update('phone', v)} /></Field>
              <Field label="Store Address" required><Input multiline value={s.address} onChange={(v) => update('address', v)} /></Field>
            </div>
          </Section>

          <Section icon={Image} title="Store Logo & Branding" sub="The logo and colours used across the website and app.">
            <div className="grid gap-5 sm:grid-cols-[1fr_245px]">
              <div className="grid place-items-center rounded-lg border border-line bg-[#f8fafc] px-4 py-6 text-center">
                <img src={asset('settings-logo')} alt="Delight Shopping Mart logo" className="h-[80px] w-auto mix-blend-multiply" />
                <p className="mt-3 text-[12.5px] text-slate">The logo is part of the website design. Send a new logo to your developer to change it.</p>
              </div>
              <div className="space-y-3">
                <Field label="App Icon"><img src={asset('favicon-cart')} alt="" className="size-12 rounded-md border border-line object-contain" /></Field>
                <Field label="Brand Color"><span className="flex h-10 items-center gap-3 rounded-lg border border-line pr-3"><span className="h-full w-9 rounded-l-lg bg-[#0B6B3A]" /> <span className="text-[14px] text-navy">#0B6B3A</span></span></Field>
                <Field label="Secondary Color"><span className="flex h-10 items-center gap-3 rounded-lg border border-line pr-3"><span className="h-full w-9 rounded-l-lg bg-[#F4B400]" /> <span className="text-[14px] text-navy">#F4B400</span></span></Field>
              </div>
            </div>
          </Section>

          <Section icon={Clock} title="Region & Currency" sub="Used for prices, order times and reports.">
            <dl className="divide-y divide-line text-[14px]">
              {([['Timezone', '(GMT+05:45) Kathmandu, Nepal'], ['Currency', 'NPR (Nepalese Rupee)'], ['Date Format', 'DD MMM YYYY (25 Sep 2026)']] as const).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2.5"><dt className="text-slate">{k}</dt><dd className="font-medium text-navy">{v}</dd></div>
              ))}
            </dl>
          </Section>

          <Card className="flex flex-wrap items-center gap-4 p-5 xl:col-span-2">
            <Database className="size-8 shrink-0 text-navy" strokeWidth={1.6} />
            <span className="flex-1"><b className="block text-[17px] font-bold text-navy">Export &amp; Backup</b><span className="text-[13.5px] text-slate">Download products, orders and customers as CSV files (they open in Excel).</span></span>
            <button onClick={() => void exportAll()} disabled={exporting} className="flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 text-[14.5px] font-medium text-navy hover:bg-page disabled:opacity-60"><Download className="size-4" /> {exporting ? 'Preparing…' : 'Export All Data'}</button>
          </Card>
        </div>
      )}
    </div>
  );
}
