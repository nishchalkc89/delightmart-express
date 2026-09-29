import { createFileRoute } from '@tanstack/react-router';
import { CalendarDays, CircleCheck, Clock, Copy, Info, MinusCircle, Pencil, Percent, Plus, Tag, Trash2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Badge, Card, Checkbox, DateRange, Dropdown, Field, FilterBar, FiltersButton, IconBtn, PageHeader, Pagination, Panel, PanelButtons, PrimaryAction, SearchBox, SelectBox, StatCard, Status, Table, Tabs, Td, TextArea, TextInput, Toggle, Tr, WithPanel, type BadgeTone } from '@/components/delight/admin-ui';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/admin/offers')({
  head: () => ({ meta: [{ title: 'Offers & Coupons — Delight Admin' }, { name: 'description', content: 'Create and manage discounts and coupons.' }, { property: 'og:title', content: 'Offers & Coupons — Delight Admin' }, { property: 'og:description', content: 'Promotions management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const typeTone: Record<string, BadgeTone> = { Category: 'pink', Coupon: 'blue', Product: 'green', Shipping: 'purple' };
const offers = [
  ['offer-dashain', 'Dashain Special', 'Big savings this festival season', 'Category', '20% OFF', '', '20 Sep – 15 Oct 2026', '124 / 500'],
  ['offer-welcome', 'Welcome100', 'For first time customers', 'Coupon', 'NPR 100 OFF', 'Min. order: NPR 500', '01 Sep – 31 Dec 2026', '320 / 1,000'],
  ['offer-grocery', 'Grocery Essentials', 'Save on daily essentials', 'Category', '15% OFF', '', '18 Sep – 30 Sep 2026', '86 / 500'],
  ['offer-bogo', 'Buy 1 Get 1', 'Selected skincare products', 'Product', 'Buy 1 Get 1', '', '15 Sep – 15 Oct 2026', '45 / 200'],
  ['offer-student', 'Student Discount', 'For verified students', 'Coupon', '10% OFF', 'Min. order: NPR 300', '01 Sep – 31 Dec 2026', '190 / 1,000'],
  ['offer-weekend', 'Weekend Deal', 'Special offer every weekend', 'Category', '25% OFF', '', 'Every Fri – Sun', '310 / 1,000'],
  ['offer-delivery', 'Free Delivery', 'On orders above NPR 1,000', 'Shipping', 'Free Delivery', 'Min. order: NPR 1,000', '01 Sep – 31 Oct 2026', '480 / 2,000'],
  ['offer-clearance', 'Clearance Sale', 'Limited stock, big discounts', 'Product', 'Up to 50% OFF', '', '01 Sep – 30 Sep 2026', '92 / 300'],
] as const;

function Page() {
  const [tab, setTab] = useState(0);
  const [type, setType] = useState(1);
  const [pct, setPct] = useState(true);

  return (
    <div>
      <PageHeader title="Offers & Coupons" subtitle="Create and manage discounts, coupons and special offers to boost your sales." actions={<PrimaryAction icon={Plus}>Create Offer</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Tag} tone="green" label="Total Offers" value="24" delta="+20%" />
              <StatCard icon={Percent} tone="blue" label="Active Offers" value="18" delta="+12%" filled={false} />
              <StatCard icon={Clock} tone="amber" label="Upcoming Offers" value="4" delta="+33%" filled={false} />
              <StatCard icon={MinusCircle} tone="red" label="Expired Offers" value="2" delta="-50%" dir="down" />
            </div>
            <Card className="mt-4">
              <Tabs items={['All Offers (24)', 'Product Offers (10)', 'Category Offers (6)', 'Coupons (5)', 'Upcoming (4)', 'Expired (2)']} active={tab} onChange={setTab} />
              <FilterBar>
                <SearchBox placeholder="Search offers, coupon codes..." className="w-[232px]" />
                <SelectBox label="All Types" className="w-[122px]" />
                <SelectBox label="All Status" className="w-[138px]" />
                <DateRange />
                <FiltersButton />
              </FilterBar>
              <Table head={[<Checkbox key="c" />, '#', 'Offer Name', 'Type', 'Discount', 'Validity', 'Status', 'Usage', 'Actions']}>
                {offers.map(([img, name, sub, t, disc, min, valid, usage], i) => (
                  <Tr key={name}>
                    <Td><Checkbox /></Td>
                    <Td>{i + 1}</Td>
                    <Td><span className="flex items-center gap-3"><img src={asset(img)} alt="" className="size-10 rounded object-contain" /><span className="leading-tight"><span className="block">{name}</span><span className="text-[12px] text-slate">{sub}</span></span></span></Td>
                    <Td><Badge tone={typeTone[t]!}>{t}</Badge></Td>
                    <Td className="leading-tight"><b className="block font-semibold">{disc}</b>{min && <span className="text-[12px] text-slate">{min}</span>}</Td>
                    <Td className="whitespace-nowrap text-slate">{valid}</Td>
                    <Td><Status value="Active" /></Td>
                    <Td className="whitespace-nowrap text-slate">{usage}</Td>
                    <Td><span className="flex gap-2"><IconBtn icon={Pencil} label="Edit" /><IconBtn icon={Copy} label="Duplicate" /><IconBtn icon={Trash2} label="Delete" tone="danger" /></span></Td>
                  </Tr>
                ))}
              </Table>
              <Pagination text="Showing 1-8 of 24 offers" pages={[1, 2, 3]} perPage="8 per page" />
            </Card>
          </>
        }
        panel={
          <Panel title="Create New Offer" onClose={() => undefined}>
            <Field label="Offer Type" required>
              <div className="grid grid-cols-4 gap-1.5">
                {['Product', 'Category', 'Coupon', 'Shipping'].map((t, i) => <button key={t} type="button" onClick={() => setType(i)} className={`h-9 rounded-md border text-[12.5px] ${i === type ? 'border-[#0a8a5b] bg-[#f0fbf5] font-semibold text-[#077a52]' : 'border-line bg-[#f7f9fb] text-slate'}`}>{t}</button>)}
              </div>
            </Field>
            <div className="mt-5 space-y-4">
              <Field label="Offer Name" required><TextInput placeholder="Enter offer name" /></Field>
              <Field label="Select Category" required><Dropdown label="Select category" /></Field>
              <Field label="Discount Type" required>
                <div className="grid grid-cols-2 gap-3">
                  {['Percentage', 'Fixed Amount'].map((t, i) => {
                    const on = (i === 0) === pct;
                    return <button key={t} type="button" onClick={() => setPct(i === 0)} className={`flex h-10 items-center justify-center gap-2 rounded-lg border text-[13.5px] ${on ? 'border-[#0a8a5b] bg-[#f0fbf5] text-[#077a52]' : 'border-line text-navy'}`}>{on ? <CircleCheck className="size-5 fill-[#0a8a5b] text-white" /> : <span className="size-4 rounded-full border-2 border-[#b6bec8]" />}{t}</button>;
                  })}
                </div>
              </Field>
              <Field label="Discount Value" required><TextInput placeholder={pct ? 'Enter percentage' : 'Enter amount'} suffix={pct ? '%' : 'NPR'} /></Field>
              <Field label="Validity Period" required>
                <span className="flex h-10 items-center gap-3 rounded-lg border border-line px-3 text-[13.5px] text-slate"><CalendarDays className="size-4 text-navy" /> Start Date <ArrowRight className="ml-auto size-4" /> <span className="mr-auto">End Date</span></span>
              </Field>
              <Field label="Description"><TextArea placeholder="Enter offer description..." max={200} rows={3} /></Field>
            </div>
            <label className="mt-2 flex items-center gap-3 text-[14px] text-navy"><Toggle /> Active</label>
            <PanelButtons primary="Create Offer" />
            <p className="mt-3 flex items-center gap-2 text-[12px] text-slate"><Info className="size-4 fill-navy text-white" /> This offer will be applied automatically at checkout.</p>
          </Panel>
        }
      />
    </div>
  );
}
