import { Wrench } from 'lucide-react';

export interface PerfilBucket {
  label: string;
  menciones: number;
  promedios: Record<string, number | null>;
}

interface MetricaDef { key: string; label: string; positive: boolean }

const POSITIVAS: MetricaDef[] = [
  { key: 'influencia',   label: 'Influencia',   positive: true },
  { key: 'fiabilidad',   label: 'Fiabilidad',   positive: true },
  { key: 'afinidad',     label: 'Afinidad',     positive: true },
  { key: 'admiracion',   label: 'Admiración',   positive: true },
  { key: 'impacto',      label: 'Impacto',      positive: true },
  { key: 'compromiso',   label: 'Compromiso',   positive: true },
];
const NEGATIVAS: MetricaDef[] = [
  { key: 'rechazo',      label: 'Rechazo',      positive: false },
  { key: 'preocupacion', label: 'Preocupación', positive: false },
  { key: 'descredito',   label: 'Descrédito',   positive: false },
];
const ALL_METRICAS = [...POSITIVAS, ...NEGATIVAS];

function fmtCompact(n: number) { return n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toLocaleString('es-ES'); }
function fmtNum(n: number | null, d = 2): string { return n == null ? '—' : n.toFixed(d); }

function statusFor(metric: MetricaDef, qs: number | null, resto: number | null): { icon: string; tone: 'up' | 'flat' | 'down' } {
  if (qs == null || resto == null) return { icon: '—', tone: 'flat' };
  const raw = qs - resto;
  const adjusted = metric.positive ? raw : -raw;
  const threshold = 0.3;
  if (adjusted > threshold) return { icon: '★', tone: 'up' };
  if (adjusted < -threshold) return { icon: '⚠', tone: 'down' };
  return { icon: '●', tone: 'flat' };
}

interface Props {
  contextLabel?: string;
  highlightLabel?: string;
  total: PerfilBucket;
  highlight: PerfilBucket;
  resto: PerfilBucket;
  highlightColor?: string;
}

export default function PerfilReputacionalIA({
  contextLabel = '',
  highlightLabel = 'Quirónsalud',
  total, highlight, resto,
  highlightColor = '#3b82f6',
}: Props) {
  const summary = (() => {
    let lidera = 0, enlinea = 0, atencion = 0;
    for (const m of ALL_METRICAS) {
      const s = statusFor(m, highlight.promedios[m.key], resto.promedios[m.key]);
      if (s.tone === 'up') lidera++;
      else if (s.tone === 'down') atencion++;
      else enlinea++;
    }
    return { lidera, enlinea, atencion, total: ALL_METRICAS.length };
  })();

  const allNull = ALL_METRICAS.every(m => highlight.promedios[m.key] == null);
  if (allNull) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Perfil reputacional IA{contextLabel ? ` · ${contextLabel}` : ''}
        </h3>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Wrench className="h-4 w-4" />
          Métricas IA no disponibles para este canal.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Perfil reputacional IA{contextLabel ? ` · ${contextLabel}` : ''}
      </h3>

      {/* Titular narrativo */}
      <div className="rounded-md border border-border bg-muted/30 p-4">
        <p className="text-sm text-foreground">
          <span className="font-semibold" style={{ color: highlightColor }}>{highlightLabel}</span> lidera en{' '}
          <span className="font-bold text-foreground">{summary.lidera}</span> de{' '}
          <span className="font-bold text-foreground">{summary.total}</span> dimensiones
          {summary.atencion > 0 && (
            <>
              {' '}— por debajo del sector en{' '}
              <span className="font-bold text-amber-600 dark:text-amber-400">{summary.atencion}</span>
            </>
          )}.
        </p>
      </div>

      {/* Cabecera con totales */}
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 border-b border-border pb-3 text-xs uppercase tracking-wider text-muted-foreground">
        <span>Métrica</span>
        <div className="text-right">
          <p>Total</p>
          <p className="mt-0.5 font-mono text-[10px] normal-case text-muted-foreground/70">
            {fmtCompact(total.menciones)}
          </p>
        </div>
        <div className="text-right">
          <p style={{ color: highlightColor }}>{highlightLabel}</p>
          <p className="mt-0.5 font-mono text-[10px] normal-case text-muted-foreground/70">
            {fmtCompact(highlight.menciones)}
          </p>
        </div>
        <div className="text-right">
          <p>Sin {highlightLabel === 'Quirónsalud' ? 'QS' : highlightLabel}</p>
          <p className="mt-0.5 font-mono text-[10px] normal-case text-muted-foreground/70">
            {fmtCompact(resto.menciones)}
          </p>
        </div>
      </div>

      {/* Bloques */}
      <div className="space-y-6">
        <Block title="Dimensiones positivas" metricas={POSITIVAS} total={total} highlight={highlight} resto={resto} highlightColor={highlightColor} />
        <Block title="Dimensiones negativas" metricas={NEGATIVAS} total={total} highlight={highlight} resto={resto} highlightColor={highlightColor} />
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span><span className="text-emerald-500">★</span> {highlightLabel} lidera</span>
        <span><span className="text-muted-foreground">●</span> En línea con el sector</span>
        <span><span className="text-amber-500">⚠</span> Por debajo del sector</span>
      </div>
    </div>
  );
}

function Block({ title, metricas, total, highlight, resto, highlightColor }: {
  title: string; metricas: MetricaDef[];
  total: PerfilBucket; highlight: PerfilBucket; resto: PerfilBucket; highlightColor: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{title}</p>
      <ul className="divide-y divide-border">
        {metricas.map((m) => {
          const tot = total.promedios[m.key];
          const hi = highlight.promedios[m.key];
          const re = resto.promedios[m.key];
          const status = statusFor(m, hi, re);
          const iconColor = status.tone === 'up' ? '#10b981' : status.tone === 'down' ? '#f59e0b' : '#6b7280';
          return (
            <li key={m.key} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center gap-4 py-2 text-sm">
              <span className="text-foreground">{m.label}</span>
              <span className="text-right font-mono text-muted-foreground">{fmtNum(tot)}</span>
              <span className="text-right font-mono font-semibold flex items-center justify-end gap-1.5" style={{ color: highlightColor }}>
                {fmtNum(hi)}
                <span style={{ color: iconColor }}>{status.icon}</span>
              </span>
              <span className="text-right font-mono text-muted-foreground">{fmtNum(re)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}