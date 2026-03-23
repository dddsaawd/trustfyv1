import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { campaigns } from '@/data/mock';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const platformMetrics = [
  { name: 'Meta Ads', spend: 2700, sales: 125, revenue: 15820, profit: 7220, roas: 5.86, color: 'hsl(217, 91%, 60%)' },
  { name: 'Google Ads', spend: 720, sales: 27, revenue: 3480, profit: 1340, roas: 4.83, color: 'hsl(25, 95%, 53%)' },
  { name: 'TikTok Ads', spend: 620, sales: 15, revenue: 2120, profit: 680, roas: 3.42, color: 'hsl(280, 65%, 60%)' },
  { name: 'Kwai Ads', spend: 178, sales: 5, revenue: 413, profit: -42, roas: 2.32, color: 'hsl(152, 69%, 45%)' },
];

const Trafego = () => {
  return (
    <DashboardLayout title="Tráfego">
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

      {/* ROAS by Platform Chart */}
      <Card className="border-border mb-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">ROAS por Plataforma</CardTitle>
        </CardHeader>
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
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Performance por Campanha</CardTitle>
        </CardHeader>
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
                {campaigns.map((c, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="text-xs font-medium max-w-[200px] truncate">{c.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.platform}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">R$ {c.spend.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">{c.impressions.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">R$ {c.cpm.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">{c.ctr.toFixed(2)}%</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">R$ {c.cpc.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{c.cpa.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{c.conversions}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">R$ {c.revenue.toLocaleString()}</TableCell>
                    <TableCell className={cn('text-xs text-right tabular-nums font-medium', c.profit >= 0 ? 'text-success' : 'text-destructive')}>R$ {c.profit.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{c.roas.toFixed(2)}x</TableCell>
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
