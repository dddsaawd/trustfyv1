import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Swords, TrendingUp, TrendingDown, Zap, Target, Database, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const [warMode, setWarMode] = useState(false);
  const { kpis, warModeKPIs: liveWarKPIs, recentOrders: liveOrders, isLoading, hasRealData } = useDashboardData();

  const activeKPIs = kpis;
  const activeWarKPIs = liveWarKPIs;
  const activeOrders = liveOrders;

  if (warMode) {
    return (
      <DashboardLayout title="Modo Guerra">
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 animate-fade-in">
          <Button variant="outline" size="sm" onClick={() => setWarMode(false)} className="absolute top-20 right-6 border-destructive/30 text-destructive hover:bg-destructive/10">
            <Swords className="h-3.5 w-3.5 mr-1.5" /> Sair do Modo Guerra
          </Button>

          <div className="flex items-center gap-2 mb-4">
            <Swords className="h-6 w-6 text-destructive" />
            <h2 className="text-lg font-bold text-destructive uppercase tracking-widest">Modo Guerra Ativo</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
            {activeWarKPIs.map((kpi, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-8 text-center animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">{kpi.label}</p>
                <p className="text-5xl lg:text-6xl font-black text-foreground tabular-nums tracking-tight">{kpi.value}</p>
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  {kpi.change >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                  <span className={cn('text-sm font-bold tabular-nums', kpi.change >= 0 ? 'text-success' : 'text-destructive')}>
                    {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Resumo">
      {/* Data Source Indicator */}
      {hasRealData && (
        <div className="mb-3 flex items-center gap-2 text-xs text-success animate-fade-in">
          <Database className="h-3 w-3" />
          <span className="font-medium">Dados em tempo real — atualizado a cada 30s</span>
        </div>
      )}

      {/* Projection Banner */}
      <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fade-in">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Projeção do dia</span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">Faturamento: <strong className="text-foreground">{dailyProjection.projectedRevenue}</strong></span>
          <span className="text-muted-foreground">Lucro: <strong className="text-success">{dailyProjection.projectedProfit}</strong></span>
          <span className="text-muted-foreground">Vendas: <strong className="text-foreground">{dailyProjection.projectedSales}</strong></span>
          <span className="text-[10px] text-muted-foreground/60">Confiança: {dailyProjection.confidence}%</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setWarMode(true)} className="ml-auto border-destructive/30 text-destructive hover:bg-destructive/10 text-xs">
          <Swords className="h-3 w-3 mr-1" /> Modo Guerra
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
        {activeKPIs.map((kpi, i) => (
          <KPICard key={i} {...kpi} index={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue & Profit by Hour */}
        <Card className="lg:col-span-2 border-border animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Faturamento e Lucro por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224, 20%, 16%)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ background: 'hsl(221, 39%, 11%)', border: '1px solid hsl(224, 20%, 18%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(210, 20%, 92%)' }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 60%)" fill="url(#revGrad)" strokeWidth={2} name="Faturamento" />
                <Area type="monotone" dataKey="profit" stroke="hsl(152, 69%, 45%)" fill="url(#profGrad)" strokeWidth={2} name="Lucro" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Pie */}
        <Card className="border-border animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Métodos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                  {paymentMethodData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ background: 'hsl(221, 39%, 11%)', border: '1px solid hsl(224, 20%, 18%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(210, 20%, 92%)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {paymentMethodData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2 w-2 rounded-full" style={{ background: item.fill }} />
                  <span className="text-muted-foreground">{item.name} {item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Sales + ROAS Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="border-border animate-fade-in" style={{ animationDelay: '500ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Vendas por Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={platformSalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224, 20%, 16%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ background: 'hsl(221, 39%, 11%)', border: '1px solid hsl(224, 20%, 18%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(210, 20%, 92%)' }} />
                <Bar dataKey="sales" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} name="Vendas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border animate-fade-in" style={{ animationDelay: '550ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Tendência do ROAS</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224, 20%, 16%)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ background: 'hsl(221, 39%, 11%)', border: '1px solid hsl(224, 20%, 18%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(210, 20%, 92%)' }} />
                <Line type="monotone" dataKey="roas" stroke="hsl(25, 95%, 53%)" strokeWidth={2} dot={false} name="ROAS" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products + Top Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="border-border animate-fade-in" style={{ animationDelay: '600ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Produtos Mais Lucrativos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px]">Produto</TableHead>
                  <TableHead className="text-[11px] text-right">Receita</TableHead>
                  <TableHead className="text-[11px] text-right">Lucro</TableHead>
                  <TableHead className="text-[11px] text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProductsMetrics.map((p, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="text-xs font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">R$ {p.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-success">R$ {p.profit.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{p.margin}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border animate-fade-in" style={{ animationDelay: '650ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Campanhas com Maior Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px]">Campanha</TableHead>
                  <TableHead className="text-[11px] text-right">ROAS</TableHead>
                  <TableHead className="text-[11px] text-right">Lucro</TableHead>
                  <TableHead className="text-[11px] text-center">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.slice(0, 5).map((c, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="text-xs font-medium max-w-[180px] truncate">{c.name}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{c.roas.toFixed(2)}x</TableCell>
                    <TableCell className={cn('text-xs text-right tabular-nums', c.profit >= 0 ? 'text-success' : 'text-destructive')}>
                      R$ {c.profit.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={c.score === 'scale' ? 'default' : c.score === 'watch' ? 'secondary' : 'destructive'}
                        className={cn('text-[9px] px-1.5', c.score === 'scale' && 'bg-success/20 text-success border-success/30 hover:bg-success/30')}>
                        {c.score === 'scale' ? '🔥 Escalar' : c.score === 'watch' ? '⚠️ Observar' : '❌ Cortar'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-border animate-fade-in" style={{ animationDelay: '700ms' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px]">Pedido</TableHead>
                  <TableHead className="text-[11px]">Cliente</TableHead>
                  <TableHead className="text-[11px]">Produto</TableHead>
                  <TableHead className="text-[11px] text-right">Valor</TableHead>
                  <TableHead className="text-[11px] text-right">Lucro</TableHead>
                  <TableHead className="text-[11px] text-center">Status</TableHead>
                  <TableHead className="text-[11px]">Método</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeOrders.map((o, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="text-xs font-mono text-muted-foreground">{o.order_number}</TableCell>
                    <TableCell className="text-xs">{o.customer_name}</TableCell>
                    <TableCell className="text-xs max-w-[150px] truncate">{o.product_name}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">R$ {Number(o.gross_value).toFixed(2)}</TableCell>
                    <TableCell className={cn('text-xs text-right tabular-nums', Number(o.net_profit) >= 0 ? 'text-success' : 'text-destructive')}>
                      R$ {Number(o.net_profit).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={o.payment_status === 'approved' ? 'default' : o.payment_status === 'pending' ? 'secondary' : 'destructive'}
                        className={cn('text-[9px] px-1.5', o.payment_status === 'approved' && 'bg-success/20 text-success border-success/30 hover:bg-success/30')}>
                        {o.payment_status === 'approved' ? 'Aprovado' : o.payment_status === 'pending' ? 'Pendente' : 'Recusado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground capitalize">{o.payment_method === 'credit_card' ? 'Cartão' : o.payment_method}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Index;
