import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpLeft, Loader2, ScanLine, Search } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { fetchProducts, formatNpr } from '@/services/catalog';
import { useCategories } from '@/hooks/use-catalog';
import { ART_BACKGROUND } from '@/lib/product-art';
import type { Product } from '@/types/store';

const WORDS = ['rice', 'Coke', 'Maggi', 'shampoo', 'diapers', 'biscuits', 'cooking oil', 'chocolate', 'notebook', 'toothpaste', 'dal', 'detergent', 'tea', 'baby lotion'];

/** "Search for rice" typed and erased word by word, like quick-commerce apps. Static when motion is reduced. */
function useTypingPlaceholder(enabled: boolean, prefix = 'Search for ') {
  const [text, setText] = useState(`${prefix}"${WORDS[0]}"`);
  useEffect(() => {
    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let word = 0;
    let chars = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const w = WORDS[word]!;
      chars += deleting ? -1 : 1;
      setText(`${prefix}"${w.slice(0, chars)}"`);
      let wait = deleting ? 45 : 95;
      if (!deleting && chars === w.length) { deleting = true; wait = 1400; }
      else if (deleting && chars === 0) { deleting = false; word = (word + 1) % WORDS.length; wait = 300; }
      timer = setTimeout(tick, wait);
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [enabled, prefix]);
  return text;
}

function useDebounced<T>(value: T, ms = 220) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

/** Bold the typed words inside a product name. */
function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.trim().split(/\s+/).filter((w) => w.length > 1).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${words.join('|')})`, 'ig'));
  return <>{parts.map((p, i) => (i % 2 ? <b key={i} className="font-bold text-navy">{p}</b> : <span key={i}>{p}</span>))}</>;
}

/**
 * Search box with an animated placeholder and live suggestions from the store's products and categories.
 * Used in the desktop header and the phone header.
 */
export function SmartSearch({ variant, placeholder }: { variant: 'desktop' | 'mobile'; placeholder?: string | undefined }) {
  const nav = useNavigate();
  const box = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const animated = !placeholder || placeholder.startsWith('Search for groceries');
  const typing = useTypingPlaceholder(animated);
  const q = useDebounced(query.trim());
  const categories = useCategories();

  const { data, isFetching } = useQuery({
    queryKey: ['suggest', q],
    queryFn: () => fetchProducts({ q, size: 6, page: 1 }),
    enabled: q.length >= 2,
    staleTime: 5 * 60_000,
  });
  const products = q.length >= 2 ? data?.products ?? [] : [];
  const lower = q.toLowerCase();
  const cats = q.length >= 2 ? categories.filter((c) => `${c.name} ${c.short}`.toLowerCase().includes(lower)).slice(0, 3) : [];
  // Keyboard order: categories, products, then "search for …".
  const count = cats.length + products.length + 1;

  // Close when clicking anywhere else.
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function close() { setOpen(false); setActive(-1); }
  function searchAll(text = query) {
    close();
    (document.activeElement as HTMLElement | null)?.blur();
    void nav({ to: '/search', search: { q: text.trim() } });
  }
  function pick(i: number) {
    if (i < cats.length) { close(); void nav({ to: '/categories/$slug', params: { slug: cats[i]!.slug } }); return; }
    const p = products[i - cats.length];
    if (p) { close(); void nav({ to: '/products/$slug', params: { slug: p.slug } }); return; }
    searchAll();
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (active >= 0) pick(active); else if (query.trim()) searchAll();
  }
  function keys(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % count); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? count - 1 : a - 1)); }
    else if (e.key === 'Escape') close();
  }

  const input = (
    <input
      value={query}
      onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(-1); }}
      onFocus={() => setOpen(true)}
      onKeyDown={keys}
      placeholder={animated ? typing : placeholder}
      aria-label="Search products"
      aria-autocomplete="list"
      aria-expanded={open && q.length >= 2}
      autoComplete="off"
      enterKeyHint="search"
      className={`h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate ${variant === 'desktop' ? 'text-[15px]' : 'text-[15px]'}`}
    />
  );

  const panel = open && q.length >= 2 && (
    <div role="listbox" className={`absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-line bg-white text-left shadow-[0_16px_40px_rgb(16_24_40/0.16)] ${variant === 'desktop' ? '' : 'max-h-[70vh] overflow-y-auto'}`}>
      {cats.map((c, i) => (
        <Row key={c.slug} active={active === i} onPick={() => pick(i)}>
          <img src={c.icon} alt="" className="size-9 shrink-0 rounded-lg bg-[#f4f6f8] object-contain p-1" />
          <span className="min-w-0 flex-1"><span className="block text-[14px] text-ink"><Highlight text={c.name} query={q} /></span><span className="text-[12px] text-slate">Category</span></span>
        </Row>
      ))}
      {products.map((p, k) => <ProductRow key={p.id} p={p} q={q} active={active === cats.length + k} onPick={() => pick(cats.length + k)} />)}
      {!products.length && !isFetching && <p className="px-4 py-3 text-[13.5px] text-slate">No products match “{q}”. Try another word.</p>}
      {isFetching && !products.length && <p className="flex items-center gap-2 px-4 py-3 text-[13.5px] text-slate"><Loader2 className="size-4 animate-spin" /> Searching…</p>}
      <Row active={active === count - 1} onPick={() => searchAll()}>
        <Search className="size-4 shrink-0 text-red" />
        <span className="flex-1 text-[14px] font-semibold text-red">See all results for “{q}”{data && data.total > products.length ? ` (${data.total.toLocaleString('en-US')})` : ''}</span>
      </Row>
    </div>
  );

  if (variant === 'desktop') {
    return (
      <form ref={box} onSubmit={submit} className="relative w-full max-w-[720px]">
        <div className="flex h-[48px] overflow-hidden rounded-lg border border-[#dfe3e8] bg-white shadow-[0_1px_2px_rgb(16_24_40/0.04)] focus-within:border-brand/60">
          <label className="flex flex-1 items-center gap-3 pl-5"><Search className="size-5 text-ink" />{input}</label>
          <button className="w-[112px] rounded-lg bg-red text-[16px] font-semibold text-white hover:bg-red/90">Search</button>
        </div>
        {panel}
      </form>
    );
  }
  return (
    <form ref={box} onSubmit={submit} className="relative mt-3">
      <div className="flex h-12 items-center gap-3 rounded-xl border border-[#dde6ea] bg-[#f5fbfc] px-4 focus-within:border-brand/60">
        <Search className="size-5 text-ink" />
        {input}
        <ScanLine className="size-5 text-ink" />
      </div>
      {panel}
    </form>
  );
}

function Row({ active, onPick, children }: { active: boolean; onPick: () => void; children: ReactNode }) {
  return (
    <button type="button" role="option" aria-selected={active} onMouseDown={(e) => e.preventDefault()} onClick={onPick}
      className={`flex w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left last:border-0 ${active ? 'bg-[#f1f8f5]' : 'hover:bg-[#f7faf9]'}`}>
      {children}
    </button>
  );
}

function ProductRow({ p, q, active, onPick }: { p: Product; q: string; active: boolean; onPick: () => void }) {
  return (
    <Row active={active} onPick={onPick}>
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-line" style={{ background: p.art ? ART_BACKGROUND[p.categorySlug ?? ''] : '#fff' }}>
        <img src={p.image} alt="" className={p.art ? 'size-6' : 'size-full object-contain'} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 text-[14px] text-slate"><Highlight text={p.name} query={q} /></span>
        <span className="text-[12px] text-slate">{p.unit} · {p.category}</span>
      </span>
      <span className="shrink-0 text-right text-[13.5px] font-bold text-navy">{formatNpr(p.price)}{p.oldPrice ? <del className="block text-[11.5px] font-normal text-slate">{formatNpr(p.oldPrice)}</del> : null}</span>
      <ArrowUpLeft className="hidden size-4 shrink-0 text-slate sm:block" />
    </Row>
  );
}

