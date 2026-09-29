# Connect Delight Shopping Mart to your own Supabase project

The website works with **your own Supabase project** (not Lovable Cloud). Setup takes about 10 minutes.

## 1. Create the project
1. Go to https://supabase.com → **New project**.
2. Name: `delight-shopping-mart`, choose a strong database password, region closest to Nepal (e.g. **Mumbai / ap-south-1**).
3. Wait until the project is ready.

## 2. Create the database (one step)
1. Open **SQL Editor → New query**.
2. Open `supabase/setup.sql` from this repository, copy **everything**, paste it, and press **Run**.
3. You should see "Success. No rows returned".

This creates every table, security rule, storage bucket, the order function, the demo catalogue (23 products), and the promo codes `DELIGHT100` and `DELIGHT5`.
Run it **once** on an empty project.

## 3. Connect the website
1. **Project Settings → API**: copy the **Project URL** and the **anon / publishable key**.
2. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_DELIGHT_SUPABASE_URL=https://xxxx.supabase.co
   VITE_DELIGHT_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Where the site is hosted (Vercel, Netlify, Cloudflare…), add the same two variables in the host's environment settings.
4. Never use the `service_role` key in the website.

## 4. Authentication settings
**Authentication → URL Configuration**
- Site URL: your website address (e.g. `https://delightmart.com.np`)
- Redirect URLs: add `https://delightmart.com.np/**` and `http://localhost:8080/**`

**Authentication → Providers**
- Email: enabled (default). "Confirm email" can stay on.
- Google (optional): enable and paste a Google OAuth client ID/secret.
- Phone (optional, for the mobile-number login and OTP screen): needs an SMS provider (e.g. Twilio). Until then customers use email.

## 5. Become the admin
Sign up on the website with **nishchalkc370@gmail.com**. That account automatically becomes **Super Admin** and can open `/admin`.
Give other team members roles in **Admin → Users & Roles** after they sign up.

## 6. Test checklist
- [ ] Home page shows products (not the "Sample data" badge in admin).
- [ ] Sign up, confirm email, log in.
- [ ] Add products to cart → Checkout → add address → Cash on Delivery → order placed.
- [ ] Order appears in **My Orders** and in **Admin → Orders**.
- [ ] Admin: change the order to Delivered → **Payments** shows it as Paid.
- [ ] Admin: add a product with a photo → it appears in the store.
- [ ] Admin: create a promo code → it works at checkout.

## 7. Load the store's products
The store's full product list lives in `data/store-products.csv` (exported from the shop's system).

1. `npm run catalogue:prepare` sorts every product into a category and subcategory, reads the pack size and sets an **estimated** price. It writes `data/catalogue.csv`.
2. Open `data/catalogue.csv` in Excel if you want to fix prices, sale prices, stock or categories, then save it (keep it as CSV).
3. Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (Project Settings → API → secret key) to `.env`. This key stays on your computer; never put it in the website.
4. `npm run catalogue:import` creates the categories and creates or updates every product.
   - Stock is only set for new products, so stock you change in the admin is kept.
   - Products that are no longer in the file are hidden, not deleted (old orders keep working).

Careful: `catalogue:prepare` rebuilds `data/catalogue.csv` from scratch (your edits in it are lost), and `catalogue:import` sets name, category, price and sale price from the file (overwriting price changes made in the admin).

When the shop's product list changes, replace `data/store-products.csv` with the new export and run both commands again.
Category rules are in `scripts/catalogue/taxonomy.mjs`; estimated prices are in `scripts/catalogue/prepare.mjs`.

## Updating an existing database later
New changes are added as files in `supabase/migrations/`. Run only the new file(s) in the SQL Editor, or use the Supabase CLI: `supabase link` then `supabase db push`.
