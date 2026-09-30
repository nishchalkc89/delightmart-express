import { Link } from '@tanstack/react-router';
import { AlarmClock, Bell, ChevronLeft, ChevronRight, Leaf, Lock, Mail, MapPin, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { asset } from '@/lib/assets';
import { NewsletterForm } from './newsletter-form';

/** Live "Deal Ends In" countdown, starting from 08:24:15 like the reference screens. */
export function useCountdown(start = 8 * 3600 + 24 * 60 + 15) {
  const [left, setLeft] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : start)), 1000);
    return () => clearInterval(t);
  }, [start]);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(left / 3600))} : ${pad(Math.floor((left % 3600) / 60))} : ${pad(left % 60)}`;
}

export function DealTimer({ compact = false }: { compact?: boolean }) {
  const time = useCountdown();
  if (compact) {
    return (
      <div className="flex shrink-0 items-center gap-1 rounded-md bg-[#fff1f3] px-1.5 py-1">
        <span className="grid size-5 place-items-center rounded-full bg-red text-white"><AlarmClock className="size-3" /></span>
        <span className="leading-none">
          <span className="block text-[9px] text-ink">Deal Ends In</span>
          <span className="block whitespace-nowrap text-[11.5px] font-bold tabular-nums text-red">{time}</span>
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-lg bg-[#fff1f3] px-5 py-2.5">
      <span className="grid size-9 place-items-center rounded-full bg-red text-white"><AlarmClock className="size-5" /></span>
      <span className="leading-tight">
        <span className="block text-[14px] text-ink">Deal Ends In</span>
        <span className="block text-[17px] font-bold tabular-nums text-red">{time}</span>
      </span>
    </div>
  );
}

export function BannerLink({ src, alt, to = '/products', className = '' }: { src: string; alt: string; to?: string; className?: string }) {
  return (
    <Link to={to} className={`block overflow-hidden rounded-xl transition-transform hover:-translate-y-0.5 ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
    </Link>
  );
}

export function Newsletter() {
  return (
    <div className="flex items-center gap-6 rounded-2xl bg-[#f5f7fa] px-6 py-8">
      <span className="grid size-[72px] shrink-0 place-items-center rounded-full bg-[#fde3e6]"><Mail className="size-9 text-red" /></span>
      <div className="min-w-0">
        <h3 className="whitespace-nowrap text-[23px] font-extrabold text-navy">Stay Updated with Delight</h3>
        <p className="mt-1 text-[15px] leading-6 text-slate">Get the latest offers, new arrivals<br />and exclusive deals.</p>
      </div>
      <NewsletterForm className="ml-auto w-[340px] min-w-0 shrink" source="home" />
    </div>
  );
}

export function AppPromo() {
  const feats = [
    ['Faster', 'Shopping', <Zap key="z" className="size-6 fill-red text-red" />],
    ['Exclusive', 'Offers', <MapPin key="m" className="size-6 fill-brand text-white" />],
    ['Order', 'Updates', <Bell key="b" className="size-6 text-brand" />],
  ] as const;
  return (
    <div className="relative flex items-center overflow-hidden rounded-2xl bg-[#eef7f2] px-7 py-3">
      <div className="z-10 shrink-0">
        <h3 className="text-[22px] font-extrabold text-navy">Download Our App</h3>
        <p className="text-[14px] text-ink">Shop Anytime, Anywhere</p>
        <Link to="/app" className="block"><img src={asset('google-play')} alt="Get the Delight app on Android" className="mt-3 h-[36px] w-auto" /></Link>
        <Link to="/app" className="block"><img src={asset('app-store')} alt="Get the Delight app on iPhone" className="mt-1.5 h-[36px] w-auto" /></Link>
      </div>
      <img src={asset('app-phone')} alt="" className="-mb-3 ml-4 h-[146px] w-auto self-end" />
      <div className="ml-auto flex gap-5">
        {feats.map(([a, b, icon]) => (
          <div key={a} className="text-center text-[13px] leading-tight text-ink">
            <span className="mx-auto mb-2 grid size-[52px] place-items-center rounded-full bg-white shadow-sm">{icon}</span>
            {a}<br />{b}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CommunityNewsletter() {
  return (
    <div className="relative flex items-center gap-6 overflow-hidden rounded-2xl bg-[#fdeef0] px-6 py-8">
      <span className="grid size-[86px] shrink-0 place-items-center rounded-full bg-[#fbd9de]"><Mail className="size-11 text-red" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold tracking-[0.2em] text-slate">JOIN OUR COMMUNITY</p>
        <h3 className="mt-1 text-[28px] font-extrabold text-navy">Stay Updated with Delight</h3>
        <p className="mt-1 text-[16px] leading-7 text-slate">Get the latest offers, new arrivals and exclusive deals<br />directly to your inbox.</p>
      </div>
      <div className="w-[524px] shrink-0">
        <NewsletterForm size="lg" source="footer" />
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-slate"><Lock className="size-3.5" /> We respect your privacy. No spam, ever.</p>
      </div>
      <img src={asset('good-things')} alt="Good Things Everyday" className="h-[128px] w-auto shrink-0 mix-blend-multiply" />
    </div>
  );
}

export function CarouselArrow({ dir, onClick, className = '' }: { dir: 'left' | 'right'; onClick?: () => void; className?: string }) {
  const Icon = dir === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button onClick={onClick} aria-label={dir === 'left' ? 'Previous' : 'Next'} className={`grid size-10 place-items-center rounded-full border border-line bg-white text-ink shadow-sm hover:text-brand ${className}`}>
      <Icon className="size-5" />
    </button>
  );
}

export function JustArrivedTitle() {
  return (
    <span className="flex items-center gap-2 text-[16px] text-slate lg:text-[17px]"><Leaf className="size-5 fill-brand text-brand" /> Fresh Products, New Styles, More Choices</span>
  );
}

