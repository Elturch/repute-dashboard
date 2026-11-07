import { useQuery } from '@tanstack/react-query';
import { avg, type NormalizedRow } from '@/lib/data-aggregation';
import { cleanMentionQuery } from '@/lib/mention-query';
import { usePeriod } from '@/contexts/PeriodContext';
import { useKpiCanalGlobal, aggregateKpi, filterByCanal } from '@/hooks/useKpiCanal';
import type { Canal, VCanalRow } from '@/hooks/useCanalData';

export function channelCanal(key: string): Canal {
  if (key === 'noticias') return 'medios';
  if (key === 'medios' || key === 'instagram' || key === 'tiktok' || key === 'facebook' || key === 'linkedin' || key === 'twitter' || key === 'mybusiness') return key;
  throw new Error(`Canal desconocido: ${key}`);
}

export interface ChannelMention extends NormalizedRow {
  groupKey: string;
  groupLabel: string;
}

export interface ChannelGroupSummary {
  groupKey: string;
  groupLabel: string;
  count: number;
  nota: number;
  preocupacion: number;
  rechazo: number;
  descredito: number;
  afinidad: number;
  fiabilidad: number;
  admiracion: number;
  impacto: number;
  influencia: number;
  compromiso: number;
  peligroAltoPct: number;
}

export interface ChannelData {
  channelKey: string;
  mentions: ChannelMention[];
  groups: ChannelGroupSummary[];
  totalCount: number;
  avgNota: number;
  peligroAltoPct: number;
}

function toMention(row: VCanalRow): ChannelMention {
  return {
    ...row, nota: row.nota_media, peligro: (row.peligro ?? '').toLowerCase(), date: row.fecha,
    compromiso: null, rating: null, medio: row.fuente, titular: row.titulo ?? row.texto,
    termino: null, grupo: row.grupo_hospitalario,
    groupKey: row.grupo_hospitalario ?? 'sin-grupo', groupLabel: row.grupo_hospitalario ?? 'Sin grupo',
  };
}

function summarizeGroup(groupKey: string, groupLabel: string, rows: NormalizedRow[]): ChannelGroupSummary {
  const count = rows.length;
  const peligroAlto = rows.filter(r => r.peligro.includes('alto') || r.peligro.includes('criti')).length;
  return {
    groupKey, groupLabel, count,
    nota: avg(rows.map(r => r.nota)),
    preocupacion: avg(rows.map(r => r.preocupacion)),
    rechazo: avg(rows.map(r => r.rechazo)),
    descredito: avg(rows.map(r => r.descredito)),
    afinidad: avg(rows.map(r => r.afinidad)),
    fiabilidad: avg(rows.map(r => r.fiabilidad)),
    admiracion: avg(rows.map(r => r.admiracion)),
    impacto: avg(rows.map(r => r.impacto)),
    influencia: avg(rows.map(r => r.influencia)),
    compromiso: avg(rows.map(r => r.compromiso)),
    peligroAltoPct: count ? +((peligroAlto / count) * 100).toFixed(1) : 0,
  };
}

export function useChannelData(channelKey: string) {
  const canal = channelCanal(channelKey);
  const { desde, hasta } = usePeriod();
  const kpi = useKpiCanalGlobal();
  const items = useQuery({
    queryKey: ['channel_detail_clean', canal, desde, hasta],
    queryFn: async () => {
      const allMentions: ChannelMention[] = [];
      for (let page = 0; ; page++) {
        const { data, error } = await cleanMentionQuery(canal, desde, hasta)
          .order('fecha', { ascending: false }).order('id', { ascending: false })
          .range(page * 1000, page * 1000 + 999);
        if (error) throw error;
        const rows = (data ?? []) as VCanalRow[];
        allMentions.push(...rows.map(toMention));
        if (rows.length < 1000) break;
      }
      return allMentions;
    },
    staleTime: 5 * 60 * 1000,
  });
  const rows = filterByCanal(kpi.data ?? [], canal);
  const agg = aggregateKpi(rows);
  const names = [...new Set(rows.map(r => r.grupo_hospitalario ?? 'Sin grupo'))];
  const groups = names.map(name => {
    const group = aggregateKpi(rows.filter(r => (r.grupo_hospitalario ?? 'Sin grupo') === name));
    return {
      ...summarizeGroup(name, name, []), count: group.menciones, nota: group.notaMedia ?? 0,
      ...Object.fromEntries(Object.entries(group.promedios).map(([key, value]) => [key, value ?? 0])),
      peligroAltoPct: group.pctRiesgoReal,
    } as ChannelGroupSummary;
  }).sort((a, b) => b.count - a.count);
  const data: ChannelData | undefined = items.data && kpi.data && !kpi.isPlaceholderData ? {
    channelKey, mentions: items.data, groups, totalCount: agg.menciones,
    avgNota: agg.notaMedia ?? 0, peligroAltoPct: agg.pctRiesgoReal,
  } : undefined;
  return { ...items, data, isLoading: items.isLoading || kpi.isFetching && !data, error: items.error ?? kpi.error };
}
