-- Verify a staff session using the existing Ward session/account tables.
CREATE OR REPLACE FUNCTION public.ward_is_staff(p_token_hash text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ward_sessions s
    WHERE s.token_hash = p_token_hash
      AND s.expires_at > now()
      AND (
        (s.account_type = 'admin' AND EXISTS (
          SELECT 1 FROM public.admins a
          WHERE a.id = s.account_id AND a.active IS TRUE
        ))
        OR
        (s.account_type = 'employee' AND EXISTS (
          SELECT 1 FROM public.employees e
          WHERE e.id = s.account_id AND e.active IS TRUE
        ))
      )
  );
$$;
GRANT EXECUTE ON FUNCTION public.ward_is_staff(text) TO anon, authenticated;

-- Run this in Supabase SQL Editor to replace the old RPC argument order.
-- New signature: (p_order_id uuid, p_order_status text,
--                p_payment_status text, p_token_hash text)

DROP FUNCTION IF EXISTS public.ward_order_update(text, uuid, text, text);
DROP FUNCTION IF EXISTS public.ward_order_update(uuid, text, text, text);

CREATE FUNCTION public.ward_order_update(
  p_order_id uuid,
  p_order_status text,
  p_payment_status text,
  p_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  IF NOT public.ward_is_staff(p_token_hash) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_order_status IS NOT NULL AND p_order_status NOT IN (
    'new', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
  ) THEN
    RAISE EXCEPTION 'Invalid order status';
  END IF;

  UPDATE public.orders
  SET order_status = COALESCE(p_order_status, order_status),
      payment_status = COALESCE(p_payment_status, payment_status)
  WHERE id = p_order_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN jsonb_build_object('success', updated_count = 1);
END;
$$;

REVOKE ALL ON FUNCTION public.ward_order_update(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ward_order_update(uuid, text, text, text) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
