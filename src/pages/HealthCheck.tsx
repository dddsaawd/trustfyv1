import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Activity, AlertTriangle, CheckCircle2, Download, RefreshCw, Trash2, XCircle, FileWarning, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type IntegrationStatus = {
  label: string;
  ok: boolean;
  detail: string;
  lastActivity?: string | null;
};

export default function HealthCheck() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFailure, setSelectedFailure] = useState<any | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['health-check', user?.id],
    queryFn: async (): Promise<IntegrationStatus[]> => {
      if (!user) return [];

      const [lastOrder, metaIntegration, webhookIntegration, lastCampaign] = await Promise.all([
        supabase.from('orders').select('created_at, platform').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('integrations').select('status, last_sync, config').eq('user_id', user.id).eq('platform', 'meta').maybeSingle(),
        supabase.from('integrations').select('status, last_sync').eq('user_id', user.id).eq('platform', 'webhook').maybeSingle(),
        supabase.from('campaigns').select('updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      const now = Date.now();
      const hoursSince = (iso?: string | null) => iso ? (now - new Date(iso).getTime()) / 36e5 : Infinity;

      const lastOrderIso = lastOrder.data?.created_at;
      const lastWebhookIso = webhookIntegration.data?.last_sync;
      const lastMetaSync = metaIntegration.data?.last_sync;
      const lastCampaignIso = lastCampaign.data?.updated_at;

      const metaConfig = (metaIntegration.data?.config || {}) as any;
      const tokenExpiresAt = metaConfig.expires_at || metaConfig.token_expires_at;
      const tokenExpiresHours = tokenExpiresAt ? (new Date(tokenExpiresAt).getTime() - now) / 36e5 : null;

      return [
        {
          label: 'Webhook Checkout',
          ok: hoursSince(lastWebhookIso) < 24,
          detail: lastWebhookIso ? `Última entrega: ${formatDistanceToNow(new Date(lastWebhookIso), { locale: ptBR, addSuffix: true })}` : 'Nenhum webhook recebido ainda',
          lastActivity: lastWebhookIso,
        },
        {
          label: 'Última Venda',
          ok: hoursSince(lastOrderIso) < 48,
          detail: lastOrderIso ? `${formatDistanceToNow(new Date(lastOrderIso), { locale: ptBR, addSuffix: true })} · ${lastOrder.data?.platform || 'checkout'}` : 'Sem vendas registradas',
          lastActivity: lastOrderIso,
        },
        {
          label: 'Meta Ads — Conexão',
          ok: metaIntegration.data?.status === 'connected' && (tokenExpiresHours == null || tokenExpiresHours > 0),
          detail: !metaIntegration.data
            ? 'Não conectado'
            : tokenExpiresHours != null && tokenExpiresHours < 0
              ? '⚠️ Token expirado — reconectar'
              : tokenExpiresHours != null && tokenExpiresHours < 120
                ? `⚠️ Token expira em ${Math.round(tokenExpiresHours)}h`
                : `Status: ${metaIntegration.data?.status || 'desconhecido'}`,
          lastActivity: lastMetaSync,
        },
        {
          label: 'Meta Ads — Sync Campanhas',
          ok: hoursSince(lastCampaignIso) < 6,
          detail: lastCampaignIso ? `Atualizado ${formatDistanceToNow(new Date(lastCampaignIso), { locale: ptBR, addSuffix: true })}` : 'Nenhuma sincronização registrada',
          lastActivity: lastCampaignIso,
        },
      ];
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const { data: failures = [], isLoading: failuresLoading } = useQuery({
    queryKey: ['webhook-failures', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('webhook_failures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const pendingFailures = failures.filter(f => f.status === 'pending').length;

  const markResolved = async (id: string) => {
    const { error } = await supabase
      .from('webhook_failures')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return toast.error('Erro ao marcar como resolvido');
    toast.success('Marcado como resolvido');
    queryClient.invalidateQueries({ queryKey: ['webhook-failures'] });
  };

  const deleteFailure = async (id: string) => {
    const { error } = await supabase.from('webhook_failures').delete().eq('id', id);
    if (error) return toast.error('Erro ao excluir');
    toast.success('Registro excluído');
    queryClient.invalidateQueries({ queryKey: ['webhook-failures'] });
  };

  const exportOrdersCSV = async (range: 'today' | 'month' | 'all') => {
    if (!user) return;
    setExporting(true);
    try {
      let query = supabase
        .from('orders')
        .select('order_number,external_id,customer_name,customer_email,customer_phone,product_name,platform,payment_status,payment_method,gross_value,product_cost,gateway_fee,ads_cost_attributed,shipping_cost,tax,net_profit,utm_source,utm_campaign,utm_content,utm_term,city,state,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (range === 'today') {
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        query = query.gte('created_at', startOfDay.toISOString());
      } else if (range === 'month') {
        const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
        query = query.gte('created_at', startOfMonth.toISOString());
      }

      const { data, error } = await query.limit(10000);
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.info('Nenhuma venda encontrada no período');
        return;
      }

      const headers = Object.keys(data[0]);
      const escape = (v: any) => {
        if (v == null) return '';
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      };
      const csv = [headers.join(','), ...data.map(row => headers.map(h => escape((row as any)[h])).join(','))].join('\n');
      const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendas_${range}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${data.length} vendas exportadas`);
    } catch (e: any) {
      toast.error('Erro ao exportar: ' + (e?.message || e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout title="Health Check">
      <div className="space-y-6">
        {/* Status das integrações */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Status em tempo real
              </h2>
              <p className="text-xs text-muted-foreground">Atualiza a cada 60s automaticamente</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchHealth()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {healthLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
              : health?.map((h) => (
                  <Card key={h.label} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="text-xs font-medium text-muted-foreground">{h.label}</div>
                      {h.ok
                        ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                        : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    </div>
                    <div className="mt-2 text-sm font-medium text-foreground leading-snug">{h.detail}</div>
                  </Card>
                ))}
          </div>
        </section>

        {/* Export CSV */}
        <section>
          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" /> Backup / Export de Vendas
                </h3>
                <p className="text-xs text-muted-foreground">Baixe todas as vendas em CSV — abre no Excel/Sheets</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={exporting} onClick={() => exportOrdersCSV('today')}>Hoje</Button>
                <Button size="sm" variant="outline" disabled={exporting} onClick={() => exportOrdersCSV('month')}>Este mês</Button>
                <Button size="sm" disabled={exporting} onClick={() => exportOrdersCSV('all')}>Tudo</Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Dead-letter queue */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-amber-500" /> Webhooks com falha
                {pendingFailures > 0 && (
                  <Badge variant="destructive" className="ml-2">{pendingFailures} pendente(s)</Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">Toda venda que der erro no processamento fica salva aqui pra reprocessar</p>
            </div>
          </div>

          <Card className="p-0 overflow-hidden">
            {failuresLoading ? (
              <div className="p-6"><Skeleton className="h-32" /></div>
            ) : failures.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
                Nenhum webhook falhou. Tudo em ordem.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quando</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>ID Externo</TableHead>
                      <TableHead>Erro</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failures.map((f: any) => (
                      <TableRow key={f.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDistanceToNow(new Date(f.created_at), { locale: ptBR, addSuffix: true })}
                        </TableCell>
                        <TableCell><Badge variant="outline">{f.source}</Badge></TableCell>
                        <TableCell className="text-xs">{f.event_type || '—'}</TableCell>
                        <TableCell className="text-xs font-mono truncate max-w-[120px]">{f.external_id || '—'}</TableCell>
                        <TableCell className="text-xs text-destructive max-w-[280px] truncate">{f.error_message}</TableCell>
                        <TableCell>
                          {f.status === 'resolved'
                            ? <Badge className="bg-green-500/10 text-green-500 border-green-500/20">resolvido</Badge>
                            : <Badge variant="destructive">pendente</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" onClick={() => setSelectedFailure(f)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {f.status !== 'resolved' && (
                              <Button size="icon" variant="ghost" onClick={() => markResolved(f.id)} title="Marcar como resolvido">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" onClick={() => deleteFailure(f.id)} title="Excluir">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </section>

        <Dialog open={!!selectedFailure} onOpenChange={() => setSelectedFailure(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Detalhes da falha
              </DialogTitle>
            </DialogHeader>
            {selectedFailure && (
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Erro</div>
                  <div className="rounded bg-destructive/10 text-destructive p-3 text-xs font-mono">
                    {selectedFailure.error_message}
                  </div>
                </div>
                {selectedFailure.error_stack && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Stack</div>
                    <pre className="rounded bg-muted p-3 text-[10px] overflow-x-auto max-h-40">
                      {selectedFailure.error_stack}
                    </pre>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Payload recebido</div>
                  <pre className="rounded bg-muted p-3 text-[10px] overflow-x-auto max-h-64">
                    {JSON.stringify(selectedFailure.raw_payload, null, 2)}
                  </pre>
                </div>
                {selectedFailure.normalized_payload && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Payload normalizado</div>
                    <pre className="rounded bg-muted p-3 text-[10px] overflow-x-auto max-h-64">
                      {JSON.stringify(selectedFailure.normalized_payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}