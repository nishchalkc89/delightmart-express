import { createFileRoute } from '@tanstack/react-router';
import { ArrowRight, ArrowUpDown, Box, CircleCheck, CircleX, Copy, Download, Package, Pencil, Plus, Trash2, TriangleAlert, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge, Card, Checkbox, DataBadge, Dropdown, Field, FilterBar, FiltersButton, IconBtn, OutlineAction, PageHeader, Pagination, Panel, PrimaryAction, SearchBox, SelectBox, StatCard, Table, Td, TextArea, TextInput, Toggle, Tr, WithPanel } from '@/components/delight/admin-ui';
import { categoryTone, demoAdminProducts, npr } from '@/components/delight/admin-data';
import { fetchAdminProducts, setProductActive, useAdminData, type AdminProduct } from '@/services/admin';

export const Route = createFileRoute('/admin/products')({
  head: () => ({ meta: [{ title: 'Products — Delight Admin' }, { name: 'description', content: 'Manage the product catalog.' }, { property: 'og:title', content: 'Products — Delight Admin' }, { property: 'og:description', content: 'Catalog management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Sortable({ children }: { children: string }) {
  return <span className="flex items-center gap-1">{children}<ArrowUpDown className="size-3.5" /></span>;
}

function stockLabel(stock: number, threshold: number) {
  if (stock === 0) return ['Out of Stock', 'red'] as const;
  if (stock < threshold) return ['Low Stock', 'red'] as const;
  return ['In Stock', 'green'] as const;
}

function Page() {
  const [panelTab, setPanelTab] = useState(0);
  const [query, setQuery] = useState('');
  const { rows: all, setRows, live, loading } = useAdminData<AdminProduct>(fetchAdminProducts, demoAdminProducts);
  const rows = all.filter((p) => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
  const outOfStock = all.filter((p) => p.stock <= 0).length;
  const low = all.filter((p) => p.stock > 0 && p.stock < p.threshold).length;

  async function toggle(p: AdminProduct, active: boolean) {
    if (!live) { toast.info('Sample data — sign in with a staff account to change real products.'); return; }
    try {
      await setProductActive(p.id, active);
      setRows((list) => list.map((x) => (x.id === p.id ? { ...x, active } : x)));
      toast.success(`${p.name} is now ${active ? 'active' : 'hidden from the store'}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the product');
    }
  }

  return (
    <div>
      <PageHeader title="Products" subtitle="Manage your product catalog, prices, stock and more." badge={<DataBadge live={live} loading={loading} />} actions={<><OutlineAction icon={Upload}>Import</OutlineAction><OutlineAction icon={Download} onClick={() => toast.success('Products exported')}>Export</OutlineAction><PrimaryAction icon={Plus}>Add Product</PrimaryAction></>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatCard compact icon={Package} tone="green" label="Total Products" value={live ? String(all.length) : '1,248'} delta={live ? undefined : '+12%'} filled={false} />
              <StatCard compact icon={CircleCheck} tone="green" label="Active Products" value={live ? String(all.filter((p) => p.active).length) : '1,120'} delta={live ? undefined : '+8%'} note="" />
              <StatCard compact icon={Box} tone="red" label="Out of Stock" value={live ? String(outOfStock) : '32'} delta={live ? undefined : '-15%'} dir="down" note="" filled={false} />
              <StatCard compact icon={TriangleAlert} tone="red" label="Low Stock" value={live ? String(low) : '68'} delta={live ? undefined : '-22%'} dir="down" note="" filled={false} />
              <StatCard compact icon={CircleX} tone="red" label="Inactive Products" value={live ? String(all.filter((p) => !p.active).length) : '96'} delta={live ? undefined : '+5%'} dir="down" note="" />
            </div>
            <Card className="mt-4">
              <FilterBar>
                <SearchBox placeholder="Search products by name, SKU or category..." value={query} onChange={setQuery} className="w-[276px]" />
                <SelectBox label="All Categories" />
                <SelectBox label="All Status" />
                <SelectBox label="All Stock" />
                <FiltersButton />
              </FilterBar>
              <Table head={[<Checkbox key="c" />, 'Image', <Sortable key="n">Product Name</Sortable>, 'Category', <Sortable key="p">Price</Sortable>, <Sortable key="s">Stock</Sortable>, 'Status', 'Actions']}>
                {rows.map((p) => {
                  const [label, tone] = stockLabel(p.stock, p.threshold);
                  return (
                    <Tr key={p.id}>
                      <Td><Checkbox /></Td>
                      <Td>{p.image ? <img src={p.image} alt="" className="size-11 object-contain" /> : <span className="block size-11 rounded bg-[#f1f4f7]" />}</Td>
                      <Td><span className="block">{p.name}</span><span className="text-[12.5px] text-slate">{p.sku}</span></Td>
                      <Td><Badge tone={categoryTone[p.category] ?? 'gray'}>{p.category}</Badge></Td>
                      <Td className="whitespace-nowrap"><span className="block">{npr(p.price)}</span>{p.oldPrice > 0 && <del className="text-[12.5px] text-slate">{npr(p.oldPrice)}</del>}</Td>
                      <Td><span className={`block ${tone === 'red' ? 'text-[#e3101a]' : ''}`}>{p.stock}</span><Badge tone={tone} className="!py-0.5 !text-[11.5px]">{label}</Badge></Td>
                      <Td><Toggle key={`${p.id}-${p.active}`} on={p.active} onChange={(v) => void toggle(p, v)} /></Td>
                      <Td><span className="flex gap-2"><IconBtn icon={Pencil} label="Edit" /><IconBtn icon={Copy} label="Duplicate" /><IconBtn icon={Trash2} label="Delete" tone="danger" /></span></Td>
                    </Tr>
                  );
                })}
              </Table>
              <Pagination text={`Showing 1-${rows.length} of ${live ? all.length : '1,248'} products`} pages={live ? [1] : undefined} />
            </Card>
          </>
        }
        panel={
          <Panel title="Add New Product" onClose={() => undefined} className="xl:sticky xl:top-[88px]">
            <div className="-mx-5 mb-4 flex gap-4 border-b border-line px-5 text-[13px]">
              {['Basic Information', 'Pricing & Stock', 'Images', 'More'].map((t, i) => (
                <button key={t} onClick={() => setPanelTab(i)} className={`relative whitespace-nowrap pb-2.5 ${i === panelTab ? 'font-semibold text-[#077a52]' : 'text-slate'}`}>{t}{i === panelTab && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#077a52]" />}</button>
              ))}
            </div>
            <div className="space-y-4">
              <Field label="Product Name" required><TextInput placeholder="Enter product name" /></Field>
              <Field label="SKU" required><TextInput placeholder="Enter SKU (e.g. SKU00123)" /></Field>
              <Field label="Category" required><Dropdown label="Select category" /></Field>
              <Field label="Subcategory"><Dropdown label="Select subcategory" /></Field>
              <Field label="Brand"><TextInput placeholder="Enter brand name" /></Field>
              <Field label="Description" required><TextArea placeholder="Enter product description..." max={500} rows={4} /></Field>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="h-[44px] rounded-lg border border-line text-[15px] font-medium text-navy">Cancel</button>
              <button onClick={() => setPanelTab(Math.min(3, panelTab + 1))} className="flex h-[44px] items-center justify-center gap-2 rounded-lg bg-[#077a52] text-[15px] font-semibold text-white">Next <ArrowRight className="size-4" /></button>
            </div>
          </Panel>
        }
      />
    </div>
  );
}
