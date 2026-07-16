
-- 1. External ID for orders (idempotency across event types)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS external_id text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_user_external_id_unique
  ON public.orders(user_id, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_external_id ON public.orders(external_id) WHERE external_id IS NOT NULL;

-- 2. Webhook failures (dead-letter queue)
CREATE TABLE IF NOT EXISTS public.webhook_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL,
  event_type text,
  external_id text,
  error_message text NOT NULL,
  error_stack text,
  raw_payload jsonb NOT NULL,
  normalized_payload jsonb,
  status text NOT NULL DEFAULT 'pending',
  retry_count integer NOT NULL DEFAULT 0,
  last_retry_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_failures TO authenticated;
GRANT ALL ON public.webhook_failures TO service_role;

ALTER TABLE public.webhook_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own webhook failures"
  ON public.webhook_failures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own webhook failures"
  ON public.webhook_failures FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own webhook failures"
  ON public.webhook_failures FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages webhook failures"
  ON public.webhook_failures FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_webhook_failures_user_status ON public.webhook_failures(user_id, status, created_at DESC);

CREATE TRIGGER update_webhook_failures_updated_at
  BEFORE UPDATE ON public.webhook_failures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
