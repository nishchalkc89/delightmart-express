import { createFileRoute, Link } from '@tanstack/react-router';
import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/delight/auth-context';
import { supabase } from '@/services/supabase';

type Notice = { id: string; title: string; body: string; created_at: string; read_at: string | null; orderId?: string };

const statusText: Record<string, [string, string]> = {
  PENDING: ['Order placed', 'We have received your order and will confirm it shortly.'],
  CONFIRMED: ['Order confirmed', 'The store has confirmed your order.'],
  PREPARING: ['Packing your order', 'Your items are being picked and packed.'],
  READY_FOR_DELIVERY: ['Ready for delivery', 'Your order is packed and waiting for a rider.'],
  OUT_FOR_DELIVERY: ['Out for delivery', 'Your rider is on the way. Keep your phone nearby.'],
  DELIVERED: ['Delivered', 'Your order was delivered. Enjoy, and thank you for shopping with Delight!'],
  CANCELLED: ['Order cancelled', 'This order was cancelled. Contact us if this is unexpected.'],
  FAILED: ['Delivery failed', 'We could not deliver this order. We will contact you.'],
};

export const Route = createFileRoute('/account/notifications')({
  head: () => ({ meta: [{ title: 'Notifications — Delight Shopping Mart' }, { name: 'description', content: 'View your store and order notifications.' }, { property: 'og:title', content: 'Notifications — Delight Shopping Mart' }, { property: 'og:description', content: 'Your order updates in one place.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Store messages plus the latest status of each of your orders.
    void Promise.all([
      supabase.from('notifications').select('id,title,body,created_at,read_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('orders').select('id,order_number,status,created_at,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20),
    ]).then(([notes, orders]) => {
      if (notes.error) toast.error(notes.error.message);
      const updates: Notice[] = (orders.data ?? []).map((o) => {
        const [title, body] = statusText[o.status] ?? ['Order update', `Status: ${o.status}`];
        return { id: `order-${o.id}`, orderId: o.id, title: `${title} · ${o.order_number}`, body, created_at: o.updated_at ?? o.created_at, read_at: o.updated_at ?? o.created_at };
      });
      // Once the store sends order messages itself, don't repeat them.
      const told = (notes.data ?? []).map((n) => n.body).join(' ');
      const extra = updates.filter((u) => !told.includes(u.title.split(' · ')[1] ?? '~'));
      setItems([...(notes.data ?? []), ...extra].sort((a, b) => b.created_at.localeCompare(a.created_at)));
      setLoading(false);
    });
  }, [user]);

  async function markRead(id: string) {
    const now = new Date().toISOString();
    const { error } = await supabase.from('notifications').update({ read_at: now }).eq('id', id);
    if (error) toast.error(error.message); else setItems((v) => v.map((n) => (n.id === id ? { ...n, read_at: now } : n)));
  }

  return (
    <div>
      <h1 className="text-[28px] font-extrabold tracking-tight text-navy lg:text-[34px]">Notifications</h1>
      <p className="text-[14.5px] text-slate">Order updates and offers from Delight.</p>
      <div className="mt-4 space-y-2.5">
        {loading && [0, 1, 2].map((i) => <div key={i} className="h-[84px] animate-pulse rounded-xl bg-[#f1f4f7]" />)}
        {items.map((n) => (
          <article key={n.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${n.read_at ? 'border-line bg-white' : 'border-brand/30 bg-[#f3fbf7]'}`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50"><Bell className="size-5 text-brand" /></span>
            <div className="min-w-0 flex-1">
              {n.orderId ? <Link to="/orders/$id" params={{ id: n.orderId }} className="block text-[15px] font-semibold text-navy hover:text-brand">{n.title}</Link> : <b className="block text-[15px] font-semibold text-navy">{n.title}</b>}
              <p className="text-[14px] text-slate">{n.body}</p>
              <span className="text-[12px] text-slate">{new Date(n.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {!n.read_at && <button onClick={() => markRead(n.id)} className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-brand"><CheckCheck className="size-4" /> Mark read</button>}
          </article>
        ))}
        {!loading && !items.length && (
          <div className="rounded-xl border border-line bg-white p-8 text-center">
            <Bell className="mx-auto size-10 text-slate" />
            <p className="mt-2 text-[15px] text-slate">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
