
-- Fix Corvex orders that came as 'card' but were saved as 'pix'
-- Criteria: gross_value higher than base product price indicates card payment with interest
UPDATE orders
SET payment_method = 'credit_card',
    updated_at = now()
WHERE platform = 'corvex'
  AND payment_method = 'pix'
  AND (
    (product_name ILIKE '%KIT CHURRASCO%' AND gross_value > 193.90)
    OR (product_name ILIKE '%CANECAS%' AND gross_value > 229.90)
  );
