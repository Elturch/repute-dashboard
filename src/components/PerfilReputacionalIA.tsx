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

function statusFor(metric: MetricaDef, qs: number | null, resto: number | null): { icon: string; tone: 'up' | 'flat' | 'down'; label: string } {
  if (qs == null || resto == null) return { icon: '—', tone: 'flat', label: 'Sin datos' };
  const raw = qs - resto;
  const adjusted = metric.positive ? raw : -raw;
  const threshold = 0.3;
  if (adjusted > threshold) return { icon: '★', tone: 'up', label: 'Lidera' };
  if (adjusted < -threshold) return { icon: '⚠', tone: 'down', label: 'Por debajo' };
  return { icon: '●', tone: 'flat', label: 'En línea' };
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
      <section className="mt-10">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#4b5563] mb-3 font-medium">
          Perfil reputacional IA{contextLabel ? ` · ${contextLabel}` : ''}
        </p>
        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-8 flex items-center gap-3 text-[#f59e0b] text-sm">
          <Wrench className="w-4 h-4" />
          Métricas IA no disponibles para este canal.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      {/* Cabecera de bloque */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#4b5563] font-medium">
            Perfil reputacional IA{contextLabel ? ` · ${contextLabel}` : ''}
          </p>
          <h2 className="text-2xl font-bold tracking-tight mt-1">9 dimensiones IA</h2>
        </div>
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#6b7280]">Total</p>
            <p className="text-lg font-bold tabular-nums">{fmtCompact(total.menciones)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: highlightColor }}>{highlightLabel}</p>
            <p className="text-lg font-bold tabular-nums" style={{ color: 'white' }}>{fmtCompact(highlight.menciones)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#6b7280]">Sin {highlightLabel === 'Quirónsalud' ? 'QS' : highlightLabel}</p>
            <p className="text-lg font-bold tabular-nums">{fmtCompact(resto.menciones)}</p>
          </div>
        </div>
      </div>

      {/* Titular */}
      <div className="px-7 py-5 mb-6 rounded-xl border border-white/5 bg-gradient-to-r from-[#3b82f6]/[0.07] via-transparent to-transparent">
        <p className="text-[26px] font-light leading-snug">
          <span style={{ color: highlightColor }} className="font-bold">{highlightLabel} lidera</span> en{' '}
          <span className="font-bold tabular-nums">{summary.lidera}</span> de{' '}
          <span className="font-bold tabular-nums">{summary.total}</span> dimensiones
          {summary.atencion > 0 && (
            <>
              {' '}— por debajo del sector en{' '}
              <span className="text-[#f59e0b] font-bold tabular-nums">{summary.atencion}</span>
            </>
          )}.
        </p>
      </div>

      {/* Bloque positivas */}
      <Block
        title="Dimensiones positivas"
        subtitle="más alto = mejor"
        accentColor="#10b981"
        metricas={POSITIVAS}
        highlight={highlight}
        resto={resto}
        highlightColor={highlightColor}
        highlightLabel={highlightLabel}
      />

      {/* Bloque negativas */}
      <div className="mt-6">
        <Block
          title="Dimensiones negativas"
          subtitle="más bajo = mejor"
          accentColor="#f59e0b"
          metricas={NEGATIVAS}
          highlight={highlight}
          resto={resto}
          highlightColor={highlightColor}
          highlightLabel={highlightLabel}
          tintNegative
        />
      </div>

      {/* Leyenda */}
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-7 text-[11px] text-[#9ca3af]">
        <span><span className="text-[#10b981] font-bold mr-1">★</span> {highlightLabel} lidera</span>
        <span><span className="text-[#9ca3af] font-bold mr-1">●</span> En línea con el sector</span>
        <span><span className="text-[#f59e0b] font-bold mr-1">⚠</span> Por debajo del sector</span>
      </div>
    </section>
  );
}

function Block({
  title, subtitle, accentColor, metricas,
  highlight, resto, highlightColor, highlightLabel, tintNegative,
}: {
  title: string; subtitle: string; accentColor: string;
  metricas: MetricaDef[];
  highlight: PerfilBucket; resto: PerfilBucket;
  highlightColor: string; highlightLabel: string;
  tintNegative?: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3 px-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
        <h3 className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#d1d5db]">{title}</h3>
        <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">— {subtitle}</span>
      </div>
      <div className={`rounded-xl border border-white/5 overflow-hidden ${tintNegative ? 'bg-[#f59e0b]/[0.02]' : 'bg-white/[0.02]'}`}>
        {metricas.map((m, i) => (
          <MetricRow
            key={m.key}
            metric={m}
            highlight={highlight}
            resto={resto}
            highlightColor={highlightColor}
            highlightLabel={highlightLabel}
            isLast={i === metricas.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function MetricRow({
  metric, highlight, resto, highlightColor, highlightLabel, isLast,
}: {
  metric: MetricaDef;
  highlight: PerfilBucket; resto: PerfilBucket;
  highlightColor: string; highlightLabel: string; isLast: boolean;
}) {
  const qs = highlight.promedios[metric.key];
  const re = resto.promedios[metric.key];
  const status = statusFor(metric, qs, re);
  const max = 10;
  const qsPct = qs != null ? (qs / max) * 100 : 0;
  const restoPct = re != null ? (re / max) * 100 : 0;
  const diff = (qs != null && re != null) ? qs - re : null;
  const adjustedDiff = diff != null ? (metric.positive ? diff : -diff) : null;
  const statusColor = status.tone === 'up' ? '#10b981' : status.tone === 'down' ? '#f59e0b' : '#6b7280';

  return (
    <div className={`px-7 py-5 ${!isLast ? 'border-b border-white/[0.04]' : ''}`}>
      {/* Cabecera de fila */}
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-base font-semibold uppercase tracking-wider text-[#e5e7eb]">{metric.label}</span>
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold"
              style={{ color: statusColor }}>
          <span className="text-base">{status.icon}</span>
          <span>{status.label}</span>
        </span>
      </div>

      {/* Track con barras */}
      <div className="relative h-9 mb-3">
        <div className="absolute inset-0 bg-white/[0.03] rounded-md" />
        <div className="absolute top-[18px] bottom-1 left-1 rounded-sm bg-[#6b7280]/30"
             style={{ width: `calc(${restoPct}% - 4px)` }} />
        <div className="absolute top-[18px] bottom-1 w-[1.5px] bg-[#9ca3af]/60"
             style={{ left: `calc(${restoPct}% - 0.75px)` }} />
        <div className="absolute top-1 bottom-[18px] left-1 rounded-sm"
             style={{
               width: `calc(${qsPct}% - 4px)`,
               backgroundColor: highlightColor,
               boxShadow: `0 0 10px ${highlightColor}40, inset 0 0 0 1px ${highlightColor}`,
             }} />
        <div className="absolute top-1 bottom-[18px] w-[2px] bg-white"
             style={{ left: `calc(${qsPct}% - 1px)` }} />
        {[0, 5, 10].map(v => (
          <div key={v} className="absolute top-0 bottom-0 w-px bg-white/[0.05]"
               style={{ left: `${(v / max) * 100}%` }} />
        ))}
      </div>

      {/* Numbers row */}
      <div className="flex items-baseline justify-between text-xs">
        <div className="flex items-baseline gap-3">
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#6b7280]">Sector</span>
          <span className="text-base text-[#9ca3af] tabular-nums font-medium">{fmtNum(re)}</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: highlightColor }}>{highlightLabel}</span>
          <span className="text-3xl font-bold tabular-nums" style={{ color: 'white' }}>{fmtNum(qs)}</span>
          {adjustedDiff != null && Math.abs(adjustedDiff) >= 0.05 && (
            <span className="text-xs tabular-nums font-bold flex items-baseline gap-1" style={{ color: statusColor }}>
              <span>{adjustedDiff > 0 ? '▲' : '▼'}</span>
              <span>{Math.abs(diff!).toFixed(2)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}