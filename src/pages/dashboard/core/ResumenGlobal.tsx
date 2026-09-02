import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  BarChart3, AlertTriangle, Activity, Zap, Newspaper, Shield,
  TrendingUp, TrendingDown, Minus, ExternalLink, ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { safeFormat, safeFormatDistance } from "@/lib/safe-format";
import {
  useRelatoAcumulado,
  useContadoresSemanales,
  useCascadasActivasDetalle,
  useUltimosEventos,
} from "@/hooks/useDashboardData";
import { useBenchmarkSegmentos } from "@/hooks/useBenchmarkSegmentos";
import { useEvolucionSemanal } from "@/hooks/useEvolucionSemanal";
import type { SegmentoAggregated } from "@/hooks/useBenchmarkSegmentos";

/* ── helpers ── */

function notaColor(nota: number): string {
  if (nota < 3) return "hsl(142, 71%, 45%)";
  if (nota < 5) return "hsl(48, 96%, 53%)";
  if (nota < 7) return "hsl(25, 95%, 53%)";
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

function riesgoSmallBadge(riesgo: string) {
  const r = (riesgo ?? "").toLowerCase();
  if (r.includes("alto") || r.includes("criti") || r.includes("críti"))
    return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">{riesgo}</Badge>;
  if (r.includes("medio"))
    return <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-xs">{riesgo}</Badge>;
  return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">{riesgo || "—"}</Badge>;
}

function recomendacionStyle(rec: string) {
  const r = (rec ?? "").toLowerCase();
  if (r.includes("pasiva")) return "border-emerald-600/40 bg-emerald-950/20";
  if (r.includes("reforzada")) return "border-yellow-600/40 bg-yellow-950/20";
  if (r.includes("preventiva")) return "border-orange-600/40 bg-orange-950/20";
  if (r.includes("crisis")) return "border-red-600/40 bg-red-950/20";
  return "border-border bg-card";
}

function variationIcon(v: number | null | undefined) {
  if (v == null) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (v > 0) return <TrendingUp className="h-4 w-4 text-red-400" />;
  if (v < 0) return <TrendingDown className="h-4 w-4 text-emerald-400" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function variationText(v: number | null | undefined) {
  if (v == null) return "Sin variación";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v}% vs semana anterior`;
}

function truncate(s: string, max: number) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatRangeShort(start: Date, end: Date): string {
  const d1 = start.getDate();
  const d2 = end.getDate();
  const m1 = MONTHS_ES[start.getMonth()];
  const m2 = MONTHS_ES[end.getMonth()];
  if (m1 === m2) return `${d1}–${d2} ${m2}`;
  return `${d1} ${m1}–${d2} ${m2}`;
}

function formatDateRange(startStr: string | null | undefined, endStr: string | null | undefined): string {
  if (!startStr || !endStr) return "—";
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "—";
  return formatRangeShort(start, end);
}

type MetricKey = keyof SegmentoAggregated;

function rankOf(rows: SegmentoAggregated[], key: MetricKey, lowerIsBetter = false): number | null {
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => {
    const av = (a[key] as number | undefined) ?? (lowerIsBetter ? Infinity : -Infinity);
    const bv = (b[key] as number | undefined) ?? (lowerIsBetter ? Infinity : -Infinity);
    return lowerIsBetter ? av - bv : bv - av;
  });
  const idx = sorted.findIndex(r => r.key === "quironsalud");
  return idx >= 0 ? idx + 1 : null;
}

function rankColor(rank: number | null, total: number): string {
  if (!rank || total <= 0) return "text-muted-foreground bg-muted";
  const t1 = Math.ceil(total / 3);
  const t2 = Math.ceil((2 * total) / 3);
  if (rank <= t1) return "text-emerald-400 bg-emerald-600/15 border-emerald-600/30";
  if (rank <= t2) return "text-amber-400 bg-amber-600/15 border-amber-600/30";
  return "text-red-400 bg-red-600/15 border-red-600/30";
}

/* ── Gauge ── */
function SemiGauge({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.min(value / max, 1);
  const angle = pct * 180;
  const color = notaColor(value);
  return (
    <div className="relative w-36 h-[4.5rem] mx-auto">
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="hsl(var(--border))" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M 10 55 A 50 50 0 0 1 110 55"
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${angle * (Math.PI * 50) / 180} 999`}
        />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-0">
        <span className="text-3xl font-bold text-foreground">{value.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground ml-0.5">/10</span>
      </div>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ title, value, sub, icon, loading }: {
  title: string; value: React.ReactNode; sub?: React.ReactNode; icon: React.ReactNode; loading?: boolean;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-5 pb-4 px-5">
        {loading ? <Skeleton className="h-20 w-full" /> : (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
              <span className="text-muted-foreground">{icon}</span>
            </div>
            <div>{value}</div>
            {sub && <div className="mt-2">{sub}</div>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Market position ── */
function MarketPositionCard({ data, loading }: { data?: SegmentoAggregated[]; loading?: boolean }) {
  const total = data?.length ?? 0;
  const market = data?.find(s => s.key === "general");
  const quiron = data?.find(s => s.key === "quironsalud");

  const metrics: { key: MetricKey; label: string; reverse: boolean; fmt: (v: number) => string }[] = [
    { key: "nota_media", label: "Nota", reverse: false, fmt: v => v.toFixed(1) },
    { key: "afinidad", label: "Afinidad", reverse: false, fmt: v => v.toFixed(1) },
    { key: "fiabilidad", label: "Fiabilidad", reverse: false, fmt: v => v.toFixed(1) },
    { key: "impacto", label: "Impacto", reverse: false, fmt: v => v.toFixed(1) },
    { key: "peligro_alto_pct", label: "% Peligro", reverse: true, fmt: v => `${v.toFixed(1)}%` },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Posición en el mercado</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-32 w-full" /> : !data?.length || !quiron ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sin datos de benchmark</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border/30 pb-1">
              <span className="col-span-3">Métrica</span>
              <span className="col-span-3 text-right">Quirón</span>
              <span className="col-span-3 text-right">Media mercado</span>
              <span className="col-span-3 text-right">Puesto</span>
            </div>
            {metrics.map(m => {
              const rank = rankOf(data, m.key, m.reverse);
              const qv = (quiron[m.key] as number | undefined) ?? 0;
              const mv = (market?.[m.key] as number | undefined) ?? 0;
              return (
                <div key={String(m.key)} className="grid grid-cols-12 gap-2 items-center text-sm">
                  <span className="col-span-3 text-foreground">{m.label}</span>
                  <span className="col-span-3 text-right font-semibold text-foreground">{m.fmt(qv)}</span>
                  <span className="col-span-3 text-right text-muted-foreground">{m.fmt(mv)}</span>
                  <div className="col-span-3 flex justify-end">
                    <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-medium border ${rankColor(rank, total)}`}>
                      {rank ? `#${rank} de ${total}` : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Channels ── */
const CHANNELS = [
  { key: "news", label: "Noticias", icon: Newspaper, color: "hsl(var(--primary))" },
  { key: "x", label: "X / Twitter", icon: () => <span className="text-xs font-bold">𝕏</span>, color: "hsl(210, 10%, 60%)" },
  { key: "instagram", label: "Instagram", icon: () => <span className="text-xs">📷</span>, color: "hsl(330, 70%, 55%)" },
  { key: "tiktok", label: "TikTok", icon: () => <span className="text-xs">🎵</span>, color: "hsl(170, 70%, 50%)" },
  { key: "facebook", label: "Facebook", icon: () => <span className="text-xs">f</span>, color: "hsl(220, 60%, 55%)" },
  { key: "linkedin", label: "LinkedIn", icon: () => <span className="text-xs font-bold">in</span>, color: "hsl(200, 70%, 45%)" },
  { key: "mybusiness", label: "My Business", icon: () => <span className="text-xs">⭐</span>, color: "hsl(45, 80%, 55%)" },
];

const ACTORS = [
  { key: "quironsalud", label: "Quirónsalud", primary: true },
  { key: "sermas", label: "SERMAS" },
  { key: "catsalut", label: "CatSalut" },
  { key: "gh_privados", label: "GH Privados" },
  { key: "gestion_privada", label: "Públicos gestión privada" },
];

/* ── Main ── */
const ResumenGlobal = () => {
  const navigate = useNavigate();
  const relato = useRelatoAcumulado();
  const contadores = useContadoresSemanales();
  const cascadasActivas = useCascadasActivasDetalle();
  const eventos = useUltimosEventos();
  const segmentos = useBenchmarkSegmentos();
  const weekly = useEvolucionSemanal();

  const c = contadores.data as Record<string, any> | null;
  const nota = Number(relato.data?.nota_media_ponderada ?? 0);

  const weeklyData = useMemo(() => {
    if (!weekly.data?.length) return [];
    return weekly.data.map(s => ({
      semana: formatDateRange(s.fecha_inicio, s.fecha_fin),
      n_menciones: s.n_menciones ?? 0,
      n_alertas: s.n_alertas ?? 0,
    }));
  }, [weekly.data]);

  const weeklyVariation = weekly.data?.length
    ? weekly.data[weekly.data.length - 1].variacion_vs_semana_anterior
    : null;

  const notaRank = useMemo(() => rankOf(segmentos.data ?? [], "nota_media", false), [segmentos.data]);
  const marketNote = useMemo(() => segmentos.data?.find(s => s.key === "general")?.nota_media ?? null, [segmentos.data]);

  const chartConfig = {
    n_menciones: { label: "Menciones", color: "hsl(var(--primary))" },
    n_alertas: { label: "Alertas", color: "hsl(0, 84%, 60%)" },
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resumen Ejecutivo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitorización reputacional · Quirónsalud
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/dashboard/benchmarking")}
            className="text-xs px-3 py-1.5 rounded-md border border-border bg-accent/40 text-muted-foreground hover:text-foreground transition-colors"
          >
            Benchmarking →
          </button>
        </div>
      </div>

      {/* Row 1 — KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Nota Media"
          icon={<BarChart3 className="h-4 w-4" />}
          loading={relato.isLoading}
          value={relato.data ? <SemiGauge value={nota} /> : <p className="text-sm text-muted-foreground">Sin datos</p>}
          sub={
            segmentos.isLoading ? (
              <Skeleton className="h-4 w-24 mx-auto mt-2" />
            ) : notaRank && marketNote != null ? (
              <p className="text-center text-xs mt-2">
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 border ${rankColor(notaRank, segmentos.data?.length ?? 0)}`}>
                  #{notaRank} de {segmentos.data?.length ?? 0}
                </span>
                <span className="text-muted-foreground ml-2">media mercado {Number(marketNote).toFixed(1)}</span>
              </p>
            ) : null
          }
        />
        <StatCard
          title="Riesgo Agregado"
          icon={<AlertTriangle className="h-4 w-4" />}
          loading={relato.isLoading}
          value={
            relato.data
              ? <div className="flex justify-center pt-3">{riesgoBadge(String(relato.data.riesgo_agregado ?? ""))}</div>
              : <p className="text-sm text-muted-foreground">Sin datos</p>
          }
        />
        <StatCard
          title="Menciones Semana"
          icon={<Activity className="h-4 w-4" />}
          loading={contadores.isLoading}
          value={
            c ? <p className="text-3xl font-bold text-foreground text-center">{(c.total_relevantes ?? 0).toLocaleString()}</p>
              : <p className="text-sm text-muted-foreground">Sin datos</p>
          }
          sub={
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              {variationIcon(weeklyVariation)}
              <span>{variationText(weeklyVariation)}</span>
            </div>
          }
        />
        <StatCard
          title="Riesgos Activos"
          icon={<Zap className="h-4 w-4" />}
          loading={cascadasActivas.isLoading}
          value={
            <p className="text-3xl font-bold text-foreground text-center flex items-center justify-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              {cascadasActivas.data?.length ?? 0}
            </p>
          }
        />
      </div>

      <MarketPositionCard data={segmentos.data} loading={segmentos.isLoading} />

      {/* Row 2 — Trend + Risks side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Trend chart — 3 cols */}
        <Card className="border-border/50 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Evolución Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            {weekly.isLoading ? <Skeleton className="h-48 w-full" /> :
              weeklyData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-48 w-full">
                  <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="fillMenciones" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="semana" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="n_menciones" name="n_menciones" stroke="hsl(var(--primary))" fill="url(#fillMenciones)" strokeWidth={2} />
                    <Area type="monotone" dataKey="n_alertas" name="n_alertas" stroke="hsl(0, 84%, 60%)" fill="none" strokeWidth={2} strokeDasharray="4 2" />
                  </AreaChart>
                </ChartContainer>
              ) : <p className="text-sm text-muted-foreground py-8 text-center">Sin datos de evolución</p>
            }
          </CardContent>
        </Card>

        {/* Active risks — 2 cols */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Riesgos Activos</CardTitle>
            <button onClick={() => navigate("/dashboard/riesgo")} className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {cascadasActivas.isLoading ? <Skeleton className="h-40 w-full" /> :
              (cascadasActivas.data ?? []).length > 0 ? (
                (cascadasActivas.data ?? []).map((c: any, i: number) => (
                  <div key={i} className="rounded-md border border-border/50 bg-accent/20 p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground leading-tight truncate">
                        {c.topic_description || c.topic_key || "Sin descripción"}
                      </p>
                      {riesgoSmallBadge(c.max_riesgo ?? "")}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.alert_count ?? 0} medio{(c.alert_count ?? 0) !== 1 ? "s" : ""} · {safeFormatDistance(c.last_alert_at)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Shield className="h-8 w-8 text-emerald-500/60 mb-2" />
                  <p className="text-sm text-muted-foreground">Sin riesgos activos</p>
                  <p className="text-xs text-muted-foreground/60">Situación estable</p>
                </div>
              )
            }
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — Funnel + Channels + Actors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Funnel */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Funnel Semanal {c?.semana ? `· S${c.semana}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contadores.isLoading ? <Skeleton className="h-40 w-full" /> : c ? (
              <div className="space-y-2.5">
                {[
                  { label: "Escaneadas", value: c.total_escaneadas ?? 0, color: "hsl(var(--primary))" },
                  { label: "Relevantes", value: c.total_relevantes ?? 0, color: "hsl(217, 91%, 70%)" },
                  { label: "Riesgo Alto", value: c.total_riesgo_alto ?? 0, color: "hsl(0, 84%, 60%)" },
                  { label: "Riesgo Medio", value: c.total_riesgo_medio ?? 0, color: "hsl(25, 95%, 53%)" },
                  { label: "Riesgo Bajo", value: c.total_riesgo_bajo ?? 0, color: "hsl(142, 71%, 45%)" },
                ].map((item, i, arr) => {
                  const maxVal = arr[0].value || 1;
                  const pct = (item.value / maxVal) * 100;
                  return (
                    <div key={item.label} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium text-foreground">{item.value.toLocaleString()}</span>
                      </div>
                      <div className="h-4 rounded bg-muted/30 overflow-hidden">
                        <div className="h-full rounded transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
          </CardContent>
        </Card>

        {/* Channels */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Canales Monitorizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.key}
                    onClick={() => navigate("/dashboard/canales")}
                    className="flex items-center gap-2 rounded-md border border-border/40 bg-accent/20 px-3 py-2 hover:bg-accent/40 transition-colors text-left"
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded" style={{ backgroundColor: ch.color + "22", color: ch.color }}>
                      <Icon />
                    </span>
                    <span className="text-xs text-foreground">{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actors */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ecosistema Hospitalario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ACTORS.map((actor) => (
                <button
                  key={actor.key}
                  onClick={() => navigate("/dashboard/ecosistema")}
                  className={`w-full flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors text-left ${
                    actor.primary
                      ? "border-primary/40 bg-primary/10 hover:bg-primary/20"
                      : "border-border/40 bg-accent/20 hover:bg-accent/40"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${actor.primary ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  <span className={`text-sm ${actor.primary ? "font-semibold text-primary" : "text-foreground"}`}>
                    {actor.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4 — Latest events */}
      <Card className="border-border/50">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Últimos Eventos</CardTitle>
          <button onClick={() => navigate("/dashboard/especiales/ayuso/eventos")} className="text-xs text-primary hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="h-3 w-3" />
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {eventos.isLoading ? (
            <div className="p-6"><Skeleton className="h-32 w-full" /></div>
          ) : (eventos.data ?? []).length > 0 ? (
            <div className="divide-y divide-border/30">
              {(eventos.data ?? []).slice(0, 6).map((ev: any, i: number) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <span className="text-xs text-muted-foreground w-12 flex-shrink-0">{safeFormat(ev.fecha, "dd/MM")}</span>
                  <span className="text-xs text-muted-foreground w-24 truncate flex-shrink-0">{ev.medio_plataforma ?? "—"}</span>
                  <span className="text-sm text-foreground flex-1 truncate">
                    {ev.url ? (
                      <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        {truncate(ev.titular_o_texto ?? "", 80)}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    ) : truncate(ev.titular_o_texto ?? "", 80)}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground w-8 text-right flex-shrink-0">{ev.m_nota_ponderada ?? "—"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin eventos recientes</p>
          )}
        </CardContent>
      </Card>

      {/* Row 5 — Recommendation + Specials alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {relato.data?.recomendacion_accion && (
          <div className={`rounded-lg border p-5 space-y-2 lg:col-span-2 ${recomendacionStyle(String(relato.data.recomendacion_accion))}`}>
            <p className="text-base font-semibold text-foreground">{relato.data.recomendacion_accion}</p>
            {relato.data.resumen_narrativo && (
              <p className="text-sm text-muted-foreground leading-relaxed">{relato.data.resumen_narrativo}</p>
            )}
          </div>
        )}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Especiales Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => navigate("/dashboard/especiales/ayuso")}
              className="w-full flex items-center gap-3 rounded-md border border-border/40 bg-accent/20 px-4 py-3 hover:bg-accent/40 transition-colors text-left"
            >
              <span className="text-lg">📌</span>
              <div>
                <p className="text-sm font-medium text-foreground">Especial Ayuso</p>
                <p className="text-xs text-muted-foreground">Seguimiento activo · Quirónsalud</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumenGlobal;
