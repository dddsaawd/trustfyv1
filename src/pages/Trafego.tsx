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
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Globe, Search, Music, Video, RefreshCw, Loader2, Inbox,
  CheckCircle, Settings, TrendingUp, TrendingDown, ChevronDown,
  LayoutGrid, Layers, FileText, MonitorPlay, HelpCircle, Info,
  BarChart3, ArrowUp, ExternalLink, Copy, Pin, Filter, Trash2,
  Play, Pause, DollarSign, Target, MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState('');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [bulkBudgetOpen, setBulkBudgetOpen] = useState(false);
  const [bulkBudgetValue, setBulkBudgetValue] = useState('');
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
      if (activeAccountIds.length > 0 && !activeAccountIds.includes(c.ad_account_id || '')) return false;
      if (nameFilter && !c.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    });
  }, [campaigns, nameFilter, statusFilter, activeAccountIds]);

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

  const toggleCampaignStatus = useCallback(async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const { error } = await supabase
      .from('campaigns')
      .update({ status: newStatus })
      .eq('id', campaignId);
    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }
    toast.success(`Campanha ${newStatus === 'active' ? 'ativada' : 'pausada'}`);
    refetch();
  }, [refetch]);

  const saveBudget = useCallback(async (campaignId: string) => {
    const value = parseFloat(budgetValue.replace(',', '.'));
    if (isNaN(value) || value < 0) {
      toast.error('Valor inválido');
      return;
    }
    const { error } = await supabase
      .from('campaigns')
      .update({ budget_daily: value })
      .eq('id', campaignId);
    if (error) {
      toast.error('Erro ao salvar orçamento');
      return;
    }
    toast.success('Orçamento atualizado');
    setEditingBudget(null);
    refetch();
  }, [budgetValue, refetch]);

  const toggleSelectCampaign = useCallback((id: string) => {
    setSelectedCampaigns(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedCampaigns.length === filteredCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(filteredCampaigns.map(c => c.id));
    }
  }, [selectedCampaigns, filteredCampaigns]);

  const bulkActivate = useCallback(async () => {
    for (const id of selectedCampaigns) {
      await supabase.from('campaigns').update({ status: 'active' }).eq('id', id);
    }
    toast.success(`${selectedCampaigns.length} campanhas ativadas`);
    setSelectedCampaigns([]);
    refetch();
  }, [selectedCampaigns, refetch]);

  const bulkPause = useCallback(async () => {
    for (const id of selectedCampaigns) {
      await supabase.from('campaigns').update({ status: 'paused' }).eq('id', id);
    }
    toast.success(`${selectedCampaigns.length} campanhas pausadas`);
    setSelectedCampaigns([]);
    refetch();
  }, [selectedCampaigns, refetch]);

  const bulkUpdateBudget = useCallback(async () => {
    const value = parseFloat(bulkBudgetValue.replace(',', '.'));
    if (isNaN(value) || value < 0) { toast.error('Valor inválido'); return; }
    for (const id of selectedCampaigns) {
      await supabase.from('campaigns').update({ budget_daily: value }).eq('id', id);
    }
    toast.success(`Orçamento atualizado para ${selectedCampaigns.length} campanhas`);
    setBulkBudgetOpen(false);
    setBulkBudgetValue('');
    setSelectedCampaigns([]);
    refetch();
  }, [selectedCampaigns, bulkBudgetValue, refetch]);

  const bulkDelete = useCallback(async () => {
    if (!confirm(`Excluir ${selectedCampaigns.length} campanhas?`)) return;
    for (const id of selectedCampaigns) {
      await supabase.from('campaigns').delete().eq('id', id);
    }
    toast.success(`${selectedCampaigns.length} campanhas excluídas`);
    setSelectedCampaigns([]);
    refetch();
  }, [selectedCampaigns, refetch]);

  const copySelectedIds = useCallback(() => {
    const ids = selectedCampaigns.join(', ');
    navigator.clipboard.writeText(ids);
    toast.success('IDs copiados para a área de transferência');
  }, [selectedCampaigns]);

  const filterSelected = useCallback(() => {
    const names = filteredCampaigns.filter(c => selectedCampaigns.includes(c.id)).map(c => c.name);
    if (names.length > 0) setNameFilter(names[0]);
    toast.info('Filtro aplicado');
  }, [selectedCampaigns, filteredCampaigns]);

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
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Escolha suas contas de anúncio:</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Ativar todas:</span>
                      <Switch
                        checked={activeAccountIds.length === adAccounts.length}
                        onCheckedChange={(checked) => toggleAllAccounts(!!checked)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {adAccounts.map(acc => (
                      <Card key={acc.id} className={cn(
                        'border-border transition-all',
                        acc.active && 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{acc.name}</p>
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">ID: {acc.account_id}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                status: {acc.active ? 'Ativa' : 'Desabilitada'}
                              </p>
                            </div>
                            <Switch
                              checked={acc.active}
                              onCheckedChange={() => toggleAccountActive(acc.id, acc.active)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Tooltip><TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8"><Settings className="h-3.5 w-3.5" /></Button>
                  </TooltipTrigger><TooltipContent>Configurações</TooltipContent></Tooltip>

                  <Tooltip><TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8"><ArrowUp className="h-3.5 w-3.5" /></Button>
                  </TooltipTrigger><TooltipContent>Ordenar</TooltipContent></Tooltip>

                  <Tooltip><TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8"><BarChart3 className="h-3.5 w-3.5" /></Button>
                  </TooltipTrigger><TooltipContent>Gráfico</TooltipContent></Tooltip>

                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Abrir no gerenciador
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8"><ChevronDown className="h-3.5 w-3.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52">
                      <DropdownMenuItem onClick={() => toast.info('Gráfico comparativo em breve')}>
                        <BarChart3 className="h-4 w-4 mr-2" /> Gráfico comparativo
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={bulkActivate} disabled={selectedCampaigns.length === 0}>
                        <Play className="h-4 w-4 mr-2" /> Ativar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={bulkPause} disabled={selectedCampaigns.length === 0}>
                        <Pause className="h-4 w-4 mr-2" /> Desativar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { if (selectedCampaigns.length === 0) { toast.error('Selecione campanhas'); return; } setBulkBudgetOpen(true); }} disabled={selectedCampaigns.length === 0}>
                        <DollarSign className="h-4 w-4 mr-2" /> Alterar orçamento
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info('Bid cap em breve')} disabled={selectedCampaigns.length === 0}>
                        <Target className="h-4 w-4 mr-2" /> Alterar bid cap
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toast.info('Fixar em breve')}>
                        <Pin className="h-4 w-4 mr-2" /> Fixar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={copySelectedIds} disabled={selectedCampaigns.length === 0}>
                        <Copy className="h-4 w-4 mr-2" /> Copiar ID
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={filterSelected} disabled={selectedCampaigns.length === 0}>
                        <Filter className="h-4 w-4 mr-2" /> Filtrar selecionadas
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={bulkDelete} disabled={selectedCampaigns.length === 0} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30 gap-1 ml-2">
                    <CheckCircle className="h-3 w-3" /> Todas as vendas trackeadas
                  </Badge>

                  {selectedCampaigns.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] gap-1 ml-1">
                      {selectedCampaigns.length} selecionada{selectedCampaigns.length > 1 ? 's' : ''}
                    </Badge>
                  )}
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
                          <TableHead className="text-[10px] w-8"><Checkbox className="h-3.5 w-3.5" checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                          <TableHead className="text-[10px] w-14">STATUS</TableHead>
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
                          <TableHead className="text-[10px] text-right">CPC</TableHead>
                          <TableHead className="text-[10px] text-right">CTR</TableHead>
                          <TableHead className="text-[10px] text-right">CPM</TableHead>
                          <TableHead className="text-[10px] text-right">IMPRESSÕES</TableHead>
                          <TableHead className="text-[10px] text-right">CLIQUES</TableHead>
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
                                <TableCell><Checkbox className="h-3.5 w-3.5" checked={selectedCampaigns.includes(c.id)} onCheckedChange={() => toggleSelectCampaign(c.id)} /></TableCell>
                                <TableCell>
                                  <Switch
                                    checked={c.status === 'active'}
                                    onCheckedChange={() => toggleCampaignStatus(c.id, c.status)}
                                    className="scale-90"
                                  />
                                </TableCell>
                                <TableCell className="text-xs font-medium max-w-[200px] truncate">{c.name}</TableCell>
                                <TableCell className="text-xs text-right tabular-nums">
                                  {editingBudget === c.id ? (
                                    <Input
                                      autoFocus
                                      value={budgetValue}
                                      onChange={e => setBudgetValue(e.target.value)}
                                      onBlur={() => saveBudget(c.id)}
                                      onKeyDown={e => { if (e.key === 'Enter') saveBudget(c.id); if (e.key === 'Escape') setEditingBudget(null); }}
                                      className="h-6 w-24 text-xs text-right ml-auto"
                                    />
                                  ) : (
                                    <span
                                      className="cursor-pointer hover:text-primary transition-colors"
                                      onClick={() => { setEditingBudget(c.id); setBudgetValue(String(Number(c.budget_daily || 0).toFixed(2))); }}
                                    >
                                      {fmt(Number(c.budget_daily || 0))}
                                      <span className="text-[9px] text-muted-foreground block">Diário</span>
                                    </span>
                                  )}
                                </TableCell>
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
                                <TableCell className="text-xs text-right tabular-nums">{fmt(Number(c.cpc || 0))}</TableCell>
                                <TableCell className="text-xs text-right tabular-nums">{Number(c.ctr || 0) > 0 ? fmtPct(Number(c.ctr || 0)) : '0,00%'}</TableCell>
                                <TableCell className="text-xs text-right tabular-nums">{fmt(Number(c.cpm || 0))}</TableCell>
                                <TableCell className="text-xs text-right tabular-nums">{Number(c.impressions || 0).toLocaleString('pt-BR')}</TableCell>
                                <TableCell className="text-xs text-right tabular-nums">{Number(c.clicks || 0).toLocaleString('pt-BR')}</TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={18} className="text-center py-6">
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
                          <TableCell className="text-[10px] text-right tabular-nums">{fmt(totals.spend > 0 && totals.clicks > 0 ? totals.spend / totals.clicks : 0)}</TableCell>
                          <TableCell className="text-[10px] text-right tabular-nums">{totals.impressions > 0 ? fmtPct((totals.clicks / totals.impressions) * 100) : '0,0%'}</TableCell>
                          <TableCell className="text-[10px] text-right tabular-nums">{fmt(totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0)}</TableCell>
                          <TableCell className="text-[10px] text-right tabular-nums">{totals.impressions.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-[10px] text-right tabular-nums">{totals.clicks.toLocaleString('pt-BR')}</TableCell>
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

              {/* Bulk Budget Dialog */}
              <Dialog open={bulkBudgetOpen} onOpenChange={setBulkBudgetOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-sm">Alterar orçamento ({selectedCampaigns.length} campanhas)</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <label className="text-xs text-muted-foreground">Novo orçamento diário (R$)</label>
                    <Input
                      autoFocus
                      value={bulkBudgetValue}
                      onChange={e => setBulkBudgetValue(e.target.value)}
                      placeholder="Ex: 50.00"
                      className="h-9 text-sm"
                      onKeyDown={e => { if (e.key === 'Enter') bulkUpdateBudget(); }}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => setBulkBudgetOpen(false)}>Cancelar</Button>
                    <Button size="sm" onClick={bulkUpdateBudget}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
