import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, Newspaper, Facebook, Instagram, Twitter, Linkedin, MapPin, Music2 } from "lucide-react";
import { useAllGroups } from "@/hooks/useGroupChannels";
import { METRIC_KEYS, type ChannelAgg } from "@/lib/data-aggregation";
import { Link } from "react-router-dom";

const CHANNEL_CONFIG = [
  { key: 'noticias', label: 'Noticias', icon: Newspaper, path: '/dashboard/canales/noticias' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, path: '/dashboard/canales/facebook' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, path: '/dashboard/canales/instagram' },
  { key: 'tiktok', label: 'TikTok', icon: Music2, path: '/dashboard/canales/tiktok' },
  { key: 'twitter', label: 'X / Twitter', icon: Twitter, path: '/dashboard/canales/twitter' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, path: '/dashboard/canales/linkedin' },
  { key: 'mybusiness', label: 'My Business', icon: MapPin, path: '/dashboard/canales/mybusiness' },
];

const Canales = () => {
  const { data: groups, isLoading } = useAllGroups();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Canales</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  // Aggregate totals per channel across all groups
  const channelTotals = new Map<string, { count: number; notaSum: number; notaCount: number; groupCount: number }>();
  if (groups) {
    for (const g of groups) {
      for (const ch of g.channels) {
        if (ch.count === 0) continue;
        const existing = channelTotals.get(ch.channel) || { count: 0, notaSum: 0, notaCount: 0, groupCount: 0 };
        existing.count += ch.count;
        existing.notaSum += ch.nota * ch.count;
        existing.notaCount += ch.count;
        existing.groupCount++;
        channelTotals.set(ch.channel, existing);
      }
    }
  }

  const totalMentions = Array.from(channelTotals.values()).reduce((s, t) => s + t.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Canales</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona un canal para ver el análisis detallado · {totalMentions.toLocaleString()} menciones totales
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHANNEL_CONFIG.map(ch => {
          const Icon = ch.icon;
          const totals = channelTotals.get(ch.key);
          const avgNota = totals && totals.notaCount > 0 ? +(totals.notaSum / totals.notaCount).toFixed(1) : 0;
          const notaColor = avgNota >= 7 ? 'text-green-400' : avgNota >= 5 ? 'text-yellow-400' : avgNota > 0 ? 'text-red-400' : 'text-muted-foreground';

          return (
            <Link key={ch.key} to={ch.path}>
              <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    {ch.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {totals ? (
                    <div className="flex items-baseline gap-4">
                      <span className="text-2xl font-bold text-foreground">{totals.count.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">menciones</span>
                      <span className={`text-lg font-semibold ml-auto ${notaColor}`}>{avgNota}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin datos</p>
                  )}
                  {totals && (
                    <p className="text-xs text-muted-foreground mt-1">{totals.groupCount} grupos con datos</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Canales;
