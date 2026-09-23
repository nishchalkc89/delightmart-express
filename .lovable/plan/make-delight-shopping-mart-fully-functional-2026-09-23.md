# Make Delight Shopping Mart fully functional

## Goal
Turn the approved screenshot-matched interface into a working store and admin system without redesigning it. Keep one shared responsive codebase for desktop, mobile, PWA, and administration.

## Customer storefront
- Make desktop and mobile menus, search, category links, offers, footer links, location, wishlist, account, and order tracking navigate or open the correct working view.
- Add searchable/filterable product and category browsing, working product quantity controls, wishlist, and persistent cart behavior.
- Connect checkout steps so address, delivery time, payment choice, coupon, totals, review, and order placement use the shopper’s real selections.
- Support cash-on-delivery order placement end to end. Keep eSewa, Khalti, and card clearly unavailable until real provider credentials and verification are configured; never simulate a successful payment.
- Make sign-up, sign-in, sign-out, password recovery, profile, addresses, orders, tracking, reviews, and notifications operate through Lovable Cloud.

## Administration
- Protect admin pages and verify staff roles on the server/data layer.
- Replace decorative controls with working search, filters, tabs, pagination, row actions, exports, and add/edit forms.
- Connect Products, Categories, Inventory, Customers, Offers & Coupons, Banners & Content, Delivery, Payments, Reviews, Reports, Users & Roles, and Settings to stored data.
- Make dashboard totals and charts derive from the same data used by the management pages.

## Data and security
- Apply a Cloud-compatible schema for catalogue, stock, carts, orders, addresses, payments, offers, reviews, notifications, settings, and separate user roles.
- Add strict access rules: public catalogue reads, customer-owned account/order data, staff-only management, and admin-only role/settings changes.
- Seed only the approved demonstration catalogue and configuration so the first screen remains populated.
- Enable email/password and Google sign-in, create required image storage, and keep privileged operations server-side.

## Visual fidelity and PWA
- Preserve the approved green/red Delight design, exact information hierarchy, desktop sidebar/header, mobile bottom navigation, cards, forms, tables, and spacing.
- Compare the key storefront, checkout, account, and all admin screens against the supplied references at desktop and mobile sizes.
- Keep installation, icons, static caching, and offline fallback working; exclude authentication callbacks from caching.

## Validation
- Test complete shopper flow: browse → search → product → cart → checkout → COD order → tracking.
- Test account authentication, profile/address changes, and sign-out.
- Test every admin navigation item and representative create/edit/filter/export actions.
- Check access rules, browser errors, mobile/desktop rendering, PWA registration, and final build health.

## Technical details
- TanStack Start routes and server functions remain the application boundary; TanStack Query owns data freshness.
- Shared forms and dialogs will be reused across admin sections instead of duplicating pages.
- Optimistic updates will be used only where rollback and error feedback are implemented.
- Payment-provider integrations stop at a truthful configuration state until merchant credentials are supplied.
