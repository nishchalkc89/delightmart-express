# Connect your own Supabase project

1. Create a Supabase project and keep its database password and service-role key private.
2. In the SQL editor, run `supabase/migrations/202609230001_delight_schema.sql` once.
3. For development only, run `supabase/seed.sql`. It contains catalogue examples only—no fake customers or payments.
4. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Browser code receives only these public values.
5. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only in the deployment's protected server secrets. Never use the service role in `VITE_*` variables.
6. In Authentication, enable email/password, email verification and the approved redirect URLs for local, preview and production domains.
7. Confirm the migration created the five storage buckets and policies. Upload product, category, banner and branding images through staff-only tools.
8. Create the first account normally, then add its `auth.users.id` to `user_roles` as `SUPER_ADMIN` using the SQL editor. Never expose this operation in the storefront.
9. Add eSewa/Khalti secrets only to server secrets. Implement provider initiation and verification in TanStack server routes/functions; verify provider signatures/status before changing `payments.status` or `orders.status`.
10. Test with separate customer, delivery staff, inventory staff, order staff, manager and super-admin accounts. Attempt direct reads/writes to verify RLS denies unauthorized access.

## Application modes
Without the two `VITE_SUPABASE_*` values, the interface runs in clearly marked demo mode using the same catalogue components. With them, `src/services/supabase.ts` creates the browser publishable client. Replace demo catalogue calls behind `src/services/` with Supabase queries as data is imported; presentation components remain unchanged.

## Production checks
- Run migrations in order and retain them in source control.
- Confirm every public table has explicit grants and RLS enabled.
- Test product pagination, concurrent stock reservation, cancelled-order stock release and coupon limits.
- Configure payment provider callback URLs as public server routes and verify signatures.
- Verify password reset URLs and transactional email templates.
- Test PWA install and confirm only static assets are cached; shopping and checkout still require a network connection.
