import { createFileRoute } from '@tanstack/react-router';
import { ChevronDown, ChevronRight, Download, Folder, Layers, Lock, Package, Pencil, Plus, SquarePlus, Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Badge, Card, Dropdown, Field, IconBtn, PageHeader, Panel, PanelButtons, PrimaryAction, SearchBox, SelectBox, StatCard, Table, Td, TextArea, TextInput, TipCard, Toggle, Tr, UploadBox, WithPanel } from '@/components/delight/admin-ui';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/admin/categories')({
  head: () => ({ meta: [{ title: 'Categories — Delight Admin' }, { name: 'description', content: 'Organize products into categories.' }, { property: 'og:title', content: 'Categories — Delight Admin' }, { property: 'og:description', content: 'Category management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const cats = [
  ['Groceries', 'cat-groceries', 320, true, '12 Aug 2026', [['Rice & Dal', 'cat-rice-dal', 45], ['Fruits & Vegetables', 'cat-fruits-veg', 62], ['Spices & Masala', 'cat-spices', 38], ['Oil & Ghee', 'cat-oil-ghee', 28]]],
  ['Dairy & Eggs', 'cat-dairy', 86, true, '13 Aug 2026', []],
  ['Snacks & Beverages', 'cat-snacks', 150, true, '14 Aug 2026', []],
  ['Atta, Rice & Dal', 'cat-atta', 75, true, '14 Aug 2026', []],
  ['Household Essentials', 'cat-household', 120, true, '15 Aug 2026', []],
  ['Personal Care', 'cat-personal', 110, true, '16 Aug 2026', []],
  ['Baby Care', 'cat-baby', 68, true, '16 Aug 2026', []],
  ['Kitchen & Home', 'cat-kitchen', 72, true, '17 Aug 2026', []],
  ['Stationery & Office', 'cat-stationery', 54, true, '17 Aug 2026', []],
  ['Fashion & Lifestyle', 'cat-fashion', 96, true, '18 Aug 2026', []],
  ['Toys & Kids', 'cat-toys', 48, true, '18 Aug 2026', []],
  ['Skincare & Beauty', 'cat-skincare', 49, false, '19 Aug 2026', []],
] as const;

function Page() {
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });

  return (
    <div>
      <PageHeader title="Categories" subtitle="Organize your products into categories and subcategories." actions={<PrimaryAction icon={Plus}>Add Category</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Layers} tone="green" label="Total Categories" value="12" delta="+2" />
              <StatCard icon={Folder} tone="blue" label="Active Categories" value="11" delta="+10%" />
              <StatCard icon={Lock} tone="red" label="Inactive Categories" value="1" delta="-50%" dir="down" />
              <StatCard icon={Package} tone="purple" label="Total Products" value="1,248" delta="+12%" />
            </div>
            <Card className="mt-4">
              <div className="flex items-center gap-3 px-4 py-4">
                <SearchBox placeholder="Search categories..." className="w-[328px]" />
                <button onClick={() => setOpen(Object.fromEntries(cats.map((_, i) => [i, true])))} className="ml-auto flex h-[40px] items-center gap-2 rounded-lg border border-line px-4 text-[14px] font-semibold text-navy"><Download className="size-4" /> Expand All</button>
                <SelectBox label="Sort by: Name (A-Z)" className="w-[182px]" />
              </div>
              <Table head={['#', 'Category Name', 'Image', 'Products', 'Status', 'Created At', 'Actions']}>
                {cats.map(([name, img, count, active, date, subs], i) => (
                  <Fragment key={name}>
                    <Tr>
                      <Td><span className="grid size-6 place-items-center rounded-md bg-[#f1f4f7] text-[12.5px]">{i + 1}</span></Td>
                      <Td>
                        <button onClick={() => setOpen({ ...open, [i]: !open[i] })} className="flex items-center gap-4">
                          {open[i] ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}{name}
                        </button>
                      </Td>
                      <Td><img src={asset(img)} alt="" className="h-8 w-10 object-contain" /></Td>
                      <Td className="text-slate">{count} products</Td>
                      <Td><span className="flex items-center gap-3"><Toggle on={active} /><Badge tone={active ? 'green' : 'red'}>{active ? 'Active' : 'Inactive'}</Badge></span></Td>
                      <Td className="text-slate">{date}</Td>
                      <Td><span className="flex gap-2"><IconBtn icon={Pencil} label="Edit" /><IconBtn icon={SquarePlus} label="Add subcategory" /><IconBtn icon={Trash2} label="Delete" tone="danger" /></span></Td>
                    </Tr>
                    {open[i] && subs.map(([sub, simg, scount], k) => (
                      <Tr key={sub}>
                        <Td />
                        <Td><span className="flex items-center gap-3 pl-5"><span className={`h-[34px] w-4 border-l border-[#c9d1da] ${k === subs.length - 1 ? 'mb-4 h-[18px] border-b' : ''}`} /><span className="-ml-3 mr-1 h-px w-3 bg-[#c9d1da]" />{sub}</span></Td>
                        <Td><img src={asset(simg)} alt="" className="h-8 w-10 object-contain" /></Td>
                        <Td className="text-slate">{scount} products</Td>
                        <Td><span className="flex items-center gap-3"><Toggle /><Badge tone="green">Active</Badge></span></Td>
                        <Td className="text-slate">12 Aug 2026</Td>
                        <Td><span className="flex gap-2 pl-[42px]"><IconBtn icon={Pencil} label="Edit" /><IconBtn icon={Trash2} label="Delete" tone="danger" /></span></Td>
                      </Tr>
                    ))}
                  </Fragment>
                ))}
              </Table>
            </Card>
          </>
        }
        panel={
          <>
            <Panel title="Add New Category" onClose={() => undefined}>
              <div className="space-y-4">
                <Field label="Category Name" required><TextInput placeholder="Enter category name" /></Field>
                <Field label="Parent Category"><Dropdown label="None (Main Category)" /></Field>
                <Field label="Description"><TextArea placeholder="Enter short description..." rows={3} /></Field>
                <Field label="Category Image"><UploadBox /></Field>
                <Field label="Status"><Dropdown label="Active" /></Field>
              </div>
              <PanelButtons primary="Create Category" />
            </Panel>
            <TipCard>Use clear and simple category names to help customers find products easily.</TipCard>
          </>
        }
      />
    </div>
  );
}
