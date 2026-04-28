import {
  Home, BarChart3, Network, Radio, Building2, TrendingUp, ShieldAlert, Search,
  FileText, Download, BookOpen, Settings, Users, ShieldCheck, Server,
  ChevronRight, Newspaper, LayoutDashboard, Star,
} from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiGoogle } from "react-icons/si";
import { FaXTwitter, FaLinkedin } from "react-icons/fa6";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type LinkItem = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
};

type Bloque = {
  id: string;
  titulo: string;
  icon: ComponentType<{ className?: string }>;
  iconClassName?: string;
  defaultOpen?: boolean;
  prefix?: string; // path prefix for auto-open detection
  links: LinkItem[];
};

const privadosLinks: LinkItem[] = [
  { title: "Resumen 30d", url: "/dashboard/privados", icon: LayoutDashboard, end: true },
  { title: "Medios", url: "/dashboard/privados/noticias", icon: Newspaper },
  { title: "Instagram", url: "/dashboard/privados/instagram", icon: SiInstagram },
  { title: "X (Twitter)", url: "/dashboard/privados/twitter", icon: FaXTwitter },
  { title: "TikTok", url: "/dashboard/privados/tiktok", icon: SiTiktok },
  { title: "Facebook", url: "/dashboard/privados/facebook", icon: SiFacebook },
  { title: "LinkedIn", url: "/dashboard/privados/linkedin", icon: FaLinkedin },
  { title: "Reseñas Google", url: "/dashboard/privados/mybusiness", icon: SiGoogle },
];

const sermasLinks: LinkItem[] = [
  { title: "Resumen 30d", url: "/dashboard/sermas", icon: LayoutDashboard, end: true },
  { title: "Medios", url: "/dashboard/sermas/medios", icon: Newspaper },
  { title: "Instagram", url: "/dashboard/sermas/instagram", icon: SiInstagram },
  { title: "X (Twitter)", url: "/dashboard/sermas/twitter", icon: FaXTwitter },
  { title: "TikTok", url: "/dashboard/sermas/tiktok", icon: SiTiktok },
  { title: "Facebook", url: "/dashboard/sermas/facebook", icon: SiFacebook },
  { title: "LinkedIn", url: "/dashboard/sermas/linkedin", icon: FaLinkedin },
  { title: "Reseñas Google", url: "/dashboard/sermas/mybusiness", icon: SiGoogle },
];

const catsalutLinks: LinkItem[] = [
  { title: "Resumen 30d", url: "/dashboard/catsalut", icon: LayoutDashboard, end: true },
  { title: "Medios", url: "/dashboard/catsalut/medios", icon: Newspaper },
  { title: "Instagram", url: "/dashboard/catsalut/instagram", icon: SiInstagram },
  { title: "X (Twitter)", url: "/dashboard/catsalut/twitter", icon: FaXTwitter },
  { title: "TikTok", url: "/dashboard/catsalut/tiktok", icon: SiTiktok },
  { title: "Facebook", url: "/dashboard/catsalut/facebook", icon: SiFacebook },
  { title: "LinkedIn", url: "/dashboard/catsalut/linkedin", icon: FaLinkedin },
  { title: "Reseñas Google", url: "/dashboard/catsalut/mybusiness", icon: SiGoogle },
];

const fjdLinks: LinkItem[] = [
  { title: "Fundación Jiménez Díaz", url: "/dashboard/fjd", icon: Star },
];

const coreLinks: LinkItem[] = [
  { title: "Resumen global", url: "/dashboard", icon: Home, end: true },
  { title: "Benchmarking", url: "/dashboard/benchmarking", icon: BarChart3 },
  { title: "Ecosistema", url: "/dashboard/ecosistema", icon: Network },
  { title: "Medios", url: "/dashboard/medios", icon: Building2 },
  { title: "Evolución", url: "/dashboard/evolucion", icon: TrendingUp },
  { title: "Riesgo y alertas", url: "/dashboard/riesgo", icon: ShieldAlert },
  { title: "Explorador", url: "/dashboard/explorador", icon: Search },
  { title: "Relato IA", url: "/dashboard/relato", icon: FileText },
  { title: "Canales", url: "/dashboard/canales", icon: Radio },
  { title: "Reportes", url: "/dashboard/reportes", icon: Download },
  { title: "Documentación", url: "/dashboard/docs", icon: BookOpen },
];

const especialesLinks: LinkItem[] = [
  { title: "Índice", url: "/dashboard/especiales", icon: FileText, end: true },
  { title: "Especial Ayuso", url: "/dashboard/especiales/ayuso", icon: Newspaper },
];

const sistemaLinks: LinkItem[] = [
  { title: "Administración", url: "/dashboard/sistema/admin", icon: Settings },
  { title: "Usuarios", url: "/dashboard/sistema/usuarios", icon: Users },
  { title: "Configuración", url: "/dashboard/sistema/configuracion", icon: Settings },
  { title: "Integridad", url: "/dashboard/sistema/integridad", icon: ShieldCheck },
  { title: "Estado", url: "/dashboard/sistema/estado", icon: Server },
];

const bloques: Bloque[] = [
  { id: "privados", titulo: "Comparativa privados", icon: BarChart3, prefix: "/dashboard/privados", defaultOpen: true, links: privadosLinks },
  { id: "sermas", titulo: "SERMAS", icon: Building2, prefix: "/dashboard/sermas", links: sermasLinks },
  { id: "catsalut", titulo: "CATSALUT", icon: Building2, iconClassName: "text-violet-500", prefix: "/dashboard/catsalut", links: catsalutLinks },
  { id: "fjd", titulo: "Hospitales destacados", icon: Star, iconClassName: "text-amber-500", prefix: "/dashboard/fjd", links: fjdLinks },
  { id: "core", titulo: "Core Quirón", icon: Home, links: coreLinks },
  { id: "especiales", titulo: "Especiales", icon: FileText, prefix: "/dashboard/especiales", links: especialesLinks },
];

function isBloqueActive(bloque: Bloque, pathname: string): boolean {
  if (bloque.prefix) {
    // exact prefix match guarded by boundary
    return pathname === bloque.prefix || pathname.startsWith(bloque.prefix + "/");
  }
  return bloque.links.some(l =>
    l.end ? pathname === l.url : (pathname === l.url || pathname.startsWith(l.url + "/"))
  );
}

function storageKey(id: string) {
  return `sidebar_${id}_open`;
}

function readPersisted(id: string): boolean | null {
  try {
    const v = localStorage.getItem(storageKey(id));
    if (v === "1") return true;
    if (v === "0") return false;
    return null;
  } catch {
    return null;
  }
}

function BloqueGroup({ bloque, collapsed, pathname }: { bloque: Bloque; collapsed: boolean; pathname: string }) {
  const active = isBloqueActive(bloque, pathname);
  const persisted = readPersisted(bloque.id);
  const initialOpen = active || (persisted ?? bloque.defaultOpen ?? false);
  const [open, setOpen] = useState(initialOpen);

  // Auto-open when nav changes into this block
  useEffect(() => {
    if (active && !open) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const handleChange = (next: boolean) => {
    setOpen(next);
    try { localStorage.setItem(storageKey(bloque.id), next ? "1" : "0"); } catch { /* noop */ }
  };

  const Icon = bloque.icon;
  const count = bloque.links.length;

  return (
    <SidebarGroup>
      <Collapsible open={collapsed ? true : open} onOpenChange={collapsed ? undefined : handleChange}>
        {!collapsed && (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group/bloque flex items-center w-full px-2 py-1.5 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
            >
              <SidebarGroupLabel className="flex-1 flex items-center gap-1.5 px-0 text-[13px] cursor-pointer">
                <Icon className={`h-3.5 w-3.5 ${bloque.iconClassName ?? ""}`} />
                <span className="flex-1 text-left">{bloque.titulo}</span>
                {count > 1 && (
                  <span className="text-[10px] opacity-50 mr-1">({count})</span>
                )}
                <ChevronRight
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                />
              </SidebarGroupLabel>
            </button>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <SidebarGroupContent>
            <SidebarMenu>
              {bloque.links.map(link => {
                const LinkIcon = link.icon;
                return (
                  <SidebarMenuItem key={link.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={link.url}
                        end={link.end}
                        className="hover:bg-sidebar-accent/50 text-[14px]"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{link.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isSuperadmin = localStorage.getItem("mr_is_superadmin") === "true";
  const { pathname } = useLocation();

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
        {bloques.map(b => (
          <BloqueGroup key={b.id} bloque={b} collapsed={collapsed} pathname={pathname} />
        ))}

        {isSuperadmin && (
          <BloqueGroup
            bloque={{ id: "sistema", titulo: "Sistema", icon: Settings, links: sistemaLinks }}
            collapsed={collapsed}
            pathname={pathname}
          />
        )}
      </SidebarContent>
    </Sidebar>
  );
}
