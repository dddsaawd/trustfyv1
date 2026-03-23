import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { integrations } from '@/data/mock';
import { cn } from '@/lib/utils';
import { Plug, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Integracoes = () => {
  return (
    <DashboardLayout title="Integrações">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((intg, i) => (
          <Card key={intg.id} className="border-border animate-fade-in hover:border-primary/20 transition-all" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Plug className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{intg.name}</p>
                    <Badge variant={intg.status === 'connected' ? 'default' : 'secondary'}
                      className={cn('text-[9px] mt-1', intg.status === 'connected' ? 'bg-success/20 text-success border-success/30 hover:bg-success/30' : '')}>
                      {intg.status === 'connected' ? <CheckCircle className="h-2.5 w-2.5 mr-1" /> : <XCircle className="h-2.5 w-2.5 mr-1" />}
                      {intg.status === 'connected' ? 'Conectado' : intg.status === 'error' ? 'Erro' : 'Desconectado'}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{intg.description}</p>
              {intg.last_sync && <p className="text-[10px] text-muted-foreground/60 mb-3">Última sincronização: {new Date(intg.last_sync).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>}
              <Button variant={intg.status === 'connected' ? 'outline' : 'default'} size="sm" className="w-full text-xs h-8">
                {intg.status === 'connected' ? 'Configurar' : 'Conectar'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Integracoes;
