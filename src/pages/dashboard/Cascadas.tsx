import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Zap, Newspaper, ExternalLink, Activity, Shield } from "lucide-react";
import { format, formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Source {
  medio: string;
  url: string;
  detected_at: string;
  tipo_fuente?: string;
  nota?: string;
}

interface Cascade {
  id: string;
  topic_key: string;
  topic_description: string;
  first_detected_at: string;
  first_source: string;
  first_url: string;
  alert_count: number;
  sources: Source[];
  last_alert_at: string;
  status: string;
  max_riesgo: string;
  keywords_matched: string[];
  created_at: string;
}

function riesgoBadge(r: string) {
  const rl = (r ?? "").toLowerCase();
  if (rl.includes("alto")) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">Alto</Badge>;
  if (rl.includes("medio")) return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">Medio</Badge>;
  if (rl.includes("bajo")) return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">Bajo</Badge>;
  return <Badge className="bg-muted text-muted-foreground border-border text-xs">Info</Badge>;
}

function statusBadge(s: string) {
  const sl = (s ?? "").toLowerCase();
  if (sl === "active" || sl === "expandiendose")
    return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs animate-pulse">{sl === "expandiendose" ? "Expandiéndose" : "Activa"}</Badge>;
  return <Badge variant="outline" className="text-xs text-muted-foreground">Resuelta</Badge>;
}

function riesgoBorderColor(r: string): string {
  const rl = (r ?? "").toLowerCase();
  if (rl.includes("alto")) return "border-l-red-500";
  if (rl.includes("medio")) return "border-l-orange-500";
  if (rl.includes("bajo")) return "border-l-emerald-500";
  return "border-l-border";
}

function isActive(s: string) {
  const sl = (s ?? "").toLowerCase();
  return sl === "active" || sl === "expandiendose";
}

function propagationTime(first: string, last: string): string {
  if (!first || !last) return "—";
  try {
    return formatDistanceStrict(new Date(last), new Date(first), { locale: es });
  } catch { return "—"; }
}

const Cascadas = () => {
  const { data: cascades = [], isLoading } = useQuery({
    queryKey: ["cascadas_all"],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from("alert_cascades")
        .select("*")
        .order("last_alert_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Cascade[];
    },
  });

  const totalCascadas = cascades.length;
  const activaCount = cascades.filter((c) => isActive(c.status)).length;
  const maxPropagacion = cascades.reduce((m, c) => Math.max(m, c.alert_count ?? 0), 0);
  const topCascade = cascades.length > 0 ? cascades.sort((a, b) => (b.alert_count ?? 0) - (a.alert_count ?? 0))[0] : null;

  // Weekly chart data
  const weeklyData = useMemo(() => {
    const byWeek: Record<string, { cascadas: number; medios: number }> = {};
    cascades.forEach((c) => {
      const d = new Date(c.first_detected_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      const key = format(weekStart, "dd/MM", { locale: es });
      if (!byWeek[key]) byWeek[key] = { cascadas: 0, medios: 0 };
      byWeek[key].cascadas++;
      byWeek[key].medios += c.alert_count ?? 0;
    });
    return Object.entries(byWeek)
      .map(([semana, v]) => ({ semana, ...v }))
      .sort((a, b) => a.semana.localeCompare(b.semana));
  }, [cascades]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Cascadas Mediáticas</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-5 flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Cascadas</p>
              <p className="text-3xl font-bold text-foreground">{isLoading ? "—" : totalCascadas}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 flex items-center gap-3">
            <Activity className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="text-sm text-muted-foreground">Activas</p>
              <p className="text-3xl font-bold text-foreground">{isLoading ? "—" : activaCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 flex items-center gap-3">
            <Newspaper className="h-8 w-8 text-orange-400" />
            <div>
              <p className="text-sm text-muted-foreground">Mayor Propagación</p>
              <p className="text-3xl font-bold text-foreground">{isLoading ? "—" : `${maxPropagacion} medios`}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-sm text-muted-foreground">Riesgo Máximo</p>
              <div className="mt-1">{topCascade ? riesgoBadge(topCascade.max_riesgo) : <span className="text-muted-foreground">—</span>}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cascade list */}
      {isLoading ? <Skeleton className="h-64 w-full" /> : (
        <Accordion type="multiple" className="space-y-3">
          {cascades.map((c) => {
            const active = isActive(c.status);
            const sources = (c.sources ?? []).sort((a, b) => new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime());
            return (
              <AccordionItem key={c.id} value={c.id} className={cn(
                "border rounded-lg bg-card border-border/50 overflow-hidden border-l-4",
                active ? riesgoBorderColor(c.max_riesgo) : "border-l-border"
              )}>
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full text-left pr-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {c.topic_description.length > 80 ? c.topic_description.slice(0, 80) + "…" : c.topic_description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Origen: {c.first_source} · Propagación en {propagationTime(c.first_detected_at, c.last_alert_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-lg font-bold text-foreground flex items-center gap-1">
                        <Newspaper className="h-4 w-4 text-muted-foreground" /> {c.alert_count}
                      </span>
                      {statusBadge(c.status)}
                      {riesgoBadge(c.max_riesgo)}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-muted-foreground font-mono">{c.topic_key}</p>
                    <p className="text-sm text-foreground leading-relaxed">{c.topic_description}</p>

                    {/* Timeline */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-3">Timeline de Propagación</p>
                      <div className="relative ml-3">
                        <div className="absolute left-1.5 top-0 bottom-0 w-px bg-border" />
                        {sources.map((s, i) => (
                          <div key={i} className="relative pl-6 pb-4 last:pb-0">
                            <div className={cn(
                              "absolute left-0 top-1 w-3 h-3 rounded-full border-2",
                              i === 0 ? "bg-primary border-primary" : "bg-card border-muted-foreground"
                            )} />
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">{s.medio}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(s.detected_at), "dd/MM/yyyy HH:mm", { locale: es })}
                                </p>
                              </div>
                              {s.url && (
                                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex-shrink-0 flex items-center gap-0.5">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Keywords */}
                    {(c.keywords_matched ?? []).length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {c.keywords_matched.map((k, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{k}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Link + dates */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {c.first_url && (
                        <a href={c.first_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          Ver artículo original <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <span>Detectada: {format(new Date(c.first_detected_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                      <span>Última: {format(new Date(c.last_alert_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Weekly chart */}
      {weeklyData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-base">Cascadas por Semana</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                <Legend />
                <Bar dataKey="cascadas" name="Cascadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="medios" name="Medios involucrados" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Cascadas;
