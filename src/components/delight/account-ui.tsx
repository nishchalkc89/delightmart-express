import type { ReactNode } from 'react';

/** Title block used by every My Account sub-page. */
export function AccountTitle({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-navy lg:text-[34px]">{title}</h1>
        <p className="text-[14.5px] text-slate">{sub}</p>
      </div>
      {action}
    </div>
  );
}

export function AccountCard({ title, children, className = '' }: { title?: string | undefined; children: ReactNode; className?: string }) {
  return (
    <section className={`mt-4 rounded-2xl border border-line bg-white p-4 lg:p-5 ${className}`}>
      {title && <h2 className="mb-3 text-[17px] font-bold text-navy">{title}</h2>}
      {children}
    </section>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-brand' : 'bg-[#cfd6dd]'}`}>
      <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
    </button>
  );
}
