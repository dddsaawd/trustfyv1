import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { utmData as mockUtm } from '@/data/mock';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';
import { Database, HardDrive } from 'lucide-react';

const UTMs = () => {
  const { user } = useAuth();

  const { data: utmEvents } = useQuery({
    queryKey: ['utm_events', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('utm_events').select('*').order('revenue', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const hasRealData = utmEvents && utmEvents.length > 0;
  const displayData = hasRealData ? utmEvents.map((e: any) => ({
    source: e.source || '', campaign: e.campaign || '', content: e.content || '', term: e.term || '',
    visits: e.visits || 0, checkouts: e.checkouts || 0, sales: e.sales || 0,
    revenue: Number(e.revenue || 0), profit: Number(e.profit || 0), roas: Number(e.roas || 0),
  })) : mockUtm;

  const sourceData = useMemo(() => {
    const map: Record<string, any> = {};
    displayData.forEach((row: any) => {
      const key = row.source;
      if (!map[key]) map[key] = { source: key, visits: 0, checkouts: 0, sales: 0, revenue: 0, profit: 0 };
      map[key].visits += row.visits;
      map[key].checkouts += row.checkouts;
      map[key].sales += row.sales;
      map[key].revenue += row.revenue;
      map[key].profit += row.profit;
    });
    return Object.values(map);
  }, [displayData]);

  const renderTable = (data: any[], columns: { key: string; label: string; align?: string; format?: (v: any, row: any) => string; colorProfit?: boolean }[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            {columns.map(col => <TableHead key={col.key} className={cn('text-[11px]', col.align === 'right' && 'text-right')}>{col.label}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: any, i: number) => (
            <TableRow key={i} className="border-border">
              {columns.map(col => (
                <TableCell key={col.key} className={cn('text-xs tabular-nums', col.align === 'right' && 'text-right', col.colorProfit && (row[col.key] >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'))}>
                  {col.format ? col.format(row[col.key], row) : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {data.length === 0 && <TableRow><TableCell colSpan={columns.length} className="text-center text-xs text-muted-foreground py-8">Sem dados</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <DashboardLayout title="UTMs e Atribuição">
      <div className="flex items-center gap-1.5 mb-3">
        {hasRealData ? (
          <Badge variant="outline" className="text-[9px] gap-1 bg-success/10 text-success border-success/30"><Database className="h-2.5 w-2.5" /> Dados Reais</Badge>
        ) : (
          <Badge variant="outline" className="text-[9px] gap-1 bg-warning/10 text-warning border-warning/30"><HardDrive className="h-2.5 w-2.5" /> Dados Demonstração</Badge>
        )}
      </div>

      <Tabs defaultValue="campaigns" className="animate-fade-in">
        <TabsList className="bg-secondary mb-4">
          <TabsTrigger value="campaigns" className="text-xs">Por Campanha</TabsTrigger>
          <TabsTrigger value="source" className="text-xs">Por Fonte</TabsTrigger>
          <TabsTrigger value="content" className="text-xs">Por Conteúdo</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Performance por utm_campaign</CardTitle></CardHeader>
            <CardContent className="p-0">
              {renderTable(displayData, [
                { key: 'source', label: 'Fonte' },
                { key: 'campaign', label: 'Campanha' },
                { key: 'visits', label: 'Visitas', align: 'right', format: v => v.toLocaleString() },
                { key: 'checkouts', label: 'Checkouts', align: 'right', format: v => v.toLocaleString() },
                { key: 'sales', label: 'Vendas', align: 'right' },
                { key: 'revenue', label: 'Faturamento', align: 'right', format: v => `R$ ${v.toLocaleString()}` },
                { key: 'profit', label: 'Lucro', align: 'right', format: v => `R$ ${v.toLocaleString()}`, colorProfit: true },
                { key: 'roas', label: 'ROAS', align: 'right', format: v => `${v.toFixed(2)}x` },
              ])}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="source">
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Performance por utm_source</CardTitle></CardHeader>
            <CardContent className="p-0">
              {renderTable(sourceData, [
                { key: 'source', label: 'Fonte' },
                { key: 'visits', label: 'Visitas', align: 'right', format: v => v.toLocaleString() },
                { key: 'checkouts', label: 'Checkouts', align: 'right', format: v => v.toLocaleString() },
                { key: 'sales', label: 'Vendas', align: 'right' },
                { key: 'revenue', label: 'Faturamento', align: 'right', format: v => `R$ ${v.toLocaleString()}` },
                { key: 'profit', label: 'Lucro', align: 'right', format: v => `R$ ${v.toLocaleString()}`, colorProfit: true },
              ])}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Performance por utm_content</CardTitle></CardHeader>
            <CardContent className="p-0">
              {renderTable(displayData.filter((r: any) => r.content), [
                { key: 'content', label: 'Conteúdo' },
                { key: 'sales', label: 'Vendas', align: 'right' },
                { key: 'revenue', label: 'Faturamento', align: 'right', format: v => `R$ ${v.toLocaleString()}` },
                { key: 'profit', label: 'Lucro', align: 'right', format: v => `R$ ${v.toLocaleString()}`, colorProfit: true },
                { key: 'roas', label: 'ROAS', align: 'right', format: v => `${v.toFixed(2)}x` },
              ])}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default UTMs;
