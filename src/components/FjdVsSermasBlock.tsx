import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Scale } from "lucide-react";
import { useFjdVsSermas, type FjdVsSermasRow } from "@/hooks/useFjdVsSermas";

const METRICAS: { key: keyof FjdVsSermasRow; label: string; higherIsBetter: boolean; max: number }[] = [
  { key: "nota_media", label: "Nota media", higherIsBetter: true, max: 10 },
  { key: "afinidad", label: "Afinidad", higherIsBetter: true, max: 10 },
  { key: "fiabilidad", label: "Fiabilidad", higherIsBetter: true, max: 10 },
  { key: "admiracion", label: "Admiración", higherIsBetter: true, max: 10 },
  { key: "preocupacion", label: "Preocupación", higherIsBetter: false, max: 10 },
  { key: "rechazo", label: "Rechazo", higherIsBetter: false, max: 10 },
  { key: "peligro_real", label: "Peligro real", higherIsBetter: false, max: 0 },
];

const SEG_FJD = "FJD";
const SEG_RESTO = "SERMAS (resto)";

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function FjdVsSermasBlock() {
  const { data, isLoading } = useFjdVsSermas();
  const [canal, setCanal] = useState("TODOS");

  const canales = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach(r => { if (r.canal && r.canal !== "TODOS") set.add(r.canal); });
    return Array.from(set).sort();
  }, [data]);

  const rows = useMemo(() => (data ?? []).filter(r => r.canal === canal), [data, canal]);
  const fjd = rows.find(r => r.segmento === SEG_FJD);
  const resto = rows.find(r => r.segmento !== SEG_FJD);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" /> FJD vs SERMAS
        </h2>
        <select
          value={canal}
          onChange={(e) => setCanal(e.target.value)}
          className="bg-muted/30 border border-border rounded px-2 py-1 text-xs text-foreground"
        >
          <option value="TODOS">Todos los canales</option>
          {canales.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex flex-wrap items-center gap-2">
            <span>Comparativa de métricas IA</span>
            {fjd && <Badge variant="outline" className="text-xs">FJD · {num(fjd.menciones).toLocaleString("es-ES")} menciones</Badge>}
            {resto && <Badge variant="outline" className="text-xs">{resto.segmento} · {num(resto.menciones).toLocaleString("es-ES")} menciones</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !fjd || !resto ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sin datos para este canal.</p>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/50">
                <span>Métrica</span>
                <span className="text-right w-20">FJD</span>
                <span className="text-right w-24">{resto.segmento}</span>
              </div>
              {METRICAS.map(m => {
                const a = num(fjd[m.key]);
                const b = num(resto[m.key]);
                const fjdMejor = m.higherIsBetter ? a > b : a < b;
                return (
                  <div key={String(m.key)} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center py-2 border-b border-border/30 last:border-0">
                    <span className="text-sm text-muted-foreground">
                      {m.label}
                      <span className={`ml-1 text-xs ${m.higherIsBetter ? "text-emerald-400" : "text-red-400"}`}>
                        {m.higherIsBetter ? "↑" : "↓"}
                      </span>
                    </span>
                    <span className={`text-right w-20 font-mono text-sm font-bold ${fjdMejor ? "text-emerald-400" : "text-foreground"}`}>
                      {m.key === "peligro_real" ? a.toLocaleString("es-ES") : a.toFixed(2)}
                    </span>
                    <span className={`text-right w-24 font-mono text-sm ${!fjdMejor && a !== b ? "text-emerald-400" : "text-muted-foreground"}`}>
                      {m.key === "peligro_real" ? b.toLocaleString("es-ES") : b.toFixed(2)}
                    </span>
                  </div>
                );
              })}
              <p className="pt-3 text-[11px] text-muted-foreground">
                ↑ más alto = mejor · ↓ más bajo = mejor · en verde el segmento que gana
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
