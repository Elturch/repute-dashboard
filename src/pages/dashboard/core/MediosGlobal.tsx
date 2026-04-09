import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNoticiasGeneralFiltradas } from "@/hooks/useAuxiliaryData";
import { normalize, avg, type RawRow } from "@/lib/data-aggregation";

interface MedioAgg {
  medio: string;
  count: number;
  nota: number;
  riesgoAlto: number;
  riesgoPct: number;
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
      const riesgoAlto = normalized.filter(r => r.peligro.includes('alto') || r.peligro.includes('criti')).length;
      result.push({ medio, count: rows.length, nota, riesgoAlto, riesgoPct: rows.length ? +((riesgoAlto / rows.length) * 100).toFixed(1) : 0 });
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
          <CardTitle className="text-sm">Top 20 medios por volumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 pr-4 text-muted-foreground text-xs">#</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground text-xs">Medio</th>
                  <th className="text-center py-2 px-2 text-muted-foreground text-xs">Noticias</th>
                  <th className="text-center py-2 px-2 text-muted-foreground text-xs">Nota media</th>
                  <th className="text-center py-2 px-2 text-muted-foreground text-xs">Riesgo alto</th>
                  <th className="text-center py-2 px-2 text-muted-foreground text-xs">% Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {top20.map((m, i) => {
                  const notaColor = m.nota >= 7 ? 'text-green-400' : m.nota >= 5 ? 'text-yellow-400' : 'text-red-400';
                  return (
                    <tr key={m.medio} className="border-b border-border/30">
                      <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 pr-4 font-medium text-foreground">{m.medio}</td>
                      <td className="text-center py-2 px-2 text-foreground">{m.count}</td>
                      <td className={`text-center py-2 px-2 font-medium ${notaColor}`}>{m.nota.toFixed(1)}</td>
                      <td className="text-center py-2 px-2 text-red-400">{m.riesgoAlto}</td>
                      <td className="text-center py-2 px-2 text-muted-foreground">{m.riesgoPct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediosGlobal;
