import {
  Home,
  Newspaper,
  BarChart3,
  Building2,
  Zap,
  Share2,
  Flag,
  TrendingUp,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Resumen", url: "/dashboard", icon: Home },
  { title: "Eventos", url: "/dashboard/eventos", icon: Newspaper },
  { title: "Métricas", url: "/dashboard/metricas", icon: BarChart3 },
  { title: "Medios", url: "/dashboard/medios", icon: Building2 },
  { title: "Cascadas", url: "/dashboard/cascadas", icon: Zap },
  { title: "Social", url: "/dashboard/social", icon: Share2 },
  { title: "Hitos", url: "/dashboard/hitos", icon: Flag },
  { title: "Evolución", url: "/dashboard/evolucion", icon: TrendingUp },
];

const adminItems = [
  { title: "Administración", url: "/dashboard/admin", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isSuperadmin = localStorage.getItem("mr_is_superadmin") === "true";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        {!collapsed && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
              Estudio activo
            </p>
            <p className="text-sm font-semibold text-sidebar-primary-foreground truncate">
              Quirónsalud / Ayuso
            </p>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperadmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Sistema</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
