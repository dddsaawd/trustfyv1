// TRUSTFY — Database Types (derived from Supabase schema)
import type { Database } from '@/integrations/supabase/types';

// Row types from Supabase
export type Product = Database['public']['Tables']['products']['Row'];
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type PixPending = Database['public']['Tables']['pix_pending']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Integration = Database['public']['Tables']['integrations']['Row'];
export type DailySnapshot = Database['public']['Tables']['daily_snapshots']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type Recovery = Database['public']['Tables']['recoveries']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Platform = Database['public']['Tables']['platforms']['Row'];
export type AdAccount = Database['public']['Tables']['ad_accounts']['Row'];
export type UtmEvent = Database['public']['Tables']['utm_events']['Row'];
export type UserDevice = Database['public']['Tables']['user_devices']['Row'];

// Enums
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];
export type CampaignScore = Database['public']['Enums']['campaign_score'];
export type CampaignStatus = Database['public']['Enums']['campaign_status'];
export type PixStatus = Database['public']['Enums']['pix_status'];
export type RecoveryChannel = Database['public']['Enums']['recovery_channel'];
export type ExpenseCategory = Database['public']['Enums']['expense_category'];
export type IntegrationStatus = Database['public']['Enums']['integration_status'];
export type NotificationType = Database['public']['Enums']['notification_type'];
export type PlatformName = Database['public']['Enums']['platform_name'];

// UI-only types (not in DB)
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
