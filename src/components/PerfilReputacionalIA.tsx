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
  { key: 'compromiso',   label: 'Compromiso',   positive: true },
];
const NEGATIVAS: MetricaDef[] = [
  { key: 'rechazo',      label: 'Rechazo',      positive: false },
  { key: 'preocupacion', label: 'Preocupación', positive: false },
  { key: 'descredito',   label: 'Descrédito',   positive: false },
];
const ALL_METRICAS = [...POSITIVAS, ...NEGATIVAS];

const COLOR_GOOD = '#10b981';
const COLOR_FLAT = '#9ca3af';
const COLOR_BAD  = '#ef4444';

function fmt(n: number) { return n.toLocaleString('es-ES'); }
function fmtNum(n: number | null, d = 2): string { return n == null ? '—' : n.toFixed(d); }

function statusFor(metric: MetricaDef, hi: number | null, re: number | null): { icon: string; tone: 'up' | 'flat' | 'down'; label: string; color: string } {
  if (hi == null || re == null) return { icon: '—', tone: 'flat', label: 'Sin datos', color: COLOR_FLAT };
  const raw = hi - re;
  const adjusted = metric.positive ? raw : -raw;
  const threshold = 0.3;
  if (adjusted > threshold)  return { icon: '★', tone: 'up',   label: 'Lidera',      color: COLOR_GOOD };
  if (adjusted < -threshold) return { icon: '⚠', tone: 'down', label: 'Por debajo',  color: COLOR_BAD };
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
    let lidera = 0, enlinea = 0, atencion = 0;
    for (const m of ALL_METRICAS) {
      const s = statusFor(m, highlight.promedios[m.key], resto.promedios[m.key]);
      if (s.tone === 'up') lidera++;
      else if (s.tone === 'down') atencion++;
      else enlinea++;
    }
    return { lidera, enlinea, atencion, total: ALL_METRICAS.length };
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

  const radarData = ALL_METRICAS.map(m => ({
    metric: m.label,
    qs: highlight.promedios[m.key] ?? 0,
    sector: resto.promedios[m.key] ?? 0,
    fullMark: 10,
  }));

  return (
    <section className="mt-12">
      <p className="text-[11px] uppercase tracking-[0.25em] text-[#4b5563] mb-4 font-medium">
        Perfil reputacional IA{contextLabel ? ` · ${contextLabel}` : ''}
      </p>

      {/* Header 3 columnas tipo Looker — números grandes */}
      <div className="grid grid-cols-3 gap-4 mb-8 bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
        <ColumnCounter label="Grupos hospitalarios" sub="Nº de menciones" value={fmt(total.menciones)} />
        <ColumnCounter label="Quirónsalud" sub="Nº de menciones" value={fmt(highlight.menciones)} highlight color={highlightColor} />
        <ColumnCounter label={`Grupos sin ${highlightLabel === 'Quirónsalud' ? 'Quirónsalud' : highlightLabel}`} sub="Nº de menciones" value={fmt(resto.menciones)} />
      </div>

      {/* Titular */}
      <div className="px-7 py-5 mb-6 rounded-xl border border-white/5 bg-gradient-to-r from-[#3b82f6]/[0.08] via-transparent to-transparent">
        <p className="text-[28px] font-light leading-snug">
          <span style={{ color: highlightColor }} className="font-bold">{highlightLabel} lidera</span> en{' '}
          <span className="font-bold tabular-nums text-[#10b981]">{summary.lidera}</span> de{' '}
          <span className="font-bold tabular-nums">{summary.total}</span> dimensiones
          {summary.atencion > 0 && (
            <>
              {' '}— por debajo del sector en{' '}
              <span className="text-[#ef4444] font-bold tabular-nums">{summary.atencion}</span>
            </>
          )}.
        </p>
      </div>

      {/* Radar grande */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-center gap-10 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: highlightColor, opacity: 0.7 }} />
            <span className="text-white font-bold uppercase tracking-wider text-[11px]">{highlightLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-[#6b7280]/40 border border-[#6b7280]/60" />
            <span className="text-[#9ca3af] uppercase tracking-wider text-[11px]">Sector</span>
          </div>
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
              <Radar name="Sector" dataKey="sector" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.18} strokeWidth={1.5} strokeDasharray="4 3" />
              <Radar name={highlightLabel} dataKey="qs" stroke={highlightColor} fill={highlightColor} fillOpacity={0.45} strokeWidth={2.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-[#6b7280] text-center uppercase tracking-wider mt-2">
          Escala 0 — 10 · El color del eje indica si Quirónsalud lidera (verde), está en línea (gris) o por debajo (rojo)
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
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-8 text-sm text-[#9ca3af]">
        <span className="flex items-center gap-1.5"><span className="text-[#10b981] font-bold text-base">★</span> {highlightLabel} lidera</span>
        <span className="flex items-center gap-1.5"><span className="text-[#9ca3af] font-bold text-base">●</span> En línea con el sector</span>
        <span className="flex items-center gap-1.5"><span className="text-[#ef4444] font-bold text-base">⚠</span> Por debajo del sector</span>
      </div>
    </section>
  );
}

function ColumnCounter({ label, sub, value, highlight, color }: {
  label: string; sub: string; value: string; highlight?: boolean; color?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-7 px-4 ${highlight ? 'bg-[#3b82f6]/[0.06] border-x border-[#3b82f6]/20' : ''}`}>
      <p className={`text-[12px] uppercase tracking-[0.2em] mb-1 ${highlight ? 'font-bold' : 'text-[#9ca3af]'}`} style={highlight ? { color } : {}}>
        {label}
      </p>
      <p className="text-[10px] text-[#6b7280] mb-2 uppercase tracking-wider">{sub}</p>
      <p className={`text-5xl font-bold tabular-nums ${highlight ? '' : 'text-[#e5e7eb]'}`} style={highlight ? { color: 'white' } : {}}>
        {value}
      </p>
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
        <tspan x={x} dy="0" fontSize="12" fontWeight="600" fill="#d1d5db" letterSpacing="0.5">
          {payload.value.toUpperCase()}
        </tspan>
        <tspan x={x} dy="1.4em" fontSize="18" fontWeight="800" fill={info.color}>
          {info.value != null ? info.value.toFixed(2) : '—'}
        </tspan>
        <tspan dx="6" fontSize="16" fontWeight="800" fill={info.color}>
          {info.icon}
        </tspan>
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
      <div className="grid grid-cols-[1.6fr_0.9fr_1.6fr_0.9fr] gap-4 px-7 py-3.5 border-b border-white/10 text-[11px] uppercase tracking-[0.2em] text-[#6b7280]">
        <span>Métrica</span>
        <span className="text-right">Total</span>
        <span className="text-right font-bold" style={{ color: highlightColor }}>{highlightLabel}</span>
        <span className="text-right">Sin {highlightLabel === 'Quirónsalud' ? 'QS' : highlightLabel}</span>
      </div>

      <SectionHeader label="Positivas" sub="más alto = mejor" color={COLOR_GOOD} />
      {positivas.map((m) => (
        <Row key={m.key} m={m} t={total} h={highlight} r={resto} hc={highlightColor} isLast={false} />
      ))}

      <SectionHeader label="Negativas" sub="más bajo = mejor" color={COLOR_BAD} />
      {negativas.map((m, i) => (
        <Row key={m.key} m={m} t={total} h={highlight} r={resto} hc={highlightColor} isLast={i === negativas.length - 1} />
      ))}
    </div>
  );
}

function SectionHeader({ label, sub, color }: { label: string; sub: string; color: string }) {
  return (
    <div className="px-7 py-3 bg-white/[0.02] border-y border-white/5 flex items-baseline gap-3">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#e5e7eb]">{label}</span>
      <span className="text-[11px] text-[#6b7280] uppercase tracking-wider">— {sub}</span>
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

  return (
    <div className={`grid grid-cols-[1.6fr_0.9fr_1.6fr_0.9fr] gap-4 px-7 py-4 items-baseline ${!isLast ? 'border-b border-white/[0.04]' : ''}`}>
      <span className="text-base text-[#e5e7eb] font-medium">{m.label}</span>
      <span className="text-right tabular-nums text-lg text-[#9ca3af]">{fmtNum(tot)}</span>
      <span className="text-right tabular-nums flex items-baseline justify-end gap-3">
        <span className="text-3xl font-bold text-white">{fmtNum(hi)}</span>
        <span className="text-xl" style={{ color: status.color }}>{status.icon}</span>
        {diff != null && Math.abs(diff) >= 0.05 && (
          <span className="text-sm tabular-nums font-bold" style={{ color: status.color }}>
            {diff > 0 ? '+' : ''}{diff.toFixed(2)}
          </span>
        )}
      </span>
      <span className="text-right tabular-nums text-lg text-[#9ca3af]">{fmtNum(re)}</span>
    </div>
  );
}
