import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, Newspaper, Facebook, Instagram, Twitter, Linkedin, MapPin, Music2 } from "lucide-react";
import { useAllGroups } from "@/hooks/useGroupChannels";

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

interface ChannelRow {
  channel: string;
  label: string;
  totalCount: number;
  avgNota: number;
  avgRiesgo: number;
  groups: { groupKey: string; label: string; count: number; nota: number }[];
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

  const channelMap = new Map<string, ChannelRow>();
  for (const ch of CHANNEL_ORDER) {
    channelMap.set(ch, { channel: ch, label: '', totalCount: 0, avgNota: 0, avgRiesgo: 0, groups: [] });
  }

  for (const group of groups) {
    for (const ch of group.channels) {
      let row = channelMap.get(ch.channel);
      if (!row) {
        row = { channel: ch.channel, label: ch.label, totalCount: 0, avgNota: 0, avgRiesgo: 0, groups: [] };
        channelMap.set(ch.channel, row);
      }
      if (!row.label) row.label = ch.label;
      row.totalCount += ch.count;
      row.groups.push({ groupKey: group.groupKey, label: group.label, count: ch.count, nota: ch.nota });
    }
  }

  const channelRows = Array.from(channelMap.values())
    .filter(r => r.totalCount > 0)
    .map(r => {
      const withData = r.groups.filter(g => g.count > 0);
      const totalMentions = withData.reduce((s, g) => s + g.count, 0);
      r.avgNota = totalMentions > 0 
        ? +(withData.reduce((s, g) => s + g.nota * g.count, 0) / totalMentions).toFixed(2) 
        : 0;
      return r;
    });

  const totalMentions = channelRows.reduce((s, r) => s + r.totalCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Canales</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Análisis transversal por plataforma · {totalMentions.toLocaleString()} menciones en {channelRows.length} canales
        </p>
      </div>

      <div className="space-y-3">
        {channelRows.map(row => {
          const Icon = CHANNEL_ICONS[row.channel] || Radio;
          const topGroups = row.groups.filter(g => g.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);
          const notaColor = row.avgNota >= 7 ? 'text-green-400' : row.avgNota >= 5 ? 'text-yellow-400' : 'text-red-400';

          return (
            <Card key={row.channel} className="border-border/50">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.totalCount.toLocaleString()} menciones</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <span className={`text-lg font-bold ${notaColor}`}>{row.avgNota.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">nota</span>
                  </div>
                  <div className="flex-1 flex flex-wrap gap-1">
                    {topGroups.map(g => (
                      <Badge key={g.groupKey} variant="outline" className="text-[10px]">
                        {g.label}: {g.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Canales;
