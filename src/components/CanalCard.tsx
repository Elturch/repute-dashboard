import { useMemo, useState } from 'react';
import type { IconType } from 'react-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';
import { aggregateKpi, type KpiRow, type AggregatedKpi } from '@/hooks/useKpiCanal';
import { fmtNotaIA, fmtPctRiesgo, pctRiesgoReal, contarLiderazgo } from '@/lib/metricas';
import RiesgoRealInfo from '@/components/RiesgoRealInfo';

const QS_COLOR = 'hsl(217, 91%, 60%)';
const COMP_COLOR = 'hsl(var(--muted-foreground))';

const DIMS: { key: string; label: string; positive: boolean }[] = [
  { key: 'influencia', label: 'Influencia', positive: true },
  { key: 'fiabilidad', label: 'Fiabilidad', positive: true },
  { key: 'afinidad', label: 'Afinidad', positive: true },
  { key: 'admiracion', label: 'Admiración', positive: true },
  { key: 'impacto', label: 'Impacto', positive: true },
  { key: 'rechazo', label: 'Rechazo', positive: false },
  { key: 'preocupacion', label: 'Preocupación', positive: false },
  { key: 'descredito', label: 'Descrédito', positive: false },
];

export interface CanalCardProps {
  label: string;
  Icon: IconType;
  brandColor: string;
  /** Filas de kpi_canal de ESTE canal y segmento (ya filtradas). */
  rows: KpiRow[];
  /** Lista cerrada de grupos/hospitales a comparar (orden del ranking). */
  grupos: string[];
  /** Grupo protagonista (p.ej. 'Quirónsalud'). */
  highlight?: string;
  highlightShort?: string;
  /** Texto para la media del conjunto. */
  conjuntoLabel?: string;
  isLoading?: boolean;
}

function fmt(n: number) { return (n ?? 0).toLocaleString('es-ES'); }

export default function CanalCard({
  label, Icon, brandColor, rows, grupos, highlight = 'Quirónsalud', highlightShort = 'QS',
  conjuntoLabel = 'Media Grupos Hospitalarios', isLoading,
}: CanalCardProps) {
  const [comp, setComp] = useState('');

  const s = useMemo(() => {
    const set = new Set(grupos);
    const validas = rows.filter(r => r.grupo_hospitalario && set.has(r.grupo_hospitalario));
    const porGrupo = new Map<string, AggregatedKpi>();
    grupos.forEach(g => porGrupo.set(g, aggregateKpi(validas.filter(r => r.grupo_hospitalario === g))));
    const conjunto = aggregateKpi(validas);
    const qs = porGrupo.get(highlight) ?? aggregateKpi([]);
    const resto = aggregateKpi(validas.filter(r => r.grupo_hospitalario !== highlight));
    const total = conjunto.menciones;
    const max = Math.max(...Array.from(porGrupo.values()).map(a => a.menciones), 1);
    const filas = grupos
      .map(g => { const a = porGrupo.get(g)!; return { grupo: g, count: a.menciones, share: total ? a.menciones / total * 100 : 0, barPct: a.menciones / max * 100 }; })
      .sort((a, b) => b.count - a.count);
    const rank = filas.findIndex(f => f.grupo === highlight) + 1;
    return { porGrupo, conjunto, qs, resto, total, filas, rank, maxDate: conjunto.fechaMax };
  }, [rows, grupos, highlight]);

  const isEmpty = !isLoading && s.total === 0;
  const compAgg = comp ? s.porGrupo.get(comp) : null;
  const ref = compAgg ?? s.conjunto;
  const refLabel = comp || conjuntoLabel;
  const lidera = contarLiderazgo(s.qs.promedios, s.resto.promedios);

  const radarData = DIMS.map(d => {
    const q = s.qs.promedios[d.key], r = ref.promedios[d.key];
    const inv = (v: number | null | undefined) => v == null ? null : (d.positive ? v : 10 - v);
    return { metric: d.label, qs: inv(q), ref: inv(r) };
  });
  const pieData = s.filas.filter(f => f.count > 0);
  const others = pieData.filter(f => f.grupo !== highlight);

  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden flex flex-col" aria-label={`Canal ${label}`}>
      <header className="px-5 py-4 border-b border-border flex items-center gap-3 flex-wrap">
        <div className="h-9 w-9 rounded-lg bg-foreground/5 flex items-center justify-center">
          <Icon style={{ color: brandColor }} className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold">{label}</h2>
        {s.maxDate && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">hasta {format(s.maxDate, 'd MMM yyyy', { locale: es })}</span>}
        {isLoading && <span className="text-[10px] text-muted-foreground">Cargando...</span>}
      </header>

      {/* 4 indicadores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border-b border-border">
        <Ind label="Total menciones" value={fmt(s.total)} sub={`${highlightShort}: ${fmt(s.qs.menciones)}`} />
        <Ind label={`Nota IA · ${highlightShort}`} value={fmtNotaIA(s.qs.notaMedia)} sub={`Grupos: ${fmtNotaIA(s.conjunto.notaMedia)}`} accent />
        <Ind label={`Riesgo real · ${highlightShort}`} info value={s.qs.menciones ? fmtPctRiesgo(pctRiesgoReal(s.qs.peligroReal, s.qs.menciones)) : '—'} sub="medio-alto + alto + crítico" />
        <Ind label="Posición" value={s.total && s.qs.menciones ? `#${s.rank}` : '—'} sub={`de ${grupos.length}`} />
      </div>

      <div className="p-5 space-y-6 relative flex-1">
        {/* Tarta con competencia */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Reparto de menciones con competencia</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="grupo" innerRadius="45%" outerRadius="85%" paddingAngle={1} stroke="hsl(var(--card))" strokeWidth={2} isAnimationActive={false}>
                  {pieData.map(f => (
                    <Cell key={f.grupo} fill={f.grupo === highlight ? QS_COLOR : COMP_COLOR}
                      fillOpacity={f.grupo === highlight ? 1 : 0.35 + 0.55 * (1 - others.indexOf(f) / Math.max(others.length, 1))} />
                  ))}
                </Pie>
                <RTooltip formatter={(v: number, n: string) => [`${fmt(v)} (${s.total ? (v / s.total * 100).toFixed(1) : 0}%)`, n]}
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking 01..08 */}
        <div className="space-y-1.5">
          {s.filas.map((f, i) => {
            const isQS = f.grupo === highlight;
            return (
              <div key={f.grupo} className={`grid grid-cols-[1.5rem_minmax(0,9rem)_1fr_4rem_3.5rem] items-center gap-2 px-2 py-1.5 rounded ${isQS ? 'bg-primary/5 border border-primary/20' : ''}`}>
                <span className="text-[10px] text-muted-foreground tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <span className={`text-sm truncate ${isQS ? 'font-medium' : ''}`}>{f.grupo}</span>
                <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${f.barPct}%`, background: isQS ? QS_COLOR : COMP_COLOR }} />
                </div>
                <span className="text-sm font-semibold text-right tabular-nums">{fmt(f.count)}</span>
                <span className="text-xs text-muted-foreground text-right tabular-nums">{f.share.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>

        {/* Radar QS vs conjunto / grupo */}
        <div>
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Dimensiones IA · {highlightShort} lidera en <span className="text-foreground font-semibold">{lidera}</span> de 8
            </p>
            <select aria-label={`Comparar ${highlightShort} en ${label}`} value={comp} onChange={e => setComp(e.target.value)}
              className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground max-w-[12rem]">
              <option value="">{conjuntoLabel}</option>
              {grupos.filter(g => g !== highlight && (s.porGrupo.get(g)?.menciones ?? 0) > 0).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
                <Radar name={refLabel} dataKey="ref" stroke={COMP_COLOR} fill={COMP_COLOR} fillOpacity={0.1} strokeWidth={2.5} strokeOpacity={0.9} isAnimationActive={false} />
                <Radar name={highlight} dataKey="qs" stroke={QS_COLOR} fill={QS_COLOR} fillOpacity={0.3} strokeWidth={3} isAnimationActive={false} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">Rechazo, preocupación y descrédito invertidos: más extenso = mejor.</p>
        </div>

        {isEmpty && (
          <div className="absolute inset-0 bg-card/85 backdrop-blur-[1px] flex items-center justify-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Sin datos en el periodo</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Ind({ label, value, sub, accent, info }: { label: string; value: string; sub?: string; accent?: boolean; info?: boolean }) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}{info && <RiesgoRealInfo />}</p>
      <p className={`text-xl font-bold tabular-nums mt-1 ${accent ? 'text-primary' : ''}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">{sub}</p>}
    </div>
  );
}
