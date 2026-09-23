# Delight Shopping Mart database schema

## Identity and roles
- `profiles`: one-to-one extension of `auth.users`; full name, email, phone, avatar and status. It never stores passwords.
- `user_roles`: many-to-one role assignments using `app_role`: `SUPER_ADMIN`, `MANAGER`, `ORDER_STAFF`, `INVENTORY_STAFF`, `DELIVERY_STAFF`, `CUSTOMER`.
- `has_role()` and `is_staff()` are security-definer helpers that avoid recursive role-policy checks.

## Catalogue and stock
- `categories`: hierarchical categories through `parent_id`, unique slug, public active rows, sort order.
- `products`: category FK, unique slug/SKU, pricing, sale pricing, unit, flags and JSON specifications.
- `product_images`: ordered product gallery with primary-image flag.
- `inventory`: one row per product; current, reserved, available (`current - reserved`) and low-stock threshold.
- `inventory_adjustments`: auditable quantity deltas, actor, reason and reference.

## Shopping and fulfilment
- `addresses`: customer-owned delivery addresses with optional map coordinates.
- `cart` and `cart_items`: one authenticated cart per customer and unique product lines.
- `orders`: immutable order totals, selected address, payment method, delivery instructions and status.
- `order_items`: purchased product snapshots so later catalogue edits do not change historical orders.
- `delivery_assignments`: one store-staff assignment per order, delivery status, timestamps and failure reason.
- `payments`: provider references and server-verified payment state. Client responses never set `PAID`.

## Marketing and operations
- `coupons`: codes, discount rules, minimum order, validity and limits.
- `offers`: product, category, coupon or shipping campaigns with scheduling.
- `banners`: homepage placement, link, visibility window and ordering.
- `reviews`: customer/product/order references, rating and moderation status.
- `notifications`: customer-specific order, delivery and promotional messages.
- `store_settings`: branding, contact, hours, currency, timezone and configurable delivery rules.

## Relationships
`auth.users` → `profiles`, `user_roles`, `addresses`, `cart`, `orders`, `reviews`, `notifications`; `categories` → `products` → `product_images`/`inventory`; `orders` → `order_items`/`payments`/`delivery_assignments`.

## RLS summary
Public visitors can read only active catalogue rows, public media, active offers/banners and store settings. Customers can access only their own profile, addresses, cart, orders, order items, payments, reviews and notifications. Staff access is checked through database roles. Administration remains enforced even if browser controls are bypassed. Payment creation/verification is reserved for trusted server code.

## Storage buckets
`product-images`, `category-images`, `banners`, and `store-branding` are public-read, staff-write. `profile-images` is private and scoped to the signed-in user's folder.
