import { Link } from '@tanstack/react-router';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './auth-context';
import { supabase } from '@/services/supabase';

type Review = { id: string; rating: number; review: string; created_at: string; status: string; user_id: string };
const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

/** Published reviews for a product plus a form for signed-in customers. New reviews wait for staff approval. */
export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const live = isUuid(productId);

  async function load() {
    if (!live) return;
    const { data } = await supabase.from('reviews').select('id,rating,review,created_at,status,user_id').eq('product_id', productId).order('created_at', { ascending: false }).limit(20);
    setReviews(data ?? []);
    const ids = [...new Set((data ?? []).map((r) => r.user_id))];
    if (ids.length) {
      const { data: people } = await supabase.from('profiles').select('id,full_name').in('id', ids);
      setNames(Object.fromEntries((people ?? []).map((p) => [p.id, p.full_name])));
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [productId, user]);

  async function submit() {
    if (!user) return;
    if (text.trim().length < 5) { toast.error('Write a few words about the product'); return; }
    setBusy(true);
    const { error } = await supabase.from('reviews').insert({ user_id: user.id, product_id: productId, rating, review: text.trim() });
    setBusy(false);
    if (error) { toast.error(error.message.includes('duplicate') ? 'You have already reviewed this product' : error.message); return; }
    setText('');
    toast.success('Thanks! Your review will appear after it is approved.');
    void load();
  }

  const visible = reviews.filter((r) => r.status === 'PUBLISHED' || r.user_id === user?.id);
  const mine = reviews.find((r) => r.user_id === user?.id);

  return (
    <section className="mt-5 rounded-xl border border-line bg-white px-4 py-4 lg:mt-8 lg:px-6 lg:py-5">
      <h2 className="text-[18px] font-extrabold text-navy lg:text-[24px]">Customer Reviews</h2>
      {visible.length ? (
        <ul className="mt-3 divide-y divide-line">
          {visible.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex items-center gap-2">
                <span className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-4 ${i < r.rating ? 'fill-star text-star' : 'fill-[#e5e7eb] text-[#e5e7eb]'}`} />)}</span>
                <b className="text-[14px] font-semibold text-navy">{names[r.user_id] ?? 'Customer'}</b>
                {r.status !== 'PUBLISHED' && <span className="rounded bg-[#fdf1dc] px-1.5 py-0.5 text-[11px] font-semibold text-[#b45309]">Awaiting approval</span>}
              </div>
              <p className="mt-1 text-[14px] text-slate">{r.review}</p>
            </li>
          ))}
        </ul>
      ) : <p className="mt-2 text-[14px] text-slate">No reviews yet. Be the first to share your experience.</p>}

      {!live ? null : !user ? (
        <p className="mt-3 text-[14px] text-slate"><Link to="/login" className="font-semibold text-brand">Sign in</Link> to write a review.</p>
      ) : !mine && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-[14px] font-semibold text-navy">Write a review</p>
          <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)}><Star className={`size-7 ${n <= rating ? 'fill-star text-star' : 'fill-[#e5e7eb] text-[#e5e7eb]'}`} /></button>)}
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={500} placeholder="What did you like or dislike?" className="mt-2 w-full resize-none rounded-lg border border-line px-3 py-2.5 text-[14px] outline-none focus:border-brand" />
          <button onClick={() => void submit()} disabled={busy} className="mt-2 h-11 rounded-lg bg-brand px-6 text-[15px] font-semibold text-white disabled:opacity-60">{busy ? 'Posting…' : 'Post Review'}</button>
        </div>
      )}
    </section>
  );
}
