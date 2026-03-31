
-- Fix orders wrongly classified as credit_card that are actually Pix with shipping
-- Known shipping values: R$ 0.00 (Frete Grátis), R$ 9.22 (Sedex), R$ 19.15 (Frete Full)

-- Step 1: Update orders where diff matches known shipping values back to 'pix'
-- and set correct shipping_cost and recalculate gateway_fee with pix rates (6.99% + R$1.99)
UPDATE orders o
SET 
  payment_method = 'pix',
  shipping_cost = ROUND((o.gross_value - p.price)::numeric, 2),
  installments = NULL,
  gateway_fee = ROUND((o.gross_value * 0.0699 + 1.99)::numeric, 2),
  net_profit = o.gross_value 
    - COALESCE(o.product_cost, 0) 
    - ROUND((o.gross_value - p.price)::numeric, 2)
    - ROUND((o.gross_value * 0.0699 + 1.99)::numeric, 2)
    - COALESCE(o.tax, 0)
    - COALESCE(o.ads_cost_attributed, 0)
FROM products p
WHERE o.platform = 'corvex'
  AND o.payment_method = 'credit_card'
  AND p.name = o.product_name
  AND ROUND((o.gross_value - p.price)::numeric, 2) IN (0.00, 9.22, 19.15);
