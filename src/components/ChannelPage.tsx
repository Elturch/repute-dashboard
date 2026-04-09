import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, AlertTriangle, BarChart3, List, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useChannelData, type ChannelMention } from "@/hooks/useChannelData";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { METRIC_KEYS, METRIC_LABELS, riesgoBadgeVariant } from "@/lib/data-aggregation";
import { format, parseISO, startOfWeek } from "date-fns";

interface ChannelPageProps {
  channelKey: string;
  channelLabel: string;
  icon: React.ReactNode;
}

const GROUP_COLORS = [
  "hsl(217, 91%, 60%)", "hsl(160, 60%, 45%)", "hsl(280, 60%, 55%)",
  "hsl(30, 80%, 55%)", "hsl(340, 65%, 50%)", "hsl(200, 70%, 50%)",
  "hsl(100, 50%, 45%)", "hsl(50, 80%, 50%)", "hsl(0, 60%, 55%)",
];

function MetricCell({ value }: { value: number }) {
  const color = value >= 7 ? 'text-green-400' : value >= 5 ? 'text-yellow-400' : value > 0 ? 'text-red-400' : 'text-muted-foreground';
  return <td className={`text-right py-1.5 px-2 font-mono text-xs ${color}`}>{value > 0 ? value.toFixed(1) : '—'}</td>;
}

export function ChannelPage({ channelKey, channelLabel, icon }: ChannelPageProps) {
  const { data, isLoading } = useChannelData(channelKey);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.mentions.filter(m => {
      if (!m.date) return !dateFrom; // include dateless only if no filter
      const d = new Date(m.date);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [data, dateFrom, dateTo]);

  const timeSeriesData = useMemo(() => {
    if (!filtered.length) return [];
    const weekMap = new Map<string, { week: string; count: number; nota: number; notaSum: number }>();
    for (const m of filtered) {
      if (!m.date) continue;
      try {
        const weekStart = startOfWeek(parseISO(m.date), { weekStartsOn: 1 });
        const key = format(weekStart, 'yyyy-MM-dd');
        const existing = weekMap.get(key) || { week: key, count: 0, nota: 0, notaSum: 0 };
        existing.count++;
        if (m.nota != null) existing.notaSum += m.nota;
        weekMap.set(key, existing);
      } catch { /* skip bad dates */ }
    }
    return Array.from(weekMap.values())
      .map(w => ({ ...w, nota: w.count ? +(w.notaSum / w.count).toFixed(1) : 0 }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{channelLabel}</h1>
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  if (!data || data.totalCount === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{channelLabel}</h1>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            {icon}
            <p className="text-lg font-medium text-foreground mt-4">Sin datos para {channelLabel}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const peligroAlto = filtered.filter(m => m.peligro.includes('alto') || m.peligro.includes('criti')).length;
  const peligroPct = filtered.length ? +((peligroAlto / filtered.length) * 100).toFixed(1) : 0;
  const avgNota = filtered.length
    ? +(filtered.reduce((s, m) => s + (m.nota ?? 0), 0) / filtered.filter(m => m.nota != null).length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            {icon}
            {channelLabel}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length.toLocaleString()} menciones · {data.groups.length} grupos
          </p>
        </div>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-foreground">{filtered.length.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Menciones</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 text-center">
            <p className={`text-2xl font-bold ${avgNota >= 7 ? 'text-green-400' : avgNota >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{avgNota}</p>
            <p className="text-xs text-muted-foreground">Nota media</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-red-400">{peligroPct}%</p>
            <p className="text-xs text-muted-foreground">Peligro alto</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-foreground">{data.groups.length}</p>
            <p className="text-xs text-muted-foreground">Grupos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="groups"><Users className="h-3.5 w-3.5 mr-1.5" />Grupos</TabsTrigger>
          <TabsTrigger value="timeline"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />Evolución</TabsTrigger>
          <TabsTrigger value="mentions"><List className="h-3.5 w-3.5 mr-1.5" />Menciones</TabsTrigger>
        </TabsList>

        {/* Groups comparison table */}
        <TabsContent value="groups">
          <Card className="border-border/50 overflow-x-auto">
            <CardContent className="pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground">Grupo</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground">N</th>
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground">Nota</th>
                    {METRIC_KEYS.map(k => (
                      <th key={k} className="text-right py-2 px-2 text-xs text-muted-foreground" title={METRIC_LABELS[k]}>
                        {METRIC_LABELS[k].slice(0, 4)}
                      </th>
                    ))}
                    <th className="text-right py-2 px-2 text-xs text-muted-foreground">%Riesgo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.groups.map((g, i) => (
                    <tr key={g.groupKey} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="py-2 px-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: GROUP_COLORS[i % GROUP_COLORS.length] }} />
                        <span className="text-foreground text-xs">{g.groupLabel}</span>
                      </td>
                      <td className="text-right py-2 px-2 font-mono text-xs text-muted-foreground">{g.count}</td>
                      <MetricCell value={g.nota} />
                      {METRIC_KEYS.map(k => <MetricCell key={k} value={g[k]} />)}
                      <td className="text-right py-2 px-2">
                        <Badge variant={g.peligroAltoPct > 20 ? 'destructive' : 'secondary'} className="text-[10px]">
                          {g.peligroAltoPct}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time series */}
        <TabsContent value="timeline">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Menciones y nota media por semana</CardTitle>
            </CardHeader>
            <CardContent>
              {timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                    <YAxis yAxisId="count" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <YAxis yAxisId="nota" orientation="right" domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="count" type="monotone" dataKey="count" name="Menciones" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
                    <Line yAxisId="nota" type="monotone" dataKey="nota" name="Nota media" stroke="hsl(160, 60%, 45%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">Sin datos temporales suficientes</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual mentions */}
        <TabsContent value="mentions">
          <Card className="border-border/50 overflow-x-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Últimas menciones ({Math.min(filtered.length, 200)} de {filtered.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-2 text-muted-foreground">Fecha</th>
                      <th className="text-left py-2 px-2 text-muted-foreground">Titular / Texto</th>
                      <th className="text-left py-2 px-2 text-muted-foreground">Medio</th>
                      <th className="text-left py-2 px-2 text-muted-foreground">Grupo</th>
                      <th className="text-right py-2 px-2 text-muted-foreground">Nota</th>
                      <th className="text-center py-2 px-2 text-muted-foreground">Riesgo</th>
                      <th className="text-center py-2 px-2 text-muted-foreground">URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 200).map((m, i) => (
                      <tr key={i} className="border-b border-border/10 hover:bg-muted/20">
                        <td className="py-1.5 px-2 text-muted-foreground whitespace-nowrap">
                          {m.date ? (() => { try { return format(parseISO(m.date), 'dd/MM/yy'); } catch { return m.date.slice(0, 10); } })() : '—'}
                        </td>
                        <td className="py-1.5 px-2 text-foreground max-w-[300px] truncate" title={m.titular ?? ''}>
                          {m.titular ? (m.titular.length > 80 ? m.titular.slice(0, 80) + '…' : m.titular) : '—'}
                        </td>
                        <td className="py-1.5 px-2 text-muted-foreground max-w-[120px] truncate">{m.medio ?? '—'}</td>
                        <td className="py-1.5 px-2 text-muted-foreground max-w-[100px] truncate">{m.groupLabel}</td>
                        <td className={`text-right py-1.5 px-2 font-mono ${(m.nota ?? 0) >= 7 ? 'text-green-400' : (m.nota ?? 0) >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {m.nota != null ? m.nota.toFixed(1) : '—'}
                        </td>
                        <td className="text-center py-1.5 px-2">
                          {m.peligro ? (
                            <Badge variant={riesgoBadgeVariant(m.peligro)} className="text-[9px]">
                              {m.peligro.slice(0, 6)}
                            </Badge>
                          ) : '—'}
                        </td>
                        <td className="text-center py-1.5 px-2">
                          {m.url ? (
                            <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                              <ExternalLink className="h-3.5 w-3.5 inline" />
                            </a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
