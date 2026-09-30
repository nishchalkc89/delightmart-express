import { createFileRoute } from '@tanstack/react-router';
import { Eye, EyeOff, MessageSquare, Star, ThumbsUp, TriangleAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, Badge, Card, Checkbox, DataBadge, DateRange, FilterBar, FiltersButton, IconBtn, PageHeader, Pagination, Panel, PanelTitle, SearchBox, SelectBox, StatCard, Table, Tabs, Td, Tr, WithPanel } from '@/components/delight/admin-ui';
import { adminProducts as ap, people } from '@/components/delight/admin-data';
import { fmtDate, useAdminData } from '@/services/admin';
import { fetchReviews, setReviewStatus, type ReviewRow } from '@/services/admin-actions';

export const Route = createFileRoute('/admin/reviews')({
  head: () => ({ meta: [{ title: 'Reviews — Delight Admin' }, { name: 'description', content: 'Moderate customer product reviews.' }, { property: 'og:title', content: 'Reviews — Delight Admin' }, { property: 'og:description', content: 'Review moderation.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

// Follows the approved admin layout; no dedicated Reviews reference screen was supplied.
const reviews = [
  [ap[0]!, people.sujan, 5, 'Great quality rice, cooks perfectly every time.', '27 Sep 2026', 'Published'],
  [ap[1]!, people.aarati, 4, 'Quick delivery and fresh stock.', '26 Sep 2026', 'Published'],
  [ap[2]!, people.bikash, 3, 'Good lotion but the bottle was slightly dented.', '25 Sep 2026', 'Pending'],
  [ap[4]!, people.sangita, 5, 'Works really well on tough stains.', '24 Sep 2026', 'Published'],
  [ap[5]!, people.ramesh, 2, 'Apples were not as fresh as expected.', '24 Sep 2026', 'Pending'],
  [ap[7]!, people.sita, 5, 'My family’s favourite toothpaste.', '23 Sep 2026', 'Published'],
  [ap[3]!, people.kiran, 1, 'Spam link removed by moderator.', '22 Sep 2026', 'Hidden'],
  [ap[6]!, people.prabin, 4, 'Soft rotis, good value for money.', '21 Sep 2026', 'Published'],
] as const;

function StarRow({ n }: { n: number }) {
  return <span className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-4 ${i < n ? 'fill-star text-star' : 'fill-[#e5e7eb] text-[#e5e7eb]'}`} />)}</span>;
}

const demo: ReviewRow[] = reviews.map(([p, who, rating, text, date, st], i) => ({ id: String(i), product: p.short, productSlug: '', customer: who.name, rating, review: text, status: st.toUpperCase(), createdAt: date, image: p.img }));
const label = (s: string) => (s === 'PUBLISHED' ? 'Published' : s === 'HIDDEN' ? 'Hidden' : 'Pending');
const imageFor = (r: ReviewRow) => ('image' in r ? String((r as { image: string }).image) : ap.find((p) => p.name.toLowerCase().startsWith(r.product.toLowerCase().slice(0, 10)))?.img);

function Page() {
  const { rows, setRows, live, loading } = useAdminData<ReviewRow>(fetchReviews, demo);
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const filters = [() => true, (r: ReviewRow) => r.status === 'PUBLISHED', (r: ReviewRow) => r.status === 'PENDING', (r: ReviewRow) => r.status === 'HIDDEN'];
  const shown = rows.filter((r) => filters[tab]!(r) && `${r.product} ${r.customer} ${r.review}`.toLowerCase().includes(query.toLowerCase()));
  const count = (i: number) => rows.filter(filters[i]!).length;
  const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;
  async function moderate(r: ReviewRow, status: 'PUBLISHED' | 'HIDDEN') {
    if (!live) { toast.info('Sample data — sign in with a staff account to moderate real reviews.'); return; }
    try {
      await setReviewStatus(r.id, status);
      setRows((list) => list.map((x) => (x.id === r.id ? { ...x, status } : x)));
      toast.success(status === 'PUBLISHED' ? 'Review published on the product page' : 'Review hidden');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update the review'); }
  }
  return (
    <div>
      <PageHeader title="Reviews" subtitle="Moderate customer reviews and keep product feedback helpful." badge={<DataBadge live={live} loading={loading} />} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={MessageSquare} tone="green" label="Total Reviews" value={live ? String(rows.length) : '1,086'} delta={live ? undefined : '+14%'} filled={false} />
              <StatCard icon={Star} tone="amber" label="Average Rating" value={live ? avg.toFixed(1) : '4.6'} delta={live ? undefined : '+0.2'} />
              <StatCard icon={TriangleAlert} tone="blue" label="Pending Review" value={live ? String(count(2)) : '12'} delta={live ? undefined : '-8%'} dir="down" filled={false} />
              <StatCard icon={EyeOff} tone="red" label="Hidden Reviews" value={live ? String(count(3)) : '7'} delta={live ? undefined : '+2'} dir="down" filled={false} />
            </div>
            <Card className="mt-4">
              <Tabs items={['All Reviews', 'Published', 'Pending', 'Hidden'].map((t, i) => `${t} (${live ? count(i) : ['1,086', '1,067', '12', '7'][i]})`)} active={tab} onChange={setTab} />
              <FilterBar>
                <SearchBox placeholder="Search by product, customer or review..." value={query} onChange={setQuery} className="w-[266px]" />
                <SelectBox label="All Ratings" className="w-[130px]" />
                <SelectBox label="All Status" className="w-[130px]" />
                <DateRange />
                <FiltersButton />
              </FilterBar>
              <Table head={[<Checkbox key="c" />, 'Product', 'Customer', 'Rating', 'Review', 'Date', 'Status', 'Actions']}>
                {shown.map((r) => (
                  <Tr key={r.id}>
                    <Td><Checkbox /></Td>
                    <Td><span className="flex items-center gap-3">{imageFor(r) ? <img src={imageFor(r)} alt="" className="size-9 shrink-0 object-contain" /> : null}<span className="leading-tight">{r.product}</span></span></Td>
                    <Td><span className="flex items-center gap-2.5 whitespace-nowrap"><Avatar src={Object.values(people).find((x) => x.name === r.customer)?.avatar} name={r.customer} size="size-8" />{r.customer}</span></Td>
                    <Td><StarRow n={r.rating} /></Td>
                    <Td className="max-w-[240px] text-slate"><span className="line-clamp-2">{r.review}</span></Td>
                    <Td className="whitespace-nowrap text-slate">{live ? fmtDate(r.createdAt) : r.createdAt}</Td>
                    <Td><Badge tone={r.status === 'PUBLISHED' ? 'green' : r.status === 'PENDING' ? 'amber' : 'red'}>{label(r.status)}</Badge></Td>
                    <Td><span className="flex gap-2"><IconBtn icon={Eye} label="Publish" onClick={() => void moderate(r, 'PUBLISHED')} /><IconBtn icon={EyeOff} label="Hide" onClick={() => void moderate(r, 'HIDDEN')} /><IconBtn icon={Trash2} label="Hide permanently" tone="danger" onClick={() => void moderate(r, 'HIDDEN')} /></span></Td>
                  </Tr>
                ))}
              </Table>
              {!shown.length && <p className="px-5 py-10 text-center text-[14px] text-slate">No reviews in this view yet.</p>}
              <Pagination text={`Showing 1-${shown.length} of ${live ? rows.length : '1,086'} reviews`} pages={live ? [1] : [1, 2, 3, 4, 5, '…', 136]} perPage="8 per page" />
            </Card>
          </>
        }
        panel={
          <div className="space-y-4">
            <Panel>
              <PanelTitle>Rating Breakdown</PanelTitle>
              <div className="flex items-end gap-3"><b className="text-[40px] font-extrabold leading-none text-navy">{live ? avg.toFixed(1) : '4.6'}</b><span className="pb-1"><StarRow n={Math.round(live ? avg : 5)} /><span className="text-[13px] text-slate">{live ? rows.length : '1,086'} reviews</span></span></div>
              <ul className="mt-4 space-y-2.5">
                {(live ? [5, 4, 3, 2, 1].map((n) => [n, rows.length ? Math.round((rows.filter((r) => r.rating === n).length / rows.length) * 100) : 0]) : [[5, 68], [4, 20], [3, 7], [2, 3], [1, 2]]).map(([n, pct]) => (
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
