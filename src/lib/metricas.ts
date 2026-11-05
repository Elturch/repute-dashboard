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

/** Escala real por radar: límites enteros 3–10 y amplitud mínima de 2. */
export function radarDomain(values: readonly (number | null | undefined)[]): [number, number] {
  const valid = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (valid.length === 0) return [3, 9];
  // Si el mínimo está cerca de 10, bajar el suelo permite mantener amplitud 2 sin superar 10.
  const min = Math.min(8, Math.max(3, Math.floor(Math.min(...valid))));
  const max = Math.max(min + 2, Math.min(10, Math.ceil(Math.max(...valid))));
  return [min, max];
}

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

/** Anillos del radar cada 0,5 dentro del dominio dinámico. */
export function radarTicks(domain: readonly [number, number]): number[] {
  const ticks: number[] = [];
  for (let v = domain[0]; v <= domain[1] + 1e-9; v += 0.5) ticks.push(Math.round(v * 2) / 2);
  return ticks;
}

/** Etiqueta solo los enteros del radar. */
export const radarTickLabel = (v: number): string => (Number.isInteger(v) ? String(v) : '');

/** Posición relativa en un eje de radar: 10 + 85·frac, rango [10,95]; 50 si sin horquilla o sin dato. */
export function radarAxisPos(v: number | null | undefined, axisMin: number, axisMax: number): number | null {
  if (v == null || !isFinite(v)) return null;
  const frac = axisMax > axisMin ? (v - axisMin) / (axisMax - axisMin) : 0.5;
  return 10 + 85 * frac;
}
