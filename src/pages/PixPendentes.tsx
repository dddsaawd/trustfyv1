import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { pixPendingData } from '@/data/mock';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, DollarSign, TrendingDown } from 'lucide-react';

const totalPending = pixPendingData.reduce((a, b) => a + b.value, 0);
const avgMinutes = Math.round(pixPendingData.reduce((a, b) => a + b.minutes_open, 0) / pixPendingData.length);
const urgentCount = pixPendingData.filter(p => p.minutes_open > 60).length;

const kpis = [
  { label: 'Pix Pendentes', value: pixPendingData.length.toString(), icon: Clock, color: 'text-warning' },
  { label: 'Valor Total Pendente', value: `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-warning' },
  { label: 'Tempo Médio Aberto', value: `${avgMinutes} min`, icon: Clock, color: 'text-muted-foreground' },
  { label: 'Urgentes (>60 min)', value: urgentCount.toString(), icon: AlertTriangle, color: 'text-destructive' },
];

const PixPendentes = () => {
  return (
    <DashboardLayout title="Pix Pendentes">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-border animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
                <kpi.icon className={cn('h-4 w-4', kpi.color)} />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Banner */}
      {urgentCount > 0 && (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 flex items-center gap-2 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{urgentCount} pix pendentes há mais de 60 minutos. Considere acionar recuperação.</p>
        </div>
      )}

      {/* Table */}
      <Card className="border-border animate-fade-in" style={{ animationDelay: '300ms' }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Pix Pendentes Detalhado</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px]">Cliente</TableHead>
                  <TableHead className="text-[11px]">Telefone</TableHead>
                  <TableHead className="text-[11px]">Produto</TableHead>
                  <TableHead className="text-[11px] text-right">Valor</TableHead>
                  <TableHead className="text-[11px]">Campanha</TableHead>
                  <TableHead className="text-[11px] text-right">Tempo Aberto</TableHead>
                  <TableHead className="text-[11px] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pixPendingData.map((pix, i) => (
                  <TableRow key={i} className={cn('border-border', pix.minutes_open > 60 && 'bg-destructive/5')}>
                    <TableCell className="text-xs font-medium">{pix.customer_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{pix.customer_phone}</TableCell>
                    <TableCell className="text-xs max-w-[140px] truncate">{pix.product_name}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-medium">R$ {pix.value.toFixed(2)}</TableCell>
                    <TableCell className="text-xs max-w-[160px] truncate text-muted-foreground">{pix.campaign_name}</TableCell>
                    <TableCell className={cn('text-xs text-right tabular-nums', pix.minutes_open > 60 ? 'text-destructive font-medium' : pix.minutes_open > 30 ? 'text-warning' : 'text-muted-foreground')}>
                      {pix.minutes_open} min
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={cn('text-[9px] px-1.5', pix.minutes_open > 60 ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-warning/20 text-warning border-warning/30')}>
                        {pix.minutes_open > 60 ? 'Urgente' : 'Aguardando'}
                      </Badge>
                    </TableCell>
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

export default PixPendentes;
