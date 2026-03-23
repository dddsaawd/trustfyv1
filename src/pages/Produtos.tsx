import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { topProductsMetrics } from '@/data/mock';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const extendedProducts = topProductsMetrics.map((p, i) => ({
  ...p,
  units_sold: p.units,
  ticket: (p.revenue / p.units).toFixed(2),
  cost_total: (p.revenue - p.profit) * 0.4,
  roi: ((p.profit / (p.revenue - p.profit)) * 100).toFixed(1),
  approval_rate: [82.4, 76.8, 84.1, 79.2, 71.3][i],
  refund_rate: [2.1, 3.4, 1.8, 2.9, 4.2][i],
  trend: i < 3 ? 'up' : i === 3 ? 'stable' : 'down',
}));

const Produtos = () => {
  return (
    <DashboardLayout title="Produtos">
      {/* Product Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {extendedProducts.slice(0, 3).map((p, i) => (
          <Card key={i} className="border-border animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.units} unidades vendidas</p>
                </div>
                <Badge variant="outline" className={cn('text-[9px]', p.trend === 'up' ? 'text-success border-success/30' : p.trend === 'down' ? 'text-destructive border-destructive/30' : 'text-warning border-warning/30')}>
                  {p.trend === 'up' ? <TrendingUp className="h-2.5 w-2.5 mr-1" /> : p.trend === 'down' ? <TrendingDown className="h-2.5 w-2.5 mr-1" /> : <AlertTriangle className="h-2.5 w-2.5 mr-1" />}
                  {p.trend === 'up' ? 'Alta' : p.trend === 'down' ? 'Queda' : 'Estável'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Receita</span><p className="font-semibold tabular-nums">R$ {p.revenue.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Lucro</span><p className="font-semibold tabular-nums text-success">R$ {p.profit.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Margem</span><p className="font-semibold tabular-nums">{p.margin}%</p></div>
                <div><span className="text-muted-foreground">ROAS</span><p className="font-semibold tabular-nums">{p.roas}x</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue by Product Chart */}
      <Card className="border-border mb-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Receita por Produto</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProductsMetrics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224, 20%, 16%)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={{ background: 'hsl(221, 39%, 11%)', border: '1px solid hsl(224, 20%, 18%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(210, 20%, 92%)' }} />
              <Bar dataKey="revenue" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Full Table */}
      <Card className="border-border animate-fade-in" style={{ animationDelay: '400ms' }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Ranking Completo</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px]">#</TableHead>
                  <TableHead className="text-[11px]">Produto</TableHead>
                  <TableHead className="text-[11px] text-right">Receita</TableHead>
                  <TableHead className="text-[11px] text-right">Unidades</TableHead>
                  <TableHead className="text-[11px] text-right">Ticket</TableHead>
                  <TableHead className="text-[11px] text-right">Lucro</TableHead>
                  <TableHead className="text-[11px] text-right">Margem</TableHead>
                  <TableHead className="text-[11px] text-right">ROI</TableHead>
                  <TableHead className="text-[11px] text-right">Aprovação</TableHead>
                  <TableHead className="text-[11px] text-right">Reembolso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extendedProducts.map((p, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="text-xs font-bold text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="text-xs font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">R$ {p.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{p.units}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">R$ {p.ticket}</TableCell>
                    <TableCell className={cn('text-xs text-right tabular-nums font-medium', p.profit >= 0 ? 'text-success' : 'text-destructive')}>R$ {p.profit.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{p.margin}%</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{p.roi}%</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{p.approval_rate}%</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">{p.refund_rate}%</TableCell>
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

export default Produtos;
