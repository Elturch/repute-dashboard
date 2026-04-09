import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";

// Core Quirón
import ResumenGlobal from "./pages/dashboard/core/ResumenGlobal";
import Benchmarking from "./pages/dashboard/core/Benchmarking";
import Ecosistema from "./pages/dashboard/core/Ecosistema";
import Canales from "./pages/dashboard/core/Canales";
import MediosGlobal from "./pages/dashboard/core/MediosGlobal";
import EvolucionGlobal from "./pages/dashboard/core/EvolucionGlobal";
import Riesgo from "./pages/dashboard/core/Riesgo";
import Explorador from "./pages/dashboard/core/Explorador";
import FJD from "./pages/dashboard/core/FJD";
import Relato from "./pages/dashboard/core/Relato";

// Especiales
import EspecialesIndex from "./pages/dashboard/especiales/EspecialesIndex";
import AyusoResumen from "./pages/dashboard/especiales/ayuso/AyusoResumen";
import Eventos from "./pages/dashboard/Eventos";
import Metricas from "./pages/dashboard/Metricas";
import MediosAyuso from "./pages/dashboard/Medios";
import Cascadas from "./pages/dashboard/Cascadas";
import Social from "./pages/dashboard/Social";
import Hitos from "./pages/dashboard/Hitos";
import EvolucionAyuso from "./pages/dashboard/Evolucion";

// Sistema
import Admin from "./pages/dashboard/Admin";
import Usuarios from "./pages/dashboard/sistema/Usuarios";
import Configuracion from "./pages/dashboard/sistema/Configuracion";
import Integridad from "./pages/dashboard/sistema/Integridad";
import ModoTV from "./pages/dashboard/ModoTV";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            {/* Core Quirón */}
            <Route index element={<ResumenGlobal />} />
            <Route path="benchmarking" element={<Benchmarking />} />
            <Route path="ecosistema" element={<Ecosistema />} />
            <Route path="canales" element={<Canales />} />
            <Route path="medios" element={<MediosGlobal />} />
            <Route path="evolucion" element={<EvolucionGlobal />} />
            <Route path="riesgo" element={<Riesgo />} />
            <Route path="explorador" element={<Explorador />} />
            <Route path="fjd" element={<FJD />} />
            <Route path="relato" element={<Relato />} />

            {/* Especiales */}
            <Route path="especiales" element={<EspecialesIndex />} />
            <Route path="especiales/ayuso" element={<AyusoResumen />} />
            <Route path="especiales/ayuso/eventos" element={<Eventos />} />
            <Route path="especiales/ayuso/metricas" element={<Metricas />} />
            <Route path="especiales/ayuso/medios" element={<MediosAyuso />} />
            <Route path="especiales/ayuso/cascadas" element={<Cascadas />} />
            <Route path="especiales/ayuso/social" element={<Social />} />
            <Route path="especiales/ayuso/hitos" element={<Hitos />} />
            <Route path="especiales/ayuso/evolucion" element={<EvolucionAyuso />} />

            {/* Legacy redirects — old Ayuso routes → new location */}
            <Route path="eventos" element={<Navigate to="/dashboard/especiales/ayuso/eventos" replace />} />
            <Route path="metricas" element={<Navigate to="/dashboard/especiales/ayuso/metricas" replace />} />
            <Route path="cascadas" element={<Navigate to="/dashboard/especiales/ayuso/cascadas" replace />} />
            <Route path="social" element={<Navigate to="/dashboard/especiales/ayuso/social" replace />} />
            <Route path="hitos" element={<Navigate to="/dashboard/especiales/ayuso/hitos" replace />} />

            {/* Sistema */}
            <Route path="sistema/admin" element={<Admin />} />
            <Route path="sistema/usuarios" element={<Usuarios />} />
            <Route path="sistema/configuracion" element={<Configuracion />} />
            <Route path="sistema/integridad" element={<Integridad />} />

            {/* Legacy redirect */}
            <Route path="admin" element={<Navigate to="/dashboard/sistema/admin" replace />} />
          </Route>
          <Route path="/dashboard/tv" element={<ModoTV />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
