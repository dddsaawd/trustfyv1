import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { KPIData } from '@/types/database';

interface DashboardData {
  kpis: KPIData[];
  warModeKPIs: { label: string; value: string; change: number }[];
  recentOrders: any[];
  isLoading: boolean;
  hasRealData: boolean;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function useDashboardData(): DashboardData {
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['dashboard-orders'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000, // 30s realtime
  });

  const { data: costSettings, isLoading: loadingCosts } = useQuery({
    queryKey: ['dashboard-cost-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['dashboard-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('spend')
        .eq('status', 'active');
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60000,
  });

  const { data: pixPending } = useQuery({
    queryKey: ['dashboard-pix-pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pix_pending')
        .select('value')
        .eq('status', 'pending');
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const isLoading = loadingOrders || loadingCosts || loadingCampaigns;
  const hasRealData = !!(orders && orders.length > 0);

  if (!hasRealData || !orders) {
    return {
      kpis: [],
      warModeKPIs: [],
      recentOrders: [],
      isLoading,
      hasRealData: false,
    };
  }

  // Calculate KPIs from real orders
  const approved = orders.filter(o => o.payment_status === 'approved');
  const pending = orders.filter(o => o.payment_status === 'pending');
  const refused = orders.filter(o => o.payment_status === 'refused');
  const refunded = orders.filter(o => o.payment_status === 'refunded');
  const chargebacks = orders.filter(o => o.payment_status === 'chargeback');

  const grossRevenue = orders.reduce((s, o) => s + (o.gross_value || 0), 0);
  const netRevenue = approved.reduce((s, o) => s + (o.gross_value || 0), 0)
    - refunded.reduce((s, o) => s + (o.gross_value || 0), 0)
    - chargebacks.reduce((s, o) => s + (o.gross_value || 0), 0);

  const totalAdSpend = campaigns?.reduce((s, c) => s + (c.spend || 0), 0) ?? 0;

  const cs = costSettings;

  // Apply cost_settings for precise profit calculation
  const totalProductCost = approved.reduce((s, o) => s + (o.product_cost || 0), 0);
  const totalGatewayFee = approved.reduce((s, o) => {
    if (o.gateway_fee && o.gateway_fee > 0) return s + o.gateway_fee;
    // Fallback to cost_settings
    if (cs) {
      return s + ((o.gross_value * cs.gateway_fee_percent / 100) + cs.gateway_fee_fixed);
    }
    return s;
  }, 0);
  const totalShipping = approved.reduce((s, o) => {
    if (o.shipping_cost && o.shipping_cost > 0) return s + o.shipping_cost;
    return s + (cs?.avg_shipping ?? 0);
  }, 0);
  const totalTax = approved.reduce((s, o) => {
    if (o.tax && o.tax > 0) return s + o.tax;
    if (cs) return s + (o.gross_value * cs.tax_percent / 100);
    return s;
  }, 0);

  const netProfit = netRevenue - totalProductCost - totalGatewayFee - totalShipping - totalTax - totalAdSpend;

  const roas = totalAdSpend > 0 ? grossRevenue / totalAdSpend : 0;
  const totalCost = totalProductCost + totalGatewayFee + totalShipping + totalTax + totalAdSpend;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const margin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;
  const avgTicket = approved.length > 0 ? netRevenue / approved.length : 0;
  const approvalRate = orders.length > 0 ? (approved.length / orders.length) * 100 : 0;

  const pixPendingTotal = pixPending?.reduce((s, p) => s + (p.value || 0), 0) ?? 0;

  const kpis: KPIData[] = [
    { label: 'Faturamento Bruto', value: `R$ ${fmt(grossRevenue)}`, change: 0, changeLabel: 'hoje', tooltip: 'Total de vendas brutas do dia' },
    { label: 'Faturamento Líquido', value: `R$ ${fmt(netRevenue)}`, change: 0, changeLabel: 'hoje', tooltip: 'Aprovadas menos reembolsos e chargebacks' },
    { label: 'Gastos com Ads', value: `R$ ${fmt(totalAdSpend)}`, change: 0, changeLabel: 'hoje', tooltip: 'Total investido em anúncios' },
    { label: 'Lucro Líquido', value: `R$ ${fmt(netProfit)}`, change: 0, changeLabel: 'hoje', tooltip: 'Receita líquida menos todos os custos (ads, produto, frete, taxas, impostos)' },
    { label: 'ROAS', value: `${roas.toFixed(2)}x`, change: 0, changeLabel: 'hoje', tooltip: 'Faturamento ÷ Gasto com Ads' },
    { label: 'ROI Real', value: `${roi.toFixed(1)}%`, change: 0, changeLabel: 'hoje', tooltip: 'Lucro Líquido ÷ Custo Total × 100' },
    { label: 'Margem Líquida', value: `${margin.toFixed(1)}%`, change: 0, changeLabel: 'hoje', tooltip: 'Lucro Líquido ÷ Faturamento Líquido × 100' },
    { label: 'Ticket Médio', value: `R$ ${fmt(avgTicket)}`, change: 0, changeLabel: 'hoje', tooltip: 'Valor médio por venda aprovada' },
    { label: 'Vendas Aprovadas', value: `${approved.length}`, change: 0, changeLabel: 'hoje', tooltip: 'Quantidade de vendas aprovadas' },
    { label: 'Taxa Aprovação', value: `${approvalRate.toFixed(1)}%`, change: 0, changeLabel: 'hoje', tooltip: 'Aprovadas ÷ Total de pedidos' },
  ];

  const warModeKPIs = [
    { label: 'Lucro Líquido', value: `R$ ${fmt(netProfit)}`, change: 0 },
    { label: 'Vendas', value: `${approved.length}`, change: 0 },
    { label: 'ROAS', value: `${roas.toFixed(2)}x`, change: 0 },
    { label: 'Pix Pendente', value: `R$ ${fmt(pixPendingTotal)}`, change: 0 },
  ];

  return {
    kpis,
    warModeKPIs,
    recentOrders: orders.slice(0, 10),
    isLoading,
    hasRealData: true,
  };
}
