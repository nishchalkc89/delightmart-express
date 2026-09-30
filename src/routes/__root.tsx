import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/components/delight/cart-context";
import { WishlistProvider } from '@/components/delight/wishlist-context';
import { AuthProvider } from "@/components/delight/auth-context";
import { CheckoutProvider } from "@/components/delight/checkout-context";
import { PwaRegister } from "@/components/delight/pwa-register";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/delight/logo";

function NotFoundComponent() {
  const links = [['/', 'Home'], ['/categories', 'All Categories'], ['/categories/deals-offers', "Today's Deals"], ['/account/help', 'Help']] as const;
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md text-center">
        <Link to="/" aria-label="Delight Shopping Mart home"><Logo className="mx-auto h-[56px] w-auto" /></Link>
        <img src="/art/shopping_cart.svg" alt="" className="mx-auto mt-8 size-20" />
        <h1 className="mt-4 text-[26px] font-extrabold text-navy">This page is not on our shelves</h1>
        <p className="mt-2 text-[15px] text-slate">The link may be old or mistyped. Search for what you need, or pick a place to start:</p>
        <form className="mt-5 flex h-12 overflow-hidden rounded-xl border border-line" onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.currentTarget).get('q'); window.location.assign(`/search?q=${encodeURIComponent(String(q ?? ''))}`); }}>
          <input name="q" aria-label="Search products" placeholder="Search rice, Maggi, shampoo…" className="min-w-0 flex-1 px-4 text-[15px] outline-none" />
          <button className="bg-red px-5 font-semibold text-white">Search</button>
        </form>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {links.map(([to, label]) => <Link key={to} to={to as '/'} className="rounded-full border border-line px-4 py-2 text-[14px] font-medium text-navy hover:border-brand hover:text-brand">{label}</Link>)}
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Delight Shopping Mart — Tulsipur's One-Stop Shop" },
      { name: "description", content: "Shop groceries, fashion, baby care, home essentials and more from Delight Shopping Mart in Tulsipur, Dang." },
      { name: "author", content: "Delight Shopping Mart Pvt. Ltd." },
      { name: "theme-color", content: "#08704c" },
      { property: "og:title", content: "Delight Shopping Mart" },
      { property: "og:description", content: "Everything you need under one roof in Tulsipur." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Kaushan+Script&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <AuthProvider><CartProvider><WishlistProvider><CheckoutProvider><Outlet /></CheckoutProvider></WishlistProvider></CartProvider></AuthProvider>
      <PwaRegister />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
