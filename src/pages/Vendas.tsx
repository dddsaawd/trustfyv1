import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { recentOrders as mockOrders, funnelData as mockFunnel } from '@/data/mock';
import { cn } from '@/lib/utils';
import { Search, Database, HardDrive } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useMemo } from 'react';

const Vendas = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const hasRealData = orders && orders.length > 0;
  const displayOrders = hasRealData ? orders : mockOrders;

  const filtered = useMemo(() => {
    return displayOrders.filter((o: any) => {
      if (statusFilter !== 'all' && o.payment_status !== statusFilter) return false;
      if (methodFilter !== 'all' && o.payment_method !== methodFilter) return false;
      if (search && !o.order_number?.toLowerCase().includes(search.toLowerCase()) && !o.customer_name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [displayOrders, statusFilter, methodFilter, search]);

  const funnelData = useMemo(() => {
    if (!hasRealData) return mockFunnel;
    const total = orders.length;
    const approved = orders.filter((o: any) => o.payment_status === 'approved').length;
    const pending = orders.filter((o: any) => o.payment_status === 'pending').length;
    const refused = orders.filter((o: any) => o.payment_status === 'refused').length;
    return [
      { stage: 'Total Pedidos', value: total, percentage: 100 },
      { stage: 'Aprovados', value: approved, percentage: total ? Math.round((approved / total) * 100) : 0 },
      { stage: 'Pendentes', value: pending, percentage: total ? Math.round((pending / total) * 100) : 0 },
      { stage: 'Recusados', value: refused, percentage: total ? Math.round((refused / total) * 100) : 0 },
    ];
  }, [hasRealData, orders]);

  return (
    <DashboardLayout title="Vendas">
      {/* Data Source Indicator */}
      <div className="flex items-center gap-1.5 mb-3">
        {hasRealData ? (
          <Badge variant="outline" className="text-[9px] gap-1 bg-success/10 text-success border-success/30">
            <Database className="h-2.5 w-2.5" /> Dados Reais ({orders.length} pedidos)
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[9px] gap-1 bg-warning/10 text-warning border-warning/30">
            <HardDrive className="h-2.5 w-2.5" /> Dados Demonstração
          </Badge>
        )}
      </div>

      {/* Funnel */}
      <Card className="border-border mb-6 animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            {funnelData.map((stage: any, i: number) => (
              <div key={i} className="flex-1 rounded-lg bg-secondary p-4 text-center relative animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">{stage.stage}</p>
                <p className="text-xl font-bold text-foreground tabular-nums">{stage.value.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground tabular-nums">{stage.percentage}%</p>
                {i < funnelData.length - 1 && <span className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-muted-foreground/30 text-lg z-10">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar pedido..." className="h-8 w-[200px] pl-8 text-xs bg-secondary" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="refused">Recusado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Métodos</SelectItem>
            <SelectItem value="pix">Pix</SelectItem>
            <SelectItem value="credit_card">Cartão</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card className="border-border animate-fade-in" style={{ animationDelay: '300ms' }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px]">Pedido</TableHead>
                  <TableHead className="text-[11px]">Data</TableHead>
                  <TableHead className="text-[11px]">Cliente</TableHead>
                  <TableHead className="text-[11px]">Produto</TableHead>
                  <TableHead className="text-[11px]">Plataforma</TableHead>
                  <TableHead className="text-[11px]">Campanha</TableHead>
                  <TableHead className="text-[11px] text-right">Valor Bruto</TableHead>
                  <TableHead className="text-[11px] text-right">Custo Prod.</TableHead>
                  <TableHead className="text-[11px] text-right">Taxa GW</TableHead>
                  <TableHead className="text-[11px] text-right">Custo Ads</TableHead>
                  <TableHead className="text-[11px] text-right">Lucro Líq.</TableHead>
                  <TableHead className="text-[11px] text-center">Status</TableHead>
                  <TableHead className="text-[11px]">Método</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o: any, i: number) => (
                  <TableRow key={o.id || i} className="border-border">
                    <TableCell className="text-xs font-mono text-muted-foreground">{o.order_number}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(o.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell className="text-xs">{o.customer_name}</TableCell>
                    <TableCell className="text-xs max-w-[120px] truncate">{o.product_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.platform || '-'}</TableCell>
                    <TableCell className="text-xs max-w-[140px] truncate text-muted-foreground">{o.campaign_name || '-'}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">R$ {(o.gross_value || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">R$ {(o.product_cost || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">R$ {(o.gateway_fee || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">R$ {(o.ads_cost_attributed || 0).toFixed(2)}</TableCell>
                    <TableCell className={cn('text-xs text-right tabular-nums font-medium', (o.net_profit || 0) >= 0 ? 'text-success' : 'text-destructive')}>
                      R$ {(o.net_profit || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={o.payment_status === 'approved' ? 'default' : o.payment_status === 'pending' ? 'secondary' : 'destructive'}
                        className={cn('text-[9px] px-1.5', o.payment_status === 'approved' && 'bg-success/20 text-success border-success/30 hover:bg-success/30')}>
                        {o.payment_status === 'approved' ? 'Aprovado' : o.payment_status === 'pending' ? 'Pendente' : o.payment_status === 'refunded' ? 'Reembolsado' : 'Recusado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground capitalize">{o.payment_method === 'credit_card' ? 'Cartão' : o.payment_method}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={13} className="text-center text-xs text-muted-foreground py-8">Nenhum pedido encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Vendas;
