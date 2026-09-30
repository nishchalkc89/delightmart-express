import { createFileRoute, Link } from '@tanstack/react-router';
import { ExternalLink, Eye, EyeOff, MessageSquare, Star, ThumbsUp, TriangleAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, Badge, Card, DataBadge, FilterBar, FilterSelect, IconBtn, inPeriod, PageHeader, Pagination, Panel, PanelTitle, PeriodSelect, SearchBox, StatCard, Table, Tabs, Td, Tr, usePaged, WithPanel } from '@/components/delight/admin-ui';
import { fmtDate, useAdminData } from '@/services/admin';
import { deleteReview, fetchReviews, setReviewStatus, type ReviewRow } from '@/services/admin-actions';

export const Route = createFileRoute('/admin/reviews')({
  head: () => ({ meta: [{ title: 'Reviews — Delight Admin' }, { name: 'description', content: 'Moderate customer product reviews.' }, { property: 'og:title', content: 'Reviews — Delight Admin' }, { property: 'og:description', content: 'Review moderation.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function StarRow({ n }: { n: number }) {
  return <span className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-4 ${i < n ? 'fill-star text-star' : 'fill-[#e5e7eb] text-[#e5e7eb]'}`} />)}</span>;
}

const label = (s: string) => (s === 'PUBLISHED' ? 'Published' : s === 'HIDDEN' ? 'Hidden' : 'Pending');

function Page() {
  const { rows, setRows, live, loading } = useAdminData<ReviewRow>(fetchReviews);
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [stars, setStars] = useState('all');
  const [period, setPeriod] = useState('all');
  const filters = [() => true, (r: ReviewRow) => r.status === 'PUBLISHED', (r: ReviewRow) => r.status === 'PENDING', (r: ReviewRow) => r.status === 'HIDDEN'];
  const shown = rows.filter((r) => filters[tab]!(r) && `${r.product} ${r.customer} ${r.review}`.toLowerCase().includes(query.toLowerCase())
    && (stars === 'all' || (stars === 'low' ? r.rating <= 2 : r.rating === Number(stars))) && inPeriod(r.createdAt, period));
  const pg = usePaged(shown, 20);
  const count = (i: number) => rows.filter(filters[i]!).length;
  const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;
  async function moderate(r: ReviewRow, status: 'PUBLISHED' | 'HIDDEN') {
    try {
      await setReviewStatus(r.id, status);
      setRows((list) => list.map((x) => (x.id === r.id ? { ...x, status } : x)));
      toast.success(status === 'PUBLISHED' ? 'Review published on the product page' : 'Review hidden');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update the review'); }
  }
  async function remove(r: ReviewRow) {
    if (!window.confirm(`Delete this review by ${r.customer}? This cannot be undone.`)) return;
    try {
      await deleteReview(r.id);
      setRows((list) => list.filter((x) => x.id !== r.id));
      toast.success('Review deleted');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete the review'); }
  }
  return (
    <div>
      <PageHeader title="Reviews" subtitle="Moderate customer reviews and keep product feedback helpful." badge={<DataBadge live={live} loading={loading} />} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={MessageSquare} tone="green" label="Total Reviews" value={String(rows.length)} filled={false} />
              <StatCard icon={Star} tone="amber" label="Average Rating" value={avg.toFixed(1)} />
              <StatCard icon={TriangleAlert} tone="blue" label="Pending Review" value={String(count(2))} dir="down" filled={false} />
              <StatCard icon={EyeOff} tone="red" label="Hidden Reviews" value={String(count(3))} dir="down" filled={false} />
            </div>
            <Card className="mt-4">
              <Tabs items={['All Reviews', 'Published', 'Pending', 'Hidden'].map((t, i) => `${t} (${count(i)})`)} active={tab} onChange={(i) => { setTab(i); pg.reset(); }} />
              <FilterBar>
                <SearchBox placeholder="Search by product, customer or review..." value={query} onChange={setQuery} className="w-[266px]" />
                <FilterSelect label="Rating" value={stars} onChange={(v) => { setStars(v); pg.reset(); }} options={[['all', 'All Ratings'], ['5', '5 stars'], ['4', '4 stars'], ['3', '3 stars'], ['2', '2 stars'], ['1', '1 star'], ['low', 'Low (1–2 stars)']]} className="w-[150px]" />
                <PeriodSelect value={period} onChange={(v) => { setPeriod(v); pg.reset(); }} />
              </FilterBar>
              <Table head={['Product', 'Customer', 'Rating', 'Review', 'Date', 'Status', 'Actions']}>
                {pg.shown.map((r) => (
                  <Tr key={r.id}>
                    <Td>{r.productSlug ? <Link to="/products/$slug" params={{ slug: r.productSlug }} target="_blank" className="flex items-center gap-1.5 leading-tight hover:text-[#077a52]">{r.product}<ExternalLink className="size-3.5 shrink-0 text-slate" /></Link> : <span className="leading-tight">{r.product}</span>}</Td>
                    <Td><span className="flex items-center gap-2.5 whitespace-nowrap"><Avatar name={r.customer} size="size-8" />{r.customer}</span></Td>
                    <Td><StarRow n={r.rating} /></Td>
                    <Td className="max-w-[240px] text-slate"><span className="line-clamp-2">{r.review}</span></Td>
                    <Td className="whitespace-nowrap text-slate">{fmtDate(r.createdAt)}</Td>
                    <Td><Badge tone={r.status === 'PUBLISHED' ? 'green' : r.status === 'PENDING' ? 'amber' : 'red'}>{label(r.status)}</Badge></Td>
                    <Td><span className="flex gap-2"><IconBtn icon={Eye} label="Publish" onClick={() => void moderate(r, 'PUBLISHED')} /><IconBtn icon={EyeOff} label="Hide" onClick={() => void moderate(r, 'HIDDEN')} /><IconBtn icon={Trash2} label="Delete review" tone="danger" onClick={() => void remove(r)} /></span></Td>
                  </Tr>
                ))}
              </Table>
              {!shown.length && <p className="px-5 py-10 text-center text-[14px] text-slate">{rows.length ? 'No reviews match these filters.' : 'No reviews yet. They appear here when customers rate products they bought.'}</p>}
              <Pagination text={`Showing ${pg.from}-${pg.to} of ${pg.total} reviews`} current={pg.page} pageCount={pg.pageCount} onPage={pg.setPage} />
            </Card>
          </>
        }
        panel={
          <div className="space-y-4">
            <Panel>
              <PanelTitle>Rating Breakdown</PanelTitle>
              <div className="flex items-end gap-3"><b className="text-[40px] font-extrabold leading-none text-navy">{avg.toFixed(1)}</b><span className="pb-1"><StarRow n={Math.round(avg)} /><span className="text-[13px] text-slate">{rows.length} reviews</span></span></div>
              <ul className="mt-4 space-y-2.5">
                {([5, 4, 3, 2, 1].map((n) => [n, rows.length ? Math.round((rows.filter((r) => r.rating === n).length / rows.length) * 100) : 0])).map(([n, pct]) => (
                  <li key={n} className="flex items-center gap-3 text-[13px] text-navy">
                    <span className="flex w-8 items-center gap-1">{n}<Star className="size-3.5 fill-star text-star" /></span>
                    <span className="h-2 flex-1 rounded-full bg-[#eef1f4]"><span className="block h-full rounded-full bg-[#0a8a5b]" style={{ width: `${pct}%` }} /></span>
                    <span className="w-9 text-right text-slate">{pct}%</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel>
              <PanelTitle>Moderation Guide</PanelTitle>
              <ul className="space-y-3 text-[13.5px] text-slate">
                <li className="flex gap-2.5"><ThumbsUp className="size-4 shrink-0 text-[#0a8a5b]" />Publish honest reviews, including critical ones.</li>
                <li className="flex gap-2.5"><EyeOff className="size-4 shrink-0 text-[#e3101a]" />Hide spam, abuse or personal information.</li>
                <li className="flex gap-2.5"><MessageSquare className="size-4 shrink-0 text-[#2f73d9]" />Reply to issues and follow up on the order.</li>
              </ul>
            </Panel>
          </div>
        }
      />
    </div>
  );
}
