import { useState, useEffect } from 'react';
import { Download, Share, MoreVertical, Plus, ArrowDown, Smartphone, CheckCircle2, Apple, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import trustfyLogo from '@/assets/trustfy-logo.png';

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Windows|Macintosh|Linux/.test(ua) && !/Mobile/.test(ua)) return 'desktop';
  return 'unknown';
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Instalar() {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (installed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-primary/20 bg-card">
          <CardContent className="flex flex-col items-center gap-6 pt-10 pb-10 text-center">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">App Instalado!</h1>
              <p className="text-muted-foreground text-sm">O TRUSTFY já está na sua tela inicial. Abra por lá para a melhor experiência.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-10 sm:py-16">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 mb-10 text-center max-w-lg">
        <img src={trustfyLogo} alt="TRUSTFY" className="h-16 w-16" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Instale o TRUSTFY
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Acesse seu dashboard direto da tela inicial do celular — rápido, sem navegador, com notificações push.
        </p>
      </div>

      {/* Install button (Android/Desktop with prompt) */}
      {deferredPrompt && (
        <Button onClick={handleInstallClick} size="lg" className="mb-10 gap-2 text-base px-8 h-12">
          <Download className="h-5 w-5" />
          Instalar Agora
        </Button>
      )}

      {/* Instructions */}
      <div className="w-full max-w-lg space-y-6">
        {/* iOS */}
        {(platform === 'ios' || platform === 'unknown') && (
          <Card className="border-border bg-card">
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                  <Apple className="h-5 w-5 text-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">iPhone / iPad</h2>
              </div>

              <Step number={1} icon={<Share className="h-4 w-4" />}>
                Abra no <strong>Safari</strong> e toque no botão <strong>Compartilhar</strong>{' '}
                <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-muted"><Share className="h-3.5 w-3.5 text-foreground" /></span>
              </Step>

              <Step number={2} icon={<Plus className="h-4 w-4" />}>
                Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>{' '}
                <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-muted"><Plus className="h-3.5 w-3.5 text-foreground" /></span>
              </Step>

              <Step number={3} icon={<CheckCircle2 className="h-4 w-4" />}>
                Toque em <strong>"Adicionar"</strong> no canto superior direito. Pronto!
              </Step>
            </CardContent>
          </Card>
        )}

        {/* Android */}
        {(platform === 'android' || platform === 'unknown') && (
          <Card className="border-border bg-card">
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Android</h2>
              </div>

              <Step number={1} icon={<Chrome className="h-4 w-4" />}>
                Abra no <strong>Chrome</strong> e toque no menu{' '}
                <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-muted"><MoreVertical className="h-3.5 w-3.5 text-foreground" /></span>
              </Step>

              <Step number={2} icon={<Download className="h-4 w-4" />}>
                Toque em <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>
              </Step>

              <Step number={3} icon={<CheckCircle2 className="h-4 w-4" />}>
                Confirme tocando em <strong>"Instalar"</strong>. O ícone aparecerá na sua tela!
              </Step>
            </CardContent>
          </Card>
        )}

        {/* Desktop */}
        {platform === 'desktop' && !deferredPrompt && (
          <Card className="border-border bg-card">
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                  <Chrome className="h-5 w-5 text-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Desktop (Chrome)</h2>
              </div>

              <Step number={1} icon={<ArrowDown className="h-4 w-4" />}>
                Clique no ícone de instalação <strong>⊕</strong> na barra de endereço do Chrome
              </Step>

              <Step number={2} icon={<CheckCircle2 className="h-4 w-4" />}>
                Clique em <strong>"Instalar"</strong> na janela que aparecer
              </Step>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Benefits */}
      <div className="mt-10 w-full max-w-lg grid grid-cols-3 gap-3">
        {[
          { icon: '⚡', label: 'Acesso rápido' },
          { icon: '🔔', label: 'Push em tempo real' },
          { icon: '📱', label: 'Tela cheia' },
        ].map((b) => (
          <div key={b.label} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center">
            <span className="text-2xl">{b.icon}</span>
            <span className="text-xs text-muted-foreground font-medium">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step({ number, icon, children }: { number: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
        {number}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed pt-0.5">{children}</p>
    </div>
  );
}
