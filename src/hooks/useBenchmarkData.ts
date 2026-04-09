import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';

const KPIS = 'Nota_media_Ponderada, Preocupacion, Rechazo, Descredito, Afinidad, Fiabilidad, Admiracion, Impacto, Influencia, Peligro_reputacional, Date';

export interface GroupRow {
  Nota_media_Ponderada: number | null;
  Preocupacion: number | null;
  Rechazo: number | null;
  Descredito: number | null;
  Afinidad: number | null;
  Fiabilidad: number | null;
  Admiracion: number | null;
  Impacto: number | null;
  Influencia: number | null;
  Peligro_reputacional: string | null;
  Date: string | null;
}

export interface GroupConfig {
  key: string;
  label: string;
  view: string;
  primary?: boolean;
}

export const GROUPS: GroupConfig[] = [
  { key: 'quironsalud', label: 'Quirónsalud', view: 'noticias_quironsalud_agrupadas', primary: true },
  { key: 'gh_privados', label: 'GH Privados', view: 'noticias_gh_privados' },
  { key: 'sermas', label: 'SERMAS', view: 'noticias_sermas' },
  { key: 'gestion_qs', label: 'Públicos gestión QS', view: 'noticias_sermas_gestion_quironsalud' },
  { key: 'catsalut', label: 'CatSalut', view: 'noticias_catsalut' },
  { key: 'alta_complejidad', label: 'Alta Complejidad', view: 'noticias_grupo_alta_complejidad' },
];

async function fetchGroupKPIs(view: string): Promise<GroupRow[]> {
  const { data, error } = await externalSupabase
    .from(view)
    .select(KPIS)
    .order('Date', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as GroupRow[];
}

export interface GroupAggregated {
  key: string;
  label: string;
  primary: boolean;
  count: number;
  nota_media: number;
  preocupacion: number;
  rechazo: number;
  descredito: number;
  afinidad: number;
  fiabilidad: number;
  admiracion: number;
  impacto: number;
  influencia: number;
  peligro_alto_pct: number;
}

function avg(arr: (number | null)[]): number {
  const valid = arr.filter((v): v is number => v != null && !isNaN(v));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}

function aggregate(key: string, label: string, primary: boolean, rows: GroupRow[]): GroupAggregated {
  const n = rows.length;
  const peligroAlto = rows.filter(r => {
    const p = (r.Peligro_reputacional ?? '').toLowerCase();
    return p.includes('alto') || p.includes('criti') || p.includes('críti');
  }).length;

  return {
    key, label, primary, count: n,
    nota_media: +avg(rows.map(r => r.Nota_media_Ponderada)).toFixed(2),
    preocupacion: +avg(rows.map(r => r.Preocupacion)).toFixed(2),
    rechazo: +avg(rows.map(r => r.Rechazo)).toFixed(2),
    descredito: +avg(rows.map(r => r.Descredito)).toFixed(2),
    afinidad: +avg(rows.map(r => r.Afinidad)).toFixed(2),
    fiabilidad: +avg(rows.map(r => r.Fiabilidad)).toFixed(2),
    admiracion: +avg(rows.map(r => r.Admiracion)).toFixed(2),
    impacto: +avg(rows.map(r => r.Impacto)).toFixed(2),
    influencia: +avg(rows.map(r => r.Influencia)).toFixed(2),
    peligro_alto_pct: n ? +((peligroAlto / n) * 100).toFixed(1) : 0,
  };
}

export function useBenchmarkData() {
  return useQuery({
    queryKey: ['benchmark_all_groups'],
    queryFn: async () => {
      const results = await Promise.all(
        GROUPS.map(async (g) => {
          try {
            const rows = await fetchGroupKPIs(g.view);
            return aggregate(g.key, g.label, !!g.primary, rows);
          } catch {
            return aggregate(g.key, g.label, !!g.primary, []);
          }
        })
      );
      return results;
    },
    staleTime: 5 * 60 * 1000,
  });
}
