import RadarDimensiones from '@/components/RadarDimensiones';
export interface MetricaIA {
  metric: string;
  value: number | null;
  /** true para métricas positivas (más alto = mejor), false para negativas (más alto = peor). */
  positive: boolean;
}

export const METRICAS_CANONICAS: { key: string; label: string; positive: boolean }[] = [
  { key: 'influencia',   label: 'Influencia',   positive: true  },
  { key: 'fiabilidad',   label: 'Fiabilidad',   positive: true  },
  { key: 'afinidad',     label: 'Afinidad',     positive: true  },
  { key: 'admiracion',   label: 'Admiración',   positive: true  },
  { key: 'impacto',      label: 'Impacto',      positive: true  },
  { key: 'compromiso',   label: 'Compromiso',   positive: true  },
  { key: 'rechazo',      label: 'Rechazo',      positive: false },
  { key: 'preocupacion', label: 'Preocupación', positive: false },
  { key: 'descredito',   label: 'Descrédito',   positive: false },
];

export interface RadarSerie {
  /** Identificador interno de la serie. */
  key: string;
  /** Etiqueta visible (p.ej. "Quirónsalud"). */
  label: string;
  /** Color HSL/hex usado para trazo y relleno. */
  color: string;
  /** Si true, la serie se renderiza con relleno más opaco para destacar. */
  highlight?: boolean;
  /** Datos por métrica. Las claves deben coincidir con METRICAS_CANONICAS[].key. */
  values: Record<string, number | null>;
}

interface Props {
  series: RadarSerie[];
  /** Tamaño en px (se ignora; tamaño unificado h-96). */
  size?: number;
}

/** Envoltorio compatible: delega en el radar único RadarDimensiones. */
export default function RadarMetricasIA({ series }: Props) {
  const prot = series.find(s => s.highlight) ?? series[0];
  if (!prot) return null;
  const otros = series.filter(s => s !== prot).map(s => ({ label: s.label, promedios: s.values }));
  return (
    <RadarDimensiones entidad={{ label: prot.label, promedios: prot.values }}
      referencia={otros[0]} comparables={otros.slice(1)} />
  );
}
