import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Shield, Users, UserCheck, UserX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  user_id: string;
  display_name: string | null;
  approved: boolean;
  created_at: string;
  avatar_url: string | null;
}

const Admin = () => {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, approved, created_at, avatar_url')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: isAdmin,
  });

  const toggleApproval = useMutation({
    mutationFn: async ({ userId, approved }: { userId: string; approved: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ approved })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(approved ? 'Usuário aprovado!' : 'Usuário bloqueado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar usuário');
    },
  });

  if (adminLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const approvedCount = users.filter(u => u.approved).length;
  const pendingCount = users.filter(u => !u.approved).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">Gerencie os usuários da plataforma</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total de Usuários</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-4 flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Aprovados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-4 flex items-center gap-3">
              <UserX className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Usuários Cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {(u.display_name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{u.display_name || 'Sem nome'}</p>
                            {u.user_id === user?.id && (
                              <span className="text-[10px] text-primary font-medium">Você (Admin)</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {u.approved ? (
                          <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" /> Aprovado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning text-xs">
                            <XCircle className="h-3 w-3 mr-1" /> Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.user_id !== user?.id && (
                          <Button
                            size="sm"
                            variant={u.approved ? 'destructive' : 'default'}
                            onClick={() => toggleApproval.mutate({ userId: u.user_id, approved: !u.approved })}
                            disabled={toggleApproval.isPending}
                            className="h-7 text-xs"
                          >
                            {u.approved ? 'Bloquear' : 'Aprovar'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
