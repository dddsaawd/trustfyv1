import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, DollarSign, Megaphone, Package, Zap, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo, useRef, useEffect, useState } from 'react';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ModoEscala = () => {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders-escala', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('orders').select('*').gte('created_at', `${today}T00:00:00`);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns-escala', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('name, spend, revenue, roas, profit').eq('status', 'active').order('roas', { ascending: false }).limit(1);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const hasRealData = orders && orders.length > 0;

  const stats = useMemo(() => {
    if (!hasRealData || !orders) return null;
    const approved = orders.filter((o: any) => o.payment_status === 'approved');
    const grossRevenue = orders.reduce((s: number, o: any) => s + Number(o.gross_value || 0), 0);
    const netProfit = approved.reduce((s: number, o: any) => s + Number(o.net_profit || 0), 0);
    const totalAdSpend = orders.reduce((s: number, o: any) => s + Number(o.ads_cost_attributed || 0), 0);
    const roas = totalAdSpend > 0 ? grossRevenue / totalAdSpend : 0;

    // Top product
    const productMap: Record<string, { name: string; profit: number; units: number }> = {};
    approved.forEach((o: any) => {
      const n = o.product_name;
      if (!productMap[n]) productMap[n] = { name: n, profit: 0, units: 0 };
      productMap[n].profit += Number(o.net_profit || 0);
      productMap[n].units += 1;
    });
    const topProduct = Object.values(productMap).sort((a, b) => b.profit - a.profit)[0] || null;

    return { grossRevenue, netProfit, approvedCount: approved.length, roas, topProduct };
  }, [hasRealData, orders]);

  const topCampaign = campaigns && campaigns.length > 0 ? campaigns[0] : null;

  if (!hasRealData && !isLoading) {
    return (
      <DashboardLayout title="Modo Escala">
        <Card className="border-border">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <Inbox className="h-16 w-16 text-muted-foreground/20" />
              <h3 className="text-lg font-semibold text-foreground">Sem dados para o Modo Escala</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Quando vendas reais forem registradas, a visão executiva aparecerá aqui.
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!stats) return <DashboardLayout title="Modo Escala"><div /></DashboardLayout>;

  const metrics = [
    { label: 'Lucro Hoje', value: `R$ ${fmt(stats.netProfit)}`, icon: DollarSign, color: 'text-success' },
    { label: 'Faturamento', value: `R$ ${fmt(stats.grossRevenue)}`, icon: TrendingUp, color: 'text-primary' },
    { label: 'Vendas', value: `${stats.approvedCount}`, icon: ShoppingCart, color: 'text-foreground' },
    { label: 'ROAS', value: `${stats.roas.toFixed(2)}x`, icon: Zap, color: 'text-warning' },
  ];

  return (
    <DashboardLayout title="Modo Escala">
      <div className="flex flex-col items-center justify-center min-h-[75vh] gap-8 animate-fade-in">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Visão Executiva</h2>
          <p className="text-xs text-muted-foreground mt-1">Sem distração. Foco total na escala.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
          {metrics.map((m, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 text-center animate-scale-in" style={{ animationDelay: `${i * 80}ms` }}>
              <m.icon className={cn('h-5 w-5 mx-auto mb-2', m.color)} />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{m.label}</p>
              <p className="text-3xl font-black text-foreground tabular-nums">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mt-4">
          {topCampaign && (
            <div className="rounded-xl border border-border bg-card p-5 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="h-4 w-4 text-primary" />
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Top Campanha</p>
              </div>
              <p className="text-sm font-semibold text-foreground truncate">{topCampaign.name}</p>
              <p className="text-xs text-muted-foreground mt-1">ROAS {Number(topCampaign.roas || 0).toFixed(2)}x · Lucro R$ {fmt(Number(topCampaign.profit || 0))}</p>
            </div>
          )}
          {stats.topProduct && (
            <div className="rounded-xl border border-border bg-card p-5 animate-fade-in" style={{ animationDelay: '450ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-success" />
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Top Produto</p>
              </div>
              <p className="text-sm font-semibold text-foreground truncate">{stats.topProduct.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.topProduct.units} vendas · Lucro R$ {fmt(stats.topProduct.profit)}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ModoEscala;
