
-- Fix Corvex orders: orders with gross_value > base product price are card payments (with installment interest)
-- KIT CHURRASCO GIRATÓRIO base price = 193.90
-- KIT COMPLETO + 6 CANECAS DE PEDRA base price = 229.90

UPDATE orders
SET payment_method = 'credit_card'
WHERE platform = 'corvex'
  AND payment_method = 'pix'
  AND (
    (product_name = 'KIT CHURRASCO GIRATÓRIO' AND gross_value > 193.90)
    OR (product_name = 'KIT COMPLETO + 6 CANECAS DE PEDRA' AND gross_value > 229.90)
  );
