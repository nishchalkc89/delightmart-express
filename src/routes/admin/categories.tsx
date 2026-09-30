import { createFileRoute } from '@tanstack/react-router';
import { ChevronDown, ChevronRight, Download, Folder, Layers, Lock, Package, Pencil, Plus, SquarePlus, Trash2 } from 'lucide-react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge, Card, DataBadge, Field, IconBtn, PageHeader, Panel, PrimaryAction, SearchBox, SelectBox, StatCard, Table, Td, TipCard, Toggle, Tr, WithPanel } from '@/components/delight/admin-ui';
import { Area, FormButtons, ImageUpload, Input, Select } from '@/components/delight/admin-forms';
import { useAdminData, fmtDate } from '@/services/admin';
import { deleteCategory, fetchCategories, saveCategory, setCategoryStatus, type CategoryRow } from '@/services/admin-actions';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/admin/categories')({
  head: () => ({ meta: [{ title: 'Categories — Delight Admin' }, { name: 'description', content: 'Organize products into categories.' }, { property: 'og:title', content: 'Categories — Delight Admin' }, { property: 'og:description', content: 'Category management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

// Sample tree from the approved design, shown until live data is available.
const demoTree: Array<[string, string, number, boolean, string, Array<[string, string, number]>]> = [
  ['Groceries', 'cat-groceries', 320, true, '2026-08-12', [['Rice & Dal', 'cat-rice-dal', 45], ['Fruits & Vegetables', 'cat-fruits-veg', 62], ['Spices & Masala', 'cat-spices', 38], ['Oil & Ghee', 'cat-oil-ghee', 28]]],
  ['Dairy & Eggs', 'cat-dairy', 86, true, '2026-08-13', []], ['Snacks & Beverages', 'cat-snacks', 150, true, '2026-08-14', []],
  ['Atta, Rice & Dal', 'cat-atta', 75, true, '2026-08-14', []], ['Household Essentials', 'cat-household', 120, true, '2026-08-15', []],
  ['Personal Care', 'cat-personal', 110, true, '2026-08-16', []], ['Baby Care', 'cat-baby', 68, true, '2026-08-16', []],
  ['Kitchen & Home', 'cat-kitchen', 72, true, '2026-08-17', []], ['Stationery & Office', 'cat-stationery', 54, true, '2026-08-17', []],
  ['Fashion & Lifestyle', 'cat-fashion', 96, true, '2026-08-18', []], ['Toys & Kids', 'cat-toys', 48, true, '2026-08-18', []],
  ['Skincare & Beauty', 'cat-skincare', 49, false, '2026-08-19', []],
];
const demo: CategoryRow[] = demoTree.flatMap(([name, img, count, active, date, subs], i) => [
  { id: `d${i}`, name, slug: name, description: null, image_url: asset(img), parent_id: null, status: active ? 'ACTIVE' : 'INACTIVE', sort_order: i, created_at: date, products: count },
  ...subs.map(([sub, simg, sc], k) => ({ id: `d${i}-${k}`, name: sub, slug: sub, description: null, image_url: asset(simg), parent_id: `d${i}`, status: 'ACTIVE', sort_order: k, created_at: date, products: sc })),
]);
// Design images for the live categories that have no uploaded image yet.
const fallbackImage: Record<string, string> = { groceries: 'tile-groceries', 'ladies-wear': 'tile-ladies-wear', 'baby-care': 'tile-baby-care', stationery: 'tile-stationery', toys: 'tile-toys', 'kitchen-household': 'tile-kitchen-household', 'beauty-skincare': 'tile-beauty-skincare', 'cafe-fast-food': 'tile-cafe-fast-food', 'deals-offers': 'tile-deals-offers' };

type Form = { id?: string | undefined; name: string; parentId: string; description: string; status: 'ACTIVE' | 'INACTIVE'; imageUrl: string | null };
const blank: Form = { name: '', parentId: '', description: '', status: 'ACTIVE', imageUrl: null };

function Page() {
  const { rows, live, loading, reload } = useAdminData<CategoryRow>(fetchCategories, demo);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<Form>(blank);
  const [busy, setBusy] = useState(false);

  const main = useMemo(() => rows.filter((c) => !c.parent_id && c.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)), [rows, query]);
  const subsOf = (id: string) => rows.filter((c) => c.parent_id === id);
  const image = (c: CategoryRow) => c.image_url ?? (fallbackImage[c.slug] ? asset(fallbackImage[c.slug]!) : '');
  useEffect(() => { const first = main[0]; if (first) setOpen((o) => (Object.keys(o).length ? o : { [first.id]: true })); }, [main]);

  function guard() {
    if (!live) { toast.info('Sample data — sign in with a staff account to manage real categories.'); return false; }
    return true;
  }
  async function submit() {
    if (!guard()) return;
    if (!form.name.trim()) { toast.error('Category name is required'); return; }
    setBusy(true);
    try {
      await saveCategory({ id: form.id, name: form.name, description: form.description, parentId: form.parentId || null, status: form.status, imageUrl: form.imageUrl });
      toast.success(form.id ? 'Category updated' : 'Category created');
      setForm(blank); void reload();
    } catch (e) { toast.error(e instanceof Error ? (e.message.includes('duplicate') ? 'A category with this name already exists' : e.message) : 'Could not save'); } finally { setBusy(false); }
  }
  async function toggle(c: CategoryRow, v: boolean) {
    if (!guard()) return;
    try { await setCategoryStatus(c.id, v); void reload(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update'); }
  }
  async function remove(c: CategoryRow) {
    if (!guard()) return;
    if (c.products > 0) { toast.error('Move or remove this category’s products first, or set it Inactive'); return; }
    if (!window.confirm(`Delete ${c.name}?`)) return;
    try { await deleteCategory(c.id); toast.success('Category deleted'); void reload(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not delete'); }
  }
  const edit = (c: CategoryRow) => setForm({ id: c.id, name: c.name, parentId: c.parent_id ?? '', description: c.description ?? '', status: c.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE', imageUrl: c.image_url });

  const total = rows.reduce((s, c) => s + (c.parent_id ? 0 : c.products), 0);
  const row = (c: CategoryRow, sub: boolean, last: boolean, i: number) => (
    <Tr key={c.id}>
      <Td>{!sub && <span className="grid size-6 place-items-center rounded-md bg-[#f1f4f7] text-[12.5px]">{i + 1}</span>}</Td>
      <Td>
        {sub
          ? <span className="flex items-center gap-3 pl-5"><span className={`h-[34px] w-4 border-l border-[#c9d1da] ${last ? 'mb-4 h-[18px] border-b' : ''}`} /><span className="-ml-3 mr-1 h-px w-3 bg-[#c9d1da]" />{c.name}</span>
          : <button onClick={() => setOpen({ ...open, [c.id]: !open[c.id] })} className="flex items-center gap-4">{open[c.id] ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}{c.name}</button>}
      </Td>
      <Td>{image(c) ? <img src={image(c)} alt="" className="h-8 w-10 object-contain" /> : <span className="block h-8 w-10 rounded bg-[#f1f4f7]" />}</Td>
      <Td className="text-slate">{c.products} products</Td>
      <Td><span className="flex items-center gap-3"><Toggle key={`${c.id}${c.status}`} on={c.status === 'ACTIVE'} onChange={(v) => void toggle(c, v)} /><Badge tone={c.status === 'ACTIVE' ? 'green' : 'red'}>{c.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge></span></Td>
      <Td className="text-slate">{fmtDate(c.created_at)}</Td>
      <Td><span className={`flex gap-2 ${sub ? 'pl-[42px]' : ''}`}><IconBtn icon={Pencil} label="Edit" onClick={() => edit(c)} />{!sub && <IconBtn icon={SquarePlus} label="Add subcategory" onClick={() => setForm({ ...blank, parentId: c.id })} />}<IconBtn icon={Trash2} label="Delete" tone="danger" onClick={() => void remove(c)} /></span></Td>
    </Tr>
  );

  return (
    <div>
      <PageHeader title="Categories" subtitle="Organize your products into categories and subcategories." badge={<DataBadge live={live} loading={loading} />} actions={<PrimaryAction icon={Plus} onClick={() => setForm(blank)}>Add Category</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Layers} tone="green" label="Total Categories" value={live ? String(rows.filter((c) => !c.parent_id).length) : '12'} delta={live ? undefined : '+2'} />
              <StatCard icon={Folder} tone="blue" label="Active Categories" value={live ? String(rows.filter((c) => !c.parent_id && c.status === 'ACTIVE').length) : '11'} delta={live ? undefined : '+10%'} />
              <StatCard icon={Lock} tone="red" label="Inactive Categories" value={live ? String(rows.filter((c) => !c.parent_id && c.status !== 'ACTIVE').length) : '1'} delta={live ? undefined : '-50%'} dir="down" />
              <StatCard icon={Package} tone="purple" label="Total Products" value={live ? String(total) : '1,248'} delta={live ? undefined : '+12%'} />
            </div>
            <Card className="mt-4">
              <div className="flex items-center gap-3 px-4 py-4">
                <SearchBox placeholder="Search categories..." value={query} onChange={setQuery} className="w-[328px]" />
                <button onClick={() => setOpen(Object.fromEntries(main.map((c) => [c.id, true])))} className="ml-auto flex h-[40px] items-center gap-2 rounded-lg border border-line px-4 text-[14px] font-semibold text-navy"><Download className="size-4" /> Expand All</button>
                <SelectBox label="Sort by: Name (A-Z)" className="w-[182px]" />
              </div>
              <Table head={['#', 'Category Name', 'Image', 'Products', 'Status', 'Created At', 'Actions']}>
                {main.map((c, i) => {
                  const subs = subsOf(c.id);
                  return <Fragment key={c.id}>{row(c, false, false, i)}{open[c.id] && subs.map((s, k) => row(s, true, k === subs.length - 1, k))}</Fragment>;
                })}
              </Table>
              {!main.length && <p className="px-5 py-10 text-center text-[14px] text-slate">No categories found.</p>}
            </Card>
          </>
        }
        panel={
          <>
            <Panel title={form.id ? 'Edit Category' : 'Add New Category'} onClose={() => setForm(blank)}>
              <div className="space-y-4">
                <Field label="Category Name" required><Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Enter category name" /></Field>
                <Field label="Parent Category">
                  <Select value={form.parentId} onChange={(v) => setForm({ ...form, parentId: v })}>
                    <option value="">None (Main Category)</option>
                    {rows.filter((c) => !c.parent_id && c.id !== form.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </Field>
                <Field label="Description"><Area value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Enter short description..." rows={3} /></Field>
                <Field label="Category Image"><ImageUpload bucket="category-images" value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} /></Field>
                <Field label="Status"><Select value={form.status} onChange={(v) => setForm({ ...form, status: v as Form['status'] })}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></Select></Field>
              </div>
              <FormButtons primary={form.id ? 'Save Changes' : 'Create Category'} busy={busy} onCancel={() => setForm(blank)} onPrimary={() => void submit()} />
            </Panel>
            <TipCard>Use clear and simple category names to help customers find products easily.</TipCard>
          </>
        }
      />
    </div>
  );
}
