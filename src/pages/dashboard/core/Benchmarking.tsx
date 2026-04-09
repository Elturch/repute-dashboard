import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Trophy, Shield, TrendingUp, AlertTriangle, Star } from "lucide-react";
import { useBenchmarkData, GroupAggregated, GROUPS } from "@/hooks/useBenchmarkData";

/* ── Visual constants ── */
const QS_COLOR = "hsl(217, 91%, 60%)"; // primary
const NEUTRAL_COLORS = [
  "hsl(215, 15%, 50%)",
  "hsl(215, 10%, 42%)",
  "hsl(215, 10%, 55%)",
  "hsl(215, 8%, 62%)",
  "hsl(215, 12%, 48%)",
];

function getColor(g: GroupAggregated, idx: number) {
  return g.primary ? QS_COLOR : NEUTRAL_COLORS[idx % NEUTRAL_COLORS.length];
}

/* ── Helpers ── */
function rank(groups: GroupAggregated[], metric: keyof GroupAggregated, desc = true) {
  return [...groups].sort((a, b) => {
    const va = Number(a[metric]) || 0;
    const vb = Number(b[metric]) || 0;
    return desc ? vb - va : va - vb;
  });
}

function leadIndex(groups: GroupAggregated[], metric: keyof GroupAggregated): { lead: number; vs: string } | null {
  const sorted = rank(groups, metric);
  const qs = sorted.find(g => g.primary);
  if (!qs || sorted.length < 2) return null;
  const qsIdx = sorted.indexOf(qs);
  if (qsIdx === 0) {
    const second = sorted[1];
    return { lead: +((Number(qs[metric]) - Number(second[metric]))).toFixed(2), vs: second.label };
  }
  return { lead: +((Number(qs[metric]) - Number(sorted[0][metric]))).toFixed(2), vs: sorted[0].label };
}

function positiveShareOfVoice(groups: GroupAggregated[]): number {
  const qs = groups.find(g => g.primary);
  if (!qs) return 0;
  const total = groups.reduce((acc, g) => acc + g.count, 0);
  if (!total) return 0;
  // Positive = low risk mentions for QS as share of all mentions
  const qsPositive = qs.count * (1 - qs.peligro_alto_pct / 100);
  return +((qsPositive / total) * 100).toFixed(1);
}

/* ── Score Bar ── */
function ScoreBar({ label, value, max = 10, color, rank: pos }: {
  label: string; value: number; max?: number; color: string; rank?: number;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3 py-1.5">
      {pos != null && (
        <span className="text-xs font-mono text-muted-foreground w-5 text-right">#{pos}</span>
      )}
      <span className="text-sm text-foreground w-40 truncate">{label}</span>
      <div className="flex-1 h-5 rounded bg-muted/30 overflow-hidden">
        <div className="h-full rounded transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-mono font-medium text-foreground w-12 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

/* ── KPI Card ── */
function MetricCard({ title, icon, children, loading }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; loading?: boolean;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>{loading ? <Skeleton className="h-24 w-full" /> : children}</CardContent>
    </Card>
  );
}

/* ── Main ── */
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

  const qs = groups.find(g => g.primary);
  const fortalezaRanked = rank(groups, 'fortaleza');
  const riesgoRanked = rank(groups, 'riesgo', false); // lower is better
  const potenciaRanked = rank(groups, 'potencia');
  const notaRanked = rank(groups, 'nota_media');

  const qsFortalezaPos = fortalezaRanked.findIndex(g => g.primary) + 1;
  const qsLeadsFortaleza = qsFortalezaPos === 1;

  const lead = leadIndex(groups, 'fortaleza');
  const psov = positiveShareOfVoice(groups);

  // Determine headline
  const headline = qsLeadsFortaleza
    ? "Quirónsalud lidera en fortaleza reputacional"
    : `Quirónsalud #${qsFortalezaPos} en fortaleza — lidera en ${
        qs && rank(groups, 'afinidad')[0].primary ? "afinidad" :
        qs && rank(groups, 'fiabilidad')[0].primary ? "fiabilidad" :
        qs && rank(groups, 'admiracion')[0].primary ? "admiración" :
        qs && rank(groups, 'nota_media')[0].primary ? "nota media" : "potencia mediática"
      }`;

  // Radar data
  const radarData = ['nota_media', 'afinidad', 'fiabilidad', 'admiracion', 'impacto', 'influencia'].map(metric => {
    const entry: any = { metric: metric.replace('nota_media', 'Nota').replace('afinidad', 'Afinidad').replace('fiabilidad', 'Fiabilidad').replace('admiracion', 'Admiración').replace('impacto', 'Impacto').replace('influencia', 'Influencia') };
    groups.forEach(g => { entry[g.key] = Number((g as any)[metric]) || 0; });
    return entry;
  });

  // Bar chart data for macro indices
  const macroBarData = groups.map((g, i) => ({
    name: g.label.length > 12 ? g.label.slice(0, 12) + '…' : g.label,
    fortaleza: g.fortaleza,
    riesgo: g.riesgo,
    potencia: g.potencia,
    fill: getColor(g, i),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Benchmarking Reputacional</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Comparativa entre grupos hospitalarios · Noticias</p>
      </div>

      {/* Headline */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 flex items-center gap-4">
        <Trophy className="h-8 w-8 text-primary flex-shrink-0" />
        <div>
          <p className="text-lg font-semibold text-foreground">{headline}</p>
          <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
            {lead && (
              <span>
                Reputation Lead: <strong className={lead.lead >= 0 ? "text-primary" : "text-destructive"}>{lead.lead >= 0 ? "+" : ""}{lead.lead}</strong> vs {lead.vs}
              </span>
            )}
            <span>
              Positive Share of Voice: <strong className="text-primary">{psov}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Fortaleza Reputacional" icon={<Star className="h-4 w-4" />} loading={false}>
          <div className="space-y-0.5">
            {fortalezaRanked.map((g, i) => (
              <ScoreBar key={g.key} label={g.label} value={g.fortaleza} color={getColor(g, groups.indexOf(g))} rank={i + 1} />
            ))}
          </div>
        </MetricCard>

        <MetricCard title="Riesgo Reputacional" icon={<AlertTriangle className="h-4 w-4" />} loading={false}>
          <div className="space-y-0.5">
            {riesgoRanked.map((g, i) => (
              <ScoreBar key={g.key} label={g.label} value={g.riesgo} color={g.primary ? QS_COLOR : "hsl(0, 60%, 55%)"} rank={i + 1} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">↑ Menor = mejor</p>
        </MetricCard>

        <MetricCard title="Potencia Mediática" icon={<TrendingUp className="h-4 w-4" />} loading={false}>
          <div className="space-y-0.5">
            {potenciaRanked.map((g, i) => (
              <ScoreBar key={g.key} label={g.label} value={g.potencia} color={getColor(g, groups.indexOf(g))} rank={i + 1} />
            ))}
          </div>
        </MetricCard>
      </div>

      {/* Tabs: Radar / Bars / Detail */}
      <Tabs defaultValue="radar" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="radar">Radar Comparativo</TabsTrigger>
          <TabsTrigger value="bars">Macro-Índices</TabsTrigger>
          <TabsTrigger value="detail">Detalle por Grupo</TabsTrigger>
        </TabsList>

        {/* Radar */}
        <TabsContent value="radar">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} domain={[0, 10]} />
                  {groups.map((g, i) => (
                    <Radar
                      key={g.key}
                      name={g.label}
                      dataKey={g.key}
                      stroke={getColor(g, i)}
                      fill={getColor(g, i)}
                      fillOpacity={g.primary ? 0.25 : 0.05}
                      strokeWidth={g.primary ? 2.5 : 1}
                    />
                  ))}
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bar Chart */}
        <TabsContent value="bars">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {(['fortaleza', 'riesgo', 'potencia'] as const).map(metric => (
              <Card key={metric} className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground capitalize">{metric === 'riesgo' ? 'Riesgo (menor = mejor)' : metric}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={macroBarData} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                      <Bar dataKey={metric} radius={[0, 4, 4, 0]}>
                        {macroBarData.map((entry, idx) => {
                          const g = groups[idx];
                          return <rect key={idx} fill={g ? getColor(g, idx) : "hsl(var(--muted))"} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Detail Table */}
        <TabsContent value="detail">
          <Card className="border-border/50 overflow-x-auto">
            <CardContent className="pt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Grupo</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Noticias</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Nota</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Fortaleza</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Riesgo</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Potencia</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Afinidad</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Fiabilidad</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">Admiración</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground font-medium">% Riesgo Alto</th>
                  </tr>
                </thead>
                <tbody>
                  {notaRanked.map((g, i) => (
                    <tr key={g.key} className={`border-b border-border/20 ${g.primary ? 'bg-primary/5' : ''}`}>
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${g.primary ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                        <span className={g.primary ? 'font-semibold text-primary' : 'text-foreground'}>{g.label}</span>
                      </td>
                      <td className="text-right py-2 px-2 font-mono text-muted-foreground">{g.count}</td>
                      <td className="text-right py-2 px-2 font-mono text-foreground font-medium">{g.nota_media}</td>
                      <td className="text-right py-2 px-2 font-mono text-foreground">{g.fortaleza}</td>
                      <td className="text-right py-2 px-2 font-mono text-foreground">{g.riesgo}</td>
                      <td className="text-right py-2 px-2 font-mono text-foreground">{g.potencia}</td>
                      <td className="text-right py-2 px-2 font-mono text-foreground">{g.afinidad}</td>
                      <td className="text-right py-2 px-2 font-mono text-foreground">{g.fiabilidad}</td>
                      <td className="text-right py-2 px-2 font-mono text-foreground">{g.admiracion}</td>
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
