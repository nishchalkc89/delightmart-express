import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Leaf, Percent, Zap } from 'lucide-react';
import { useState } from 'react';
import { AuthLogo, AuthShell, GreenButton } from '@/components/delight/auth-ui';
import { asset } from '@/lib/assets';
import { markOnboarded } from '@/lib/onboarding';

export const Route = createFileRoute('/welcome')({
  head: () => ({ meta: [{ title: 'Welcome — Delight Shopping Mart' }, { name: 'description', content: 'Groceries delivered in 15-20 minutes across Tulsipur and Ghorahi.' }, { property: 'og:title', content: 'Welcome to Delight Shopping Mart' }, { property: 'og:description', content: 'Fresh groceries, daily essentials and more.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  const [dot, setDot] = useState(0);

  function finish() {
    markOnboarded();
    void nav({ to: '/' });
  }

  return (
    <AuthShell back={false} app>
      <div className="text-right"><button onClick={finish} className="text-[16px] text-slate">Skip</button></div>
      <AuthLogo className="mt-8 h-[62px]" />
      <h1 className="mt-10 text-[33px] font-extrabold leading-[1.15] tracking-tight text-navy">Groceries<br />Delivered in<br /><span className="text-brand">15-20 Minutes</span></h1>
      <p className="mt-3 text-[17px] leading-6 text-slate">Fresh groceries, daily essentials<br />and more, at your doorstep.</p>
      <div className="relative mt-7 min-h-[350px]">
        <img src={asset('onboard-bag')} alt="Delight grocery bag" className="absolute -right-6 bottom-0 h-[350px] w-auto lg:-right-9" />
        <ul className="relative z-10 space-y-6">
          {([[Zap, 'Super Fast', 'Delivery', '15-20 minutes'], [Leaf, 'Fresh & Quality', 'Products', 'Daily essentials'], [Percent, 'Best Offers', '', 'Save more everyday']] as const).map(([Icon, a, b, c]) => (
            <li key={a} className="flex items-start gap-4">
              <span className="grid size-[52px] shrink-0 place-items-center rounded-full bg-[#e3f5ec]"><Icon className="size-6 fill-brand text-brand" strokeWidth={2.4} /></span>
              <span className="w-[120px] pt-0.5 text-[16px] leading-5"><b className="block font-semibold text-navy">{a}{b && <><br />{b}</>}</b><span className="text-[15px] text-slate">{c}</span></span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 flex justify-center gap-3">
        {[0, 1, 2].map((i) => <button key={i} aria-label={`Slide ${i + 1}`} onClick={() => setDot(i)} className={`size-2.5 rounded-full ${dot === i ? 'bg-brand' : 'bg-[#d5dbe0]'}`} />)}
      </div>
      <div className="mt-6"><GreenButton type="button" onClick={finish}>Get Started</GreenButton></div>
      <p className="mt-5 text-center text-[16px] text-slate">Already have an account? <Link to="/login" onClick={markOnboarded} className="font-semibold text-brand">Login</Link></p>
    </AuthShell>
  );
}
