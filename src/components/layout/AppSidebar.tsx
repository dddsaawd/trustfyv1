import {
  LayoutDashboard, ShoppingCart, Megaphone, Package, Link2, DollarSign,
  Clock, RotateCcw, FileText, Bell, Puzzle, Settings, TrendingUp
} from 'lucide-react';
import trustfyLogo from '@/assets/trustfy-logo.png';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';

const mainItems = [
  { title: 'Resumo', url: '/', icon: LayoutDashboard },
  { title: 'Vendas', url: '/vendas', icon: ShoppingCart },
  { title: 'Tráfego', url: '/trafego', icon: Megaphone },
  { title: 'Produtos', url: '/produtos', icon: Package },
  { title: 'UTMs', url: '/utms', icon: Link2 },
  { title: 'Financeiro', url: '/financeiro', icon: DollarSign },
  { title: 'Pix Pendentes', url: '/pix-pendentes', icon: Clock },
  { title: 'Recuperação', url: '/recuperacao', icon: RotateCcw },
];

const secondaryItems = [
  { title: 'Relatórios', url: '/relatorios', icon: FileText },
  { title: 'Notificações', url: '/notificacoes', icon: Bell },
  { title: 'Integrações', url: '/integracoes', icon: Puzzle },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground">TRUSTFY</span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">Command Center</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="h-10">
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-3 my-2 h-px bg-sidebar-border" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="h-10">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <NavLink to="/modo-escala" className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5 text-sm text-primary transition-all hover:bg-primary/10" activeClassName="bg-primary/15">
          <TrendingUp className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="font-medium">Modo Escala</span>}
        </NavLink>
      </SidebarFooter>
    </Sidebar>
  );
}
