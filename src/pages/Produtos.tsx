import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Database, Inbox } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

const Produtos = () => {
  const { user } = useAuth();

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: orders } = useQuery({
    queryKey: ['orders-products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('product_name, gross_value, net_profit, payment_status');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const hasProducts = products && products.length > 0;

  const productMetrics = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const map: Record<string, { name: string; revenue: number; units: number; profit: number }> = {};
    orders.forEach((o: any) => {
      if (o.payment_status !== 'approved') return;
      const name = o.product_name;
      if (!map[name]) map[name] = { name, revenue: 0, units: 0, profit: 0 };
      map[name].revenue += Number(o.gross_value || 0);
      map[name].units += 1;
      map[name].profit += Number(o.net_profit || 0);
    });
    return Object.values(map)
      .map(p => ({ ...p, margin: p.revenue > 0 ? Math.round((p.profit / p.revenue) * 1000) / 10 : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const hasMetrics = productMetrics.length > 0;

  if (!hasProducts && !hasMetrics && !loadingProducts) {
    return (
      <DashboardLayout title="Produtos">
        <Card className="border-border">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <Inbox className="h-16 w-16 text-muted-foreground/20" />
              <h3 className="text-lg font-semibold text-foreground">Nenhum produto cadastrado</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Produtos serão criados automaticamente via webhook ou podem ser cadastrados nas Configurações.
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Produtos">
      <div className="flex items-center gap-1.5 mb-3">
        {hasMetrics && (
          <Badge variant="outline" className="text-[9px] gap-1 bg-success/10 text-success border-success/30"><Database className="h-2.5 w-2.5" /> Dados Reais</Badge>
        )}
      </div>

      {/* Revenue by Product Chart */}
      {hasMetrics && (
        <Card className="border-border mb-6 animate-fade-in">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Receita por Produto</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={productMetrics} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224, 20%, 16%)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ background: 'hsl(221, 39%, 11%)', border: '1px solid hsl(224, 20%, 18%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(210, 20%, 92%)' }} />
                <Bar dataKey="revenue" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Full Table */}
      <Card className="border-border animate-fade-in" style={{ animationDelay: '200ms' }}>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{hasMetrics ? 'Ranking por Performance' : 'Produtos Cadastrados'}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px]">#</TableHead>
                  <TableHead className="text-[11px]">Produto</TableHead>
                  {hasMetrics ? (
                    <>
                      <TableHead className="text-[11px] text-right">Receita</TableHead>
                      <TableHead className="text-[11px] text-right">Unidades</TableHead>
                      <TableHead className="text-[11px] text-right">Lucro</TableHead>
                      <TableHead className="text-[11px] text-right">Margem</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="text-[11px]">SKU</TableHead>
                      <TableHead className="text-[11px] text-right">Custo</TableHead>
                      <TableHead className="text-[11px] text-right">Preço</TableHead>
                      <TableHead className="text-[11px] text-center">Status</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {hasMetrics ? productMetrics.map((p, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="text-xs font-bold text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="text-xs font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">R$ {p.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{p.units}</TableCell>
                    <TableCell className={cn('text-xs text-right tabular-nums font-medium', p.profit >= 0 ? 'text-success' : 'text-destructive')}>R$ {p.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">{p.margin}%</TableCell>
                  </TableRow>
                )) : products?.map((p: any, i: number) => (
                  <TableRow key={p.id} className="border-border">
                    <TableCell className="text-xs font-bold text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="text-xs font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.sku || '—'}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">R$ {Number(p.cost).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">R$ {Number(p.price).toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={p.active ? 'default' : 'secondary'} className={cn('text-[9px]', p.active && 'bg-success/20 text-success border-success/30')}>
                        {p.active ? 'Ativo' : 'Inativo'}
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

export default Produtos;
