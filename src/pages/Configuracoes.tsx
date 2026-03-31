import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Save, Loader2, Info, CreditCard, Truck, Receipt, PiggyBank, Percent, DollarSign, ChevronDown, Layers } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CostSettings {
  gateway_provider: string;
  gateway_fee_percent: number;
  gateway_fee_fixed: number;
  gateway_pix_fixed: number;
  gateway_pix_percent: number;
  gateway_card_percent: number;
  avg_shipping: number;
  tax_percent: number;
  monthly_fixed_expenses: number;
  chargeback_rate: number;
  refund_rate: number;
  marketplace_fee_percent: number;
  pix_discount_percent: number;
  boleto_fee: number;
  antecipation_fee_percent: number;
}

const GATEWAY_PRESETS: Record<string, { label: string; pix: number; card: number; pixFixed: number; cardFixed: number; boleto: number }> = {
  'pagar_me': { label: 'Pagar.me', pix: 1.19, card: 4.99, pixFixed: 0, cardFixed: 0.39, boleto: 3.49 },
  'mercado_pago': { label: 'Mercado Pago', pix: 0.99, card: 4.98, pixFixed: 0, cardFixed: 0, boleto: 3.49 },
  'pagseguro': { label: 'PagSeguro', pix: 0.99, card: 4.99, pixFixed: 0, cardFixed: 0, boleto: 3.49 },
  'stripe': { label: 'Stripe', pix: 0, card: 3.99, pixFixed: 0, cardFixed: 0.39, boleto: 0 },
  'appmax': { label: 'Appmax', pix: 0.99, card: 4.79, pixFixed: 0, cardFixed: 0, boleto: 2.99 },
  'yampi': { label: 'Yampi Pay', pix: 0.99, card: 4.49, pixFixed: 0, cardFixed: 0, boleto: 3.49 },
  'custom': { label: 'Personalizado', pix: 0, card: 4.99, pixFixed: 0, cardFixed: 0, boleto: 3.49 },
};

const defaultCosts: CostSettings = {
  gateway_provider: 'custom',
  gateway_fee_percent: 4.99,
  gateway_fee_fixed: 0,
  gateway_pix_fixed: 0,
  gateway_pix_percent: 0,
  gateway_card_percent: 4.99,
  avg_shipping: 12.00,
  tax_percent: 5.00,
  monthly_fixed_expenses: 530.00,
  chargeback_rate: 0,
  refund_rate: 0,
  marketplace_fee_percent: 0,
  pix_discount_percent: 0,
  boleto_fee: 3.49,
  antecipation_fee_percent: 0,
};

const CostField = ({ label, tooltip, icon: Icon, suffix, value, onChange }: {
  label: string; tooltip: string; icon: any; suffix: string;
  value: number; onChange: (v: number) => void;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <Label className="text-xs">{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-[10px]">{tooltip}</TooltipContent>
      </Tooltip>
    </div>
    <div className="relative">
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="h-8 text-xs bg-secondary pr-10"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{suffix}</span>
    </div>
  </div>
);

const Configuracoes = () => {
  const { user } = useAuth();
  const [costs, setCosts] = useState<CostSettings>(defaultCosts);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [installmentRates, setInstallmentRates] = useState<Record<number, number>>({
    2: 11.89, 3: 13.29, 4: 14.74, 5: 15.97, 6: 16.65,
    7: 16.99, 8: 17.01, 9: 17.99, 10: 18.01, 11: 18.99, 12: 23.99,
  });
  const [showInstallments, setShowInstallments] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCosts();
      fetchProducts();
      fetchInstallmentRates();
    }
  }, [user]);

  const fetchCosts = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('cost_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setCosts({
        gateway_provider: (data as any).gateway_provider || 'custom',
        gateway_fee_percent: Number(data.gateway_fee_percent),
        gateway_fee_fixed: Number(data.gateway_fee_fixed),
        gateway_pix_fixed: Number((data as any).gateway_pix_fixed ?? 0),
        gateway_pix_percent: Number((data as any).gateway_pix_percent ?? 0),
        gateway_card_percent: Number((data as any).gateway_card_percent ?? 4.99),
        avg_shipping: Number(data.avg_shipping),
        tax_percent: Number(data.tax_percent),
        monthly_fixed_expenses: Number(data.monthly_fixed_expenses),
        chargeback_rate: Number(data.chargeback_rate),
        refund_rate: Number(data.refund_rate),
        marketplace_fee_percent: Number(data.marketplace_fee_percent),
        pix_discount_percent: Number(data.pix_discount_percent),
        boleto_fee: Number(data.boleto_fee),
        antecipation_fee_percent: Number(data.antecipation_fee_percent),
      });
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const fetchInstallmentRates = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('installment_rates' as any)
      .select('installments, rate_percent')
      .eq('user_id', user.id);
    if (data && (data as any[]).length > 0) {
      const rates: Record<number, number> = {};
      for (const r of data as any[]) {
        rates[r.installments] = Number(r.rate_percent);
      }
      setInstallmentRates(prev => ({ ...prev, ...rates }));
    }
  };

  const saveInstallmentRates = async () => {
    if (!user) return;
    const rows = Object.entries(installmentRates).map(([inst, rate]) => ({
      user_id: user.id,
      installments: Number(inst),
      rate_percent: rate,
    }));
    const { error } = await (supabase.from('installment_rates' as any) as any)
      .upsert(rows, { onConflict: 'user_id,installments' });
    if (error) {
      toast.error('Erro ao salvar parcelas: ' + error.message);
    } else {
      toast.success('Taxas de parcelamento salvas!');
    }
  };

  const saveCosts = async () => {
    if (!user) return;
    setSaving(true);

    const { data: existing } = await supabase
      .from('cost_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('cost_settings')
        .update({ ...costs })
        .eq('user_id', user.id));
    } else {
      ({ error } = await supabase
        .from('cost_settings')
        .insert({ ...costs, user_id: user.id }));
    }

    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } else {
      toast.success('Custos e taxas salvos com sucesso!');
    }
    setSaving(false);
  };

  const updateCost = (key: keyof CostSettings, value: number) => {
    setCosts(prev => ({ ...prev, [key]: value }));
  };

  // Simulate ROI preview
  const sampleRevenue = 197.90;
  const gatewayFee = sampleRevenue * (costs.gateway_fee_percent / 100) + costs.gateway_fee_fixed;
  const tax = sampleRevenue * (costs.tax_percent / 100);
  const totalDeductions = gatewayFee + costs.avg_shipping + tax + 45; // 45 = sample product cost
  const netProfit = sampleRevenue - totalDeductions;
  const margin = ((netProfit / sampleRevenue) * 100);

  return (
    <DashboardLayout title="Configurações">
      <Tabs defaultValue="costs" className="animate-fade-in">
        <TabsList className="bg-secondary mb-4">
          <TabsTrigger value="costs" className="text-xs gap-1.5"><Receipt className="h-3.5 w-3.5" />Custos e Taxas</TabsTrigger>
          <TabsTrigger value="products" className="text-xs gap-1.5"><PiggyBank className="h-3.5 w-3.5" />Produtos</TabsTrigger>
          <TabsTrigger value="goals" className="text-xs gap-1.5"><DollarSign className="h-3.5 w-3.5" />Metas</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs gap-1.5"><Info className="h-3.5 w-3.5" />Notificações</TabsTrigger>
        </TabsList>

        {/* CUSTOS E TAXAS */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gateway */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Gateway de Pagamento
                </CardTitle>
                <CardDescription className="text-[10px]">Selecione seu gateway ou personalize as taxas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Gateway</Label>
                  <Select
                    value={costs.gateway_provider}
                    onValueChange={(v) => {
                      const preset = GATEWAY_PRESETS[v];
                      if (preset) {
                        setCosts(prev => ({
                          ...prev,
                          gateway_provider: v,
                          gateway_pix_percent: preset.pix,
                          gateway_card_percent: preset.card,
                          gateway_fee_fixed: preset.cardFixed,
                          gateway_pix_fixed: preset.pixFixed,
                          boleto_fee: preset.boleto,
                          gateway_fee_percent: preset.card,
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GATEWAY_PRESETS).map(([key, val]) => (
                        <SelectItem key={key} value={key} className="text-xs">{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <CostField
                  label="Taxa Pix"
                  tooltip="Percentual cobrado em transações via Pix"
                  icon={Percent}
                  suffix="%"
                  value={costs.gateway_pix_percent}
                  onChange={(v) => updateCost('gateway_pix_percent', v)}
                />
                <CostField
                  label="Taxa Cartão"
                  tooltip="Percentual cobrado em transações via cartão de crédito"
                  icon={Percent}
                  suffix="%"
                  value={costs.gateway_card_percent}
                  onChange={(v) => updateCost('gateway_card_percent', v)}
                />
                <CostField
                  label="Taxa Fixa Pix"
                  tooltip="Valor fixo cobrado por transação Pix"
                  icon={DollarSign}
                  suffix="R$"
                  value={costs.gateway_pix_fixed}
                  onChange={(v) => updateCost('gateway_pix_fixed', v)}
                />
                <CostField
                  label="Taxa Fixa Cartão"
                  tooltip="Valor fixo cobrado por transação no cartão (ex: R$ 0,39)"
                  icon={DollarSign}
                  suffix="R$"
                  value={costs.gateway_fee_fixed}
                  onChange={(v) => updateCost('gateway_fee_fixed', v)}
                />
                <CostField
                  label="Taxa Boleto"
                  tooltip="Valor fixo por boleto gerado"
                  icon={Receipt}
                  suffix="R$"
                  value={costs.boleto_fee}
                  onChange={(v) => updateCost('boleto_fee', v)}
                />
                <CostField
                  label="Taxa de Antecipação"
                  tooltip="Percentual cobrado ao antecipar recebíveis"
                  icon={Percent}
                  suffix="%"
                  value={costs.antecipation_fee_percent}
                  onChange={(v) => updateCost('antecipation_fee_percent', v)}
                />
              </CardContent>
            </Card>

            {/* Logística e Impostos */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  Logística e Impostos
                </CardTitle>
                <CardDescription className="text-[10px]">Custos de envio, impostos e taxas operacionais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <CostField
                  label="Frete Médio"
                  tooltip="Custo médio de envio por pedido"
                  icon={Truck}
                  suffix="R$"
                  value={costs.avg_shipping}
                  onChange={(v) => updateCost('avg_shipping', v)}
                />
                <CostField
                  label="Impostos"
                  tooltip="Percentual de impostos sobre faturamento (Simples, MEI, etc.)"
                  icon={Receipt}
                  suffix="%"
                  value={costs.tax_percent}
                  onChange={(v) => updateCost('tax_percent', v)}
                />
                <CostField
                  label="Taxa Marketplace"
                  tooltip="Comissão do marketplace/plataforma sobre vendas"
                  icon={Percent}
                  suffix="%"
                  value={costs.marketplace_fee_percent}
                  onChange={(v) => updateCost('marketplace_fee_percent', v)}
                />
                <CostField
                  label="Desconto Pix"
                  tooltip="Desconto oferecido para pagamentos via Pix"
                  icon={Percent}
                  suffix="%"
                  value={costs.pix_discount_percent}
                  onChange={(v) => updateCost('pix_discount_percent', v)}
                />
              </CardContent>
            </Card>

            {/* Perdas e Fixos */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-primary" />
                  Despesas e Perdas
                </CardTitle>
                <CardDescription className="text-[10px]">Custos fixos mensais e taxas de perda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <CostField
                  label="Despesas Fixas Mensais"
                  tooltip="Ferramentas, equipe, hosting, etc. Rateado por dia"
                  icon={DollarSign}
                  suffix="R$"
                  value={costs.monthly_fixed_expenses}
                  onChange={(v) => updateCost('monthly_fixed_expenses', v)}
                />
                <CostField
                  label="Taxa de Chargeback"
                  tooltip="Percentual estimado de chargebacks"
                  icon={Percent}
                  suffix="%"
                  value={costs.chargeback_rate}
                  onChange={(v) => updateCost('chargeback_rate', v)}
                />
                <CostField
                  label="Taxa de Reembolso"
                  tooltip="Percentual estimado de reembolsos"
                  icon={Percent}
                  suffix="%"
                  value={costs.refund_rate}
                  onChange={(v) => updateCost('refund_rate', v)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Preview ROI */}
          <Card className="border-border bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Simulação de Lucro (Produto de R$ 197,90 | Custo R$ 45,00)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Faturamento</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">R$ {sampleRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Taxa Gateway</p>
                  <p className="text-sm font-bold text-destructive tabular-nums">-R$ {gatewayFee.toFixed(2)}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Frete</p>
                  <p className="text-sm font-bold text-destructive tabular-nums">-R$ {costs.avg_shipping.toFixed(2)}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Impostos</p>
                  <p className="text-sm font-bold text-destructive tabular-nums">-R$ {tax.toFixed(2)}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Lucro Líquido</p>
                  <p className={`text-sm font-bold tabular-nums ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>R$ {netProfit.toFixed(2)}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Margem</p>
                  <p className={`text-sm font-bold tabular-nums ${margin >= 0 ? 'text-success' : 'text-destructive'}`}>{margin.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button size="sm" className="text-xs" onClick={saveCosts} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Salvar Custos e Taxas
          </Button>
        </TabsContent>

        {/* PRODUTOS */}
        <TabsContent value="products">
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Produtos Cadastrados</CardTitle></CardHeader>
            <CardContent>
              {products.length > 0 ? (
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
                    {products.map((p) => (
                      <TableRow key={p.id} className="border-border">
                        <TableCell className="text-xs font-medium">{p.name}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{p.sku || '—'}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">R$ {Number(p.cost).toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">R$ {Number(p.price).toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-center">
                          <Badge variant={p.active ? 'default' : 'secondary'} className={p.active ? 'bg-success/20 text-success border-success/30 text-[9px]' : 'text-[9px]'}>
                            {p.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-xs text-muted-foreground py-8 text-center">Nenhum produto cadastrado. Produtos serão criados automaticamente via webhook ou manualmente.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* METAS */}
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

        {/* NOTIFICAÇÕES */}
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
