import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useWeeklySnapshots } from "@/hooks/useAuxiliaryData";
import { useRelatoAcumulado, useContadoresSemanalesTrend } from "@/hooks/useDashboardData";
import { safeFormat } from "@/lib/safe-format";

const EvolucionGlobal = () => {
  const { data: snapshots, isLoading: loadingSnap } = useWeeklySnapshots();
  const { data: relato } = useRelatoAcumulado();
  const { data: contadores, isLoading: loadingCont } = useContadoresSemanalesTrend();

  const chartData = useMemo(() => {
    if (!snapshots?.length) return [];
    return snapshots.map((s: any) => ({
      semana: s.semana ?? safeFormat(s.fecha_inicio, 'dd/MM'),
      menciones: s.n_menciones ?? 0,
      alertas: s.n_alertas ?? 0,
      variacion: s.variacion_vs_semana_anterior ?? 0,
    }));
  }, [snapshots]);

  const contadorData = useMemo(() => {
    if (!contadores?.length) return [];
    return contadores.map((c: any) => ({
      semana: c.semana ?? '',
      escaneadas: c.total_escaneadas ?? 0,
      relevantes: c.total_relevantes ?? 0,
      riesgoAlto: c.total_riesgo_alto ?? 0,
      riesgoMedio: c.total_riesgo_medio ?? 0,
    }));
  }, [contadores]);

  const isLoading = loadingSnap || loadingCont;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Evolución Histórica</h1>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Evolución Histórica</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Series temporales del ecosistema · {chartData.length} semanas registradas
        </p>
      </div>

      {relato && (
        <Card className="border-border/50 bg-primary/5">
          <CardContent className="py-4">
            <p className="text-sm text-foreground">{relato.resumen_narrativo}</p>
            {relato.recomendacion_accion && (
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Recomendación:</strong> {relato.recomendacion_accion}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Menciones y alertas semanales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="menciones" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name="Menciones" />
                <Area type="monotone" dataKey="alertas" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="Alertas" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {contadorData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm">Actividad semanal reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={contadorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="escaneadas" fill="hsl(var(--primary))" name="Escaneadas" radius={[2, 2, 0, 0]} />
                <Bar dataKey="riesgoAlto" fill="#ef4444" name="Riesgo alto" radius={[2, 2, 0, 0]} />
                <Bar dataKey="riesgoMedio" fill="#eab308" name="Riesgo medio" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {chartData.length === 0 && contadorData.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Sin datos de evolución</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EvolucionGlobal;
