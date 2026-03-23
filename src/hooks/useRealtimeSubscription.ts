import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type TableName = 'orders' | 'pix_pending' | 'notifications' | 'campaigns' | 'daily_snapshots';

interface UseRealtimeOptions {
  tables: TableName[];
  userId?: string;
  onNewOrder?: (payload: any) => void;
  onNewPix?: (payload: any) => void;
  onNewNotification?: (payload: any) => void;
}

export function useRealtimeSubscription({ tables, userId, onNewOrder, onNewPix, onNewNotification }: UseRealtimeOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('trustfy-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['kpis'] });
          const order = payload.new as any;
          toast.success(`Nova venda: ${order.product_name} — R$ ${Number(order.gross_value).toFixed(2).replace('.', ',')}`, {
            description: `Lucro estimado: R$ ${Number(order.net_profit).toFixed(2).replace('.', ',')}`,
          });
          onNewOrder?.(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pix_pending', filter: `user_id=eq.${userId}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['pix_pending'] });
          if (payload.eventType === 'INSERT') {
            const pix = payload.new as any;
            toast.info(`Pix gerado: R$ ${Number(pix.value).toFixed(2).replace('.', ',')} — ${pix.customer_name}`);
            onNewPix?.(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          const notif = payload.new as any;
          toast(notif.title, { description: notif.message });
          onNewNotification?.(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaigns', filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_snapshots', filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['daily_snapshots'] });
          queryClient.invalidateQueries({ queryKey: ['kpis'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, onNewOrder, onNewPix, onNewNotification]);
}
