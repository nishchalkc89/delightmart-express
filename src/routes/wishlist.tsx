import { createFileRoute, Link } from '@tanstack/react-router';
import { Heart, Trash2 } from 'lucide-react';
import { StorePage } from '@/components/delight/store-shell';
import { ProductCard } from '@/components/delight/product-card';
import { useWishlist } from '@/components/delight/wishlist-context';
import { useCart } from '@/components/delight/cart-context';
import { useAuth } from '@/components/delight/auth-context';
import { toast } from 'sonner';

export const Route = createFileRoute('/wishlist')({
  head: () => ({ meta: [{ title: 'My Wishlist — Delight Shopping Mart' }, { name: 'description', content: 'Products you saved at Delight Shopping Mart.' }] }),
  component: Page,
});

function Page() {
  const wishlist = useWishlist();
  const cart = useCart();
  const { user } = useAuth();

  function addAll() {
    const inStock = wishlist.items.filter((p) => p.stock > 0 && !cart.lines.some((l) => l.product.id === p.id));
    inStock.forEach((p) => cart.add(p));
    toast.success(inStock.length ? `${inStock.length} item${inStock.length === 1 ? '' : 's'} added to your cart` : 'Everything is already in your cart');
  }

  return (
    <StorePage mobile={{ variant: 'back', actions: ['cart'], search: false }}>
      <div className="site-width py-4 lg:py-8">
        <p className="mb-3 hidden text-[14px] text-slate lg:block"><Link to="/">Home</Link> / <span className="text-ink">Wishlist</span></p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-navy lg:text-[36px]">My Wishlist</h1>
            <p className="text-[14px] text-slate">{wishlist.count} saved item{wishlist.count === 1 ? '' : 's'}{!user && wishlist.count > 0 && ' · sign in to keep them on all your devices'}</p>
          </div>
          {wishlist.count > 0 && <button onClick={addAll} className="h-11 rounded-lg bg-brand px-5 text-[14.5px] font-semibold text-white">Add all to cart</button>}
        </div>

        {wishlist.count ? (
          <div className="mt-5 grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {wishlist.items.map((p) => (
              <div key={p.id} className="relative">
                <ProductCard product={p} variant="grid" />
                <button onClick={() => wishlist.remove(p.id)} className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line py-1.5 text-[12.5px] font-medium text-slate hover:text-red"><Trash2 className="size-3.5" /> Remove</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-line bg-white px-6 py-12 text-center">
            <Heart className="mx-auto size-14 text-red" strokeWidth={1.4} />
            <h2 className="mt-3 text-[20px] font-bold text-navy">Your wishlist is empty</h2>
            <p className="mt-1 text-[14px] text-slate">Tap the ♡ on any product to save it for later.</p>
            <Link to="/" className="mt-5 inline-flex h-12 items-center rounded-xl bg-red px-7 font-bold text-white">Start Shopping</Link>
          </div>
        )}
      </div>
    </StorePage>
  );
}
