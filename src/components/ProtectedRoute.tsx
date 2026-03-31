import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useUserApproval, useAdmin } from '@/hooks/useAdmin';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isApproved, isLoading: approvalLoading } = useUserApproval();
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  if (loading || approvalLoading || adminLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admins always pass through
  if (isAdmin) {
    return <>{children}</>;
  }

  // Non-approved users see pending message
  if (!isApproved) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <svg className="h-8 w-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground">Acesso Pendente</h2>
          <p className="text-sm text-muted-foreground">
            Sua conta foi criada com sucesso! Aguarde a aprovação do administrador para acessar a plataforma.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Verificar novamente
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
