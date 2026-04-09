import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardLayout = () => {
  const navigate = useNavigate();
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
            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => navigate("/dashboard/tv")}>
              <Monitor className="h-3.5 w-3.5" />
              Modo TV P
            </Button>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
