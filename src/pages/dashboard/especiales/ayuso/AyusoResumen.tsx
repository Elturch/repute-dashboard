import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NavLink } from "@/components/NavLink";
import {
  BarChart3, Zap, ArrowRight,
  FileText, TrendingUp, Newspaper, Users, GitBranch, Clock,
} from "lucide-react";
import {
  useRelatoAcumulado,
  useContadoresSemanales,
  useCascadasActivasDetalle,
  useWeeklySnapshots,
} from "@/hooks/useDashboardData";

/* ── helpers ── */
function notaColor(n: number): string {
  if (n < 3) return "hsl(142, 71%, 45%)";
  if (n < 5) return "hsl(48, 96%, 53%)";
  if (n < 7) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 60%)";
}

function riesgoBadge(riesgo: string) {
  const r = (riesgo ?? "").toLowerCase();
  if (r.includes("bajo")) return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">🟢 Bajo</Badge>;
  if (r.includes("medio")) return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">🟡 Medio</Badge>;
  if (r.includes("alto")) return <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30">🟠 Alto</Badge>;
  if (r.includes("criti") || r.includes("críti")) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30">🔴 Crítico</Badge>;
  return <Badge variant="outline">{riesgo || "—"}</Badge>;
}

function SemiGauge({ value }: { value: number }) {
  const pct = Math.min(value / 10, 1);
  const angle = pct * 180;
  const color = notaColor(value);
  return (
    <div className="relative w-28 h-14 mx-auto">
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="hsl(var(--border))" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${angle * (Math.PI * 50) / 180} 999`} />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-0">
        <span className="text-xl font-bold text-foreground">{value.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">/10</span>
      </div>
    </div>
  );
}

const MODULES = [
  { label: "Eventos", path: "eventos", icon: FileText, desc: "Cronología de eventos monitorizados" },
  { label: "Métricas", path: "metricas", icon: BarChart3, desc: "Análisis emocional y tendencias" },
  { label: "Medios", path: "medios", icon: Newspaper, desc: "Cobertura por medio y fuente" },
  { label: "Cascadas", path: "cascadas", icon: GitBranch, desc: "Propagación mediática en cascada" },
  { label: "Social", path: "social", icon: Users, desc: "Señales y amplificación social" },
  { label: "Hitos", path: "hitos", icon: TrendingUp, desc: "Hitos narrativos clave" },
  { label: "Evolución", path: "evolucion", icon: Clock, desc: "Evolución semanal histórica" },
];

/* ── Main ── */
const AyusoResumen = () => {
  const relato = useRelatoAcumulado();
  const contadores = useContadoresSemanales();
  const cascadas = useCascadasActivasDetalle();
  const weekly = useWeeklySnapshots();

  const c = contadores.data as Record<string, any> | null;
  const nota = Number(relato.data?.nota_media_ponderada ?? 0);
  const _lastWeek = weekly.data?.length ? (weekly.data[weekly.data.length - 1] as any) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-3 mb-1">
          <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Activo
          </Badge>
          <Badge variant="outline" className="text-xs text-red-400 border-red-600/30">Prioridad alta</Badge>
        </div>
        <h1 className="text-2xl font-bold text-foreground mt-2">Especial Ayuso / Quirónsalud</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitorización reputacional del caso Ayuso y su impacto en Quirónsalud
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Nota Media</p>
            {relato.isLoading ? <Skeleton className="h-14 w-full" /> :
              relato.data ? <SemiGauge value={nota} /> : <p className="text-sm text-muted-foreground">Sin datos</p>}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Riesgo</p>
            {relato.isLoading ? <Skeleton className="h-10 w-full" /> :
              relato.data ? <div className="flex justify-center mt-2">{riesgoBadge(String(relato.data.riesgo_agregado ?? ""))}</div>
                : <p className="text-sm text-muted-foreground">—</p>}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Menciones</p>
            {contadores.isLoading ? <Skeleton className="h-10 w-full" /> :
              <p className="text-2xl font-bold text-foreground text-center">{(c?.total_relevantes ?? 0).toLocaleString()}</p>}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Cascadas</p>
            {cascadas.isLoading ? <Skeleton className="h-10 w-full" /> :
              <p className="text-2xl font-bold text-foreground text-center flex items-center justify-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" /> {cascadas.data?.length ?? 0}
              </p>}
          </CardContent>
        </Card>
      </div>

      {/* Recommendation */}
      {relato.data?.recomendacion_accion && (
        <div className={`rounded-lg border p-4 ${
          (relato.data.recomendacion_accion ?? "").toLowerCase().includes("crisis") ? "border-red-600/40 bg-red-950/20" :
          (relato.data.recomendacion_accion ?? "").toLowerCase().includes("preventiva") ? "border-orange-600/40 bg-orange-950/20" :
          (relato.data.recomendacion_accion ?? "").toLowerCase().includes("reforzada") ? "border-yellow-600/40 bg-yellow-950/20" :
          "border-emerald-600/40 bg-emerald-950/20"
        }`}>
          <p className="text-sm font-semibold text-foreground">{relato.data.recomendacion_accion}</p>
          {relato.data.resumen_narrativo && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{relato.data.resumen_narrativo}</p>
          )}
        </div>
      )}

      {/* Modules Grid */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Módulos de análisis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {MODULES.map(mod => {
            const Icon = mod.icon;
            return (
              <NavLink key={mod.path} to={`/dashboard/especiales/ayuso/${mod.path}`} className="block group">
                <Card className="border-border/50 hover:border-primary/40 transition-all h-full">
                  <CardContent className="pt-4 pb-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-accent/50 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{mod.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{mod.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </CardContent>
                </Card>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AyusoResumen;
