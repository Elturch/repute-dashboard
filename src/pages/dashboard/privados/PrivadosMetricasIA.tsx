import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { NOMBRES_GRUPOS_PRIVADOS, type GrupoPrivado } from '@/lib/clasificacion';

interface MvRow {
  canal: string;
  titularidad: string | null;
  grupo_hospitalario: string | null;
  menciones: number;
  preocupacion: number | null;
  rechazo: number | null;
  descredito: number | null;
  afinidad: number | null;
  fiabilidad: number | null;
  admiracion: number | null;
  impacto: number | null;
  influencia: number | null;
  compromiso: number | null;
  fecha_max: string | null;
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

interface Bucket { label: string; menciones: number; promedios: Record<string, number | null> }

function fmt(n: number) { return n.toLocaleString('es-ES'); }
function fmtCompact(n: number) { return n >= 1000 ? `${(n/1000).toFixed(1)}k` : fmt(n); }
function fmtNum(n: number | null, d = 2): string { return n == null ? '—' : n.toFixed(d); }
function fmtFecha(d: Date) { return format(d, 'd MMM yyyy', { locale: es }); }

function aggregate(rows: MvRow[], label: string): Bucket {
  const sums: Record<string, { weighted: number; count: number }> = {};
  ALL_METRICAS.forEach(m => sums[m.key] = { weighted: 0, count: 0 });
  let total = 0;
  for (const r of rows) {
    total += r.menciones;
    ALL_METRICAS.forEach(m => {
      const v = (r as any)[m.key] as number | null;
      if (v != null) {
        sums[m.key].weighted += v * r.menciones;
        sums[m.key].count += r.menciones;
      }
    });
  }
  const promedios: Record<string, number | null> = {};
  ALL_METRICAS.forEach(m => {
    promedios[m.key] = sums[m.key].count > 0 ? sums[m.key].weighted / sums[m.key].count : null;
  });
  return { label, menciones: total, promedios };
}

async function fetchPrivadosMetricas() {
  const { data, error } = await externalSupabase
    .from('mv_dashboard_resumen_30d')
    .select('*')
    .eq('titularidad', 'Privado');
  if (error) {
    console.error(error);
    const empty: Bucket = { label: '', menciones: 0, promedios: {} };
    return { total: empty, qs: empty, resto: empty, maxDate: new Date(), minDate: new Date() };
  }
  const rows = (data ?? []) as MvRow[];
  const validas = rows.filter(r => r.grupo_hospitalario && NOMBRES_GRUPOS_PRIVADOS.includes(r.grupo_hospitalario as GrupoPrivado));
  let maxDate = new Date(0);
  for (const r of validas) {
    if (r.fecha_max) {
      const d = new Date(r.fecha_max);
      if (d > maxDate) maxDate = d;
    }
  }
  const minDate = new Date(maxDate);
  minDate.setDate(minDate.getDate() - 30);
  return {
    total: aggregate(validas, 'Total privados'),
    qs: aggregate(validas.filter(r => r.grupo_hospitalario === 'Quirónsalud'), 'Quirónsalud'),
    resto: aggregate(validas.filter(r => r.grupo_hospitalario !== 'Quirónsalud'), 'Privados sin QS'),
    maxDate: maxDate.getTime() === 0 ? new Date() : maxDate,
    minDate,
  };
}

function statusFor(metric: MetricaDef, qs: number | null, resto: number | null): { icon: string; tone: 'up' | 'flat' | 'down'; diff: number | null } {
  if (qs == null || resto == null) return { icon: '—', tone: 'flat', diff: null };
  const raw = qs - resto;
  const adjusted = metric.positive ? raw : -raw;
  const threshold = 0.3;
  if (adjusted > threshold) return { icon: '★', tone: 'up', diff: raw };
  if (adjusted < -threshold) return { icon: '⚠', tone: 'down', diff: raw };
  return { icon: '●', tone: 'flat', diff: raw };
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

  const summary = (() => {
    if (!stats) return { lidera: 0, enlinea: 0, atencion: 0, total: ALL_METRICAS.length };
    let lidera = 0, enlinea = 0, atencion = 0;
    for (const m of ALL_METRICAS) {
      const s = statusFor(m, stats.qs.promedios[m.key], stats.resto.promedios[m.key]);
      if (s.tone === 'up') lidera++;
      else if (s.tone === 'down') atencion++;
      else enlinea++;
    }
    return { lidera, enlinea, atencion, total: ALL_METRICAS.length };
  })();

  const rangoActual = stats ? `${fmtFecha(stats.minDate)} — ${fmtFecha(stats.maxDate)}` : '—';

  return (
    <div className="p-6 space-y-6 bg-[#0b0f17] min-h-screen text-white">
      {/* Hero */}
      <div className="flex items-start justify-between gap-4 flex-wrap border-b border-[#1f2937] pb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280] mb-2">
            Perfil reputacional · Sanidad privada · IA
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">9 dimensiones</h1>
          <p className="text-sm text-[#9ca3af] mt-1">{rangoActual}</p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching ? (
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Actualizando
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider text-[#6b7280]">
              auto-refresh 10 min · última {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
          )}
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['privados_metricas'] })}
            className="text-[10px] uppercase tracking-wider text-[#6b7280] hover:text-white ml-3"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Titular narrativo */}
      <div className="rounded border border-[#1f2937] bg-[#0f1420] p-5">
        <p className="text-lg leading-relaxed text-[#e5e7eb]">
          Quirónsalud lidera en{' '}
          <span className="text-emerald-400 font-semibold">{summary.lidera}</span> de{' '}
          <span className="text-white font-semibold">{summary.total}</span> dimensiones
          {summary.atencion > 0 && (
            <>
              {' '}— por debajo del sector en{' '}
              <span className="text-amber-400 font-semibold">{summary.atencion}</span>
            </>
          )}.
        </p>
      </div>

      {/* Cabecera de columnas con menciones */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-4 py-3 border-b border-[#1f2937]">
        <p className="text-[10px] uppercase tracking-wider text-[#6b7280]">Métrica</p>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-[#6b7280]">Total</p>
          <p className="text-sm tabular-nums text-[#9ca3af]">
            {stats ? fmtCompact(stats.total.menciones) : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-blue-400">Quirónsalud</p>
          <p className="text-sm tabular-nums text-blue-400 font-medium">
            {stats ? fmtCompact(stats.qs.menciones) : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-[#6b7280]">Sin QS</p>
          <p className="text-sm tabular-nums text-[#9ca3af]">
            {stats ? fmtCompact(stats.resto.menciones) : '—'}
          </p>
        </div>
      </div>

      {/* Bloques de métricas */}
      <div className="space-y-6">
        <MetricsBlock title="Dimensiones positivas" metricas={POSITIVAS} stats={stats} />
        <MetricsBlock title="Dimensiones negativas" metricas={NEGATIVAS} stats={stats} />
      </div>

      {/* Leyenda */}
      <div className="pt-4 border-t border-[#1f2937] space-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase tracking-wider text-[#6b7280]">
          <span><span className="text-emerald-400">★</span> Quirónsalud lidera</span>
          <span><span className="text-[#6b7280]">●</span> En línea con el sector</span>
          <span><span className="text-amber-400">⚠</span> Por debajo del sector</span>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-[#4b5563]">
          Fuente: mv_dashboard_resumen_30d · agregado por menciones
        </p>
      </div>
    </div>
  );
}

function MetricsBlock({ title, metricas, stats }: { title: string; metricas: MetricaDef[]; stats: any }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-2 px-4">{title}</p>
      <div className="rounded border border-[#1f2937] bg-[#0f1420] overflow-hidden">
        {metricas.map((m, i) => {
          const total = stats?.total.promedios[m.key] ?? null;
          const qs = stats?.qs.promedios[m.key] ?? null;
          const resto = stats?.resto.promedios[m.key] ?? null;
          const status = stats ? statusFor(m, qs, resto) : { icon: '—', tone: 'flat' as const, diff: null };
          const iconColor = status.tone === 'up' ? '#10b981' : status.tone === 'down' ? '#f59e0b' : '#6b7280';
          return (
            <div
              key={m.key}
              className={`grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-4 py-3 items-center text-sm ${i < metricas.length - 1 ? 'border-b border-[#1f2937]/50' : ''}`}
            >
              <span className="text-[#e5e7eb]">{m.label}</span>
              <span className="text-right tabular-nums text-[#9ca3af]">{fmtNum(total)}</span>
              <span className="text-right tabular-nums text-blue-400 font-medium flex items-center justify-end gap-2">
                <span>{fmtNum(qs)}</span>
                <span style={{ color: iconColor }} className="text-base leading-none w-4 inline-block">{status.icon}</span>
              </span>
              <span className="text-right tabular-nums text-[#9ca3af]">{fmtNum(resto)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
