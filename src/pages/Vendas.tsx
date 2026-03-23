import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { recentOrders, funnelData } from '@/data/mock';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

const Vendas = () => {
  return (
    <DashboardLayout title="Vendas">
      {/* Funnel */}
      <Card className="border-border mb-6 animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            {funnelData.map((stage, i) => (
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
          <Input placeholder="Buscar pedido..." className="h-8 w-[200px] pl-8 text-xs bg-secondary" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="h-8 w-[140px] text-xs bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="refused">Recusado</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
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
                {recentOrders.map((o, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="text-xs font-mono text-muted-foreground">{o.order_number}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(o.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell className="text-xs">{o.customer_name}</TableCell>
                    <TableCell className="text-xs max-w-[120px] truncate">{o.product_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.platform}</TableCell>
                    <TableCell className="text-xs max-w-[140px] truncate text-muted-foreground">{o.campaign_name}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums">R$ {o.gross_value.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">R$ {o.product_cost.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">R$ {o.gateway_fee.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">R$ {o.ads_cost_attributed.toFixed(2)}</TableCell>
                    <TableCell className={cn('text-xs text-right tabular-nums font-medium', o.net_profit >= 0 ? 'text-success' : 'text-destructive')}>
                      R$ {o.net_profit.toFixed(2)}
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

export default Vendas;
