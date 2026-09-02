import { Fragment, useMemo, useState } from "react";
import { Award, ChevronDown, ChevronRight, TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAcHospital, type AcHospitalRow } from "@/hooks/useAcHospital";
import { useAcEvolucion } from "@/hooks/useAcEvolucion";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const CANAL_LABEL: Record<string, string> = {
  medios: "Medios",
  tiktok: "TikTok",
  instagram: "Instagram",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  mybusiness: "Reseñas Google",
  youtube: "YouTube",
  facebook: "Facebook",
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function notaColor(n: number): string {
  if (n >= 6) return "text-emerald-400";
  if (n >= 5) return "text-amber-400";
  return "text-red-400";
}

function formatDateRange(inicio: string | null, fin: string | null): string {
  if (!inicio) return "—";
  const a = new Date(inicio);
  const b = fin ? new Date(fin) : null;
  if (Number.isNaN(a.getTime())) return "—";
  if (!b || Number.isNaN(b.getTime())) return `${a.getUTCDate()} ${MESES[a.getUTCMonth()]}`;
  if (a.getUTCMonth() === b.getUTCMonth()) {
    return `${a.getUTCDate()}–${b.getUTCDate()} ${MESES[b.getUTCMonth()]}`;
  }
  return `${a.getUTCDate()} ${MESES[a.getUTCMonth()]}–${b.getUTCDate()} ${MESES[b.getUTCMonth()]}`;
}

function canalLabel(c: string): string {
  return CANAL_LABEL[c.toLowerCase()] ?? c;
}

export default function AltaComplejidad() {
  const { data, isLoading } = useAcHospital();
  const { data: evo, isLoading: loadingEvo } = useAcEvolucion();
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = data ?? [];

  const totales = useMemo(
    () => rows.filter(r => r.canal == null).slice().sort((a, b) => num(b.nota_media) - num(a.nota_media)),
    [rows],
  );

  const canalesPorGrupo = useMemo(() => {
    const map: Record<string, AcHospitalRow[]> = {};
    for (const r of rows) {
      if (r.canal == null) continue;
      (map[r.grupo_hospitalario] ??= []).push(r);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => num(b.menciones) - num(a.menciones));
    }
    return map;
  }, [rows]);

  const qs = useMemo(() => totales.find(r => r.es_qs_gestion === true) ?? null, [totales]);
  const restoMedia = useMemo(() => {
    const others = totales.filter(r => r.es_qs_gestion !== true);
    if (others.length === 0) return null;
    const avg = (f: (r: AcHospitalRow) => number) =>
      others.reduce((s, r) => s + f(r), 0) / others.length;
    return {
      n: others.length,
      nota_media: avg(r => num(r.nota_media)),
      peligro_alto_pct: avg(r => num(r.peligro_alto_pct)),
      menciones: others.reduce((s, r) => s + num(r.menciones), 0),
    };
  }, [totales]);

  const qsNombre = qs?.grupo_hospitalario ?? "Fundación Jiménez Díaz";

  const chartData = useMemo(() => {
    const bySemana = new Map<string, { label: string; orden: string; fjd: number | null; resto: number[] }>();
    for (const r of evo ?? []) {
      const key = `${r.fecha_inicio}`;
      if (!bySemana.has(key)) {
        bySemana.set(key, {
          label: formatDateRange(r.fecha_inicio, r.fecha_fin),
          orden: key,
          fjd: null,
          resto: [],
        });
      }
      const b = bySemana.get(key)!;
      if (r.es_qs_gestion === true) b.fjd = num(r.nota_media);
      else b.resto.push(num(r.nota_media));
    }
    return Array.from(bySemana.values())
      .sort((a, b) => a.orden.localeCompare(b.orden))
      .map(b => ({
        periodo: b.label,
        fjd: b.fjd,
        resto: b.resto.length ? Number((b.resto.reduce((s, v) => s + v, 0) / b.resto.length).toFixed(2)) : null,
      }));
  }, [evo]);

  const qsMejorNota = qs && restoMedia ? num(qs.nota_media) >= restoMedia.nota_media : false;
  const qsMejorPeligro = qs && restoMedia ? num(qs.peligro_alto_pct) <= restoMedia.peligro_alto_pct : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Award className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alta Complejidad</h1>
          <p className="text-sm text-muted-foreground">
            Ranking reputacional de los hospitales de alta complejidad · últimos 30 días
          </p>
        </div>
      </div>

      {/* 1. Comparativa */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Gestión Quirón vs resto de Alta Complejidad
        </h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !qs || !restoMedia ? (
          <p className="text-sm text-muted-foreground">Sin datos suficientes para la comparativa.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className={`border-border/50 ${qsMejorNota ? "ring-1 ring-emerald-500/40" : ""}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  {qsNombre}
                  <Badge variant="outline" className="border-primary/40 text-primary">Gestión Quirón</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Nota media</p>
                    <p className={`text-4xl font-bold font-mono ${notaColor(num(qs.nota_media))}`}>
                      {num(qs.nota_media).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">% peligro alto</p>
                    <p className="text-4xl font-bold font-mono text-foreground">
                      {num(qs.peligro_alto_pct).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {num(qs.menciones).toLocaleString("es-ES")} menciones
                </p>
                <div className="flex gap-2">
                  {qsMejorNota && <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">Mejor nota</Badge>}
                  {qsMejorPeligro && <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">Menor peligro</Badge>}
                </div>
              </CardContent>
            </Card>

            <Card className={`border-border/50 ${!qsMejorNota ? "ring-1 ring-emerald-500/40" : ""}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-foreground">
                  Media del resto de Alta Complejidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Nota media</p>
                    <p className={`text-4xl font-bold font-mono ${notaColor(restoMedia.nota_media)}`}>
                      {restoMedia.nota_media.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">% peligro alto</p>
                    <p className="text-4xl font-bold font-mono text-foreground">
                      {restoMedia.peligro_alto_pct.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {restoMedia.n} hospitales · {restoMedia.menciones.toLocaleString("es-ES")} menciones
                </p>
                <div className="flex gap-2">
                  {!qsMejorNota && <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">Mejor nota</Badge>}
                  {!qsMejorPeligro && <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">Menor peligro</Badge>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 2. Ranking */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ranking por nota media · pulsa una fila para ver el desglose por canal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : totales.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sin datos disponibles.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead className="text-right">Menciones</TableHead>
                  <TableHead className="text-right">Nota</TableHead>
                  <TableHead className="text-right">Afinidad</TableHead>
                  <TableHead className="text-right">% peligro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {totales.map((r, i) => {
                  const isOpen = expanded === r.grupo_hospitalario;
                  const canales = canalesPorGrupo[r.grupo_hospitalario] ?? [];
                  return (
                    <Fragment key={r.grupo_hospitalario}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setExpanded(isOpen ? null : r.grupo_hospitalario)}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <span className="flex items-center gap-2">
                            {isOpen
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            {r.grupo_hospitalario}
                            {r.es_qs_gestion && (
                              <Badge variant="outline" className="border-primary/40 text-primary">
                                Gestión Quirón
                              </Badge>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {num(r.menciones).toLocaleString("es-ES")}
                        </TableCell>
                        <TableCell className={`text-right font-mono font-bold ${notaColor(num(r.nota_media))}`}>
                          {num(r.nota_media).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">{num(r.afinidad).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {num(r.peligro_alto_pct).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={6} className="bg-muted/30">
                            {canales.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2">
                                Sin desglose por canal disponible.
                              </p>
                            ) : (
                              <div className="py-1">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-xs">Canal</TableHead>
                                      <TableHead className="text-xs text-right">Menciones</TableHead>
                                      <TableHead className="text-xs text-right">Nota</TableHead>
                                      <TableHead className="text-xs text-right">% peligro</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {canales.map(c => (
                                      <TableRow key={`${r.grupo_hospitalario}-${c.canal}`}>
                                        <TableCell className="text-sm text-foreground">
                                          {canalLabel(c.canal as string)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                          {num(c.menciones).toLocaleString("es-ES")}
                                        </TableCell>
                                        <TableCell className={`text-right font-mono text-sm ${notaColor(num(c.nota_media))}`}>
                                          {num(c.nota_media).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                          {num(c.peligro_alto_pct).toFixed(1)}%
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 3. Evolución */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Evolución temporal de la nota media
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEvo ? (
            <Skeleton className="h-72 w-full" />
          ) : chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sin serie temporal disponible.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="periodo"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickMargin={8}
                />
                <YAxis
                  domain={[0, 10]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(v: number | null) => (v == null ? "—" : v.toFixed(2))}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="fjd"
                  name={qsNombre}
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="resto"
                  name="Media resto Alta Complejidad"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
