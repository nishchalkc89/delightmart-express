# Delight Mart E-Commerce

============================================================

DELIGHT SHOPPING MART — COMPLETE WEBSITE + PWA PROJECT

============================================================

I am building a real e-commerce platform for:

DELIGHT SHOPPING MART PVT. LTD.

Location:

Tulsipur, Dang, Lumbini Province, Nepal

I am uploading multiple UI/UX reference images that were specifically designed for this project.

IMPORTANT:

THE UPLOADED IMAGES ARE THE FINAL DESIGN REFERENCE.

I want you to reproduce the uploaded designs as closely as possible.

DO NOT redesign the interface.

DO NOT replace the design with your own generic ecommerce template.

DO NOT create a completely different UI.

DO NOT unnecessarily simplify the design.

DO NOT change the layout, colors, spacing, cards, sidebar, header, navigation, typography, buttons, tables, forms, icons, or visual hierarchy unless required for responsive behavior.

The uploaded screenshots are the DESIGN SPECIFICATION.

Your job is to make the design functional while preserving the same visual appearance and UX.

============================================================

1. MOST IMPORTANT REQUIREMENT

WEBSITE + MOBILE WEBSITE + PWA

============================================================

This project MUST provide all of the following from ONE codebase:

1. Desktop Website

2. Responsive Mobile Website

3. Installable Mobile PWA

4. Admin Dashboard

DO NOT create a separate website project.

DO NOT create a separate PWA project.

DO NOT duplicate the frontend.

Build ONE responsive web application.

The same application must work as:

DESKTOP:

A normal ecommerce website in a desktop browser.

MOBILE:

A responsive ecommerce website in a mobile browser.

PWA:

The same mobile experience can be installed as a Progressive Web App and behave like a mobile application.

The following must be shared:

- Components

- Routes

- UI

- Authentication

- API/data layer

- Business logic

- Product data

- Categories

- Cart

- Checkout

- Orders

- Customer account

- Delivery information

The PWA is NOT a separate application.

It is the same web application with PWA capabilities.

============================================================

2. OVERALL ARCHITECTURE

============================================================

The intended architecture is:

                    DELIGHT SHOPPING MART

                             |

              ┌──────────────┴──────────────┐

              |                             |

        CUSTOMER SIDE                  ADMIN SIDE

              |                             |

     Website + Mobile + PWA          Admin Dashboard

              |                             |

              └──────────────┬──────────────┘

                             |

                         SUPABASE

                             |

          ┌──────────────────┼──────────────────┐

          |                  |                  |

     PostgreSQL          Supabase Auth      Supabase Storage

      Database             Authentication     Images/Files

          |

      RLS Policies

          |

   Edge Functions where required

Use Supabase as the production backend platform.

============================================================

3. SUPABASE

============================================================

I WILL USE SUPABASE.

Use Supabase for:

- PostgreSQL database

- Authentication

- Storage

- Row Level Security (RLS)

- Edge Functions where appropriate

- Realtime functionality only where genuinely useful

Do NOT use Lovable's own managed database.

Do NOT create an unrelated database architecture.

The project should be structured around my Supabase project.

IMPORTANT:

Do not put sensitive service-role keys in the frontend.

Use the Supabase publishable/anonymous client-side key where appropriate.

Any privileged operation must happen through secure server-side/Edge Function logic.

============================================================

4. FRONTEND TECHNOLOGY

============================================================

Use:

- React

- TypeScript

- Vite

- Tailwind CSS

- shadcn/ui where appropriate

- React Router

- TanStack Query

- Supabase JavaScript client

- Lucide icons

Use reusable components.

Use clean and maintainable TypeScript.

Avoid unnecessary dependencies.

Keep the code modular.

============================================================

5. DATABASE ARCHITECTURE

============================================================

Create a proper relational PostgreSQL schema in Supabase.

The frontend should NOT contain random database queries throughout UI components.

Create a clean data-access/service layer.

Use Supabase queries through centralized services/hooks.

For example:

src/

  lib/

    supabase.ts

  services/

    auth.ts

    products.ts

    categories.ts

    cart.ts

    orders.ts

    customers.ts

    inventory.ts

    delivery.ts

    payments.ts

    banners.ts

    offers.ts

    reviews.ts

    reports.ts

    users.ts

    settings.ts

  hooks/

    useAuth.ts

    useProducts.ts

    useCategories.ts

    useCart.ts

    useOrders.ts

    etc.

Do not scatter Supabase queries randomly throughout components.

============================================================

6. DATABASE TABLES

============================================================

Create a scalable database structure.

At minimum, consider the following tables:

profiles

user_roles

categories

products

product_images

inventory

addresses

cart

cart_items

orders

order_items

delivery_assignments

payments

coupons

offers

banners

reviews

notifications

store_settings

Create additional supporting tables only where genuinely necessary.

============================================================

7. PROFILES

============================================================

Create a profiles table connected to Supabase Auth users.

Example information:

- id

- full_name

- email

- phone

- avatar_url

- date_of_birth if required

- status

- created_at

- updated_at

Do not duplicate authentication passwords in the profiles table.

Supabase Auth must manage credentials.

============================================================

8. USER ROLES

============================================================

Create role management.

Roles:

SUPER_ADMIN

MANAGER

ORDER_STAFF

INVENTORY_STAFF

DELIVERY_STAFF

CUSTOMER

Use a secure role architecture.

Backend/database RLS policies must enforce permissions.

Do not rely only on frontend role checks.

============================================================

9. CATEGORIES

============================================================

Create categories and optional subcategories.

Initial categories may include:

- Groceries

- Fashion

- Ladies Wear

- Baby Wear

- Stationery

- Toys

- Kitchen

- Skincare

- Fast Food / Cafe

Support:

- category name

- slug

- description

- image

- parent category

- sort order

- active status

- created_at

- updated_at

============================================================

10. PRODUCTS

============================================================

Products should support:

- id

- name

- slug

- description

- SKU

- category_id

- price

- sale_price

- unit

- stock status

- featured

- bestseller

- active status

- brand

- created_at

- updated_at

Product images should be stored separately.

============================================================

11. PRODUCT IMAGES

============================================================

Use Supabase Storage for product images.

Create product image records containing:

- id

- product_id

- storage/path or public URL

- sort_order

- is_primary

- created_at

Do not store large image files directly inside PostgreSQL.

============================================================

12. INVENTORY

============================================================

Create inventory management.

Support:

- product

- current stock

- reserved stock

- available stock

- low stock threshold

- stock status

- last updated

Prepare architecture for future stock history.

============================================================

13. ADDRESSES

============================================================

Customers should be able to save multiple delivery addresses.

Support:

- customer

- recipient name

- phone

- address

- city

- area

- landmark

- latitude/longitude if later required

- default address

- created_at

- updated_at

Do not require precise GPS functionality for V1 unless necessary.

============================================================

14. CART

============================================================

Create:

cart

cart_items

Support:

- customer

- product

- quantity

- price snapshot where appropriate

- created_at

- updated_at

Cart must be functional.

============================================================

15. ORDERS

============================================================

Create:

orders

order_items

Orders should store appropriate snapshots so historical orders remain accurate even if product prices change later.

Order information should include:

- customer

- address

- subtotal

- discount

- delivery fee

- total

- payment method

- payment status

- order status

- delivery information

- notes

- created_at

- updated_at

============================================================

16. ORDER STATUS

============================================================

Use:

PENDING

CONFIRMED

PREPARING

READY_FOR_DELIVERY

OUT_FOR_DELIVERY

DELIVERED

CANCELLED

FAILED

Keep payment status separate:

PENDING

PAID

FAILED

REFUNDED

PARTIAL_REFUND

============================================================

17. DELIVERY MODEL

============================================================

Delight will initially use ITS OWN STORE STAFF for delivery.

There will NOT be a separate delivery application in V1.

DO NOT create a separate driver app.

The admin/staff interface should allow:

- viewing orders ready for delivery

- assigning delivery staff

- viewing customer address

- viewing customer phone

- updating delivery status

- marking out for delivery

- marking delivered

- recording failed delivery

The architecture should allow a dedicated delivery app to be added in the future.

============================================================

18. DELIVERY TIME

============================================================

Delight aims to provide fast local delivery, approximately 20 minutes where operationally possible.

Do NOT hardcode an unconditional "20 minute guarantee."

Estimated delivery time must be configurable.

Prepare support for:

- delivery radius

- delivery fee

- estimated delivery time

- minimum order amount

- service availability

============================================================

19. PAYMENTS

============================================================

Prepare the architecture for:

- Cash on Delivery

- eSewa

- Khalti

- future payment providers

Create payment records.

Never trust payment success based only on frontend state.

Payment verification must happen securely through backend/provider logic.

Do not store payment secrets in frontend code.

============================================================

20. OFFERS & COUPONS

============================================================

Support:

- product discounts

- category discounts

- coupon codes

- campaign offers

- start date

- end date

- usage limits

- status

============================================================

21. BANNERS & CONTENT

============================================================

Create banner/content management.

Support:

- hero banners

- promotional banners

- homepage sections

- featured categories

- featured products

Banner information:

- title

- image

- link

- position

- start date

- end date

- status

- sort order

Use Supabase Storage for banner images.

============================================================

22. REVIEWS

============================================================

Create product reviews.

Support:

- customer

- product

- order reference where appropriate

- rating

- review

- status

- created_at

Admin should be able to moderate reviews.

============================================================

23. NOTIFICATIONS

============================================================

Create a notification structure that can later support:

- order confirmation

- order status

- delivery updates

- promotional notifications

Do not over-engineer push notifications in V1.

============================================================

24. STORE SETTINGS

============================================================

Create store settings.

Support:

- store name

- logo

- phone

- email

- address

- opening time

- closing time

- currency

- timezone

- delivery settings

- minimum order

- estimated delivery time

The store currently operates approximately:

7 AM – 9 PM

But these values should be configurable through admin settings.

============================================================

25. SUPABASE ROW LEVEL SECURITY

============================================================

RLS is extremely important.

Create proper RLS policies.

Customers should only be able to access their own:

- profile

- addresses

- cart

- orders

- order items

- reviews where appropriate

Staff/admin users should only access information allowed by their roles.

Never expose all customer information to normal customers.

Never rely solely on frontend checks.

============================================================

26. SUPABASE STORAGE

============================================================

Create appropriate storage buckets for:

- product images

- category images

- banners

- profile images

- store branding

Apply appropriate access rules.

Public assets may be publicly readable where appropriate.

Sensitive files must not be publicly exposed.

============================================================

27. SUPABASE MIGRATIONS

============================================================

IMPORTANT:

Generate proper Supabase database migrations.

Create a structure such as:

supabase/

  migrations/

  functions/

  seed.sql

  config.toml if required

The migrations should create:

- tables

- enums

- relationships

- indexes

- constraints

- triggers where needed

- RLS

- RLS policies

Do NOT simply create tables manually through frontend code.

============================================================

28. DATABASE DOCUMENTATION

============================================================

Create:

docs/DATABASE_SCHEMA.md

Document:

- every table

- purpose

- columns

- relationships

- primary keys

- foreign keys

- indexes

- important constraints

- RLS behavior

- roles

- storage buckets

Also provide an understandable ER-style relationship description.

============================================================

29. SEED DATA

============================================================

Create safe development seed data.

Include example:

- categories

- products

- sample inventory

- offers

- banners

Clearly mark all seed data as development/demo data.

Do not treat fake customer/payment information as real.

============================================================

30. EDGE FUNCTIONS

============================================================

Use Supabase Edge Functions where server-side logic is required.

Potential examples:

- payment verification

- secure admin operations

- order processing

- notifications

- external API integrations

- sensitive operations

Do not move everything into Edge Functions unnecessarily.

Use normal Supabase queries for simple CRUD operations where appropriate.

============================================================

31. CUSTOMER WEBSITE

============================================================

Build the customer-facing ecommerce website.

Routes should include approximately:

/

 /products

 /products/:slug

 /categories

 /categories/:slug

 /search

 /cart

 /checkout

 /orders

 /orders/:id

 /account

 /account/profile

 /account/addresses

 /account/orders

 /login

 /signup

 /forgot-password

 /reset-password

Maintain clean routing.

============================================================

32. CUSTOMER HOMEPAGE

============================================================

Recreate the homepage according to the uploaded reference images.

Possible sections:

- Delight logo

- location/store information

- search

- account

- cart

- navigation

- hero banner

- categories

- featured products

- best sellers

- offers

- promotional banners

- footer

Do not automatically add unrelated sections.

Follow the reference images.

============================================================

33. DESKTOP WEBSITE

============================================================

The desktop website must follow the uploaded desktop reference images.

Match:

- header

- logo

- navigation

- search

- account

- cart

- banners

- categories

- product grids

- filters

- footer

- spacing

- typography

============================================================

34. MOBILE WEBSITE

============================================================

The mobile website must follow the uploaded mobile references.

Do NOT simply shrink the desktop design.

Use:

- mobile header

- location

- search

- category layout

- product cards

- mobile filters

- bottom navigation

- mobile cart

- mobile checkout

- mobile account

The mobile experience should feel like a modern shopping application.

============================================================

35. PWA

============================================================

Make the SAME application installable as a PWA.

Include:

- manifest

- app icons

- Delight logo

- theme color

- standalone mode

- service worker

- appropriate caching

- installability

- offline fallback

- mobile-friendly experience

Do NOT create a separate PWA project.

The PWA must use the same:

- routes

- components

- authentication

- Supabase connection

- cart

- products

- orders

- customer account

Do not claim that the entire application works offline.

Only appropriate static/public resources should be cached.

============================================================

36. PWA SPLASH SCREEN

============================================================

Create a short Delight branded loading/splash experience.

Use the uploaded Delight logo.

Suggested sequence:

1. Delight logo appears

2. subtle fade/scale animation

3. Delight branding appears

4. short loading indicator

5. application opens

Keep it approximately 1–1.5 seconds.

Respect prefers-reduced-motion.

============================================================

37. ONBOARDING

============================================================

If the uploaded mobile design includes onboarding screens, reproduce them.

Possible concepts:

- Shop everything in one place

- Fast local delivery

- Easy ordering

- Secure payment

Show onboarding only for new users.

Do not repeatedly show it after completion.

============================================================

38. AUTHENTICATION

============================================================

Use Supabase Auth.

Support:

- signup

- login

- logout

- email verification

- forgot password

- reset password

- session persistence

- profile

Prepare the architecture for future OTP/phone authentication if needed.

Admin authentication must also use secure authentication.

============================================================

39. PRODUCT LISTING

============================================================

Support:

- search

- category filtering

- subcategory filtering

- price filtering

- sorting

- availability

- pagination

- product cards

Use query parameters where appropriate.

============================================================

40. PRODUCT DETAILS

============================================================

Include:

- product image gallery

- name

- description

- price

- sale price

- discount

- availability

- quantity selector

- add to cart

- buy now

- specifications

- reviews

- related products

Follow uploaded designs.

============================================================

41. CART

============================================================

Create a functional cart.

Support:

- add product

- remove product

- increase quantity

- decrease quantity

- clear cart

- subtotal

- discount

- delivery fee

- total

Use Supabase/backend as the source of truth for authenticated customers where appropriate.

============================================================

42. CHECKOUT

============================================================

Checkout flow:

CART

 ↓

ADDRESS

 ↓

DELIVERY INFORMATION

 ↓

PAYMENT

 ↓

ORDER REVIEW

 ↓

PLACE ORDER

 ↓

ORDER CONFIRMATION

Support:

- saved address

- new address

- phone

- delivery instructions

- payment method

- order summary

============================================================

43. ORDER TRACKING

============================================================

Customers should be able to see:

- order number

- items

- total

- payment status

- order status

- delivery status

- estimated delivery time

- assigned delivery information where appropriate

Use the order status lifecycle.

============================================================

44. CUSTOMER ACCOUNT

============================================================

Create:

- profile

- addresses

- orders

- order details

- settings

- logout

Follow uploaded UI references.

============================================================

45. ADMIN DASHBOARD

============================================================

Create the Admin Dashboard based on the uploaded Admin Dashboard reference image.

It must closely reproduce:

- sidebar

- header

- search

- notifications

- profile

- statistics cards

- charts

- recent orders

- sales information

- product information

- low stock

- order summary

Do not redesign it.

============================================================

46. ADMIN SIDEBAR

============================================================

Use the same sidebar design shown in the reference.

Sections:

Dashboard

Orders

Products

Categories

Inventory

Customers

Offers & Coupons

Banners & Content

Delivery Management

Payments

Reviews

Reports

Users & Roles

Settings

Keep the same order and visual hierarchy.

============================================================

47. ADMIN ORDERS

============================================================

Recreate the Orders screen.

Include:

- order list

- search

- filters

- order status

- payment status

- customer

- amount

- date

- order details

- products

- address

- delivery assignment

- order status updates

- pagination

============================================================

48. ADMIN PRODUCTS

============================================================

Recreate Products management.

Admin should be able to:

- add

- edit

- deactivate

- upload images

- set price

- sale price

- stock

- category

- subcategory

- SKU

- featured

- bestseller

- status

Use Supabase Storage for images.

============================================================

49. ADMIN CATEGORIES

============================================================

Support:

- create

- edit

- deactivate

- reorder

- upload category image

- parent/subcategory relationship

============================================================

50. ADMIN INVENTORY

============================================================

Recreate Inventory.

Support:

- current stock

- reserved stock

- available stock

- low stock

- out of stock

- SKU

- stock adjustment

- search

- filters

============================================================

51. ADMIN CUSTOMERS

============================================================

Recreate Customers.

Include:

- customer list

- search

- filters

- profile

- phone

- email

- addresses

- order history

- total orders

- total spending

- status

Protect customer information using RLS/role permissions.

============================================================

52. ADMIN OFFERS & COUPONS

============================================================

Recreate Offers & Coupons.

Support:

- product discounts

- category discounts

- coupon codes

- campaign offers

- validity

- usage limits

- status

- create

- edit

- deactivate

============================================================

53. ADMIN BANNERS & CONTENT

============================================================

Recreate Banners & Content.

Support:

- hero banners

- promotional banners

- homepage content

- featured categories

- featured products

- image upload

- title

- link

- position

- start date

- end date

- status

- sort order

Use Supabase Storage.

============================================================

54. ADMIN DELIVERY MANAGEMENT

============================================================

Recreate the Delivery Management page from the reference.

Include:

- pending deliveries

- ready for delivery

- out for delivery

- delivered

- failed

- staff assignment

- customer address

- customer phone

- order amount

- delivery status

- estimated delivery time

NO SEPARATE DELIVERY APP FOR V1.

============================================================

55. ADMIN PAYMENTS

============================================================

Recreate Payments.

Support:

- COD

- eSewa

- Khalti

- paid

- pending

- failed

- refunded

Do not create fake payment processing.

============================================================

56. ADMIN REVIEWS

============================================================

Recreate Reviews.

Include:

- product

- customer

- rating

- review

- date

- status

- publish

- hide

- moderation

============================================================

57. ADMIN REPORTS

============================================================

Recreate Reports/Analytics.

Support:

- sales

- revenue

- orders

- customers

- average order value

- top products

- category performance

- date filtering

- charts

- export UI

============================================================

58. ADMIN USERS & ROLES

============================================================

Recreate Users & Roles.

Roles:

SUPER_ADMIN

MANAGER

ORDER_STAFF

INVENTORY_STAFF

DELIVERY_STAFF

Support:

- create user

- edit user

- deactivate user

- role assignment

- permissions

Backend/RLS must enforce actual permissions.

============================================================

59. ADMIN SETTINGS

============================================================

Recreate Settings exactly according to the uploaded reference.

Include:

- General

- Store Information

- Payment Settings

- Delivery Settings

- Email & Notifications

- Appearance

- System

Store settings:

- store name

- logo

- phone

- email

- address

- opening hours

- currency

- timezone

- delivery radius

- delivery fee

- estimated delivery time

- minimum order

============================================================

60. DESIGN SYSTEM

============================================================

Create reusable design tokens/components.

Match the uploaded references for:

- colors

- typography

- spacing

- buttons

- cards

- inputs

- badges

- tables

- modals

- drawers

- tabs

- dropdowns

- navigation

- sidebar

- mobile navigation

Do not independently redesign each page.

All pages must feel like ONE product.

============================================================

61. ERROR / LOADING STATES

============================================================

Create reusable:

- loading states

- skeletons

- empty states

- error states

- retry states

- unauthorized states

- forbidden states

- network error states

Every data-driven page should handle these properly.

============================================================

62. FORM VALIDATION

============================================================

Forms must include:

- validation

- required fields

- clear errors

- loading states

- success messages

- API/database errors

- duplicate submission prevention

============================================================

63. SECURITY

============================================================

Never expose:

- service role keys

- database passwords

- payment secret keys

- private API keys

Do not put privileged Supabase keys in frontend code.

Use RLS.

Use Edge Functions/server-side logic for sensitive operations.

Validate important operations on the backend/server side.

============================================================

64. RESPONSIVENESS

============================================================

Desktop:

Follow desktop reference images.

Mobile:

Follow mobile reference images.

Tablet:

Adapt naturally while preserving the design system.

Do NOT simply scale desktop down.

Use appropriate:

- touch targets

- mobile navigation

- drawers

- filters

- sticky actions

- compact cards

- mobile checkout

============================================================

65. PERFORMANCE

============================================================

Use:

- lazy loading

- code splitting where useful

- optimized images

- pagination

- TanStack Query caching

- appropriate Supabase queries

- minimal unnecessary requests

Do not load every product/order/customer at once.

============================================================

66. ACCESSIBILITY

============================================================

Implement reasonable accessibility:

- semantic HTML

- keyboard navigation

- labels

- accessible buttons

- sufficient focus states

- alt text

- accessible dialogs

- reduced motion support

============================================================

67. SEO

============================================================

For the customer website, prepare:

- page titles

- meta descriptions

- Open Graph metadata

- clean URLs

- product-friendly URLs

- category-friendly URLs

The PWA functionality must not interfere with normal website SEO.

============================================================

68. PROJECT STRUCTURE

============================================================

Use a scalable structure similar to:

src/

  components/

  pages/

  layouts/

  routes/

  hooks/

  services/

  lib/

  types/

  utils/

  contexts/

  assets/

supabase/

  migrations/

  functions/

  seed.sql/

docs/

  DATABASE_SCHEMA.md

  API.md

Keep UI, data access, authentication, utilities and business logic separated.

============================================================

69. DATABASE MIGRATIONS

============================================================

Generate actual Supabase migration files.

They should include:

- tables

- enums

- foreign keys

- indexes

- unique constraints

- check constraints

- timestamps

- triggers where appropriate

- RLS

- RLS policies

Make migrations safe and logically ordered.

============================================================

70. SEED DATA

============================================================

Create development seed data for:

- categories

- products

- inventory

- offers

- banners

Clearly identify it as demo/development data.

============================================================

71. DATABASE DOCUMENTATION

============================================================

Create:

docs/DATABASE_SCHEMA.md

Include:

- table descriptions

- columns

- relationships

- indexes

- RLS policies

- roles

- storage buckets

- important business rules

============================================================

72. SUPABASE SETUP DOCUMENTATION

============================================================

Create:

docs/SUPABASE_SETUP.md

Explain step-by-step:

1. Create Supabase project

2. Configure environment variables

3. Run migrations

4. Run seed data

5. Create storage buckets

6. Configure storage policies

7. Configure authentication

8. Configure RLS

9. Deploy Edge Functions

10. Connect the frontend

11. Test authentication

12. Test products

13. Test cart

14. Test checkout

15. Test orders

16. Test admin access

Write this so that a developer can follow it without guessing.

============================================================

73. ENVIRONMENT VARIABLES

============================================================

Create:

.env.example

Include appropriate variables such as:

VITE_SUPABASE_URL=

VITE_SUPABASE_PUBLISHABLE_KEY=

Do NOT include actual secrets.

Clearly explain which variables are public and which must remain server-side.

============================================================

74. MOCK / DEVELOPMENT MODE

============================================================

If Supabase is not yet configured, the UI should still be previewable using safe development/mock data where practical.

However, production mode must use Supabase.

Do not duplicate the entire application to achieve this.

Keep data access abstracted.

============================================================

75. FUTURE EXPANSION

============================================================

The architecture should allow future:

- Android app

- iOS app

- dedicated delivery app

- push notifications

- loyalty points

- advanced analytics

- AI recommendations

- multiple store locations

- warehouse management

Do NOT implement all of these now.

Keep the architecture extensible.

============================================================

76. NATIVE APP FUTURE

============================================================

Eventually I may create Android/iOS apps.

Those applications should be able to use the same Supabase/backend architecture.

Do not place critical business rules only inside the frontend.

============================================================

77. V1 SCOPE

============================================================

This is the first version.

Keep it practical.

DO NOT build:

- separate delivery app

- multi-vendor marketplace

- complex warehouse system

- unnecessary microservices

- AI recommendations

- advanced loyalty system

- complicated real-time infrastructure

The goal is a clean, professional, working first version.

============================================================

78. IMPLEMENTATION ORDER

============================================================

Work in a structured order.

PHASE 1:

1. Analyze every uploaded screenshot.

2. Map each screenshot to its page.

3. Identify shared components.

4. Establish Delight design system.

5. Establish routing.

6. Configure Supabase client.

7. Establish database structure.

8. Establish RLS.

9. Establish Storage.

10. Establish PWA configuration.

PHASE 2:

11. Customer homepage

12. Categories

13. Product listing

14. Product details

15. Search

16. Cart

17. Checkout

18. Authentication

19. Customer account

20. Orders

21. Order tracking

PHASE 3:

22. Admin login

23. Admin dashboard

24. Orders

25. Products

26. Categories

27. Inventory

28. Customers

29. Offers & Coupons

30. Banners & Content

31. Delivery Management

32. Payments

33. Reviews

34. Reports

35. Users & Roles

36. Settings

PHASE 4:

37. Testing

38. Responsive testing

39. PWA testing

40. Authentication testing

41. RLS testing

42. Error handling

43. Performance improvements

44. Final UI comparison against uploaded screenshots

============================================================

79. MOST IMPORTANT VISUAL INSTRUCTION

============================================================

I am providing screenshots that were already designed and approved.

DO NOT interpret them as general inspiration.

Treat them as the exact visual target.

For every page:

1. Inspect the corresponding uploaded screenshot.

2. Recreate the structure.

3. Match visual hierarchy.

4. Match spacing.

5. Match colors.

6. Match typography.

7. Match components.

8. Match responsive behavior.

9. Make it functional.

If a screenshot contains placeholder/example information, treat that information as visual sample data only.

Do not assume it is real business data.

============================================================

80. IMPORTANT BRANDING RULE

============================================================

Use my uploaded Delight Shopping Mart logo.

Do not use any unrelated logo.

Do not use generic ecommerce branding.

The final application should clearly look like:

DELIGHT SHOPPING MART

============================================================

81. FINAL PRODUCT REQUIREMENTS

============================================================

CUSTOMER:

✓ Desktop Website

✓ Responsive Mobile Website

✓ Installable PWA

✓ Homepage

✓ Categories

✓ Products

✓ Product Details

✓ Search

✓ Cart

✓ Checkout

✓ Authentication

✓ Account

✓ Addresses

✓ Orders

✓ Order Tracking

✓ Offers

✓ Reviews

ADMIN:

✓ Dashboard

✓ Orders

✓ Products

✓ Categories

✓ Inventory

✓ Customers

✓ Offers & Coupons

✓ Banners & Content

✓ Delivery Management

✓ Payments

✓ Reviews

✓ Reports

✓ Users & Roles

✓ Settings

SUPABASE:

✓ PostgreSQL

✓ Supabase Auth

✓ Supabase Storage

✓ RLS

✓ Database migrations

✓ Seed data

✓ Edge Functions where necessary

✓ Database documentation

✓ Setup documentation

TECHNICAL:

✓ One frontend codebase

✓ Desktop website

✓ Mobile website

✓ Installable PWA

✓ Supabase backend

✓ PostgreSQL database

✓ Authentication

✓ Role-based access

✓ Storage

✓ RLS

✓ Responsive design

✓ Error handling

✓ Loading states

✓ Form validation

✓ Performance optimization

✓ Accessibility

✓ SEO

✓ Documentation

============================================================

82. DO NOT DO THESE THINGS

============================================================

DO NOT:

✗ Create a separate PWA project

✗ Create a separate website project

✗ Create a separate delivery app for V1

✗ Use Lovable's managed database

✗ Use an unrelated backend

✗ Hardcode production business data

✗ Put secrets in frontend

✗ Put service-role keys in frontend

✗ Connect directly to a database without security

✗ Skip RLS

✗ Create fake payment processing

✗ Claim the entire application works offline

✗ Create a generic ecommerce template

✗ Redesign my uploaded UI

✗ Ignore the uploaded screenshots

✗ Change the Delight branding

✗ Over-engineer V1

============================================================

83. FINAL GOAL

============================================================

I want a REAL, FUNCTIONAL DELIGHT SHOPPING MART E-COMMERCE PLATFORM.

The final product should feel like the same application shown in my uploaded screenshots.

The screenshots are NOT inspiration.

THE UPLOADED SCREENSHOTS ARE THE DESIGN SPECIFICATION.

This project should provide:

ONE CODEBASE

    ↓

DESKTOP WEBSITE

    +

MOBILE WEBSITE

    +

INSTALLABLE PWA

    +

ADMIN DASHBOARD

    ↓

SUPABASE

    ↓

POSTGRESQL + AUTH + STORAGE + RLS

The UI must closely match my uploaded designs.

The application must be functional.

The database must be properly structured.

The Supabase setup must be documented.

The project must be scalable enough for future development without making V1 unnecessarily complicated.

Before implementing the UI, inspect ALL uploaded reference images and map them to the correct pages.

Do not start by creating a generic homepage.

First understand the complete design system and application structure.

============================================================

END OF REQUIREMENTS

============================================================


read and analyze and tell me what you understand and also dont build untill i upload all the images and say go build ..so

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/465adf1a-5ec9-4fcb-9f79-8a7eaba744d2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
