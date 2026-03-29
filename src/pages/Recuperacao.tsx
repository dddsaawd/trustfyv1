import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { RotateCcw, DollarSign, Clock, TrendingUp, Database, Inbox } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

const Recuperacao = () => {
  const { user } = useAuth();

  const { data: recoveries, isLoading } = useQuery({
    queryKey: ['recoveries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('recoveries').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const hasRealData = recoveries && recoveries.length > 0;

  const stats = useMemo(() => {
    if (!hasRealData || !recoveries) return null;
    const sent = recoveries.length;
    const converted = recoveries.filter((r: any) => r.converted).length;
    const valueRecovered = recoveries.filter((r: any) => r.converted).reduce((s: number, r: any) => s + Number(r.value || 0), 0);
    const rate = sent > 0 ? Math.round((converted / sent) * 100) : 0;

    const channelMap: Record<string, { name: string; sent: number; converted: number; value: number }> = {};
    recoveries.forEach((r: any) => {
      const ch = r.channel;
      if (!channelMap[ch]) channelMap[ch] = { name: ch === 'whatsapp' ? 'WhatsApp' : ch === 'push' ? 'Push' : ch === 'email' ? 'E-mail' : 'SMS', sent: 0, converted: 0, value: 0 };
      channelMap[ch].sent++;
      if (r.converted) { channelMap[ch].converted++; channelMap[ch].value += Number(r.value || 0); }
    });
    const channels = Object.values(channelMap).map(c => ({ ...c, rate: c.sent > 0 ? Math.round((c.converted / c.sent) * 100) : 0 }));

    return { sent, recovered: converted, value_recovered: valueRecovered, rate, best_window: '5-15 min', channels };
  }, [hasRealData, recoveries]);

  if (!hasRealData && !isLoading) {
    return (
      <DashboardLayout title="Recuperação">
        <Card className="border-border">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <Inbox className="h-16 w-16 text-muted-foreground/20" />
              <h3 className="text-lg font-semibold text-foreground">Nenhuma recuperação registrada</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                As tentativas de recuperação de vendas aparecerão aqui quando configuradas.
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!stats) return <DashboardLayout title="Recuperação"><div /></DashboardLayout>;

  const kpis = [
    { label: 'Recuperações Enviadas', value: stats.sent.toString(), icon: RotateCcw },
    { label: 'Vendas Recuperadas', value: stats.recovered.toString(), icon: TrendingUp },
    { label: 'Valor Recuperado', value: `R$ ${stats.value_recovered.toLocaleString()}`, icon: DollarSign },
    { label: 'Taxa de Recuperação', value: `${stats.rate}%`, icon: TrendingUp },
    { label: 'Melhor Janela', value: stats.best_window, icon: Clock },
  ];

  return (
    <DashboardLayout title="Recuperação">
      <div className="flex items-center gap-1.5 mb-3">
        <Badge variant="outline" className="text-[9px] gap-1 bg-success/10 text-success border-success/30"><Database className="h-2.5 w-2.5" /> Dados Reais</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-border animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border animate-fade-in" style={{ animationDelay: '350ms' }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Performance por Canal</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[11px]">Canal</TableHead>
                <TableHead className="text-[11px] text-right">Enviadas</TableHead>
                <TableHead className="text-[11px] text-right">Convertidas</TableHead>
                <TableHead className="text-[11px] text-right">Taxa</TableHead>
                <TableHead className="text-[11px] text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.channels.map((ch: any, i: number) => (
                <TableRow key={i} className="border-border">
                  <TableCell className="text-xs font-medium">{ch.name}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{ch.sent}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums text-success">{ch.converted}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{ch.rate}%</TableCell>
                  <TableCell className="text-xs text-right tabular-nums font-medium text-success">R$ {ch.value.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Recuperacao;
