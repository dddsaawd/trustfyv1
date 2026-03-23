import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download } from 'lucide-react';

const reportTypes = [
  { label: 'Relatório Diário', desc: 'Resumo completo do dia com KPIs, vendas, lucro e campanhas', period: 'Hoje' },
  { label: 'Relatório Semanal', desc: 'Visão consolidada da semana com comparativos e tendências', period: 'Últimos 7 dias' },
  { label: 'Relatório Mensal', desc: 'Análise completa do mês com P&L, produtos e performance', period: 'Março 2024' },
  { label: 'Resumo Executivo', desc: 'Visão de alto nível com métricas-chave para decisão rápida', period: 'Personalizado' },
];

const Relatorios = () => {
  return (
    <DashboardLayout title="Relatórios">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {reportTypes.map((r, i) => (
          <Card key={i} className="border-border animate-fade-in hover:border-primary/20 transition-all" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Período: {r.period}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="text-xs h-7"><Download className="h-3 w-3 mr-1" /> PDF</Button>
                <Button variant="outline" size="sm" className="text-xs h-7"><Download className="h-3 w-3 mr-1" /> CSV</Button>
                <Button variant="outline" size="sm" className="text-xs h-7"><Download className="h-3 w-3 mr-1" /> Excel</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;
