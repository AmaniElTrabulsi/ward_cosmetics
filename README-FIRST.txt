WARD COSMETICS — MOBILE + DASHBOARD + POS UPDATE

WHAT IS INCLUDED
- Shop product catalogue uses two columns on phones, with square product photos.
- The shop has a maximum-price filter only; the minimum-price filter is removed.
- Mobile-friendly layouts for staff pages, product management, dashboards and POS.
- Employee login lands on /app (the employee dashboard), not the product editor.
- /app/products and /app/orders are real routes (the previous route mismatch caused 404s).
- Admin dashboard is at /admin and is protected so employees cannot open it.
- Cashier POS at /app/pos supports camera barcode scanning, keyboard/USB scanner input, product search, cart quantities, totals, payment method and completing a sale.
- Product management keeps the working barcode scanner, live photo camera and choose-from-gallery controls from the supplied working file.
- POS checkout records a receipt and deducts stock atomically in Supabase.

INSTALL / UPDATE
1. Keep your existing .env.local exactly as it is. Do not replace it.
2. Copy the included app/ and supabase/ folders into your project, replacing files when asked.
3. Merge the included package.json dependency if you already have a customized package.json. The required scanner package is @zxing/browser.
4. In the project terminal run:
     npm install
5. In Supabase SQL Editor, run the included supabase/setup.sql. It is additive: the POS uses new pos_sales and pos_sale_items tables and does not delete existing orders or products.
6. Ensure the existing Supabase Storage bucket named product-images is public and writable by the client upload policy used by your project. The product photo feature continues to upload there.
7. Start the app:
     npm run dev

ROUTES
Public shop:       /shop
Staff login:       /login
Employee home:     /app
Products:          /app/products
Orders:            /app/orders
Cashier POS:       /app/pos
Admin dashboard:   /admin
Admin products:    /admin/products
Admin orders:      /admin/orders
Admin employees:   /admin/employees
Admin reports:     /admin/reports

IMPORTANT
- The admin account must already exist in public.admins and the employee accounts in public.employees, with password_hash configured using the existing setup instructions.
- The SQL migration adds POS tables and the ward_pos_checkout RPC. Do not remove your existing database tables.
- No .env.local file is included or changed.
