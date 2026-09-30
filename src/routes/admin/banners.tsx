import { createFileRoute } from '@tanstack/react-router';
import { ArrowRight, CalendarDays, Clock, Eye, Image, MinusCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge, Card, Checkbox, DataBadge, Field, FiltersButton, IconBtn, PageHeader, Pagination, Panel, PrimaryAction, SearchBox, StatCard, Table, Tabs, Td, TipCard, Toggle, Tr, WithPanel } from '@/components/delight/admin-ui';
import { FormButtons, ImageUpload, Input, Select } from '@/components/delight/admin-forms';
import { useAdminData } from '@/services/admin';
import { deleteBanner, fetchBanners, saveBanner, setBannerStatus, type BannerRow } from '@/services/admin-actions';
import { BANNER_POSITIONS } from '@/services/catalog';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/admin/banners')({
  head: () => ({ meta: [{ title: 'Banners & Content — Delight Admin' }, { name: 'description', content: 'Manage homepage banners and site content.' }, { property: 'og:title', content: 'Banners & Content — Delight Admin' }, { property: 'og:description', content: 'Content management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const demo: BannerRow[] = ([
  ['bn-1', 'Fresh Groceries', 'Homepage Slider', '2026-09-20', '2026-09-30'],
  ['bn-2', 'Fashion Collection', 'Homepage Slider', '2026-09-15', '2026-10-15'],
  ['bn-3', 'Electronics Sale', 'Homepage Slider', '2026-09-01', '2026-09-30'],
  ['bn-4', 'Home Essentials', 'Homepage Slider', '2026-09-10', '2026-09-30'],
  ['bn-5', 'Festive Offer', 'Homepage Slider', '2026-09-20', '2026-10-10'],
  ['bn-6', 'App Promotion', 'Below Slider', '2026-09-01', '2026-10-31'],
] as const).map(([img, title, position, from, to], i) => ({ id: img, title, image_url: asset(img), link_url: null, position, status: 'ACTIVE', starts_at: from, ends_at: to, sort_order: i }));

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
type Form = { id?: string | undefined; title: string; imageUrl: string | null; linkUrl: string; position: string; start: string; end: string; active: boolean };
const blank: Form = { title: '', imageUrl: null, linkUrl: '', position: BANNER_POSITIONS[0]!, start: '', end: '', active: true };

function Page() {
  const { rows, live, loading, reload } = useAdminData<BannerRow>(fetchBanners, demo);
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<Form>(blank);
  const [busy, setBusy] = useState(false);
  const now = Date.now();
  const scheduled = (b: BannerRow) => Boolean(b.starts_at && new Date(b.starts_at).getTime() > now);
  const shown = rows.filter((b) => b.title.toLowerCase().includes(query.toLowerCase()));

  function guard() {
    if (!live) { toast.info('Sample data — sign in with a staff account to manage real banners.'); return false; }
    return true;
  }
  async function submit() {
    if (!guard()) return;
    if (!form.title.trim() || !form.imageUrl) { toast.error('Banner title and image are required'); return; }
    setBusy(true);
    try {
      await saveBanner({ id: form.id, title: form.title, imageUrl: form.imageUrl, linkUrl: form.linkUrl, position: form.position, startsAt: form.start ? new Date(form.start).toISOString() : null, endsAt: form.end ? new Date(`${form.end}T23:59:59`).toISOString() : null, active: form.active });
      toast.success(form.id ? 'Banner updated' : 'Banner saved — it is now on the homepage');
      setForm(blank); void reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save the banner'); } finally { setBusy(false); }
  }
  async function toggle(b: BannerRow, v: boolean) {
    if (!guard()) return;
    try { await setBannerStatus(b.id, v); void reload(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); }
  }
  async function remove(b: BannerRow) {
    if (!guard()) return;
    if (!window.confirm(`Delete banner “${b.title}”?`)) return;
    try { await deleteBanner(b.id); toast.success('Banner deleted'); void reload(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete'); }
  }
  const edit = (b: BannerRow) => setForm({ id: b.id, title: b.title, imageUrl: b.image_url, linkUrl: b.link_url ?? '', position: b.position, start: b.starts_at?.slice(0, 10) ?? '', end: b.ends_at?.slice(0, 10) ?? '', active: b.status === 'ACTIVE' });
  const dateInput = 'h-10 min-w-0 flex-1 rounded-lg border border-line bg-white px-2 text-[13px] text-navy outline-none focus:border-[#077a52]';

  return (
    <div>
      <PageHeader title="Banners & Content" subtitle="Manage homepage banners, promotional content and other site content." badge={<DataBadge live={live} loading={loading} />} actions={<PrimaryAction icon={Plus} onClick={() => setForm(blank)}>Add New Banner</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Image} tone="green" label="Total Banners" value={String(rows.length)} delta={live ? undefined : '+20%'} filled={false} />
              <StatCard icon={Eye} tone="blue" label="Active Banners" value={String(rows.filter((b) => b.status === 'ACTIVE' && !scheduled(b)).length)} delta={live ? undefined : '+25%'} filled={false} />
              <StatCard icon={Clock} tone="amber" label="Scheduled Banners" value={String(rows.filter(scheduled).length)} delta={live ? undefined : '0%'} dir="flat" filled={false} />
              <StatCard icon={MinusCircle} tone="red" label="Inactive Banners" value={String(rows.filter((b) => b.status !== 'ACTIVE').length)} delta={live ? undefined : ''} dir="none" />
            </div>
            <Card className="mt-4">
              <Tabs items={['Banners', 'Homepage Sections', 'About Content', 'Policy Pages', 'Footer Content']} active={tab} onChange={setTab} />
              {tab === 0 ? (
                <>
                  <div className="flex items-center justify-between px-4 py-4">
                    <SearchBox placeholder="Search banners..." value={query} onChange={setQuery} className="w-[278px]" />
                    <FiltersButton />
                  </div>
                  <Table head={[<Checkbox key="c" />, '#', 'Banner Preview', 'Title', 'Location', 'Status', 'Display Period', 'Actions']}>
                    {shown.map((b, i) => (
                      <Tr key={b.id}>
                        <Td><Checkbox /></Td>
                        <Td>{i + 1}</Td>
                        <Td><img src={b.image_url} alt={b.title} className="h-[60px] w-[180px] rounded-md object-cover" /></Td>
                        <Td className="whitespace-nowrap">{b.title}</Td>
                        <Td><Badge tone="gray" className="!bg-[#f1f4f7] !px-2.5">{b.position === 'Below Slider' ? <span className="text-[#2f73d9]">{b.position}</span> : b.position}</Badge></Td>
                        <Td><span className="flex items-center gap-3"><Toggle key={`${b.id}${b.status}`} on={b.status === 'ACTIVE'} onChange={(v) => void toggle(b, v)} /><Badge tone={b.status === 'ACTIVE' ? (scheduled(b) ? 'amber' : 'green') : 'red'}>{b.status === 'ACTIVE' ? (scheduled(b) ? 'Scheduled' : 'Active') : 'Inactive'}</Badge></span></Td>
                        <Td className="whitespace-nowrap leading-tight text-slate">{day(b.starts_at)}<br />- {day(b.ends_at)}</Td>
                        <Td><span className="flex gap-2"><IconBtn icon={Pencil} label="Edit" onClick={() => edit(b)} /><IconBtn icon={Eye} label="Preview" onClick={() => window.open(b.image_url, '_blank')} /><IconBtn icon={Trash2} label="Delete" tone="danger" onClick={() => void remove(b)} /></span></Td>
                      </Tr>
                    ))}
                  </Table>
                  {!shown.length && <p className="px-5 py-10 text-center text-[14px] text-slate">No banners yet. Add one to show it on the homepage.</p>}
                  <Pagination text={`Showing 1-${shown.length} of ${rows.length} banners`} pages={[]} />
                </>
              ) : (
                <p className="px-6 py-12 text-center text-[14.5px] text-slate">Editing {['', 'homepage sections', 'the About page', 'policy pages', 'footer content'][tab]} will be available in a later update. Banners are live now.</p>
              )}
            </Card>
          </>
        }
        panel={
          <>
            <Panel title="Add / Edit Banner" onClose={() => setForm(blank)}>
              <div className="space-y-4">
                <Field label="Banner Title" required><Input value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Enter banner title" /></Field>
                <Field label="Banner Image" required><ImageUpload bucket="banners" value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} extra="Recommended size: 1920 × 600" /></Field>
                <Field label="Link URL"><Input value={form.linkUrl} onChange={(v) => setForm({ ...form, linkUrl: v })} placeholder="Enter link URL (e.g. /products or https://...)" /></Field>
                <Field label="Location" required><Select value={form.position} onChange={(v) => setForm({ ...form, position: v })}>{BANNER_POSITIONS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
                <Field label="Display Period">
                  <span className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0 text-navy" /><input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className={dateInput} aria-label="Start date" /><ArrowRight className="size-4 shrink-0 text-slate" /><input type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className={dateInput} aria-label="End date" /></span>
                </Field>
                <Field label="Status"><Select value={form.active ? 'ACTIVE' : 'INACTIVE'} onChange={(v) => setForm({ ...form, active: v === 'ACTIVE' })}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></Select></Field>
              </div>
              <FormButtons primary={form.id ? 'Save Changes' : 'Save Banner'} busy={busy} onCancel={() => setForm(blank)} onPrimary={() => void submit()} />
            </Panel>
            <TipCard>Use high-quality images with clear text to get better engagement.</TipCard>
          </>
        }
      />
    </div>
  );
}
