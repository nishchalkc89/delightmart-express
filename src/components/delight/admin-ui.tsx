import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Filter, ImagePlus, Minus, Search, X, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

export function PageHeader({ title, subtitle, actions, badge }: { title: string; subtitle: string; actions?: ReactNode; badge?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[34px] font-extrabold leading-tight tracking-tight text-navy">{title}{badge}</h1>
        <p className="mt-0.5 text-[17px] text-slate">{subtitle}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3 pt-1">{actions}</div>}
    </div>
  );
}

/** Tells staff whether a screen shows live store data or the sample data from the approved designs. */
export function DataBadge({ live, loading }: { live: boolean; loading?: boolean }) {
  if (loading) return <span className="ml-3 inline-flex rounded-full bg-[#eef1f4] px-2.5 py-1 align-middle text-[12px] font-medium text-slate">Loading…</span>;
  return live
    ? <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-[#e3f6ec] px-2.5 py-1 align-middle text-[12px] font-semibold text-[#0a8a5b]"><span className="size-1.5 rounded-full bg-[#0a8a5b]" />Live data</span>
    : <span title="Sign in with a staff account to see live store data" className="ml-3 inline-flex rounded-full bg-[#fdf1dc] px-2.5 py-1 align-middle text-[12px] font-semibold text-[#b45309]">Sample data</span>;
}

export function PrimaryAction({ icon: Icon, children, onClick }: { icon: LucideIcon; children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex h-[44px] items-center gap-2.5 rounded-lg bg-[#077a52] px-5 text-[15px] font-semibold text-white shadow-md shadow-[#077a52]/20 hover:bg-[#066a47]">
      <Icon className="size-5" /> {children}
    </button>
  );
}

export function OutlineAction({ icon: Icon, children, onClick }: { icon: LucideIcon; children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex h-[44px] items-center gap-2.5 rounded-lg border border-line bg-white px-5 text-[15px] font-medium text-navy hover:bg-page">
      <Icon className="size-5" /> {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Stat cards                                                          */
/* ------------------------------------------------------------------ */

export type Tone = 'green' | 'blue' | 'amber' | 'red' | 'purple';

const toneStyles: Record<Tone, { card: string; circle: string; icon: string }> = {
  green: { card: 'bg-[#f0fbf5] border-[#dff3e8]', circle: 'bg-[#dcf3e7]', icon: 'text-[#0a8a5b]' },
  blue: { card: 'bg-[#f0f8ff] border-[#dfeefb]', circle: 'bg-[#dcecfb]', icon: 'text-[#2f80ed]' },
  amber: { card: 'bg-[#fef9ee] border-[#f8ecd0]', circle: 'bg-[#fdefcc]', icon: 'text-[#f59f0b]' },
  red: { card: 'bg-[#fdf3f3] border-[#f8e1e1]', circle: 'bg-[#fbdada]', icon: 'text-[#e3101a]' },
  purple: { card: 'bg-[#f4f3ff] border-[#e7e5fb]', circle: 'bg-[#e6e2fc]', icon: 'text-[#7c5cf5]' },
};

export function StatCard({ icon: Icon, tone, label, value, delta, dir = 'up', note = 'vs last month', filled = true, compact = false }: { icon: LucideIcon; tone: Tone; label: string; value: string; delta?: string | undefined; dir?: 'up' | 'down' | 'flat' | 'none'; note?: string; filled?: boolean; compact?: boolean }) {
  const t = toneStyles[tone];
  const deltaColor = dir === 'down' ? 'text-[#e3101a]' : dir === 'flat' ? 'text-[#f59f0b]' : dir === 'none' ? 'text-slate' : 'text-[#0a8a5b]';
  const Arrow = dir === 'down' ? ArrowDown : dir === 'flat' ? ArrowRight : dir === 'none' ? Minus : ArrowUpRight;
  return (
    <div className={`flex rounded-xl border ${compact ? 'gap-2.5 px-3 py-3.5' : 'gap-3.5 px-4 py-4'} ${t.card}`}>
      <span className={`grid shrink-0 place-items-center rounded-full ${compact ? 'size-[44px]' : 'size-[54px]'} ${t.circle}`}><Icon className={`${compact ? 'size-6' : 'size-7'} ${t.icon} ${filled ? 'fill-current' : ''}`} strokeWidth={filled ? 1.4 : 2} /></span>
      <div className="min-w-0 pt-0.5">
        <p className={`truncate text-ink ${compact ? 'text-[13px]' : 'text-[14px]'}`}>{label}</p>
        <p className={`mt-0.5 whitespace-nowrap font-extrabold leading-tight text-navy ${compact ? 'text-[22px]' : value.length > 9 ? 'text-[21px]' : 'text-[24px]'}`}>{value}</p>
        {delta !== undefined && <p className={`mt-1 flex items-center gap-1 text-[14px] font-semibold ${deltaColor}`}><Arrow className="size-4" strokeWidth={2.5} />{delta}</p>}
        {note && <p className="text-[14px] text-slate">{note}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs / filters                                                      */
/* ------------------------------------------------------------------ */

export function Tabs({ items, active, onChange }: { items: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <div className="no-scrollbar flex gap-8 overflow-x-auto border-b border-line px-5">
      {items.map((t, i) => (
        <button key={t} onClick={() => onChange(i)} className={`relative whitespace-nowrap pb-3.5 pt-4 text-[14.5px] ${i === active ? 'font-semibold text-[#077a52]' : 'text-slate hover:text-navy'}`}>
          {t}
          {i === active && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#077a52]" />}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({ placeholder, value, onChange, className = 'w-[320px]' }: { placeholder: string; value?: string; onChange?: (v: string) => void; className?: string }) {
  return (
    <label className={`flex h-[40px] items-center gap-2.5 rounded-lg border border-line bg-[#f7f9fb] px-3.5 ${className}`}>
      <Search className="size-[18px] text-slate" />
      <input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[13.5px] text-navy outline-none placeholder:text-slate" aria-label={placeholder} />
    </label>
  );
}

export function SelectBox({ label, className = 'w-[150px]' }: { label: string; className?: string }) {
  return (
    <button className={`flex h-[40px] items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 text-[13px] text-navy ${className}`}>
      <span className="truncate">{label}</span><ChevronDown className="size-4 shrink-0 text-slate" />
    </button>
  );
}

/** Working dropdown styled like SelectBox. */
export function FilterSelect({ value, onChange, options, className = 'w-[150px]', label }: { value: string; onChange: (v: string) => void; options: Array<[string, string]>; className?: string; label: string }) {
  return (
    <span className={`relative flex h-[40px] items-center rounded-lg border border-line bg-white text-[13px] text-navy ${className}`}>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-full w-full cursor-pointer appearance-none truncate rounded-lg bg-transparent pl-3 pr-8 outline-none">
        {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-slate" />
    </span>
  );
}

export function DateRange({ label = '21 Sep 2026 - 21 Oct 2026', className = '' }: { label?: string; className?: string }) {
  return (
    <button className={`flex h-[40px] items-center gap-2 whitespace-nowrap rounded-lg border border-line bg-white px-3 text-[13px] text-navy ${className}`}>
      <CalendarDays className="size-[18px] text-navy" /> {label} <ChevronDown className="size-4 text-slate" />
    </button>
  );
}

export function FiltersButton() {
  return (
    <button className="flex h-[40px] items-center gap-2 rounded-lg border border-line bg-white px-4 text-[14px] font-semibold text-navy"><Filter className="size-4" /> Filters</button>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2.5 px-4 py-4">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-white shadow-[0_1px_2px_rgb(16_24_40/0.03)] ${className}`}>{children}</section>;
}

export function Checkbox({ checked = false }: { checked?: boolean }) {
  return <span className={`inline-block size-[17px] rounded-[4px] border-2 ${checked ? 'border-[#077a52] bg-[#077a52]' : 'border-[#b6bec8] bg-white'}`} />;
}

export function Table({ head, children, className = '' }: { head: ReactNode[]; children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-left ${className}`}>
        <thead>
          <tr className="border-y border-line bg-[#f8f9fc] text-[13px] text-slate">
            {head.map((h, i) => <th key={i} className="whitespace-nowrap px-2.5 py-3 font-medium first:pl-4 last:pr-4">{h}</th>)}
          </tr>
        </thead>
        <tbody className="text-[13px] text-navy">{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, active = false, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return <tr onClick={onClick} className={`border-b border-line last:border-0 ${onClick ? 'cursor-pointer' : ''} ${active ? 'bg-[#f5fbf8]' : 'hover:bg-[#fafbfc]'}`}>{children}</tr>;
}

export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`px-2.5 py-2.5 align-middle first:pl-4 last:pr-4 ${className}`}>{children}</td>;
}

const badgeTones = {
  green: 'bg-[#e3f6ec] text-[#0a8a5b]',
  red: 'bg-[#fde7e7] text-[#e3101a]',
  amber: 'bg-[#fdf1dc] text-[#d97706]',
  blue: 'bg-[#e4f0fd] text-[#2f73d9]',
  purple: 'bg-[#efeafd] text-[#7c5cf5]',
  gray: 'bg-[#eef1f4] text-[#4b5563]',
  pink: 'bg-[#fde8f3] text-[#d0318a]',
  teal: 'bg-[#dcf7f3] text-[#0f8f7e]',
  orange: 'bg-[#fdecd9] text-[#c2620a]',
} as const;
export type BadgeTone = keyof typeof badgeTones;

export function Badge({ tone, children, className = '' }: { tone: BadgeTone; children: ReactNode; className?: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-[5px] px-2 py-1 text-[12.5px] font-medium ${badgeTones[tone]} ${className}`}>{children}</span>;
}

const statusTone: Record<string, BadgeTone> = {
  Active: 'green', Delivered: 'green', Success: 'green', Paid: 'green', 'In Stock': 'green', Published: 'green',
  Inactive: 'red', Cancelled: 'red', Failed: 'red', 'Out of Stock': 'red', 'Low Stock': 'red', Hidden: 'red',
  Pending: 'red', Preparing: 'amber', Processing: 'amber',
  'Out for Delivery': 'blue', New: 'blue', VIP: 'purple', COD: 'gray', Refunded: 'purple', Scheduled: 'amber',
};

export function Status({ value }: { value: string }) {
  return <Badge tone={statusTone[value] ?? 'gray'}>{value}</Badge>;
}

export function Toggle({ on: initial = true, onChange }: { on?: boolean; onChange?: (v: boolean) => void }) {
  const [on, setOn] = useState(initial);
  return (
    <button role="switch" aria-checked={on} onClick={(e) => { e.stopPropagation(); setOn(!on); onChange?.(!on); }} className={`relative h-[22px] w-[40px] shrink-0 rounded-full transition-colors ${on ? 'bg-[#0a8a5b]' : 'bg-[#cfd5dc]'}`}>
      <span className={`absolute top-[3px] size-4 rounded-full bg-white shadow transition-all ${on ? 'left-[21px]' : 'left-[3px]'}`} />
    </button>
  );
}

export function IconBtn({ icon: Icon, label, tone = 'default', onClick }: { icon: LucideIcon; label: string; tone?: 'default' | 'danger'; onClick?: () => void }) {
  return (
    <button aria-label={label} onClick={(e) => { e.stopPropagation(); onClick?.(); }} className={`grid size-[34px] place-items-center rounded-lg border border-line bg-white hover:bg-page ${tone === 'danger' ? 'text-[#e3101a]' : 'text-navy'}`}>
      <Icon className="size-[17px]" />
    </button>
  );
}

export function Avatar({ src, name, size = 'size-9' }: { src?: string | undefined; name: string; size?: string }) {
  if (src) return <img src={src} alt="" className={`${size} shrink-0 rounded-full object-cover`} />;
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const palette = ['bg-[#fde7ef] text-[#d0318a]', 'bg-[#e4f0fd] text-[#2f73d9]', 'bg-[#e3f6ec] text-[#0a8a5b]'];
  return <span className={`${size} grid shrink-0 place-items-center rounded-full text-[14px] font-bold ${palette[name.length % 3]}`}>{initials}</span>;
}

/** Page numbers around the current page, e.g. 1 … 4 5 6 … 20. */
export function pageList(page: number, count: number): Array<number | string> {
  const nums = [...new Set([1, page - 1, page, page + 1, count])].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  return nums.flatMap((n, i) => (i > 0 && n - nums[i - 1]! > 1 ? ['…', n] : [n]));
}

export function Pagination({ text, pages = [1, 2, 3, 4, 5, '…', 125], perPage = '10 per page', current, pageCount, onPage }: { text: string; pages?: Array<number | string> | undefined; perPage?: string; current?: number | undefined; pageCount?: number | undefined; onPage?: ((page: number) => void) | undefined }) {
  const [own, setOwn] = useState(1);
  const page = current ?? own;
  const setPage = (n: number) => { if (pageCount && (n < 1 || n > pageCount)) return; setOwn(n); onPage?.(n); };
  if (pageCount) pages = pageList(page, pageCount);
  return (
    <div className="flex items-center justify-between px-5 py-4 text-[14px] text-slate">
      <span>{text}</span>
      <div className="flex items-center gap-2">
        <button aria-label="Previous page" onClick={() => setPage(page - 1)} className="grid size-8 place-items-center rounded-md text-navy"><ChevronLeft className="size-4" /></button>
        {pages.map((p, i) => typeof p === 'number'
          ? <button key={i} onClick={() => setPage(p)} className={`grid h-8 min-w-8 place-items-center rounded-md border px-2 text-[13.5px] ${page === p ? 'border-[#9dc9f5] bg-[#eaf4fe] text-[#2f73d9]' : 'border-line bg-white text-navy'}`}>{p}</button>
          : <span key={i} className="px-1">…</span>)}
        <button aria-label="Next page" onClick={() => setPage(page + 1)} className="grid size-8 place-items-center rounded-md text-navy"><ChevronRight className="size-4" /></button>
      </div>
      <div className="flex items-center gap-3">Show <SelectBox label={perPage} className="w-[132px]" /></div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Side panel + form fields                                            */
/* ------------------------------------------------------------------ */

export function Panel({ title, children, onClose, className = '' }: { title?: ReactNode; children: ReactNode; onClose?: () => void; className?: string }) {
  return (
    <aside className={`rounded-xl border border-line bg-white p-5 shadow-[0_1px_2px_rgb(16_24_40/0.03)] ${className}`}>
      {title && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">{typeof title === 'string' ? <h2 className="text-[19px] font-bold text-navy">{title}</h2> : title}</div>
          {onClose && <button aria-label="Close panel" onClick={onClose} className="text-navy"><X className="size-5" /></button>}
        </div>
      )}
      {children}
    </aside>
  );
}

export function PanelTitle({ children, link }: { children: ReactNode; link?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[17px] font-bold text-navy">{children}</h2>
      {link && <button className="text-[14px] font-medium text-[#2f73d9]">{link}</button>}
    </div>
  );
}

export function Field({ label, required, children, hint }: { label: string; required?: boolean; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-medium text-navy">{label}{required && <span className="text-[#e3101a]"> *</span>}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-slate">{hint}</span>}
    </label>
  );
}

export function TextInput({ placeholder, value, defaultValue, suffix, type = 'text' }: { placeholder?: string; value?: string; defaultValue?: string; suffix?: ReactNode; type?: string }) {
  return (
    <span className="flex h-[40px] items-center rounded-lg border border-line bg-white focus-within:border-[#077a52]">
      <input type={type} value={value} defaultValue={defaultValue} readOnly={value !== undefined} placeholder={placeholder} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] text-navy outline-none placeholder:text-slate" />
      {suffix && <span className="grid h-full place-items-center border-l border-line px-3 text-[14px] text-navy">{suffix}</span>}
    </span>
  );
}

export function TextArea({ placeholder, max, rows = 4 }: { placeholder?: string; max?: number; rows?: number }) {
  const [v, setV] = useState('');
  return (
    <>
      <textarea rows={rows} value={v} maxLength={max} onChange={(e) => setV(e.target.value)} placeholder={placeholder} className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2.5 text-[14px] text-navy outline-none placeholder:text-slate focus:border-[#077a52]" />
      {max && <span className="mt-1 block text-right text-[12px] text-slate">{v.length}/{max}</span>}
    </>
  );
}

export function Dropdown({ label }: { label: string }) {
  return <SelectBox label={label} className="w-full" />;
}

export function UploadBox({ hint = 'PNG, JPG (Max 2MB)', extra }: { hint?: string; extra?: string }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-[#c9d1da] bg-[#f8fafc] px-4 py-6 text-center">
      <ImagePlus className="size-8 text-navy" strokeWidth={1.5} />
      <p className="mt-2 text-[14px] font-medium text-navy">Click to upload image</p>
      <p className="text-[12.5px] text-slate">{hint}</p>
      {extra && <p className="text-[12.5px] text-slate">{extra}</p>}
    </div>
  );
}

export function PanelButtons({ primary, onCancel, onPrimary }: { primary: ReactNode; onCancel?: () => void; onPrimary?: () => void }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      <button onClick={onCancel} className="h-[44px] rounded-lg border border-line bg-white text-[15px] font-medium text-navy">Cancel</button>
      <button onClick={onPrimary} className="flex h-[44px] items-center justify-center gap-2 rounded-lg bg-[#077a52] text-[15px] font-semibold text-white">{primary}</button>
    </div>
  );
}

export function TipCard({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex gap-3 rounded-xl border border-[#d8efe3] bg-[#f0faf5] p-5">
      <span className="text-[#0a8a5b]"><svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" /></svg></span>
      <div><b className="text-[16px] font-semibold text-[#0a8a5b]">Tip</b><p className="mt-1 text-[13.5px] leading-5 text-slate">{children}</p></div>
    </div>
  );
}

/** Two-column admin layout: main content + right panel. */
export function WithPanel({ main, panel }: { main: ReactNode; panel: ReactNode }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
      <div className="min-w-0">{main}</div>
      <div className="min-w-0">{panel}</div>
    </div>
  );
}
