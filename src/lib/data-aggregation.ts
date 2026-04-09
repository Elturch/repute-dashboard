export interface RawRow {
  [key: string]: any;
}

export interface NormalizedRow {
  nota: number | null;
  preocupacion: number | null;
  rechazo: number | null;
  descredito: number | null;
  afinidad: number | null;
  fiabilidad: number | null;
  admiracion: number | null;
  impacto: number | null;
  influencia: number | null;
  compromiso: number | null;
  peligro: string;
  date: string | null;
  rating: number | null;
  medio: string | null;
  titular: string | null;
  url: string | null;
  termino: string | null;
  grupo: string | null;
}

export function normalize(r: RawRow): NormalizedRow {
  return {
    nota: r.Nota_media_Ponderada ?? r.nota_media_ponderada ?? r.m_nota_ponderada ?? null,
    preocupacion: r.Preocupacion ?? r.preocupacion ?? null,
    rechazo: r.Rechazo ?? r.rechazo ?? null,
    descredito: r.Descredito ?? r.descredito ?? null,
    afinidad: r.Afinidad ?? r.afinidad ?? null,
    fiabilidad: r.Fiabilidad ?? r.fiabilidad ?? null,
    admiracion: r.Admiracion ?? r.admiracion ?? null,
    impacto: r.Impacto ?? r.impacto ?? null,
    influencia: r.Influencia ?? r.influencia ?? null,
    compromiso: r.Compromiso ?? r.compromiso ?? null,
    peligro: (r.Peligro_reputacional ?? r.peligro_reputacional ?? '').toString().toLowerCase(),
    date: r.Date ?? r.date_posted ?? r.iso_date ?? r.posted_date ?? r.timestamp ?? r.timesatmp ?? null,
    rating: r.rating ?? null,
    medio: r.Paper ?? r.medio_plataforma ?? r.medio ?? null,
    titular: r.Title ?? r.titular_o_texto ?? r.text ?? r.caption ?? null,
    url: r.URL ?? r.url ?? r.post_url ?? null,
    termino: r.Termino ?? r.termino ?? null,
    grupo: r.Grupo_hospitalario ?? r.grupo_hospitalario ?? null,
  };
}

export function avg(arr: (number | null | undefined)[]): number {
  const v = arr.filter((x): x is number => x != null && !isNaN(x));
  return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : 0;
}

/** Métricas emocionales reales de la BD */
export const METRIC_KEYS = [
  'preocupacion', 'rechazo', 'descredito',
  'afinidad', 'fiabilidad', 'admiracion',
  'impacto', 'influencia', 'compromiso',
] as const;

export type MetricKey = typeof METRIC_KEYS[number];

export const METRIC_LABELS: Record<MetricKey, string> = {
  preocupacion: 'Preocupación',
  rechazo: 'Rechazo',
  descredito: 'Descrédito',
  afinidad: 'Afinidad',
  fiabilidad: 'Fiabilidad',
  admiracion: 'Admiración',
  impacto: 'Impacto',
  influencia: 'Influencia',
  compromiso: 'Compromiso',
};

export interface ChannelAgg {
  channel: string;
  label: string;
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
  avgRating: number | null;
}

export function aggregateChannel(channel: string, label: string, rows: RawRow[]): ChannelAgg {
  const n = rows.map(normalize);
  const peligroAlto = n.filter(r => r.peligro.includes('alto') || r.peligro.includes('criti')).length;
  const ratings = n.map(r => r.rating).filter((x): x is number => x != null);

  return {
    channel, label, count: rows.length,
    nota: avg(n.map(r => r.nota)),
    preocupacion: avg(n.map(r => r.preocupacion)),
    rechazo: avg(n.map(r => r.rechazo)),
    descredito: avg(n.map(r => r.descredito)),
    afinidad: avg(n.map(r => r.afinidad)),
    fiabilidad: avg(n.map(r => r.fiabilidad)),
    admiracion: avg(n.map(r => r.admiracion)),
    impacto: avg(n.map(r => r.impacto)),
    influencia: avg(n.map(r => r.influencia)),
    compromiso: avg(n.map(r => r.compromiso)),
    peligroAltoPct: rows.length ? +((peligroAlto / rows.length) * 100).toFixed(1) : 0,
    avgRating: ratings.length ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null,
  };
}

export interface GroupAgg {
  groupKey: string;
  label: string;
  channels: ChannelAgg[];
  totalCount: number;
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

export function aggregateGroup(groupKey: string, label: string, channels: ChannelAgg[]): GroupAgg {
  const totalCount = channels.reduce((s, c) => s + c.count, 0);
  const weighted = (field: MetricKey | 'nota') => {
    if (totalCount === 0) return 0;
    const sum = channels.reduce((s, c) => s + c[field] * c.count, 0);
    return +(sum / totalCount).toFixed(2);
  };
  const peligroAltoTotal = channels.reduce((s, c) => s + Math.round(c.peligroAltoPct * c.count / 100), 0);

  return {
    groupKey, label, channels, totalCount,
    nota: weighted('nota'),
    preocupacion: weighted('preocupacion'),
    rechazo: weighted('rechazo'),
    descredito: weighted('descredito'),
    afinidad: weighted('afinidad'),
    fiabilidad: weighted('fiabilidad'),
    admiracion: weighted('admiracion'),
    impacto: weighted('impacto'),
    influencia: weighted('influencia'),
    compromiso: weighted('compromiso'),
    peligroAltoPct: totalCount ? +((peligroAltoTotal / totalCount) * 100).toFixed(1) : 0,
  };
}

export function riesgoColor(level: string): string {
  const l = level.toLowerCase();
  if (l.includes('criti')) return 'text-red-500';
  if (l.includes('alto')) return 'text-orange-500';
  if (l.includes('medio') || l.includes('amarillo')) return 'text-yellow-500';
  return 'text-green-500';
}

export function riesgoBadgeVariant(level: string): 'destructive' | 'default' | 'secondary' | 'outline' {
  const l = level.toLowerCase();
  if (l.includes('criti') || l.includes('alto')) return 'destructive';
  if (l.includes('medio') || l.includes('amarillo')) return 'default';
  return 'secondary';
}
