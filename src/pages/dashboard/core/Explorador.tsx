import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { normalize, riesgoBadgeVariant, type NormalizedRow, type RawRow } from "@/lib/data-aggregation";
import { GROUP_VIEWS } from "@/hooks/useGroupChannels";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { format, parseISO } from "date-fns";

interface SearchRow extends NormalizedRow {
  groupKey: string;
  groupLabel: string;
  channel: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  noticias: 'Noticias', facebook: 'Facebook', instagram: 'Instagram',
  tiktok: 'TikTok', twitter: 'X / Twitter', linkedin: 'LinkedIn', mybusiness: 'My Business',
};

function useExplorerData() {
  return useQuery<SearchRow[]>({
    queryKey: ['explorer_all'],
    queryFn: async () => {
      const allRows: SearchRow[] = [];
      const fetches = Object.entries(GROUP_VIEWS).map(async ([gk, config]) => {
        for (const v of config.views) {
          try {
            const { data, error } = await externalSupabase.from(v.view).select('*').limit(500);
            if (error || !data) continue;
            for (const raw of data as RawRow[]) {
              const n = normalize(raw);
              allRows.push({ ...n, groupKey: gk, groupLabel: config.label, channel: v.key });
            }
          } catch { /* skip */ }
        }
      });
      await Promise.all(fetches);
      allRows.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });
      return allRows;
    },
    staleTime: 5 * 60 * 1000,
  });
}

const Explorador = () => {
  const { data, isLoading } = useExplorerData();
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterRiesgo, setFilterRiesgo] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    return data.filter(r => {
      if (q && !(r.titular?.toLowerCase().includes(q) || r.medio?.toLowerCase().includes(q) || r.termino?.toLowerCase().includes(q))) return false;
      if (filterGroup !== 'all' && r.groupKey !== filterGroup) return false;
      if (filterChannel !== 'all' && r.channel !== filterChannel) return false;
      if (filterRiesgo === 'alto' && !r.peligro.includes('alto') && !r.peligro.includes('criti')) return false;
      if (filterRiesgo === 'bajo' && (r.peligro.includes('alto') || r.peligro.includes('criti'))) return false;
      if (dateFrom && r.date) { const d = new Date(r.date); if (d < dateFrom) return false; }
      if (dateTo && r.date) { const d = new Date(r.date); if (d > dateTo) return false; }
      return true;
    });
  }, [data, search, filterGroup, filterChannel, filterRiesgo, dateFrom, dateTo]);

  const groupOptions = useMemo(() => {
    return Object.entries(GROUP_VIEWS).map(([k, v]) => ({ key: k, label: v.label }));
  }, []);

  const channelOptions = useMemo(() => {
    const channels = new Set<string>();
    if (data) data.forEach(r => channels.add(r.channel));
    return Array.from(channels).sort();
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Explorador Analítico</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Búsqueda y filtrado libre sobre todas las fuentes · {data?.length.toLocaleString() ?? '…'} registros
        </p>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por titular, medio o término..."
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue placeholder="Grupo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grupos</SelectItem>
                {groupOptions.map(g => <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Canal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos canales</SelectItem>
                {channelOptions.map(ch => <SelectItem key={ch} value={ch}>{CHANNEL_LABELS[ch] ?? ch}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterRiesgo} onValueChange={setFilterRiesgo}>
              <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Riesgo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo riesgo</SelectItem>
                <SelectItem value="alto">Alto / Crítico</SelectItem>
                <SelectItem value="bajo">Bajo / Medio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DateRangeFilter from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : (
        <Card className="border-border/50 overflow-x-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {filtered.length.toLocaleString()} resultados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-2 text-muted-foreground">Fecha</th>
                    <th className="text-left py-2 px-2 text-muted-foreground">Titular / Texto</th>
                    <th className="text-left py-2 px-2 text-muted-foreground">Canal</th>
                    <th className="text-left py-2 px-2 text-muted-foreground">Grupo</th>
                    <th className="text-left py-2 px-2 text-muted-foreground">Medio</th>
                    <th className="text-right py-2 px-2 text-muted-foreground">Nota</th>
                    <th className="text-center py-2 px-2 text-muted-foreground">Riesgo</th>
                    <th className="text-center py-2 px-2 text-muted-foreground">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 300).map((m, i) => (
                    <tr key={i} className="border-b border-border/10 hover:bg-muted/20">
                      <td className="py-1.5 px-2 text-muted-foreground whitespace-nowrap">
                        {m.date ? (() => { try { return format(parseISO(m.date), 'dd/MM/yy'); } catch { return m.date.slice(0, 10); } })() : '—'}
                      </td>
                      <td className="py-1.5 px-2 text-foreground max-w-[280px] truncate" title={m.titular ?? ''}>
                        {m.titular ? (m.titular.length > 70 ? m.titular.slice(0, 70) + '…' : m.titular) : '—'}
                      </td>
                      <td className="py-1.5 px-2">
                        <Badge variant="outline" className="text-[9px]">{CHANNEL_LABELS[m.channel] ?? m.channel}</Badge>
                      </td>
                      <td className="py-1.5 px-2 text-muted-foreground max-w-[100px] truncate">{m.groupLabel}</td>
                      <td className="py-1.5 px-2 text-muted-foreground max-w-[100px] truncate">{m.medio ?? '—'}</td>
                      <td className={`text-right py-1.5 px-2 font-mono ${(m.nota ?? 0) >= 7 ? 'text-green-400' : (m.nota ?? 0) >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {m.nota != null ? m.nota.toFixed(1) : '—'}
                      </td>
                      <td className="text-center py-1.5 px-2">
                        {m.peligro ? (
                          <Badge variant={riesgoBadgeVariant(m.peligro)} className="text-[9px]">{m.peligro.slice(0, 6)}</Badge>
                        ) : '—'}
                      </td>
                      <td className="text-center py-1.5 px-2">
                        {m.url ? (
                          <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                            <ExternalLink className="h-3.5 w-3.5 inline" />
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 300 && (
                <p className="text-xs text-muted-foreground text-center py-3">Mostrando 300 de {filtered.length.toLocaleString()} resultados</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Explorador;
