import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { KeyRound, Lock, LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/delight/auth-context';
import { AccountCard, AccountTitle } from '@/components/delight/account-ui';
import { supabase } from '@/services/supabase';

export const Route = createFileRoute('/account/security')({
  head: () => ({ meta: [{ title: 'Privacy & Security — Delight' }, { name: 'description', content: 'Password, sign-in and privacy settings for your Delight account.' }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const google = user?.app_metadata['provider'] === 'google';

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error('Use at least 8 characters'); return; }
    if (password !== confirm) { toast.error('The two passwords do not match'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setPassword(''); setConfirm('');
    toast.success('Password changed');
  }

  async function signOutEverywhere() {
    if (!window.confirm('Sign out of Delight on all your phones and computers?')) return;
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) { toast.error(error.message); return; }
    toast.success('Signed out everywhere');
    void nav({ to: '/login', replace: true });
  }

  const deleteMail = `mailto:info@delightshoppingmart.com?subject=${encodeURIComponent('Delete my Delight account')}&body=${encodeURIComponent(`Please delete my Delight Shopping Mart account and personal data.\n\nAccount email: ${user?.email ?? ''}`)}`;
  const field = 'mt-1 h-11 w-full rounded-lg border border-line px-3 text-[15px] outline-none focus:border-brand';

  return (
    <div>
      <AccountTitle title="Privacy & Security" sub="Keep your account safe and control your data." />

      <AccountCard title="Change password">
        {google && <p className="mb-3 rounded-lg bg-[#f1f7fd] px-3 py-2 text-[13px] text-navy">You sign in with Google. Setting a password lets you also sign in with your email.</p>}
        <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-2">
          <label className="text-[13.5px] font-semibold text-navy">New password<input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} /></label>
          <label className="text-[13.5px] font-semibold text-navy">Confirm new password<input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} /></label>
          <button disabled={saving} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-[15px] font-semibold text-white disabled:opacity-60 sm:col-span-2 sm:w-fit"><KeyRound className="size-4" /> {saving ? 'Saving…' : 'Update password'}</button>
        </form>
      </AccountCard>

      <AccountCard title="Sign-in & devices">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] text-slate">Signed in as <b className="text-navy">{user?.email}</b>{user?.last_sign_in_at && <> · last sign-in {new Date(user.last_sign_in_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</>}</p>
          <button onClick={() => void signOutEverywhere()} className="flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-[14px] font-semibold text-navy"><LogOut className="size-4" /> Sign out of all devices</button>
        </div>
      </AccountCard>

      <AccountCard title="Your privacy">
        <ul className="space-y-2 text-[14px] leading-6 text-slate">
          <li className="flex gap-2"><ShieldCheck className="mt-1 size-4 shrink-0 text-brand" /> We use your name, phone and address only to deliver your orders and contact you about them.</li>
          <li className="flex gap-2"><Lock className="mt-1 size-4 shrink-0 text-brand" /> Your password is encrypted; not even the store can see it. We never store card or wallet PINs.</li>
          <li className="flex gap-2"><ShieldCheck className="mt-1 size-4 shrink-0 text-brand" /> We do not sell or share your details with other companies.</li>
        </ul>
      </AccountCard>

      <AccountCard title="Delete account" className="border-[#fbe1dd]">
        <p className="text-[14px] text-slate">Want us to delete your account and personal data? Send us a request and we’ll confirm within 3 working days. Past orders are kept only as long as the law requires.</p>
        <a href={deleteMail} className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-red px-4 text-[14px] font-semibold text-red"><Trash2 className="size-4" /> Request account deletion</a>
      </AccountCard>
    </div>
  );
}
