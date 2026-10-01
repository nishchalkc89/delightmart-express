import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router';
import { Lock, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { AuthLogo, AuthShell, Divider, GreenButton, IconField, PhoneField, SocialButtons } from '@/components/delight/auth-ui';
import { supabase } from '@/services/supabase';

export const Route = createFileRoute('/login')({
  // Where to go after signing in, e.g. /login?redirect=/cart (only paths on this site).
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({ redirect: typeof s['redirect'] === 'string' && /^\/(?!\/)/.test(s['redirect']) ? s['redirect'] : undefined }),
  head: () => ({ meta: [{ title: 'Login — Delight Shopping Mart' }, { name: 'description', content: 'Sign in to your Delight Shopping Mart account.' }, { property: 'og:title', content: 'Login — Delight' }, { property: 'og:description', content: 'Access your orders and account.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  const { redirect } = Route.useSearch();
  const router = useRouter();
  const [tab, setTab] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (tab === 'phone' && phone.length !== 10) { toast.error('Enter your 10-digit mobile number'); return; }
    setLoading(true);
    const { error } = tab === 'email'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signInWithPassword({ phone: `+977${phone}`, password });
    setLoading(false);
    if (error) toast.error(tab === 'phone' && /phone|provider/i.test(error.message) ? 'Mobile login is not enabled yet. Please use the Email tab.' : error.message);
    else if (redirect) router.history.push(redirect);
    else void nav({ to: '/account' });
  }

  async function google() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}${redirect ?? '/account'}` } });
    if (error) { toast.error(error.message.includes('provider is not enabled') ? 'Google sign-in is not enabled yet. Please use email.' : error.message); setLoading(false); }
  }

  return (
    <AuthShell>
      <AuthLogo />
      <h1 className="mt-8 text-center text-[30px] font-extrabold tracking-tight text-navy">Welcome Back</h1>
      <p className="mt-1 text-center text-[18px] text-slate">Login to your account</p>

      <div className="mt-8 grid grid-cols-2 border-b border-line" role="tablist">
        {(['phone', 'email'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`relative pb-3 text-[16px] ${tab === t ? 'font-semibold text-brand' : 'text-slate'}`}>
            {t === 'phone' ? 'Mobile Number' : 'Email'}
            {tab === t && <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-brand" />}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {tab === 'phone'
          ? <PhoneField value={phone} onChange={setPhone} />
          : <IconField icon={Mail} name="email" type="email" value={email} onChange={setEmail} placeholder="Email address" autoComplete="email" />}
        <IconField icon={Lock} name="password" type="password" value={password} onChange={setPassword} placeholder="Password" autoComplete="current-password" />
        <div className="text-right"><Link to="/forgot-password" className="text-[16px] font-medium text-brand">Forgot Password?</Link></div>
        <div className="pt-2"><GreenButton disabled={loading}>{loading ? 'Logging in…' : 'Login'}</GreenButton></div>
      </form>

      <Divider text="or continue with" />
      <SocialButtons disabled={loading} onGoogle={google} />
      <p className="mt-10 text-center text-[16px] text-slate">Don't have an account? <Link to="/signup" className="font-semibold text-brand">Sign Up</Link></p>
    </AuthShell>
  );
}
