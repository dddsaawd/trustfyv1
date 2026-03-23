import { Bell, RefreshCw, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-6">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <h1 className="text-sm font-semibold text-foreground tracking-tight hidden sm:block">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <Select defaultValue="today">
          <SelectTrigger className="h-8 w-[120px] text-xs bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="yesterday">Ontem</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="h-8 w-[130px] text-xs bg-secondary border-border hidden md:flex">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Plataformas</SelectItem>
            <SelectItem value="meta">Meta Ads</SelectItem>
            <SelectItem value="google">Google Ads</SelectItem>
            <SelectItem value="tiktok">TikTok Ads</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>

        <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">3</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                <User className="h-3.5 w-3.5" />
              </div>
              <ChevronDown className="h-3 w-3 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Minha Conta</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
