import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Bell, ShoppingCart, DollarSign, Target, TrendingDown, AlertTriangle, BarChart3, Inbox } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const iconMap: Record<string, any> = {
  sale: ShoppingCart,
  pix_generated: DollarSign,
  pix_paid: DollarSign,
  goal_reached: Target,
  roas_drop: TrendingDown,
  cpa_spike: TrendingDown,
  negative_campaign: AlertTriangle,
  chargeback: AlertTriangle,
  daily_summary: BarChart3,
};

const colorMap: Record<string, string> = {
  sale: 'text-success',
  pix_paid: 'text-success',
  goal_reached: 'text-primary',
  roas_drop: 'text-destructive',
  negative_campaign: 'text-destructive',
  daily_summary: 'text-muted-foreground',
  pix_generated: 'text-warning',
  chargeback: 'text-destructive',
  cpa_spike: 'text-warning',
};

const Notificacoes = () => {
  const { user } = useAuth();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const hasData = notifications && notifications.length > 0;

  if (!hasData && !isLoading) {
    return (
      <DashboardLayout title="Notificações">
        <Card className="border-border">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <Inbox className="h-16 w-16 text-muted-foreground/20" />
              <h3 className="text-lg font-semibold text-foreground">Nenhuma notificação</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                As notificações aparecerão aqui quando vendas, alertas ou resumos forem gerados pelo sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Notificações">
      <div className="max-w-2xl space-y-2">
        {(notifications || []).map((n: any, i: number) => {
          const Icon = iconMap[n.type] || Bell;
          return (
            <Card key={n.id} className={cn('border-border transition-all duration-200 hover:border-primary/20 animate-fade-in', !n.read && 'border-l-2 border-l-primary')} style={{ animationDelay: `${i * 60}ms` }}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary shrink-0 mt-0.5">
                  <Icon className={cn('h-4 w-4', colorMap[n.type])} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    {!n.read && <Badge className="text-[8px] px-1 py-0 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Nova</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {new Date(n.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default Notificacoes;
