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
  fortaleza: number;
  riesgo: number;
  potencia: number;
  peligro_alto_pct: number;
}

function avg(arr: (number | null)[]): number {
  const valid = arr.filter((v): v is number => v != null && !isNaN(v));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}

function aggregate(key: string, label: string, primary: boolean, rows: GroupRow[]): GroupAggregated {
  const n = rows.length;
  const nota = avg(rows.map(r => r.Nota_media_Ponderada));
  const preocupacion = avg(rows.map(r => r.Preocupacion));
  const rechazo = avg(rows.map(r => r.Rechazo));
  const descredito = avg(rows.map(r => r.Descredito));
  const afinidad = avg(rows.map(r => r.Afinidad));
  const fiabilidad = avg(rows.map(r => r.Fiabilidad));
  const admiracion = avg(rows.map(r => r.Admiracion));
  const impacto = avg(rows.map(r => r.Impacto));
  const influencia = avg(rows.map(r => r.Influencia));
  const peligroAlto = rows.filter(r => {
    const p = (r.Peligro_reputacional ?? '').toLowerCase();
    return p.includes('alto') || p.includes('criti') || p.includes('críti');
  }).length;

  return {
    key, label, primary, count: n,
    nota_media: +nota.toFixed(2),
    preocupacion: +preocupacion.toFixed(2),
    rechazo: +rechazo.toFixed(2),
    descredito: +descredito.toFixed(2),
    afinidad: +afinidad.toFixed(2),
    fiabilidad: +fiabilidad.toFixed(2),
    admiracion: +admiracion.toFixed(2),
    impacto: +impacto.toFixed(2),
    influencia: +influencia.toFixed(2),
    fortaleza: +((nota + afinidad + fiabilidad + admiracion) / 4).toFixed(2),
    riesgo: +((preocupacion + descredito + rechazo) / 3).toFixed(2),
    potencia: +((influencia + impacto) / 2).toFixed(2),
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
