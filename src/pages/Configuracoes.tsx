import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { topProducts } from '@/data/mock';

const Configuracoes = () => {
  return (
    <DashboardLayout title="Configurações">
      <Tabs defaultValue="products" className="animate-fade-in">
        <TabsList className="bg-secondary mb-4">
          <TabsTrigger value="products" className="text-xs">Produtos</TabsTrigger>
          <TabsTrigger value="costs" className="text-xs">Taxas e Custos</TabsTrigger>
          <TabsTrigger value="goals" className="text-xs">Metas</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Produtos Cadastrados</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[11px]">Produto</TableHead>
                    <TableHead className="text-[11px]">SKU</TableHead>
                    <TableHead className="text-[11px] text-right">Custo</TableHead>
                    <TableHead className="text-[11px] text-right">Preço</TableHead>
                    <TableHead className="text-[11px] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((p) => (
                    <TableRow key={p.id} className="border-border">
                      <TableCell className="text-xs font-medium">{p.name}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.sku}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">R$ {p.cost.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">R$ {p.price.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-center">{p.active ? '✅' : '❌'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" size="sm" className="mt-4 text-xs">+ Adicionar Produto</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Taxas e Custos Fixos</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label className="text-xs">Taxa do Gateway (%)</Label>
                <Input defaultValue="4.99" className="h-8 text-xs bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Frete Médio (R$)</Label>
                <Input defaultValue="12.00" className="h-8 text-xs bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Impostos (%)</Label>
                <Input defaultValue="5.00" className="h-8 text-xs bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Despesas Mensais Fixas (R$)</Label>
                <Input defaultValue="530.00" className="h-8 text-xs bg-secondary" />
              </div>
              <Button size="sm" className="text-xs">Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Metas Diárias</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label className="text-xs">Meta de Faturamento (R$)</Label>
                <Input defaultValue="30000" className="h-8 text-xs bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Meta de Lucro (R$)</Label>
                <Input defaultValue="10000" className="h-8 text-xs bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Meta de Vendas</Label>
                <Input defaultValue="150" className="h-8 text-xs bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ROAS Mínimo</Label>
                <Input defaultValue="3.0" className="h-8 text-xs bg-secondary" />
              </div>
              <Button size="sm" className="text-xs">Salvar Metas</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Preferências de Notificação</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-md">
              {[
                { label: 'Nova venda aprovada', desc: 'Push ao confirmar pagamento' },
                { label: 'Pix gerado', desc: 'Notificar quando pix for gerado' },
                { label: 'Meta atingida', desc: 'Alertar ao bater metas diárias' },
                { label: 'Queda de ROAS', desc: 'Alertar quando ROAS cair abaixo do mínimo' },
                { label: 'CPA elevado', desc: 'Alertar aumento anormal de CPA' },
                { label: 'Campanha negativa', desc: 'Alertar campanhas com prejuízo' },
                { label: 'Resumo do dia', desc: 'Enviar resumo ao meio-dia e fim do dia' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
              <Button size="sm" className="text-xs">Salvar Preferências</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Configuracoes;
