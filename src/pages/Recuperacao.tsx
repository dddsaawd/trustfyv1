import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { recoveryData } from '@/data/mock';
import { cn } from '@/lib/utils';
import { RotateCcw, DollarSign, Clock, TrendingUp } from 'lucide-react';

const kpis = [
  { label: 'Recuperações Enviadas', value: recoveryData.sent.toString(), icon: RotateCcw },
  { label: 'Vendas Recuperadas', value: recoveryData.recovered.toString(), icon: TrendingUp },
  { label: 'Valor Recuperado', value: `R$ ${recoveryData.value_recovered.toLocaleString()}`, icon: DollarSign },
  { label: 'Taxa de Recuperação', value: `${recoveryData.rate}%`, icon: TrendingUp },
  { label: 'Melhor Janela', value: recoveryData.best_window, icon: Clock },
];

const Recuperacao = () => {
  return (
    <DashboardLayout title="Recuperação">
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
              {recoveryData.channels.map((ch, i) => (
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
