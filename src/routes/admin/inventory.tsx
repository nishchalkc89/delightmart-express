import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleCheck, CircleX, Download, ExternalLink, Minus, Package, Pencil, Plus, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge, Card, DataBadge, FilterBar, FilterSelect, IconBtn, OutlineAction, PageHeader, Pagination, Panel, SearchBox, StatCard, Table, Tabs, Td, Tr, WithPanel, usePaged } from '@/components/delight/admin-ui';
import { fetchAdminProducts, fetchStockHistory, fmtDate, fmtTime, setStock, setThreshold, useAdminData, type AdminProduct } from '@/services/admin';

export const Route = createFileRoute('/admin/inventory')({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({ q: typeof s['q'] === 'string' ? s['q'] : undefined }),
  head: () => ({ meta: [{ title: 'Inventory — Delight Admin' }, { name: 'description', content: 'Track stock levels and low stock alerts.' }, { property: 'og:title', content: 'Inventory — Delight Admin' }, { property: 'og:description', content: 'Stock management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const sorts: Array<[string, string]> = [['stock-asc', 'Stock: Low to High'], ['stock-desc', 'Stock: High to Low'], ['name', 'Name: A to Z'], ['updated', 'Recently updated']];

function Page() {
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [selId, setSelId] = useState<string | null>(null);
  const [qty, setQty] = useState(0);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState(search.q ?? '');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('stock-asc');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (search.q !== undefined) setQuery(search.q); }, [search.q]);
  const { rows: all, setRows, live, loading } = useAdminData<AdminProduct>(fetchAdminProducts);
  const isLow = (x: AdminProduct) => x.stock > 0 && x.stock < x.threshold;
  const categories = useMemo(() => [...new Set(all.map((p) => p.category))].sort(), [all]);

  const rows = useMemo(() => all
    .filter((x) => tab === 0 || (tab === 1 ? isLow(x) : x.stock <= 0))
    .filter((x) => !category || x.category === category)
    .filter((x) => !status || (status === 'active') === x.active)
    .filter((x) => `${x.name} ${x.sku}`.toLowerCase().includes(query.toLowerCase().trim()))
    .sort((a, b) => (sort === 'stock-desc' ? b.stock - a.stock : sort === 'name' ? a.name.localeCompare(b.name) : sort === 'updated' ? b.updatedAt.localeCompare(a.updatedAt) : a.stock - b.stock)),
  [all, tab, category, status, query, sort]);
  const pg = usePaged(rows, 50);
  const p = all.find((x) => x.id === selId) ?? rows[0];
  useEffect(() => { if (p) { setQty(p.stock); setLimit(p.threshold); } }, [p?.id, p?.stock, p?.threshold]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data: history = [], isLoading: historyLoading } = useQuery({ queryKey: ['stock-history', p?.id], enabled: Boolean(p), queryFn: () => fetchStockHistory(p!.id) });
  const lowCount = all.filter(isLow).length;
  const outCount = all.filter((x) => x.stock <= 0).length;
  const reset = () => pg.reset();

  async function save() {
    if (!p) return;
    setSaving(true);
    try {
      if (qty !== p.stock) await setStock(p.id, p.stock, qty);
      if (limit !== p.threshold) await setThreshold(p.id, limit);
      setRows((list) => list.map((x) => (x.id === p.id ? { ...x, stock: qty, threshold: limit, updatedAt: new Date().toISOString() } : x)));
      void queryClient.invalidateQueries({ queryKey: ['stock-history', p.id] });
      toast.success(`${p.name}: stock ${qty}, alert below ${limit}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update stock');
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const lines = [['Product', 'SKU', 'Category', 'Stock', 'Alert below', 'Status'], ...rows.map((x) => [x.name, x.sku, x.category, String(x.stock), String(x.threshold), x.active ? 'Active' : 'Hidden'])];
    const url = URL.createObjectURL(new Blob(['﻿', lines.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(',')).join('\r\n')], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'delight-inventory.csv'; a.click(); URL.revokeObjectURL(url);
  }

  const changed = p && (qty !== p.stock || limit !== p.threshold);
  return (
    <div>
      <PageHeader title="Inventory" subtitle="Track stock levels, manage inventory and get low stock alerts." badge={<DataBadge live={live} loading={loading} />} actions={<OutlineAction icon={Download} onClick={exportCsv}>Export</OutlineAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Package} tone="green" label="Total Products" value={all.length.toLocaleString()} note="" filled={false} />
              <StatCard icon={CircleCheck} tone="green" label="In Stock" value={(all.length - outCount).toLocaleString()} note="" />
              <StatCard icon={TriangleAlert} tone="amber" label="Low Stock" value={String(lowCount)} note="below alert level" />
              <StatCard icon={CircleX} tone="red" label="Out of Stock" value={String(outCount)} note="" />
            </div>
            <Card className="mt-4">
              <Tabs items={[`All Products (${all.length})`, `Low Stock (${lowCount})`, `Out of Stock (${outCount})`]} active={tab} onChange={(i) => { setTab(i); reset(); }} />
              <FilterBar>
                <SearchBox placeholder="Search by product name or SKU..." value={query} onChange={(v) => { setQuery(v); reset(); }} className="w-[240px]" />
                <FilterSelect label="Category" value={category} onChange={(v) => { setCategory(v); reset(); }} options={[['', 'All Categories'], ...categories.map((c): [string, string] => [c, c])]} className="w-[170px]" />
                <FilterSelect label="Status" value={status} onChange={(v) => { setStatus(v); reset(); }} options={[['', 'All Status'], ['active', 'Active'], ['hidden', 'Hidden']]} className="w-[130px]" />
                <FilterSelect label="Sort" value={sort} onChange={setSort} options={sorts} className="w-[180px]" />
              </FilterBar>
              <Table head={['Product', 'SKU', 'Category', 'Current Stock', 'Alert Below', 'Status', 'Last Updated', 'Actions']}>
                {pg.shown.map((x) => {
                  const low = isLow(x);
                  return (
                    <Tr key={x.id} active={x.id === p?.id} onClick={() => setSelId(x.id)}>
                      <Td><span className="flex items-center gap-2.5">{x.image && <img src={x.image} alt="" className="size-8 shrink-0 object-contain" />}<span className="leading-tight">{x.name}</span></span></Td>
                      <Td className="text-slate">{x.sku}</Td>
                      <Td className="text-slate">{x.category}</Td>
                      <Td className={x.stock <= 0 || low ? 'text-[#e3101a]' : ''}>{x.stock}</Td>
                      <Td>{x.threshold}</Td>
                      <Td>{x.stock <= 0 ? <Badge tone="red">Out of Stock</Badge> : low ? <Badge tone="amber">Low Stock</Badge> : <Badge tone="green">In Stock</Badge>}</Td>
                      <Td className="whitespace-nowrap text-slate">{fmtDate(x.updatedAt)}</Td>
                      <Td><span className="flex gap-2"><IconBtn icon={Pencil} label="Change stock" onClick={() => setSelId(x.id)} /><Link to="/admin/products" search={{ q: x.sku }} aria-label="Open in Products" className="grid size-8 place-items-center rounded-md border border-line text-navy hover:bg-page"><ExternalLink className="size-4" /></Link></span></Td>
                    </Tr>
                  );
                })}
              </Table>
              {!loading && !rows.length && <p className="px-5 py-10 text-center text-[14px] text-slate">No products match these filters.</p>}
              <Pagination text={`Showing ${pg.from}-${pg.to} of ${pg.total.toLocaleString('en-US')} products`} current={pg.page} pageCount={pg.pageCount} onPage={pg.setPage} />
            </Card>
          </>
        }
        panel={p ? (
          <Panel title="Stock Details" onClose={() => setSelId(null)}>
            <div className="flex gap-4">
              {p.image ? <img src={p.image} alt="" className="size-[72px] object-contain" /> : <span className="size-[72px] shrink-0 rounded bg-[#f1f4f7]" />}
              <div className="min-w-0"><b className="block text-[15px] font-semibold text-navy">{p.name}</b><span className="text-[13px] text-slate">{p.sku} · {p.category}</span><Badge tone={p.active ? 'green' : 'red'} className="mt-2 !flex w-fit items-center gap-1"><CircleCheck className="size-3.5" />{p.active ? 'Active' : 'Hidden'}</Badge></div>
            </div>
            <p className="mt-5 text-[14px] font-medium text-navy">Stock</p>
            <div className="mt-2 flex h-10 w-fit items-center rounded-lg border border-line">
              <button aria-label="Decrease" onClick={() => setQty(Math.max(0, qty - 1))} className="grid h-full w-10 place-items-center"><Minus className="size-4" /></button>
              <input aria-label="Stock quantity" type="number" min={0} value={qty} onChange={(e) => setQty(Math.max(0, Math.floor(Number(e.target.value) || 0)))} className="h-full w-20 border-x border-line text-center text-[15px] outline-none" />
              <button aria-label="Increase" onClick={() => setQty(qty + 1)} className="grid h-full w-10 place-items-center"><Plus className="size-4" /></button>
            </div>
            <p className="mt-4 text-[14px] font-medium text-navy">Low-stock alert level</p>
            <input aria-label="Low-stock alert level" type="number" min={0} value={limit} onChange={(e) => setLimit(Math.max(0, Math.floor(Number(e.target.value) || 0)))} className="mt-2 h-10 w-32 rounded-lg border border-line px-3 text-[15px] outline-none focus:border-[#077a52]" />
            <p className="mt-1 text-[12px] text-slate">The product shows as “Low Stock” below this number.</p>
            <button onClick={() => void save()} disabled={saving || !changed} className="mt-4 h-11 w-full rounded-lg bg-[#077a52] text-[15px] font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button>
            <h3 className="mt-6 text-[15px] font-bold text-navy">Stock History</h3>
            <ul className="mt-2 divide-y divide-line">
              {history.map((h, i) => (
                <li key={i} className="flex items-start gap-3 py-2.5">
                  <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${h.delta >= 0 ? 'bg-[#0a8a5b]' : 'bg-[#ef4444]'}`} />
                  <span className="flex-1 text-[13px] leading-5"><span className="block text-navy">{h.reason}</span><span className="text-slate">{fmtDate(h.at)}, {fmtTime(h.at)}</span></span>
                  <span className={`text-[13.5px] font-semibold ${h.delta >= 0 ? 'text-[#0a8a5b]' : 'text-[#e3101a]'}`}>{h.delta > 0 ? `+${h.delta}` : h.delta}</span>
                </li>
              ))}
              {!historyLoading && !history.length && <li className="py-4 text-[13px] text-slate">No stock changes recorded yet.</li>}
            </ul>
          </Panel>
        ) : (
          <Panel title="Stock Details"><p className="text-[14px] text-slate">Select a product to change its stock.</p></Panel>
        )}
      />
    </div>
  );
}
