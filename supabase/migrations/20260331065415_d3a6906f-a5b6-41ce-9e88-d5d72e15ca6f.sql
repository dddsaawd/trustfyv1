
-- Revert: can't distinguish pix from card by amount alone (both include shipping)
UPDATE orders
SET payment_method = 'pix'
WHERE platform = 'corvex'
  AND payment_method = 'credit_card';
