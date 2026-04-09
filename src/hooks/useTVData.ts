import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';

// Unified KPI fields — news uses PascalCase, social uses snake_case
const NEWS_KPIS = 'Nota_media_Ponderada, Preocupacion, Rechazo, Descredito, Afinidad, Fiabilidad, Admiracion, Impacto, Influencia, Peligro_reputacional';
const SOCIAL_KPIS = 'nota_media_ponderada, preocupacion, rechazo, descredito, afinidad, fiabilidad, admiracion, impacto, influencia, peligro_reputacional';

export interface TVGroupAgg {
  key: string;
  label: string;
  primary: boolean;
  count: number;
  nota: number;
  fortaleza: number;
  riesgo: number;
  potencia: number;
  afinidad: number;
  fiabilidad: number;
  admiracion: number;
  peligroAltoPct: number;
}

function avg(arr: (number | null | undefined)[]): number {
  const v = arr.filter((x): x is number => x != null && !isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

function normalizeRow(r: any): { nota: number; preocupacion: number; rechazo: number; descredito: number; afinidad: number; fiabilidad: number; admiracion: number; impacto: number; influencia: number; peligro: string } {
  return {
    nota: r.Nota_media_Ponderada ?? r.nota_media_ponderada ?? null,
    preocupacion: r.Preocupacion ?? r.preocupacion ?? null,
    rechazo: r.Rechazo ?? r.rechazo ?? null,
    descredito: r.Descredito ?? r.descredito ?? null,
    afinidad: r.Afinidad ?? r.afinidad ?? null,
    fiabilidad: r.Fiabilidad ?? r.fiabilidad ?? null,
    admiracion: r.Admiracion ?? r.admiracion ?? null,
    impacto: r.Impacto ?? r.impacto ?? null,
    influencia: r.Influencia ?? r.influencia ?? null,
    peligro: (r.Peligro_reputacional ?? r.peligro_reputacional ?? '').toLowerCase(),
  };
}

function aggregateRows(key: string, label: string, primary: boolean, rows: any[]): TVGroupAgg {
  const normalized = rows.map(normalizeRow);
  const n = normalized.length;
  const nota = avg(normalized.map(r => r.nota));
  const preocupacion = avg(normalized.map(r => r.preocupacion));
  const rechazo = avg(normalized.map(r => r.rechazo));
  const descredito = avg(normalized.map(r => r.descredito));
  const afinidad = avg(normalized.map(r => r.afinidad));
  const fiabilidad = avg(normalized.map(r => r.fiabilidad));
  const admiracion = avg(normalized.map(r => r.admiracion));
  const impacto = avg(normalized.map(r => r.impacto));
  const influencia = avg(normalized.map(r => r.influencia));
  const peligroAlto = normalized.filter(r => r.peligro.includes('alto') || r.peligro.includes('criti') || r.peligro.includes('críti')).length;

  return {
    key, label, primary, count: n,
    nota: +nota.toFixed(2),
    fortaleza: +((nota + afinidad + fiabilidad + admiracion) / 4).toFixed(2),
    riesgo: +((preocupacion + descredito + rechazo) / 3).toFixed(2),
    potencia: +((influencia + impacto) / 2).toFixed(2),
    afinidad: +afinidad.toFixed(2),
    fiabilidad: +fiabilidad.toFixed(2),
    admiracion: +admiracion.toFixed(2),
    peligroAltoPct: n ? +((peligroAlto / n) * 100).toFixed(1) : 0,
  };
}

async function fetchView(view: string, limit = 500): Promise<any[]> {
  // Try news columns first, then social
  const { data, error } = await externalSupabase
    .from(view)
    .select('*')
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export interface TVSlideConfig {
  id: string;
  title: string;
  subtitle: string;
  views: { key: string; label: string; view: string; primary?: boolean }[];
}

export const TV_SLIDES: TVSlideConfig[] = [
  {
    id: 'news',
    title: 'P-News',
    subtitle: 'Rankings Noticias · Grupos Privados',
    views: [
      { key: 'qs', label: 'Quirónsalud', view: 'noticias_quironsalud_agrupadas', primary: true },
      { key: 'gh', label: 'GH Privados', view: 'noticias_gh_privados' },
    ],
  },
  {
    id: 'x',
    title: 'P-X / Twitter',
    subtitle: 'Notas IA · Redes sociales',
    views: [
      { key: 'qs', label: 'Quirónsalud', view: 'x_twitter_posts_quironsalud_agrupado', primary: true },
      { key: 'gh', label: 'GH Privados', view: 'x_twitter_posts_gh_agrupados' },
    ],
  },
  {
    id: 'instagram',
    title: 'P-Instagram',
    subtitle: 'Comparativa Instagram',
    views: [
      { key: 'qs', label: 'Quirónsalud', view: 'ig_posts_quironsalud_agrupados', primary: true },
      { key: 'gh', label: 'GH Privados', view: 'ig_posts_gh_agrupados' },
    ],
  },
  {
    id: 'tiktok',
    title: 'P-TikTok',
    subtitle: 'Comparativa TikTok',
    views: [
      { key: 'qs', label: 'Quirónsalud', view: 'tiktok_posts_quironsalud_agrupado', primary: true },
      { key: 'gh', label: 'GH Privados', view: 'tiktok_posts_gh_agrupados' },
    ],
  },
  {
    id: 'facebook',
    title: 'P-Facebook',
    subtitle: 'Comparativa Facebook',
    views: [
      { key: 'qs', label: 'Quirónsalud', view: 'fb_posts_quironsalud_agrupados', primary: true },
      { key: 'gh', label: 'GH Privados', view: 'fb_posts_gh_agrupados' },
    ],
  },
  {
    id: 'publicos',
    title: 'P-Públicos',
    subtitle: 'SERMAS y Gestión Privada',
    views: [
      { key: 'qs_gestion', label: 'Gestión QS', view: 'noticias_sermas_gestion_quironsalud', primary: true },
      { key: 'sermas', label: 'SERMAS', view: 'noticias_sermas' },
    ],
  },
  {
    id: 'catsalut',
    title: 'P-CatSalut',
    subtitle: 'Rankings CatSalut',
    views: [
      { key: 'catsalut_qs', label: 'CatSalut + QS', view: 'noticias_catsalut_SQ', primary: true },
      { key: 'catsalut', label: 'CatSalut', view: 'noticias_catsalut' },
    ],
  },
];

export function useTVSlideData(slide: TVSlideConfig) {
  return useQuery({
    queryKey: ['tv_slide', slide.id],
    queryFn: async () => {
      const results = await Promise.all(
        slide.views.map(async (v) => {
          try {
            const rows = await fetchView(v.view);
            return aggregateRows(v.key, v.label, !!v.primary, rows);
          } catch {
            return aggregateRows(v.key, v.label, !!v.primary, []);
          }
        })
      );
      return results;
    },
    staleTime: 5 * 60 * 1000,
  });
}
