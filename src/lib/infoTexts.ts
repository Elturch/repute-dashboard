import { RIESGO_REAL_TOOLTIP } from '@/lib/metricas';

export const INFO = {
  total: 'Número de menciones válidas detectadas en este canal y periodo, tras filtrar ruido (empleo, contenido de otros países, directorios, etc.). Fuente: recogida automática + clasificación por IA.',
  menciones: 'Menciones válidas de este grupo en el canal y periodo.',
  cuota: 'Cuota = menciones del grupo ÷ total de menciones del canal × 100.',
  posicion: 'Puesto en el ranking por número de menciones dentro del nivel/canal (1 = más menciones). Es un puesto, no una fórmula.',
  nota: 'Nota IA = Σ(nota de cada mención × menciones) ÷ Σ(menciones). Media ponderada por menciones; la nota 0–10 de cada mención la asigna la IA.',
  notaMedia: 'Nota IA media = Σ(nota de cada mención × menciones) ÷ Σ(menciones), agregado sobre todos los grupos del ámbito (media ponderada por menciones).',
  riesgo: RIESGO_REAL_TOOLTIP,
  riesgoAltoCritico: 'Riesgo alto+crítico = (menciones alto + crítico) ÷ nº de menciones × 100. No incluye medio-alto (a diferencia del Riesgo real).',
  reparto: 'Reparto del grupo = menciones del grupo ÷ total del canal × 100 (se muestra valor y %).',
  radar: "Cada número es la media de la dimensión (0–10) = Σ(valor de la dimensión en cada mención) ÷ nº de menciones del periodo; aparece al pasar el ratón. La POSICIÓN en el radar es un escalado visual por eje a la horquilla real de las entidades comparadas: no cambia el dato, solo lo separa para que se vean las décimas. Lidera en X de 8 = recuento de dimensiones donde el protagonista supera a la referencia (en rechazo, preocupación y descrédito, menos es mejor).",
  peligro: 'Nivel de peligro reputacional que la IA asigna a la mención: bajo, medio-bajo, medio, medio-alto, alto o crítico.',
  dimension: 'Media de la dimensión (0–10) = Σ(valor de la dimensión en cada mención) ÷ nº de menciones del periodo. En rechazo, preocupación y descrédito, menos es mejor.',
} as const;

/** Elige la explicación según la etiqueta visible del indicador. */
export function infoForLabel(label: string): string | undefined {
  const l = label.toLowerCase();
  if (l.includes('riesgo') && /alto\s*\+\s*cr/.test(l)) return INFO.riesgoAltoCritico;
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
