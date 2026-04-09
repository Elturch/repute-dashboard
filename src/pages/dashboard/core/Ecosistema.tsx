import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, TrendingUp, ShieldAlert, Zap, Building2 } from "lucide-react";
import { useAllGroups } from "@/hooks/useGroupChannels";
import type { GroupAgg } from "@/lib/data-aggregation";

function NotaIndicator({ value }: { value: number }) {
  const color = value >= 7 ? 'text-green-400' : value >= 5 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`text-2xl font-bold ${color}`}>{value.toFixed(1)}</span>;
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
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <NotaIndicator value={group.nota} />
          <span className="text-xs text-muted-foreground">{group.totalCount} menciones</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <TrendingUp className="h-3 w-3 mx-auto text-green-400 mb-1" />
            <p className="text-muted-foreground">Fortaleza</p>
            <p className="font-medium text-foreground">{group.fortaleza.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <ShieldAlert className="h-3 w-3 mx-auto text-orange-400 mb-1" />
            <p className="text-muted-foreground">Riesgo</p>
            <p className="font-medium text-foreground">{group.riesgo.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <Zap className="h-3 w-3 mx-auto text-blue-400 mb-1" />
            <p className="text-muted-foreground">Potencia</p>
            <p className="font-medium text-foreground">{group.potencia.toFixed(1)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {group.channels.filter(c => c.count > 0).map(ch => (
            <Badge key={ch.channel} variant="outline" className="text-[10px]">
              {ch.label}: {ch.count}
            </Badge>
          ))}
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
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
          Visión global de {groups.length} universos · {groups.reduce((s, g) => s + g.totalCount, 0).toLocaleString()} menciones totales
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" /> Perímetro Quirónsalud
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {primary.map(g => (
            <GroupCard key={g.groupKey} group={g} highlight={g.groupKey === 'quironsalud'} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Contexto competitivo y público</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {others.map(g => (
            <GroupCard key={g.groupKey} group={g} />
          ))}
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">Comparativa de métricas por grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 pr-4 text-muted-foreground">Grupo</th>
                  <th className="text-center py-2 px-2 text-muted-foreground">Menciones</th>
                  <th className="text-center py-2 px-2 text-muted-foreground">Nota</th>
                  <th className="text-center py-2 px-2 text-muted-foreground">Fortaleza</th>
                  <th className="text-center py-2 px-2 text-muted-foreground">Riesgo</th>
                  <th className="text-center py-2 px-2 text-muted-foreground">Potencia</th>
                  <th className="text-center py-2 px-2 text-muted-foreground">% Peligro alto</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(g => (
                  <tr key={g.groupKey} className="border-b border-border/30">
                    <td className="py-2 pr-4 font-medium text-foreground">{g.label}</td>
                    <td className="text-center py-2 px-2 text-foreground">{g.totalCount}</td>
                    <td className="text-center py-2 px-2 text-foreground">{g.nota.toFixed(1)}</td>
                    <td className="text-center py-2 px-2 text-green-400">{g.fortaleza.toFixed(1)}</td>
                    <td className="text-center py-2 px-2 text-orange-400">{g.riesgo.toFixed(1)}</td>
                    <td className="text-center py-2 px-2 text-blue-400">{g.potencia.toFixed(1)}</td>
                    <td className="text-center py-2 px-2 text-red-400">{g.peligroAltoPct.toFixed(1)}%</td>
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
