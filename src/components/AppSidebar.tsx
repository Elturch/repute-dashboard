import {
  Home, BarChart3, Network, Radio, Building2, TrendingUp, ShieldAlert, Search,
  Hospital, FileText, Download, BookOpen, Settings, Users, ShieldCheck, Server,
  ChevronDown, Newspaper, Facebook, Instagram, Twitter, Music2, Linkedin, MapPin,
  LayoutDashboard, Radar,
} from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiGoogle } from "react-icons/si";
import { FaXTwitter, FaLinkedin } from "react-icons/fa6";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub,
  SidebarMenuSubItem, SidebarMenuSubButton, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

const coreItems = [
  { title: "Resumen global", url: "/dashboard", icon: Home, end: true },
  { title: "Benchmarking", url: "/dashboard/benchmarking", icon: BarChart3 },
  { title: "Ecosistema", url: "/dashboard/ecosistema", icon: Network },
  { title: "Medios", url: "/dashboard/medios", icon: Building2 },
  { title: "Evolución", url: "/dashboard/evolucion", icon: TrendingUp },
  { title: "Riesgo y alertas", url: "/dashboard/riesgo", icon: ShieldAlert },
  { title: "Explorador", url: "/dashboard/explorador", icon: Search },
  { title: "Relato IA", url: "/dashboard/relato", icon: FileText },
  { title: "Fund. Jiménez Díaz", url: "/dashboard/fjd", icon: Hospital },
  { title: "Reportes", url: "/dashboard/reportes", icon: Download },
  { title: "Documentación", url: "/dashboard/docs", icon: BookOpen },
];

const channelSubItems = [
  { title: "Vista general", url: "/dashboard/canales", icon: Radio, end: true },
  { title: "Noticias", url: "/dashboard/canales/noticias", icon: Newspaper },
  { title: "Facebook", url: "/dashboard/canales/facebook", icon: Facebook },
  { title: "Instagram", url: "/dashboard/canales/instagram", icon: Instagram },
  { title: "TikTok", url: "/dashboard/canales/tiktok", icon: Music2 },
  { title: "X / Twitter", url: "/dashboard/canales/twitter", icon: Twitter },
  { title: "LinkedIn", url: "/dashboard/canales/linkedin", icon: Linkedin },
  { title: "My Business", url: "/dashboard/canales/mybusiness", icon: MapPin },
];

const ayusoSubItems = [
  { title: "Resumen", url: "/dashboard/especiales/ayuso" },
  { title: "Eventos", url: "/dashboard/especiales/ayuso/eventos" },
  { title: "Métricas", url: "/dashboard/especiales/ayuso/metricas" },
  { title: "Medios", url: "/dashboard/especiales/ayuso/medios" },
  { title: "Cascadas", url: "/dashboard/especiales/ayuso/cascadas" },
  { title: "Social", url: "/dashboard/especiales/ayuso/social" },
  { title: "Hitos", url: "/dashboard/especiales/ayuso/hitos" },
  { title: "Evolución", url: "/dashboard/especiales/ayuso/evolucion" },
];

const sistemaItems = [
  { title: "Administración", url: "/dashboard/sistema/admin", icon: Settings },
  { title: "Usuarios", url: "/dashboard/sistema/usuarios", icon: Users },
  { title: "Configuración", url: "/dashboard/sistema/configuracion", icon: Settings },
  { title: "Integridad", url: "/dashboard/sistema/integridad", icon: ShieldCheck },
  { title: "Estado", url: "/dashboard/sistema/estado", icon: Server },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isSuperadmin = localStorage.getItem("mr_is_superadmin") === "true";
  const location = useLocation();
  const isInAyuso = location.pathname.startsWith("/dashboard/especiales/ayuso");
  const isInCanales = location.pathname.startsWith("/dashboard/canales");

  const [ayusoOpen, setAyusoOpen] = useState(isInAyuso);
  const [canalesOpen, setCanalesOpen] = useState(isInCanales);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        {!collapsed && (
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-sidebar-primary uppercase tracking-wider">Quirónsalud 4.0</p>
            <p className="text-[11px] text-sidebar-foreground/50">Monitor Reputacional</p>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {/* ── Comparativa privados ── */}
        <SidebarGroup>
          <SidebarGroupLabel>Comparativa privados</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/privados" end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Resumen 30d</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/privados/metricas" className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <Radar className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Métricas IA</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/privados/noticias" className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <Newspaper className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Medios</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/privados/instagram" className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <SiInstagram className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Instagram</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/privados/twitter" className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <FaXTwitter className="mr-2 h-4 w-4" />
                    {!collapsed && <span>X (Twitter)</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/privados/tiktok" className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <SiTiktok className="mr-2 h-4 w-4" />
                    {!collapsed && <span>TikTok</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/privados/facebook" className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <SiFacebook className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Facebook</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/privados/linkedin" className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <FaLinkedin className="mr-2 h-4 w-4" />
                    {!collapsed && <span>LinkedIn</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/privados/mybusiness" className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <SiGoogle className="mr-2 h-4 w-4" />
                    {!collapsed && <span>My Business</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Core Quirón ── */}
        <SidebarGroup>
          <SidebarGroupLabel>Core Quirón</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.end} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Canales collapsible */}
              {!collapsed ? (
                <Collapsible open={canalesOpen || isInCanales} onOpenChange={setCanalesOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="hover:bg-sidebar-accent/50 w-full justify-between">
                        <span className="flex items-center">
                          <Radio className="mr-2 h-4 w-4" />
                          <span>Canales</span>
                        </span>
                        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${canalesOpen || isInCanales ? "rotate-180" : ""}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {channelSubItems.map(sub => (
                          <SidebarMenuSubItem key={sub.url}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={sub.url} end={sub.end} className="hover:bg-sidebar-accent/50 text-xs" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                                <sub.icon className="mr-1.5 h-3 w-3" />
                                {sub.title}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/canales" className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <Radio className="mr-2 h-4 w-4" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Especiales ── */}
        <SidebarGroup>
          <SidebarGroupLabel>Especiales</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/especiales" end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <FileText className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Índice</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {!collapsed && (
                <Collapsible open={ayusoOpen || isInAyuso} onOpenChange={setAyusoOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="hover:bg-sidebar-accent/50 w-full justify-between">
                        <span className="flex items-center">
                          <Newspaper className="mr-2 h-4 w-4" />
                          <span>Especial Ayuso</span>
                        </span>
                        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${ayusoOpen || isInAyuso ? "rotate-180" : ""}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {ayusoSubItems.map(sub => (
                          <SidebarMenuSubItem key={sub.url}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={sub.url} end={sub.url === "/dashboard/especiales/ayuso"} className="hover:bg-sidebar-accent/50 text-xs" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                                {sub.title}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Sistema ── */}
        {isSuperadmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Sistema</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sistemaItems.map(item => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
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
