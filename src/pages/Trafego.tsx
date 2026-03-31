import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Globe, Search, Music, Video, RefreshCw, Loader2, Inbox,
  CheckCircle, Settings, TrendingUp, TrendingDown, ChevronDown,
  LayoutGrid, Layers, FileText, MonitorPlay, HelpCircle, Info
} from 'lucide-react';

const PLATFORMS = [
  { id: 'meta', label: 'Meta', icon: Globe, color: 'bg-blue-600' },
  { id: 'google', label: 'Google', icon: Search, color: 'bg-red-500' },
  { id: 'kwai', label: 'Kwai', icon: Video, color: 'bg-orange-500' },
  { id: 'tiktok', label: 'TikTok', icon: Music, color: 'bg-foreground' },
];

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

const Trafego = () => {
  const { user } = useAuth();
  const [activePlatform, setActivePlatform] = useState('meta');
  const [activeTab, setActiveTab] = useState('campanhas');
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // Fetch campaigns for selected platform
  const { data: campaigns, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['campaigns', user?.id, activePlatform],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('platform', activePlatform)
        .order('spend', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  // Fetch ad accounts
  const { data: adAccounts, refetch: refetchAccounts } = useQuery({
    queryKey: ['ad_accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('ad_accounts').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Active account IDs (derived from DB active field)
  const activeAccountIds = useMemo(() =>
    (adAccounts || []).filter(a => a.active).map(a => a.id),
    [adAccounts]
  );

  const toggleAccountActive = useCallback(async (accountId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('ad_accounts')
      .update({ active: !currentActive })
      .eq('id', accountId);
    if (error) {
      toast.error('Erro ao atualizar conta');
      return;
    }
    refetchAccounts();
  }, [refetchAccounts]);

  const toggleAllAccounts = useCallback(async (activate: boolean) => {
    if (!adAccounts) return;
    const ids = adAccounts.map(a => a.id);
    for (const id of ids) {
      await supabase.from('ad_accounts').update({ active: activate }).eq('id', id);
    }
    refetchAccounts();
  }, [adAccounts, refetchAccounts]);

  // Fetch integration status
  const { data: integration } = useQuery({
    queryKey: ['integration', user?.id, activePlatform],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('platform', activePlatform)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isConnected = integration?.status === 'connected';

  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.filter(c => {
      // If accounts are selected, only show campaigns from those accounts
      if (selectedAccountIds.length > 0 && !selectedAccountIds.includes(c.ad_account_id || '')) return false;
      if (nameFilter && !c.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    });
  }, [campaigns, nameFilter, statusFilter, selectedAccountIds]);

  // Aggregated totals
  const totals = useMemo(() => {
    const list = filteredCampaigns;
    const spend = list.reduce((s, c) => s + Number(c.spend || 0), 0);
    const revenue = list.reduce((s, c) => s + Number(c.revenue || 0), 0);
    const conversions = list.reduce((s, c) => s + Number(c.conversions || 0), 0);
    const profit = list.reduce((s, c) => s + Number(c.profit || 0), 0);
    const clicks = list.reduce((s, c) => s + Number(c.clicks || 0), 0);
    const impressions = list.reduce((s, c) => s + Number(c.impressions || 0), 0);
    const roas = spend > 0 ? revenue / spend : 0;
    const cpa = conversions > 0 ? spend / conversions : 0;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const roi = spend > 0 ? (profit / spend) * 100 : 0;
    return { spend, revenue, conversions, profit, roas, cpa, margin, roi, clicks, impressions, count: list.length };
  }, [filteredCampaigns]);

  const handleSync = async () => {
    if (!user || activePlatform !== 'meta') return;
    setSyncing(true);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/meta-sync-campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(`${json.campaigns_synced} campanhas sincronizadas!`);
        refetch();
      } else {
        toast.error(json.error || 'Erro ao sincronizar');
      }
    } catch {
      toast.error('Erro de rede ao sincronizar');
    }
    setSyncing(false);
  };

  const timeSinceUpdate = dataUpdatedAt
    ? `Atualizado ${Math.round((Date.now() - dataUpdatedAt) / 60000)} min atrás`
    : '';

  return (
    <DashboardLayout title="Tráfego">
      <div className="flex gap-4 h-full">
        {/* Platform Sub-Navigation */}
        <div className="w-40 shrink-0 space-y-1">
          {PLATFORMS.map(p => {
            const Icon = p.icon;
            const active = activePlatform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { setActivePlatform(p.id); setActiveTab('campanhas'); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Connection Warning */}
          {!isConnected && !isLoading && (
            <Card className="border-destructive/30 bg-destructive/5 animate-fade-in">
              <CardContent className="py-3 px-4">
                <p className="text-xs text-destructive font-bold uppercase tracking-wide mb-1">Configuração incompleta!</p>
                <p className="text-xs text-muted-foreground">
                  Você ainda não conectou sua conta de {PLATFORMS.find(p => p.id === activePlatform)?.label || ''} Ads.{' '}
                  <a href="/integracoes" className="text-primary underline hover:text-primary/80">Clique aqui para conectar.</a>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tabs: Contas / Campanhas / Conjuntos / Anúncios */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-secondary h-11 p-1">
              <TabsTrigger value="contas" className="text-xs gap-1.5 data-[state=active]:bg-background">
                <LayoutGrid className="h-3.5 w-3.5" /> Contas
              </TabsTrigger>
              <TabsTrigger value="campanhas" className="text-xs gap-1.5 data-[state=active]:bg-background">
                <FileText className="h-3.5 w-3.5" /> Campanhas
              </TabsTrigger>
              <TabsTrigger value="conjuntos" className="text-xs gap-1.5 data-[state=active]:bg-background">
                <Layers className="h-3.5 w-3.5" /> Conjuntos
              </TabsTrigger>
              <TabsTrigger value="anuncios" className="text-xs gap-1.5 data-[state=active]:bg-background">
                <MonitorPlay className="h-3.5 w-3.5" /> Anúncios
              </TabsTrigger>
            </TabsList>

            {/* ===== CONTAS TAB ===== */}
            <TabsContent value="contas" className="mt-4 space-y-4">
              {adAccounts && adAccounts.length > 0 ? (
                <>
                  {/* Select All / Clear */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px]"
                        onClick={() => setSelectedAccountIds(adAccounts.map(a => a.id))}
                      >
                        Selecionar Todas
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[10px]"
                        onClick={() => setSelectedAccountIds([])}
                      >
                        Limpar
                      </Button>
                      {selectedAccountIds.length > 0 && (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                          {selectedAccountIds.length} conta{selectedAccountIds.length > 1 ? 's' : ''} selecionada{selectedAccountIds.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Account Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {adAccounts.map(acc => {
                      const isSelected = selectedAccountIds.includes(acc.id);
                      return (
                        <Card
                          key={acc.id}
                          className={cn(
                            'border-border cursor-pointer transition-all hover:border-primary/40',
                            isSelected && 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          )}
                          onClick={() => {
                            setSelectedAccountIds(prev =>
                              prev.includes(acc.id)
                                ? prev.filter(id => id !== acc.id)
                                : [...prev, acc.id]
                            );
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  className="h-4 w-4"
                                  onCheckedChange={() => {}}
                                />
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{acc.name}</p>
                                  <p className="text-xs text-muted-foreground font-mono mt-0.5">ID: {acc.account_id}</p>
                                </div>
                              </div>
                              <Badge variant={acc.active ? 'default' : 'secondary'}
                                className={cn('text-[9px]', acc.active && 'bg-success/20 text-success border-success/30')}>
                                {acc.active ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Selected Accounts Summary */}
                  {selectedAccountIds.length > 0 && (() => {
                    const selectedCampaigns = (campaigns || []).filter(c =>
                      selectedAccountIds.includes(c.ad_account_id || '')
                    );
                    const totalSpend = selectedCampaigns.reduce((s, c) => s + Number(c.spend || 0), 0);
                    const totalRevenue = selectedCampaigns.reduce((s, c) => s + Number(c.revenue || 0), 0);
                    const totalProfit = selectedCampaigns.reduce((s, c) => s + Number(c.profit || 0), 0);
                    const totalConversions = selectedCampaigns.reduce((s, c) => s + Number(c.conversions || 0), 0);
                    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
                    const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

                    return (
                      <Card className="border-primary/20 bg-primary/5">
                        <CardHeader className="pb-2 pt-3 px-4">
                          <CardTitle className="text-xs font-bold text-primary uppercase tracking-wide">
                            Resumo das Contas Selecionadas ({selectedAccountIds.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Campanhas</p>
                              <p className="text-sm font-bold text-foreground">{selectedCampaigns.length}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Gastos</p>
                              <p className="text-sm font-bold text-foreground">{fmt(totalSpend)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Faturamento</p>
                              <p className="text-sm font-bold text-foreground">{fmt(totalRevenue)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Lucro</p>
                              <p className={cn('text-sm font-bold', totalProfit >= 0 ? 'text-success' : 'text-destructive')}>
                                {fmt(totalProfit)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">ROAS</p>
                              <p className="text-sm font-bold text-foreground">{roas.toFixed(2)}x</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">CPA</p>
                              <p className="text-sm font-bold text-foreground">{fmt(cpa)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </>
              ) : (
                <Card className="border-border">
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Inbox className="h-12 w-12 text-muted-foreground/20" />
                      <p className="text-sm text-muted-foreground">Nenhuma conta de anúncio encontrada</p>
                      <p className="text-xs text-muted-foreground/60">Conecte sua conta na aba Integrações</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ===== CAMPANHAS TAB ===== */}
            <TabsContent value="campanhas" className="mt-4 space-y-4">
              {/* Tracked badge + Sync */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30 gap-1">
                    <CheckCircle className="h-3 w-3" /> Todas as vendas trackeadas
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">{timeSinceUpdate}</span>
                  <Button size="sm" onClick={handleSync} disabled={syncing || !isConnected} className="h-8 text-xs gap-1.5">
                    {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Atualizar
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Nome da Campanha</label>
                  <Input
                    placeholder="Filtrar por nome"
                    value={nameFilter}
                    onChange={e => setNameFilter(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Status da Campanha</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer</SelectItem>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="paused">Pausada</SelectItem>
                      <SelectItem value="ended">Encerrada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Período de Visualização <Info className="h-3 w-3 inline text-muted-foreground/50" /></label>
                  <Select defaultValue="today">
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Conta de Anúncio</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer</SelectItem>
                      {adAccounts?.map(acc => (
                        <SelectItem key={acc.id} value={acc.account_id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Produto</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Campaigns Table */}
              <Card className="border-border">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-[10px] w-8"><Checkbox className="h-3.5 w-3.5" /></TableHead>
                          <TableHead className="text-[10px]">STATUS</TableHead>
                          <TableHead className="text-[10px]">CAMPANHA</TableHead>
                          <TableHead className="text-[10px] text-right">ORÇAMENTO</TableHead>
                          <TableHead className="text-[10px] text-right">ÚLT. ATUALIZAÇÃO</TableHead>
                          <TableHead className="text-[10px] text-right">VENDAS</TableHead>
                          <TableHead className="text-[10px] text-right">CPA <Info className="h-3 w-3 inline text-muted-foreground/40" /></TableHead>
                          <TableHead className="text-[10px] text-right">GASTOS</TableHead>
                          <TableHead className="text-[10px] text-right">FATURAMENTO</TableHead>
                          <TableHead className="text-[10px] text-right">LUCRO <Info className="h-3 w-3 inline text-muted-foreground/40" /></TableHead>
                          <TableHead className="text-[10px] text-right">ROAS <Info className="h-3 w-3 inline text-muted-foreground/40" /></TableHead>
                          <TableHead className="text-[10px] text-right">MARGEM <Info className="h-3 w-3 inline text-muted-foreground/40" /></TableHead>
                          <TableHead className="text-[10px] text-right">ROI <Info className="h-3 w-3 inline text-muted-foreground/40" /></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCampaigns.length > 0 ? (
                          filteredCampaigns.map((c) => {
                            const spend = Number(c.spend || 0);
                            const rev = Number(c.revenue || 0);
                            const pft = Number(c.profit || 0);
                            const roas = Number(c.roas || 0);
                            const conv = Number(c.conversions || 0);
                            const cpa = Number(c.cpa || 0);
                            const margin = rev > 0 ? (pft / rev) * 100 : 0;
                            const roi = spend > 0 ? (pft / spend) * 100 : 0;
                            return (
                              <TableRow key={c.id} className="border-border">
                                <TableCell><Checkbox className="h-3.5 w-3.5" /></TableCell>
                                <TableCell>
                                  <Badge variant={c.status === 'active' ? 'default' : 'secondary'}
                                    className={cn('text-[9px]',
                                      c.status === 'active' && 'bg-success/20 text-success border-success/30',
                                      c.status === 'paused' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                                      c.status === 'ended' && 'bg-muted text-muted-foreground'
                                    )}>
                                    {c.status === 'active' ? 'Ativa' : c.status === 'paused' ? 'Pausada' : 'Encerrada'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs font-medium max-w-[200px] truncate">{c.name}</TableCell>
                                <TableCell className="text-xs text-right tabular-nums">{fmt(Number(c.budget_daily || 0))}</TableCell>
                                <TableCell className="text-xs text-right tabular-nums text-muted-foreground">
                                  {new Date(c.updated_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                                <TableCell className="text-xs text-right tabular-nums">{conv}</TableCell>
                                <TableCell className="text-xs text-right tabular-nums">{conv > 0 ? fmt(cpa) : 'N/A'}</TableCell>
                                <TableCell className="text-xs text-right tabular-nums">{fmt(spend)}</TableCell>
                                <TableCell className="text-xs text-right tabular-nums">{fmt(rev)}</TableCell>
                                <TableCell className={cn('text-xs text-right tabular-nums font-medium', pft >= 0 ? 'text-success' : 'text-destructive')}>{fmt(pft)}</TableCell>
                                <TableCell className="text-xs text-right tabular-nums">{roas > 0 ? `${roas.toFixed(2)}x` : 'N/A'}</TableCell>
                                <TableCell className="text-xs text-right tabular-nums">{rev > 0 ? fmtPct(margin) : 'N/A'}</TableCell>
                                <TableCell className="text-xs text-right tabular-nums">{spend > 0 ? fmtPct(roi) : 'N/A'}</TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={13} className="text-center py-6">
                              <p className="text-xs text-muted-foreground">N/A</p>
                            </TableCell>
                          </TableRow>
                        )}
                        {/* Totals row */}
                        <TableRow className="border-border bg-secondary/30 font-medium">
                          <TableCell></TableCell>
                          <TableCell className="text-[10px] text-muted-foreground">N/A</TableCell>
                          <TableCell className="text-[10px]">{totals.count} CAMPANHAS</TableCell>
                          <TableCell className="text-[10px] text-right tabular-nums">{fmt(0)}</TableCell>
                          <TableCell className="text-[10px] text-right text-muted-foreground">N/A</TableCell>
                          <TableCell className="text-[10px] text-right tabular-nums">{totals.conversions}</TableCell>
                          <TableCell className="text-[10px] text-right tabular-nums">{totals.conversions > 0 ? fmt(totals.cpa) : 'N/A'}</TableCell>
                          <TableCell className="text-[10px] text-right tabular-nums">{fmt(totals.spend)}</TableCell>
                          <TableCell className="text-[10px] text-right tabular-nums">{fmt(totals.revenue)}</TableCell>
                          <TableCell className={cn('text-[10px] text-right tabular-nums font-medium', totals.profit >= 0 ? 'text-success' : 'text-destructive')}>{fmt(totals.profit)}</TableCell>
                          <TableCell className="text-[10px] text-right tabular-nums">{totals.roas > 0 ? `${totals.roas.toFixed(2)}x` : 'N/A'}</TableCell>
                          <TableCell className="text-[10px] text-right tabular-nums">{totals.revenue > 0 ? fmtPct(totals.margin) : 'N/A'}</TableCell>
                          <TableCell className="text-[10px] text-right tabular-nums">{totals.spend > 0 ? fmtPct(totals.roi) : 'N/A'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Help link */}
              <div className="flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-[10px] text-muted-foreground/60">Por que as campanhas não estão aparecendo?</span>
              </div>
            </TabsContent>

            {/* ===== CONJUNTOS TAB ===== */}
            <TabsContent value="conjuntos" className="mt-4">
              <Card className="border-border">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Layers className="h-12 w-12 text-muted-foreground/20" />
                    <p className="text-sm font-medium text-foreground">Conjuntos de Anúncios</p>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Os conjuntos (ad sets) serão exibidos aqui quando a sincronização com {PLATFORMS.find(p => p.id === activePlatform)?.label} estiver ativa.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== ANÚNCIOS TAB ===== */}
            <TabsContent value="anuncios" className="mt-4">
              <Card className="border-border">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <MonitorPlay className="h-12 w-12 text-muted-foreground/20" />
                    <p className="text-sm font-medium text-foreground">Anúncios</p>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Os anúncios individuais serão exibidos aqui quando a sincronização com {PLATFORMS.find(p => p.id === activePlatform)?.label} estiver ativa.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Trafego;
