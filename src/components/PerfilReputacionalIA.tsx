import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
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

function statusFor(metric: MetricaDef, hi: number | null, re: number | null): { icon: string; tone: 'up' | 'flat' | 'down'; label: string } {
  if (hi == null || re == null) return { icon: '—', tone: 'flat', label: 'Sin datos' };
  const raw = hi - re;
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

  const radarData = ALL_METRICAS.map(m => ({
    metric: m.label,
    qs: highlight.promedios[m.key] ?? 0,
    sector: resto.promedios[m.key] ?? 0,
    fullMark: 10,
  }));

  return (
    <section className="mt-10">
      {/* Cabecera */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#4b5563] font-medium">
            Perfil reputacional IA{contextLabel ? ` · ${contextLabel}` : ''}
          </p>
          <h2 className="text-2xl font-bold tracking-tight mt-1">9 dimensiones IA</h2>
        </div>
        <div className="flex items-center gap-7 text-right">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#6b7280]">Total</p>
            <p className="text-lg font-bold tabular-nums">{fmtCompact(total.menciones)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: highlightColor }}>{highlightLabel}</p>
            <p className="text-lg font-bold tabular-nums text-white">{fmtCompact(highlight.menciones)}</p>
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

      {/* Radar centrado con leyenda */}
      <div className="relative bg-white/[0.02] border border-white/5 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-center gap-8 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: highlightColor, opacity: 0.7 }} />
            <span className="text-white font-semibold uppercase tracking-wider text-[10px]">{highlightLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#6b7280]/40 border border-[#6b7280]/60" />
            <span className="text-[#9ca3af] uppercase tracking-wider text-[10px]">Sector privado</span>
          </div>
        </div>
        <div className="w-full" style={{ height: 420 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: '#d1d5db', fontSize: 12, fontWeight: 600 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: '#4b5563', fontSize: 10 }} stroke="rgba(255,255,255,0.05)" />
              <Radar name="Sector" dataKey="sector" stroke="#6b7280" fill="#6b7280" fillOpacity={0.18} strokeWidth={1.2} />
              <Radar name={highlightLabel} dataKey="qs" stroke={highlightColor} fill={highlightColor} fillOpacity={0.42} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-[#6b7280] text-center uppercase tracking-wider mt-1">
          Escala 0 — 10 · valores promedio ponderados por nº de menciones
        </p>
      </div>

      {/* Tabla numérica precisa */}
      <NumericTable
        positivas={POSITIVAS}
        negativas={NEGATIVAS}
        total={total}
        highlight={highlight}
        resto={resto}
        highlightColor={highlightColor}
        highlightLabel={highlightLabel}
      />

      {/* Leyenda */}
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-7 text-[11px] text-[#9ca3af]">
        <span><span className="text-[#10b981] font-bold mr-1">★</span> {highlightLabel} lidera</span>
        <span><span className="text-[#9ca3af] font-bold mr-1">●</span> En línea con el sector</span>
        <span><span className="text-[#f59e0b] font-bold mr-1">⚠</span> Por debajo del sector</span>
      </div>
    </section>
  );
}

function NumericTable({
  positivas, negativas, total, highlight, resto, highlightColor, highlightLabel,
}: {
  positivas: MetricaDef[]; negativas: MetricaDef[];
  total: PerfilBucket; highlight: PerfilBucket; resto: PerfilBucket;
  highlightColor: string; highlightLabel: string;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[1.6fr_0.8fr_1.4fr_0.8fr] gap-3 px-7 py-3 border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">
        <span>Métrica</span>
        <span className="text-right">Total</span>
        <span className="text-right" style={{ color: highlightColor }}>{highlightLabel}</span>
        <span className="text-right">Sin {highlightLabel === 'Quirónsalud' ? 'QS' : highlightLabel}</span>
      </div>

      <SectionHeader label="Positivas" sub="más alto = mejor" color="#10b981" />
      {positivas.map((m, i) => (
        <Row key={m.key} m={m} t={total} h={highlight} r={resto} hc={highlightColor} isLast={i === positivas.length - 1} />
      ))}

      <SectionHeader label="Negativas" sub="más bajo = mejor" color="#f59e0b" />
      {negativas.map((m, i) => (
        <Row key={m.key} m={m} t={total} h={highlight} r={resto} hc={highlightColor} isLast={i === negativas.length - 1} />
      ))}
    </div>
  );
}

function SectionHeader({ label, sub, color }: { label: string; sub: string; color: string }) {
  return (
    <div className="px-7 py-2.5 bg-white/[0.015] border-b border-white/5 flex items-baseline gap-3">
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#d1d5db]">{label}</span>
      <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">— {sub}</span>
    </div>
  );
}

function Row({ m, t, h, r, hc, isLast }: {
  m: MetricaDef; t: PerfilBucket; h: PerfilBucket; r: PerfilBucket; hc: string; isLast: boolean;
}) {
  const tot = t.promedios[m.key];
  const hi = h.promedios[m.key];
  const re = r.promedios[m.key];
  const status = statusFor(m, hi, re);
  const diff = (hi != null && re != null) ? hi - re : null;
  const statusColor = status.tone === 'up' ? '#10b981' : status.tone === 'down' ? '#f59e0b' : '#6b7280';

  return (
    <div className={`grid grid-cols-[1.6fr_0.8fr_1.4fr_0.8fr] gap-3 px-7 py-3 items-baseline ${!isLast ? 'border-b border-white/[0.04]' : ''}`}>
      <span className="text-base text-[#e5e7eb]">{m.label}</span>
      <span className="text-right tabular-nums text-base text-[#9ca3af]">{fmtNum(tot)}</span>
      <span className="text-right tabular-nums flex items-baseline justify-end gap-3">
        <span className="text-2xl font-bold text-white">{fmtNum(hi)}</span>
        <span className="text-base" style={{ color: statusColor }}>{status.icon}</span>
        {diff != null && Math.abs(diff) >= 0.05 && (
          <span className="text-xs tabular-nums font-semibold" style={{ color: statusColor }}>
            {diff > 0 ? '+' : ''}{diff.toFixed(2)}
          </span>
        )}
      </span>
      <span className="text-right tabular-nums text-base text-[#9ca3af]">{fmtNum(re)}</span>
    </div>
  );
}