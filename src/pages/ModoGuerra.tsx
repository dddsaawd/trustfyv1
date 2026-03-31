import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { X, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Zap, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getBrazilDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function getBrazilTime(): string {
  return new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

const ModoGuerra = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clock, setClock] = useState(getBrazilTime());

  // Fullscreen
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => { document.exitFullscreen?.().catch(() => {}); };
  }, []);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setClock(getBrazilTime()), 1000);
    return () => clearInterval(t);
  }, []);

  const todayBR = getBrazilDate();
  const start = `${todayBR}T00:00:00-03:00`;
  const end = `${todayBR}T23:59:59-03:00`;

  const { data: orders } = useQuery({
    queryKey: ['war-orders', start],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders').select('*')
        .gte('created_at', start).lte('created_at', end)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: pixPending } = useQuery({
    queryKey: ['war-pix'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pix_pending').select('value').eq('status', 'pending');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: campaigns } = useQuery({
    queryKey: ['war-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns').select('spend').eq('status', 'active');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const stats = useMemo(() => {
    if (!orders) return null;
    const approved = orders.filter(o => o.payment_status === 'approved');
    const pending = orders.filter(o => o.payment_status === 'pending');
    const grossRevenue = orders.reduce((s, o) => s + (o.gross_value || 0), 0);
    const netProfit = approved.reduce((s, o) => s + (o.net_profit || 0), 0);
    const adSpend = campaigns?.reduce((s, c) => s + (c.spend || 0), 0) ?? 0;
    const roas = adSpend > 0 ? grossRevenue / adSpend : 0;
    const pixTotal = pixPending?.reduce((s, p) => s + (p.value || 0), 0) ?? 0;
    const avgTicket = approved.length > 0 ? grossRevenue / approved.length : 0;

    return {
      grossRevenue, netProfit, roas, adSpend, pixTotal, avgTicket,
      approvedCount: approved.length, pendingCount: pending.length,
      totalCount: orders.length,
    };
  }, [orders, campaigns, pixPending]);

  // Golden Hour data
  const hourlyData = useMemo(() => {
    if (!orders) return [];
    const hours: Record<number, { sales: number; revenue: number }> = {};
    for (let h = 0; h < 24; h++) hours[h] = { sales: 0, revenue: 0 };

    orders.filter(o => o.payment_status === 'approved').forEach(o => {
      const d = new Date(o.created_at);
      const h = parseInt(d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }));
      hours[h].sales += 1;
      hours[h].revenue += o.gross_value || 0;
    });

    return Object.entries(hours).map(([h, v]) => ({
      hour: `${h.padStart(2, '0')}h`,
      sales: v.sales,
      revenue: v.revenue,
    }));
  }, [orders]);

  const maxSalesHour = useMemo(() => {
    if (!hourlyData.length) return null;
    return hourlyData.reduce((max, h) => h.sales > max.sales ? h : max, hourlyData[0]);
  }, [hourlyData]);

  // Last sale feed
  const lastSales = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter(o => o.payment_status === 'approved')
      .slice(0, 5);
  }, [orders]);

  const handleExit = () => {
    document.exitFullscreen?.().catch(() => {});
    navigate('/');
  };

  if (!stats) {
    return (
      <div className="fixed inset-0 z-50 bg-[hsl(var(--background))] flex items-center justify-center">
        <Activity className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  const kpis = [
    { label: 'LUCRO LÍQUIDO', value: `R$ ${fmt(stats.netProfit)}`, icon: DollarSign, positive: stats.netProfit >= 0, highlight: true },
    { label: 'FATURAMENTO', value: `R$ ${fmt(stats.grossRevenue)}`, icon: TrendingUp, positive: true },
    { label: 'VENDAS', value: `${stats.approvedCount}`, icon: ShoppingCart, positive: true },
    { label: 'ROAS', value: `${stats.roas.toFixed(2)}x`, icon: Zap, positive: stats.roas >= 2 },
    { label: 'GASTO ADS', value: `R$ ${fmt(stats.adSpend)}`, icon: TrendingDown, positive: false },
    { label: 'PIX PENDENTE', value: `R$ ${fmt(stats.pixTotal)}`, icon: Clock, positive: true },
    { label: 'TICKET MÉDIO', value: `R$ ${fmt(stats.avgTicket)}`, icon: Activity, positive: true },
    { label: 'PEDIDOS', value: `${stats.totalCount}`, icon: ShoppingCart, positive: true },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            Modo Guerra — AO VIVO
          </span>
        </div>
        <div className="text-lg font-mono font-black tabular-nums text-[hsl(var(--primary))]">
          {clock}
        </div>
        <button
          onClick={handleExit}
          className="p-1.5 rounded-md hover:bg-[hsl(var(--muted))] transition-colors"
          title="Sair"
        >
          <X className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Hero profit */}
        <div className="text-center py-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))] mb-1">Lucro Acumulado Hoje</p>
          <p className={cn(
            "text-6xl md:text-8xl font-black tabular-nums tracking-tight",
            stats.netProfit >= 0 ? "text-[hsl(var(--success))]" : "text-[hsl(var(--destructive))]"
          )}>
            R$ {fmt(stats.netProfit)}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
            {stats.approvedCount} vendas aprovadas · {stats.pendingCount} pendentes
          </p>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg border p-4 text-center transition-all",
                kpi.highlight
                  ? "border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.05)]"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
              )}
            >
              <kpi.icon className={cn("h-4 w-4 mx-auto mb-1", kpi.highlight ? "text-[hsl(var(--success))]" : "text-[hsl(var(--primary))]")} />
              <p className="text-[9px] uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-1">{kpi.label}</p>
              <p className="text-xl md:text-2xl font-black tabular-nums">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Bottom row: Golden Hour + Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Golden Hour Chart */}
          <div className="lg:col-span-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">⏱ Horário de Ouro</h3>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Vendas por hora — otimize seus horários de campanha</p>
              </div>
              {maxSalesHour && maxSalesHour.sales > 0 && (
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Pico</p>
                  <p className="text-lg font-black text-[hsl(var(--warning))]">{maxSalesHour.hour}</p>
                </div>
              )}
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 9, fill: 'hsl(215 15% 55%)' }}
                    axisLine={false}
                    tickLine={false}
                    interval={1}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'hsl(215 15% 55%)' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(221 39% 11%)',
                      border: '1px solid hsl(224 20% 18%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'hsl(210 20% 92%)',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'sales') return [`${value} vendas`, 'Vendas'];
                      return [`R$ ${fmt(value)}`, 'Receita'];
                    }}
                    labelFormatter={(label) => `Horário: ${label}`}
                  />
                  <Bar dataKey="sales" radius={[3, 3, 0, 0]} maxBarSize={20}>
                    {hourlyData.map((entry, index) => {
                      const isMax = maxSalesHour && entry.hour === maxSalesHour.hour && entry.sales > 0;
                      return (
                        <Cell
                          key={index}
                          fill={isMax ? 'hsl(45 93% 47%)' : entry.sales > 0 ? 'hsl(217 91% 60%)' : 'hsl(224 20% 18%)'}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Live sales feed */}
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-3">🔴 Últimas Vendas</h3>
            {lastSales.length === 0 ? (
              <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-8">Nenhuma venda aprovada ainda hoje</p>
            ) : (
              <div className="space-y-2">
                {lastSales.map((sale, i) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-[hsl(var(--muted)/0.3)] animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{sale.customer_name}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{sale.product_name}</p>
                    </div>
                    <p className="text-sm font-black text-[hsl(var(--success))] tabular-nums whitespace-nowrap ml-2">
                      R$ {fmt(sale.gross_value)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModoGuerra;
