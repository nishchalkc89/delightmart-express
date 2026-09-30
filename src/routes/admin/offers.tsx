import { createFileRoute } from '@tanstack/react-router';
import { CalendarDays, CircleCheck, Clock, Copy, Info, MinusCircle, Percent, Plus, Tag, Trash2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Badge, Card, DataBadge, Field, FilterBar, FilterSelect, IconBtn, PageHeader, Pagination, Panel, PrimaryAction, SearchBox, StatCard, Status, Table, Tabs, Td, Toggle, Tr, usePaged, WithPanel, type BadgeTone } from '@/components/delight/admin-ui';
import { FormButtons, Input } from '@/components/delight/admin-forms';
import { useAdminData } from '@/services/admin';
import { deleteCoupon, fetchCoupons, saveCoupon, setCouponStatus, type CouponRow } from '@/services/admin-actions';
import { toast } from 'sonner';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/admin/offers')({
  head: () => ({ meta: [{ title: 'Offers & Coupons — Delight Admin' }, { name: 'description', content: 'Create and manage discounts and coupons.' }, { property: 'og:title', content: 'Offers & Coupons — Delight Admin' }, { property: 'og:description', content: 'Promotions management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const typeTone: Record<string, BadgeTone> = { Category: 'pink', Coupon: 'blue', Product: 'green', Shipping: 'purple' };
type Row = { pct: boolean; id: string; img: string; name: string; sub: string; type: string; disc: string; min: string; valid: string; usage: string; active: boolean; state: 'active' | 'upcoming' | 'expired' };

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '');

function toRow(c: CouponRow): Row {
  const now = Date.now();
  const state = c.ends_at && new Date(c.ends_at).getTime() < now ? 'expired' : c.starts_at && new Date(c.starts_at).getTime() > now ? 'upcoming' : 'active';
  return {
    pct: c.discount_type === 'PERCENTAGE', id: c.id, img: asset('offer-welcome'), name: c.code, sub: 'Promo code', type: 'Coupon',
    disc: c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `NPR ${c.discount_value.toLocaleString('en-US')} OFF`,
    min: c.min_order ? `Min. order: NPR ${c.min_order.toLocaleString('en-US')}` : '',
    valid: c.starts_at || c.ends_at ? `${day(c.starts_at) || 'Now'} – ${day(c.ends_at) || 'No end'}` : 'Always',
    usage: `${c.used_count} / ${c.usage_limit ?? '∞'}`, active: c.status === 'ACTIVE', state,
  };
}

type Form = { code: string; pct: boolean; value: string; minOrder: string; limit: string; start: string; end: string; active: boolean };
const blank: Form = { code: '', pct: true, value: '', minOrder: '', limit: '', start: '', end: '', active: true };

function Page() {
  const { rows: coupons, live, loading, reload } = useAdminData<CouponRow>(fetchCoupons);
  const rows = coupons.map(toRow);
  const [tab, setTab] = useState(0);
  const [type, setType] = useState(2);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [sort, setSort] = useState('newest');
  const [form, setForm] = useState<Form>(blank);
  const [busy, setBusy] = useState(false);

  const filters: Array<(r: Row) => boolean> = [() => true, (r) => r.active && r.state === 'active', (r) => r.state === 'upcoming', (r) => r.state === 'expired', (r) => !r.active];
  const used = (r: Row) => Number(r.usage.split(' / ')[0]) || 0;
  const shown = rows
    .filter((r) => filters[tab]!(r) && `${r.name} ${r.sub}`.toLowerCase().includes(query.toLowerCase()) && (kind === 'all' || (kind === 'pct') === r.pct))
    .sort((a, b) => (sort === 'used' ? used(b) - used(a) : sort === 'name' ? a.name.localeCompare(b.name) : 0));
  const pg = usePaged(shown, 20);
  const n = (i: number) => rows.filter(filters[i]!).length;

  function guard() {
    return true;
  }
  async function submit() {
    if (type !== 2) { toast.info('Product and category discounts: set a Sale Price on the product in Products. Here you can create promo codes.'); setType(2); return; }
    if (!guard()) return;
    if (!/^[A-Za-z0-9]{3,20}$/.test(form.code.trim())) { toast.error('Promo code must be 3–20 letters or numbers'); return; }
    const value = Number(form.value);
    if (!(value > 0) || (form.pct && value > 90)) { toast.error(form.pct ? 'Enter a percentage between 1 and 90' : 'Enter a discount amount'); return; }
    setBusy(true);
    try {
      await saveCoupon({ code: form.code, type: form.pct ? 'PERCENTAGE' : 'FIXED', value, minOrder: Number(form.minOrder) || 0, usageLimit: form.limit ? Number(form.limit) : null, startsAt: form.start ? new Date(form.start).toISOString() : null, endsAt: form.end ? new Date(`${form.end}T23:59:59`).toISOString() : null, active: form.active });
      toast.success(`Promo code ${form.code.toUpperCase()} created`);
      setForm(blank); void reload();
    } catch (e) { toast.error(e instanceof Error ? (e.message.includes('duplicate') ? 'That promo code already exists' : e.message) : 'Could not create'); } finally { setBusy(false); }
  }
  async function toggle(r: Row, v: boolean) {
    if (!guard()) return;
    try { await setCouponStatus(r.id, v); void reload(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); }
  }
  async function remove(r: Row) {
    if (!guard()) return;
    if (!window.confirm(`Delete promo code ${r.name}?`)) return;
    try { await deleteCoupon(r.id); toast.success('Promo code deleted'); void reload(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete'); }
  }
  const dateInput = 'h-10 min-w-0 flex-1 rounded-lg border border-line bg-white px-2 text-[13px] text-navy outline-none focus:border-[#077a52]';

  return (
    <div>
      <PageHeader title="Offers & Coupons" subtitle="Create and manage discounts, coupons and special offers to boost your sales." badge={<DataBadge live={live} loading={loading} />} actions={<PrimaryAction icon={Plus} onClick={() => { setForm(blank); setType(2); }}>Create Offer</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Tag} tone="green" label="Total Offers" value={String(rows.length)} />
              <StatCard icon={Percent} tone="blue" label="Active Offers" value={String(rows.filter((r) => r.active && r.state === 'active').length)} filled={false} />
              <StatCard icon={Clock} tone="amber" label="Upcoming Offers" value={String(n(4))} filled={false} />
              <StatCard icon={MinusCircle} tone="red" label="Expired Offers" value={String(n(5))} dir="down" />
            </div>
            <Card className="mt-4">
              <Tabs items={['All Codes', 'Running', 'Upcoming', 'Expired', 'Turned Off'].map((t, i) => `${t} (${n(i)})`)} active={tab} onChange={(i) => { setTab(i); pg.reset(); }} />
              <FilterBar>
                <SearchBox placeholder="Search offers, coupon codes..." value={query} onChange={setQuery} className="w-[232px]" />
                <FilterSelect label="Discount type" value={kind} onChange={(v) => { setKind(v); pg.reset(); }} options={[['all', 'All Discounts'], ['pct', 'Percentage off'], ['fixed', 'Fixed amount off']]} className="w-[160px]" />
                <FilterSelect label="Sort" value={sort} onChange={setSort} options={[['newest', 'Sort: Newest'], ['used', 'Sort: Most used'], ['name', 'Sort: Code (A-Z)']]} className="w-[160px]" />
              </FilterBar>
              <Table head={['#', 'Offer Name', 'Type', 'Discount', 'Validity', 'Status', 'Usage', 'Actions']}>
                {pg.shown.map((r, i) => (
                  <Tr key={r.id}>
                    <Td>{pg.from + i}</Td>
                    <Td><span className="flex items-center gap-3"><img src={r.img} alt="" className="size-10 rounded object-contain" /><span className="leading-tight"><span className="block">{r.name}</span><span className="text-[12px] text-slate">{r.sub}</span></span></span></Td>
                    <Td><Badge tone={typeTone[r.type]!}>{r.type}</Badge></Td>
                    <Td className="leading-tight"><b className="block font-semibold">{r.disc}</b>{r.min && <span className="text-[12px] text-slate">{r.min}</span>}</Td>
                    <Td className="whitespace-nowrap text-slate">{r.valid}</Td>
                    <Td>{<span className="flex items-center gap-2"><Toggle key={`${r.id}${r.active}`} on={r.active} onChange={(v) => void toggle(r, v)} /><Status value={r.state === 'expired' ? 'Inactive' : r.active ? 'Active' : 'Inactive'} /></span>}</Td>
                    <Td className="whitespace-nowrap text-slate">{r.usage}</Td>
                    <Td><span className="flex gap-2"><IconBtn icon={Copy} label="Copy code" onClick={() => { void navigator.clipboard?.writeText(r.name); toast.success(`${r.name} copied`); }} /><IconBtn icon={Trash2} label="Delete" tone="danger" onClick={() => void remove(r)} /></span></Td>
                  </Tr>
                ))}
              </Table>
              {!shown.length && <p className="px-5 py-10 text-center text-[14px] text-slate">{rows.length ? 'No promo codes match these filters.' : 'No promo codes yet. Create one with the form on the right.'}</p>}
              <Pagination text={`Showing ${pg.from}-${pg.to} of ${pg.total} promo codes`} current={pg.page} pageCount={pg.pageCount} onPage={pg.setPage} />
            </Card>
          </>
        }
        panel={
          <Panel title="Create New Offer" onClose={() => setForm(blank)}>
            <Field label="Offer Type" required>
              <div className="grid grid-cols-4 gap-1.5">
                {['Product', 'Category', 'Coupon', 'Shipping'].map((t, i) => <button key={t} type="button" onClick={() => setType(i)} className={`h-9 rounded-md border text-[12.5px] ${i === type ? 'border-[#0a8a5b] bg-[#f0fbf5] font-semibold text-[#077a52]' : 'border-line bg-[#f7f9fb] text-slate'}`}>{t}</button>)}
              </div>
            </Field>
            {type !== 2 ? (
              <div className="mt-5 rounded-lg bg-[#f0faf5] p-4 text-[13.5px] leading-5 text-navy">
                {type === 3 ? 'Delivery is currently free on every order. Change the delivery fee in Settings → Delivery Settings.' : <>To discount a {type === 0 ? 'product' : 'category of products'}, set a <b>Sale Price</b> on each product in <b>Products</b>. The old price is shown crossed out in the store.</>}
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <Field label="Promo Code" required><Input value={form.code} onChange={(v) => setForm({ ...form, code: v.toUpperCase() })} placeholder="e.g. DASHAIN20" /></Field>
                <Field label="Discount Type" required>
                  <div className="grid grid-cols-2 gap-3">
                    {['Percentage', 'Fixed Amount'].map((t, i) => {
                      const on = (i === 0) === form.pct;
                      return <button key={t} type="button" onClick={() => setForm({ ...form, pct: i === 0 })} className={`flex h-10 items-center justify-center gap-2 rounded-lg border text-[13.5px] ${on ? 'border-[#0a8a5b] bg-[#f0fbf5] text-[#077a52]' : 'border-line text-navy'}`}>{on ? <CircleCheck className="size-5 fill-[#0a8a5b] text-white" /> : <span className="size-4 rounded-full border-2 border-[#b6bec8]" />}{t}</button>;
                    })}
                  </div>
                </Field>
                <Field label="Discount Value" required><Input type="number" value={form.value} onChange={(v) => setForm({ ...form, value: v })} placeholder={form.pct ? 'Enter percentage' : 'Enter amount'} suffix={form.pct ? '%' : 'NPR'} /></Field>
                <Field label="Minimum Order (NPR)"><Input type="number" value={form.minOrder} onChange={(v) => setForm({ ...form, minOrder: v })} placeholder="0" /></Field>
                <Field label="Usage Limit" hint="Leave empty for unlimited uses"><Input type="number" value={form.limit} onChange={(v) => setForm({ ...form, limit: v })} placeholder="e.g. 500" /></Field>
                <Field label="Validity Period">
                  <span className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0 text-navy" /><input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className={dateInput} aria-label="Start date" /><ArrowRight className="size-4 shrink-0 text-slate" /><input type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className={dateInput} aria-label="End date" /></span>
                </Field>
              </div>
            )}
            {type === 2 && <label className="mt-4 flex items-center gap-3 text-[14px] text-navy"><Toggle key={`act${form.active}`} on={form.active} onChange={(v) => setForm({ ...form, active: v })} /> Active</label>}
            <FormButtons primary="Create Offer" busy={busy} onCancel={() => setForm(blank)} onPrimary={() => void submit()} />
            <p className="mt-3 flex items-center gap-2 text-[12px] text-slate"><Info className="size-4 fill-navy text-white" /> Customers enter promo codes on the payment step at checkout.</p>
          </Panel>
        }
      />
    </div>
  );
}
