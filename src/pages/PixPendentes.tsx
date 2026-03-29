import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, DollarSign, Database, Inbox } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PixPendentes = () => {
  const { user } = useAuth();

  const { data: pixList, isLoading } = useQuery({
    queryKey: ['pix_pending', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('pix_pending').select('*').eq('status', 'pending').order('generated_at', { ascending: false });
      if (error) throw error;
      return data.map((p: any) => ({
        ...p,
        minutes_open: p.minutes_open || Math.round((Date.now() - new Date(p.generated_at).getTime()) / 60000),
      }));
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const hasRealData = pixList && pixList.length > 0;

  if (!hasRealData && !isLoading) {
    return (
      <DashboardLayout title="Pix Pendentes">
        <Card className="border-border">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <Inbox className="h-16 w-16 text-muted-foreground/20" />
              <h3 className="text-lg font-semibold text-foreground">Nenhum Pix pendente</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Os Pix pendentes aparecerão aqui automaticamente quando recebidos via webhook (evento pix.generated).
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const displayPix = pixList || [];
  const totalPending = displayPix.reduce((a: number, b: any) => a + Number(b.value || 0), 0);
  const avgMinutes = displayPix.length > 0 ? Math.round(displayPix.reduce((a: number, b: any) => a + (b.minutes_open || 0), 0) / displayPix.length) : 0;
  const urgentCount = displayPix.filter((p: any) => (p.minutes_open || 0) > 60).length;

  const kpis = [
    { label: 'Pix Pendentes', value: displayPix.length.toString(), icon: Clock, color: 'text-warning' },
    { label: 'Valor Total Pendente', value: `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-warning' },
    { label: 'Tempo Médio Aberto', value: `${avgMinutes} min`, icon: Clock, color: 'text-muted-foreground' },
    { label: 'Urgentes (>60 min)', value: urgentCount.toString(), icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <DashboardLayout title="Pix Pendentes">
      <div className="flex items-center gap-1.5 mb-3">
        <Badge variant="outline" className="text-[9px] gap-1 bg-success/10 text-success border-success/30"><Database className="h-2.5 w-2.5" /> Dados Reais</Badge>
      </div>

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

      {urgentCount > 0 && (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 flex items-center gap-2 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{urgentCount} pix pendentes há mais de 60 minutos. Considere acionar recuperação.</p>
        </div>
      )}

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
                {displayPix.map((pix: any, i: number) => (
                  <TableRow key={pix.id || i} className={cn('border-border', (pix.minutes_open || 0) > 60 && 'bg-destructive/5')}>
                    <TableCell className="text-xs font-medium">{pix.customer_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{pix.customer_phone || '-'}</TableCell>
                    <TableCell className="text-xs max-w-[140px] truncate">{pix.product_name}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-medium">R$ {Number(pix.value || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs max-w-[160px] truncate text-muted-foreground">{pix.campaign_name || '-'}</TableCell>
                    <TableCell className={cn('text-xs text-right tabular-nums', (pix.minutes_open || 0) > 60 ? 'text-destructive font-medium' : (pix.minutes_open || 0) > 30 ? 'text-warning' : 'text-muted-foreground')}>
                      {pix.minutes_open || 0} min
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={cn('text-[9px] px-1.5', (pix.minutes_open || 0) > 60 ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-warning/20 text-warning border-warning/30')}>
                        {(pix.minutes_open || 0) > 60 ? 'Urgente' : 'Aguardando'}
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
