import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Zap, AlertTriangle, BarChart3, Activity, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRelatoAcumulado,
  useContadoresSemanales,
  useCascadasActivas,
  useUltimosEventos,
  useCascadasRecientes,
  useWeeklySnapshots,
} from "@/hooks/useDashboardData";

// --- Helpers ---

function notaColor(nota: number): string {
  if (nota < 3) return "hsl(142, 71%, 45%)";
  if (nota < 5) return "hsl(48, 96%, 53%)";
  if (nota < 7) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 60%)";
}

function riesgoBadge(riesgo: string) {
  const r = (riesgo ?? "").toLowerCase();
  if (r.includes("bajo")) return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">🟢 BAJO</Badge>;
  if (r.includes("medio")) return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">🟡 MEDIO</Badge>;
  if (r.includes("alto")) return <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30">🟠 ALTO</Badge>;
  if (r.includes("criti") || r.includes("críti")) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30">🔴 CRÍTICO</Badge>;
  return <Badge variant="outline">{riesgo}</Badge>;
}

function riesgoEventBadge(riesgo: string) {
  const r = (riesgo ?? "").toLowerCase();
  if (r.includes("alto")) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">Alto</Badge>;
  if (r.includes("medio")) return <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-xs">Medio</Badge>;
  if (r.includes("bajo")) return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">Bajo</Badge>;
  return <Badge className="bg-muted text-muted-foreground border-border text-xs">Info</Badge>;
}

function recomendacionColor(rec: string): string {
  const r = (rec ?? "").toLowerCase();
  if (r.includes("pasiva")) return "border-emerald-600/40 bg-emerald-950/30";
  if (r.includes("reforzada")) return "border-yellow-600/40 bg-yellow-950/30";
  if (r.includes("preventiva")) return "border-orange-600/40 bg-orange-950/30";
  if (r.includes("crisis")) return "border-red-600/40 bg-red-950/30";
  return "border-border bg-card";
}

function formatDate(d: string) {
  if (!d) return "";
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function truncate(s: string, max: number) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

// --- Gauge Component ---
function SemiGauge({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.min(value / max, 1);
  const angle = pct * 180;
  const color = notaColor(value);
  return (
    <div className="relative w-32 h-16 mx-auto">
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="hsl(var(--border))" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M 10 55 A 50 50 0 0 1 110 55"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${angle * (Math.PI * 50) / 180} 999`}
        />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-0">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">/10</span>
      </div>
    </div>
  );
}

// --- KPI Card ---
function KPICard({ title, children, icon, loading }: { title: string; children: React.ReactNode; icon?: React.ReactNode; loading?: boolean }) {
  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </CardHeader>
      <CardContent>{loading ? <Skeleton className="h-16 w-full" /> : children}</CardContent>
    </Card>
  );
}

// --- Main ---
const Resumen = () => {
  const relato = useRelatoAcumulado();
  const contadores = useContadoresSemanales();
  const cascadasCount = useCascadasActivas();
  const eventos = useUltimosEventos();
  const cascadas = useCascadasRecientes();
  const weekly = useWeeklySnapshots();

  const cascadasActivasCount = cascadasCount.data as unknown as number | undefined;
  // contadores data
  const c = contadores.data as Record<string, any> | null;

  // Funnel data
  const funnelData = c
    ? [
        { name: "Escaneadas", value: c.total_escaneadas ?? 0 },
        { name: "Relevantes", value: c.total_relevantes ?? 0 },
        { name: "Riesgo Alto", value: c.total_riesgo_alto ?? 0 },
        { name: "Riesgo Medio", value: c.total_riesgo_medio ?? 0 },
        { name: "Riesgo Bajo", value: c.total_riesgo_bajo ?? 0 },
      ]
    : [];

  const funnelColors = ["hsl(var(--primary))", "hsl(217, 91%, 70%)", "hsl(0, 84%, 60%)", "hsl(25, 95%, 53%)", "hsl(142, 71%, 45%)"];

  const chartConfig = {
    menciones: { label: "Menciones", color: "hsl(var(--primary))" },
    alertas: { label: "Alertas", color: "hsl(0, 84%, 60%)" },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Resumen</h1>

      {/* Bloque 1 — KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Nota Media Ponderada" icon={<BarChart3 className="h-4 w-4" />} loading={relato.isLoading}>
          {relato.data ? (
            <SemiGauge value={Number(relato.data.nota_media_ponderada ?? 0)} />
          ) : (
            <p className="text-muted-foreground text-sm">Sin datos</p>
          )}
        </KPICard>

        <KPICard title="Riesgo Agregado" icon={<AlertTriangle className="h-4 w-4" />} loading={relato.isLoading}>
          {relato.data ? (
            <div className="flex justify-center pt-2">{riesgoBadge(String(relato.data.riesgo_agregado ?? ""))}</div>
          ) : (
            <p className="text-muted-foreground text-sm">Sin datos</p>
          )}
        </KPICard>

        <KPICard title="Menciones Esta Semana" icon={<Activity className="h-4 w-4" />} loading={contadores.isLoading}>
          {c ? (
            <p className="text-3xl font-bold text-foreground text-center">{c.total_relevantes ?? 0}</p>
          ) : (
            <p className="text-muted-foreground text-sm">Sin datos</p>
          )}
        </KPICard>

        <KPICard title="Cascadas Activas" icon={<Zap className="h-4 w-4" />} loading={cascadasCount.isLoading}>
          <p className="text-3xl font-bold text-foreground text-center flex items-center justify-center gap-2">
            <Zap className="h-6 w-6 text-yellow-400" />
            {cascadasActivasCount ?? 0}
          </p>
        </KPICard>
      </div>

      {/* Bloque 2 — Funnel */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">
            Funnel de Menciones {c?.semana ? `— Semana ${c.semana}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contadores.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : funnelData.length > 0 ? (
            <div className="space-y-3">
              {funnelData.map((item, i) => {
                const maxVal = funnelData[0].value || 1;
                const pct = ((item.value / maxVal) * 100).toFixed(1);
                const pctPrev = i > 0 && funnelData[i - 1].value > 0
                  ? ((item.value / funnelData[i - 1].value) * 100).toFixed(1)
                  : null;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="text-foreground font-medium">
                        {item.value.toLocaleString()}
                        {pctPrev && <span className="text-muted-foreground ml-2 text-xs">({pctPrev}% del anterior)</span>}
                      </span>
                    </div>
                    <div className="h-6 rounded bg-muted/30 overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: funnelColors[i] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Sin datos</p>
          )}
        </CardContent>
      </Card>

      {/* Bloques 3 + 4 — Eventos y Cascadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bloque 3 — Últimos Eventos */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Últimos Eventos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {eventos.isLoading ? (
              <div className="p-6"><Skeleton className="h-48 w-full" /></div>
            ) : (eventos.data ?? []).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Fecha</TableHead>
                    <TableHead className="text-xs">Medio</TableHead>
                    <TableHead className="text-xs">Titular</TableHead>
                    <TableHead className="text-xs">Riesgo</TableHead>
                    <TableHead className="text-xs text-right">Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(eventos.data ?? []).map((ev: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs whitespace-nowrap">{formatDate(ev.fecha)}</TableCell>
                      <TableCell className="text-xs max-w-[100px] truncate">{ev.medio_plataforma}</TableCell>
                      <TableCell className="text-xs">
                        {ev.url ? (
                          <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            {truncate(ev.titular_o_texto, 60)}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        ) : (
                          truncate(ev.titular_o_texto, 60)
                        )}
                      </TableCell>
                      <TableCell>{riesgoEventBadge(ev.riesgo_reputacional)}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{ev.m_nota_ponderada ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm p-6">Sin eventos</p>
            )}
          </CardContent>
        </Card>

        {/* Bloque 4 — Cascadas Recientes */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Cascadas Recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cascadas.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (cascadas.data ?? []).length > 0 ? (
              (cascadas.data ?? []).map((c: any, i: number) => (
                <div key={i} className="rounded-lg border border-border/50 bg-accent/30 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.topic_description || c.topic_key}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.alert_count} medio{c.alert_count !== 1 ? "s" : ""} · Primero: {c.first_source}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge className={c.status === "active"
                        ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs"
                        : "bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs"
                      }>
                        {c.status === "active" ? "Activa" : "Resuelta"}
                      </Badge>
                      {riesgoEventBadge(c.max_riesgo)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Último: {c.last_alert_at ? new Date(c.last_alert_at).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Sin cascadas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bloque 5 — Evolución Semanal */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Evolución Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          {weekly.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (weekly.data ?? []).length > 0 ? (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={weekly.data ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="n_menciones" name="menciones" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="n_alertas" name="alertas" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-sm">Sin datos de evolución</p>
          )}
        </CardContent>
      </Card>

      {/* Bloque 6 — Recomendación */}
      {relato.data && relato.data.recomendacion_accion && (
        <div className={`rounded-lg border p-6 space-y-2 ${recomendacionColor(String(relato.data.recomendacion_accion))}`}>
          <p className="text-lg font-semibold text-foreground">{relato.data.recomendacion_accion}</p>
          {relato.data.resumen_narrativo && (
            <p className="text-sm text-muted-foreground leading-relaxed">{relato.data.resumen_narrativo}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Resumen;
