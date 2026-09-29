import { createFileRoute, Link } from '@tanstack/react-router';
import { Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { AuthLogo, AuthShell, GreenButton, IconField } from '@/components/delight/auth-ui';
import { supabase } from '@/services/supabase';

export const Route = createFileRoute('/forgot-password')({
  head: () => ({ meta: [{ title: 'Reset Password — Delight' }, { name: 'description', content: 'Request a password reset.' }, { property: 'og:title', content: 'Reset Password — Delight' }, { property: 'og:description', content: 'Recover your account securely.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) toast.error(error.message); else setSent(true);
  }

  return (
    <AuthShell>
      <AuthLogo />
      <h1 className="mt-8 text-center text-[29px] font-extrabold tracking-tight text-navy">Forgot Password?</h1>
      <p className="mt-2 text-center text-[16px] leading-6 text-slate">Enter your email and we'll send you a secure link to reset your password.</p>
      {sent ? (
        <div className="mt-8 rounded-xl bg-[#effaf4] p-5 text-center text-[15px] text-brand">If an account exists for <b>{email}</b>, a reset link is on its way. Check your inbox.</div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5">
          <IconField icon={Mail} name="email" type="email" value={email} onChange={setEmail} placeholder="Email address" autoComplete="email" />
          <GreenButton disabled={busy}>{busy ? 'Sending…' : 'Send Reset Link'}</GreenButton>
        </form>
      )}
      <p className="mt-8 text-center text-[16px] text-slate">Remembered it? <Link to="/login" className="font-semibold text-brand">Back to Login</Link></p>
    </AuthShell>
  );
}
