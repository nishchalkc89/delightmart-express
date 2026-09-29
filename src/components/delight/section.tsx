import { ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

/** Desktop section heading: red eyebrow line, large title with optional red accent, "View All" link. */
export function SectionHead({ eyebrow, title, accent, link = 'View All', to = '/products', extra }: { eyebrow?: string; title: string; accent?: string; link?: string; to?: string; extra?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <div className="flex flex-wrap items-center gap-5">
          <h2 className="text-[26px] font-extrabold tracking-tight text-navy lg:text-[38px]">
            {title} {accent && <span className="text-red">{accent}</span>}
          </h2>
          {extra}
        </div>
      </div>
      <Link to={to} className="flex shrink-0 items-center gap-1.5 text-[15px] font-semibold text-brand hover:underline lg:text-[17px]">
        {link} <ArrowRight className="size-5" />
      </Link>
    </div>
  );
}

/** Mobile section heading. */
export function MobileHead({ title, accent, to = '/products', extra }: { title: string; accent?: string; to?: string; extra?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="whitespace-nowrap text-[18px] font-extrabold tracking-tight text-navy min-[440px]:text-[20px]">{title} {accent && <span className="text-red">{accent}</span>}</h2>
        {extra}
      </div>
      <Link to={to} className="flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-brand min-[400px]:text-[14px]">View All <ArrowRight className="size-4" /></Link>
    </div>
  );
}

export function Section({ title, subtitle, children, to = '/products' }: { title: string; subtitle?: string; children: ReactNode; to?: '/products' | '/categories' }) {
  return (
    <section className="site-width py-8 lg:py-12">
      <div className="mb-5 flex items-end justify-between">
        <div><h2 className="text-xl font-bold lg:text-2xl">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div>
        <Link to={to} className="flex items-center gap-1 text-sm font-semibold text-primary">View All <ArrowRight className="size-4" /></Link>
      </div>
      {children}
    </section>
  );
}
