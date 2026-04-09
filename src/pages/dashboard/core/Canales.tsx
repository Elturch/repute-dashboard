import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, Newspaper, Facebook, Instagram, Twitter, Linkedin, MapPin, Music2 } from "lucide-react";
import { useAllGroups } from "@/hooks/useGroupChannels";
import { METRIC_KEYS, METRIC_LABELS, type ChannelAgg } from "@/lib/data-aggregation";
import { avg } from "@/lib/data-aggregation";

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  noticias: Newspaper,
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music2,
  twitter: Twitter,
  linkedin: Linkedin,
  mybusiness: MapPin,
};

const CHANNEL_ORDER = ['noticias', 'facebook', 'instagram', 'tiktok', 'twitter', 'linkedin', 'mybusiness'];
const CHANNEL_LABELS: Record<string, string> = {
  noticias: 'Noticias', facebook: 'Facebook', instagram: 'Instagram',
  tiktok: 'TikTok', twitter: 'X / Twitter', linkedin: 'LinkedIn', mybusiness: 'My Business',
};

interface ChannelCross {
  channel: string;
  label: string;
  totalCount: number;
  nota: number;
  metrics: Record<string, number>;
  peligroAltoPct: number;
  groups: { groupKey: string; label: string; count: number; nota: number }[];
}

function MetricCell({ value }: { value: number }) {
  const color = value >= 7 ? 'text-green-400' : value >= 5 ? 'text-yellow-400' : value > 0 ? 'text-red-400' : 'text-muted-foreground';
  return <td className={`text-center py-1.5 px-1 ${color} text-xs`}>{value > 0 ? value.toFixed(1) : '—'}</td>;
}

const Canales = () => {
  const { data: groups, isLoading } = useAllGroups();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Canales</h1>
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Canales</h1>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <Radio className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Sin datos de canales</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Aggregate channels across all groups
  const channelMap = new Map<string, { channels: ChannelAgg[]; groups: { groupKey: string; label: string; ch: ChannelAgg }[] }>();

  for (const group of groups) {
    for (const ch of group.channels) {
      if (ch.count === 0) continue;
      if (!channelMap.has(ch.channel)) channelMap.set(ch.channel, { channels: [], groups: [] });
      const entry = channelMap.get(ch.channel)!;
      entry.channels.push(ch);
      entry.groups.push({ groupKey: group.groupKey, label: group.label, ch });
    }
  }

  const channelRows: ChannelCross[] = CHANNEL_ORDER
    .filter(ch => channelMap.has(ch))
    .map(ch => {
      const entry = channelMap.get(ch)!;
      const totalCount = entry.channels.reduce((s, c) => s + c.count, 0);
      const weightedAvg = (field: keyof ChannelAgg) => {
        if (totalCount === 0) return 0;
        const sum = entry.channels.reduce((s, c) => s + (c[field] as number) * c.count, 0);
        return +(sum / totalCount).toFixed(2);
      };
      const metrics: Record<string, number> = {};
      for (const k of METRIC_KEYS) metrics[k] = weightedAvg(k);
      const peligroTotal = entry.channels.reduce((s, c) => s + Math.round(c.peligroAltoPct * c.count / 100), 0);

      return {
        channel: ch,
        label: CHANNEL_LABELS[ch] || ch,
        totalCount,
        nota: weightedAvg('nota'),
        metrics,
        peligroAltoPct: totalCount ? +((peligroTotal / totalCount) * 100).toFixed(1) : 0,
        groups: entry.groups.map(g => ({ groupKey: g.groupKey, label: g.label, count: g.ch.count, nota: g.ch.nota })),
      };
    });

  // Also add any channels not in CHANNEL_ORDER
  for (const [ch, entry] of channelMap) {
    if (!CHANNEL_ORDER.includes(ch)) {
      const totalCount = entry.channels.reduce((s, c) => s + c.count, 0);
      const weightedAvg = (field: keyof ChannelAgg) => {
        if (totalCount === 0) return 0;
        const sum = entry.channels.reduce((s, c) => s + (c[field] as number) * c.count, 0);
        return +(sum / totalCount).toFixed(2);
      };
      const metrics: Record<string, number> = {};
      for (const k of METRIC_KEYS) metrics[k] = weightedAvg(k);
      channelRows.push({
        channel: ch, label: ch, totalCount, nota: weightedAvg('nota'), metrics,
        peligroAltoPct: 0,
        groups: entry.groups.map(g => ({ groupKey: g.groupKey, label: g.label, count: g.ch.count, nota: g.ch.nota })),
      });
    }
  }

  const totalMentions = channelRows.reduce((s, r) => s + r.totalCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Canales</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Análisis transversal por plataforma · {totalMentions.toLocaleString()} menciones en {channelRows.length} canales
        </p>
      </div>

      {channelRows.map(row => {
        const Icon = CHANNEL_ICONS[row.channel] || Radio;
        const notaColor = row.nota >= 7 ? 'text-green-400' : row.nota >= 5 ? 'text-yellow-400' : 'text-red-400';
        const topGroups = row.groups.sort((a, b) => b.count - a.count).slice(0, 6);

        return (
          <Card key={row.channel} className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                {row.label}
                <span className="text-xs text-muted-foreground font-normal ml-auto">
                  {row.totalCount.toLocaleString()} menciones
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Global metrics for this channel */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-center py-1 px-1 text-muted-foreground">Nota</th>
                      {METRIC_KEYS.map(k => (
                        <th key={k} className="text-center py-1 px-1 text-muted-foreground" title={METRIC_LABELS[k]}>
                          {METRIC_LABELS[k].slice(0, 4)}
                        </th>
                      ))}
                      <th className="text-center py-1 px-1 text-muted-foreground">%Peligro</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={`text-center py-1 px-1 font-bold ${notaColor}`}>{row.nota.toFixed(1)}</td>
                      {METRIC_KEYS.map(k => <MetricCell key={k} value={row.metrics[k]} />)}
                      <td className="text-center py-1 px-1 text-red-400">{row.peligroAltoPct > 0 ? `${row.peligroAltoPct}%` : '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Breakdown by group */}
              <div className="flex flex-wrap gap-1">
                {topGroups.map(g => (
                  <Badge key={g.groupKey} variant="outline" className="text-[10px]">
                    {g.label}: {g.count} ({g.nota.toFixed(1)})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Canales;
