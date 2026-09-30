import { createFileRoute } from '@tanstack/react-router';
import { Clock, CreditCard, Database, Download, Image, Settings, Store, Truck } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Badge, Card, downloadCsv, Field, PageHeader, Toggle } from '@/components/delight/admin-ui';
import { paymentOptions } from '@/components/delight/checkout-ui';
import { fetchAdminCustomers, fetchAdminOrders, fetchAdminProducts, fmtDate, statusLabel } from '@/services/admin';
import { supabase } from '@/services/supabase';
import { useAdminScope } from '@/services/admin-scope';
import { BRANCH_COLUMNS, branchFromRow, type Branch } from '@/lib/branch';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/admin/settings')({
  head: () => ({ meta: [{ title: 'Settings — Delight Admin' }, { name: 'description', content: 'Configure the Delight Shopping Mart store.' }, { property: 'og:title', content: 'Store Settings — Delight Admin' }, { property: 'og:description', content: 'Store and delivery settings.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

// Each store keeps its own details, hours and delivery fees (table public.branches).
type StoreForm = {
  id: string; name: string; city: string; address: string; phone: string; whatsapp: string; email: string; mapsUrl: string; lat: string; lng: string;
  opens: string; closes: string; deliveryFee: string; crossFee: string; minOrder: string; minutes: string; deliveryAvailable: boolean; acceptingOrders: boolean;
};
const toForm = (b: Branch): StoreForm => ({
  id: b.id, name: b.name, city: b.city, address: b.address, phone: b.phone ?? '', whatsapp: b.whatsapp ?? '', email: b.email ?? '', mapsUrl: b.mapsUrl ?? '',
  lat: b.lat === null ? '' : String(b.lat), lng: b.lng === null ? '' : String(b.lng), opens: b.opens ?? '', closes: b.closes ?? '',
  deliveryFee: String(b.deliveryFee), crossFee: String(b.crossFee), minOrder: String(b.minOrder), minutes: String(b.minutes), deliveryAvailable: b.deliveryAvailable, acceptingOrders: b.acceptingOrders,
});
const num = (v: string) => (v.trim() === '' ? null : Number(v));

const tabs = [[Store, 'Store Details'], [Truck, 'Delivery & Hours'], [CreditCard, 'Payment Methods']] as const;

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
  const { allowed, scope, isSuper, role } = useAdminScope();
  const [storeId, setStoreId] = useState(scope !== 'all' ? scope : allowed[0]?.id ?? 'tulsipur');
  const [s, setS] = useState<StoreForm | null>(null);
  const [exporting, setExporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const canEdit = isSuper || role === 'MANAGER';

  useEffect(() => {
    setS(null);
    void supabase.from('branches').select(BRANCH_COLUMNS).eq('id', storeId).maybeSingle().then(({ data, error }) => {
      if (error) { toast.error(`Could not load the store: ${error.message}`); return; }
      if (data) setS(toForm(branchFromRow(data)));
    });
  }, [storeId]);

  function update<K extends keyof StoreForm>(key: K, value: StoreForm[K]) { setS((v) => (v ? { ...v, [key]: value } : v)); }

  async function save() {
    if (!s) return;
    if (!s.name.trim() || !s.city.trim()) { toast.error('Store name and town are required'); return; }
    const money = [s.deliveryFee, s.crossFee, s.minOrder].map((v) => Number(v || 0));
    if (money.some((v) => !(v >= 0))) { toast.error('Fees and minimum order must be 0 or more'); return; }
    const minutes = Number(s.minutes || 45);
    if (!(minutes >= 5 && minutes <= 1440)) { toast.error('Delivery time must be between 5 and 1440 minutes'); return; }
    if ((s.lat && !Number.isFinite(Number(s.lat))) || (s.lng && !Number.isFinite(Number(s.lng)))) { toast.error('Map latitude/longitude must be numbers'); return; }
    setBusy(true);
    const { data, error } = await supabase.from('branches').update({
      name: s.name.trim(), city: s.city.trim(), address: s.address.trim(), phone: s.phone.trim() || null, whatsapp: s.whatsapp.replace(/\D/g, '') || null,
      email: s.email.trim() || null, maps_url: s.mapsUrl.trim() || null, latitude: num(s.lat), longitude: num(s.lng),
      opening_time: s.opens || null, closing_time: s.closes || null, delivery_fee: money[0]!, cross_branch_fee: money[1]!, min_order: money[2]!,
      estimated_delivery_minutes: minutes, delivery_available: s.deliveryAvailable, accepting_orders: s.acceptingOrders, updated_at: new Date().toISOString(),
    }).eq('id', s.id).select('id');
    setBusy(false);
    if (error) toast.error(error.message);
    else if (!data?.length) toast.error('You can only change the settings of your own store');
    else toast.success(`${s.city} store settings saved`);
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

  const saveBtn = <button onClick={() => void save()} disabled={busy || !canEdit || !s} className="rounded-lg bg-[#dcf2e6] px-5 py-2.5 text-[14.5px] font-medium text-[#077a52]">{busy ? 'Saving…' : 'Save Changes'}</button>;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Each store has its own details, hours and delivery fees." actions={allowed.length > 1 ? (
        <label className="flex h-[44px] items-center gap-2 rounded-lg border border-line bg-white px-3 text-[14px] text-navy">Store
          <select aria-label="Store to edit" value={storeId} onChange={(e) => setStoreId(e.target.value)} className="h-full bg-transparent font-semibold outline-none">
            {allowed.map((b) => <option key={b.id} value={b.id}>{b.city}</option>)}
          </select>
        </label>
      ) : undefined} />
      {!canEdit && <p className="mb-4 rounded-lg bg-[#fff8e6] p-3 text-[13.5px] text-[#8a5a00]">Only store managers and the owner can change these settings.</p>}
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
        !s ? <Card className="p-8 text-center text-slate">Loading store…</Card> :
        <div className="grid gap-4 xl:grid-cols-2">
          <Section icon={Truck} title={`Delivery – ${s.city} store`} sub="Delivery fees and time for orders from this store." action={saveBtn}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Delivery Fee (NPR)" hint="0 = free delivery"><Input type="number" value={s.deliveryFee} onChange={(v) => update('deliveryFee', v)} /></Field>
              <Field label="Other-town delivery fee (NPR)" hint="Added when delivering to another store’s town"><Input type="number" value={s.crossFee} onChange={(v) => update('crossFee', v)} /></Field>
              <Field label="Minimum Order (NPR)"><Input type="number" value={s.minOrder} onChange={(v) => update('minOrder', v)} /></Field>
              <Field label="Estimated Delivery (minutes)"><Input type="number" value={s.minutes} onChange={(v) => update('minutes', v)} /></Field>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <span><b className="block text-[15px] font-medium text-navy">Delivery Available</b><span className="text-[13px] text-slate">Turn off to pause deliveries from this store for a while</span></span>
              <Toggle key={`d${s.id}${s.deliveryAvailable}`} on={s.deliveryAvailable} onChange={(v) => update('deliveryAvailable', v)} />
            </div>
          </Section>
          <Section icon={Clock} title={`Opening Hours – ${s.city} store`} sub="Customers see these hours on the website." action={saveBtn}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Opens"><Input type="time" value={s.opens} onChange={(v) => update('opens', v)} /></Field>
              <Field label="Closes"><Input type="time" value={s.closes} onChange={(v) => update('closes', v)} /></Field>
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
          {!s ? <Card className="p-8 text-center text-slate">Loading store…</Card> : (
          <Section icon={Store} title={`${s.city} store`} sub="Contact details customers see for this store." action={saveBtn}>
            <div className="mb-4 flex items-center justify-between rounded-lg border border-line bg-[#f8fafc] px-4 py-3">
              <span><b className="block text-[15px] font-semibold text-navy">Taking online orders</b><span className="text-[13px] text-slate">{s.acceptingOrders ? 'Customers can choose this store and order from it.' : 'Shown as “opening soon”. Customers cannot order from it yet.'}</span></span>
              <Toggle key={`a${s.id}${s.acceptingOrders}`} on={s.acceptingOrders} onChange={(v) => update('acceptingOrders', v)} />
            </div>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <Field label="Store Name" required><Input value={s.name} onChange={(v) => update('name', v)} /></Field>
              <Field label="Town" required hint="Delivery to this town counts as this store’s area"><Input value={s.city} onChange={(v) => update('city', v)} /></Field>
              <Field label="Phone Number"><Input value={s.phone} onChange={(v) => update('phone', v)} /></Field>
              <Field label="WhatsApp Number" hint="With country code, e.g. 9779800000000"><Input value={s.whatsapp} onChange={(v) => update('whatsapp', v)} /></Field>
              <Field label="Email Address"><Input type="email" value={s.email} onChange={(v) => update('email', v)} /></Field>
              <Field label="Google Maps Link"><Input value={s.mapsUrl} onChange={(v) => update('mapsUrl', v)} /></Field>
              <Field label="Store Address" required><Input multiline value={s.address} onChange={(v) => update('address', v)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Map latitude"><Input value={s.lat} onChange={(v) => update('lat', v)} /></Field>
                <Field label="Map longitude"><Input value={s.lng} onChange={(v) => update('lng', v)} /></Field>
              </div>
            </div>
          </Section>
          )}

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
