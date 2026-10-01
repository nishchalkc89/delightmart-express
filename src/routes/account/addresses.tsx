import { createFileRoute } from '@tanstack/react-router';
import { House, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/delight/auth-context';
import { useBranch } from '@/components/delight/branch-context';
import { supabase } from '@/services/supabase';

type Address = { id: string; label: string; recipient_name: string; phone: string; address_line: string; city: string; province: string; is_default: boolean };
const blank = { label: 'Home', recipient_name: '', phone: '', address_line: '', city: 'Tulsipur', province: 'Lumbini Province', is_default: false };
const fields = [['label', 'Label (Home, Work…)'], ['recipient_name', 'Recipient Name'], ['phone', 'Phone'], ['address_line', 'Street / Ward / Landmark'], ['city', 'City'], ['province', 'Province']] as const;

export const Route = createFileRoute('/account/addresses')({
  head: () => ({ meta: [{ title: 'My Addresses — Delight' }, { name: 'description', content: 'Manage delivery addresses for Delight orders.' }, { property: 'og:title', content: 'My Addresses — Delight' }, { property: 'og:description', content: 'Manage delivery locations.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const { user, displayName } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const { branch } = useBranch();
  // New addresses start in the chosen store's town (so no other-town fee is added by mistake).
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!user) return;
    const { data, error } = await supabase.from('addresses').select('id,label,recipient_name,phone,address_line,city,province,is_default').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) toast.error(error.message); else setAddresses(data ?? []);
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [user]);

  function update(key: keyof typeof blank, value: string | boolean) { setForm((v) => ({ ...v, [key]: value })); }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const query = editing ? supabase.from('addresses').update(form).eq('id', editing).eq('user_id', user.id) : supabase.from('addresses').insert({ ...form, user_id: user.id });
    const { error } = await query;
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Address saved');
    setOpen(false);
    setEditing(null);
    void load();
  }

  async function remove(id: string) {
    if (!user || !window.confirm('Remove this address?')) return;
    const { error } = await supabase.from('addresses').delete().eq('id', id).eq('user_id', user.id);
    if (error) toast.error(error.message); else void load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-navy lg:text-[34px]">Manage Addresses</h1>
          <p className="text-[14.5px] text-slate">Save addresses for faster checkout.</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ ...blank, city: branch.city, recipient_name: displayName }); setOpen(true); }} className="flex items-center gap-1.5 text-[15px] font-medium text-brand"><Plus className="size-5" /> Add New Address</button>
      </div>

      {open && (
        <form onSubmit={save} className="mt-4 rounded-2xl border border-line bg-white p-4 lg:p-5">
          <h2 className="text-[18px] font-bold text-navy">{editing ? 'Edit Address' : 'Add Address'}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {fields.map(([key, label]) => (
              <label key={key} className="text-[14px] font-medium text-navy">{label}
                <input required value={form[key]} onChange={(e) => update(key, e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-line px-3 text-[15px] outline-none focus:border-brand" />
              </label>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-[14px] text-navy"><input type="checkbox" checked={form.is_default} onChange={(e) => update('is_default', e.target.checked)} className="size-4 accent-[#08704c]" /> Set as default address</label>
          <div className="mt-4 flex gap-3">
            <button disabled={saving} className="h-11 rounded-lg bg-brand px-6 font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save Address'}</button>
            <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-lg border border-line px-6 font-medium text-navy">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-2.5">
        {loading && [0, 1].map((i) => <div key={i} className="h-[92px] animate-pulse rounded-xl bg-[#f1f4f7]" />)}
        {addresses.map((a) => (
          <div key={a.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 ${a.is_default ? 'border-brand/40 bg-[#effaf4]' : 'border-line bg-white'}`}>
            <House className="size-7 shrink-0 text-navy" strokeWidth={1.8} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2"><b className="text-[15.5px] font-semibold text-navy">{a.label}</b>{a.is_default && <span className="rounded-full bg-[#d8f1e4] px-2 py-0.5 text-[11px] font-semibold text-brand">Default</span>}</p>
              <p className="text-[13.5px] leading-5 text-slate">{a.recipient_name} · {a.phone}<br />{a.address_line}, {a.city}, {a.province}</p>
            </div>
            <button aria-label="Edit address" onClick={() => { setEditing(a.id); setForm({ label: a.label, recipient_name: a.recipient_name, phone: a.phone, address_line: a.address_line, city: a.city, province: a.province, is_default: a.is_default }); setOpen(true); }} className="flex items-center gap-1 rounded-lg bg-[#dcf2e6] px-3 py-1.5 text-[14px] font-medium text-brand"><Pencil className="size-4" /> Edit</button>
            <button aria-label="Delete address" onClick={() => remove(a.id)} className="p-1.5 text-slate hover:text-red"><Trash2 className="size-5" /></button>
          </div>
        ))}
        {!loading && !addresses.length && !open && (
          <div className="rounded-xl border border-line bg-white p-8 text-center">
            <MapPin className="mx-auto size-10 text-slate" />
            <p className="mt-2 text-[15px] text-slate">No addresses saved yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
