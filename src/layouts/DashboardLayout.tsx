import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Download, Tv, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { OnboardingModal } from "@/components/OnboardingModal";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { useTvMode } from "@/hooks/useTvMode";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tv = useTvMode();

  // Cursor oculto tras 3s sin movimiento (solo en modo TV)
  useEffect(() => {
    if (!tv.active) { document.body.style.cursor = ""; return; }
    let timeout: ReturnType<typeof setTimeout>;
    const show = () => {
      document.body.style.cursor = "";
      clearTimeout(timeout);
      timeout = setTimeout(() => { document.body.style.cursor = "none"; }, 3000);
    };
    show();
    window.addEventListener("mousemove", show);
    return () => {
      window.removeEventListener("mousemove", show);
      clearTimeout(timeout);
      document.body.style.cursor = "";
    };
  }, [tv.active]);

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!tv.active && <AppSidebar />}
        <div className="flex-1 flex flex-col">
          {tv.active ? (
            <>
              <div className="h-10 flex items-center justify-between px-6 bg-[hsl(222,47%,8%)]/95 backdrop-blur border-b border-border">
                <span className="text-xs font-bold tracking-widest text-primary">QUIRÓNSALUD 4.0 · TV</span>
                <span className="text-xs font-mono text-muted-foreground">{tv.currentIndex + 1} / {tv.total}</span>
                <button
                  onClick={tv.stop}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                  Salir TV (Esc)
                </button>
              </div>
              <div className="h-[3px] w-full bg-border">
                <div
                  className="h-full bg-primary transition-[width] duration-100 ease-linear"
                  style={{ width: `${tv.progress}%` }}
                />
              </div>
            </>
          ) : (
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
              <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={tv.start}>
                <Tv className="h-3.5 w-3.5" />
                TV Auto
              </Button>
            </div>
          </header>
          )}
          <main className="flex-1 p-6">
            <Outlet />
          </main>
          {!tv.active && <OnboardingModal />}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
