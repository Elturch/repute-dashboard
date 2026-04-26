import { useQuery, useQueryClient } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { NOMBRES_GRUPOS_PRIVADOS, type GrupoPrivado } from '@/lib/clasificacion';
import RadarMetricasIA, { METRICAS_CANONICAS, type RadarSerie } from '@/components/RadarMetricasIA';

interface MvRow {
  canal: string;
  titularidad: string | null;
  grupo_hospitalario: string | null;
  menciones: number;
  nota_media: number | null;
  preocupacion: number | null;
  rechazo: number | null;
  descredito: number | null;
  afinidad: number | null;
  fiabilidad: number | null;
  admiracion: number | null;
  impacto: number | null;
  influencia: number | null;
  compromiso: number | null;
}

function fmt(n: number) { return n.toLocaleString('es-ES'); }
function fmtNum(n: number | null, d = 2): string { return n == null ? '—' : n.toFixed(d); }

interface Bucket {
  label: string;
  menciones: number;
  promedios: Record<string, number | null>;
}

function aggregate(rows: MvRow[], label: string): Bucket {
  const sums: Record<string, { weighted: number; count: number }> = {};
  METRICAS_CANONICAS.forEach(m => sums[m.key] = { weighted: 0, count: 0 });
  let totalMenciones = 0;
  for (const r of rows) {
    totalMenciones += r.menciones;
    METRICAS_CANONICAS.forEach(m => {
      const v = (r as any)[m.key] as number | null;
      if (v != null) {
        sums[m.key].weighted += v * r.menciones;
        sums[m.key].count += r.menciones;
      }
    });
  }
  const promedios: Record<string, number | null> = {};
  METRICAS_CANONICAS.forEach(m => {
    promedios[m.key] = sums[m.key].count > 0 ? sums[m.key].weighted / sums[m.key].count : null;
  });
  return { label, menciones: totalMenciones, promedios };
}

async function fetchPrivadosMetricas(): Promise<{ total: Bucket; qs: Bucket; resto: Bucket }> {
  const { data, error } = await externalSupabase
    .from('mv_dashboard_resumen_30d')
    .select('canal, titularidad, grupo_hospitalario, menciones, nota_media, preocupacion, rechazo, descredito, afinidad, fiabilidad, admiracion, impacto, influencia, compromiso')
    .eq('titularidad', 'Privado');

  if (error) {
    console.error('[PrivadosMetricasIA] error:', error);
    const empty: Bucket = { label: '', menciones: 0, promedios: {} };
    return { total: empty, qs: empty, resto: empty };
  }

  const rows = (data ?? []) as MvRow[];
  const validas = rows.filter(r => r.grupo_hospitalario && NOMBRES_GRUPOS_PRIVADOS.includes(r.grupo_hospitalario as GrupoPrivado));

  return {
    total: aggregate(validas, 'Total privados'),
    qs: aggregate(validas.filter(r => r.grupo_hospitalario === 'Quirónsalud'), 'Quirónsalud'),
    resto: aggregate(validas.filter(r => r.grupo_hospitalario !== 'Quirónsalud'), 'Privados sin QS'),
  };
}

export default function PrivadosMetricasIA() {
  const queryClient = useQueryClient();
  const { data: stats, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['privados_metricas'],
    queryFn: fetchPrivadosMetricas,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const series: RadarSerie[] = stats ? [
    { key: 'total', label: stats.total.label, color: '#9ca3af', values: stats.total.promedios },
    { key: 'qs',    label: stats.qs.label,    color: '#3b82f6', values: stats.qs.promedios, highlight: true },
    { key: 'resto', label: stats.resto.label, color: '#6b7280', values: stats.resto.promedios },
  ] : [];

  return (
    <div className="p-6 space-y-6 bg-[#0b0f17] min-h-screen text-white">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280] mb-1">
            Sanidad privada · Métricas IA · Últimos 30 días
          </p>
          <h1 className="text-2xl font-semibold">Perfil reputacional comparado</h1>
          <p className="text-sm text-[#9ca3af] mt-1 max-w-2xl">
            9 dimensiones IA agregadas en los 7 canales. Quirónsalud (azul) frente al resto de privados (gris) y al total agregado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching ? (
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Actualizando
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider text-[#6b7280]">
              Auto-refresh 10 min · última: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
          )}
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['privados_metricas'] })}
            className="text-[10px] uppercase tracking-wider text-[#6b7280] hover:text-white ml-3"
          >
            🔄 Recargar
          </button>
        </div>
      </div>

      {/* 3 radares */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(stats ? [stats.total, stats.qs, stats.resto] : [null, null, null]).map((b, i) => {
          const colors = ['#9ca3af', '#3b82f6', '#6b7280'];
          const labels = ['TOTAL', 'QUIRÓNSALUD', 'PRIVADOS SIN QS'];
          const isQS = i === 1;
          return (
            <div key={i} className={`rounded border p-4 ${isQS ? 'border-blue-500/40 bg-blue-500/[0.03]' : 'border-[#1f2937] bg-[#0f1420]'}`}>
              <p className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-1" style={{ color: colors[i] }}>
                {labels[i]}
              </p>
              <p className="text-2xl font-semibold mb-3">{b ? fmt(b.menciones) : '—'}<span className="text-xs text-[#6b7280] ml-1">menciones</span></p>
              {b && (
                <RadarMetricasIA
                  size={260}
                  series={[{ key: 'one', label: labels[i], color: colors[i], highlight: isQS, values: b.promedios }]}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Radar comparado */}
      <div className="rounded border border-[#1f2937] bg-[#0f1420] p-4">
        <p className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-3">Comparativa superpuesta</p>
        {series.length > 0 && <RadarMetricasIA size={420} series={series} />}
      </div>

      {/* Tabla numérica */}
      <div className="rounded border border-[#1f2937] bg-[#0f1420] overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-4 py-2 border-b border-[#1f2937] text-[10px] uppercase tracking-wider text-[#6b7280]">
          <span>Métrica</span>
          <span className="text-right">Total</span>
          <span className="text-right">Quirónsalud</span>
          <span className="text-right">Privados sin QS</span>
        </div>
        {METRICAS_CANONICAS.map(m => (
          <div key={m.key} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-4 py-2 border-b border-[#1f2937]/50 text-sm last:border-b-0">
            <span className="flex items-center gap-2">
              <span>{m.label}</span>
              <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${m.positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {m.positive ? 'positiva' : 'negativa'}
              </span>
            </span>
            <span className="text-right tabular-nums text-[#9ca3af]">{stats ? fmtNum(stats.total.promedios[m.key]) : '—'}</span>
            <span className="text-right tabular-nums text-blue-400 font-medium">{stats ? fmtNum(stats.qs.promedios[m.key]) : '—'}</span>
            <span className="text-right tabular-nums text-[#9ca3af]">{stats ? fmtNum(stats.resto.promedios[m.key]) : '—'}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-wider text-[#4b5563] pt-2">
        <span>Fuente: MySQL · Make · Supabase · Vista: mv_dashboard_resumen_30d</span>
        <span>Filtrado: titularidad = Privado · agregado por menciones</span>
      </div>
    </div>
  );
}
