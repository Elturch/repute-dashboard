import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Monitor, Download, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { OnboardingModal } from "@/components/OnboardingModal";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { useTvMode } from "@/hooks/useTvMode";
import { TvModeOverlay } from "@/components/TvModeOverlay";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { active: tvActive, start: startTv } = useTvMode();

  useEffect(() => {
    // Prefetch único de la vista materializada de KPIs (≈191 filas, 144 KB).
    queryClient.prefetchQuery({
      queryKey: ['kpi_canal_global'],
      queryFn: async () => {
        const { data, error } = await externalSupabase
          .from('v_kpi_canal_30d')
          .select('*')
          .limit(2000);
        if (error) throw error;
        return data ?? [];
      },
      staleTime: 30 * 60 * 1000,
    }).catch(() => { /* silencioso */ });
  }, [queryClient]);

  useEffect(() => {
    if (tvActive) document.body.classList.add('tv-mode');
    else document.body.classList.remove('tv-mode');
    return () => document.body.classList.remove('tv-mode');
  }, [tvActive]);

  if (tvActive) {
    return (
      <>
        <TvModeOverlay />
        <main className="pt-[43px] min-h-screen bg-background">
          <Outlet />
        </main>
      </>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50">
            <div className="flex items-center">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <span className="ml-4 text-sm font-medium text-muted-foreground">
                Quirónsalud 4.0
              </span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => navigate("/dashboard/reportes")}>
                <Download className="h-3.5 w-3.5" />
                Reportes
              </Button>
              <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={startTv}>
                <Tv className="h-3.5 w-3.5" />
                TV Auto
              </Button>
              <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => navigate("/dashboard/tv")}>
                <Monitor className="h-3.5 w-3.5" />
                Modo TV P
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
          <OnboardingModal />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
