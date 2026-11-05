/**
 * Métricas unificadas del dashboard (Nota IA, Riesgo real, liderazgo por dimensiones).
 * Todas se calculan sobre filas de kpi_canal(desde, hasta).
 */

export const RIESGO_REAL_TOOLTIP =
  'Riesgo real: porcentaje de menciones del periodo clasificadas como peligro medio-alto, alto o crítico sobre el total de menciones. A mayor porcentaje, más proporción de conversación dañina.';

/** Nota IA: escala 0–10, 1 decimal. */
export function fmtNotaIA(n: number | null | undefined): string {
  return n == null || isNaN(n) ? '—' : n.toFixed(1);
}

/** Nota IA media ponderada por menciones. */
export function notaIAPonderada(items: { menciones: number; notaMedia: number | null }[]): number | null {
  let s = 0, w = 0;
  for (const it of items) {
    if (it.notaMedia == null || !(it.menciones > 0)) continue;
    s += it.notaMedia * it.menciones; w += it.menciones;
  }
  return w > 0 ? s / w : null;
}

/** Riesgo real % = peligro_real / menciones × 100 (mismo grupo y periodo), acotado a 0–100. */
export function pctRiesgoReal(peligroReal: number, menciones: number): number {
  if (!(menciones > 0)) return 0;
  return Math.min(100, Math.max(0, (peligroReal / menciones) * 100));
}

export function fmtPctRiesgo(p: number): string {
  return `${p.toFixed(1)}%`;
}

export const DIMENSIONES_POSITIVAS = ['afinidad', 'fiabilidad', 'admiracion', 'impacto', 'influencia'] as const;
export const DIMENSIONES_NEGATIVAS = ['preocupacion', 'rechazo', 'descredito'] as const;
export const DIMENSIONES = [...DIMENSIONES_POSITIVAS, ...DIMENSIONES_NEGATIVAS] as const;

/**
 * Nº de dimensiones (de 8) en que QS es mejor que la referencia (media de los demás):
 * positivas → valor más alto; negativas → valor más bajo.
 */
export function contarLiderazgo(
  qs: Record<string, number | null | undefined>,
  ref: Record<string, number | null | undefined>,
): number {
  let n = 0;
  for (const k of DIMENSIONES) {
    const a = qs[k], b = ref[k];
    if (a == null || b == null) continue;
    const positiva = (DIMENSIONES_POSITIVAS as readonly string[]).includes(k);
    if (positiva ? a > b : a < b) n++;
  }
  return n;
}

/** Dominio radial ajustado al rango real de las series pintadas (min−0.2, max+0.2 dentro de 0–10). */
export function radarDomain(data: Array<Record<string, unknown>>): [number, number] {
  const vals: number[] = [];
  data.forEach(r => Object.entries(r).forEach(([k, v]) => {
    if (k !== 'fullMark' && typeof v === 'number' && Number.isFinite(v)) vals.push(v);
  }));
  if (!vals.length) return [0, 10];
  const lo = Math.max(0, Math.floor((Math.min(...vals) - 0.2) * 10) / 10);
  const hi = Math.min(10, Math.ceil((Math.max(...vals) + 0.2) * 10) / 10);
  return hi > lo ? [lo, hi] : [0, 10];
}
