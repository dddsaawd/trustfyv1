export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ad_accounts: {
        Row: {
          account_id: string
          active: boolean
          created_at: string
          currency: string | null
          id: string
          name: string
          payment_status: string | null
          payment_status_detail: string | null
          platform_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          active?: boolean
          created_at?: string
          currency?: string | null
          id?: string
          name: string
          payment_status?: string | null
          payment_status_detail?: string | null
          platform_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          active?: boolean
          created_at?: string
          currency?: string | null
          id?: string
          name?: string
          payment_status?: string | null
          payment_status_detail?: string | null
          platform_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ad_account_id: string | null
          budget_daily: number | null
          clicks: number | null
          conversions: number | null
          cost_per_ic: number | null
          cpa: number | null
          cpc: number | null
          cpm: number | null
          created_at: string
          ctr: number | null
          external_id: string | null
          id: string
          impressions: number | null
          initiate_checkout: number | null
          name: string
          platform: string
          profit: number | null
          revenue: number | null
          roas: number | null
          score: Database["public"]["Enums"]["campaign_score"] | null
          spend: number | null
          status: Database["public"]["Enums"]["campaign_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_account_id?: string | null
          budget_daily?: number | null
          clicks?: number | null
          conversions?: number | null
          cost_per_ic?: number | null
          cpa?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          external_id?: string | null
          id?: string
          impressions?: number | null
          initiate_checkout?: number | null
          name: string
          platform: string
          profit?: number | null
          revenue?: number | null
          roas?: number | null
          score?: Database["public"]["Enums"]["campaign_score"] | null
          spend?: number | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_account_id?: string | null
          budget_daily?: number | null
          clicks?: number | null
          conversions?: number | null
          cost_per_ic?: number | null
          cpa?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          external_id?: string | null
          id?: string
          impressions?: number | null
          initiate_checkout?: number | null
          name?: string
          platform?: string
          profit?: number | null
          revenue?: number | null
          roas?: number | null
          score?: Database["public"]["Enums"]["campaign_score"] | null
          spend?: number | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_settings: {
        Row: {
          antecipation_fee_percent: number
          avg_shipping: number
          boleto_fee: number
          chargeback_rate: number
          created_at: string
          gateway_card_percent: number
          gateway_fee_fixed: number
          gateway_fee_percent: number
          gateway_pix_fixed: number
          gateway_pix_percent: number
          gateway_provider: string | null
          id: string
          marketplace_fee_percent: number
          monthly_fixed_expenses: number
          pix_discount_percent: number
          refund_rate: number
          tax_percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          antecipation_fee_percent?: number
          avg_shipping?: number
          boleto_fee?: number
          chargeback_rate?: number
          created_at?: string
          gateway_card_percent?: number
          gateway_fee_fixed?: number
          gateway_fee_percent?: number
          gateway_pix_fixed?: number
          gateway_pix_percent?: number
          gateway_provider?: string | null
          id?: string
          marketplace_fee_percent?: number
          monthly_fixed_expenses?: number
          pix_discount_percent?: number
          refund_rate?: number
          tax_percent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          antecipation_fee_percent?: number
          avg_shipping?: number
          boleto_fee?: number
          chargeback_rate?: number
          created_at?: string
          gateway_card_percent?: number
          gateway_fee_fixed?: number
          gateway_fee_percent?: number
          gateway_pix_fixed?: number
          gateway_pix_percent?: number
          gateway_provider?: string | null
          id?: string
          marketplace_fee_percent?: number
          monthly_fixed_expenses?: number
          pix_discount_percent?: number
          refund_rate?: number
          tax_percent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_snapshots: {
        Row: {
          ad_spend: number | null
          approval_rate: number | null
          avg_ticket: number | null
          created_at: string
          date: string
          gateway_fees: number | null
          gross_revenue: number | null
          id: string
          margin: number | null
          net_profit: number | null
          net_revenue: number | null
          orders_approved: number | null
          orders_pending: number | null
          orders_refused: number | null
          other_expenses: number | null
          pix_conversion: number | null
          pix_generated: number | null
          pix_paid: number | null
          product_cost: number | null
          roas: number | null
          roi: number | null
          shipping_cost: number | null
          taxes: number | null
          user_id: string
        }
        Insert: {
          ad_spend?: number | null
          approval_rate?: number | null
          avg_ticket?: number | null
          created_at?: string
          date: string
          gateway_fees?: number | null
          gross_revenue?: number | null
          id?: string
          margin?: number | null
          net_profit?: number | null
          net_revenue?: number | null
          orders_approved?: number | null
          orders_pending?: number | null
          orders_refused?: number | null
          other_expenses?: number | null
          pix_conversion?: number | null
          pix_generated?: number | null
          pix_paid?: number | null
          product_cost?: number | null
          roas?: number | null
          roi?: number | null
          shipping_cost?: number | null
          taxes?: number | null
          user_id: string
        }
        Update: {
          ad_spend?: number | null
          approval_rate?: number | null
          avg_ticket?: number | null
          created_at?: string
          date?: string
          gateway_fees?: number | null
          gross_revenue?: number | null
          id?: string
          margin?: number | null
          net_profit?: number | null
          net_revenue?: number | null
          orders_approved?: number | null
          orders_pending?: number | null
          orders_refused?: number | null
          other_expenses?: number | null
          pix_conversion?: number | null
          pix_generated?: number | null
          pix_paid?: number | null
          product_cost?: number | null
          roas?: number | null
          roi?: number | null
          shipping_cost?: number | null
          taxes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          date: string
          description: string
          id: string
          recurring: boolean
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date?: string
          description: string
          id?: string
          recurring?: boolean
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date?: string
          description?: string
          id?: string
          recurring?: boolean
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      installment_rates: {
        Row: {
          created_at: string
          id: string
          installments: number
          rate_percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          installments: number
          rate_percent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          installments?: number
          rate_percent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          last_sync: string | null
          name: string
          platform: string
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          last_sync?: string | null
          name: string
          platform: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          last_sync?: string | null
          name?: string
          platform?: string
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          ads_cost_attributed: number | null
          campaign_name: string | null
          city: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          gateway_fee: number | null
          gross_value: number
          id: string
          installments: number | null
          net_profit: number | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          platform: string | null
          product_cost: number | null
          product_id: string | null
          product_name: string
          shipping_cost: number | null
          state: string | null
          tax: number | null
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          ads_cost_attributed?: number | null
          campaign_name?: string | null
          city?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          gateway_fee?: number | null
          gross_value?: number
          id?: string
          installments?: number | null
          net_profit?: number | null
          order_number: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          platform?: string | null
          product_cost?: number | null
          product_id?: string | null
          product_name: string
          shipping_cost?: number | null
          state?: string | null
          tax?: number | null
          updated_at?: string
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          ads_cost_attributed?: number | null
          campaign_name?: string | null
          city?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          gateway_fee?: number | null
          gross_value?: number
          id?: string
          installments?: number | null
          net_profit?: number | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          platform?: string | null
          product_cost?: number | null
          product_id?: string | null
          product_name?: string
          shipping_cost?: number | null
          state?: string | null
          tax?: number | null
          updated_at?: string
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_pending: {
        Row: {
          campaign_name: string | null
          created_at: string
          customer_name: string
          customer_phone: string | null
          generated_at: string
          id: string
          minutes_open: number | null
          order_id: string
          product_name: string
          status: Database["public"]["Enums"]["pix_status"]
          updated_at: string
          user_id: string
          utm_source: string | null
          value: number
        }
        Insert: {
          campaign_name?: string | null
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          generated_at?: string
          id?: string
          minutes_open?: number | null
          order_id: string
          product_name: string
          status?: Database["public"]["Enums"]["pix_status"]
          updated_at?: string
          user_id: string
          utm_source?: string | null
          value?: number
        }
        Update: {
          campaign_name?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          generated_at?: string
          id?: string
          minutes_open?: number | null
          order_id?: string
          product_name?: string
          status?: Database["public"]["Enums"]["pix_status"]
          updated_at?: string
          user_id?: string
          utm_source?: string | null
          value?: number
        }
        Relationships: []
      }
      platforms: {
        Row: {
          color: string
          created_at: string
          id: string
          label: string
          name: Database["public"]["Enums"]["platform_name"]
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          label: string
          name: Database["public"]["Enums"]["platform_name"]
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          label?: string
          name?: Database["public"]["Enums"]["platform_name"]
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          cost: number
          created_at: string
          id: string
          image_url: string | null
          name: string
          price: number
          sku: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          cost?: number
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price?: number
          sku?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          cost?: number
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sku?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved: boolean
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recoveries: {
        Row: {
          channel: Database["public"]["Enums"]["recovery_channel"]
          converted: boolean
          converted_at: string | null
          created_at: string
          id: string
          pix_id: string | null
          sent_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          channel: Database["public"]["Enums"]["recovery_channel"]
          converted?: boolean
          converted_at?: string | null
          created_at?: string
          id?: string
          pix_id?: string | null
          sent_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["recovery_channel"]
          converted?: boolean
          converted_at?: string | null
          created_at?: string
          id?: string
          pix_id?: string | null
          sent_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recoveries_pix_id_fkey"
            columns: ["pix_id"]
            isOneToOne: false
            referencedRelation: "pix_pending"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          active: boolean
          created_at: string
          device_token: string
          id: string
          platform: Database["public"]["Enums"]["device_platform"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          device_token: string
          id?: string
          platform: Database["public"]["Enums"]["device_platform"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          device_token?: string
          id?: string
          platform?: Database["public"]["Enums"]["device_platform"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      utm_events: {
        Row: {
          campaign: string | null
          checkouts: number | null
          content: string | null
          created_at: string
          date: string
          id: string
          profit: number | null
          revenue: number | null
          roas: number | null
          sales: number | null
          source: string | null
          term: string | null
          user_id: string
          visits: number | null
        }
        Insert: {
          campaign?: string | null
          checkouts?: number | null
          content?: string | null
          created_at?: string
          date?: string
          id?: string
          profit?: number | null
          revenue?: number | null
          roas?: number | null
          sales?: number | null
          source?: string | null
          term?: string | null
          user_id: string
          visits?: number | null
        }
        Update: {
          campaign?: string | null
          checkouts?: number | null
          content?: string | null
          created_at?: string
          date?: string
          id?: string
          profit?: number | null
          revenue?: number | null
          roas?: number | null
          sales?: number | null
          source?: string | null
          term?: string | null
          user_id?: string
          visits?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      campaign_score: "scale" | "watch" | "cut"
      campaign_status: "active" | "paused" | "ended"
      device_platform: "ios" | "android" | "web"
      expense_category:
        | "ads"
        | "product"
        | "shipping"
        | "gateway"
        | "tax"
        | "tools"
        | "team"
        | "other"
      integration_status: "connected" | "disconnected" | "error"
      notification_type:
        | "sale"
        | "pix_generated"
        | "pix_paid"
        | "goal_reached"
        | "roas_drop"
        | "cpa_spike"
        | "negative_campaign"
        | "chargeback"
        | "daily_summary"
      payment_method: "pix" | "credit_card" | "boleto" | "debit"
      payment_status:
        | "approved"
        | "pending"
        | "refused"
        | "refunded"
        | "chargeback"
      pix_status: "pending" | "paid" | "expired" | "abandoned"
      platform_name: "meta" | "google" | "tiktok" | "kwai" | "organic"
      recovery_channel: "whatsapp" | "push" | "email" | "sms"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      campaign_score: ["scale", "watch", "cut"],
      campaign_status: ["active", "paused", "ended"],
      device_platform: ["ios", "android", "web"],
      expense_category: [
        "ads",
        "product",
        "shipping",
        "gateway",
        "tax",
        "tools",
        "team",
        "other",
      ],
      integration_status: ["connected", "disconnected", "error"],
      notification_type: [
        "sale",
        "pix_generated",
        "pix_paid",
        "goal_reached",
        "roas_drop",
        "cpa_spike",
        "negative_campaign",
        "chargeback",
        "daily_summary",
      ],
      payment_method: ["pix", "credit_card", "boleto", "debit"],
      payment_status: [
        "approved",
        "pending",
        "refused",
        "refunded",
        "chargeback",
      ],
      pix_status: ["pending", "paid", "expired", "abandoned"],
      platform_name: ["meta", "google", "tiktok", "kwai", "organic"],
      recovery_channel: ["whatsapp", "push", "email", "sms"],
    },
  },
} as const
