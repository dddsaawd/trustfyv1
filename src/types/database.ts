// TRUSTFY — Database Types (prepared for Supabase)

export interface Product {
  id: string;
  name: string;
  sku: string;
  cost: number;
  price: number;
  image_url?: string;
  active: boolean;
  created_at: string;
}

export interface Platform {
  id: string;
  name: 'meta' | 'google' | 'tiktok' | 'kwai' | 'organic';
  label: string;
  color: string;
}

export interface AdAccount {
  id: string;
  platform_id: string;
  name: string;
  account_id: string;
  active: boolean;
}

export interface Campaign {
  id: string;
  ad_account_id: string;
  platform: string;
  name: string;
  status: 'active' | 'paused' | 'ended';
  budget_daily: number;
  spend: number;
  impressions: number;
  clicks: number;
  cpm: number;
  ctr: number;
  cpc: number;
  cpa: number;
  conversions: number;
  revenue: number;
  profit: number;
  roas: number;
  score: 'scale' | 'watch' | 'cut';
}

export interface Order {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  product_id: string;
  product_name: string;
  platform: string;
  campaign_name: string;
  utm_source: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  gross_value: number;
  product_cost: number;
  gateway_fee: number;
  ads_cost_attributed: number;
  shipping_cost: number;
  tax: number;
  net_profit: number;
  payment_status: 'approved' | 'pending' | 'refused' | 'refunded' | 'chargeback';
  payment_method: 'pix' | 'credit_card' | 'boleto' | 'debit';
  state: string;
  city: string;
}

export interface PixPending {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  value: number;
  generated_at: string;
  minutes_open: number;
  campaign_name: string;
  utm_source: string;
  status: 'pending' | 'paid' | 'expired' | 'abandoned';
}

export interface Recovery {
  id: string;
  pix_id: string;
  channel: 'whatsapp' | 'push' | 'email' | 'sms';
  sent_at: string;
  converted: boolean;
  converted_at?: string;
  value: number;
}

export interface Expense {
  id: string;
  category: 'ads' | 'product' | 'shipping' | 'gateway' | 'tax' | 'tools' | 'team' | 'other';
  description: string;
  value: number;
  date: string;
  recurring: boolean;
}

export interface Notification {
  id: string;
  type: 'sale' | 'pix_generated' | 'pix_paid' | 'goal_reached' | 'roas_drop' | 'cpa_spike' | 'negative_campaign' | 'chargeback' | 'daily_summary';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

export interface Integration {
  id: string;
  name: string;
  platform: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  description: string;
  last_sync?: string;
}

export interface DailySnapshot {
  date: string;
  gross_revenue: number;
  net_revenue: number;
  ad_spend: number;
  product_cost: number;
  shipping_cost: number;
  gateway_fees: number;
  taxes: number;
  other_expenses: number;
  net_profit: number;
  margin: number;
  orders_approved: number;
  orders_pending: number;
  orders_refused: number;
  avg_ticket: number;
  roas: number;
  roi: number;
  approval_rate: number;
  pix_generated: number;
  pix_paid: number;
  pix_conversion: number;
}

export interface KPIData {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  prefix?: string;
  suffix?: string;
  tooltip: string;
}

export interface HourlyData {
  hour: string;
  revenue: number;
  profit: number;
  adSpend: number;
  roas: number;
}

export interface UTMData {
  source: string;
  campaign: string;
  content: string;
  term: string;
  visits: number;
  checkouts: number;
  sales: number;
  revenue: number;
  profit: number;
  roas: number;
}
