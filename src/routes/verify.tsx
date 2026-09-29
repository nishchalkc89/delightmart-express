import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AuthLogo, AuthShell, GreenButton } from '@/components/delight/auth-ui';
import { supabase } from '@/services/supabase';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/verify')({
  validateSearch: (s: Record<string, unknown>) => ({ phone: typeof s['phone'] === 'string' ? s['phone'] : '9801234567' }),
  head: () => ({ meta: [{ title: 'Verify Your Number — Delight Shopping Mart' }, { name: 'description', content: 'Enter the 6-digit code sent to your phone.' }, { property: 'og:title', content: 'Verify Your Number — Delight' }, { property: 'og:description', content: 'Secure your Delight account.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const { phone } = Route.useSearch();
  const nav = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [left, setLeft] = useState(25);
  const [busy, setBusy] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  function set(i: number, v: string) {
    const digit = v.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }

  async function verify() {
    const token = code.join('');
    if (token.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone: `+977${phone}`, token, type: 'sms' });
    setBusy(false);
    if (error) toast.error(error.message);
    else void nav({ to: '/account' });
  }

  async function resend() {
    setLeft(25);
    const { error } = await supabase.auth.signInWithOtp({ phone: `+977${phone}` });
    if (error) toast.error(error.message);
    else toast.success('A new code has been sent');
  }

  return (
    <AuthShell>
      <AuthLogo className="mt-6 h-[60px]" />
      <h1 className="mt-10 text-center text-[29px] font-extrabold tracking-tight text-navy">Verify Your Number</h1>
      <p className="mt-2 text-center text-[17px] leading-7 text-slate">We have sent a 6-digit code to<br /><b className="font-semibold text-navy">+977 {phone}</b></p>
      <img src={asset('verify-illustration')} alt="" className="mx-auto mt-8 h-[190px] w-auto" />
      <div className="mt-8 grid grid-cols-6 gap-2.5">
        {code.map((d, i) => (
          <input key={i} ref={(el) => { refs.current[i] = el; }} value={d} onChange={(e) => set(i, e.target.value)} onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus(); }} inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`} className="h-[62px] rounded-xl border border-line text-center text-[24px] font-semibold text-navy outline-none focus:border-brand" />
        ))}
      </div>
      <p className="mt-7 text-center text-[16px] text-slate">
        Didn't receive the code? {left > 0 ? <>Resend in <b className="font-semibold text-brand">00:{String(left).padStart(2, '0')}</b></> : <button onClick={resend} className="font-semibold text-brand">Resend code</button>}
      </p>
      <div className="mt-8"><GreenButton type="button" onClick={verify} disabled={busy}>{busy ? 'Verifying…' : 'Verify'}</GreenButton></div>
    </AuthShell>
  );
}
