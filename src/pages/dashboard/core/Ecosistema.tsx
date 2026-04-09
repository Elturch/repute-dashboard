import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, Building2 } from "lucide-react";
import { useAllGroups } from "@/hooks/useGroupChannels";
import { METRIC_KEYS, METRIC_LABELS, type GroupAgg, type ChannelAgg } from "@/lib/data-aggregation";

function NotaIndicator({ value }: { value: number }) {
  const color = value >= 7 ? 'text-green-400' : value >= 5 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`text-2xl font-bold ${color}`}>{value.toFixed(1)}</span>;
}

function MetricCell({ value }: { value: number }) {
  const color = value >= 7 ? 'text-green-400' : value >= 5 ? 'text-yellow-400' : value > 0 ? 'text-red-400' : 'text-muted-foreground';
  return <td className={`text-center py-1 px-1 ${color} text-xs`}>{value > 0 ? value.toFixed(1) : '—'}</td>;
}

function ChannelTable({ channels }: { channels: ChannelAgg[] }) {
  const active = channels.filter(c => c.count > 0);
  if (!active.length) return null;

  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-1 pr-2 text-muted-foreground">Canal</th>
            <th className="text-center py-1 px-1 text-muted-foreground">N</th>
            <th className="text-center py-1 px-1 text-muted-foreground">Nota</th>
            {METRIC_KEYS.map(k => (
              <th key={k} className="text-center py-1 px-1 text-muted-foreground" title={METRIC_LABELS[k]}>
                {METRIC_LABELS[k].slice(0, 4)}
              </th>
            ))}
            <th className="text-center py-1 px-1 text-muted-foreground">%Pel</th>
          </tr>
        </thead>
        <tbody>
          {active.map(ch => (
            <tr key={ch.channel} className="border-b border-border/20">
              <td className="py-1 pr-2 text-foreground">{ch.label}</td>
              <td className="text-center py-1 px-1 text-muted-foreground">{ch.count}</td>
              <MetricCell value={ch.nota} />
              {METRIC_KEYS.map(k => <MetricCell key={k} value={ch[k]} />)}
              <td className="text-center py-1 px-1 text-red-400 text-xs">
                {ch.peligroAltoPct > 0 ? `${ch.peligroAltoPct}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupCard({ group, highlight }: { group: GroupAgg; highlight?: boolean }) {
  return (
    <Card className={`border-border/50 ${highlight ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          {group.label}
          {highlight && <Badge variant="default" className="text-xs">Principal</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline justify-between">
          <NotaIndicator value={group.nota} />
          <span className="text-xs text-muted-foreground">{group.totalCount} menciones</span>
        </div>
        <ChannelTable channels={group.channels} />
      </CardContent>
    </Card>
  );
}

const Ecosistema = () => {
  const { data: groups, isLoading } = useAllGroups();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Ecosistema Hospitalario</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Ecosistema Hospitalario</h1>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <Network className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Sin datos del ecosistema</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryKeys = ['quironsalud', 'fjd', 'gestion_qs', 'catsalut_qs'];
  const primary = groups.filter(g => primaryKeys.includes(g.groupKey));
  const others = groups.filter(g => !primaryKeys.includes(g.groupKey));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ecosistema Hospitalario</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {groups.length} universos · {groups.reduce((s, g) => s + g.totalCount, 0).toLocaleString()} menciones · 9 métricas emocionales + nota + peligro
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" /> Perímetro Quirónsalud
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {primary.map(g => (
            <GroupCard key={g.groupKey} group={g} highlight={g.groupKey === 'quironsalud'} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Contexto competitivo y público</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {others.map(g => (
            <GroupCard key={g.groupKey} group={g} />
          ))}
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">Comparativa global por grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 pr-4 text-muted-foreground">Grupo</th>
                  <th className="text-center py-2 px-1 text-muted-foreground">N</th>
                  <th className="text-center py-2 px-1 text-muted-foreground">Nota</th>
                  {METRIC_KEYS.map(k => (
                    <th key={k} className="text-center py-2 px-1 text-muted-foreground" title={METRIC_LABELS[k]}>
                      {METRIC_LABELS[k].slice(0, 4)}
                    </th>
                  ))}
                  <th className="text-center py-2 px-1 text-muted-foreground">%Pel</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(g => (
                  <tr key={g.groupKey} className="border-b border-border/30">
                    <td className="py-2 pr-4 font-medium text-foreground">{g.label}</td>
                    <td className="text-center py-2 px-1 text-foreground">{g.totalCount}</td>
                    <MetricCell value={g.nota} />
                    {METRIC_KEYS.map(k => <MetricCell key={k} value={g[k]} />)}
                    <td className="text-center py-2 px-1 text-red-400">{g.peligroAltoPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Ecosistema;
