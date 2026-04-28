import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Map, Database, BookMarked, Clock, HelpCircle } from "lucide-react";

const routes = [
  { path: "/dashboard", label: "Resumen Global", desc: "KPIs principales, alertas activas, relato semanal" },
  { path: "/dashboard/benchmarking", label: "Benchmarking", desc: "Comparativa entre grupos hospitalarios por nota IA" },
  { path: "/dashboard/ecosistema", label: "Ecosistema", desc: "Vista general del ecosistema hospitalario" },
  { path: "/dashboard/canales", label: "Canales", desc: "Métricas por canal: News, X, IG, TikTok, FB" },
  { path: "/dashboard/medios", label: "Medios", desc: "Análisis detallado de cobertura mediática" },
  { path: "/dashboard/evolucion", label: "Evolución", desc: "Evolución temporal de métricas reputacionales" },
  { path: "/dashboard/riesgo", label: "Riesgo y alertas", desc: "Cascadas activas, niveles de riesgo por canal" },
  { path: "/dashboard/explorador", label: "Explorador", desc: "Búsqueda avanzada en datos de reputación" },
  { path: "/dashboard/relato", label: "Relato IA", desc: "Narrativa acumulada semanal con timeline" },
  { path: "/dashboard/fjd", label: "Fund. Jiménez Díaz", desc: "Activo estratégico: KPIs, canales, alertas FJD" },
  { path: "/dashboard/reportes", label: "Reportes", desc: "Generador de informes personalizados (CSV/PNG)" },
  { path: "/dashboard/notificaciones", label: "Notificaciones", desc: "Historial completo de alertas y notificaciones" },
  { path: "/dashboard/especiales", label: "Especiales (Índice)", desc: "Listado de monográficos de reputación" },
  { path: "/dashboard/especiales/ayuso", label: "Especial Ayuso", desc: "Monográfico: Eventos, Métricas, Medios, Cascadas, Social, Hitos, Evolución" },
  { path: "/dashboard/sistema/admin", label: "Administración", desc: "Gestión de datos y vistas externas" },
  { path: "/dashboard/sistema/usuarios", label: "Usuarios", desc: "Gestión de usuarios del sistema" },
  { path: "/dashboard/sistema/configuracion", label: "Configuración", desc: "Parámetros del sistema" },
  { path: "/dashboard/sistema/integridad", label: "Integridad", desc: "Verificación de integridad de datos" },
  { path: "/dashboard/sistema/estado", label: "Estado del sistema", desc: "Diagnóstico de conexión y vistas" },
];

const views = [
  { view: "noticias_quironsalud_agrupadas", module: "Benchmarking, TV, Resumen" },
  { view: "noticias_gh_privados", module: "Benchmarking, TV" },
  { view: "noticias_sermas", module: "Benchmarking" },
  { view: "noticias_sermas_gestion_quironsalud", module: "Benchmarking, FJD" },
  { view: "noticias_catsalut", module: "Benchmarking, TV" },
  { view: "noticias_grupo_alta_complejidad", module: "Benchmarking" },
  { view: "noticias_fjd_fundacion", module: "FJD" },
  { view: "x_twitter_posts_quironsalud_agrupado", module: "TV, Canales" },
  { view: "x_twitter_posts_gh_agrupados", module: "TV" },
  { view: "x_twitter_posts_fundacion_jimenez_diaz", module: "FJD" },
  { view: "ig_posts_quironsalud_agrupados", module: "TV" },
  { view: "ig_posts_gh_agrupados", module: "TV" },
  { view: "ig_posts_fjd_", module: "FJD" },
  { view: "tiktok_posts_quironsalud_agrupado", module: "TV" },
  { view: "tiktok_posts_gh_agrupados", module: "TV" },
  { view: "tiktok_posts_fundacion_jimenez_diaz", module: "FJD" },
  { view: "fb_posts_quironsalud_agrupados", module: "TV" },
  { view: "fb_posts_gh_agrupados", module: "TV" },
  { view: "fb_posts_fundacion_jimenez_diaz", module: "FJD" },
  { view: "my_business_fdj", module: "FJD" },
  { view: "relato_acumulado", module: "Relato IA, Resumen" },
  { view: "alert_cascades", module: "Riesgo, Notificaciones, FJD, Resumen" },
  { view: "monitor_reputacional_events", module: "Especial Ayuso" },
];

const glossary = [
  { term: "Nota IA", def: "Puntuación media ponderada (0-10) asignada por el modelo de IA a cada contenido analizado. 0 = riesgo máximo, 10 = óptimo." },
  { term: "Fortaleza", def: "Índice compuesto: (Nota + Afinidad + Fiabilidad + Admiración) / 4. Refleja solidez reputacional." },
  { term: "Riesgo", def: "Índice compuesto: (Preocupación + Descrédito + Rechazo) / 3. Refleja vulnerabilidad reputacional." },
  { term: "Potencia", def: "Índice compuesto: (Influencia + Impacto) / 2. Refleja capacidad de difusión del contenido." },
  { term: "Tono", def: "Clasificación del sentimiento narrativo: Positivo / Neutro / Negativo." },
  { term: "Cascada", def: "Secuencia de alertas encadenadas sobre un mismo tema, con escalamiento progresivo." },
  { term: "Peligro reputacional", def: "Nivel de amenaza: Bajo, Medio, Alto o Crítico. Basado en combinación de riesgo e impacto." },
  { term: "Relato acumulado", def: "Resumen narrativo semanal generado por IA con análisis de tendencias, ángulos y recomendaciones." },
  { term: "Benchmarking", def: "Comparativa de métricas reputacionales entre grupos hospitalarios competidores." },
  { term: "Afinidad", def: "Grado de identificación positiva del público con la marca (0-10)." },
  { term: "Fiabilidad", def: "Percepción de credibilidad y confianza en la información (0-10)." },
  { term: "Admiración", def: "Nivel de reconocimiento positivo y prestigio percibido (0-10)." },
];

const changelog = [
  { fase: "10", title: "QA Final, Documentación y Onboarding", date: "Abril 2026" },
  { fase: "9", title: "Alertas Push y Notificaciones en Tiempo Real", date: "Abril 2026" },
  { fase: "8", title: "Exportación y Reporting", date: "Abril 2026" },
  { fase: "7", title: "Relato Acumulado IA", date: "Abril 2026" },
  { fase: "6", title: "Consolidar Especiales", date: "Abril 2026" },
  { fase: "5", title: "Fundación Jiménez Díaz", date: "Abril 2026" },
  { fase: "4", title: "Modo TV Premium", date: "Abril 2026" },
  { fase: "3", title: "Core Quirón completo", date: "Abril 2026" },
  { fase: "2", title: "Arquitectura de navegación", date: "Abril 2026" },
  { fase: "1", title: "Login y autenticación", date: "Abril 2026" },
];

const faqs = [
  { q: "¿Cómo accedo al sistema?", a: "El superadmin (datos@hablamosde.com) entra sin contraseña. El resto de usuarios reciben un magic link por email." },
  { q: "¿Cada cuánto se actualizan los datos?", a: "Las vistas de Supabase se actualizan en función del pipeline de datos. El dashboard consulta en tiempo real las vistas disponibles." },
  { q: "¿Qué es el Modo TV?", a: "Una experiencia fullscreen diseñada para pantallas verticales de 65 pulgadas. Rota automáticamente entre slides de benchmarking por canal." },
  { q: "¿Cómo exporto un informe?", a: "Desde /dashboard/reportes puedes seleccionar módulos, rango de fechas y formato (CSV/PNG). También hay botones de exportación en secciones individuales." },
  { q: "¿Qué significa una alerta 'crítica'?", a: "Una cascada con riesgo máximo que requiere atención inmediata. Genera notificación automática y toast visual." },
  { q: "¿Puedo personalizar las notificaciones?", a: "Sí, desde el panel de notificaciones puedes configurar la severidad mínima y activar/desactivar sonidos." },
];

const Docs = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <BookOpen className="h-6 w-6" /> Documentación
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Guía completa del Monitor Reputacional Quirónsalud 4.0
      </p>
    </div>

    <Tabs defaultValue="mapa" className="space-y-4">
      <TabsList className="grid grid-cols-5 w-full max-w-2xl">
        <TabsTrigger value="mapa" className="gap-1 text-xs"><Map className="h-3.5 w-3.5" /> Mapa</TabsTrigger>
        <TabsTrigger value="vistas" className="gap-1 text-xs"><Database className="h-3.5 w-3.5" /> Vistas</TabsTrigger>
        <TabsTrigger value="glosario" className="gap-1 text-xs"><BookMarked className="h-3.5 w-3.5" /> Glosario</TabsTrigger>
        <TabsTrigger value="changelog" className="gap-1 text-xs"><Clock className="h-3.5 w-3.5" /> Changelog</TabsTrigger>
        <TabsTrigger value="faq" className="gap-1 text-xs"><HelpCircle className="h-3.5 w-3.5" /> FAQ</TabsTrigger>
      </TabsList>

      <TabsContent value="mapa">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Mapa de navegación</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {routes.map((r) => (
                <div key={r.path} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                  <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">{r.path}</code>
                  <div>
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="vistas">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Vistas de Supabase utilizadas</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {views.map((v) => (
                <div key={v.view} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <code className="text-xs font-mono text-foreground">{v.view}</code>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {v.module.split(", ").map((m) => (
                      <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="glosario">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Glosario de términos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {glossary.map((g) => (
                <div key={g.term} className="border-b border-border/30 pb-3 last:border-0">
                  <p className="text-sm font-semibold text-primary">{g.term}</p>
                  <p className="text-sm text-muted-foreground">{g.def}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="changelog">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Changelog — Fases de construcción</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {changelog.map((c) => (
                <div key={c.fase} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                  <Badge variant="outline" className="text-xs shrink-0">Fase {c.fase}</Badge>
                  <p className="text-sm font-medium flex-1">{c.title}</p>
                  <span className="text-xs text-muted-foreground">{c.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="faq">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Preguntas frecuentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqs.map((f, i) => (
                <div key={i} className="border-b border-border/30 pb-4 last:border-0">
                  <p className="text-sm font-semibold">{f.q}</p>
                  <p className="text-sm text-muted-foreground mt-1">{f.a}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
);

export default Docs;
