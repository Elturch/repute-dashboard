import { useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';
import { contarLiderazgo, radarAxisPos, radarDomain } from '@/lib/metricas';

/** Colores únicos de todos los radares de la app. */
export const RADAR_QS_COLOR = 'hsl(217, 91%, 60%)';
export const RADAR_REF_COLOR = 'hsl(var(--muted-foreground))';

export const RADAR_DIMS: { key: string; label: string; positive: boolean }[] = [
  { key: 'influencia', label: 'Influencia', positive: true },
  { key: 'fiabilidad', label: 'Fiabilidad', positive: true },
  { key: 'afinidad', label: 'Afinidad', positive: true },
  { key: 'admiracion', label: 'Admiración', positive: true },
  { key: 'impacto', label: 'Impacto', positive: true },
  { key: 'rechazo', label: 'Rechazo', positive: false },
  { key: 'preocupacion', label: 'Preocupación', positive: false },
  { key: 'descredito', label: 'Descrédito', positive: false },
];

export interface RadarEntidad {
  label: string;
  promedios: Record<string, number | null | undefined>;
  menciones?: number;
}

interface Props {
  /** Entidad protagonista (QS o el hospital de la página). */
  entidad: RadarEntidad;
  /** Referencia por defecto (conjunto / media). Si falta, el radar pinta una sola serie. */
  referencia?: RadarEntidad;
  /** Entidades concretas del ámbito: alimentan el selector y la horquilla por eje. */
  comparables?: RadarEntidad[];
  /** Entidades extra que solo cuentan para la horquilla (p.ej. el total). */
  normalizarCon?: RadarEntidad[];
  /** Promedios contra los que se cuenta "lidera en X de 8" (por defecto, la referencia). */
  resto?: Record<string, number | null | undefined>;
  /** Nombre corto para el encabezado ("QS"). */
  short?: string;
  /** Contexto para aria-label (canal). */
  contexto?: string;
  /** Ámbito para el pie ("los hospitales de este canal"). */
  ambito?: string;
  color?: string;
  /** Altura del gráfico (clase tailwind). */
  heightClass?: string;
}

function inv(v: number | null | undefined, positive: boolean): number | null {
  if (v == null || !isFinite(Number(v))) return null;
  return positive ? Number(v) : 10 - Number(v);
}

export default function RadarDimensiones({
  entidad, referencia, comparables = [], normalizarCon = [], resto, short, contexto = '',
  ambito = 'los hospitales de este canal', color = RADAR_QS_COLOR, heightClass = 'h-96',
}: Props) {
  const [comp, setComp] = useState('');
  const opciones = comparables.filter(c => c.label !== entidad.label && (c.menciones ?? 1) > 0);
  const ref = (comp && opciones.find(c => c.label === comp)) || referencia;
  const nombreCorto = short ?? entidad.label;
  const lidera = ref ? contarLiderazgo(entidad.promedios as Record<string, number | null>, (resto ?? referencia?.promedios ?? {}) as Record<string, number | null>) : 0;

  const pool = [entidad, ...(referencia ? [referencia] : []), ...opciones, ...normalizarCon];
  const relativa = !!ref && pool.length >= 3;

  const base = RADAR_DIMS.map(d => {
    const qsR = inv(entidad.promedios[d.key], d.positive);
    const refR = ref ? inv(ref.promedios[d.key], d.positive) : null;
    return { d, qsR, refR };
  });
  const absDomain = radarDomain(base.flatMap(b => [b.qsR, b.refR]));
  const data = base.map(({ d, qsR, refR }) => {
    let qs: number | null = qsR, rf: number | null = refR;
    if (relativa) {
      const vals = pool.map(e => inv(e.promedios[d.key], d.positive)).filter((v): v is number => v != null);
      const mn = vals.length ? Math.min(...vals) : 0; const mx = vals.length ? Math.max(...vals) : 0;
      qs = radarAxisPos(qsR, mn, mx); rf = radarAxisPos(refR, mn, mx);
    }
    return {
      metric: d.label, qs, ref: rf,
      qsReal: entidad.promedios[d.key] ?? null, refReal: ref ? (ref.promedios[d.key] ?? null) : null,
    };
  });
  const sinDatos = (entidad.menciones ?? 1) === 0 || data.every(r => r.qs == null);

  return (
    <div aria-label={`Radar ${nombreCorto}${contexto ? ` en ${contexto}` : ''}`}>
      {ref && (
        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Dimensiones IA · {nombreCorto} lidera en <span className="text-foreground font-semibold">{sinDatos ? 0 : lidera}</span> de 8
          </p>
          {opciones.length > 0 && (
            <select aria-label={`Comparar ${nombreCorto}${contexto ? ` en ${contexto}` : ''}`} value={comp} onChange={e => setComp(e.target.value)}
              className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground max-w-[12rem]">
              <option value="">{referencia?.label ?? 'Conjunto'}</option>
              {opciones.map(g => <option key={g.label} value={g.label}>{g.label}</option>)}
            </select>
          )}
        </div>
      )}
      {sinDatos ? (
        <div className="h-40 flex items-center justify-center text-xs uppercase tracking-widest text-muted-foreground">Sin datos en el periodo</div>
      ) : (
        <div className={heightClass}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="80%">
              <PolarGrid gridType="polygon" stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={relativa ? [0, 100] : absDomain} tickCount={9} tick={false} axisLine={false} />
              <RTooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))', fontSize: 12 }}
                formatter={(_v: number, n: string, item: { dataKey?: string; payload?: { qsReal: number | null; refReal: number | null } }) => {
                  const real = item.dataKey === 'qs' ? item.payload?.qsReal : item.payload?.refReal;
                  return [real == null ? '—' : `${Number(real).toFixed(1)} / 10`, n];
                }} />
              {ref && <Radar name={ref.label} dataKey="ref" stroke={RADAR_REF_COLOR} fill={RADAR_REF_COLOR} fillOpacity={0.1} strokeWidth={2.5} strokeOpacity={0.9} isAnimationActive={false} />}
              <Radar name={entidad.label} dataKey="qs" stroke={color} fill={color} fillOpacity={0.3} strokeWidth={3} isAnimationActive={false} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground text-center">
        {relativa
          ? `Cada dimensión se escala a la horquilla real de ${ambito}: cuanto más hacia fuera, mejor posición relativa. Así una diferencia de décimas se aprecia; la nota real (0–10) aparece al pasar el ratón. (Rechazo, preocupación y descrédito invertidos.)`
          : 'Escala ajustada al rango de las notas mostradas: cuanto más hacia fuera, mejor. La nota real (0–10) aparece al pasar el ratón. (Rechazo, preocupación y descrédito invertidos.)'}
      </p>
    </div>
  );
}
