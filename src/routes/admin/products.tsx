import { createFileRoute } from '@tanstack/react-router';
import { ArrowUpDown, Box, CircleCheck, CircleX, Copy, Download, ImagePlus, Package, Pencil, Plus, Trash2, TriangleAlert, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge, Card, DataBadge, FilterBar, FilterSelect, IconBtn, OutlineAction, PageHeader, Pagination, PrimaryAction, SearchBox, StatCard, Table, Td, Toggle, Tr, WithPanel } from '@/components/delight/admin-ui';
import { BulkPhotoUpload } from '@/components/delight/admin-bulk-photos';
import { ProductForm } from '@/components/delight/admin-forms';
import { deleteProduct } from '@/services/admin-actions';
import { categoryTone, npr } from '@/components/delight/admin-data';
import { fetchAdminProducts, setProductActive, useAdminData, type AdminProduct } from '@/services/admin';

export const Route = createFileRoute('/admin/products')({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({ q: typeof s['q'] === 'string' ? s['q'] : undefined }),
  head: () => ({ meta: [{ title: 'Products — Delight Admin' }, { name: 'description', content: 'Manage the product catalog.' }, { property: 'og:title', content: 'Products — Delight Admin' }, { property: 'og:description', content: 'Catalog management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

type SortKey = 'name' | 'price' | 'stock';

/** Column title that sorts the table when clicked (click again to reverse). */
function Sortable({ children, k, sort, onSort }: { children: string; k: SortKey; sort: [SortKey, 1 | -1] | null; onSort: (k: SortKey) => void }) {
  const on = sort?.[0] === k;
  return (
    <button type="button" onClick={() => onSort(k)} className={`flex items-center gap-1 ${on ? 'font-semibold text-navy' : ''}`}>
      {children}<ArrowUpDown className="size-3.5" />{on && <span className="text-[11px]">{sort[1] === 1 ? '↑' : '↓'}</span>}
    </button>
  );
}

function stockLabel(stock: number, threshold: number) {
  if (stock === 0) return ['Out of Stock', 'red'] as const;
  if (stock < threshold) return ['Low Stock', 'red'] as const;
  return ['In Stock', 'green'] as const;
}

const PER_PAGE = 50;

function Page() {
  const [editId, setEditId] = useState<string | null>(null);
  const [dupId, setDupId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const search = Route.useSearch();
  const [query, setQuery] = useState(search.q ?? '');
  useEffect(() => { if (search.q !== undefined) { setQuery(search.q); setPage(1); } }, [search.q]);
  const [sort, setSort] = useState<[SortKey, 1 | -1] | null>(null);
  const onSort = (k: SortKey) => setSort((v) => (v?.[0] === k ? [k, v[1] === 1 ? -1 : 1] : [k, 1]));
  const { rows: all, setRows, live, loading, reload } = useAdminData<AdminProduct>(fetchAdminProducts);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  // Only products on the website by default; "Hidden" shows the rest (they can be switched back on).
  const [status, setStatus] = useState('active');
  const [stockFilter, setStockFilter] = useState('');
  const [photo, setPhoto] = useState('');
  const [bulk, setBulk] = useState(false);
  const categories = [...new Set(all.map((p) => p.category))].sort();
  const needPhoto = all.filter((p) => !p.hasPhoto && p.active).length;
  const rows = all
    .filter((p) => `${p.name} ${p.sku} ${p.code} ${p.category}`.toLowerCase().includes(query.toLowerCase()))
    .filter((p) => !category || p.category === category)
    .filter((p) => !status || (status === 'active') === p.active)
    .filter((p) => !stockFilter || (stockFilter === 'out' ? p.stock <= 0 : stockFilter === 'low' ? p.stock > 0 && p.stock < p.threshold : p.stock >= p.threshold))
    .filter((p) => !photo || (photo === 'missing' ? !p.hasPhoto : Boolean(p.hasPhoto)))
    // Products missing a photo: best sellers first, so the photos that matter most get done first.
    .sort((a, b) => {
      if (sort) {
        const [k, dir] = sort;
        return dir * (k === 'name' ? a.name.localeCompare(b.name) : k === 'price' ? a.price - b.price : a.stock - b.stock);
      }
      return photo === 'missing' ? (b.sold ?? 0) - (a.sold ?? 0) : 0;
    });
  const filter = (fn: (v: string) => void) => (v: string) => { fn(v); setPage(1); };
  const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const shown = rows.slice((Math.min(page, pageCount) - 1) * PER_PAGE, Math.min(page, pageCount) * PER_PAGE);
  const outOfStock = all.filter((p) => p.stock <= 0).length;
  const low = all.filter((p) => p.stock > 0 && p.stock < p.threshold).length;

  function openNew() { setEditId(null); setDupId(null); setFormKey((k) => k + 1); }
  async function remove(p: AdminProduct) {
    if (!window.confirm(`Delete ${p.name}?`)) return;
    try {
      const result = await deleteProduct(p.id);
      toast.success(result === 'deleted' ? 'Product deleted' : 'Product has past orders, so it was hidden from the store instead');
      void reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete the product'); }
  }
  function exportCsv() {
    // Exports what the filters show, so "Needs photo" + Export gives staff a photo checklist with file names.
    const lines = [['Name', 'Product code', 'Photo file name', 'Category', 'Price', 'Old Price', 'Stock', 'Status', 'Has photo'], ...rows.map((p) => [p.name, p.code, `${p.code}.jpg`, p.category, String(p.price), String(p.oldPrice || ''), String(p.stock), p.active ? 'Active' : 'Inactive', p.hasPhoto ? 'Yes' : 'No'])];
    const url = URL.createObjectURL(new Blob(['\ufeff', lines.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(',')).join('\r\n')], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'delight-products.csv'; a.click(); URL.revokeObjectURL(url);
  }

  async function toggle(p: AdminProduct, active: boolean) {
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
      <PageHeader title="Products" subtitle="Manage your product catalog, prices, stock and more." badge={<DataBadge live={live} loading={loading} />} actions={<><OutlineAction icon={ImagePlus} onClick={() => setBulk(true)}>Bulk Photos</OutlineAction><OutlineAction icon={Upload} onClick={() => toast.info('To import products from a spreadsheet, see docs/SUPABASE_SETUP.md (npm run catalogue:import).')}>Import</OutlineAction><OutlineAction icon={Download} onClick={exportCsv}>Export</OutlineAction><PrimaryAction icon={Plus} onClick={openNew}>Add Product</PrimaryAction></>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatCard compact icon={Package} tone="green" label="Total Products" value={String(all.length)} filled={false} />
              <StatCard compact icon={CircleCheck} tone="green" label="Active Products" value={String(all.filter((p) => p.active).length)} note="" />
              <StatCard compact icon={Box} tone="red" label="Out of Stock" value={String(outOfStock)} dir="down" note="" filled={false} />
              <StatCard compact icon={TriangleAlert} tone="red" label="Low Stock" value={String(low)} dir="down" note="" filled={false} />
              <StatCard compact icon={CircleX} tone="red" label="Hidden Products" value={String(all.filter((p) => !p.active).length)} dir="down" note="" />
            </div>
            <Card className="mt-4">
              <FilterBar>
                <SearchBox placeholder="Search products by name, SKU or category..." value={query} onChange={(v) => { setQuery(v); setPage(1); }} className="w-[276px]" />
                <FilterSelect label="Category" value={category} onChange={filter(setCategory)} options={[['', 'All Categories'], ...categories.map((c): [string, string] => [c, c])]} className="w-[170px]" />
                <FilterSelect label="Status" value={status} onChange={filter(setStatus)} options={[['active', 'On website'], ['inactive', 'Hidden'], ['', 'All products']]} className="w-[140px]" />
                <FilterSelect label="Stock" value={stockFilter} onChange={filter(setStockFilter)} options={[['', 'All Stock'], ['in', 'In Stock'], ['low', 'Low Stock'], ['out', 'Out of Stock']]} className="w-[125px]" />
                <FilterSelect label="Photo" value={photo} onChange={filter(setPhoto)} options={[['', 'All Photos'], ['missing', `Needs photo (${needPhoto.toLocaleString('en-US')})`], ['has', 'Has photo']]} className="w-[175px]" />
              </FilterBar>
              <Table head={['Image', <Sortable key="n" k="name" sort={sort} onSort={onSort}>Product Name</Sortable>, 'Category', <Sortable key="p" k="price" sort={sort} onSort={onSort}>Price</Sortable>, <Sortable key="s" k="stock" sort={sort} onSort={onSort}>Stock</Sortable>, 'Status', 'Actions']}>
                {shown.map((p) => {
                  const [label, tone] = stockLabel(p.stock, p.threshold);
                  return (
                    <Tr key={p.id}>
                      <Td>{p.image ? <img src={p.image} alt="" className="size-11 object-contain" /> : <button onClick={() => { setDupId(null); setEditId(p.id); }} title="Add a photo" className="grid size-11 place-items-center rounded border border-dashed border-[#c9d1da] bg-[#f8fafc] text-slate hover:border-[#077a52] hover:text-[#077a52]"><ImagePlus className="size-4" /></button>}</Td>
                      <Td><span className="block">{p.name}</span><span className="text-[12.5px] text-slate">Code {p.code}</span></Td>
                      <Td><Badge tone={categoryTone[p.category] ?? 'gray'}>{p.category}</Badge></Td>
                      <Td className="whitespace-nowrap"><span className="block">{npr(p.price)}</span>{p.oldPrice > 0 && <del className="text-[12.5px] text-slate">{npr(p.oldPrice)}</del>}</Td>
                      <Td><span className={`block ${tone === 'red' ? 'text-[#e3101a]' : ''}`}>{p.stock}</span><Badge tone={tone} className="!py-0.5 !text-[11.5px]">{label}</Badge></Td>
                      <Td><Toggle key={`${p.id}-${p.active}`} on={p.active} onChange={(v) => void toggle(p, v)} /></Td>
                      <Td><span className="flex gap-2"><IconBtn icon={Pencil} label="Edit" onClick={() => { setDupId(null); setEditId(p.id); }} /><IconBtn icon={Copy} label="Duplicate" onClick={() => { setEditId(null); setDupId(p.id); }} /><IconBtn icon={Trash2} label="Delete" tone="danger" onClick={() => void remove(p)} /></span></Td>
                    </Tr>
                  );
                })}
              </Table>
              <Pagination text={`Showing ${rows.length ? (Math.min(page, pageCount) - 1) * PER_PAGE + 1 : 0}-${(Math.min(page, pageCount) - 1) * PER_PAGE + shown.length} of ${rows.length.toLocaleString('en-US')} products`} current={Math.min(page, pageCount)} pageCount={pageCount} onPage={setPage} />
            </Card>
          </>
        }
        panel={<ProductForm key={formKey} editId={editId} duplicateId={dupId} live={live} onSaved={() => { setEditId(null); setDupId(null); void reload(); }} onClose={openNew} />}
      />
      {bulk && <BulkPhotoUpload products={all.filter((p) => p.active)} onClose={() => setBulk(false)} onDone={() => void reload()} />}
    </div>
  );
}
