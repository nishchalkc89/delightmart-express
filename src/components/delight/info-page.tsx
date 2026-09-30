import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { StorePage } from './store-shell';

/** Simple text page (About, Terms, Privacy…) with the store header and footer. */
export function InfoPage({ title, intro, updated, children }: { title: string; intro: string; updated?: string; children: ReactNode }) {
  return (
    <StorePage mobile={{ variant: 'back', actions: ['cart'], search: false }}>
      <article className="mx-auto max-w-[860px] px-4 py-5 lg:py-10">
        <p className="mb-3 hidden text-[14px] text-slate lg:block"><Link to="/">Home</Link> / <span className="text-ink">{title}</span></p>
        <h1 className="text-[28px] font-extrabold tracking-tight text-navy lg:text-[38px]">{title}</h1>
        <p className="mt-1 text-[15px] leading-7 text-slate lg:text-[17px]">{intro}</p>
        {updated && <p className="mt-1 text-[12.5px] text-slate">Last updated: {updated}</p>}
        <div className="mt-5 space-y-5 text-[15px] leading-7 text-ink [&_h2]:mb-1.5 [&_h2]:text-[19px] [&_h2]:font-bold [&_h2]:text-navy [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">{children}</div>
      </article>
    </StorePage>
  );
}
