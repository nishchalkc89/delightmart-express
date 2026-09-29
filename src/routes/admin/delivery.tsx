import { createFileRoute } from '@tanstack/react-router';
import { Box, ChevronRight, CircleCheck, CircleX, Ellipsis, Eye, MapPin, Plus, Settings, Truck, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, Badge, Card, Checkbox, DateRange, FilterBar, FiltersButton, IconBtn, PageHeader, Pagination, Panel, PanelTitle, PrimaryAction, SearchBox, SelectBox, StatCard, Table, Tabs, Td, Tr, WithPanel, type BadgeTone } from '@/components/delight/admin-ui';
import { people } from '@/components/delight/admin-data';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/admin/delivery')({
  head: () => ({ meta: [{ title: 'Delivery Management — Delight Admin' }, { name: 'description', content: 'Manage deliveries and delivery staff.' }, { property: 'og:title', content: 'Delivery Management — Delight Admin' }, { property: 'og:description', content: 'Delivery operations.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const tone: Record<string, BadgeTone> = { Delivered: 'green', 'Out for Delivery': 'blue', Processing: 'amber', Failed: 'red' };
const rows = [
  ['#10251', people.sujan, 'Tulsipur', 'Ramesh D.', 'Delivered', '27 Sep 2026'],
  ['#10250', people.aarati, 'Tulsipur', 'Suman K.', 'Out for Delivery', '28 Sep 2026'],
  ['#10249', people.bikash, 'Ghorahi', 'Dipesh R.', 'Processing', '29 Sep 2026'],
  ['#10248', people.sangita, 'Tulsipur', 'Ramesh D.', 'Delivered', '25 Sep 2026'],
  ['#10247', people.ramesh, 'Lamahi', 'Anil S.', 'Out for Delivery', '26 Sep 2026'],
  ['#10246', people.sita, 'Tulsipur', 'Suman K.', 'Failed', '24 Sep 2026'],
  ['#10245', people.kiran, 'Dang', 'Dipesh R.', 'Delivered', '22 Sep 2026'],
  ['#10244', people.prabin, 'Tulsipur', 'Ramesh D.', 'Processing', '23 Sep 2026'],
  ['#10243', people.anjali, 'Ghorahi', 'Suman K.', 'Out for Delivery', '24 Sep 2026'],
  ['#10242', people.dipesh, 'Lamahi', 'Anil S.', 'Delivered', '20 Sep 2026'],
] as const;
const partners = [[people.ramesh, 'Ramesh D.', 48, '96%'], [people.kiran, 'Suman K.', 42, '93%'], [people.dipesh, 'Dipesh R.', 38, '89%'], [people.bikash, 'Anil S.', 27, '85%']] as const;

function Page() {
  const [tab, setTab] = useState(0);
  const [tracking, setTracking] = useState('');

  return (
    <div>
      <PageHeader title="Delivery Management" subtitle="Manage your delivery partners, track deliveries in real-time and ensure on-time delivery." actions={<PrimaryAction icon={Plus}>Assign Delivery</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Truck} tone="green" label="Total Deliveries" value="346" delta="+18%" />
              <StatCard icon={Box} tone="blue" label="Out for Delivery" value="72" delta="+12%" />
              <StatCard icon={CircleCheck} tone="amber" label="Delivered" value="258" delta="+25%" />
              <StatCard icon={CircleX} tone="red" label="Failed / Returned" value="16" delta="-8%" dir="down" />
            </div>
            <Card className="mt-4">
              <Tabs items={['All Deliveries (346)', 'Out for Delivery (72)', 'Delivered (258)', 'Failed (16)', 'Delivery Partners (8)']} active={tab} onChange={setTab} />
              <FilterBar>
                <SearchBox placeholder="Search by order ID, customer name or tracking ID..." className="w-[292px]" />
                <SelectBox label="All Status" className="w-[104px]" />
                <SelectBox label="All Delivery Partners" className="w-[140px]" />
                <DateRange />
                <FiltersButton />
              </FilterBar>
              <Table head={[<Checkbox key="c" />, '#', 'Order ID', 'Customer', 'Location', 'Delivery Partner', 'Status', 'Estimated Delivery', 'Actions']}>
                {rows.map(([id, who, loc, partner, st, eta], i) => (
                  <Tr key={id}>
                    <Td><Checkbox /></Td>
                    <Td>{i + 1}</Td>
                    <Td>{id}</Td>
                    <Td><span className="flex items-center gap-2.5 whitespace-nowrap"><Avatar src={who.avatar} name={who.name} size="size-8" />{who.name}</span></Td>
                    <Td className="text-slate">{loc}</Td>
                    <Td className="whitespace-nowrap">{partner}</Td>
                    <Td><Badge tone={tone[st]!}>{st}</Badge></Td>
                    <Td className="whitespace-nowrap text-slate">{eta}</Td>
                    <Td><span className="flex gap-2"><IconBtn icon={Eye} label="View" /><IconBtn icon={MapPin} label="Track" /><IconBtn icon={Ellipsis} label="More" /></span></Td>
                  </Tr>
                ))}
              </Table>
              <Pagination text="Showing 1-10 of 346 deliveries" pages={[1, 2, 3, 4, 5, '…', 35]} />
            </Card>
          </>
        }
        panel={
          <div className="space-y-4">
            <Panel>
              <PanelTitle>Delivery Tracking</PanelTitle>
              <form onSubmit={(e) => { e.preventDefault(); toast.info(tracking ? `Tracking ${tracking}` : 'Enter a tracking or order ID'); }} className="flex gap-2">
                <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Enter tracking ID or order ID" className="h-10 min-w-0 flex-1 rounded-lg border border-line px-3 text-[13.5px] outline-none focus:border-[#077a52]" />
                <button className="rounded-lg bg-[#077a52] px-4 text-[14px] font-semibold text-white">Track</button>
              </form>
            </Panel>
            <Panel>
              <PanelTitle link="View Full Map">Live Delivery Map</PanelTitle>
              <img src={asset('delivery-map')} alt="Live map of delivery in progress around Tulsipur" className="w-full rounded-lg" />
              <div className="mb-2 mt-5 flex items-center justify-between"><h3 className="text-[15px] font-bold text-navy">Delivery Partner Performance</h3><button className="text-[13px] font-medium text-[#2f73d9]">View All</button></div>
              <ul className="space-y-2.5">
                {partners.map(([p, name, count, rate]) => (
                  <li key={name} className="flex items-center gap-3">
                    <Avatar src={p.avatar} name={name} />
                    <span className="flex-1 leading-tight"><span className="block text-[14px] text-navy">{name}</span><span className="text-[12px] text-slate">{count} deliveries</span></span>
                    <span className="text-right leading-tight"><b className="block text-[14px] font-bold text-[#0a8a5b]">{rate}</b><span className="text-[12px] text-[#0a8a5b]">On-time</span></span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel>
              <PanelTitle>Quick Actions</PanelTitle>
              {([[UsersRound, 'Manage Delivery Partners'], [Settings, 'Delivery Settings']] as const).map(([Icon, label]) => (
                <button key={label} className="mb-2.5 flex h-12 w-full items-center gap-3 rounded-lg border border-line px-4 text-[14px] text-navy last:mb-0"><Icon className="size-5" />{label}<ChevronRight className="ml-auto size-4 text-slate" /></button>
              ))}
            </Panel>
          </div>
        }
      />
    </div>
  );
}
