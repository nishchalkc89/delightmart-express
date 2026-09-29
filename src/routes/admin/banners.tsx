import { createFileRoute } from '@tanstack/react-router';
import { ArrowRight, CalendarDays, Clock, Eye, Image, MinusCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge, Card, Checkbox, Dropdown, Field, FiltersButton, IconBtn, PageHeader, Pagination, Panel, PanelButtons, PrimaryAction, SearchBox, StatCard, Table, Tabs, Td, TextInput, TipCard, Toggle, Tr, UploadBox, WithPanel } from '@/components/delight/admin-ui';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/admin/banners')({
  head: () => ({ meta: [{ title: 'Banners & Content — Delight Admin' }, { name: 'description', content: 'Manage homepage banners and site content.' }, { property: 'og:title', content: 'Banners & Content — Delight Admin' }, { property: 'og:description', content: 'Content management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const banners = [
  ['bn-1', 'Fresh Groceries', 'Homepage Slider', '20 Sep 2026', '30 Sep 2026'],
  ['bn-2', 'Fashion Collection', 'Homepage Slider', '15 Sep 2026', '15 Oct 2026'],
  ['bn-3', 'Electronics Sale', 'Homepage Slider', '01 Sep 2026', '30 Sep 2026'],
  ['bn-4', 'Home Essentials', 'Homepage Slider', '10 Sep 2026', '30 Sep 2026'],
  ['bn-5', 'Festive Offer', 'Homepage Slider', '20 Sep 2026', '10 Oct 2026'],
  ['bn-6', 'App Promotion', 'Below Slider', '01 Sep 2026', '31 Oct 2026'],
] as const;

function Page() {
  const [tab, setTab] = useState(0);

  return (
    <div>
      <PageHeader title="Banners & Content" subtitle="Manage homepage banners, promotional content and other site content." actions={<PrimaryAction icon={Plus}>Add New Banner</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Image} tone="green" label="Total Banners" value="6" delta="+20%" filled={false} />
              <StatCard icon={Eye} tone="blue" label="Active Banners" value="5" delta="+25%" filled={false} />
              <StatCard icon={Clock} tone="amber" label="Scheduled Banners" value="1" delta="0%" dir="flat" filled={false} />
              <StatCard icon={MinusCircle} tone="red" label="Inactive Banners" value="0" delta="" dir="none" />
            </div>
            <Card className="mt-4">
              <Tabs items={['Banners', 'Homepage Sections', 'About Content', 'Policy Pages', 'Footer Content']} active={tab} onChange={setTab} />
              <div className="flex items-center justify-between px-4 py-4">
                <SearchBox placeholder="Search banners..." className="w-[278px]" />
                <FiltersButton />
              </div>
              <Table head={[<Checkbox key="c" />, '#', 'Banner Preview', 'Title', 'Location', 'Status', 'Display Period', 'Actions']}>
                {banners.map(([img, title, loc, from, to], i) => (
                  <Tr key={title}>
                    <Td><Checkbox /></Td>
                    <Td>{i + 1}</Td>
                    <Td><img src={asset(img)} alt={title} className="h-[60px] w-[180px] rounded-md object-cover" /></Td>
                    <Td className="whitespace-nowrap">{title}</Td>
                    <Td><Badge tone={loc === 'Below Slider' ? 'blue' : 'gray'} className="!bg-[#f1f4f7] !px-2.5">{loc === 'Below Slider' ? <span className="text-[#2f73d9]">{loc}</span> : loc}</Badge></Td>
                    <Td><span className="flex items-center gap-3"><Toggle /><Badge tone="green">Active</Badge></span></Td>
                    <Td className="whitespace-nowrap leading-tight text-slate">{from}<br />- {to}</Td>
                    <Td><span className="flex gap-2"><IconBtn icon={Pencil} label="Edit" /><IconBtn icon={Eye} label="Preview" /><IconBtn icon={Trash2} label="Delete" tone="danger" /></span></Td>
                  </Tr>
                ))}
              </Table>
              <Pagination text="Showing 1-6 of 6 banners" pages={[]} />
            </Card>
          </>
        }
        panel={
          <>
            <Panel title="Add / Edit Banner" onClose={() => undefined}>
              <div className="space-y-4">
                <Field label="Banner Title" required><TextInput placeholder="Enter banner title" /></Field>
                <Field label="Banner Image" required><UploadBox extra="Recommended size: 1920 × 600" /></Field>
                <Field label="Link URL"><TextInput placeholder="Enter link URL (e.g. /products or https://...)" /></Field>
                <Field label="Location" required><Dropdown label="Homepage Slider" /></Field>
                <Field label="Display Period">
                  <span className="flex h-10 items-center gap-3 rounded-lg border border-line px-3 text-[13.5px] text-slate"><CalendarDays className="size-4 text-navy" /> Start Date <ArrowRight className="ml-auto size-4" /> <span className="mr-auto">End Date</span></span>
                </Field>
                <Field label="Status"><Dropdown label="Active" /></Field>
              </div>
              <PanelButtons primary="Save Banner" />
            </Panel>
            <TipCard>Use high-quality images with clear text to get better engagement.</TipCard>
          </>
        }
      />
    </div>
  );
}
