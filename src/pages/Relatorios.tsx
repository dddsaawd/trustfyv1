import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Database, HardDrive } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Relatorios = () => {
  const { user } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ['orders-reports', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const hasRealData = orders && orders.length > 0;

  const exportCSV = (period: string) => {
    if (!orders || orders.length === 0) {
      toast.error('Sem dados para exportar');
      return;
    }

    const now = new Date();
    let filtered = orders;
    if (period === 'daily') {
      const today = now.toISOString().split('T')[0];
      filtered = orders.filter((o: any) => o.created_at.startsWith(today));
    } else if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      filtered = orders.filter((o: any) => o.created_at >= weekAgo);
    } else if (period === 'monthly') {
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      filtered = orders.filter((o: any) => o.created_at >= monthStart);
    }

    if (filtered.length === 0) { toast.error('Sem dados neste período'); return; }

    const headers = ['Pedido', 'Data', 'Cliente', 'Produto', 'Valor Bruto', 'Custo Produto', 'Taxa GW', 'Custo Ads', 'Frete', 'Impostos', 'Lucro Líquido', 'Status', 'Método'];
    const rows = filtered.map((o: any) => [
      o.order_number, o.created_at, o.customer_name, o.product_name,
      o.gross_value, o.product_cost, o.gateway_fee, o.ads_cost_attributed,
      o.shipping_cost, o.tax, o.net_profit, o.payment_status, o.payment_method,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustfy-${period}-${now.toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório exportado com sucesso!');
  };

  const reportTypes = [
    { label: 'Relatório Diário', desc: 'Resumo completo do dia com KPIs, vendas, lucro e campanhas', period: 'daily', periodLabel: 'Hoje' },
    { label: 'Relatório Semanal', desc: 'Visão consolidada da semana com comparativos e tendências', period: 'weekly', periodLabel: 'Últimos 7 dias' },
    { label: 'Relatório Mensal', desc: 'Análise completa do mês com P&L, produtos e performance', period: 'monthly', periodLabel: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) },
    { label: 'Relatório Completo', desc: 'Todos os dados disponíveis para análise detalhada', period: 'all', periodLabel: 'Todos os períodos' },
  ];

  return (
    <DashboardLayout title="Relatórios">
      <div className="flex items-center gap-1.5 mb-3">
        {hasRealData ? (
          <Badge variant="outline" className="text-[9px] gap-1 bg-success/10 text-success border-success/30"><Database className="h-2.5 w-2.5" /> {orders.length} pedidos disponíveis</Badge>
        ) : (
          <Badge variant="outline" className="text-[9px] gap-1 bg-warning/10 text-warning border-warning/30"><HardDrive className="h-2.5 w-2.5" /> Sem dados — envie pedidos via webhook</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {reportTypes.map((r, i) => (
          <Card key={i} className="border-border animate-fade-in hover:border-primary/20 transition-all" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Período: {r.periodLabel}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => exportCSV(r.period)}>
                  <Download className="h-3 w-3 mr-1" /> CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;
