import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Logo } from '@/components/delight/logo';
import { supabase } from '@/services/supabase';

// Admin sign-in, separate from the customer login. Only accounts with a staff role get in.
export const Route = createFileRoute('/admin_/login')({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({ redirect: typeof s['redirect'] === 'string' && s['redirect'].startsWith('/admin') ? s['redirect'] : undefined }),
  head: () => ({ meta: [{ title: 'Admin Sign In — Delight Shopping Mart' }, { name: 'robots', content: 'noindex' }] }),
  component: Page,
});

function Page() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Enter the admin email and password.'); return; }
    setBusy(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError || !data.user) {
      setBusy(false);
      setError(/invalid/i.test(signInError?.message ?? '') ? 'Wrong email or password.' : signInError?.message ?? 'Could not sign in.');
      return;
    }
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id);
    if (!roles?.some((r) => r.role !== 'CUSTOMER')) {
      await supabase.auth.signOut();
      setBusy(false);
      setError('This account does not have admin access.');
      return;
    }
    toast.success('Welcome back');
    router.history.push(redirect ?? '/admin');
  }

  const field = 'flex h-12 items-center gap-3 rounded-lg border border-line bg-white px-3.5 focus-within:border-[#077a52]';
  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#01352a_0%,#013328_60%,#002e24_100%)] p-5">
      <form onSubmit={(e) => void submit(e)} className="w-full max-w-[400px] rounded-2xl bg-white p-7 shadow-2xl">
        <Logo className="mx-auto h-16 w-auto" />
        <h1 className="mt-5 text-center text-[24px] font-extrabold text-navy">Admin Sign In</h1>
        <p className="mt-1 text-center text-[14px] text-slate">Store management for Delight Shopping Mart</p>

        <label className="mt-6 block text-[13.5px] font-semibold text-navy">Email
          <span className={`mt-1 ${field}`}><Mail className="size-5 text-slate" /><input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="min-w-0 flex-1 text-[15px] outline-none" placeholder="admin email" /></span>
        </label>
        <label className="mt-3 block text-[13.5px] font-semibold text-navy">Password
          <span className={`mt-1 ${field}`}>
            <Lock className="size-5 text-slate" />
            <input type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="min-w-0 flex-1 text-[15px] outline-none" placeholder="password" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="text-slate">{show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button>
          </span>
        </label>
        {error && <p role="alert" className="mt-3 rounded-lg bg-[#fdecec] px-3 py-2 text-[13.5px] text-red">{error}</p>}
        <button disabled={busy} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#077a52] text-[16px] font-semibold text-white disabled:opacity-60">
          {busy && <Loader2 className="size-4 animate-spin" />} Sign in to Admin
        </button>
        <div className="mt-4 flex justify-between text-[13.5px]">
          <Link to="/forgot-password" className="font-medium text-[#077a52]">Forgot password?</Link>
          <Link to="/" className="text-slate">← Back to store</Link>
        </div>
      </form>
    </div>
  );
}
