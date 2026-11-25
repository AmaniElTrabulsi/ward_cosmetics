# Ward Cosmetics

Complete Next.js application source for the Ward Cosmetics store and staff workspace.

## Replace your project

1. Stop the old development server.
2. Keep a backup of your existing folder just in case.
3. Extract this ZIP. The extracted `ward_cosmetics` folder is the new project root.
4. Copy your existing `.env.local` into that root. Do not rename the variables.
5. Open a terminal in the new folder and run:

```bash
npm install
npm run dev
```

For a production check, run `npm run build`.

## Included

- Customer storefront and checkout
- Staff login using the existing Ward username/password RPC
- Staff workspace, orders, products, POS and barcode scanner
- Admin dashboard, employee management and reports
- API routes and shared product/order management
- Supabase client and session helper
- POS migration and order update SQL

## Environment

The only required environment values are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, in `.env.local`.

## Database

The application expects your existing Ward Cosmetics tables and RPCs, including `ward_login`, `ward_get_session`, `ward_order_update`, `ward_product_upsert`, and `create_cosmetics_order`. The `supabase/` folder contains the supplied order-update and POS SQL scripts. Do not run migrations blindly against a production database; review the SQL and take a database backup first.
