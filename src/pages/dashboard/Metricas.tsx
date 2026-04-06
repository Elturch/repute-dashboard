import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Period = "7d" | "14d" | "30d" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Última semana",
  "14d": "Últimas 2 semanas",
  "30d": "Último mes",
  "all": "Todo",
};

function periodToInterval(p: Period): string | null {
  if (p === "7d") return "7 days";
  if (p === "14d") return "14 days";
  if (p === "30d") return "30 days";
  return null;
}

const METRIC_KEYS = ["m_preocupacion", "m_rechazo", "m_descredito", "m_afinidad", "m_fiabilidad", "m_admiracion", "m_compromiso", "m_impacto", "m_influencia"] as const;
const METRIC_LABELS: Record<string, string> = {
  m_preocupacion: "Preocupación",
  m_rechazo: "Rechazo",
  m_descredito: "Descrédito",
  m_afinidad: "Afinidad",
  m_fiabilidad: "Fiabilidad",
  m_admiracion: "Admiración",
  m_compromiso: "Compromiso",
  m_impacto: "Impacto",
  m_influencia: "Influencia",
};

const NEGATIVE = new Set(["m_preocupacion", "m_rechazo", "m_descredito"]);
const POSITIVE = new Set(["m_afinidad", "m_fiabilidad", "m_admiracion", "m_compromiso"]);

function notaColor(v: number): string {
  if (v < 3) return "hsl(142, 71%, 45%)";
  if (v < 5) return "hsl(48, 96%, 53%)";
  if (v < 7) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 60%)";
}

function metricBarColor(key: string, value: number): string {
  const isNeg = NEGATIVE.has(key);
  if (isNeg) {
    if (value > 7) return "hsl(0, 84%, 60%)";
    if (value > 5) return "hsl(25, 95%, 53%)";
    if (value > 3) return "hsl(48, 96%, 53%)";
    return "hsl(142, 71%, 45%)";
  }
  if (POSITIVE.has(key)) {
    if (value > 7) return "hsl(142, 71%, 45%)";
    if (value > 5) return "hsl(48, 96%, 53%)";
    if (value > 3) return "hsl(25, 95%, 53%)";
    return "hsl(0, 84%, 60%)";
  }
  return "hsl(var(--primary))";
}

function riesgoBadge(r: string) {
  const rl = (r ?? "").toLowerCase();
  if (rl.includes("alto")) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">Alto</Badge>;
  if (rl.includes("medio")) return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">Medio</Badge>;
  if (rl.includes("bajo")) return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">Bajo</Badge>;
  return <Badge className="bg-muted text-muted-foreground border-border text-xs">Info</Badge>;
}

// Semi-circular gauge
function SemiGauge({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.min(value / max, 1);
  const angle = pct * 180;
  const color = notaColor(value);
  const arcLen = (angle / 180) * (Math.PI * 50);
  const totalArc = Math.PI * 50;
  return (
    <div className="relative w-48 h-24 mx-auto">
      <svg viewBox="0 0 120 65" className="w-full h-full">
        <path d="M 10 58 A 50 50 0 0 1 110 58" fill="none" stroke="hsl(var(--border))" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 58 A 50 50 0 0 1 110 58" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${arcLen} ${totalArc}`} />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-1">
        <span className="text-4xl font-bold text-foreground">{value.toFixed(2)}</span>
        <span className="text-lg text-muted-foreground ml-1">/10</span>
      </div>
    </div>
  );
}

const Metricas = () => {
  const [period, setPeriod] = useState<Period>("7d");

  // All events with metrics
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["metricas_events"],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from("monitor_reputacional_events")
        .select("fecha, m_nota_ponderada, m_preocupacion, m_rechazo, m_descredito, m_afinidad, m_fiabilidad, m_admiracion, m_compromiso, m_impacto, m_influencia, medio_plataforma, titular_o_texto, riesgo_reputacional, url")
        .not("m_nota_ponderada", "is", null)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Filter by period
  const periodEvents = useMemo(() => {
    const interval = periodToInterval(period);
    if (!interval) return events;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(interval));
    return events.filter((e) => new Date(e.fecha) >= cutoff);
  }, [events, period]);

  // Previous period for comparison
  const prevPeriodEvents = useMemo(() => {
    const days = period === "7d" ? 7 : period === "14d" ? 14 : period === "30d" ? 30 : 0;
    if (!days) return [];
    const now = new Date();
    const cutoffCurrent = new Date(now);
    cutoffCurrent.setDate(cutoffCurrent.getDate() - days);
    const cutoffPrev = new Date(cutoffCurrent);
    cutoffPrev.setDate(cutoffPrev.getDate() - days);
    return events.filter((e) => {
      const d = new Date(e.fecha);
      return d >= cutoffPrev && d < cutoffCurrent;
    });
  }, [events, period]);

  // Averages
  const avg = (arr: any[], key: string) => {
    const vals = arr.map((e) => e[key]).filter((v) => v != null);
    return vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
  };

  const currentNota = avg(periodEvents, "m_nota_ponderada");
  const prevNota = avg(prevPeriodEvents, "m_nota_ponderada");
  const notaDiff = prevPeriodEvents.length > 0 ? currentNota - prevNota : null;

  const metricAverages = METRIC_KEYS.map((k) => ({
    key: k,
    label: METRIC_LABELS[k],
    value: avg(periodEvents, k),
  }));

  // Radar data
  const radarData = metricAverages.map((m) => ({
    subject: m.label,
    value: parseFloat(m.value.toFixed(2)),
    fullMark: 10,
  }));

  // Daily evolution
  const dailyData = useMemo(() => {
    const byDay: Record<string, { count: number; preocupacion: number; rechazo: number; descredito: number; nota: number }> = {};
    periodEvents.forEach((e) => {
      const day = e.fecha.slice(0, 10);
      if (!byDay[day]) byDay[day] = { count: 0, preocupacion: 0, rechazo: 0, descredito: 0, nota: 0 };
      byDay[day].count++;
      byDay[day].preocupacion += e.m_preocupacion ?? 0;
      byDay[day].rechazo += e.m_rechazo ?? 0;
      byDay[day].descredito += e.m_descredito ?? 0;
      byDay[day].nota += e.m_nota_ponderada ?? 0;
    });
    return Object.entries(byDay)
      .map(([day, v]) => ({
        dia: format(new Date(day), "dd/MM", { locale: es }),
        Preocupación: parseFloat((v.preocupacion / v.count).toFixed(2)),
        Rechazo: parseFloat((v.rechazo / v.count).toFixed(2)),
        Descrédito: parseFloat((v.descredito / v.count).toFixed(2)),
        "Nota Ponderada": parseFloat((v.nota / v.count).toFixed(2)),
      }))
      .sort((a, b) => a.dia.localeCompare(b.dia));
  }, [periodEvents]);

  // Top 5 events
  const topEvents = useMemo(() => {
    return [...periodEvents]
      .sort((a, b) => (b.m_nota_ponderada ?? 0) - (a.m_nota_ponderada ?? 0))
      .slice(0, 5);
  }, [periodEvents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Métricas</h1>
        <div className="flex gap-1.5">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
              className="text-xs"
            >
              {PERIOD_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <>
          {/* Bloque 1 — KPI Nota Media */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-center">Nota Media Ponderada</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <SemiGauge value={currentNota} />
              {notaDiff !== null && (
                <div className={cn("flex items-center gap-1 mt-2 text-sm", notaDiff > 0 ? "text-red-400" : "text-emerald-400")}>
                  {notaDiff > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>{notaDiff > 0 ? "+" : ""}{notaDiff.toFixed(2)} vs periodo anterior ({prevNota.toFixed(2)})</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{periodEvents.length} eventos analizados</p>
            </CardContent>
          </Card>

          {/* Bloque 2 — Radar Chart */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Perfil Emocional Promedio</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-full max-w-[500px]">
                <ResponsiveContainer width="100%" height={420}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                    <Radar name="Valor" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bloque 3 — Grid 3x3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {metricAverages.map((m) => (
              <Card key={m.key} className="border-border/50">
                <CardContent className="pt-5 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{m.label}</span>
                    {NEGATIVE.has(m.key) && <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-[10px]">Negativa</Badge>}
                    {POSITIVE.has(m.key) && <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-[10px]">Positiva</Badge>}
                    {!NEGATIVE.has(m.key) && !POSITIVE.has(m.key) && <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">Neutra</Badge>}
                  </div>
                  <p className="text-3xl font-bold text-foreground">{m.value.toFixed(2)}</p>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(m.value / 10) * 100}%`,
                        backgroundColor: metricBarColor(m.key, m.value),
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bloque 4 — Evolución temporal */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Evolución Temporal de Métricas</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="dia" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Line type="monotone" dataKey="Nota Ponderada" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="Preocupación" stroke="hsl(0, 84%, 60%)" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="Rechazo" stroke="hsl(25, 95%, 53%)" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="Descrédito" stroke="hsl(48, 96%, 53%)" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-12">Sin datos para este periodo</p>
              )}
            </CardContent>
          </Card>

          {/* Bloque 5 — Top 5 eventos */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Eventos con Mayor Carga Emocional</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {topEvents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Fecha</TableHead>
                      <TableHead className="text-xs">Medio</TableHead>
                      <TableHead className="text-xs">Titular</TableHead>
                      <TableHead className="text-xs text-right">Nota</TableHead>
                      <TableHead className="text-xs text-right">Preocup.</TableHead>
                      <TableHead className="text-xs text-right">Rechazo</TableHead>
                      <TableHead className="text-xs text-right">Descrédito</TableHead>
                      <TableHead className="text-xs">Riesgo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topEvents.map((ev, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {format(new Date(ev.fecha), "dd/MM/yy", { locale: es })}
                        </TableCell>
                        <TableCell className="text-xs">{ev.medio_plataforma}</TableCell>
                        <TableCell className="text-sm">
                          {ev.url ? (
                            <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-start gap-1">
                              {ev.titular_o_texto?.length > 70 ? ev.titular_o_texto.slice(0, 70) + "…" : ev.titular_o_texto}
                              <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            </a>
                          ) : (
                            ev.titular_o_texto
                          )}
                        </TableCell>
                        <TableCell className={cn("text-xs text-right font-mono font-bold", notaColor(ev.m_nota_ponderada) === "hsl(0, 84%, 60%)" ? "text-red-400" : "text-foreground")}>
                          {ev.m_nota_ponderada?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">{ev.m_preocupacion?.toFixed(1) ?? "—"}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{ev.m_rechazo?.toFixed(1) ?? "—"}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{ev.m_descredito?.toFixed(1) ?? "—"}</TableCell>
                        <TableCell>{riesgoBadge(ev.riesgo_reputacional)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm p-6 text-center">Sin eventos en este periodo</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Metricas;
