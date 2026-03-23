import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Vendas from "./pages/Vendas";
import Trafego from "./pages/Trafego";
import Produtos from "./pages/Produtos";
import UTMs from "./pages/UTMs";
import Financeiro from "./pages/Financeiro";
import PixPendentes from "./pages/PixPendentes";
import Recuperacao from "./pages/Recuperacao";
import Notificacoes from "./pages/Notificacoes";
import Relatorios from "./pages/Relatorios";
import Integracoes from "./pages/Integracoes";
import Configuracoes from "./pages/Configuracoes";
import ModoEscala from "./pages/ModoEscala";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/trafego" element={<Trafego />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/utms" element={<UTMs />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/pix-pendentes" element={<PixPendentes />} />
          <Route path="/recuperacao" element={<Recuperacao />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/integracoes" element={<Integracoes />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/modo-escala" element={<ModoEscala />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
