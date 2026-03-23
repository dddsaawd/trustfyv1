import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/dashboard/KPICard';
import { financialSummary, dailyProjection } from '@/data/mock';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Target } from 'lucide-react';

const finKPIs = [
  { label: 'Receita Bruta', value: `R$ ${financialSummary.gross_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 12.4, changeLabel: 'vs ontem', tooltip: 'Soma de todas as vendas brutas' },
  { label: 'Receita Líquida', value: `R$ ${financialSummary.net_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 8.7, changeLabel: 'vs ontem', tooltip: 'Vendas aprovadas - reembolsos - chargebacks' },
  { label: 'Gastos Ads', value: `R$ ${financialSummary.ad_spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: -3.2, changeLabel: 'vs ontem', tooltip: 'Total investido em plataformas de ads' },
  { label: 'Custo Produtos', value: `R$ ${financialSummary.product_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 5.1, changeLabel: 'vs ontem', tooltip: 'Custo total dos produtos vendidos' },
  { label: 'Frete', value: `R$ ${financialSummary.shipping_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 8.0, changeLabel: 'vs ontem', tooltip: 'Custo total de frete' },
  { label: 'Taxas Gateway', value: `R$ ${financialSummary.gateway_fees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 6.3, changeLabel: 'vs ontem', tooltip: 'Taxas cobradas pelo gateway de pagamento' },
  { label: 'Impostos', value: `R$ ${financialSummary.taxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 7.2, changeLabel: 'vs ontem', tooltip: 'Impostos sobre vendas' },
  { label: 'Outras Despesas', value: `R$ ${financialSummary.other_expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 0, changeLabel: 'vs ontem', tooltip: 'Ferramentas, equipe e despesas adicionais' },
  { label: 'Lucro Líquido', value: `R$ ${financialSummary.net_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 18.6, changeLabel: 'vs ontem', tooltip: 'Receita líquida - ads - produto - frete - taxas - impostos - outras despesas' },
  { label: 'Margem Líquida', value: `${financialSummary.margin}%`, change: 4.2, changeLabel: 'vs ontem', tooltip: 'Lucro líquido ÷ receita líquida × 100' },
];

const costBreakdown = [
  { name: 'Ads', value: financialSummary.ad_spend },
  { name: 'Produtos', value: financialSummary.product_cost },
  { name: 'Frete', value: financialSummary.shipping_cost },
  { name: 'Gateway', value: financialSummary.gateway_fees },
  { name: 'Impostos', value: financialSummary.taxes },
  { name: 'Outros', value: financialSummary.other_expenses },
];

const Financeiro = () => {
  return (
    <DashboardLayout title="Financeiro">
      {/* Projection */}
      <div className="mb-6 rounded-xl border border-success/20 bg-success/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fade-in">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-success" />
          <span className="text-xs font-semibold uppercase tracking-wider text-success">Projeção do dia</span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">Faturamento: <strong className="text-foreground">{dailyProjection.projectedRevenue}</strong></span>
          <span className="text-muted-foreground">Lucro: <strong className="text-success">{dailyProjection.projectedProfit}</strong></span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
        {finKPIs.map((kpi, i) => (
          <KPICard key={i} {...kpi} index={i} />
        ))}
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

      {/* P&L Summary */}
      <Card className="border-border animate-fade-in" style={{ animationDelay: '500ms' }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">DRE Simplificada do Dia</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm max-w-md">
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">Receita Bruta</span><span className="tabular-nums font-medium">R$ {financialSummary.gross_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">(-) Devoluções/Chargebacks</span><span className="tabular-nums text-destructive">-R$ {(financialSummary.gross_revenue - financialSummary.net_revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border font-medium"><span>= Receita Líquida</span><span className="tabular-nums">R$ {financialSummary.net_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">(-) Anúncios</span><span className="tabular-nums text-destructive">-R$ {financialSummary.ad_spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">(-) Custo Produtos</span><span className="tabular-nums text-destructive">-R$ {financialSummary.product_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">(-) Frete</span><span className="tabular-nums text-destructive">-R$ {financialSummary.shipping_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">(-) Taxas Gateway</span><span className="tabular-nums text-destructive">-R$ {financialSummary.gateway_fees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">(-) Impostos</span><span className="tabular-nums text-destructive">-R$ {financialSummary.taxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between py-1.5 border-b border-border"><span className="text-muted-foreground">(-) Outras Despesas</span><span className="tabular-nums text-destructive">-R$ {financialSummary.other_expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between py-2 text-base font-bold text-success"><span>= Lucro Líquido</span><span className="tabular-nums">R$ {financialSummary.net_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Financeiro;
