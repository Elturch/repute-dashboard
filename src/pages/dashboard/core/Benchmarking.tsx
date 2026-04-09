import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Trophy, Shield } from "lucide-react";
import { useBenchmarkData, type GroupAggregated } from "@/hooks/useBenchmarkData";

const QS_COLOR = "hsl(217, 91%, 60%)";
const NEUTRAL_COLORS = [
  "hsl(215, 15%, 50%)", "hsl(215, 10%, 42%)", "hsl(215, 10%, 55%)",
  "hsl(215, 8%, 62%)", "hsl(215, 12%, 48%)",
];

function getColor(g: GroupAggregated, idx: number) {
  return g.primary ? QS_COLOR : NEUTRAL_COLORS[idx % NEUTRAL_COLORS.length];
}

const REAL_METRICS: { key: keyof GroupAggregated; label: string }[] = [
  { key: 'preocupacion', label: 'Preocupación' },
  { key: 'rechazo', label: 'Rechazo' },
  { key: 'descredito', label: 'Descrédito' },
  { key: 'afinidad', label: 'Afinidad' },
  { key: 'fiabilidad', label: 'Fiabilidad' },
  { key: 'admiracion', label: 'Admiración' },
  { key: 'impacto', label: 'Impacto' },
  { key: 'influencia', label: 'Influencia' },
];

function rank(groups: GroupAggregated[], metric: keyof GroupAggregated, desc = true) {
  return [...groups].sort((a, b) => {
    const va = Number(a[metric]) || 0;
    const vb = Number(b[metric]) || 0;
    return desc ? vb - va : va - vb;
  });
}

function ScoreBar({ label, value, max = 10, color, pos }: {
  label: string; value: number; max?: number; color: string; pos?: number;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3 py-1">
      {pos != null && <span className="text-xs font-mono text-muted-foreground w-5 text-right">#{pos}</span>}
      <span className="text-sm text-foreground w-36 truncate">{label}</span>
      <div className="flex-1 h-4 rounded bg-muted/30 overflow-hidden">
        <div className="h-full rounded transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-mono font-medium text-foreground w-10 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

const Benchmarking = () => {
  const { data: groups, isLoading } = useBenchmarkData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Benchmarking</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Card key={i} className="border-border/50"><CardContent className="py-12"><Skeleton className="h-32 w-full" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Benchmarking</h1>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-24">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-foreground font-medium">Sin datos de benchmarking disponibles</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const notaRanked = rank(groups, 'nota_media');
  const qs = groups.find(g => g.primary);
  const qsNotaPos = notaRanked.findIndex(g => g.primary) + 1;

  // Radar: all 9 real metrics + nota
  const radarMetrics = [
    { key: 'nota_media', label: 'Nota' },
    ...REAL_METRICS,
  ];
  const radarData = radarMetrics.map(m => {
    const entry: Record<string, string | number> = { metric: m.label };
    groups.forEach(g => { entry[g.key] = Number((g as any)[m.key]) || 0; });
    return entry;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Benchmarking Reputacional</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Comparativa entre grupos hospitalarios · Noticias</p>
      </div>

      {/* Headline */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 flex items-center gap-4">
        <Trophy className="h-8 w-8 text-primary flex-shrink-0" />
        <div>
          <p className="text-lg font-semibold text-foreground">
            Quirónsalud #{qsNotaPos} en nota media ({qs?.nota_media.toFixed(1) ?? '—'})
          </p>
          <p className="text-sm text-muted-foreground">
            {groups.length} grupos comparados · Ranking basado en métricas emocionales reales
          </p>
        </div>
      </div>

      {/* Nota ranking */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Ranking por nota media ponderada</CardTitle>
        </CardHeader>
        <CardContent>
          {notaRanked.map((g, i) => (
            <ScoreBar key={g.key} label={g.label} value={g.nota_media} color={getColor(g, groups.indexOf(g))} pos={i + 1} />
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="radar" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="radar">Radar Comparativo</TabsTrigger>
          <TabsTrigger value="metrics">Métricas Individuales</TabsTrigger>
          <TabsTrigger value="detail">Tabla Detalle</TabsTrigger>
        </TabsList>

        <TabsContent value="radar">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={420}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} domain={[0, 10]} />
                  {groups.map((g, i) => (
                    <Radar key={g.key} name={g.label} dataKey={g.key}
                      stroke={getColor(g, i)} fill={getColor(g, i)}
                      fillOpacity={g.primary ? 0.25 : 0.05} strokeWidth={g.primary ? 2.5 : 1} />
                  ))}
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {REAL_METRICS.map(m => {
              const sorted = rank(groups, m.key);
              return (
                <Card key={m.key} className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground">{m.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0.5">
                    {sorted.map((g, i) => (
                      <ScoreBar key={g.key} label={g.label} value={Number((g as any)[m.key]) || 0} color={getColor(g, groups.indexOf(g))} pos={i + 1} />
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="detail">
          <Card className="border-border/50 overflow-x-auto">
            <CardContent className="pt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground">Grupo</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground">N</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground">Nota</th>
                    {REAL_METRICS.map(m => (
                      <th key={m.key} className="text-right py-2 px-2 text-xs text-muted-foreground">{m.label.slice(0, 5)}</th>
                    ))}
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground">%Riesgo</th>
                  </tr>
                </thead>
                <tbody>
                  {notaRanked.map(g => (
                    <tr key={g.key} className={`border-b border-border/20 ${g.primary ? 'bg-primary/5' : ''}`}>
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${g.primary ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                        <span className={g.primary ? 'font-semibold text-primary' : 'text-foreground'}>{g.label}</span>
                      </td>
                      <td className="text-right py-2 px-2 font-mono text-muted-foreground">{g.count}</td>
                      <td className="text-right py-2 px-2 font-mono text-foreground font-medium">{g.nota_media}</td>
                      {REAL_METRICS.map(m => (
                        <td key={m.key} className="text-right py-2 px-2 font-mono text-foreground">{Number((g as any)[m.key]).toFixed(1)}</td>
                      ))}
                      <td className="text-right py-2 px-2">
                        <Badge className={g.peligro_alto_pct > 20 ? "bg-red-600/20 text-red-400 border-red-600/30 text-xs" : "bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs"}>
                          {g.peligro_alto_pct}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Benchmarking;
