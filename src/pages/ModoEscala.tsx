import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TrendingUp, ShoppingCart, DollarSign, Megaphone, Package, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const metrics = [
  { label: 'Lucro Hoje', value: 'R$ 8.943,20', change: 18.6, icon: DollarSign, color: 'text-success' },
  { label: 'Faturamento', value: 'R$ 24.832,90', change: 12.4, icon: TrendingUp, color: 'text-primary' },
  { label: 'Vendas', value: '132', change: 9.1, icon: ShoppingCart, color: 'text-foreground' },
  { label: 'ROAS', value: '5.07x', change: 15.3, icon: Zap, color: 'text-warning' },
];

const topCampaign = { name: 'Skincare - Interesse Beleza - W18', roas: 6.98, profit: 4520 };
const topProduct = { name: 'Kit Skincare Premium', profit: 4180, units: 42 };

const ModoEscala = () => {
  return (
    <DashboardLayout title="Modo Escala">
      <div className="flex flex-col items-center justify-center min-h-[75vh] gap-8 animate-fade-in">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Visão Executiva</h2>
          <p className="text-xs text-muted-foreground mt-1">Sem distração. Foco total na escala.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
          {metrics.map((m, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 text-center animate-scale-in" style={{ animationDelay: `${i * 80}ms` }}>
              <m.icon className={cn('h-5 w-5 mx-auto mb-2', m.color)} />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{m.label}</p>
              <p className="text-3xl font-black text-foreground tabular-nums">{m.value}</p>
              <p className={cn('text-xs font-semibold mt-1 tabular-nums', m.change >= 0 ? 'text-success' : 'text-destructive')}>
                {m.change >= 0 ? '+' : ''}{m.change}%
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mt-4">
          <div className="rounded-xl border border-border bg-card p-5 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Top Campanha</p>
            </div>
            <p className="text-sm font-semibold text-foreground truncate">{topCampaign.name}</p>
            <p className="text-xs text-muted-foreground mt-1">ROAS {topCampaign.roas}x · Lucro R$ {topCampaign.profit.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 animate-fade-in" style={{ animationDelay: '450ms' }}>
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-success" />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Top Produto</p>
            </div>
            <p className="text-sm font-semibold text-foreground truncate">{topProduct.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{topProduct.units} vendas · Lucro R$ {topProduct.profit.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ModoEscala;
