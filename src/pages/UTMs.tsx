import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { utmData } from '@/data/mock';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const bySource = utmData.reduce((acc, row) => {
  const key = row.source;
  if (!acc[key]) acc[key] = { source: key, visits: 0, checkouts: 0, sales: 0, revenue: 0, profit: 0, spend: 0 };
  acc[key].visits += row.visits;
  acc[key].checkouts += row.checkouts;
  acc[key].sales += row.sales;
  acc[key].revenue += row.revenue;
  acc[key].profit += row.profit;
  return acc;
}, {} as Record<string, any>);
const sourceData = Object.values(bySource);

const UTMs = () => {
  return (
    <DashboardLayout title="UTMs e Atribuição">
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-[11px]">Fonte</TableHead>
                      <TableHead className="text-[11px]">Campanha</TableHead>
                      <TableHead className="text-[11px] text-right">Visitas</TableHead>
                      <TableHead className="text-[11px] text-right">Checkouts</TableHead>
                      <TableHead className="text-[11px] text-right">Vendas</TableHead>
                      <TableHead className="text-[11px] text-right">Faturamento</TableHead>
                      <TableHead className="text-[11px] text-right">Lucro</TableHead>
                      <TableHead className="text-[11px] text-right">ROAS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utmData.map((row, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell className="text-xs text-muted-foreground">{row.source}</TableCell>
                        <TableCell className="text-xs font-medium">{row.campaign}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{row.visits.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{row.checkouts.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{row.sales}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">R$ {row.revenue.toLocaleString()}</TableCell>
                        <TableCell className={cn('text-xs text-right tabular-nums font-medium', row.profit >= 0 ? 'text-success' : 'text-destructive')}>R$ {row.profit.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{row.roas.toFixed(2)}x</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="source">
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Performance por utm_source</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-[11px]">Fonte</TableHead>
                      <TableHead className="text-[11px] text-right">Visitas</TableHead>
                      <TableHead className="text-[11px] text-right">Checkouts</TableHead>
                      <TableHead className="text-[11px] text-right">Vendas</TableHead>
                      <TableHead className="text-[11px] text-right">Faturamento</TableHead>
                      <TableHead className="text-[11px] text-right">Lucro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sourceData.map((row: any, i: number) => (
                      <TableRow key={i} className="border-border">
                        <TableCell className="text-xs font-medium capitalize">{row.source}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{row.visits.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{row.checkouts.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{row.sales}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">R$ {row.revenue.toLocaleString()}</TableCell>
                        <TableCell className={cn('text-xs text-right tabular-nums font-medium', row.profit >= 0 ? 'text-success' : 'text-destructive')}>R$ {row.profit.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Performance por utm_content</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-[11px]">Conteúdo</TableHead>
                      <TableHead className="text-[11px] text-right">Vendas</TableHead>
                      <TableHead className="text-[11px] text-right">Faturamento</TableHead>
                      <TableHead className="text-[11px] text-right">Lucro</TableHead>
                      <TableHead className="text-[11px] text-right">ROAS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utmData.filter(r => r.content).map((row, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell className="text-xs font-medium">{row.content}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{row.sales}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">R$ {row.revenue.toLocaleString()}</TableCell>
                        <TableCell className={cn('text-xs text-right tabular-nums font-medium', row.profit >= 0 ? 'text-success' : 'text-destructive')}>R$ {row.profit.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{row.roas.toFixed(2)}x</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default UTMs;
