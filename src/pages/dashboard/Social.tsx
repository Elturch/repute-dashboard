import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { ExternalLink, Signal, Eye, Globe, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const PLATFORM_CONFIG: Record<string, { label: string; color: string; className: string }> = {
  twitter_x: { label: "X / Twitter", color: "hsl(var(--primary))", className: "bg-primary/20 text-primary border-primary/30" },
  tiktok: { label: "TikTok", color: "hsl(330, 80%, 60%)", className: "bg-pink-600/20 text-pink-400 border-pink-600/30" },
  youtube: { label: "YouTube", color: "hsl(0, 84%, 60%)", className: "bg-red-600/20 text-red-400 border-red-600/30" },
  reddit: { label: "Reddit", color: "hsl(25, 95%, 53%)", className: "bg-orange-600/20 text-orange-400 border-orange-600/30" },
  instagram: { label: "Instagram", color: "hsl(280, 70%, 55%)", className: "bg-purple-600/20 text-purple-400 border-purple-600/30" },
  facebook: { label: "Facebook", color: "hsl(220, 70%, 55%)", className: "bg-blue-600/20 text-blue-400 border-blue-600/30" },
  foro: { label: "Foro", color: "hsl(var(--muted-foreground))", className: "bg-muted text-muted-foreground border-border" },
};

function platformBadge(p: string) {
  const cfg = PLATFORM_CONFIG[p] ?? PLATFORM_CONFIG.foro;
  return <Badge className={cn(cfg.className, "text-xs")}>{cfg.label}</Badge>;
}

function tonoBadge(t: string) {
  const tl = (t ?? "").toLowerCase();
  if (tl.includes("critico") || tl.includes("crítico")) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">Crítico</Badge>;
  if (tl.includes("negativo")) return <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-xs">Negativo</Badge>;
  if (tl.includes("positivo")) return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">Positivo</Badge>;
  return <Badge className="bg-muted text-muted-foreground border-border text-xs">Neutro</Badge>;
}

function formatAlcance(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function notaColor(n: number | null) {
  if (n == null) return "text-muted-foreground";
  if (n > 7) return "text-red-400";
  if (n >= 5) return "text-orange-400";
  return "text-emerald-400";
}

interface SocialSignal {
  id: number;
  fecha: string;
  plataforma: string;
  cuenta: string;
  url: string;
  texto: string;
  tipo_senal: string;
  evento_ref_id: number | null;
  alcance_estimado: number | null;
  m_nota_ponderada: number | null;
  m_preocupacion: number | null;
  m_rechazo: number | null;
  m_descredito: number | null;
  m_afinidad: number | null;
  m_fiabilidad: number | null;
  m_admiracion: number | null;
  m_compromiso: number | null;
  m_impacto: number | null;
  m_influencia: number | null;
}

interface CrossAmplification {
  id: number;
  fecha: string;
  evento_id: number | null;
  n_amplificaciones_redes: number;
  plataformas_activas: string[];
  alcance_total: number;
  tono_red: string;
  efecto_multiplicador: number;
  resumen: string;
}

const Social = () => {
  const [selected, setSelected] = useState<SocialSignal | null>(null);

  const { data: signals = [], isLoading: loadingSignals } = useQuery({
    queryKey: ["social_signals"],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from("social_signals")
        .select("*")
        .eq("scenario_id", "quironsalud_ayuso")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SocialSignal[];
    },
  });

  const { data: amplifications = [], isLoading: loadingAmps } = useQuery({
    queryKey: ["cross_amplification"],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from("cross_amplification")
        .select("*")
        .eq("scenario_id", "quironsalud_ayuso")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CrossAmplification[];
    },
  });

  // KPIs
  const totalSignals = signals.length;
  const totalAlcance = signals.reduce((s, x) => s + (x.alcance_estimado ?? 0), 0);
  const plataformas = new Set(signals.map((s) => s.plataforma)).size;
  const notasValidas = signals.filter((s) => s.m_nota_ponderada != null);
  const notaMedia = notasValidas.length ? notasValidas.reduce((s, x) => s + (x.m_nota_ponderada ?? 0), 0) / notasValidas.length : 0;

  // Pie chart data
  const pieData = useMemo(() => {
    const byPlat: Record<string, { total: number; alcance: number }> = {};
    signals.forEach((s) => {
      if (!byPlat[s.plataforma]) byPlat[s.plataforma] = { total: 0, alcance: 0 };
      byPlat[s.plataforma].total++;
      byPlat[s.plataforma].alcance += s.alcance_estimado ?? 0;
    });
    return Object.entries(byPlat).map(([plat, v]) => ({
      name: PLATFORM_CONFIG[plat]?.label ?? plat,
      value: v.total,
      alcance: v.alcance,
      color: PLATFORM_CONFIG[plat]?.color ?? "hsl(var(--muted-foreground))",
    }));
  }, [signals]);

  const isLoading = loadingSignals || loadingAmps;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Social</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-5 flex items-center gap-3">
            <Signal className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Señales Sociales</p>
              <p className="text-3xl font-bold text-foreground">{isLoading ? "—" : totalSignals}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 flex items-center gap-3">
            <Eye className="h-8 w-8 text-orange-400" />
            <div>
              <p className="text-sm text-muted-foreground">Alcance Total</p>
              <p className="text-3xl font-bold text-foreground">{isLoading ? "—" : formatAlcance(totalAlcance)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 flex items-center gap-3">
            <Globe className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="text-sm text-muted-foreground">Plataformas</p>
              <p className="text-3xl font-bold text-foreground">{isLoading ? "—" : plataformas}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-sm text-muted-foreground">Nota Media Social</p>
              <p className={cn("text-3xl font-bold", notaColor(notaMedia))}>{isLoading ? "—" : notaMedia.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signals table */}
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-base">Señales Sociales</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loadingSignals ? <div className="p-6"><Skeleton className="h-48 w-full" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-[100px]">Fecha</TableHead>
                    <TableHead className="text-xs w-[100px]">Plataforma</TableHead>
                    <TableHead className="text-xs w-[120px]">Cuenta</TableHead>
                    <TableHead className="text-xs">Texto</TableHead>
                    <TableHead className="text-xs w-[90px]">Tipo</TableHead>
                    <TableHead className="text-xs w-[80px] text-right">Alcance</TableHead>
                    <TableHead className="text-xs w-[60px] text-right">Nota</TableHead>
                    <TableHead className="text-xs w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signals.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Sin señales</TableCell></TableRow>
                  ) : signals.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelected(s)}>
                      <TableCell className="text-xs whitespace-nowrap">{(() => { try { const d = new Date(s.fecha); return isNaN(d.getTime()) ? "—" : format(d, "dd/MM HH:mm", { locale: es }); } catch { return "—"; } })()}</TableCell>
                      <TableCell>{platformBadge(s.plataforma)}</TableCell>
                      <TableCell className="text-xs font-medium">{s.cuenta}</TableCell>
                      <TableCell className="text-sm max-w-[300px] truncate">{s.texto}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{s.tipo_senal}</Badge></TableCell>
                      <TableCell className="text-xs text-right font-mono">{formatAlcance(s.alcance_estimado)}</TableCell>
                      <TableCell className={cn("text-xs text-right font-mono", notaColor(s.m_nota_ponderada))}>
                        {s.m_nota_ponderada?.toFixed(2) ?? "—"}
                      </TableCell>
                      <TableCell>
                        {s.url && (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cross Amplification */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Amplificación Cruzada Prensa ↔ Redes</h2>
        {loadingAmps ? <Skeleton className="h-48 w-full" /> : amplifications.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin datos de amplificación</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {amplifications.map((a) => (
              <Card key={a.id} className="border-border/50">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{(() => { try { const d = new Date(a.fecha); return isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy", { locale: es }); } catch { return "—"; } })()}</p>
                      <p className="text-sm text-foreground leading-relaxed mt-1">{a.resumen}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-3xl font-bold text-primary">×{a.efecto_multiplicador}</p>
                      <p className="text-[10px] text-muted-foreground">Multiplicador</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Amplificaciones: </span>
                      <span className="font-bold text-foreground">{a.n_amplificaciones_redes}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Alcance: </span>
                      <span className="font-bold text-foreground">{formatAlcance(a.alcance_total)}</span>
                    </div>
                    <div>{tonoBadge(a.tono_red)}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(a.plataformas_activas ?? []).map((p, i) => (
                      <span key={i}>{platformBadge(p)}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-base">Distribución por Plataforma</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <ResponsiveContainer width={300} height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110} strokeWidth={2} stroke="hsl(var(--background))">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-foreground font-medium w-28">{p.name}</span>
                    <span className="text-muted-foreground">{p.value} señales</span>
                    <span className="text-muted-foreground">· {formatAlcance(p.alcance)} alcance</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail sheet */}
      <SignalDetailSheet signal={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

function SignalDetailSheet({ signal, onClose }: { signal: SocialSignal | null; onClose: () => void }) {
  const { data: refEvent } = useQuery({
    queryKey: ["signal_ref_event", signal?.evento_ref_id],
    queryFn: async () => {
      if (!signal?.evento_ref_id) return null;
      const { data, error } = await externalSupabase
        .from("monitor_reputacional_events")
        .select("titular_o_texto, medio_plataforma, url")
        .eq("id", signal.evento_ref_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!signal?.evento_ref_id,
  });

  if (!signal) return null;

  const metricas = [
    { subject: "Preocupación", value: signal.m_preocupacion ?? 0 },
    { subject: "Rechazo", value: signal.m_rechazo ?? 0 },
    { subject: "Descrédito", value: signal.m_descredito ?? 0 },
    { subject: "Afinidad", value: signal.m_afinidad ?? 0 },
    { subject: "Fiabilidad", value: signal.m_fiabilidad ?? 0 },
    { subject: "Admiración", value: signal.m_admiracion ?? 0 },
    { subject: "Compromiso", value: signal.m_compromiso ?? 0 },
    { subject: "Impacto", value: signal.m_impacto ?? 0 },
    { subject: "Influencia", value: signal.m_influencia ?? 0 },
  ];
  const hasMetrics = metricas.some((m) => m.value > 0);

  return (
    <Sheet open={!!signal} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-border">
        <SheetHeader>
          <SheetTitle className="text-left text-base">{signal.cuenta} en {PLATFORM_CONFIG[signal.plataforma]?.label ?? signal.plataforma}</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-4">
          <div className="flex flex-wrap gap-2">
            {platformBadge(signal.plataforma)}
            <Badge variant="outline" className="text-xs">{signal.tipo_senal}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-muted-foreground text-xs">Fecha</p><p className="text-foreground">{(() => { try { const d = new Date(signal.fecha); return isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy HH:mm", { locale: es }); } catch { return "—"; } })()}</p></div>
            <div><p className="text-muted-foreground text-xs">Alcance</p><p className="text-foreground font-bold">{formatAlcance(signal.alcance_estimado)}</p></div>
          </div>
          <div><p className="text-xs text-muted-foreground mb-1">Texto completo</p><p className="text-sm text-foreground leading-relaxed">{signal.texto}</p></div>
          {signal.url && (
            <a href={signal.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm inline-flex items-center gap-1">
              Ver publicación <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {refEvent && (
            <div className="rounded border border-border/50 bg-accent/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">Noticia original</p>
              {refEvent.url ? (
                <a href={refEvent.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm inline-flex items-start gap-1">
                  {refEvent.titular_o_texto} <span className="text-muted-foreground">en {refEvent.medio_plataforma}</span>
                  <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
                </a>
              ) : (
                <p className="text-sm text-foreground">{refEvent.titular_o_texto} en {refEvent.medio_plataforma}</p>
              )}
            </div>
          )}
          {hasMetrics && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Métricas Emocionales</p>
              <div className="relative">
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={metricas} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                    <Radar name="Valor" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
                {signal.m_nota_ponderada != null && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className={cn("text-2xl font-bold", notaColor(signal.m_nota_ponderada))}>{signal.m_nota_ponderada.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">Nota Ponderada</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default Social;
