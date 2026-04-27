import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';
import type { Canal } from './useCanalData';
import type { PerfilBucket } from '@/components/PerfilReputacionalIA';

/**
 * Una fila de la vista materializada `v_kpi_canal_30d` (191 filas, refresh cada 30 min).
 * Cada fila representa la combinación canal × titularidad × grupo_hospitalario × gestion_hospitalaria.
 */
export interface KpiRow {
  canal: Canal;
  titularidad: string | null;
  grupo_hospitalario: string | null;
  gestion_hospitalaria: string | null;

  menciones: number;
  nota_media: number | null;

  preocupacion: number | null;
  rechazo: number | null;
  descredito: number | null;
  afinidad: number | null;
  fiabilidad: number | null;
  admiracion: number | null;
  impacto: number | null;
  influencia: number | null;

  peligro_bajo: number;
  peligro_medio_bajo: number;
  peligro_medio: number;
  peligro_medio_alto: number;
  peligro_alto: number;
  peligro_critico: number;
  peligro_real: number;            // ALTO + CRÍTICO + MEDIO_ALTO
  peligro_no_procede: number;

  fecha_max: string | null;
}

const METRIC_KEYS = ['influencia','fiabilidad','afinidad','admiracion','impacto','rechazo','preocupacion','descredito'] as const;

/**
 * Hook global. Una sola query a la vista materializada (≈191 filas, 144 KB).
 * Cachea 30 min, refresca cada 10. Todo el dashboard tira de aquí para KPIs.
 */
export function useKpiCanalGlobal() {
  return useQuery({
    queryKey: ['kpi_canal_global'],
    queryFn: async (): Promise<KpiRow[]> => {
      const { data, error } = await externalSupabase
        .from('v_kpi_canal_30d')
        .select('*')
        .limit(2000);
      if (error) {
        console.error('[useKpiCanalGlobal]', error);
        throw error;
      }
      // Normaliza: bigint llega como number en supabase-js, numeric como number también.
      return (data ?? []) as KpiRow[];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: 10 * 60 * 1000,
    refetchIntervalInBackground: true,
  });
}

/* ─────────────── Filtros composables ─────────────── */

export function filterByCanal(rows: KpiRow[], canal: Canal): KpiRow[] {
  return rows.filter(r => r.canal === canal);
}

export function filterByTitularidad(rows: KpiRow[], tit: string | string[]): KpiRow[] {
  if (Array.isArray(tit)) {
    const set = new Set(tit);
    return rows.filter(r => r.titularidad != null && set.has(r.titularidad));
  }
  return rows.filter(r => r.titularidad === tit);
}

export function filterByGestionLike(rows: KpiRow[], pattern: string): KpiRow[] {
  // ILIKE 'SERMAS%' → empieza por "SERMAS" (case-insensitive)
  const p = pattern.toLowerCase();
  if (p.endsWith('%') && !p.startsWith('%')) {
    const prefix = p.slice(0, -1);
    return rows.filter(r => r.gestion_hospitalaria != null && r.gestion_hospitalaria.toLowerCase().startsWith(prefix));
  }
  if (p.startsWith('%') && p.endsWith('%')) {
    const inner = p.slice(1, -1);
    return rows.filter(r => r.gestion_hospitalaria != null && r.gestion_hospitalaria.toLowerCase().includes(inner));
  }
  return rows.filter(r => r.gestion_hospitalaria != null && r.gestion_hospitalaria.toLowerCase() === p);
}

export function filterByGestionExacta(rows: KpiRow[], gestion: string): KpiRow[] {
  return rows.filter(r => r.gestion_hospitalaria === gestion);
}

export function filterByGrupo(rows: KpiRow[], grupo: string | string[]): KpiRow[] {
  if (Array.isArray(grupo)) {
    const set = new Set(grupo);
    return rows.filter(r => r.grupo_hospitalario != null && set.has(r.grupo_hospitalario));
  }
  return rows.filter(r => r.grupo_hospitalario === grupo);
}

/* ─────────────── Agregación ─────────────── */

export interface AggregatedKpi {
  menciones: number;
  notaMedia: number | null;             // ponderada por menciones
  promedios: Record<string, number | null>; // ponderados por menciones
  peligroReal: number;
  peligroNoProcede: number;
  peligroBajo: number;
  peligroMedioBajo: number;
  peligroMedio: number;
  peligroMedioAlto: number;
  peligroAlto: number;
  peligroCritico: number;
  pctRiesgoReal: number;                // peligroReal / menciones * 100
  fechaMax: Date | null;
}

export function aggregateKpi(rows: KpiRow[]): AggregatedKpi {
  let menciones = 0;
  let notaSum = 0, notaW = 0;
  const sumas: Record<string, { sum: number; w: number }> = {};
  METRIC_KEYS.forEach(k => sumas[k] = { sum: 0, w: 0 });
  let peligroReal = 0, peligroNoProcede = 0;
  let pBajo = 0, pMedBajo = 0, pMed = 0, pMedAlto = 0, pAlto = 0, pCrit = 0;
  let fechaMax: Date | null = null;

  for (const r of rows) {
    const w = r.menciones ?? 0;
    if (w <= 0) continue;
    menciones += w;

    if (r.nota_media != null) { notaSum += r.nota_media * w; notaW += w; }
    METRIC_KEYS.forEach(k => {
      const v = r[k] as number | null;
      if (v != null) { sumas[k].sum += v * w; sumas[k].w += w; }
    });

    peligroReal       += r.peligro_real       ?? 0;
    peligroNoProcede  += r.peligro_no_procede ?? 0;
    pBajo             += r.peligro_bajo       ?? 0;
    pMedBajo          += r.peligro_medio_bajo ?? 0;
    pMed              += r.peligro_medio      ?? 0;
    pMedAlto          += r.peligro_medio_alto ?? 0;
    pAlto             += r.peligro_alto       ?? 0;
    pCrit             += r.peligro_critico    ?? 0;

    if (r.fecha_max) {
      const d = new Date(r.fecha_max);
      if (!isNaN(d.getTime()) && (!fechaMax || d > fechaMax)) fechaMax = d;
    }
  }

  const promedios: Record<string, number | null> = {};
  METRIC_KEYS.forEach(k => { promedios[k] = sumas[k].w > 0 ? sumas[k].sum / sumas[k].w : null; });

  return {
    menciones,
    notaMedia: notaW > 0 ? notaSum / notaW : null,
    promedios,
    peligroReal,
    peligroNoProcede,
    peligroBajo: pBajo,
    peligroMedioBajo: pMedBajo,
    peligroMedio: pMed,
    peligroMedioAlto: pMedAlto,
    peligroAlto: pAlto,
    peligroCritico: pCrit,
    pctRiesgoReal: menciones > 0 ? (peligroReal / menciones) * 100 : 0,
    fechaMax,
  };
}

/** Convierte un AggregatedKpi a PerfilBucket para alimentar PerfilReputacionalIA. */
export function toPerfilBucket(label: string, agg: AggregatedKpi): PerfilBucket {
  return { label, menciones: agg.menciones, promedios: agg.promedios };
}

/* ─────────────── Helper rápido para Resumen ─────────────── */

/** Agrupa por canal y devuelve un Map<Canal, AggregatedKpi>. */
export function groupByCanal(rows: KpiRow[]): Map<Canal, AggregatedKpi> {
  const buckets = new Map<Canal, KpiRow[]>();
  for (const r of rows) {
    if (!buckets.has(r.canal)) buckets.set(r.canal, []);
    buckets.get(r.canal)!.push(r);
  }
  const out = new Map<Canal, AggregatedKpi>();
  buckets.forEach((rs, c) => out.set(c, aggregateKpi(rs)));
  return out;
}

/** Agrupa por grupo_hospitalario. */
export function groupByGrupo(rows: KpiRow[]): Map<string, AggregatedKpi> {
  const buckets = new Map<string, KpiRow[]>();
  for (const r of rows) {
    const g = r.grupo_hospitalario;
    if (!g) continue;
    if (!buckets.has(g)) buckets.set(g, []);
    buckets.get(g)!.push(r);
  }
  const out = new Map<string, AggregatedKpi>();
  buckets.forEach((rs, g) => out.set(g, aggregateKpi(rs)));
  return out;
}