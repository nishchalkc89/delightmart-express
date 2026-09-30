import { ArrowRight, ChevronDown, ImagePlus, Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Field, Panel, Toggle } from './admin-ui';
import { fetchCategories, fetchProductForEdit, saveProduct, uploadImage, type CategoryRow, type ProductInput } from '@/services/admin-actions';
import { useAdminScope } from '@/services/admin-scope';

/* ------------------------------------------------------------------ */
/* Controlled form controls matching the admin design                  */
/* ------------------------------------------------------------------ */

const box = 'h-10 w-full rounded-lg border border-line bg-white px-3 text-[14px] text-navy outline-none placeholder:text-slate focus:border-[#077a52]';

export function Input({ value, onChange, placeholder, type = 'text', suffix }: { value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string; suffix?: ReactNode }) {
  return (
    <span className="flex items-center rounded-lg border border-line bg-white focus-within:border-[#077a52]">
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10 min-w-0 flex-1 rounded-lg bg-transparent px-3 text-[14px] text-navy outline-none placeholder:text-slate" />
      {suffix && <span className="grid h-10 place-items-center border-l border-line px-3 text-[14px] text-navy">{suffix}</span>}
    </span>
  );
}

export function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <span className="relative block">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${box} appearance-none pr-9`}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-slate" />
    </span>
  );
}

export function Area({ value, onChange, placeholder, max, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; max?: number; rows?: number }) {
  return (
    <>
      <textarea rows={rows} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2.5 text-[14px] text-navy outline-none placeholder:text-slate focus:border-[#077a52]" />
      {max && <span className="mt-1 block text-right text-[12px] text-slate">{value.length}/{max}</span>}
    </>
  );
}

/** Image picker that uploads to Supabase Storage and returns the public URL. */
export function ImageUpload({ bucket, value, onChange, hint = 'PNG, JPG (Max 2MB)', extra, searchText }: { bucket: 'product-images' | 'category-images' | 'banners' | 'store-branding'; value: string | null; onChange: (url: string | null) => void; hint?: string; extra?: string; searchText?: string | undefined }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try { onChange(await uploadImage(bucket, file)); toast.success('Image uploaded'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Upload failed'); } finally { setBusy(false); }
  }
  /** Ctrl+V of an image copied from another tab ("Copy image"), or of an image address. */
  function paste(e: ClipboardEvent) {
    const file = [...e.clipboardData.files].find((f) => f.type.startsWith('image/'));
    if (file) { e.preventDefault(); void pick(file); return; }
    const text = e.clipboardData.getData('text').trim();
    if (/^https?:\/\/\S+$/i.test(text)) { e.preventDefault(); applyLink(text); }
  }
  /** An image dragged in from another tab arrives either as a file or as its address. */
  function drop(e: DragEvent) {
    e.preventDefault();
    const file = [...e.dataTransfer.files].find((f) => f.type.startsWith('image/'));
    if (file) { void pick(file); return; }
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (/^https?:\/\//i.test(url.trim())) applyLink(url.trim());
  }
  function applyLink(url: string) {
    if (/google\.[a-z.]+\/(imgres|search|url)/i.test(url)) { toast.error('That is a Google page link. Right-click the picture and choose "Copy image" or "Copy image address".'); return; }
    onChange(url); setLink(''); toast.success('Image added');
  }
  return (
    <div className="relative" onPaste={paste} onDragOver={(e) => e.preventDefault()} onDrop={drop}>
      {searchText !== undefined && (
        <div className="mb-2.5 rounded-lg bg-[#f1f7fd] p-3 text-[13px] text-navy">
          <a href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchText)}`} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 font-semibold text-[#2f73d9] shadow-sm ${searchText ? '' : 'pointer-events-none opacity-50'}`}>
            <Search className="size-4" /> Find photo on Google Images
          </a>
          <p className="mt-2 leading-5 text-slate">Pick a clear photo of this exact product, right-click it → <b>Copy image</b>, then click the box below and press <b>Ctrl+V</b>. You can also drag the photo here or paste its address.</p>
          <input value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && link.trim()) { e.preventDefault(); applyLink(link.trim()); } }} placeholder="…or paste image address and press Enter" className="mt-2 h-9 w-full rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-[#077a52]" />
        </div>
      )}
      <button type="button" onClick={() => input.current?.click()} className="grid w-full place-items-center rounded-lg border border-dashed border-[#c9d1da] bg-[#f8fafc] px-4 py-5 text-center hover:border-[#077a52]">
        {value ? <img src={value} alt="" className="max-h-[110px] w-auto rounded object-contain" /> : busy ? <Loader2 className="size-8 animate-spin text-navy" /> : <ImagePlus className="size-8 text-navy" strokeWidth={1.5} />}
        <p className="mt-2 text-[14px] font-medium text-navy">{busy ? 'Uploading…' : value ? 'Click to replace, or press Ctrl+V' : 'Click to upload, or press Ctrl+V'}</p>
        <p className="text-[12.5px] text-slate">{hint}</p>
        {extra && <p className="text-[12.5px] text-slate">{extra}</p>}
      </button>
      {value && <button type="button" aria-label="Remove image" onClick={() => onChange(null)} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white shadow"><X className="size-4" /></button>}
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
    </div>
  );
}

export function FormButtons({ primary, busy, onCancel, onPrimary }: { primary: ReactNode; busy?: boolean; onCancel: () => void; onPrimary: () => void }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      <button type="button" onClick={onCancel} className="h-[44px] rounded-lg border border-line bg-white text-[15px] font-medium text-navy">Cancel</button>
      <button type="button" onClick={onPrimary} disabled={busy} className="flex h-[44px] items-center justify-center gap-2 rounded-lg bg-[#077a52] text-[15px] font-semibold text-white disabled:opacity-60">{busy ? <Loader2 className="size-4 animate-spin" /> : primary}</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product form (Add / Edit)                                           */
/* ------------------------------------------------------------------ */

const emptyProduct: ProductInput = { name: '', sku: '', categoryId: '', brand: '', description: '', price: 0, salePrice: null, unit: '1 pc', stock: 0, threshold: 10, featured: false, active: true, imageUrl: null };

export function ProductForm({ editId, duplicateId, live, onSaved, onClose }: { editId: string | null; duplicateId?: string | null; live: boolean; onSaved: () => void; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const [p, setP] = useState<ProductInput>(emptyProduct);
  const { stockBranch, label } = useAdminScope();
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setP((x) => ({ ...x, [k]: v }));

  useEffect(() => { if (live) void fetchCategories().then(setCats).catch(() => setCats([])); }, [live]);
  useEffect(() => {
    setTab(0);
    const source = editId ?? duplicateId;
    if (!source || !live) { setP(emptyProduct); return; }
    void fetchProductForEdit(source).then((x) => setP(duplicateId ? { ...x, id: undefined, name: `${x.name} (Copy)`, sku: `${x.sku}-COPY` } : x)).catch((e: Error) => toast.error(e.message));
  }, [editId, duplicateId, live]);

  const main = cats.filter((c) => !c.parent_id);
  const subs = cats.filter((c) => c.parent_id && c.parent_id === (cats.find((x) => x.id === p.categoryId)?.parent_id ?? p.categoryId));

  async function submit() {

    if (!p.name.trim() || !p.sku.trim() || !p.categoryId) { setTab(0); toast.error('Product name, SKU and category are required'); return; }
    if (!(p.price > 0)) { setTab(1); toast.error('Enter the product price'); return; }
    if (p.salePrice !== null && p.salePrice >= p.price) { setTab(1); toast.error('Sale price must be lower than the price'); return; }
    setBusy(true);
    try {
      await saveProduct(p);
      toast.success(editId ? 'Product updated' : 'Product added to the store');
      setP(emptyProduct); onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? (e.message.includes('duplicate') ? 'A product with this name or SKU already exists' : e.message) : 'Could not save the product');
    } finally { setBusy(false); }
  }

  const tabs = ['Basic Information', 'Pricing & Stock', 'Images', 'More'];
  return (
    <Panel title={editId ? 'Edit Product' : 'Add New Product'} onClose={onClose} className="xl:sticky xl:top-[88px]">
      <div className="-mx-5 mb-4 flex gap-4 border-b border-line px-5 text-[13px]">
        {tabs.map((t, i) => <button key={t} type="button" onClick={() => setTab(i)} className={`relative whitespace-nowrap pb-2.5 ${i === tab ? 'font-semibold text-[#077a52]' : 'text-slate'}`}>{t}{i === tab && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#077a52]" />}</button>)}
      </div>
      {tab === 0 && (
        <div className="space-y-4">
          <Field label="Product Name" required><Input value={p.name} onChange={(v) => set('name', v)} placeholder="Enter product name" /></Field>
          <Field label="SKU" required><Input value={p.sku} onChange={(v) => set('sku', v)} placeholder="Enter SKU (e.g. SKU00123)" /></Field>
          <Field label="Category" required>
            <Select value={main.some((c) => c.id === p.categoryId) ? p.categoryId : cats.find((c) => c.id === p.categoryId)?.parent_id ?? ''} onChange={(v) => set('categoryId', v)}>
              <option value="">Select category</option>
              {main.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Subcategory">
            <Select value={subs.some((c) => c.id === p.categoryId) ? p.categoryId : ''} onChange={(v) => v && set('categoryId', v)}>
              <option value="">{subs.length ? 'Select subcategory' : 'No subcategories'}</option>
              {subs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Brand"><Input value={p.brand} onChange={(v) => set('brand', v)} placeholder="Enter brand name" /></Field>
          <Field label="Description" required><Area value={p.description} onChange={(v) => set('description', v)} placeholder="Enter product description..." max={500} /></Field>
        </div>
      )}
      {tab === 1 && (
        <div className="space-y-4">
          <Field label="Price (NPR)" required><Input type="number" value={p.price || ''} onChange={(v) => set('price', Number(v))} placeholder="e.g. 1499" /></Field>
          <Field label="Sale Price (NPR)" hint="Leave empty when the product is not on sale"><Input type="number" value={p.salePrice ?? ''} onChange={(v) => set('salePrice', v === '' ? null : Number(v))} placeholder="e.g. 1199" /></Field>
          <Field label="Unit"><Input value={p.unit} onChange={(v) => set('unit', v)} placeholder="e.g. 5kg, 1L, 1 pc" /></Field>
          {stockBranch ? <>
          <Field label={`Current Stock (${label})`}><Input type="number" value={p.stock} onChange={(v) => set('stock', Math.max(0, Number(v)))} /></Field>
          <Field label="Low Stock Threshold" hint="Get notified when stock is below this level"><Input type="number" value={p.threshold} onChange={(v) => set('threshold', Math.max(0, Number(v)))} /></Field>
          </> : <p className="rounded-lg bg-[#fff8e6] p-3 text-[13px] leading-5 text-[#8a5a00]">Stock is kept per store. Choose a store at the top of the page to set this product’s stock there (new products start at 0 in every store).</p>}
        </div>
      )}
      {tab === 2 && <Field label="Product Image"><ImageUpload bucket="product-images" value={p.imageUrl} onChange={(v) => set('imageUrl', v)} extra="Square images look best" searchText={p.name} /></Field>}
      {tab === 3 && (
        <ul className="divide-y divide-line">
          <li className="flex items-center justify-between py-3"><span><b className="block text-[14.5px] font-medium text-navy">Active</b><span className="text-[13px] text-slate">Show this product in the store</span></span><Toggle key={`a${p.active}`} on={p.active} onChange={(v) => set('active', v)} /></li>
          <li className="flex items-center justify-between py-3"><span><b className="block text-[14.5px] font-medium text-navy">Featured</b><span className="text-[13px] text-slate">Highlight on the homepage</span></span><Toggle key={`f${p.featured}`} on={p.featured} onChange={(v) => set('featured', v)} /></li>
        </ul>
      )}
      {tab < 3
        ? <FormButtons primary={<>Next <ArrowRight className="size-4" /></>} onCancel={onClose} onPrimary={() => setTab(tab + 1)} />
        : <FormButtons primary={editId ? 'Save Changes' : 'Save Product'} busy={busy} onCancel={onClose} onPrimary={() => void submit()} />}
      {tab < 3 && <button type="button" onClick={() => void submit()} disabled={busy} className="mt-2 w-full text-center text-[13px] font-medium text-[#077a52]">{editId ? 'Save changes now' : 'Save product now'}</button>}
    </Panel>
  );
}
