CREATE TABLE public.cost_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gateway_fee_percent numeric NOT NULL DEFAULT 4.99,
  gateway_fee_fixed numeric NOT NULL DEFAULT 0,
  avg_shipping numeric NOT NULL DEFAULT 12.00,
  tax_percent numeric NOT NULL DEFAULT 5.00,
  monthly_fixed_expenses numeric NOT NULL DEFAULT 530.00,
  chargeback_rate numeric NOT NULL DEFAULT 0,
  refund_rate numeric NOT NULL DEFAULT 0,
  marketplace_fee_percent numeric NOT NULL DEFAULT 0,
  pix_discount_percent numeric NOT NULL DEFAULT 0,
  boleto_fee numeric NOT NULL DEFAULT 3.49,
  antecipation_fee_percent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.cost_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cost settings" ON public.cost_settings
  FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_cost_settings_updated_at
  BEFORE UPDATE ON public.cost_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();