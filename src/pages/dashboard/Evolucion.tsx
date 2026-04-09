import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, BarChart3, FileText, Activity } from 'lucide-react';

/* ─── queries ─── */
function useWeeklySnapshots() {
  return useQuery({
    queryKey: ['weekly_snapshots_full'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('weekly_snapshots')
        .select('*')
        .eq('scenario_id', 'quironsalud_ayuso')
        .order('fecha_inicio', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useRelatoAcumulado() {
  return useQuery({
    queryKey: ['relato_acumulado_full'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('relato_acumulado')
        .select('*')
        .order('fecha_inicio', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ─── helpers ─── */
const fmtDate = (d: string | null) => {
  if (!d) return '—';
  try { const parsed = parseISO(d); return isNaN(parsed.getTime()) ? '—' : format(parsed, 'dd/MM'); } catch { return '—'; }
};

const tonoBadge = (tono: string | null) => {
  if (!tono) return <Badge variant="outline" className="text-muted-foreground">—</Badge>;
  const t = tono.toLowerCase();
  if (t.includes('crític')) return <Badge className="bg-red-600/20 text-red-400 border-red-500/30">{tono}</Badge>;
  if (t.includes('negativ')) return <Badge className="bg-orange-600/20 text-orange-400 border-orange-500/30">{tono}</Badge>;
  if (t.includes('positiv')) return <Badge className="bg-green-600/20 text-green-400 border-green-500/30">{tono}</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">{tono}</Badge>;
};

const variacionIcon = (v: number | null) => {
  if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>;
  if (v > 0) return <span className="text-green-400 flex items-center gap-1"><TrendingUp className="h-3 w-3" />+{v}%</span>;
  if (v < 0) return <span className="text-red-400 flex items-center gap-1"><TrendingDown className="h-3 w-3" />{v}%</span>;
  return <span className="text-muted-foreground flex items-center gap-1"><Minus className="h-3 w-3" />0%</span>;
};

const riesgoBadge = (r: string | null) => {
  if (!r) return null;
  const l = r.toLowerCase();
  if (l.includes('alto') || l.includes('crític'))
    return <Badge className="bg-red-600/20 text-red-400 border-red-500/30">{r}</Badge>;
  if (l.includes('medio') || l.includes('moderad'))
    return <Badge className="bg-orange-600/20 text-orange-400 border-orange-500/30">{r}</Badge>;
  return <Badge className="bg-green-600/20 text-green-400 border-green-500/30">{r}</Badge>;
};

const recomBadge = (r: string | null) => {
  if (!r) return null;
  const l = r.toLowerCase();
  if (l.includes('alert') || l.includes('actuar') || l.includes('inmedia'))
    return <Badge className="bg-red-600/20 text-red-400 border-red-500/30">{r}</Badge>;
  if (l.includes('monitor') || l.includes('vigil'))
    return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">{r}</Badge>;
  return <Badge className="bg-green-600/20 text-green-400 border-green-500/30">{r}</Badge>;
};

const parseJsonbArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p.map(String) : []; } catch { return []; } }
  return [];
};

const fmtNum = (n: number | null) => (n === null || n === undefined) ? '—' : n.toLocaleString('es-ES');

/* ─── Sparkline component ─── */
function Sparkline({ data, dataKey, color, label, current, prev }: {
  data: { value: number }[];
  dataKey: string;
  color: string;
  label: string;
  current: number | null;
  prev: number | null;
}) {
  const trend = (current !== null && prev !== null) ? current - prev : null;
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-2xl font-bold text-foreground">
            {current !== null ? (typeof current === 'number' ? current.toFixed(1) : current) : '—'}
          </span>
          {trend !== null && (
            <span className={`text-xs flex items-center gap-0.5 ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
              {trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}
            </span>
          )}
        </div>
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── main page ─── */
const Evolucion = () => {
  const { data: snapshots = [], isLoading: loadSnap } = useWeeklySnapshots();
  const { data: relatos = [], isLoading: loadRelato } = useRelatoAcumulado();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  /* chart data for composed chart */
  const chartData = useMemo(() => snapshots.map((s: any) => ({
    semana: s.semana,
    menciones: s.n_menciones ?? 0,
    alertas: s.n_alertas ?? 0,
    variacion: s.variacion_vs_semana_anterior ?? 0,
  })), [snapshots]);

  /* sparkline data from relato_acumulado (oldest first) */
  const relatoAsc = useMemo(() => [...relatos].reverse(), [relatos]);
  const sparkNota = useMemo(() => relatoAsc.map((r: any) => ({ value: r.nota_media_ponderada ?? 0 })), [relatoAsc]);
  const sparkPeligro = useMemo(() => relatoAsc.map((r: any) => ({ value: r.pct_peligrosas ?? 0 })), [relatoAsc]);
  const sparkRelevantes = useMemo(() => relatoAsc.map((r: any) => ({ value: r.total_relevantes ?? 0 })), [relatoAsc]);

  const lastRelato = relatoAsc.length > 0 ? relatoAsc[relatoAsc.length - 1] : null;
  const prevRelato = relatoAsc.length > 1 ? relatoAsc[relatoAsc.length - 2] : null;

  const chartConfig = {
    menciones: { label: 'Menciones', color: 'hsl(var(--primary))' },
    alertas: { label: 'Alertas', color: 'hsl(0 72% 51%)' },
    variacion: { label: 'Variación %', color: 'hsl(25 95% 53%)' },
  };

  if (loadSnap || loadRelato) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Evolución Semanal</h1>

      {/* ─── Bloque 1: Composed Chart ─── */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Evolución por Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="semana" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar yAxisId="left" dataKey="menciones" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar yAxisId="left" dataKey="alertas" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} barSize={20} />
              <Line yAxisId="right" type="monotone" dataKey="variacion" stroke="hsl(25 95% 53%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(25 95% 53%)' }} />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ─── Bloque 4: Sparklines ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Sparkline
          data={sparkNota} dataKey="nota" color="hsl(var(--primary))"
          label="Nota Media Ponderada"
          current={lastRelato?.nota_media_ponderada ?? null}
          prev={prevRelato?.nota_media_ponderada ?? null}
        />
        <Sparkline
          data={sparkPeligro} dataKey="peligro" color="hsl(0 72% 51%)"
          label="% Peligrosas"
          current={lastRelato?.pct_peligrosas ?? null}
          prev={prevRelato?.pct_peligrosas ?? null}
        />
        <Sparkline
          data={sparkRelevantes} dataKey="relevantes" color="hsl(142 71% 45%)"
          label="Total Relevantes"
          current={lastRelato?.total_relevantes ?? null}
          prev={prevRelato?.total_relevantes ?? null}
        />
      </div>

      {/* ─── Bloque 2: Tabla de Snapshots ─── */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Snapshots Semanales
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Semana</TableHead>
                <TableHead className="text-muted-foreground">Periodo</TableHead>
                <TableHead className="text-muted-foreground text-right">Menciones</TableHead>
                <TableHead className="text-muted-foreground text-right">Alertas</TableHead>
                <TableHead className="text-muted-foreground">Tono</TableHead>
                <TableHead className="text-muted-foreground text-right">Variación</TableHead>
                <TableHead className="text-muted-foreground">Temas Dominantes</TableHead>
                <TableHead className="text-muted-foreground">Medios Activos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...snapshots].reverse().map((s: any, i: number) => {
                const temas = parseJsonbArray(s.temas_dominantes);
                const medios = parseJsonbArray(s.medios_activos);
                const isExpanded = expandedRow === `snap-${i}`;
                return (
                  <TableRow
                    key={i}
                    className="border-border cursor-pointer hover:bg-muted/30"
                    onClick={() => setExpandedRow(isExpanded ? null : `snap-${i}`)}
                  >
                    <TableCell className="font-medium text-foreground">{s.semana}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(s.fecha_inicio)} — {fmtDate(s.fecha_fin)}</TableCell>
                    <TableCell className="text-right text-foreground">{fmtNum(s.n_menciones)}</TableCell>
                    <TableCell className="text-right text-foreground">{fmtNum(s.n_alertas)}</TableCell>
                    <TableCell>{tonoBadge(s.tono_medio)}</TableCell>
                    <TableCell className="text-right">{variacionIcon(s.variacion_vs_semana_anterior)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {temas.slice(0, 3).map((t, j) => (
                          <Badge key={j} variant="outline" className="text-xs text-muted-foreground">{t}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {medios.slice(0, 3).map((m, j) => (
                          <Badge key={j} variant="outline" className="text-xs text-muted-foreground">{m}</Badge>
                        ))}
                        {medios.length > 3 && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">+{medios.length - 3} más</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {/* Expanded narrative below the table */}
          {expandedRow && (() => {
            const idx = parseInt(expandedRow.replace('snap-', ''));
            const reversed = [...snapshots].reverse();
            const s = reversed[idx];
            if (!s?.resumen_narrativo) return null;
            return (
              <div className="px-6 py-4 border-t border-border bg-muted/20">
                <p className="text-sm text-muted-foreground font-medium mb-1">Resumen Narrativo:</p>
                <p className="text-sm text-foreground leading-relaxed">{s.resumen_narrativo}</p>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* ─── Bloque 3: Relato Acumulado ─── */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Hilo Narrativo Acumulado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {relatos.map((r: any, i: number) => {
              const temas = parseJsonbArray(r.temas_principales);
              return (
                <AccordionItem key={i} value={`relato-${i}`} className="border border-border rounded-lg px-4 bg-muted/10">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex flex-wrap items-center gap-2 text-left">
                      <span className="font-semibold text-foreground">{r.semana ?? `Semana ${i + 1}`}</span>
                      {riesgoBadge(r.riesgo_puntual)}
                      {riesgoBadge(r.riesgo_agregado)}
                      {r.nota_media_ponderada !== null && (
                        <Badge variant="outline" className="text-primary border-primary/30">
                          Nota: {Number(r.nota_media_ponderada).toFixed(1)}
                        </Badge>
                      )}
                      {recomBadge(r.recomendacion_accion)}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {/* Funnel */}
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-muted-foreground">{fmtNum(r.total_escaneadas)} escaneadas</Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="outline" className="text-muted-foreground">{fmtNum(r.total_relevantes)} relevantes</Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge className="bg-red-600/20 text-red-400 border-red-500/30">
                          {r.pct_peligrosas !== null ? `${Number(r.pct_peligrosas).toFixed(1)}% peligrosas` : '—'}
                        </Badge>
                      </div>

                      {/* Temas */}
                      {temas.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Temas principales:</p>
                          <div className="flex flex-wrap gap-1">
                            {temas.map((t, j) => (
                              <Badge key={j} variant="outline" className="text-xs text-foreground">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Nuevos ángulos y medios */}
                      {r.nuevos_angulos && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Nuevos ángulos:</p>
                          <p className="text-sm text-foreground">{r.nuevos_angulos}</p>
                        </div>
                      )}
                      {r.nuevos_medios && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Nuevos medios:</p>
                          <p className="text-sm text-foreground">{r.nuevos_medios}</p>
                        </div>
                      )}

                      {/* Resumen */}
                      {r.resumen_narrativo && (
                        <div className="border-t border-border pt-3">
                          <p className="text-xs text-muted-foreground mb-1">Resumen narrativo:</p>
                          <p className="text-sm text-foreground leading-relaxed">{r.resumen_narrativo}</p>
                        </div>
                      )}

                      {/* Recomendación */}
                      {r.recomendacion_accion && (
                        <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                          <p className="text-xs text-primary mb-1 font-medium">Recomendación de acción:</p>
                          <p className="text-sm text-foreground font-medium">{r.recomendacion_accion}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default Evolucion;
