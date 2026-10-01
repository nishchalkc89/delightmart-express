import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Lock } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { AuthLogo, AuthShell, GreenButton, IconField } from '@/components/delight/auth-ui';
import { supabase } from '@/services/supabase';

export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [{ title: 'Set New Password — Delight' }, { name: 'description', content: 'Set a new password for your Delight account.' }, { property: 'og:title', content: 'Set New Password — Delight' }, { property: 'og:description', content: 'Secure your account.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    if (hash.get('type') === 'recovery' || query.get('type') === 'recovery') setRecovery(true);
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') setRecovery(true); });
    // The reset link signs the customer in; Supabase may have handled the link (and cleared it from the
    // address bar) before this page loaded, so a signed-in session also allows setting the new password.
    void supabase.auth.getSession().then(({ data: s }) => { if (s.session) setRecovery(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error('Use at least 8 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success('Password updated'); void nav({ to: '/account' }); }
  }

  return (
    <AuthShell>
      <AuthLogo />
      <h1 className="mt-8 text-center text-[29px] font-extrabold tracking-tight text-navy">Create New Password</h1>
      {!recovery ? (
        <>
          <p className="mt-3 text-center text-[16px] leading-6 text-slate">Open this page from the password reset link we emailed you.</p>
          <p className="mt-8 text-center text-[16px] text-slate"><Link to="/forgot-password" className="font-semibold text-brand">Request a new link</Link></p>
        </>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <IconField icon={Lock} label="New Password" name="password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
          <IconField icon={Lock} label="Confirm Password" name="confirm" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          <div className="pt-2"><GreenButton disabled={busy}>{busy ? 'Updating…' : 'Update Password'}</GreenButton></div>
        </form>
      )}
    </AuthShell>
  );
}
