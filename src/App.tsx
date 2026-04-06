import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import Resumen from "./pages/dashboard/Resumen";
import Eventos from "./pages/dashboard/Eventos";
import Metricas from "./pages/dashboard/Metricas";
import Medios from "./pages/dashboard/Medios";
import Cascadas from "./pages/dashboard/Cascadas";
import Social from "./pages/dashboard/Social";
import Hitos from "./pages/dashboard/Hitos";
import Evolucion from "./pages/dashboard/Evolucion";
import Admin from "./pages/dashboard/Admin";
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
            <Route index element={<Resumen />} />
            <Route path="eventos" element={<Eventos />} />
            <Route path="metricas" element={<Metricas />} />
            <Route path="medios" element={<Medios />} />
            <Route path="cascadas" element={<Cascadas />} />
            <Route path="social" element={<Social />} />
            <Route path="hitos" element={<Hitos />} />
            <Route path="evolucion" element={<Evolucion />} />
            <Route path="admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
