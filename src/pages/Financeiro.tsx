import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/dashboard/KPICard';
import { financialSummary as mockFinancial, dailyProjection as mockProjection } from '@/data/mock';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Target, Database, HardDrive } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

const Financeiro = () => {
  const { user } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ['orders-financial', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('orders').select('*').gte('created_at', `${today}T00:00:00`);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: costSettings } = useQuery({
    queryKey: ['cost_settings', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('cost_settings').select('*').single();
      return data;
    },
    enabled: !!user,
  });

  const hasRealData = orders && orders.length > 0;

  const financial = useMemo(() => {
    if (!hasRealData) return mockFinancial;
    const approved = orders.filter((o: any) => o.payment_status === 'approved');
    const gross = orders.reduce((s: number, o: any) => s + Number(o.gross_value || 0), 0);
    const netRevenue = approved.reduce((s: number, o: any) => s + Number(o.gross_value || 0), 0);
    const adSpend = orders.reduce((s: number, o: any) => s + Number(o.ads_cost_attributed || 0), 0);
    const productCost = orders.reduce((s: number, o: any) => s + Number(o.product_cost || 0), 0);
    const shippingCost = orders.reduce((s: number, o: any) => s + Number(o.shipping_cost || 0), 0);
    const gatewayFees = orders.reduce((s: number, o: any) => s + Number(o.gateway_fee || 0), 0);
    const taxes = orders.reduce((s: number, o: any) => s + Number(o.tax || 0), 0);
    const fixedDaily = costSettings ? Number(costSettings.monthly_fixed_expenses) / 30 : 0;
    const netProfit = netRevenue - adSpend - productCost - shippingCost - gatewayFees - taxes - fixedDaily;
    const margin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;
    return {
      gross_revenue: gross, net_revenue: netRevenue, ad_spend: adSpend,
      product_cost: productCost, shipping_cost: shippingCost, gateway_fees: gatewayFees,
      taxes, other_expenses: fixedDaily, net_profit: netProfit, margin: Math.round(margin * 10) / 10,
    };
  }, [hasRealData, orders, costSettings]);

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const finKPIs = [
    { label: 'Receita Bruta', value: fmt(financial.gross_revenue), change: 0, changeLabel: 'hoje', tooltip: 'Soma de todas as vendas brutas' },
    { label: 'Receita Líquida', value: fmt(financial.net_revenue), change: 0, changeLabel: 'hoje', tooltip: 'Vendas aprovadas' },
    { label: 'Gastos Ads', value: fmt(financial.ad_spend), change: 0, changeLabel: 'hoje', tooltip: 'Total investido em ads' },
    { label: 'Custo Produtos', value: fmt(financial.product_cost), change: 0, changeLabel: 'hoje', tooltip: 'Custo total dos produtos' },
    { label: 'Frete', value: fmt(financial.shipping_cost), change: 0, changeLabel: 'hoje', tooltip: 'Custo total de frete' },
    { label: 'Taxas Gateway', value: fmt(financial.gateway_fees), change: 0, changeLabel: 'hoje', tooltip: 'Taxas do gateway' },
    { label: 'Impostos', value: fmt(financial.taxes), change: 0, changeLabel: 'hoje', tooltip: 'Impostos sobre vendas' },
    { label: 'Despesas Fixas', value: fmt(financial.other_expenses), change: 0, changeLabel: 'hoje', tooltip: 'Despesas fixas mensais ÷ 30' },
    { label: 'Lucro Líquido', value: fmt(financial.net_profit), change: 0, changeLabel: 'hoje', tooltip: 'Receita líquida menos todos os custos' },
    { label: 'Margem Líquida', value: `${financial.margin}%`, change: 0, changeLabel: 'hoje', tooltip: 'Lucro ÷ receita × 100' },
  ];

  const costBreakdown = [
    { name: 'Ads', value: financial.ad_spend },
    { name: 'Produtos', value: financial.product_cost },
    { name: 'Frete', value: financial.shipping_cost },
    { name: 'Gateway', value: financial.gateway_fees },
    { name: 'Impostos', value: financial.taxes },
    { name: 'Fixas', value: financial.other_expenses },
  ];

  // Projection based on current hour
  const now = new Date();
  const hoursElapsed = now.getHours() + now.getMinutes() / 60;
  const projectedRevenue = hoursElapsed > 0 ? (financial.gross_revenue / hoursElapsed) * 24 : 0;
  const projectedProfit = hoursElapsed > 0 ? (financial.net_profit / hoursElapsed) * 24 : 0;

  return (
    <DashboardLayout title="Financeiro">
      <div className="flex items-center gap-1.5 mb-3">
        {hasRealData ? (
          <Badge variant="outline" className="text-[9px] gap-1 bg-success/10 text-success border-success/30"><Database className="h-2.5 w-2.5" /> Dados Reais ({orders.length} pedidos hoje)</Badge>
        ) : (
          <Badge variant="outline" className="text-[9px] gap-1 bg-warning/10 text-warning border-warning/30"><HardDrive className="h-2.5 w-2.5" /> Dados Demonstração</Badge>
        )}
      </div>

      {/* Projection */}
      <div className="mb-6 rounded-xl border border-success/20 bg-success/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fade-in">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-success" />
          <span className="text-xs font-semibold uppercase tracking-wider text-success">Projeção do dia</span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">Faturamento: <strong className="text-foreground">{fmt(projectedRevenue)}</strong></span>
          <span className="text-muted-foreground">Lucro: <strong className="text-success">{fmt(projectedProfit)}</strong></span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
        {finKPIs.map((kpi, i) => <KPICard key={i} {...kpi} index={i} />)}
      </div>

      {/* Cost Breakdown */}
      <Card className="border-border mb-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Distribuição de Custos</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={costBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224, 20%, 16%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={{ background: 'hsl(221, 39%, 11%)', border: '1px solid hsl(224, 20%, 18%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(210, 20%, 92%)' }} />
              <Bar dataKey="value" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Valor" opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* DRE */}
      <Card className="border-border animate-fade-in" style={{ animationDelay: '500ms' }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">DRE Simplificada do Dia</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm max-w-md">
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">Receita Bruta</span><span className="tabular-nums font-medium">{fmt(financial.gross_revenue)}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">(-) Devoluções/Chargebacks</span><span className="tabular-nums text-destructive">-{fmt(financial.gross_revenue - financial.net_revenue)}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border font-medium"><span>= Receita Líquida</span><span className="tabular-nums">{fmt(financial.net_revenue)}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">(-) Anúncios</span><span className="tabular-nums text-destructive">-{fmt(financial.ad_spend)}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">(-) Custo Produtos</span><span className="tabular-nums text-destructive">-{fmt(financial.product_cost)}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">(-) Frete</span><span className="tabular-nums text-destructive">-{fmt(financial.shipping_cost)}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">(-) Taxas Gateway</span><span className="tabular-nums text-destructive">-{fmt(financial.gateway_fees)}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">(-) Impostos</span><span className="tabular-nums text-destructive">-{fmt(financial.taxes)}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">(-) Despesas Fixas</span><span className="tabular-nums text-destructive">-{fmt(financial.other_expenses)}</span></div>
            <div className={cn('flex justify-between py-2 text-base font-bold', financial.net_profit >= 0 ? 'text-success' : 'text-destructive')}><span>= Lucro Líquido</span><span className="tabular-nums">{fmt(financial.net_profit)}</span></div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Financeiro;
