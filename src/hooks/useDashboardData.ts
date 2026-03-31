import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { KPIData } from '@/types/database';

export type DateRange = 'today' | 'yesterday' | '7d' | '30d' | '365d' | 'custom';

interface DashboardFilters {
  dateRange: DateRange;
  customStart?: Date;
  customEnd?: Date;
}

interface DashboardData {
  kpis: KPIData[];
  warModeKPIs: { label: string; value: string; change: number }[];
  recentOrders: any[];
  isLoading: boolean;
  hasRealData: boolean;
  filters: DashboardFilters;
  setFilters: (f: DashboardFilters) => void;
  totalOrders: number;
  totalApproved: number;
  totalPending: number;
  totalRefused: number;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getBrazilDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function getDateRange(filters: DashboardFilters): { start: string; end: string; prevStart: string; prevEnd: string } {
  const now = new Date();
  const todayBR = getBrazilDate(now);

  let start: string;
  let end: string;
  let prevStart: string;
  let prevEnd: string;

  switch (filters.dateRange) {
    case 'today': {
      start = `${todayBR}T00:00:00-03:00`;
      end = `${todayBR}T23:59:59-03:00`;
      // Compare with yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yBR = getBrazilDate(yesterday);
      prevStart = `${yBR}T00:00:00-03:00`;
      prevEnd = `${yBR}T23:59:59-03:00`;
      break;
    }
    case 'yesterday': {
      const yd = new Date(now);
      yd.setDate(yd.getDate() - 1);
      const ydBR = getBrazilDate(yd);
      start = `${ydBR}T00:00:00-03:00`;
      end = `${ydBR}T23:59:59-03:00`;
      const dba = new Date(now);
      dba.setDate(dba.getDate() - 2);
      const dbaBR = getBrazilDate(dba);
      prevStart = `${dbaBR}T00:00:00-03:00`;
      prevEnd = `${dbaBR}T23:59:59-03:00`;
      break;
    }
    case '7d': {
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 6);
      start = `${getBrazilDate(d7)}T00:00:00-03:00`;
      end = `${todayBR}T23:59:59-03:00`;
      const pd7End = new Date(d7);
      pd7End.setDate(pd7End.getDate() - 1);
      const pd7Start = new Date(pd7End);
      pd7Start.setDate(pd7Start.getDate() - 6);
      prevStart = `${getBrazilDate(pd7Start)}T00:00:00-03:00`;
      prevEnd = `${getBrazilDate(pd7End)}T23:59:59-03:00`;
      break;
    }
    case '30d': {
      const d30 = new Date(now);
      d30.setDate(d30.getDate() - 29);
      start = `${getBrazilDate(d30)}T00:00:00-03:00`;
      end = `${todayBR}T23:59:59-03:00`;
      const pd30End = new Date(d30);
      pd30End.setDate(pd30End.getDate() - 1);
      const pd30Start = new Date(pd30End);
      pd30Start.setDate(pd30Start.getDate() - 29);
      prevStart = `${getBrazilDate(pd30Start)}T00:00:00-03:00`;
      prevEnd = `${getBrazilDate(pd30End)}T23:59:59-03:00`;
      break;
    }
    case '365d': {
      const d365 = new Date(now);
      d365.setDate(d365.getDate() - 364);
      start = `${getBrazilDate(d365)}T00:00:00-03:00`;
      end = `${todayBR}T23:59:59-03:00`;
      const p365End = new Date(d365);
      p365End.setDate(p365End.getDate() - 1);
      const p365Start = new Date(p365End);
      p365Start.setDate(p365Start.getDate() - 364);
      prevStart = `${getBrazilDate(p365Start)}T00:00:00-03:00`;
      prevEnd = `${getBrazilDate(p365End)}T23:59:59-03:00`;
      break;
    }
    case 'custom': {
      const cs = filters.customStart || now;
      const ce = filters.customEnd || now;
      start = `${getBrazilDate(cs)}T00:00:00-03:00`;
      end = `${getBrazilDate(ce)}T23:59:59-03:00`;
      const diffMs = ce.getTime() - cs.getTime();
      const pce = new Date(cs.getTime() - 86400000);
      const pcs = new Date(pce.getTime() - diffMs);
      prevStart = `${getBrazilDate(pcs)}T00:00:00-03:00`;
      prevEnd = `${getBrazilDate(pce)}T23:59:59-03:00`;
      break;
    }
  }

  return { start, end, prevStart, prevEnd };
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

const changeLabelMap: Record<DateRange, string> = {
  today: 'vs ontem',
  yesterday: 'vs anteontem',
  '7d': 'vs 7d anteriores',
  '30d': 'vs 30d anteriores',
  '365d': 'vs 365d anteriores',
  custom: 'vs período anterior',
};

export function useDashboardData(): DashboardData {
  const [filters, setFilters] = useState<DashboardFilters>({ dateRange: 'today' });
  const { start, end, prevStart, prevEnd } = useMemo(() => getDateRange(filters), [filters]);
  const changeLabel = changeLabelMap[filters.dateRange];

  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['dashboard-orders', start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const { data: prevOrders } = useQuery({
    queryKey: ['dashboard-orders-prev', prevStart, prevEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', prevStart)
        .lte('created_at', prevEnd);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60000,
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
      // Only get spend from active ad accounts
      const { data: activeAccounts } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('active', true);
      const activeIds = (activeAccounts || []).map(a => a.id);
      
      let query = supabase
        .from('campaigns')
        .select('spend')
        .eq('status', 'active');
      
      if (activeIds.length > 0) {
        query = query.in('ad_account_id', activeIds);
      } else {
        // No active accounts = no campaign spend
        return [];
      }
      
      const { data, error } = await query;
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

  const computeMetrics = (orderList: any[], cs: typeof costSettings) => {
    const approved = orderList.filter(o => o.payment_status === 'approved');
    const pending = orderList.filter(o => o.payment_status === 'pending');
    const refused = orderList.filter(o => o.payment_status === 'refused');
    const refunded = orderList.filter(o => o.payment_status === 'refunded');
    const chargebacks = orderList.filter(o => o.payment_status === 'chargeback');

    const grossRevenue = orderList.reduce((s, o) => s + (o.gross_value || 0), 0);
    const netRevenue = approved.reduce((s, o) => s + (o.gross_value || 0), 0)
      - refunded.reduce((s, o) => s + (o.gross_value || 0), 0)
      - chargebacks.reduce((s, o) => s + (o.gross_value || 0), 0);

    const totalProductCost = approved.reduce((s, o) => s + (o.product_cost || 0), 0);
    const totalGatewayFee = approved.reduce((s, o) => {
      if (o.gateway_fee && o.gateway_fee > 0) return s + o.gateway_fee;
      if (cs) return s + ((o.gross_value * cs.gateway_fee_percent / 100) + cs.gateway_fee_fixed);
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

    const totalAdSpend = campaigns?.reduce((s, c) => s + (c.spend || 0), 0) ?? 0;
    const netProfit = netRevenue - totalProductCost - totalGatewayFee - totalShipping - totalTax - totalAdSpend;
    const roas = totalAdSpend > 0 ? grossRevenue / totalAdSpend : 0;
    const totalCost = totalProductCost + totalGatewayFee + totalShipping + totalTax + totalAdSpend;
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    const margin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;
    const avgTicket = approved.length > 0 ? netRevenue / approved.length : 0;
    const approvalRate = orderList.length > 0 ? (approved.length / orderList.length) * 100 : 0;

    return {
      grossRevenue, netRevenue, totalAdSpend, netProfit, roas, roi, margin, avgTicket,
      approvedCount: approved.length, approvalRate,
      pendingCount: pending.length, refusedCount: refused.length,
      totalCount: orderList.length,
    };
  };

  if (!hasRealData || !orders) {
    return {
      kpis: [], warModeKPIs: [], recentOrders: [],
      isLoading, hasRealData: false, filters, setFilters,
      totalOrders: 0, totalApproved: 0, totalPending: 0, totalRefused: 0,
    };
  }

  const m = computeMetrics(orders, costSettings);
  const pm = prevOrders ? computeMetrics(prevOrders, costSettings) : null;

  const pixPendingTotal = pixPending?.reduce((s, p) => s + (p.value || 0), 0) ?? 0;

  const kpis: KPIData[] = [
    { label: 'Faturamento Bruto', value: `R$ ${fmt(m.grossRevenue)}`, change: pm ? calcChange(m.grossRevenue, pm.grossRevenue) : 0, changeLabel, tooltip: 'Total de vendas brutas no período' },
    { label: 'Faturamento Líquido', value: `R$ ${fmt(m.netRevenue)}`, change: pm ? calcChange(m.netRevenue, pm.netRevenue) : 0, changeLabel, tooltip: 'Aprovadas menos reembolsos e chargebacks' },
    { label: 'Gastos com Ads', value: `R$ ${fmt(m.totalAdSpend)}`, change: pm ? calcChange(m.totalAdSpend, pm.totalAdSpend) : 0, changeLabel, tooltip: 'Total investido em anúncios' },
    { label: 'Lucro Líquido', value: `R$ ${fmt(m.netProfit)}`, change: pm ? calcChange(m.netProfit, pm.netProfit) : 0, changeLabel, tooltip: 'Receita líquida menos todos os custos' },
    { label: 'ROAS', value: `${m.roas.toFixed(2)}x`, change: pm ? calcChange(m.roas, pm.roas) : 0, changeLabel, tooltip: 'Faturamento ÷ Gasto com Ads' },
    { label: 'ROI Real', value: `${m.roi.toFixed(1)}%`, change: pm ? calcChange(m.roi, pm.roi) : 0, changeLabel, tooltip: 'Lucro Líquido ÷ Custo Total × 100' },
    { label: 'Margem Líquida', value: `${m.margin.toFixed(1)}%`, change: pm ? calcChange(m.margin, pm.margin) : 0, changeLabel, tooltip: 'Lucro Líquido ÷ Faturamento Líquido × 100' },
    { label: 'Ticket Médio', value: `R$ ${fmt(m.avgTicket)}`, change: pm ? calcChange(m.avgTicket, pm.avgTicket) : 0, changeLabel, tooltip: 'Valor médio por venda aprovada' },
    { label: 'Vendas Aprovadas', value: `${m.approvedCount}`, change: pm ? calcChange(m.approvedCount, pm.approvedCount) : 0, changeLabel, tooltip: 'Quantidade de vendas aprovadas' },
    { label: 'Taxa Aprovação', value: `${m.approvalRate.toFixed(1)}%`, change: pm ? calcChange(m.approvalRate, pm.approvalRate) : 0, changeLabel, tooltip: 'Aprovadas ÷ Total de pedidos' },
  ];

  const warModeKPIs = [
    { label: 'Lucro Líquido', value: `R$ ${fmt(m.netProfit)}`, change: pm ? calcChange(m.netProfit, pm.netProfit) : 0 },
    { label: 'Vendas Aprovadas', value: `${m.approvedCount}`, change: pm ? calcChange(m.approvedCount, pm.approvedCount) : 0 },
    { label: 'ROAS', value: `${m.roas.toFixed(2)}x`, change: pm ? calcChange(m.roas, pm.roas) : 0 },
    { label: 'Total Pago no Dia', value: `R$ ${fmt(m.netRevenue)}`, change: pm ? calcChange(m.netRevenue, pm.netRevenue) : 0 },
  ];

  return {
    kpis, warModeKPIs,
    recentOrders: orders.slice(0, 10),
    isLoading, hasRealData: true, filters, setFilters,
    totalOrders: m.totalCount, totalApproved: m.approvedCount,
    totalPending: m.pendingCount, totalRefused: m.refusedCount,
  };
}
