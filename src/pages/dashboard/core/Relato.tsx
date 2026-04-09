import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  BookOpen, AlertTriangle, Shield, TrendingUp, Search, List, LayoutGrid,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { useRelatoTimeline, RelatoEntry } from "@/hooks/useRelatoTimeline";
import { safeFormat } from "@/lib/safe-format";

/* ── helpers ── */
function riesgoBadge(r: string | null) {
  const l = (r ?? "").toLowerCase();
  if (l.includes("bajo")) return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">🟢 Bajo</Badge>;
  if (l.includes("medio")) return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">🟡 Medio</Badge>;
  if (l.includes("alto")) return <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-xs">🟠 Alto</Badge>;
  if (l.includes("criti") || l.includes("críti")) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">🔴 Crítico</Badge>;
  return <Badge variant="outline" className="text-xs">{r || "—"}</Badge>;
}

function tonoBadge(entry: RelatoEntry) {
  const nota = entry.nota_media_ponderada ?? 5;
  const pct = entry.pct_peligrosas ?? 0;
  if (nota < 4 && pct > 30) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">Negativo</Badge>;
  if (nota >= 4 && nota < 6) return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">Neutro</Badge>;
  return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">Positivo</Badge>;
}

function tonoValue(entry: RelatoEntry): "positivo" | "neutro" | "negativo" {
  const nota = entry.nota_media_ponderada ?? 5;
  const pct = entry.pct_peligrosas ?? 0;
  if (nota < 4 && pct > 30) return "negativo";
  if (nota >= 4 && nota < 6) return "neutro";
  return "positivo";
}

function recomendacionStyle(rec: string | null): string {
  const r = (rec ?? "").toLowerCase();
  if (r.includes("pasiva")) return "border-emerald-600/40 bg-emerald-950/20";
  if (r.includes("reforzada")) return "border-yellow-600/40 bg-yellow-950/20";
  if (r.includes("preventiva")) return "border-orange-600/40 bg-orange-950/20";
  if (r.includes("crisis")) return "border-red-600/40 bg-red-950/20";
  return "border-border bg-card";
}

function notaColor(n: number): string {
  if (n < 3) return "hsl(142, 71%, 45%)";
  if (n < 5) return "hsl(48, 96%, 53%)";
  if (n < 7) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 60%)";
}

/* ── Main ── */
const Relato = () => {
  const [riesgoFilter, setRiesgoFilter] = useState("todos");
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const filters = useMemo(() => ({
    riesgo: riesgoFilter,
    search: searchText || undefined,
  }), [riesgoFilter, searchText]);

  const { data: entries, isLoading, error } = useRelatoTimeline(filters);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Chart data — tone evolution
  const chartData = useMemo(() => {
    if (!entries?.length) return [];
    return [...entries].reverse().map(e => ({
      semana: e.semana ?? "—",
      nota: e.nota_media_ponderada ?? 0,
      peligrosas: e.pct_peligrosas ?? 0,
    }));
  }, [entries]);

  const chartConfig = {
    nota: { label: "Nota Media", color: "hsl(var(--primary))" },
    peligrosas: { label: "% Peligrosas", color: "hsl(0, 84%, 60%)" },
  };

  // Executive summary from latest entry
  const latest = entries?.[0];
  const temas = latest?.temas_principales ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relato Acumulado</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Narrativa reputacional · Timeline de análisis IA</p>
      </div>

      {/* Executive Summary */}
      {latest && (
        <div className={`rounded-lg border p-5 space-y-3 ${recomendacionStyle(latest.recomendacion_accion)}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Resumen Ejecutivo · {latest.semana ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              {tonoBadge(latest)}
              {riesgoBadge(latest.riesgo_agregado)}
            </div>
          </div>
          <p className="text-sm text-foreground font-medium">{latest.recomendacion_accion ?? "—"}</p>
          {latest.resumen_narrativo && (
            <p className="text-sm text-muted-foreground leading-relaxed">{latest.resumen_narrativo}</p>
          )}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
            <span>Nota media: <strong className="text-foreground" style={{ color: notaColor(latest.nota_media_ponderada ?? 5) }}>
              {(latest.nota_media_ponderada ?? 0).toFixed(1)}/10
            </strong></span>
            <span>Relevantes: <strong className="text-foreground">{latest.total_relevantes ?? 0}</strong> de {latest.total_escaneadas ?? 0}</span>
            <span>% Peligrosas: <strong className="text-foreground">{(latest.pct_peligrosas ?? 0).toFixed(1)}%</strong></span>
          </div>
          {temas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {temas.map((t, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded bg-accent/50 text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tone Evolution Chart */}
      {chartData.length > 1 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Evolución de Tono</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-48 w-full">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="fillNota" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillPeligro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="nota" name="nota" stroke="hsl(var(--primary))" fill="url(#fillNota)" strokeWidth={2} />
                <Area type="monotone" dataKey="peligrosas" name="peligrosas" stroke="hsl(0, 84%, 60%)" fill="url(#fillPeligro)" strokeWidth={2} strokeDasharray="4 2" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en narrativas..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="pl-9 bg-accent/20 border-border/50"
          />
        </div>
        <Select value={riesgoFilter} onValueChange={setRiesgoFilter}>
          <SelectTrigger className="w-40 bg-accent/20 border-border/50">
            <SelectValue placeholder="Riesgo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los riesgos</SelectItem>
            <SelectItem value="bajo">Bajo</SelectItem>
            <SelectItem value="medio">Medio</SelectItem>
            <SelectItem value="alto">Alto</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border border-border/50 rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode("cards")}
            className={`p-2 ${viewMode === "cards" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : error ? (
        <Card className="border-destructive/30">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-foreground font-medium">Error al cargar el relato</p>
            <p className="text-sm text-muted-foreground mt-1">Inténtalo de nuevo más tarde</p>
          </CardContent>
        </Card>
      ) : !entries?.length ? (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-foreground font-medium">Sin entradas narrativas</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchText || riesgoFilter !== "todos" ? "Prueba ajustando los filtros" : "El relato se genera automáticamente con el análisis semanal"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border/50" />

          <div className="space-y-4">
            {entries.map((entry) => {
              const isExpanded = expandedIds.has(entry.id) || viewMode === "cards";
              const isHighRisk = (entry.riesgo_agregado ?? "").toLowerCase().includes("alto") ||
                (entry.riesgo_puntual ?? "").toLowerCase().includes("alto");
              const tono = tonoValue(entry);

              return (
                <div key={entry.id} className="relative pl-12">
                  {/* Timeline dot */}
                  <div className={`absolute left-3.5 top-5 w-3 h-3 rounded-full border-2 ${
                    isHighRisk ? "bg-red-500 border-red-400" :
                    tono === "negativo" ? "bg-orange-500 border-orange-400" :
                    tono === "positivo" ? "bg-emerald-500 border-emerald-400" :
                    "bg-yellow-500 border-yellow-400"
                  }`} />

                  <Card className={`border-border/50 ${isHighRisk ? "border-l-2 border-l-red-500/60" : ""}`}>
                    <CardContent className="pt-4 pb-3">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-muted-foreground">{entry.semana ?? "—"}</span>
                            <span className="text-xs text-muted-foreground">
                              {safeFormat(entry.fecha_inicio, "dd MMM")} — {safeFormat(entry.fecha_fin, "dd MMM yyyy")}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-foreground mt-1">{entry.recomendacion_accion ?? "Sin recomendación"}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {tonoBadge(entry)}
                          {riesgoBadge(entry.riesgo_agregado)}
                          {isHighRisk && <AlertTriangle className="h-4 w-4 text-red-400" />}
                          {viewMode === "list" && (
                            <button onClick={() => toggleExpand(entry.id)} className="ml-1 text-muted-foreground hover:text-foreground">
                              {expandedIds.has(entry.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Compact stats */}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-2">
                        <span>Nota: <strong style={{ color: notaColor(entry.nota_media_ponderada ?? 5) }}>
                          {(entry.nota_media_ponderada ?? 0).toFixed(1)}
                        </strong></span>
                        <span>Relevantes: <strong className="text-foreground">{entry.total_relevantes ?? 0}</strong></span>
                        <span>% Peligrosas: <strong className="text-foreground">{(entry.pct_peligrosas ?? 0).toFixed(1)}%</strong></span>
                        {entry.riesgo_puntual && entry.riesgo_puntual !== entry.riesgo_agregado && (
                          <span>Riesgo puntual: {riesgoBadge(entry.riesgo_puntual)}</span>
                        )}
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="space-y-3 mt-3 pt-3 border-t border-border/30">
                          {entry.resumen_narrativo && (
                            <p className="text-sm text-muted-foreground leading-relaxed">{entry.resumen_narrativo}</p>
                          )}
                          {entry.nuevos_angulos && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Nuevos ángulos</p>
                              <p className="text-sm text-foreground/80">{entry.nuevos_angulos}</p>
                            </div>
                          )}
                          {entry.nuevos_medios && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Nuevos medios</p>
                              <p className="text-sm text-foreground/80">{entry.nuevos_medios}</p>
                            </div>
                          )}
                          {(entry.temas_principales ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {(entry.temas_principales ?? []).map((t, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded bg-accent/50 text-muted-foreground">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Relato;
