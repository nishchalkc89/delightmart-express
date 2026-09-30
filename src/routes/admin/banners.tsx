import { createFileRoute } from '@tanstack/react-router';
import { ArrowRight, CalendarDays, Clock, Eye, Image, MinusCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge, Card, DataBadge, Field, FilterSelect, IconBtn, PageHeader, Pagination, Panel, PrimaryAction, SearchBox, StatCard, Table, Tabs, Td, TipCard, Toggle, Tr, usePaged, WithPanel } from '@/components/delight/admin-ui';
import { FormButtons, ImageUpload, Input, Select } from '@/components/delight/admin-forms';
import { useAdminData } from '@/services/admin';
import { deleteBanner, fetchBanners, saveBanner, setBannerStatus, type BannerRow } from '@/services/admin-actions';
import { BANNER_POSITIONS } from '@/services/catalog';

export const Route = createFileRoute('/admin/banners')({
  head: () => ({ meta: [{ title: 'Banners & Content — Delight Admin' }, { name: 'description', content: 'Manage homepage banners and site content.' }, { property: 'og:title', content: 'Banners & Content — Delight Admin' }, { property: 'og:description', content: 'Content management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
type Form = { id?: string | undefined; title: string; imageUrl: string | null; linkUrl: string; position: string; start: string; end: string; active: boolean };
const blank: Form = { title: '', imageUrl: null, linkUrl: '', position: BANNER_POSITIONS[0]!, start: '', end: '', active: true };

function Page() {
  const { rows, live, loading, reload } = useAdminData<BannerRow>(fetchBanners);
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<Form>(blank);
  const [busy, setBusy] = useState(false);
  const now = Date.now();
  const scheduled = (b: BannerRow) => Boolean(b.starts_at && new Date(b.starts_at).getTime() > now);
  const ended = (b: BannerRow) => Boolean(b.ends_at && new Date(b.ends_at).getTime() < now);
  const tabFilters: Array<(b: BannerRow) => boolean> = [() => true, (b) => b.status === 'ACTIVE' && !scheduled(b) && !ended(b), scheduled, (b) => b.status !== 'ACTIVE' || ended(b)];
  const [place, setPlace] = useState('all');
  const shown = rows.filter((b) => tabFilters[tab]!(b) && b.title.toLowerCase().includes(query.toLowerCase()) && (place === 'all' || b.position === place));
  const pg = usePaged(shown, 20);

  function guard() {
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
              <StatCard icon={Image} tone="green" label="Total Banners" value={String(rows.length)} filled={false} />
              <StatCard icon={Eye} tone="blue" label="Active Banners" value={String(rows.filter((b) => b.status === 'ACTIVE' && !scheduled(b)).length)} filled={false} />
              <StatCard icon={Clock} tone="amber" label="Scheduled Banners" value={String(rows.filter(scheduled).length)} dir="flat" filled={false} />
              <StatCard icon={MinusCircle} tone="red" label="Inactive Banners" value={String(rows.filter((b) => b.status !== 'ACTIVE').length)} dir="none" />
            </div>
            <Card className="mt-4">
              <Tabs items={['All Banners', 'Live', 'Scheduled', 'Inactive / Ended'].map((t, i) => `${t} (${rows.filter(tabFilters[i]!).length})`)} active={tab} onChange={(i) => { setTab(i); pg.reset(); }} />
                <>
                  <div className="flex items-center justify-between px-4 py-4">
                    <SearchBox placeholder="Search banners..." value={query} onChange={setQuery} className="w-[278px]" />
                    <FilterSelect label="Location" value={place} onChange={(v) => { setPlace(v); pg.reset(); }} options={[['all', 'All Locations'], ...BANNER_POSITIONS.map((p): [string, string] => [p, p])]} className="w-[180px]" />
                  </div>
                  <Table head={['#', 'Banner Preview', 'Title', 'Location', 'Status', 'Display Period', 'Actions']}>
                    {pg.shown.map((b, i) => (
                      <Tr key={b.id}>
                        <Td>{pg.from + i}</Td>
                        <Td><img src={b.image_url} alt={b.title} className="h-[60px] w-[180px] rounded-md object-cover" /></Td>
                        <Td className="whitespace-nowrap">{b.title}</Td>
                        <Td><Badge tone="gray" className="!bg-[#f1f4f7] !px-2.5">{b.position === 'Below Slider' ? <span className="text-[#2f73d9]">{b.position}</span> : b.position}</Badge></Td>
                        <Td><span className="flex items-center gap-3"><Toggle key={`${b.id}${b.status}`} on={b.status === 'ACTIVE'} onChange={(v) => void toggle(b, v)} /><Badge tone={b.status === 'ACTIVE' ? (scheduled(b) ? 'amber' : 'green') : 'red'}>{b.status === 'ACTIVE' ? (scheduled(b) ? 'Scheduled' : 'Active') : 'Inactive'}</Badge></span></Td>
                        <Td className="whitespace-nowrap leading-tight text-slate">{day(b.starts_at)}<br />- {day(b.ends_at)}</Td>
                        <Td><span className="flex gap-2"><IconBtn icon={Pencil} label="Edit" onClick={() => edit(b)} /><IconBtn icon={Eye} label="Preview" onClick={() => window.open(b.image_url, '_blank')} /><IconBtn icon={Trash2} label="Delete" tone="danger" onClick={() => void remove(b)} /></span></Td>
                      </Tr>
                    ))}
                  </Table>
                  {!shown.length && <p className="px-5 py-10 text-center text-[14px] text-slate">{rows.length ? 'No banners in this view.' : 'No banners yet. Add one to show it on the homepage.'}</p>}
                  <Pagination text={`Showing ${pg.from}-${pg.to} of ${pg.total} banners`} current={pg.page} pageCount={pg.pageCount} onPage={pg.setPage} />
                </>
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
