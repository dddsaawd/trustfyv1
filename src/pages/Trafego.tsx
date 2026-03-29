import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';
import { Database, Inbox } from 'lucide-react';

const Trafego = () => {
  const { user } = useAuth();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('*').order('spend', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const hasRealData = campaigns && campaigns.length > 0;

  const platformMetrics = useMemo(() => {
    if (!hasRealData || !campaigns) return [];
    const platformMap: Record<string, { name: string; spend: number; sales: number; revenue: number; profit: number }> = {};
    campaigns.forEach((c: any) => {
      const key = c.platform;
      if (!platformMap[key]) platformMap[key] = { name: `${key} Ads`, spend: 0, sales: 0, revenue: 0, profit: 0 };
      platformMap[key].spend += Number(c.spend || 0);
      platformMap[key].sales += Number(c.conversions || 0);
      platformMap[key].revenue += Number(c.revenue || 0);
      platformMap[key].profit += Number(c.profit || 0);
    });
    return Object.values(platformMap).map(p => ({ ...p, roas: p.spend > 0 ? p.revenue / p.spend : 0 }));
  }, [hasRealData, campaigns]);

  if (!hasRealData && !isLoading) {
    return (
      <DashboardLayout title="Tráfego">
        <Card className="border-border">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <Inbox className="h-16 w-16 text-muted-foreground/20" />
              <h3 className="text-lg font-semibold text-foreground">Nenhuma campanha registrada</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                As campanhas aparecerão aqui quando você integrar suas plataformas de ads (Meta, Google, TikTok) ou enviar dados via webhook.
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Tráfego">
      <div className="flex items-center gap-1.5 mb-3">
        <Badge variant="outline" className="text-[9px] gap-1 bg-success/10 text-success border-success/30"><Database className="h-2.5 w-2.5" /> Dados Reais</Badge>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {platformMetrics.map((p, i) => (
          <Card key={i} className="border-border animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-foreground">{p.name}</span>
                <Badge variant={p.roas >= 4 ? 'default' : p.roas >= 2.5 ? 'secondary' : 'destructive'}
                  className={cn('text-[9px]', p.roas >= 4 && 'bg-success/20 text-success border-success/30 hover:bg-success/30')}>
                  {p.roas.toFixed(2)}x
                </Badge>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Investido</span><span className="tabular-nums">R$ {p.spend.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Vendas</span><span className="tabular-nums">{p.sales}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Receita</span><span className="tabular-nums">R$ {p.revenue.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Lucro</span><span className={cn('tabular-nums font-medium', p.profit >= 0 ? 'text-success' : 'text-destructive')}>R$ {p.profit.toLocaleString()}</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ROAS Chart */}
      <Card className="border-border mb-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">ROAS por Plataforma</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={platformMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224, 20%, 16%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={{ background: 'hsl(221, 39%, 11%)', border: '1px solid hsl(224, 20%, 18%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(210, 20%, 92%)' }} />
              <Bar dataKey="roas" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} name="ROAS" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card className="border-border animate-fade-in" style={{ animationDelay: '350ms' }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Performance por Campanha</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px]">Campanha</TableHead>
                  <TableHead className="text-[11px]">Plataforma</TableHead>
                  <TableHead className="text-[11px] text-right">Gasto</TableHead>
                  <TableHead className="text-[11px] text-right">Impressões</TableHead>
                  <TableHead className="text-[11px] text-right">CPM</TableHead>
                  <TableHead className="text-[11px] text-right">CTR</TableHead>
                  <TableHead className="text-[11px] text-right">CPC</TableHead>
                  <TableHead className="text-[11px] text-right">CPA</TableHead>
                  <TableHead className="text-[11px] text-right">Vendas</TableHead>
                  <TableHead className="text-[11px] text-right">Receita</TableHead>
                  <TableHead className="text-[11px] text-right">Lucro</TableHead>
                  <TableHead className="text-[11px] text-right">ROAS</TableHead>
                  <TableHead className="text-[11px] text-center">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns!.map((c: any, i: number) => (
                  <TableRow key={c.id || i} className="border-border">
                    <TableCell className="text-xs font-medium max-w-[200px] truncate">{c.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.platform}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">R$ {Number(c.spend || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">{Number(c.impressions || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">R$ {Number(c.cpm || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">{Number(c.ctr || 0).toFixed(2)}%</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">R$ {Number(c.cpc || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{Number(c.cpa || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{c.conversions || 0}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">R$ {Number(c.revenue || 0).toLocaleString()}</TableCell>
                    <TableCell className={cn('text-xs text-right tabular-nums font-medium', Number(c.profit || 0) >= 0 ? 'text-success' : 'text-destructive')}>R$ {Number(c.profit || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{Number(c.roas || 0).toFixed(2)}x</TableCell>
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
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Trafego;
