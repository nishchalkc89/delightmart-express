import { CircleCheck, CircleX, Download, ImagePlus, ListOrdered, Loader2, Upload, X } from 'lucide-react';
import { useMemo, useRef, useState, type DragEvent } from 'react';
import { toast } from 'sonner';
import { addProductPhoto, setProductPhoto, uploadImage } from '@/services/admin-actions';
import type { AdminProduct } from '@/services/admin';
import { downloadCsv } from './admin-ui';
import { buildIndex, isCameraName, matchPhoto, photoChecklist, shrinkPhoto, type PhotoProduct } from '@/lib/photo-match';

type Row = { file: File; preview: string; productId: string; how: string; extra: boolean; status: 'ready' | 'uploading' | 'done' | 'failed'; error?: string };

const label = (p: PhotoProduct) => `${p.code} — ${p.name}`;
const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size;

/**
 * Rows that must not be uploaded, so no product is updated twice in one batch:
 * a second main photo for the same product, or the same extra photo twice.
 * Returns row index → the file it repeats.
 */
function findDuplicates(rows: Row[]): Map<number, string> {
  const dup = new Map<number, string>();
  const mainFor = new Map<string, string>();
  const extras: Array<{ productId: string; file: File }> = [];
  rows.forEach((r, i) => {
    if (!r.productId) return;
    if (r.extra) {
      const same = extras.find((e) => e.productId === r.productId && sameFile(e.file, r.file));
      if (same) dup.set(i, same.file.name); else extras.push({ productId: r.productId, file: r.file });
      return;
    }
    const first = mainFor.get(r.productId);
    if (first !== undefined) dup.set(i, first); else mainFor.set(r.productId, r.file.name);
  });
  return dup;
}

export function BulkPhotoUpload({ products, onClose, onDone }: { products: AdminProduct[]; onClose: () => void; onDone: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const items = useMemo<PhotoProduct[]>(() => products.map((p) => ({ id: p.id, name: p.name, slug: p.slug, code: p.code, category: p.category, hasPhoto: p.hasPhoto })), [products]);
  const byId = useMemo(() => new Map(items.map((p) => [p.id, p])), [items]);
  const index = useMemo(() => buildIndex(items), [items]);
  const checklist = useMemo(() => photoChecklist(items), [items]);
  const sorted = useMemo(() => [...items].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })), [items]);
  const byLabel = useMemo(() => new Map(items.map((p) => [label(p), p])), [items]);

  function add(files: FileList | File[]) {
    const picked = [...files].filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(f.name));
    if (!picked.length) { toast.error('Choose photo files (JPG, PNG or WEBP)'); return; }
    // The same file twice (already in the list, or picked twice) is added only once.
    const images = picked.filter((f, k) => !rows.some((r) => sameFile(r.file, f)) && picked.findIndex((g) => sameFile(g, f)) === k);
    if (images.length < picked.length) toast.info(`${picked.length - images.length} photo${picked.length - images.length === 1 ? ' was' : 's were'} already in the list and skipped.`);
    if (!images.length) return;
    const next = images.map((file): Row => {
      const m = matchPhoto(file.name, items, index);
      return { file, preview: URL.createObjectURL(file), productId: m.product?.id ?? '', how: m.product ? m.how : '', extra: m.extra, status: 'ready' };
    });
    setRows((r) => [...r, ...next]);
    const camera = next.filter((r) => !r.productId && isCameraName(r.file.name)).length;
    if (camera) toast.info(`${camera} phone photo${camera === 1 ? '' : 's'} not matched by name. If you took them in checklist order, press “Match phone photos in checklist order”.`, { duration: 8000 });
  }
  function drop(e: DragEvent) { e.preventDefault(); add(e.dataTransfer.files); }
  const update = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  /** Phone photos (IMG_…): the n-th photo taken goes to the n-th product on the checklist still without a photo. */
  function matchByOrder() {
    const taken = new Set(rows.filter((r) => r.productId && !r.extra).map((r) => r.productId));
    const queue = checklist.filter((p) => !taken.has(p.id));
    const pending = rows.map((r, i) => [r, i] as const).filter(([r]) => !r.productId).sort(([a], [b]) => a.file.lastModified - b.file.lastModified || a.file.name.localeCompare(b.file.name));
    if (!pending.length) { toast.info('Every photo is already matched'); return; }
    const assigned = new Map<number, string>();
    pending.forEach(([, i], k) => { const p = queue[k]; if (p) assigned.set(i, p.id); });
    setRows((r) => r.map((x, i) => (assigned.has(i) ? { ...x, productId: assigned.get(i)!, how: 'Checklist order — check it', extra: false } : x)));
    toast.success(`${assigned.size} photo${assigned.size === 1 ? '' : 's'} matched in checklist order. Check each one before uploading.`);
  }

  function downloadChecklist() {
    downloadCsv('delight-photo-checklist.csv', [
      ['No.', 'Product code', 'Product', 'Category', 'Name the photo'],
      ...checklist.map((p, i) => [i + 1, p.code, p.name, p.category, `${p.code}.jpg`]),
    ]);
  }

  async function uploadAll() {
    // Each product is updated once: duplicates in this batch are skipped.
    const todo = rows.map((r, i) => [r, i] as const).filter(([r, i]) => r.productId && r.status !== 'done' && !duplicates.has(i));
    if (!todo.length) { toast.info('Match each photo to a product first'); return; }
    const extraFor = new Map<number, boolean>(todo.map(([r, i]) => [i, r.extra]));
    setRunning(true);
    let ok = 0;
    let failed = 0;
    // Main photos first, so extra photos are added after them.
    const queue = [...todo].sort(([, a], [, b]) => Number(extraFor.get(a)) - Number(extraFor.get(b)));
    const worker = async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        const [r, i] = item;
        update(i, { status: 'uploading' });
        try {
          const file = await shrinkPhoto(r.file);
          const url = await uploadImage('product-images', file);
          const name = byId.get(r.productId)?.name ?? '';
          if (extraFor.get(i)) await addProductPhoto(r.productId, url, name);
          else await setProductPhoto(r.productId, url, name);
          update(i, { status: 'done' });
          ok++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Upload failed';
          failed++;
          update(i, { status: 'failed', error: /heic|2MB/i.test(msg) || /\.heic$/i.test(r.file.name) ? `${msg}. iPhone HEIC photos: set Camera → Formats → Most Compatible, or send as JPG.` : msg });
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    setRunning(false);
    if (ok) {
      toast.success(`${ok} photo${ok === 1 ? '' : 's'} added to products`);
      onDone();
    }
    if (!failed) {
      // Everything uploaded: close the window.
      rows.forEach((r) => URL.revokeObjectURL(r.preview));
      onClose();
    } else {
      // Keep only the photos that failed, so they can be fixed and tried again.
      setRows((list) => list.filter((r) => { if (r.status === 'done') URL.revokeObjectURL(r.preview); return r.status !== 'done'; }));
      toast.error(`${failed} photo${failed === 1 ? '' : 's'} could not be uploaded. Point to “Failed” to see why, then try again.`);
    }
  }

  const duplicates = useMemo(() => findDuplicates(rows), [rows]);
  const matched = rows.filter((r, i) => r.productId && r.status !== 'done' && !duplicates.has(i)).length;
  const unmatched = rows.length - matched;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1726]/45 p-4 sm:p-6" onClick={() => !running && onClose()}>
      <div className="flex max-h-[90vh] w-full max-w-[980px] flex-col rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <h2 className="text-[20px] font-bold text-navy">Bulk Photo Upload</h2>
            <p className="mt-1 text-[13.5px] leading-5 text-slate">
              The easiest way: name each photo with its <b>product code</b>, e.g. <b>5.296.jpg</b> (or <b>5.296 Rico jelly.jpg</b>). Extra photos of the same product: <b>5.296-2.jpg</b>.
              Photos straight from a phone (IMG_…): take them in the order of the <b>photo checklist</b>, then use “Match phone photos in checklist order”. Big phone photos are made smaller automatically.
            </p>
          </div>
          <button aria-label="Close" disabled={running} onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-[#f1f4f7]"><X className="size-5" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={downloadChecklist} className="flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-[13px] font-medium text-navy hover:bg-page"><Download className="size-4" /> Photo checklist ({checklist.length} without photo)</button>
            {unmatched > 0 && <button type="button" disabled={running} onClick={matchByOrder} className="flex h-9 items-center gap-2 rounded-lg border border-[#0a8a5b] bg-[#f0fbf5] px-3 text-[13px] font-semibold text-[#077a52]"><ListOrdered className="size-4" /> Match phone photos in checklist order</button>}
          </div>
          <button type="button" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={drop} className="grid w-full place-items-center rounded-xl border-2 border-dashed border-[#c9d1da] bg-[#f8fafc] px-4 py-7 text-center hover:border-[#077a52]">
            <ImagePlus className="size-9 text-navy" strokeWidth={1.5} />
            <p className="mt-2 text-[15px] font-semibold text-navy">Drop photos here, or click to choose</p>
            <p className="text-[12.5px] text-slate">JPG, PNG or WEBP. Select many at once (10, 50 or all of them).</p>
          </button>
          <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp,image/heic,.heic" className="hidden" onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ''; }} />

          <datalist id="bulk-photo-products">{sorted.map((p) => <option key={p.id} value={label(p)} />)}</datalist>
          {rows.length > 0 && (
            <table className="mt-4 w-full text-left text-[13.5px]">
              <thead className="text-[12.5px] text-slate"><tr><th className="py-2">Photo</th><th>File</th><th>Product (type code or name)</th><th>Matched by</th><th className="w-[90px]">Status</th></tr></thead>
              <tbody>
                {rows.map((r, i) => {
                  const p = r.productId ? byId.get(r.productId) : undefined;
                  return (
                    <tr key={r.preview} className="border-t border-line align-middle">
                      <td className="py-2"><img src={r.preview} alt="" className="size-14 rounded border border-line object-contain" /></td>
                      <td className="max-w-[160px] truncate pr-3 text-slate" title={r.file.name}>{r.file.name}</td>
                      <td className="pr-3">
                        <input key={r.productId} list="bulk-photo-products" defaultValue={p ? label(p) : ''} disabled={running || r.status === 'done'} placeholder="Type the product code or name…"
                          onChange={(e) => { const hit = byLabel.get(e.target.value) ?? items.find((x) => x.code === e.target.value.trim()); if (hit || !e.target.value) update(i, { productId: hit?.id ?? '', how: hit ? 'Chosen by you' : '', extra: false }); }}
                          className={`h-9 w-full max-w-[340px] rounded-md border px-2 text-[13px] outline-none ${r.productId ? 'border-line' : 'border-[#f3b3b6] bg-[#fff5f5]'}`} />
                        {r.extra && p && <span className="mt-0.5 block text-[11.5px] text-slate">Extra photo (added after the main photo)</span>}
                        {!r.extra && p?.hasPhoto && !duplicates.has(i) && <span className="mt-0.5 block text-[11.5px] text-[#9a6200]">Replaces this product’s current photo</span>}
                        {duplicates.has(i) && <span className="mt-0.5 block text-[11.5px] text-[#9a6200]">Same product as “{duplicates.get(i)}”: choose another product, or remove it</span>}
                      </td>
                      <td className={`text-[12.5px] ${r.how.startsWith('Checklist') ? 'font-semibold text-[#9a6200]' : 'text-slate'}`}>{r.how || 'Not matched'}</td>
                      <td>
                        {duplicates.has(i) && r.status === 'ready' && <span className="block text-[12px] font-semibold text-[#9a6200]" title={`Same product as ${duplicates.get(i)}`}>Duplicate – skipped</span>}
                        {r.status === 'done' && <span className="flex items-center gap-1 text-[#077a52]"><CircleCheck className="size-4" /> Added</span>}
                        {r.status === 'uploading' && <span className="flex items-center gap-1 text-navy"><Loader2 className="size-4 animate-spin" /> Uploading</span>}
                        {r.status === 'failed' && <span className="flex items-center gap-1 text-[#e3101a]" title={r.error}><CircleX className="size-4" /> Failed</span>}
                        {r.status === 'ready' && <button disabled={running} onClick={() => setRows((x) => x.filter((_, k) => k !== i))} className="text-[12.5px] text-slate underline">Remove</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
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
