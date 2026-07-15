
-- Deduplicate: keep the earliest row per (user_id, order_number)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, order_number
    ORDER BY created_at ASC, id ASC
  ) AS rn
  FROM public.orders
  WHERE order_number IS NOT NULL
)
DELETE FROM public.orders o
USING ranked r
WHERE o.id = r.id AND r.rn > 1;

-- Prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS orders_user_order_number_unique
  ON public.orders (user_id, order_number);
