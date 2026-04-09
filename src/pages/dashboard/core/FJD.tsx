import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Hospital, Newspaper, Star, Shield, AlertTriangle } from "lucide-react";
import { useFJDChannels, useFJDvsPublicos, useFJDAlerts } from "@/hooks/useFJDData";
import { safeFormatDistance } from "@/lib/safe-format";

/* ── helpers ── */
const QS_COLOR = "hsl(217, 91%, 60%)";


function notaColor(n: number): string {
  if (n < 3) return "hsl(142, 71%, 45%)";
  if (n < 5) return "hsl(48, 96%, 53%)";
  if (n < 7) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 60%)";
}

function SemiGauge({ value, size = 120 }: { value: number; size?: number }) {
  const pct = Math.min(value / 10, 1);
  const angle = pct * 180;
  const color = notaColor(value);
  return (
    <div className="relative mx-auto" style={{ width: size, height: size / 2 }}>
      <svg viewBox="0 0 120 60" className="w-full h-full">
        <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="hsl(var(--border))" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${angle * (Math.PI * 50) / 180} 999`} />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-0">
        <span className="text-2xl font-bold text-foreground">{value.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">/10</span>
      </div>
    </div>
  );
}

function riesgoSmallBadge(r: string) {
  const l = (r ?? "").toLowerCase();
  if (l.includes("alto") || l.includes("criti")) return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">{r}</Badge>;
  if (l.includes("medio")) return <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-xs">{r}</Badge>;
  return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">{r || "—"}</Badge>;
}

function ScoreBar({ label, value, max = 10, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground font-medium">{value.toFixed(1)}</span>
      </div>
      <div className="h-4 rounded bg-muted/30 overflow-hidden">
        <div className="h-full rounded transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

const CHANNEL_ICONS: Record<string, string> = {
  noticias: "📰", facebook: "f", instagram: "📷", tiktok: "🎵", twitter: "𝕏", mybusiness: "⭐",
};

/* ── Main ── */
const FJD = () => {
  const channels = useFJDChannels();
  const comparison = useFJDvsPublicos();
  const alerts = useFJDAlerts();

  const isLoading = channels.isLoading;
  const channelData = channels.data ?? [];
  const totalMentions = channelData.reduce((s, c) => s + c.count, 0);
  const globalNota = channelData.length
    ? +(channelData.reduce((s, c) => s + c.nota * c.count, 0) / (totalMentions || 1)).toFixed(2) : 0;
  const globalAfinidad = channelData.length
    ? +(channelData.reduce((s, c) => s + c.afinidad * c.count, 0) / (totalMentions || 1)).toFixed(2) : 0;
  const globalPreocupacion = channelData.length
    ? +(channelData.reduce((s, c) => s + c.preocupacion * c.count, 0) / (totalMentions || 1)).toFixed(2) : 0;
  const myBiz = channelData.find(c => c.channel === 'mybusiness');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Hospital className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fundación Jiménez Díaz</h1>
          <p className="text-sm text-muted-foreground">Activo estratégico · Quirónsalud</p>
        </div>
      </div>

      {/* Row 1 — KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Nota Global FJD</p>
            {isLoading ? <Skeleton className="h-16 w-full" /> : <SemiGauge value={globalNota} />}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Afinidad</p>
            {isLoading ? <Skeleton className="h-10 w-full" /> : (
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold text-foreground">{globalAfinidad}</span>
                <span className="text-sm text-muted-foreground">/10</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Preocupación</p>
            {isLoading ? <Skeleton className="h-10 w-full" /> : (
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-emerald-400" />
                <span className="text-3xl font-bold text-foreground">{globalPreocupacion}</span>
                <span className="text-sm text-muted-foreground">/10</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Menciones Totales</p>
            {isLoading ? <Skeleton className="h-10 w-full" /> : (
              <div className="flex items-center gap-3">
                <Newspaper className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold text-foreground">{totalMentions.toLocaleString()}</span>
              </div>
            )}
            {myBiz?.avgRating != null && (
              <p className="text-xs text-muted-foreground mt-2">Google: ⭐ {myBiz.avgRating}/5 ({myBiz.count} reseñas)</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2 — Channels + Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Channels — 3 cols */}
        <Card className="border-border/50 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rendimiento por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : channelData.length > 0 ? (
              <div className="space-y-4">
                {channelData.map(ch => (
                  <div key={ch.channel} className="rounded-lg border border-border/40 bg-accent/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{CHANNEL_ICONS[ch.channel] ?? "📊"}</span>
                        <span className="text-sm font-medium text-foreground">{ch.label}</span>
                        <Badge variant="outline" className="text-xs">{ch.count}</Badge>
                      </div>
                      <span className="font-mono text-sm font-bold text-foreground">{ch.nota}/10</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <ScoreBar label="Afinidad" value={ch.afinidad} color={QS_COLOR} />
                      <ScoreBar label="Preocupación" value={ch.preocupacion} color="hsl(0, 60%, 55%)" />
                      <ScoreBar label="Impacto" value={ch.impacto} color="hsl(45, 80%, 55%)" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin datos de canales</p>
            )}
          </CardContent>
        </Card>

        {/* Comparison + Alerts — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          {/* Comparison */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">FJD vs Públicos Gestión Privada</CardTitle>
            </CardHeader>
            <CardContent>
              {comparison.isLoading ? <Skeleton className="h-32 w-full" /> : comparison.data ? (
                <div className="space-y-3">
                  {(['nota', 'fortaleza', 'riesgo', 'potencia'] as const).map(metric => {
                    const fjdVal = Number(comparison.data!.fjd[metric]) || 0;
                    const pubVal = Number(comparison.data!.publicos[metric]) || 0;
                    const fjdLeads = metric === 'riesgo' ? fjdVal <= pubVal : fjdVal >= pubVal;
                    return (
                      <div key={metric} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-20 capitalize">{metric}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <span className={`text-sm font-mono font-bold ${fjdLeads ? 'text-primary' : 'text-foreground'}`}>
                            {fjdVal.toFixed(1)}
                          </span>
                          <div className="flex-1 h-1.5 rounded bg-muted/30 relative overflow-hidden">
                            <div className="absolute h-full rounded bg-primary/60" style={{ width: `${(fjdVal / 10) * 100}%` }} />
                          </div>
                          <div className="flex-1 h-1.5 rounded bg-muted/30 relative overflow-hidden">
                            <div className="absolute h-full rounded bg-muted-foreground/40" style={{ width: `${(pubVal / 10) * 100}%` }} />
                          </div>
                          <span className="text-sm font-mono text-muted-foreground">{pubVal.toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> FJD</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-muted-foreground/40" /> Públicos gestión QS</span>
                  </div>
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Alertas FJD
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.isLoading ? <Skeleton className="h-24 w-full" /> :
                (alerts.data ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {(alerts.data ?? []).map((a: any, i: number) => (
                      <div key={i} className="rounded-md border border-border/40 bg-accent/10 p-3 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-foreground truncate">{a.topic_description || a.topic_key || "—"}</p>
                          {riesgoSmallBadge(a.max_riesgo ?? "")}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {a.alert_count ?? 0} medio{(a.alert_count ?? 0) !== 1 ? 's' : ''} · {safeFormatDistance(a.last_alert_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center">
                    <Shield className="h-6 w-6 text-emerald-500/60 mb-2" />
                    <p className="text-sm text-muted-foreground">Sin alertas específicas</p>
                  </div>
                )
              }
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FJD;
