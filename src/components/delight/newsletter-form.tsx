import { CircleCheck, Loader2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/services/supabase';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Saves an email to the newsletter list. Returns 'ok', 'already' or an error message. */
export async function subscribeToNewsletter(email: string, source: 'home' | 'footer' | 'app' | 'website') {
  const clean = email.trim().toLowerCase();
  if (!EMAIL.test(clean)) return 'Enter a valid email address';
  const { error } = await supabase.from('newsletter_subscribers').insert({ email: clean, source });
  if (!error) return 'ok';
  if (error.code === '23505') return 'already';
  if (error.code === '42P01' || error.code === 'PGRST205') return 'Subscriptions are not switched on yet. Please try again later.';
  return 'Could not subscribe right now. Please try again.';
}

/**
 * Email box + Subscribe button used in every newsletter section.
 * `size` matches the section it sits in; the success state replaces the form.
 */
export function NewsletterForm({ size = 'md', source = 'home', className = '' }: { size?: 'sm' | 'md' | 'lg'; source?: 'home' | 'footer' | 'app' | 'website'; className?: string }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  // The thank-you message shows for a few seconds, then the form is back (empty).
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => { setDone(false); setEmail(''); }, 5000);
    return () => clearTimeout(t);
  }, [done]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const result = await subscribeToNewsletter(email, source);
    setBusy(false);
    if (result === 'ok' || result === 'already') {
      setDone(true);
      toast.success(result === 'ok' ? 'Subscribed! Watch your inbox for offers.' : 'You are already subscribed — thank you!');
    } else toast.error(result);
  }

  const h = size === 'sm' ? 'h-11 text-[14px]' : size === 'lg' ? 'h-[48px] text-[15px]' : 'h-[44px] text-[14px]';
  if (done) {
    return (
      <p className={`flex items-center gap-2 rounded-lg bg-white px-4 font-semibold text-brand ${h} ${className}`}>
        <CircleCheck className="size-5 shrink-0" /> Thanks for subscribing!
      </p>
    );
  }
  return (
    <form onSubmit={(e) => void submit(e)} noValidate className={`flex overflow-hidden rounded-lg border border-line bg-white ${h} ${className}`}>
      <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy}
        className="min-w-0 flex-1 px-3 outline-none placeholder:text-slate lg:px-4" placeholder="Enter your email address" aria-label="Email address" />
      <button disabled={busy} className={`flex items-center gap-2 bg-red font-semibold text-white hover:bg-red/90 disabled:opacity-70 ${size === 'sm' ? 'px-4' : size === 'lg' ? 'px-8 text-[17px]' : 'px-7 text-[15px]'}`}>
        {busy && <Loader2 className="size-4 animate-spin" />} Subscribe
      </button>
    </form>
  );
}
