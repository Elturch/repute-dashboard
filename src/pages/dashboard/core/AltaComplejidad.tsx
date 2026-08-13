import { useMemo } from "react";
import { Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAltaComplejidad } from "@/hooks/useAltaComplejidad";

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function notaColor(n: number): string {
  if (n >= 7) return "text-emerald-400";
  if (n >= 5) return "text-amber-400";
  return "text-red-400";
}

export default function AltaComplejidad() {
  const { data, isLoading } = useAltaComplejidad();

  const ranking = useMemo(() => {
    return (data ?? [])
      .filter(r => r.canal == null)
      .slice()
      .sort((a, b) => num(b.nota_media) - num(a.nota_media));
  }, [data]);

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

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ranking por nota media IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sin datos disponibles.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead className="text-right">Menciones</TableHead>
                  <TableHead className="text-right">Nota media</TableHead>
                  <TableHead className="text-right">Afinidad</TableHead>
                  <TableHead className="text-right">Peligro real</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((r, i) => (
                  <TableRow key={r.grupo_hospitalario}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{r.grupo_hospitalario}</TableCell>
                    <TableCell className="text-right font-mono">
                      {num(r.menciones).toLocaleString("es-ES")}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-bold ${notaColor(num(r.nota_media))}`}>
                      {num(r.nota_media).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">{num(r.afinidad).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {num(r.peligro_real).toLocaleString("es-ES")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
