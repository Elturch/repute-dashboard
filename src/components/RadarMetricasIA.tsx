import { radarDomain } from '@/lib/metricas';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

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
  /** Tamaño en px (cuadrado). Por defecto 320. */
  size?: number;
}

export default function RadarMetricasIA({ series, size = 320 }: Props) {
  // Construir el dataset que entiende Recharts: una fila por métrica con un campo por serie.
  const data = METRICAS_CANONICAS.map(m => {
    const row: Record<string, number | string> = { metric: m.label, fullMark: 10 };
    series.forEach(s => {
      row[s.key] = s.values[m.key] ?? 0;
    });
    return row;
  });

  return (
    <div style={{ width: '100%', height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="80%">
          <PolarGrid gridType="polygon" stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
          <PolarRadiusAxis angle={90} domain={radarDomain(data as Array<Record<string, unknown>>)} tickCount={14} tickFormatter={(v: number) => v.toFixed(1)} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} stroke="hsl(var(--border))" />
          {series.map(s => (
            <Radar
              key={s.key}
              name={s.label}
              dataKey={s.key}
              stroke={s.color}
              fill={s.color}
              fillOpacity={s.highlight ? 0.35 : 0.1}
              strokeWidth={s.highlight ? 3 : 2.5}
              strokeOpacity={s.highlight ? 1 : 0.9}
            />
          ))}
          <Tooltip
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
            labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
            formatter={(v: number) => (typeof v === 'number' ? v.toFixed(2) : v)}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
