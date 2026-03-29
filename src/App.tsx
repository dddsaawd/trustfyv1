import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
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
import Instalar from "./pages/Instalar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedPage><Index /></ProtectedPage>} />
            <Route path="/vendas" element={<ProtectedPage><Vendas /></ProtectedPage>} />
            <Route path="/trafego" element={<ProtectedPage><Trafego /></ProtectedPage>} />
            <Route path="/produtos" element={<ProtectedPage><Produtos /></ProtectedPage>} />
            <Route path="/utms" element={<ProtectedPage><UTMs /></ProtectedPage>} />
            <Route path="/financeiro" element={<ProtectedPage><Financeiro /></ProtectedPage>} />
            <Route path="/pix-pendentes" element={<ProtectedPage><PixPendentes /></ProtectedPage>} />
            <Route path="/recuperacao" element={<ProtectedPage><Recuperacao /></ProtectedPage>} />
            <Route path="/notificacoes" element={<ProtectedPage><Notificacoes /></ProtectedPage>} />
            <Route path="/relatorios" element={<ProtectedPage><Relatorios /></ProtectedPage>} />
            <Route path="/integracoes" element={<ProtectedPage><Integracoes /></ProtectedPage>} />
            <Route path="/configuracoes" element={<ProtectedPage><Configuracoes /></ProtectedPage>} />
            <Route path="/modo-escala" element={<ProtectedPage><ModoEscala /></ProtectedPage>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
