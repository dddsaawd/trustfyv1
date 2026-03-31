import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plug, CheckCircle, XCircle, Copy, ExternalLink, RefreshCw,
  Webhook, ShoppingBag, CreditCard, FileSpreadsheet, Monitor,
  Globe, Music, Video, Search, Code, Send, Eye, EyeOff, Loader2,
  ArrowRight, Zap, Shield
} from 'lucide-react';

const PLATFORM_ICONS: Record<string, any> = {
  meta: Globe,
  google: Search,
  tiktok: Music,
  kwai: Video,
  shopify: ShoppingBag,
  webhook: Webhook,
  gateway: CreditCard,
  csv: FileSpreadsheet,
  checkout: ShoppingBag,
};

const Integracoes = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [testPayload, setTestPayload] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [metaSyncing, setMetaSyncing] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/webhook-checkout?user_id=${user?.id || ''}`;

  // Handle Meta OAuth redirect results + check FB SDK login status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('meta_success')) {
      toast.success('Meta Ads conectado com sucesso!');
      window.history.replaceState({}, '', '/integracoes');
    }
    if (params.get('meta_error')) {
      toast.error(`Erro Meta Ads: ${params.get('meta_error')}`);
      window.history.replaceState({}, '', '/integracoes');
    }

    // Check FB SDK login status on load
    const checkFBStatus = () => {
      const FB = (window as any).FB;
      if (FB) {
        FB.getLoginStatus((response: any) => {
          if (response.status === 'connected') {
            console.log('FB SDK: User already connected', response.authResponse?.userID);
          }
        });
      }
    };
    
    // FB SDK may not be loaded yet, wait for it
    if ((window as any).FB) {
      checkFBStatus();
    } else {
      (window as any).fbAsyncInitOriginal = (window as any).fbAsyncInit;
      const originalInit = (window as any).fbAsyncInit;
      (window as any).fbAsyncInit = function() {
        if (originalInit) originalInit();
        checkFBStatus();
      };
    }
  }, []);

  useEffect(() => {
    if (user) fetchIntegrations();
  }, [user]);

  const fetchIntegrations = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');

    if (data && data.length > 0) {
      setIntegrations(data);
    } else {
      // Create default integrations for user
      const defaults = [
        { name: 'Webhook de Checkout', platform: 'webhook', description: 'Recebe pedidos e produtos em tempo real via webhook da sua plataforma de checkout', status: 'disconnected' as const },
        { name: 'Meta Ads', platform: 'meta', description: 'Importa campanhas, conjuntos e anúncios do Facebook/Instagram Ads', status: 'disconnected' as const },
        { name: 'Google Ads', platform: 'google', description: 'Importa campanhas do Google Ads incluindo Search, Display e YouTube', status: 'disconnected' as const },
        { name: 'TikTok Ads', platform: 'tiktok', description: 'Importa campanhas e métricas do TikTok Ads Manager', status: 'disconnected' as const },
        { name: 'Kwai Ads', platform: 'kwai', description: 'Importa dados de campanhas do Kwai for Business', status: 'disconnected' as const },
        { name: 'Gateway de Pagamento', platform: 'gateway', description: 'Integração com gateway para status de pagamentos e pix', status: 'disconnected' as const },
        { name: 'Importação CSV', platform: 'csv', description: 'Importa dados de vendas, custos e campanhas via planilha', status: 'disconnected' as const },
      ];
      const inserts = defaults.map(d => ({ ...d, user_id: user.id }));
      const { data: created } = await supabase.from('integrations').insert(inserts).select();
      if (created) setIntegrations(created);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  const handleConfigureWebhook = (intg: any) => {
    setWebhookSecret((intg.config as any)?.secret || '');
    setWebhookDialogOpen(true);
  };

  const saveWebhookConfig = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('integrations')
      .update({ config: { secret: webhookSecret || null }, status: 'connected' })
      .eq('user_id', user.id)
      .eq('platform', 'webhook');

    if (!error) {
      toast.success('Webhook configurado com sucesso');
      setWebhookDialogOpen(false);
      fetchIntegrations();
    }
  };

  const openTestDialog = () => {
    setTestPayload(JSON.stringify({
      event: 'order.created',
      data: {
        order_number: `TF-${Date.now().toString().slice(-5)}`,
        customer_name: 'Cliente Teste',
        customer_email: 'teste@email.com',
        customer_phone: '11999999999',
        product_name: 'Produto Teste',
        gross_value: 197.90,
        product_cost: 45.00,
        gateway_fee: 9.90,
        shipping_cost: 15.00,
        payment_method: 'pix',
        payment_status: 'approved',
        platform: 'facebook',
        campaign_name: 'Campanha Teste',
        utm_source: 'facebook',
      }
    }, null, 2));
    setTestResult(null);
    setTestDialogOpen(true);
  };

  const sendTestWebhook = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const parsed = JSON.parse(testPayload);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (webhookSecret) headers['x-webhook-secret'] = webhookSecret;

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(parsed),
      });

      const json = await res.json();
      setTestResult({ status: res.status, body: json });

      if (res.ok) {
        toast.success('Webhook de teste enviado com sucesso!');
        fetchIntegrations();
      } else {
        toast.error(`Erro: ${json.error || 'Falha no envio'}`);
      }
    } catch (e: any) {
      setTestResult({ status: 0, body: { error: e.message } });
      toast.error('JSON inválido ou erro de rede');
    }
    setTestLoading(false);
  };

  const handleConnectMeta = () => {
    if (!user) return;
    const callbackUrl = `${supabaseUrl}/functions/v1/meta-oauth-callback`;
    const redirectOrigin = window.location.origin.includes('lovable.app') 
      ? window.location.origin 
      : 'https://trustfyv1.lovable.app';
    const state = btoa(JSON.stringify({ user_id: user.id, redirect_url: redirectOrigin }));
    const appId = '1254565673413567';
    const scopes = 'ads_read,ads_management,business_management,pages_read_engagement,pages_show_list';
    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=${scopes}&response_type=code`;
    window.location.href = oauthUrl;
  };

  const handleSyncMeta = async () => {
    if (!user) return;
    setMetaSyncing(true);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/meta-sync-campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(`${json.campaigns_synced} campanhas sincronizadas!`);
        fetchIntegrations();
      } else {
        toast.error(json.error || 'Erro ao sincronizar');
      }
    } catch (e: any) {
      toast.error('Erro de rede ao sincronizar');
    }
    setMetaSyncing(false);
  };

  const handleDisconnectMeta = async () => {
    if (!user) return;
    await supabase
      .from('integrations')
      .update({ status: 'disconnected', config: null })
      .eq('user_id', user.id)
      .eq('platform', 'meta');
    toast.success('Meta Ads desconectado');
    fetchIntegrations();
  };

  const getIcon = (platform: string) => {
    const Icon = PLATFORM_ICONS[platform] || Plug;
    return <Icon className="h-5 w-5 text-muted-foreground" />;
  };

  const webhookIntegration = integrations.find(i => i.platform === 'webhook');
  const otherIntegrations = integrations.filter(i => i.platform !== 'webhook');

  const sampleEvents = [
    { event: 'order.created', desc: 'Novo pedido criado' },
    { event: 'order.paid', desc: 'Pedido pago (aprovado)' },
    { event: 'order.updated', desc: 'Pedido atualizado' },
    { event: 'order.refunded', desc: 'Pedido reembolsado' },
    { event: 'product.created', desc: 'Novo produto criado' },
    { event: 'product.updated', desc: 'Produto atualizado' },
    { event: 'pix.generated', desc: 'Pix gerado (pendente)' },
    { event: 'pix.paid', desc: 'Pix pago' },
    { event: 'pix.expired', desc: 'Pix expirado' },
  ];

  return (
    <DashboardLayout title="Integrações">
      <Tabs defaultValue="webhook" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="webhook" className="text-xs gap-1.5"><Webhook className="h-3.5 w-3.5" />Webhook & Checkout</TabsTrigger>
          <TabsTrigger value="plataformas" className="text-xs gap-1.5"><Monitor className="h-3.5 w-3.5" />Plataformas de Ads</TabsTrigger>
        </TabsList>

        {/* WEBHOOK TAB */}
        <TabsContent value="webhook" className="space-y-4">
          {/* Webhook URL card */}
          <Card className="border-primary/20 bg-primary/5 animate-fade-in">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  URL do Webhook — Sincronização de Checkout
                </CardTitle>
                <Badge variant="outline" className={cn('text-[9px]', webhookIntegration?.status === 'connected' ? 'border-success/40 text-success' : 'border-muted-foreground/40 text-muted-foreground')}>
                  {webhookIntegration?.status === 'connected' ? <CheckCircle className="h-2.5 w-2.5 mr-1" /> : <XCircle className="h-2.5 w-2.5 mr-1" />}
                  {webhookIntegration?.status === 'connected' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Configure esta URL na sua plataforma de checkout (Kiwify, Hotmart, Eduzz, Monetizze, Guru, etc.) para receber pedidos e produtos automaticamente.
              </p>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    readOnly
                    value={webhookUrl}
                    className="text-xs font-mono bg-secondary pr-20 h-9"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 px-2 text-[10px]"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copiar
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleConfigureWebhook(webhookIntegration)}>
                  <Shield className="h-3.5 w-3.5 mr-1" /> Configurar Secret
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={openTestDialog}>
                  <Send className="h-3.5 w-3.5 mr-1" /> Testar Webhook
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => copyToClipboard(JSON.stringify({
                  event: 'order.created',
                  data: { order_number: 'TF-00001', customer_name: 'Nome', product_name: 'Produto', gross_value: 197.90, payment_method: 'pix', payment_status: 'approved' }
                }, null, 2))}>
                  <Code className="h-3.5 w-3.5 mr-1" /> Copiar Exemplo
                </Button>
              </div>

              {webhookIntegration?.last_sync && (
                <p className="text-[10px] text-muted-foreground/60">
                  Última sincronização: {new Date(webhookIntegration.last_sync).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Events supported */}
          <Card className="border-border animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Eventos Suportados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {sampleEvents.map((ev, i) => (
                  <div key={ev.event} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                    <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-mono text-foreground">{ev.event}</p>
                      <p className="text-[10px] text-muted-foreground">{ev.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payload documentation */}
          <Card className="border-border animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Formato do Payload (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-[11px] font-mono bg-secondary rounded-lg p-4 overflow-x-auto text-muted-foreground leading-relaxed">
{`POST ${webhookUrl}
Content-Type: application/json
x-webhook-secret: sua_chave_secreta (opcional)

{
  "event": "order.created",
  "data": {
    "order_number": "ORD-12345",
    "customer_name": "João Silva",
    "customer_email": "joao@email.com",
    "customer_phone": "11999999999",
    "product_name": "Kit Skincare Premium",
    "product_cost": 45.00,
    "gross_value": 197.90,
    "gateway_fee": 9.90,
    "shipping_cost": 15.00,
    "tax": 5.00,
    "payment_method": "pix",
    "payment_status": "approved",
    "platform": "facebook",
    "campaign_name": "Skincare W18",
    "utm_source": "facebook",
    "utm_campaign": "skincare_w18"
  }
}`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLATAFORMAS TAB */}
        <TabsContent value="plataformas" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherIntegrations.map((intg, i) => (
              <Card key={intg.id} className="border-border animate-fade-in hover:border-primary/20 transition-all" style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        {getIcon(intg.platform)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{intg.name}</p>
                        <Badge variant={intg.status === 'connected' ? 'default' : 'secondary'}
                          className={cn('text-[9px] mt-1', intg.status === 'connected' ? 'bg-success/20 text-success border-success/30 hover:bg-success/30' : intg.status === 'error' ? 'bg-destructive/20 text-destructive border-destructive/30' : '')}>
                          {intg.status === 'connected' ? <CheckCircle className="h-2.5 w-2.5 mr-1" /> : <XCircle className="h-2.5 w-2.5 mr-1" />}
                          {intg.status === 'connected' ? 'Conectado' : intg.status === 'error' ? 'Token Expirado' : 'Desconectado'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{intg.description}</p>
                  {intg.platform === 'meta' && intg.status === 'connected' && (intg.config as any)?.fb_user_name && (
                    <p className="text-[10px] text-primary mb-1">👤 {(intg.config as any).fb_user_name} — {((intg.config as any).ad_accounts?.length || 0)} conta(s)</p>
                  )}
                  {intg.last_sync && (
                    <p className="text-[10px] text-muted-foreground/60 mb-3">
                      Última sync: {new Date(intg.last_sync).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {intg.platform === 'meta' ? (
                    <div className="flex gap-2">
                      {intg.status === 'connected' ? (
                        <>
                          <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={handleSyncMeta} disabled={metaSyncing}>
                            {metaSyncing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                            Sincronizar
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs h-8 text-destructive hover:text-destructive" onClick={handleDisconnectMeta}>
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" className="w-full text-xs h-8" onClick={handleConnectMeta}>
                          <Globe className="h-3.5 w-3.5 mr-1" /> Conectar com Facebook
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button variant={intg.status === 'connected' ? 'outline' : 'default'} size="sm" className="w-full text-xs h-8" disabled>
                      Em breve
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Webhook Secret Dialog */}
      <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Configurar Webhook Secret</DialogTitle>
            <DialogDescription className="text-xs">
              Defina uma chave secreta para validar webhooks recebidos. Envie-a no header <code className="text-[10px] bg-secondary px-1 rounded">x-webhook-secret</code>.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Input
              type={showSecret ? 'text' : 'password'}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="Chave secreta (opcional)"
              className="text-xs pr-10"
            />
            <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0" onClick={() => setShowSecret(!showSecret)}>
              {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setWebhookDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" className="text-xs" onClick={saveWebhookConfig}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Webhook Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Testar Webhook</DialogTitle>
            <DialogDescription className="text-xs">
              Envie um payload de teste para verificar a integração. Edite o JSON abaixo e clique em Enviar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full h-64 text-[11px] font-mono bg-secondary border border-border rounded-lg p-3 text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {testResult && (
              <div className={cn('rounded-lg p-3 text-xs font-mono', testResult.status === 200 ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20')}>
                <p className="font-semibold mb-1">Status: {testResult.status}</p>
                <pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify(testResult.body, null, 2)}</pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setTestDialogOpen(false)}>Fechar</Button>
            <Button size="sm" className="text-xs" onClick={sendTestWebhook} disabled={testLoading}>
              {testLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
              Enviar Teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Integracoes;
