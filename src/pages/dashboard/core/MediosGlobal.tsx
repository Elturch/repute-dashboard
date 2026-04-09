import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNoticiasGeneralFiltradas } from "@/hooks/useAuxiliaryData";
import { normalize, avg, METRIC_KEYS, METRIC_LABELS, type RawRow } from "@/lib/data-aggregation";

interface MedioAgg {
  medio: string;
  count: number;
  nota: number;
  metrics: Record<string, number>;
  riesgoAlto: number;
  riesgoPct: number;
}

function MetricCell({ value }: { value: number }) {
  const color = value >= 7 ? 'text-green-400' : value >= 5 ? 'text-yellow-400' : value > 0 ? 'text-red-400' : 'text-muted-foreground';
  return <td className={`text-center py-2 px-1 ${color} text-xs`}>{value > 0 ? value.toFixed(1) : '—'}</td>;
}

const MediosGlobal = () => {
  const { data: noticias, isLoading } = useNoticiasGeneralFiltradas(1000);

  const medios = useMemo(() => {
    if (!noticias?.length) return [];
    const map = new Map<string, RawRow[]>();
    for (const n of noticias) {
      const medio = n.Paper || n.medio_plataforma || 'Desconocido';
      if (!map.has(medio)) map.set(medio, []);
      map.get(medio)!.push(n);
    }
    const result: MedioAgg[] = [];
    for (const [medio, rows] of map) {
      const normalized = rows.map(normalize);
      const nota = avg(normalized.map(r => r.nota));
      const metrics: Record<string, number> = {};
      for (const k of METRIC_KEYS) metrics[k] = avg(normalized.map(r => r[k]));
      const riesgoAlto = normalized.filter(r => r.peligro.includes('alto') || r.peligro.includes('criti')).length;
      result.push({ medio, count: rows.length, nota, metrics, riesgoAlto, riesgoPct: rows.length ? +((riesgoAlto / rows.length) * 100).toFixed(1) : 0 });
    }
    return result.sort((a, b) => b.count - a.count);
  }, [noticias]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Medios</h1>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </div>
    );
  }

  const totalNoticias = noticias?.length ?? 0;
  const top20 = medios.slice(0, 20);
  const totalRiesgoAlto = medios.reduce((s, m) => s + m.riesgoAlto, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Medios</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Panorámica global · {totalNoticias.toLocaleString()} noticias · {medios.length} medios detectados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-foreground">{totalNoticias.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Noticias totales</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-foreground">{medios.length}</p>
            <p className="text-xs text-muted-foreground">Medios únicos</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-red-400">{totalRiesgoAlto}</p>
            <p className="text-xs text-muted-foreground">Noticias riesgo alto/crítico</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">Top 20 medios por volumen — métricas reales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 pr-4 text-muted-foreground text-xs">#</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground text-xs">Medio</th>
                  <th className="text-center py-2 px-1 text-muted-foreground text-xs">N</th>
                  <th className="text-center py-2 px-1 text-muted-foreground text-xs">Nota</th>
                  {METRIC_KEYS.map(k => (
                    <th key={k} className="text-center py-2 px-1 text-muted-foreground text-xs" title={METRIC_LABELS[k]}>
                      {METRIC_LABELS[k].slice(0, 4)}
                    </th>
                  ))}
                  <th className="text-center py-2 px-1 text-muted-foreground text-xs">%Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {top20.map((m, i) => (
                  <tr key={m.medio} className="border-b border-border/30">
                    <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-4 font-medium text-foreground text-xs">{m.medio}</td>
                    <td className="text-center py-2 px-1 text-foreground text-xs">{m.count}</td>
                    <MetricCell value={m.nota} />
                    {METRIC_KEYS.map(k => <MetricCell key={k} value={m.metrics[k]} />)}
                    <td className="text-center py-2 px-1 text-red-400 text-xs">{m.riesgoPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediosGlobal;
