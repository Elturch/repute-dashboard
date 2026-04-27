import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Wrench } from 'lucide-react';
import { useMemo } from 'react';

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
];
const NEGATIVAS: MetricaDef[] = [
  { key: 'rechazo',      label: 'Rechazo',      positive: false },
  { key: 'preocupacion', label: 'Preocupación', positive: false },
  { key: 'descredito',   label: 'Descrédito',   positive: false },
];
const ALL_METRICAS = [...POSITIVAS, ...NEGATIVAS];

const COLOR_GOOD     = '#22c55e';
const COLOR_FLAT     = '#9ca3af';
const COLOR_BAD      = '#ef4444';

const RADAR_TOTAL = '#f59e0b';
const RADAR_QS    = '#10b981';
const RADAR_SINQS = '#3b82f6';

function fmtNum(n: number | null, d = 2): string { return n == null ? '—' : n.toFixed(d); }

function statusFor(metric: MetricaDef, hi: number | null, re: number | null): { icon: string; tone: 'up' | 'flat' | 'down'; label: string; color: string } {
  if (hi == null || re == null) return { icon: '—', tone: 'flat', label: 'Sin datos', color: COLOR_FLAT };
  const raw = hi - re;
  const adjusted = metric.positive ? raw : -raw;
  const threshold = 0.3;
  if (adjusted > threshold)  return { icon: '★', tone: 'up',   label: 'Lidera',     color: COLOR_GOOD };
  if (adjusted < -threshold) return { icon: '⚠', tone: 'down', label: 'Por debajo', color: COLOR_BAD };
  return { icon: '●', tone: 'flat', label: 'En línea', color: COLOR_FLAT };
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
  const summary = useMemo(() => {
    let lidera = 0, atencion = 0;
    for (const m of ALL_METRICAS) {
      const hi = highlight.promedios[m.key];
      const re = resto.promedios[m.key];
      if (hi == null || re == null) continue;
      const s = statusFor(m, hi, re);
      if (s.tone === 'up') lidera++;
      else if (s.tone === 'down') atencion++;
    }
    return { lidera, atencion, total: ALL_METRICAS.length };
  }, [highlight, resto]);

  const statusMap = useMemo(() => {
    const map: Record<string, { color: string; icon: string; value: number | null }> = {};
    ALL_METRICAS.forEach(m => {
      const hi = highlight.promedios[m.key];
      const re = resto.promedios[m.key];
      const s = statusFor(m, hi, re);
      map[m.label] = { color: s.color, icon: s.icon, value: hi };
    });
    return map;
  }, [highlight, resto]);

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

  const radarData = ALL_METRICAS.map(m => {
    const totalRaw = total.promedios[m.key];
    const qsRaw    = highlight.promedios[m.key];
    const sinqsRaw = resto.promedios[m.key];
    return {
      metric: m.label,
      total: totalRaw == null ? null : (m.positive ? totalRaw : 10 - totalRaw),
      qs:    qsRaw    == null ? null : (m.positive ? qsRaw    : 10 - qsRaw),
      sinqs: sinqsRaw == null ? null : (m.positive ? sinqsRaw : 10 - sinqsRaw),
      fullMark: 10,
    };
  });

  return (
    <section className="mt-12">
      <p className="text-[11px] uppercase tracking-[0.25em] text-[#4b5563] mb-4 font-medium">
        Perfil reputacional IA{contextLabel ? ` · ${contextLabel}` : ''}
      </p>

      <div className="px-7 py-6 mb-6 rounded-xl border border-[#10b981]/20 bg-[#10b981]/[0.05]">
        <p className="text-[32px] font-semibold leading-tight text-white">
          <span style={{ color: RADAR_QS }}>{highlightLabel} lidera</span> en{' '}
          <span className="tabular-nums" style={{ color: RADAR_QS }}>{summary.lidera}</span> de{' '}
          <span className="tabular-nums">{summary.total}</span> dimensiones
          {summary.atencion > 0 && (
            <>
              <span className="text-white/50">  ·  </span>
              <span className="text-[#ef4444] tabular-nums">{summary.atencion}</span>
              <span className="text-white/85"> por debajo del sector</span>
            </>
          )}.
        </p>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-center gap-10 mb-4 flex-wrap">
          <LegendItem color={RADAR_TOTAL} label="GRUPOS HOSPITALARIOS (TOTAL)" />
          <LegendItem color={RADAR_QS} label={highlightLabel.toUpperCase()} bold />
          <LegendItem color={RADAR_SINQS} label={`SIN ${highlightLabel === 'Quirónsalud' ? 'QS' : highlightLabel.toUpperCase()}`} />
        </div>
        <div className="w-full" style={{ height: 540 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
              <PolarGrid stroke="rgba(255,255,255,0.10)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={(props: any) => <ColoredAxisTick {...props} statusMap={statusMap} />}
              />
              <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: '#4b5563', fontSize: 10 }} stroke="rgba(255,255,255,0.05)" />

              <Radar name="Total"
                     dataKey="total"
                     stroke={RADAR_TOTAL}
                     fill={RADAR_TOTAL}
                     fillOpacity={0.18}
                     strokeWidth={1.5} />

              <Radar name="Sin QS"
                     dataKey="sinqs"
                     stroke={RADAR_SINQS}
                     fill={RADAR_SINQS}
                     fillOpacity={0.28}
                     strokeWidth={2} />

              <Radar name={highlightLabel}
                     dataKey="qs"
                     stroke={RADAR_QS}
                     fill={RADAR_QS}
                     fillOpacity={0.55}
                     strokeWidth={3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[12px] text-[#9ca3af] text-center mt-3 leading-relaxed">
          Métricas negativas (rechazo, preocupación, descrédito) invertidas para que <span className="font-bold text-white">"más extenso = mejor"</span> en todas las direcciones.<br/>
          Color del eje: <span className="text-[#22c55e] font-bold">verde</span> si {highlightLabel} lidera, <span className="text-[#ef4444] font-bold">rojo</span> si está por debajo. Valores reales junto a cada eje.
        </p>
      </div>

      <NumericTable
        positivas={POSITIVAS}
        negativas={NEGATIVAS}
        total={total}
        highlight={highlight}
        resto={resto}
        highlightColor={highlightColor}
        highlightLabel={highlightLabel}
      />

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-8 text-sm text-[#9ca3af] flex-wrap">
        <span className="flex items-center gap-1.5"><span className="text-[#22c55e] font-bold text-base">★</span> {highlightLabel} lidera</span>
        <span className="flex items-center gap-1.5"><span className="text-[#9ca3af] font-bold text-base">●</span> En línea con el sector</span>
        <span className="flex items-center gap-1.5"><span className="text-[#ef4444] font-bold text-base">⚠</span> Por debajo del sector</span>
      </div>
    </section>
  );
}

function LegendItem({ color, label, bold }: { color: string; label: string; bold?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`rounded-md ${bold ? 'w-7 h-7' : 'w-6 h-6'}`}
        style={{ backgroundColor: color, opacity: bold ? 0.7 : 0.5, border: `2px solid ${color}` }}
      />
      <span className={`uppercase tracking-wider ${bold ? 'text-[12px] font-bold text-white' : 'text-[11px] font-semibold text-[#d1d5db]'}`}>
        {label}
      </span>
    </div>
  );
}

function ColoredAxisTick(props: any) {
  const { x, y, textAnchor, payload, statusMap } = props;
  const info = statusMap[payload.value];
  if (!info) return null;
  return (
    <g>
      <text x={x} y={y} textAnchor={textAnchor}>
        <tspan x={x} dy="0" fontSize="12" fontWeight="700" fill="#d1d5db" letterSpacing="0.5">
          {payload.value.toUpperCase()}
        </tspan>
        <tspan x={x} dy="1.4em" fontSize="22" fontWeight="800" fill={info.color}>
          {info.value != null ? info.value.toFixed(2) : 'n/a'}
        </tspan>
        {info.value != null && (
          <tspan dx="6" fontSize="20" fontWeight="800" fill={info.color}>
            {info.icon}
          </tspan>
        )}
      </text>
    </g>
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
      <div className="grid grid-cols-[1.4fr_1fr_1.6fr_1fr] gap-4 px-7 py-3.5 border-b border-white/10 text-[11px] uppercase tracking-[0.2em]">
        <span className="text-[#9ca3af]">Métrica</span>
        <span className="text-right" style={{ color: RADAR_TOTAL }}>Total</span>
        <span className="text-right font-bold" style={{ color: RADAR_QS }}>{highlightLabel}</span>
        <span className="text-right" style={{ color: RADAR_SINQS }}>Sin {highlightLabel === 'Quirónsalud' ? 'QS' : highlightLabel}</span>
      </div>

      <SectionHeader label="Positivas" sub="más alto = mejor" color={COLOR_GOOD} />
      {positivas.map((m) => <Row key={m.key} m={m} t={total} h={highlight} r={resto} />)}

      <SectionHeader label="Negativas" sub="más bajo = mejor" color={COLOR_BAD} />
      {negativas.map((m, i) => <Row key={m.key} m={m} t={total} h={highlight} r={resto} isLast={i === negativas.length - 1} />)}
    </div>
  );
}

function SectionHeader({ label, sub, color }: { label: string; sub: string; color: string }) {
  return (
    <div className="px-7 py-3 bg-white/[0.025] border-y border-white/5 flex items-baseline gap-3">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#e5e7eb]">{label}</span>
      <span className="text-[11px] text-[#6b7280] uppercase tracking-wider">— {sub}</span>
    </div>
  );
}

function Row({ m, t, h, r, isLast }: {
  m: MetricaDef; t: PerfilBucket; h: PerfilBucket; r: PerfilBucket; isLast?: boolean;
}) {
  const tot = t.promedios[m.key];
  const hi = h.promedios[m.key];
  const re = r.promedios[m.key];
  const status = statusFor(m, hi, re);
  const diff = (hi != null && re != null) ? hi - re : null;
  const noData = hi == null;

  return (
    <div className={`grid grid-cols-[1.4fr_1fr_1.6fr_1fr] gap-4 px-7 py-5 items-baseline ${!isLast ? 'border-b border-white/[0.04]' : ''} ${noData ? 'opacity-50' : ''}`}>
      <span className="text-lg text-[#e5e7eb] font-medium">
        {m.label}
        {noData && <span className="ml-2 text-[10px] uppercase tracking-wider text-[#f59e0b]">no aplica</span>}
      </span>
      <span className="text-right tabular-nums text-3xl font-semibold" style={{ color: tot != null ? '#fcd34d' : '#6b7280' }}>{fmtNum(tot)}</span>
      <span className="text-right tabular-nums flex items-baseline justify-end gap-3">
        <span className="text-5xl font-bold text-white">{fmtNum(hi)}</span>
        {!noData && <span className="text-2xl" style={{ color: status.color }}>{status.icon}</span>}
        {diff != null && Math.abs(diff) >= 0.05 && (
          <span className="text-base tabular-nums font-bold" style={{ color: status.color }}>
            {diff > 0 ? '+' : ''}{diff.toFixed(2)}
          </span>
        )}
      </span>
      <span className="text-right tabular-nums text-3xl font-semibold" style={{ color: re != null ? '#93c5fd' : '#6b7280' }}>{fmtNum(re)}</span>
    </div>
  );
}
