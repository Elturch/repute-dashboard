import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { normalize, avg, METRIC_KEYS, type NormalizedRow, type RawRow } from '@/lib/data-aggregation';
import { GROUP_VIEWS } from '@/hooks/useGroupChannels';

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

async function fetchView(view: string): Promise<RawRow[]> {
  try {
    const { data, error } = await externalSupabase.from(view).select('*').limit(1000);
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
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
  return useQuery<ChannelData>({
    queryKey: ['channel_detail', channelKey],
    queryFn: async () => {
      const allMentions: ChannelMention[] = [];
      const groups: ChannelGroupSummary[] = [];

      const fetches = Object.entries(GROUP_VIEWS).map(async ([gk, config]) => {
        const viewDef = config.views.find(v => v.key === channelKey);
        if (!viewDef) return;
        const raw = await fetchView(viewDef.view);
        const normalized = raw.map(r => {
          const n = normalize(r);
          return { ...n, groupKey: gk, groupLabel: config.label } as ChannelMention;
        });
        allMentions.push(...normalized);
        if (normalized.length > 0) {
          groups.push(summarizeGroup(gk, config.label, normalized));
        }
      });

      await Promise.all(fetches);

      const peligroAlto = allMentions.filter(m => m.peligro.includes('alto') || m.peligro.includes('criti')).length;

      // Sort mentions by date descending
      allMentions.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });

      // Sort groups by count descending
      groups.sort((a, b) => b.count - a.count);

      return {
        channelKey,
        mentions: allMentions,
        groups,
        totalCount: allMentions.length,
        avgNota: avg(allMentions.map(m => m.nota)),
        peligroAltoPct: allMentions.length ? +((peligroAlto / allMentions.length) * 100).toFixed(1) : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
