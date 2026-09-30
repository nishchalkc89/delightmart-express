import { CircleCheck, CircleX, ImagePlus, Loader2, Upload, X } from 'lucide-react';
import { useMemo, useRef, useState, type DragEvent } from 'react';
import { toast } from 'sonner';
import { setProductPhoto, uploadImage } from '@/services/admin-actions';
import type { AdminProduct } from '@/services/admin';

type Row = { file: File; preview: string; productId: string; how: string; status: 'ready' | 'uploading' | 'done' | 'failed'; error?: string };

const words = (s: string) => s.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9.]+/g, ' ').trim();
const tokens = (s: string) => new Set(words(s).split(' ').filter((w) => w.length > 1));

/** Finds the product a photo belongs to from its file name: product code, web address name, or product name. */
function matchProduct(fileName: string, products: AdminProduct[], index: { bySku: Map<string, AdminProduct>; bySlug: Map<string, AdminProduct>; byName: Map<string, AdminProduct> }): [AdminProduct | undefined, string] {
  const base = fileName.replace(/\.[a-z0-9]+$/i, '').trim();
  const code = base.toLowerCase().replace(/^dm[-_ ]?/, '').replace(/\s*\(\d+\)$/, '');
  const bySku = index.bySku.get(code);
  if (bySku) return [bySku, 'Product code'];
  const bySlug = index.bySlug.get(base.toLowerCase());
  if (bySlug) return [bySlug, 'Web address'];
  const byName = index.byName.get(words(base));
  if (byName) return [byName, 'Exact name'];
  // Closest name: most shared words, and at least 70% of the file name's words.
  const want = tokens(base);
  if (want.size < 2) return [undefined, ''];
  // Every number in the file name (sizes like 250, L7, 46) must also be in the product name.
  const numbers = base.match(/\d+(\.\d+)?/g) ?? [];
  let best: AdminProduct | undefined;
  let bestScore = 0;
  let tie = false;
  for (const p of products) {
    const digits: string[] = p.name.match(/\d+(\.\d+)?/g) ?? [];
    if (!numbers.every((n) => digits.includes(n))) continue;
    const have = tokens(p.name);
    let shared = 0;
    for (const w of want) if (have.has(w)) shared++;
    const score = shared / Math.max(want.size, have.size);
    if (score > bestScore) { bestScore = score; best = p; tie = false; } else if (score === bestScore) tie = true;
  }
  // A tie means two products fit equally well: let staff choose instead of guessing.
  return bestScore >= 0.7 && !tie ? [best, `Similar name (${Math.round(bestScore * 100)}%)`] : [undefined, ''];
}

const label = (p: AdminProduct) => `${p.name} (${p.sku})`;

export function BulkPhotoUpload({ products, onClose, onDone }: { products: AdminProduct[]; onClose: () => void; onDone: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const index = useMemo(() => ({
    bySku: new Map(products.map((p) => [p.sku.toLowerCase().replace(/^dm[-_ ]?/, ''), p])),
    bySlug: new Map(products.map((p) => [p.slug, p])),
    byName: new Map(products.map((p) => [words(p.name), p])),
  }), [products]);
  const sorted = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products]);
  const byLabel = useMemo(() => new Map(products.map((p) => [label(p), p])), [products]);

  function add(files: FileList | File[]) {
    const images = [...files].filter((f) => f.type.startsWith('image/'));
    if (!images.length) { toast.error('Choose photo files (JPG, PNG or WEBP)'); return; }
    const next = images.map((file): Row => {
      const [p, how] = matchProduct(file.name, products, index);
      return { file, preview: URL.createObjectURL(file), productId: p?.id ?? '', how: p ? how : '', status: 'ready' };
    });
    setRows((r) => [...r, ...next]);
  }
  function drop(e: DragEvent) { e.preventDefault(); add(e.dataTransfer.files); }
  const update = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  async function uploadAll() {
    const todo = rows.map((r, i) => [r, i] as const).filter(([r]) => r.productId && r.status !== 'done');
    if (!todo.length) { toast.info('Match each photo to a product first'); return; }
    setRunning(true);
    let ok = 0;
    const queue = [...todo];
    const worker = async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        const [r, i] = item;
        update(i, { status: 'uploading' });
        try {
          const url = await uploadImage('product-images', r.file);
          await setProductPhoto(r.productId, url, byId.get(r.productId)?.name ?? '');
          update(i, { status: 'done' });
          ok++;
        } catch (e) {
          update(i, { status: 'failed', error: e instanceof Error ? e.message : 'Upload failed' });
        }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    setRunning(false);
    toast.success(`${ok} photo${ok === 1 ? '' : 's'} added to products`);
    if (ok) onDone();
  }

  const matched = rows.filter((r) => r.productId).length;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1726]/45 p-6" onClick={() => !running && onClose()}>
      <div className="flex max-h-[88vh] w-full max-w-[940px] flex-col rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="text-[20px] font-bold text-navy">Bulk Photo Upload</h2>
            <p className="text-[13.5px] text-slate">Name each photo after its product code (e.g. <b>DM-7.3663.jpg</b>) or the product name. Photos are matched automatically; check the matches before uploading.</p>
          </div>
          <button aria-label="Close" disabled={running} onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-[#f1f4f7]"><X className="size-5" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={drop} className="grid w-full place-items-center rounded-xl border-2 border-dashed border-[#c9d1da] bg-[#f8fafc] px-4 py-7 text-center hover:border-[#077a52]">
            <ImagePlus className="size-9 text-navy" strokeWidth={1.5} />
            <p className="mt-2 text-[15px] font-semibold text-navy">Drop photos here, or click to choose</p>
            <p className="text-[12.5px] text-slate">JPG, PNG or WEBP, up to 2MB each. You can select hundreds at once.</p>
          </button>
          <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ''; }} />

          <datalist id="bulk-photo-products">{sorted.map((p) => <option key={p.id} value={label(p)} />)}</datalist>
          {rows.length > 0 && (
            <table className="mt-4 w-full text-left text-[13.5px]">
              <thead className="text-[12.5px] text-slate"><tr><th className="py-2">Photo</th><th>File</th><th>Product</th><th>Matched by</th><th className="w-[90px]">Status</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.preview} className="border-t border-line align-middle">
                    <td className="py-2"><img src={r.preview} alt="" className="size-12 rounded border border-line object-contain" /></td>
                    <td className="max-w-[180px] truncate pr-3 text-slate" title={r.file.name}>{r.file.name}</td>
                    <td className="pr-3">
                      <input list="bulk-photo-products" defaultValue={r.productId ? label(byId.get(r.productId)!) : ''} disabled={running || r.status === 'done'} placeholder="Type to find the product…"
                        onChange={(e) => { const p = byLabel.get(e.target.value); update(i, { productId: p?.id ?? '', how: p ? 'Chosen by you' : '' }); }}
                        className={`h-9 w-full max-w-[330px] rounded-md border px-2 text-[13px] outline-none ${r.productId ? 'border-line' : 'border-[#f3b3b6] bg-[#fff5f5]'}`} />
                    </td>
                    <td className="text-[12.5px] text-slate">{r.how || 'Not matched'}</td>
                    <td>
                      {r.status === 'done' && <span className="flex items-center gap-1 text-[#077a52]"><CircleCheck className="size-4" /> Added</span>}
                      {r.status === 'uploading' && <span className="flex items-center gap-1 text-navy"><Loader2 className="size-4 animate-spin" /> Uploading</span>}
                      {r.status === 'failed' && <span className="flex items-center gap-1 text-[#e3101a]" title={r.error}><CircleX className="size-4" /> Failed</span>}
                      {r.status === 'ready' && <button disabled={running} onClick={() => setRows((x) => x.filter((_, k) => k !== i))} className="text-[12.5px] text-slate underline">Remove</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-6 py-4">
          <span className="text-[13.5px] text-slate">{rows.length ? `${matched} of ${rows.length} photos matched to a product` : 'No photos added yet'}</span>
          <div className="flex gap-3">
            <button disabled={running} onClick={onClose} className="h-10 rounded-lg border border-line px-5 text-[14px] font-medium text-navy">Close</button>
            <button disabled={running || !matched} onClick={() => void uploadAll()} className="flex h-10 items-center gap-2 rounded-lg bg-[#077a52] px-5 text-[14px] font-semibold text-white disabled:opacity-50">
              {running ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Upload {matched || ''} photo{matched === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
