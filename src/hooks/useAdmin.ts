import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useAdmin() {
  const { user } = useAuth();

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  return { isAdmin, isLoading };
}

export function useUserApproval() {
  const { user } = useAuth();

  const { data: isApproved, isLoading } = useQuery({
    queryKey: ['is-approved', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('profiles')
        .select('approved')
        .eq('user_id', user.id)
        .maybeSingle();
      return data?.approved ?? false;
    },
    enabled: !!user,
  });

  return { isApproved: isApproved ?? false, isLoading };
}
