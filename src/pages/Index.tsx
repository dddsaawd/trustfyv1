import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { useDashboardData, DateRange } from '@/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Swords, TrendingUp, TrendingDown, Database, Inbox, CalendarIcon, ShoppingCart, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
    <Inbox className="h-10 w-10 opacity-30" />
    <p className="text-sm">{message}</p>
  </div>
);

const periodOptions: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'custom', label: 'Personalizado' },
];

const Index = () => {
  const [warMode, setWarMode] = useState(false);
  const { kpis, warModeKPIs, recentOrders, isLoading, hasRealData, filters, setFilters, totalOrders, totalApproved, totalPending, totalRefused } = useDashboardData();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});

  const handlePeriodChange = (range: DateRange) => {
    if (range === 'custom') {
      setShowDatePicker(true);
      return;
    }
    setShowDatePicker(false);
    setFilters({ dateRange: range });
  };

  const handleCustomDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return;
    setCustomRange(range);
    if (range.from && range.to) {
      setFilters({ dateRange: 'custom', customStart: range.from, customEnd: range.to });
    }
  };

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

          {hasRealData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
              {warModeKPIs.map((kpi, i) => (
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
          ) : (
            <EmptyState message="Nenhuma venda hoje. Os dados aparecerão aqui em tempo real." />
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Resumo">
      {/* Top bar: period selector + war mode */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {periodOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={filters.dateRange === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange(opt.value)}
              className="text-xs h-8"
            >
              {opt.value === 'custom' && <CalendarIcon className="h-3 w-3 mr-1" />}
              {opt.label}
            </Button>
          ))}

          {showDatePicker && (
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-8">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {customRange.from && customRange.to
                    ? `${format(customRange.from, 'dd/MM')} - ${format(customRange.to, 'dd/MM')}`
                    : 'Selecionar datas'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={customRange as any}
                  onSelect={handleCustomDateSelect as any}
                  numberOfMonths={2}
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasRealData && (
            <div className="flex items-center gap-1.5 text-xs text-success">
              <Database className="h-3 w-3" />
              <span className="font-medium">Tempo real</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => setWarMode(true)} className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs h-8">
            <Swords className="h-3 w-3 mr-1" /> Modo Guerra
          </Button>
        </div>
      </div>

      {/* Order counts summary */}
      {hasRealData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-bold text-foreground ml-auto tabular-nums">{totalOrders}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span className="text-xs text-muted-foreground">Aprovadas</span>
            <span className="text-sm font-bold text-success ml-auto tabular-nums">{totalApproved}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs text-muted-foreground">Pendentes</span>
            <span className="text-sm font-bold text-warning ml-auto tabular-nums">{totalPending}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <XCircle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-xs text-muted-foreground">Recusadas</span>
            <span className="text-sm font-bold text-destructive ml-auto tabular-nums">{totalRefused}</span>
          </div>
        </div>
      )}

      {!hasRealData && !isLoading ? (
        <Card className="border-border">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <Inbox className="h-16 w-16 text-muted-foreground/20" />
              <h3 className="text-lg font-semibold text-foreground">Nenhuma venda registrada ainda</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Configure suas integrações para começar a receber dados reais. Os KPIs, gráficos e pedidos aparecerão automaticamente aqui.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
            {kpis.map((kpi, i) => (
              <KPICard key={i} {...kpi} index={i} />
            ))}
          </div>

          {/* Recent Orders */}
          <Card className="border-border animate-fade-in">
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
                    {recentOrders.map((o, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell className="text-xs font-mono text-muted-foreground">{o.order_number?.slice(0, 8)}...</TableCell>
                        <TableCell className="text-xs">{o.customer_name}</TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">{o.product_name}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">R$ {Number(o.gross_value).toFixed(2)}</TableCell>
                        <TableCell className={cn('text-xs text-right tabular-nums', Number(o.net_profit) >= 0 ? 'text-success' : 'text-destructive')}>
                          R$ {Number(o.net_profit).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={o.payment_status === 'approved' ? 'default' : o.payment_status === 'pending' ? 'secondary' : 'destructive'}
                            className={cn('text-[9px] px-1.5', o.payment_status === 'approved' && 'bg-success/20 text-success border-success/30 hover:bg-success/30')}>
                            {o.payment_status === 'approved' ? 'Aprovado' : o.payment_status === 'pending' ? 'Pendente' : o.payment_status === 'refused' ? 'Recusado' : o.payment_status === 'refunded' ? 'Reembolso' : 'Chargeback'}
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
        </>
      )}
    </DashboardLayout>
  );
};

export default Index;
