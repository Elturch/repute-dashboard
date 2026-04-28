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
import Relato from "./pages/dashboard/core/Relato";

// Channel pages
import NoticiasChannel from "./pages/dashboard/canales/NoticiasChannel";
import FacebookChannel from "./pages/dashboard/canales/FacebookChannel";
import InstagramChannel from "./pages/dashboard/canales/InstagramChannel";
import TikTokChannel from "./pages/dashboard/canales/TikTokChannel";
import TwitterChannel from "./pages/dashboard/canales/TwitterChannel";
import LinkedInChannel from "./pages/dashboard/canales/LinkedInChannel";
import MyBusinessChannel from "./pages/dashboard/canales/MyBusinessChannel";

// Privados
import PrivadosNoticias from "./pages/dashboard/privados/PrivadosNoticias";
import PrivadosResumen from "./pages/dashboard/privados/PrivadosResumen";
import PrivadosInstagram from "./pages/dashboard/privados/PrivadosInstagram";
import PrivadosTwitter from "./pages/dashboard/privados/PrivadosTwitter";
import PrivadosTikTok from "./pages/dashboard/privados/PrivadosTikTok";
import PrivadosFacebook from "./pages/dashboard/privados/PrivadosFacebook";
import PrivadosLinkedIn from "./pages/dashboard/privados/PrivadosLinkedIn";
import PrivadosMyBusiness from "./pages/dashboard/privados/PrivadosMyBusiness";

// SERMAS
import SermasResumen from "./pages/dashboard/sermas/SermasResumen";
import SermasMedios from "./pages/dashboard/sermas/SermasMedios";
import SermasInstagram from "./pages/dashboard/sermas/SermasInstagram";
import SermasTwitter from "./pages/dashboard/sermas/SermasTwitter";
import SermasTikTok from "./pages/dashboard/sermas/SermasTikTok";
import SermasFacebook from "./pages/dashboard/sermas/SermasFacebook";
import SermasLinkedIn from "./pages/dashboard/sermas/SermasLinkedIn";
import SermasMyBusiness from "./pages/dashboard/sermas/SermasMyBusiness";

// CATSALUT
import CatsalutResumen from "./pages/dashboard/catsalut/CatsalutResumen";
import CatsalutMedios from "./pages/dashboard/catsalut/CatsalutMedios";
import CatsalutInstagram from "./pages/dashboard/catsalut/CatsalutInstagram";
import CatsalutTwitter from "./pages/dashboard/catsalut/CatsalutTwitter";
import CatsalutTikTok from "./pages/dashboard/catsalut/CatsalutTikTok";
import CatsalutFacebook from "./pages/dashboard/catsalut/CatsalutFacebook";
import CatsalutLinkedIn from "./pages/dashboard/catsalut/CatsalutLinkedIn";
import CatsalutMyBusiness from "./pages/dashboard/catsalut/CatsalutMyBusiness";

// FJD (hospital destacado)
import FJDPage from "./pages/dashboard/fjd/FJDPage";

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
import Reportes from "./pages/dashboard/Reportes";
import Notificaciones from "./pages/dashboard/Notificaciones";
import Docs from "./pages/dashboard/Docs";
import Estado from "./pages/dashboard/sistema/Estado";
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
            <Route path="canales/noticias" element={<NoticiasChannel />} />
            <Route path="canales/facebook" element={<FacebookChannel />} />
            <Route path="canales/instagram" element={<InstagramChannel />} />
            <Route path="canales/tiktok" element={<TikTokChannel />} />
            <Route path="canales/twitter" element={<TwitterChannel />} />
            <Route path="canales/linkedin" element={<LinkedInChannel />} />
            <Route path="canales/mybusiness" element={<MyBusinessChannel />} />
            <Route path="privados" element={<PrivadosResumen />} />
            <Route path="privados/noticias" element={<PrivadosNoticias />} />
            <Route path="privados/instagram" element={<PrivadosInstagram />} />
            <Route path="privados/twitter" element={<PrivadosTwitter />} />
            <Route path="privados/tiktok" element={<PrivadosTikTok />} />
            <Route path="privados/facebook" element={<PrivadosFacebook />} />
            <Route path="privados/linkedin" element={<PrivadosLinkedIn />} />
            <Route path="privados/mybusiness" element={<PrivadosMyBusiness />} />
            <Route path="sermas" element={<SermasResumen />} />
            <Route path="sermas/medios" element={<SermasMedios />} />
            <Route path="sermas/instagram" element={<SermasInstagram />} />
            <Route path="sermas/twitter" element={<SermasTwitter />} />
            <Route path="sermas/tiktok" element={<SermasTikTok />} />
            <Route path="sermas/facebook" element={<SermasFacebook />} />
            <Route path="sermas/linkedin" element={<SermasLinkedIn />} />
            <Route path="sermas/mybusiness" element={<SermasMyBusiness />} />
            <Route path="catsalut" element={<CatsalutResumen />} />
            <Route path="catsalut/medios" element={<CatsalutMedios />} />
            <Route path="catsalut/instagram" element={<CatsalutInstagram />} />
            <Route path="catsalut/twitter" element={<CatsalutTwitter />} />
            <Route path="catsalut/tiktok" element={<CatsalutTikTok />} />
            <Route path="catsalut/facebook" element={<CatsalutFacebook />} />
            <Route path="catsalut/linkedin" element={<CatsalutLinkedIn />} />
            <Route path="catsalut/mybusiness" element={<CatsalutMyBusiness />} />
            <Route path="medios" element={<MediosGlobal />} />
            <Route path="evolucion" element={<EvolucionGlobal />} />
            <Route path="riesgo" element={<Riesgo />} />
            <Route path="explorador" element={<Explorador />} />
            <Route path="fjd" element={<FJDPage />} />
            <Route path="relato" element={<Relato />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="notificaciones" element={<Notificaciones />} />
            <Route path="docs" element={<Docs />} />

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

            {/* Legacy redirects */}
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
            <Route path="sistema/estado" element={<Estado />} />

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
