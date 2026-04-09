import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, AlertTriangle, TrendingUp, Radio } from "lucide-react";
import { useAlertCascades, useCrossAmplification } from "@/hooks/useAuxiliaryData";
import { riesgoBadgeVariant } from "@/lib/data-aggregation";
import { safeFormat } from "@/lib/safe-format";

const Riesgo = () => {
  const { data: cascades, isLoading: loadingCasc } = useAlertCascades(50);
  const { data: amplifications, isLoading: loadingAmp } = useCrossAmplification();

  const stats = useMemo(() => {
    if (!cascades?.length) return null;
    const activas = cascades.filter((c: any) => c.status === 'active' || c.status === 'expandiendose');
    const criticas = cascades.filter((c: any) => (c.max_riesgo ?? '').toLowerCase().includes('criti'));
    const altas = cascades.filter((c: any) => (c.max_riesgo ?? '').toLowerCase().includes('alto'));
    return {
      total: cascades.length,
      activas: activas.length,
      criticas: criticas.length,
      altas: altas.length,
      totalAlertas: cascades.reduce((s: number, c: any) => s + (c.alert_count ?? 0), 0),
    };
  }, [cascades]);

  if (loadingCasc) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Riesgo y Alertas</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!cascades?.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Riesgo y Alertas</h1>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Sin cascadas de riesgo detectadas</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Riesgo y Alertas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Panel de riesgo reputacional · {stats?.total ?? 0} cascadas · {stats?.totalAlertas ?? 0} alertas totales
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-foreground">{stats?.total ?? 0}</p>
            <p className="text-xs text-muted-foreground">Cascadas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-orange-400">{stats?.activas ?? 0}</p>
            <p className="text-xs text-muted-foreground">Activas / Expandiéndose</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-red-500">{stats?.criticas ?? 0}</p>
            <p className="text-xs text-muted-foreground">Riesgo crítico</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-red-400">{stats?.altas ?? 0}</p>
            <p className="text-xs text-muted-foreground">Riesgo alto</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Cascadas de riesgo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cascades.map((c: any) => (
            <div key={c.id ?? c.topic_key} className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-card/50">
              <ShieldAlert className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm text-foreground">{c.topic_key?.replace(/_/g, ' ')}</p>
                  {c.max_riesgo && (
                    <Badge variant={riesgoBadgeVariant(c.max_riesgo)} className="text-[10px]">
                      {c.max_riesgo}
                    </Badge>
                  )}
                  {c.status && (
                    <Badge variant="outline" className="text-[10px]">
                      {c.status}
                    </Badge>
                  )}
                </div>
                {c.topic_description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.topic_description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>{c.alert_count ?? 0} alertas</span>
                  {c.first_source && <span>Fuente: {c.first_source}</span>}
                  {c.last_alert_at && <span>{safeFormat(c.last_alert_at, 'dd/MM/yy HH:mm')}</span>}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {amplifications && amplifications.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Radio className="h-4 w-4" /> Amplificación cruzada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 text-muted-foreground">Origen</th>
                    <th className="text-left py-2 text-muted-foreground">Destino</th>
                    <th className="text-left py-2 text-muted-foreground">Tema</th>
                    <th className="text-center py-2 text-muted-foreground">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {amplifications.slice(0, 15).map((a: any, i: number) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-2 text-foreground">{a.source_platform ?? '—'}</td>
                      <td className="py-2 text-foreground">{a.target_platform ?? '—'}</td>
                      <td className="py-2 text-muted-foreground line-clamp-1">{a.topic ?? a.topic_key ?? '—'}</td>
                      <td className="py-2 text-center text-muted-foreground">{safeFormat(a.detected_at, 'dd/MM HH:mm')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Riesgo;
