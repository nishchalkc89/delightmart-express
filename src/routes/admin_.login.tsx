import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { Crown, Eye, EyeOff, Loader2, Lock, Mail, Store } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Logo } from '@/components/delight/logo';
import { supabase } from '@/services/supabase';
import { fetchBranches, FALLBACK_BRANCHES, type Branch } from '@/lib/branch';
import { fetchStaffAccess, saveScope } from '@/services/admin-scope';

// Admin sign-in, separate from the customer login. Pick the store (or Owner), then sign in.
// The choice is checked against the account: the database decides what each account can see.
export const Route = createFileRoute('/admin_/login')({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({ redirect: typeof s['redirect'] === 'string' && s['redirect'].startsWith('/admin') ? s['redirect'] : undefined }),
  head: () => ({ meta: [{ title: 'Admin Sign In — Delight Shopping Mart' }, { name: 'robots', content: 'noindex' }] }),
  component: Page,
});

type Choice = 'owner' | string;

function Page() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const [branches, setBranches] = useState<Branch[]>(FALLBACK_BRANCHES);
  const [choice, setChoice] = useState<Choice>('owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { void fetchBranches().then(setBranches); }, []);

  const choices: Array<{ id: Choice; title: string; sub: string }> = [
    ...branches.map((b) => ({ id: b.id, title: `${b.city} Admin`, sub: `${b.city} store only` })),
    { id: 'owner', title: 'Owner', sub: 'Both stores & totals' },
  ];
  const chosen = choices.find((c) => c.id === choice)!;

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
    const access = await fetchStaffAccess(data.user.id);
    const refuse = async (msg: string) => { await supabase.auth.signOut(); setBusy(false); setError(msg); };
    if (!access.role) { await refuse('This account does not have admin access.'); return; }
    if (choice === 'owner' && !access.isSuper) {
      const mine = access.branchIds.map((id) => branches.find((b) => b.id === id)?.city ?? id).join(' & ');
      await refuse(`This is a store account${mine ? ` (${mine})` : ''}, not the owner account. Choose ${mine ? `“${mine} Admin”` : 'your store'} instead.`);
      return;
    }
    if (choice !== 'owner' && !access.isSuper && !access.branchIds.includes(choice)) {
      await refuse(`This account cannot open the ${branches.find((b) => b.id === choice)?.city ?? choice} store.`);
      return;
    }
    saveScope(choice === 'owner' ? 'all' : choice);
    toast.success(choice === 'owner' ? 'Welcome back — all stores' : `Welcome back — ${chosen.title.replace(' Admin', '')} store`);
    router.history.push(redirect ?? '/admin');
  }

  const field = 'flex h-12 items-center gap-3 rounded-lg border border-line bg-white px-3.5 focus-within:border-[#077a52]';
  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#01352a_0%,#013328_60%,#002e24_100%)] p-5">
      <form onSubmit={(e) => void submit(e)} className="w-full max-w-[460px] rounded-2xl bg-white p-7 shadow-2xl">
        <Logo className="mx-auto h-16 w-auto" />
        <h1 className="mt-5 text-center text-[24px] font-extrabold text-navy">Admin Sign In</h1>
        <p className="mt-1 text-center text-[14px] text-slate">Store management for Delight Shopping Mart</p>

        <fieldset className="mt-6">
          <legend className="text-[13.5px] font-semibold text-navy">Sign in as</legend>
          <div className={`mt-1.5 grid gap-2 ${choices.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {choices.map((c) => {
              const on = c.id === choice;
              const Icon = c.id === 'owner' ? Crown : Store;
              return (
                <button key={c.id} type="button" onClick={() => setChoice(c.id)} aria-pressed={on}
                  className={`rounded-xl border px-2 py-3 text-center transition-colors ${on ? 'border-[#077a52] bg-[#f0fbf5] ring-1 ring-[#077a52]' : 'border-line hover:border-[#077a52]/50'}`}>
                  <Icon className={`mx-auto size-6 ${on ? 'text-[#077a52]' : 'text-slate'}`} />
                  <b className="mt-1 block text-[13.5px] font-bold text-navy">{c.title}</b>
                  <span className="block text-[11.5px] leading-4 text-slate">{c.sub}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="mt-5 block text-[13.5px] font-semibold text-navy">Email
          <span className={`mt-1 ${field}`}><Mail className="size-5 text-slate" /><input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="min-w-0 flex-1 text-[15px] outline-none" placeholder={`${chosen.id === 'owner' ? 'owner' : chosen.title.toLowerCase().replace(' admin', '')} admin email`} /></span>
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
          {busy && <Loader2 className="size-4 animate-spin" />} Sign in as {chosen.title}
        </button>
        <div className="mt-4 flex justify-between text-[13.5px]">
          <Link to="/forgot-password" className="font-medium text-[#077a52]">Forgot password?</Link>
          <Link to="/" className="text-slate">← Back to store</Link>
        </div>
      </form>
    </div>
  );
}
