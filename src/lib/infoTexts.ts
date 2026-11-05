import { RIESGO_REAL_TOOLTIP } from '@/lib/metricas';

export const INFO = {
  total: 'Número de menciones válidas detectadas en este canal y periodo, tras filtrar ruido (empleo, contenido de otros países, directorios, etc.). Fuente: recogida automática + clasificación por IA.',
  menciones: 'Menciones válidas de este grupo en el canal y periodo.',
  cuota: 'Menciones del grupo ÷ total de menciones del canal × 100.',
  posicion: 'Puesto del grupo al ordenar los grupos por número de menciones en el canal.',
  nota: 'Media de la nota de reputación (0–10) que la IA asigna a cada mención, ponderada por número de menciones.',
  notaMedia: 'La misma Nota IA, promediada (ponderada por menciones) sobre todos los grupos del ámbito.',
  riesgo: RIESGO_REAL_TOOLTIP,
  reparto: 'Reparto de menciones por grupo sobre el total del canal (valor y % de cada uno).',
  radar: "Media por dimensión (0–10) de cada grupo. El radar escala cada eje a la horquilla real del canal para que se aprecien diferencias de décimas; la nota real aparece al pasar el ratón. 'Lidera en X de 8' = nº de dimensiones donde el protagonista supera a la referencia (en rechazo, preocupación y descrédito, menos es mejor).",
  peligro: 'Nivel de peligro reputacional que la IA asigna a la mención: bajo, medio-bajo, medio, medio-alto, alto o crítico.',
  dimension: 'Media de esta dimensión (0–10) que la IA asigna a las menciones del periodo. En rechazo, preocupación y descrédito, menos es mejor.',
} as const;

/** Elige la explicación según la etiqueta visible del indicador. */
export function infoForLabel(label: string): string | undefined {
  const l = label.toLowerCase();
  if (l.includes('riesgo')) return INFO.riesgo;
  if (l.includes('nota') && (l.includes('media') || l.includes('conjunto'))) return INFO.notaMedia;
  if (l.includes('nota')) return INFO.nota;
  if (l.includes('posici')) return INFO.posicion;
  if (l.includes('cuota') || l.includes('%')) return INFO.cuota;
  if (l.includes('total')) return INFO.total;
  if (l.includes('reparto')) return INFO.reparto;
  if (l.includes('peligro')) return INFO.peligro;
  if (/(influencia|fiabilidad|afinidad|admiraci|impacto|rechazo|preocupaci|descr[eé]dito|compromiso)/.test(l)) return INFO.dimension;
  if (l.includes('menciones') || l.includes('reseñas')) return INFO.menciones;
  return INFO.menciones;
}
