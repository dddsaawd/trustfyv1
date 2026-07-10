import { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user } = useAuth();
  const { permission, supported, iosNeedsInstall, requestPermission } =
    usePushNotifications(user?.id);

  // Auto-prompt for push notification permission on first load
  useEffect(() => {
    if (user && supported && permission === 'default') {
      const promptKey = `push-permission-prompted:${user.id}`;
      if (sessionStorage.getItem(promptKey)) return;

      sessionStorage.setItem(promptKey, 'true');
      // Small delay to not overwhelm the user right after login
      const timer = setTimeout(() => {
        requestPermission();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, supported, permission, requestPermission]);

  // iOS: show a one-time hint asking the user to install to Home Screen
  useEffect(() => {
    if (!user || !iosNeedsInstall) return;
    const key = `ios-install-hint:${user.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, 'true');
    const timer = setTimeout(() => {
      import('sonner').then(({ toast }) =>
        toast.message('📱 Para receber notificações no iPhone', {
          description:
            'Toque em Compartilhar (ícone ⬆️) → "Adicionar à Tela de Início" e abra o TRUSTFY pelo ícone instalado.',
          duration: 10000,
        })
      );
    }, 3000);
    return () => clearTimeout(timer);
  }, [user, iosNeedsInstall]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader title={title} />
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
