import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Check, Lock, Mail, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { AuthLogo, AuthShell, Divider, GreenButton, IconField, PhoneField, SocialButtons } from '@/components/delight/auth-ui';
import { supabase } from '@/services/supabase';

export const Route = createFileRoute('/signup')({
  head: () => ({ meta: [{ title: 'Create Account — Delight Shopping Mart' }, { name: 'description', content: 'Create your Delight Shopping Mart account.' }, { property: 'og:title', content: 'Create a Delight Account' }, { property: 'og:description', content: 'Shop faster and track your local orders.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (phone.length !== 10) { toast.error('Enter your 10-digit mobile number'); return; }
    if (password.length < 8) { toast.error('Use at least 8 characters for your password'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (!agree) { toast.error('Please accept the Terms & Conditions'); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name.trim(), phone } } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Account created. Check your email to verify your account.');
    void nav({ to: '/login' });
  }

  async function google() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/account` } });
    if (error) { toast.error(error.message.includes('provider is not enabled') ? 'Google sign-in is not enabled yet. Please use email.' : error.message); setBusy(false); }
  }

  return (
    <AuthShell>
      <AuthLogo className="mt-4 h-[56px]" />
      <h1 className="mt-5 text-center text-[29px] font-extrabold tracking-tight text-navy">Create Account</h1>
      <p className="mt-1 text-center text-[17px] text-slate">Join Delight Shopping Mart</p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <IconField icon={UserRound} label="Full Name" name="name" value={name} onChange={setName} autoComplete="name" />
        <PhoneField value={phone} onChange={setPhone} />
        <IconField icon={Mail} label="Email Address" name="email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <IconField icon={Lock} label="Create Password" name="password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <IconField icon={Lock} label="Confirm Password" name="confirm" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        <label className="flex cursor-pointer items-start gap-3 pt-2 text-[15px] leading-6 text-slate">
          <button type="button" role="checkbox" aria-checked={agree} onClick={() => setAgree(!agree)} className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md ${agree ? 'bg-brand text-white' : 'border-2 border-line'}`}>{agree && <Check className="size-4" strokeWidth={3} />}</button>
          <span>I agree to the <Link to="/terms" target="_blank" className="text-brand underline">Terms &amp; Conditions</Link> and <Link to="/privacy" target="_blank" className="text-brand underline">Privacy Policy</Link></span>
        </label>
        <div className="pt-3"><GreenButton disabled={busy}>{busy ? 'Creating account…' : 'Sign Up'}</GreenButton></div>
      </form>

      <Divider text="or sign up with" />
      <SocialButtons disabled={busy} onGoogle={google} onApple={() => toast.info('Apple sign-in will be available soon')} />
      <p className="mt-6 text-center text-[16px] text-slate">Already have an account? <Link to="/login" className="font-semibold text-brand">Login</Link></p>
    </AuthShell>
  );
}
