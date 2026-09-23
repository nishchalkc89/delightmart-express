# Delight Shopping Mart — Complete Website, PWA, and Admin

## Goal
Build the finalized Delight Shopping Mart design as one shared application for desktop, mobile, installable PWA, and administration. The supplied screenshots are the visual specification: preserve their page composition, green/red brand palette, typography hierarchy, dense admin tables, mobile navigation, spacing, controls, and content patterns rather than redesigning them.

## Foundation and visual system
- Replace the blank starter with the real storefront at `/` and use the supplied `logo.jpg` as the brand mark throughout; create a padded square favicon from it.
- Define semantic Delight tokens in the global stylesheet for brand green, dark navigation green, red, amber, navy text, subtle borders, tinted states, shadows, and compact radii. Use responsive desktop/mobile compositions matching the screenshots.
- Create shared storefront headers, desktop category navigation, mobile bottom navigation, product cards, category cards, promotional banners, badges, steppers, order summaries, state screens, dialogs, drawers, forms, tables, pagination, admin statistics, and charts.
- Add accessible focus behavior, labels, keyboard operation, reduced-motion support, image alt text, loading skeletons, empty/error/retry states, and duplicate-submission protection.

## Storefront experience
- Build the screenshot-matched homepage sections: desktop top bar/navigation, hero, service benefits, popular/explore categories, timed offers, popular products, promotional bands, new arrivals, brands, subscription/app promotion, trust strip, and footer. Mobile receives the approved compact header, category rail, two-column products, banners, and bottom navigation.
- Add product browsing at `/products`, `/categories`, `/categories/$slug`, and `/search` with query-based search, category/subcategory, price, availability, sorting, and pagination.
- Add product details at `/products/$slug` with gallery/video state, discounts, inventory, quantity, cart/buy actions, highlights, reviews, related products, and coupon promotion.
- Add `/cart`, `/checkout`, and the screenshot-matched checkout stages: address and delivery selection, order review, payment choice, confirmation, editable sections, validated totals, and order creation.
- Add `/orders`, `/orders/$id`, `/account`, `/account/profile`, `/account/addresses`, and `/account/orders` using the approved account and tracking patterns.
- Add `/login`, `/signup`, `/forgot-password`, and `/reset-password`, including the approved welcome, mobile/email login, sign-up, verification, and recovery states. Google/Apple controls will be wired only when enabled in the customer’s Supabase project.

## Data architecture and Supabase handoff
- Keep a centralized typed data layer under services and query/mutation hooks; components will not contain scattered Supabase queries.
- Support two adapters: seeded demo/mock data when environment variables are absent, and the customer’s external Supabase project when `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are configured. No privileged credential enters browser code.
- Create ordered migrations for enums, profiles, separate `user_roles`, categories, products, product images, inventory and stock history, addresses, carts/items, orders/items, delivery assignments, payments, coupons, offers, banners/content, reviews, notifications, and store settings.
- Add indexes, constraints, timestamps, stock/order helpers, explicit grants for every public table, RLS, and role-aware policies for `SUPER_ADMIN`, `MANAGER`, `ORDER_STAFF`, `INVENTORY_STAFF`, `DELIVERY_STAFF`, and `CUSTOMER`. Customers only access their own private records.
- Add storage bucket/policy SQL for public catalogue/banner/branding media and owner-scoped profile media.
- Add safe demo seed data matching the screenshots; snapshot product/price/address data into orders so history remains stable.
- Implement secure server-side endpoints/functions for order placement, stock reservation, payment initiation/verification hooks, staff-only operations, and notifications. eSewa/Khalti/card controls remain non-fabricated until real provider credentials and callback settings are supplied; COD remains usable.

## Admin experience
- Build a shared protected admin shell with the exact dark-green sidebar order, top search/location/profile bar, active states, alert counts, responsive navigation, and role-based visibility.
- Add `/admin` dashboard with approved KPI cards, sales chart, order-status chart, recent orders, low-stock and best-selling panels, and shortcuts.
- Add screenshot-matched management pages for orders, products, categories, inventory, customers, offers/coupons, banners/content, delivery, payments, reports, users/roles, and settings.
- Preserve the dense table-plus-detail-panel/form-panel layouts, tabs, filtering, search, date ranges, status badges, pagination, toggles, product/category image fields, stock history, delivery assignment, moderation, report export UI, permissions, and configurable store/delivery/payment settings.
- Add the requested Reviews page in the same approved admin system, including publish/hide moderation and product/customer/order context.
- Enforce authorization in data policies and protected operations, never by sidebar visibility alone.

## PWA, SEO, and documentation
- Add manifest, generated app icons based on the supplied logo, theme/background colors, standalone behavior, service worker registration, conservative caching for app/static/public catalogue resources, and a branded offline fallback. Checkout, account, payments, and administration will not be presented as fully offline.
- Add unique route titles/descriptions and social metadata, clean product/category URLs, responsive image loading, route-level code splitting, and measured query caching.
- Add `.env.example`, `docs/DATABASE_SCHEMA.md`, and `docs/SUPABASE_SETUP.md` covering schema relationships, roles/RLS, buckets, migrations/seeding, external project setup, authentication providers, payment secrets/callbacks, local mock mode, and deployment checks.

## Validation
- Verify the app’s build and diagnostics after implementation.
- Exercise navigation and core interactions in the live preview: responsive homepage, catalogue filters, product cart flow, checkout/review/payment selection, account, and representative admin table/form/detail interactions.
- Compare desktop and mobile screenshots at representative viewports, checking layout density, clipping, navigation, text fit, images, and blank/error states.
- Keep future native apps, dedicated delivery app, push, loyalty, AI recommendations, multi-location, and warehouse features outside V1.

## Technical notes
- The project’s supported router is TanStack Router rather than React Router; it provides the same URL structure while preserving the existing TanStack Start application.
- The customer’s own external Supabase project cannot be connected from chat. The repository will include the complete client integration, migrations, policies, seed, and setup guide so the supplied project URL/key can activate production mode without duplicating the interface.
- The approved screenshots are design references only and will not be embedded as page images. Product/category/banner imagery will use purpose-built visual assets; the supplied logo is the only screenshot upload used directly as branding.
