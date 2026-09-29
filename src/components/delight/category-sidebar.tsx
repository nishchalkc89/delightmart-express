import { Link } from '@tanstack/react-router';
import { ChevronRight, LayoutGrid } from 'lucide-react';
import { categories } from '@/services/catalog';

export function CategorySidebar({ active }: { active?: string }) {
  return (
    <nav className="flex flex-col gap-1 bg-[#f9fbfc] py-2 lg:rounded-xl lg:border lg:border-line">
      {categories.map((c) => {
        const on = c.slug === active;
        return (
          <Link key={c.slug} to="/categories/$slug" params={{ slug: c.slug }} className={`mx-1 flex items-center gap-1.5 rounded-xl px-1.5 py-2.5 text-[12.5px] leading-tight text-ink lg:mx-1.5 lg:gap-3 lg:px-3 lg:text-[15px] ${on ? 'bg-[#e6f5ef] font-medium' : 'hover:bg-white'}`}>
            <img src={c.side} alt="" className="size-7 shrink-0 object-contain lg:size-9" />
            <span className="min-w-0 flex-1">{c.name}</span>
            {on && <ChevronRight className="size-3.5 shrink-0 lg:size-4" />}
          </Link>
        );
      })}
      <Link to="/categories" className="mx-1 flex items-center gap-1.5 rounded-xl px-1.5 py-2.5 text-[12.5px] leading-tight text-ink lg:mx-1.5 lg:gap-3 lg:px-3 lg:text-[15px]">
        <LayoutGrid className="size-7 shrink-0 p-0.5 text-ink lg:size-9" strokeWidth={1.6} /> All Categories
      </Link>
    </nav>
  );
}
