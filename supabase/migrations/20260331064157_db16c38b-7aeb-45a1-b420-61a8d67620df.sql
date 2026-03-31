
-- Installment rates per user
CREATE TABLE public.installment_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  installments integer NOT NULL,
  rate_percent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, installments)
);

ALTER TABLE public.installment_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own installment rates"
  ON public.installment_rates FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add installments column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS installments integer DEFAULT 1;
