
-- TRUSTFY — Complete Database Schema

-- 1. All enum types including app_role
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.payment_status AS ENUM ('approved', 'pending', 'refused', 'refunded', 'chargeback');
CREATE TYPE public.payment_method AS ENUM ('pix', 'credit_card', 'boleto', 'debit');
CREATE TYPE public.campaign_score AS ENUM ('scale', 'watch', 'cut');
CREATE TYPE public.campaign_status AS ENUM ('active', 'paused', 'ended');
CREATE TYPE public.pix_status AS ENUM ('pending', 'paid', 'expired', 'abandoned');
CREATE TYPE public.recovery_channel AS ENUM ('whatsapp', 'push', 'email', 'sms');
CREATE TYPE public.expense_category AS ENUM ('ads', 'product', 'shipping', 'gateway', 'tax', 'tools', 'team', 'other');
CREATE TYPE public.integration_status AS ENUM ('connected', 'disconnected', 'error');
CREATE TYPE public.notification_type AS ENUM ('sale', 'pix_generated', 'pix_paid', 'goal_reached', 'roas_drop', 'cpa_spike', 'negative_campaign', 'chargeback', 'daily_summary');
CREATE TYPE public.platform_name AS ENUM ('meta', 'google', 'tiktok', 'kwai', 'organic');
CREATE TYPE public.device_platform AS ENUM ('ios', 'android', 'web');

-- 2. Utility function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. User roles table FIRST
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- 4. has_role function AFTER user_roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. User devices
CREATE TABLE public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform device_platform NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own devices" ON public.user_devices FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_user_devices_updated_at BEFORE UPDATE ON public.user_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own products" ON public.products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Platforms
CREATE TABLE public.platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name platform_name NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own platforms" ON public.platforms FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. Ad accounts
CREATE TABLE public.ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id UUID REFERENCES public.platforms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ad accounts" ON public.ad_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_ad_accounts_updated_at BEFORE UPDATE ON public.ad_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Campaigns
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_account_id UUID REFERENCES public.ad_accounts(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  name TEXT NOT NULL,
  status campaign_status NOT NULL DEFAULT 'active',
  budget_daily NUMERIC(12,2) DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  cpm NUMERIC(10,2) DEFAULT 0,
  ctr NUMERIC(6,2) DEFAULT 0,
  cpc NUMERIC(10,2) DEFAULT 0,
  cpa NUMERIC(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  profit NUMERIC(12,2) DEFAULT 0,
  roas NUMERIC(8,2) DEFAULT 0,
  score campaign_score DEFAULT 'watch',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own campaigns" ON public.campaigns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  platform TEXT,
  campaign_name TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  gross_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  product_cost NUMERIC(12,2) DEFAULT 0,
  gateway_fee NUMERIC(12,2) DEFAULT 0,
  ads_cost_attributed NUMERIC(12,2) DEFAULT 0,
  shipping_cost NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  net_profit NUMERIC(12,2) DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_method payment_method NOT NULL DEFAULT 'pix',
  state TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own orders" ON public.orders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Pix pending
CREATE TABLE public.pix_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  product_name TEXT NOT NULL,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  minutes_open INTEGER DEFAULT 0,
  campaign_name TEXT,
  utm_source TEXT,
  status pix_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pix_pending ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pix" ON public.pix_pending FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_pix_pending_updated_at BEFORE UPDATE ON public.pix_pending FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Recoveries
CREATE TABLE public.recoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pix_id UUID REFERENCES public.pix_pending(id) ON DELETE SET NULL,
  channel recovery_channel NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted BOOLEAN NOT NULL DEFAULT false,
  converted_at TIMESTAMPTZ,
  value NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recoveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recoveries" ON public.recoveries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 14. Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category expense_category NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 16. Integrations
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  icon TEXT,
  status integration_status NOT NULL DEFAULT 'disconnected',
  description TEXT,
  last_sync TIMESTAMPTZ,
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own integrations" ON public.integrations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 17. Daily snapshots
CREATE TABLE public.daily_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  gross_revenue NUMERIC(12,2) DEFAULT 0,
  net_revenue NUMERIC(12,2) DEFAULT 0,
  ad_spend NUMERIC(12,2) DEFAULT 0,
  product_cost NUMERIC(12,2) DEFAULT 0,
  shipping_cost NUMERIC(12,2) DEFAULT 0,
  gateway_fees NUMERIC(12,2) DEFAULT 0,
  taxes NUMERIC(12,2) DEFAULT 0,
  other_expenses NUMERIC(12,2) DEFAULT 0,
  net_profit NUMERIC(12,2) DEFAULT 0,
  margin NUMERIC(6,2) DEFAULT 0,
  orders_approved INTEGER DEFAULT 0,
  orders_pending INTEGER DEFAULT 0,
  orders_refused INTEGER DEFAULT 0,
  avg_ticket NUMERIC(10,2) DEFAULT 0,
  roas NUMERIC(8,2) DEFAULT 0,
  roi NUMERIC(8,2) DEFAULT 0,
  approval_rate NUMERIC(6,2) DEFAULT 0,
  pix_generated INTEGER DEFAULT 0,
  pix_paid INTEGER DEFAULT 0,
  pix_conversion NUMERIC(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.daily_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own snapshots" ON public.daily_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 18. UTM events
CREATE TABLE public.utm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT,
  campaign TEXT,
  content TEXT,
  term TEXT,
  visits INTEGER DEFAULT 0,
  checkouts INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  profit NUMERIC(12,2) DEFAULT 0,
  roas NUMERIC(8,2) DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, source, campaign, content, term, date)
);
ALTER TABLE public.utm_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own utm events" ON public.utm_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 19. Indexes
CREATE INDEX idx_orders_user_created ON public.orders(user_id, created_at DESC);
CREATE INDEX idx_orders_payment_status ON public.orders(user_id, payment_status);
CREATE INDEX idx_campaigns_user ON public.campaigns(user_id, status);
CREATE INDEX idx_pix_pending_user_status ON public.pix_pending(user_id, status);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX idx_daily_snapshots_user_date ON public.daily_snapshots(user_id, date DESC);
CREATE INDEX idx_utm_events_user_date ON public.utm_events(user_id, date DESC);
CREATE INDEX idx_expenses_user_date ON public.expenses(user_id, date DESC);

-- 20. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
