import { useState, useEffect, useCallback } from "react";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity, Database, CheckCircle2, XCircle, RefreshCw, Clock, Server, Wifi
} from "lucide-react";

const PLATFORM_VERSION = "4.0.10";
const BUILD_DATE = "2026-04-09";

const VIEWS_TO_CHECK = [
  "noticias_quironsalud_agrupadas",
  "noticias_gh_privados",
  "noticias_sermas",
  "noticias_catsalut",
  "noticias_fjd_fundacion",
  "x_twitter_posts_quironsalud_agrupado",
  "ig_posts_quironsalud_agrupados",
  "tiktok_posts_quironsalud_agrupado",
  "fb_posts_quironsalud_agrupados",
  "relato_acumulado",
  "alert_cascades",
  "monitor_reputacional_events",
  "my_business_fdj",
];

interface ViewStatus {
  view: string;
  ok: boolean;
  count: number | null;
  error?: string;
}

const Estado = () => {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [viewStatuses, setViewStatuses] = useState<ViewStatus[]>([]);
  const [diagRunning, setDiagRunning] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const { error } = await externalSupabase
        .from("alert_cascades")
        .select("id", { count: "exact", head: true });
      setConnected(!error);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const runDiagnostics = useCallback(async () => {
    setDiagRunning(true);
    const results: ViewStatus[] = [];
    for (const view of VIEWS_TO_CHECK) {
      try {
        const { count, error } = await externalSupabase
          .from(view)
          .select("*", { count: "exact", head: true });
        results.push({
          view,
          ok: !error,
          count: count ?? 0,
          error: error?.message,
        });
      } catch (e: any) {
        results.push({ view, ok: false, count: null, error: e.message });
      }
    }
    setViewStatuses(results);
    setLastCheck(new Date().toISOString());
    setDiagRunning(false);
  }, []);

  const totalViews = viewStatuses.length;
  const okViews = viewStatuses.filter((v) => v.ok).length;
  const totalRecords = viewStatuses.reduce((sum, v) => sum + (v.count ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Server className="h-6 w-6" /> Estado del sistema
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Diagnóstico de conexión y estado de datos
          </p>
        </div>
        <Button onClick={runDiagnostics} disabled={diagRunning} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${diagRunning ? "animate-spin" : ""}`} />
          {diagRunning ? "Diagnosticando..." : "Ejecutar diagnóstico"}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wifi className={`h-5 w-5 ${connected === true ? "text-emerald-400" : connected === false ? "text-red-400" : "text-muted-foreground"}`} />
              <div>
                <p className="text-xs text-muted-foreground">Conexión</p>
                <p className="text-sm font-semibold">
                  {connected === null ? "Verificando..." : connected ? "Conectado" : "Sin conexión"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Versión</p>
                <p className="text-sm font-semibold">v{PLATFORM_VERSION}</p>
                <p className="text-[10px] text-muted-foreground">Build {BUILD_DATE}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Vistas disponibles</p>
                <p className="text-sm font-semibold">
                  {totalViews > 0 ? `${okViews}/${totalViews} OK` : `${VIEWS_TO_CHECK.length} configuradas`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Registros totales</p>
                <p className="text-sm font-semibold">
                  {totalViews > 0 ? totalRecords.toLocaleString("es-ES") : "—"}
                </p>
                {lastCheck && (
                  <p className="text-[10px] text-muted-foreground">
                    Último check: {new Date(lastCheck).toLocaleTimeString("es-ES")}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diagnostics results */}
      {diagRunning && (
        <Card className="bg-card border-border">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verificando {VIEWS_TO_CHECK.length} vistas...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!diagRunning && viewStatuses.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" /> Resultado del diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {viewStatuses.map((v) => (
                <div key={v.view} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    {v.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <code className="text-xs font-mono">{v.view}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.ok ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {(v.count ?? 0).toLocaleString("es-ES")} registros
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">
                        {v.error ?? "Error"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!diagRunning && viewStatuses.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Database className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">Pulsa "Ejecutar diagnóstico" para verificar todas las vistas</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Estado;
