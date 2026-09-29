import { createFileRoute } from '@tanstack/react-router';
import { Mail, Phone, UserRound } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/delight/auth-context';
import { GreenButton, IconField } from '@/components/delight/auth-ui';
import { supabase } from '@/services/supabase';

export const Route = createFileRoute('/account/profile')({
  head: () => ({ meta: [{ title: 'Personal Information — Delight' }, { name: 'description', content: 'Update your Delight Shopping Mart profile.' }, { property: 'og:title', content: 'Personal Information — Delight' }, { property: 'og:description', content: 'Manage your account details.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const { user, displayName } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(displayName);
    setPhone(String(user.user_metadata['phone'] ?? ''));
    void supabase.from('profiles').select('full_name,phone').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) { setName(data.full_name); setPhone(data.phone ?? ''); }
    });
  }, [user, displayName]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) { toast.error('Enter your full name'); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({ id: user.id, full_name: name.trim(), phone: phone.trim(), email: user.email ?? null }, { onConflict: 'id' });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await supabase.auth.updateUser({ data: { full_name: name.trim(), phone: phone.trim() } });
    toast.success('Profile updated');
  }

  return (
    <div>
      <h1 className="text-[28px] font-extrabold tracking-tight text-navy lg:text-[34px]">Personal Information</h1>
      <p className="text-[14.5px] text-slate">Keep your name and phone up to date for smooth deliveries.</p>
      <form onSubmit={save} className="mt-5 space-y-3 rounded-2xl border border-line bg-white p-4 lg:p-6">
        <IconField icon={UserRound} label="Full Name" name="name" value={name} onChange={setName} autoComplete="name" />
        <IconField icon={Phone} label="Mobile Number" name="phone" value={phone} onChange={setPhone} autoComplete="tel" required={false} />
        <label className="flex h-[60px] items-center gap-3 rounded-xl border border-line bg-page px-4">
          <Mail className="size-5 shrink-0 text-slate" strokeWidth={1.7} />
          <span className="min-w-0 flex-1"><span className="block text-[12px] text-slate">Email Address</span><span className="block truncate text-[16px] text-slate">{user?.email}</span></span>
        </label>
        <div className="pt-2"><GreenButton disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</GreenButton></div>
      </form>
    </div>
  );
}
