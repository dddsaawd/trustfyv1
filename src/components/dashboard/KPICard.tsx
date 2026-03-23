import { TrendingUp, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  tooltip: string;
  index?: number;
}

export function KPICard({ label, value, change, changeLabel, tooltip, index = 0 }: KPICardProps) {
  const isPositive = change >= 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="group relative rounded-xl border border-border bg-card p-4 lg:p-5 transition-all duration-200 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 cursor-default animate-fade-in overflow-hidden"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
            <p className="text-xl lg:text-2xl font-bold text-foreground tabular-nums tracking-tight">{value}</p>
            <div className="mt-2 flex items-center gap-1.5">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span className={cn('text-[11px] font-semibold tabular-nums', isPositive ? 'text-success' : 'text-destructive')}>
                {isPositive ? '+' : ''}{change}%
              </span>
              <span className="text-[10px] text-muted-foreground">{changeLabel}</span>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[240px] text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
