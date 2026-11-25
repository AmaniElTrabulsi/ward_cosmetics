-- WARD COSMETICS POS TABLES + CHECKOUT RPC
-- Additive migration: does not modify online orders or historical sales.
create table if not exists public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null unique default ('POS-' || to_char(now(),'YYMMDD-HH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
  total numeric(12,2) not null default 0 check (total >= 0),
  payment_method text not null default 'cash',
  cashier_id uuid,
  cashier_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.pos_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  brand text not null default '',
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0)
);

create index if not exists pos_sales_created_at_idx on public.pos_sales(created_at desc);
create index if not exists pos_sale_items_sale_id_idx on public.pos_sale_items(sale_id);
alter table public.pos_sales enable row level security;
alter table public.pos_sale_items enable row level security;

create or replace function public.ward_pos_checkout(
  p_token_hash text,
  p_items jsonb,
  p_payment_method text default 'cash'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  s record;
  cashier record;
  item jsonb;
  product_row public.products%rowtype;
  qty integer;
  sale_id uuid;
  sale_number text;
  sale_total numeric(12,2) := 0;
  line_total numeric(12,2);
begin
  select * into s from public.ward_sessions
  where token_hash = p_token_hash and expires_at > now()
  limit 1;
  if s.id is null then raise exception 'Your staff session has expired. Please sign in again.'; end if;

  if s.account_type = 'admin' then
    select id, name, active into cashier from public.admins where id = s.account_id;
  elsif s.account_type = 'employee' then
    select id, name, active into cashier from public.employees where id = s.account_id;
  else
    raise exception 'Not authorized';
  end if;
  if cashier.id is null or not cashier.active then raise exception 'Staff account is inactive.'; end if;
  if p_payment_method not in ('cash','card','whish','other') then raise exception 'Invalid payment method.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Add at least one product.'; end if;

  -- Validate and lock every product before creating the sale.
  for item in select value from jsonb_array_elements(p_items)
  loop
    qty := (item->>'quantity')::integer;
    if qty is null or qty < 1 then raise exception 'Invalid item quantity.'; end if;
    select * into product_row from public.products
      where id = (item->>'product_id')::uuid for update;
    if product_row.id is null then raise exception 'A product in this sale no longer exists.'; end if;
    if product_row.stock_quantity is not null and product_row.stock_quantity < qty then
      raise exception 'Not enough stock for % (available: %).', product_row.name, product_row.stock_quantity;
    end if;
    sale_total := sale_total + (product_row.price * qty);
  end loop;

  insert into public.pos_sales(total,payment_method,cashier_id,cashier_name)
  values(sale_total,p_payment_method,cashier.id,cashier.name)
  returning id, pos_sales.sale_number into sale_id, sale_number;

  for item in select value from jsonb_array_elements(p_items)
  loop
    qty := (item->>'quantity')::integer;
    select * into product_row from public.products
      where id = (item->>'product_id')::uuid for update;
    line_total := product_row.price * qty;
    insert into public.pos_sale_items(sale_id,product_id,product_name,brand,quantity,unit_price,line_total)
    values(sale_id,product_row.id,product_row.name,coalesce(product_row.brand,''),qty,product_row.price,line_total);
    if product_row.stock_quantity is not null then
      update public.products set stock_quantity = stock_quantity - qty where id = product_row.id;
    end if;
  end loop;

  return jsonb_build_object('success',true,'sale_id',sale_id,'sale_number',sale_number,'total',sale_total);
end;
$$;

-- Prevent deleting products already used by a POS receipt.
create or replace function public.ward_product_delete(p_token_hash text,p_product_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if not public.ward_is_staff(p_token_hash) then raise exception 'Not authorized'; end if;
 if exists(select 1 from public.order_items where product_id=p_product_id)
 or exists(select 1 from public.sale_items where product_id=p_product_id)
 or exists(select 1 from public.pos_sale_items where product_id=p_product_id) then
  return jsonb_build_object('success',false,'message','This product is referenced by an order or sale. Set its stock to zero instead of deleting it.');
 end if;
 delete from public.products where id=p_product_id;
 return jsonb_build_object('success',true);
end $$;

revoke all on function public.ward_pos_checkout(text,jsonb,text) from public;
grant execute on function public.ward_pos_checkout(text,jsonb,text) to anon,authenticated;


-- Secure dashboard reader: the app passes its custom staff-session token hash.
-- This avoids granting public read access to the POS tables.
create or replace function public.ward_pos_dashboard(
  p_token_hash text,
  p_from timestamptz,
  p_to timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare result jsonb;
begin
  if not public.ward_is_staff(p_token_hash) then
    raise exception 'Not authorized';
  end if;
  select jsonb_build_object(
    'count', (select count(*) from public.pos_sales where created_at >= p_from and created_at < p_to),
    'sales', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'sale_number', s.sale_number,
        'total', s.total,
        'payment_method', s.payment_method,
        'cashier_name', s.cashier_name,
        'created_at', s.created_at,
        'pos_sale_items', coalesce((
          select jsonb_agg(jsonb_build_object(
            'product_name', i.product_name,
            'quantity', i.quantity,
            'line_total', i.line_total
          )) from public.pos_sale_items i where i.sale_id = s.id
        ), '[]'::jsonb)
      ) order by s.created_at desc)
      from (select * from public.pos_sales where created_at >= p_from and created_at < p_to order by created_at desc limit 300) s
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

revoke all on function public.ward_pos_dashboard(text,timestamptz,timestamptz) from public;
grant execute on function public.ward_pos_dashboard(text,timestamptz,timestamptz) to anon,authenticated;

notify pgrst, 'reload schema';
