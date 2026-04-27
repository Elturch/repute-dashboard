import { useMemo } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { IconType } from 'react-icons';
import { externalSupabase } from '@/integrations/external-supabase/client';
import {
  NOMBRES_GRUPOS_PRIVADOS,
  COLOR_POR_GRUPO_PRIVADO,
  type GrupoPrivado,
} from '@/lib/clasificacion';
import { AlertTriangle } from 'lucide-react';
import PerfilReputacionalIA, { type PerfilBucket } from '@/components/PerfilReputacionalIA';
import MencionesRecientes, { type MencionesConfig } from '@/components/MencionesRecientes';

const MENCIONES_BY_CHANNEL: Record<PrivadosChannelConfig['key'], MencionesConfig | null> = {
  medios: {
    tabla: 'noticias_general_filtradas',
    campoFecha: 'Date',
    campoTitulo: 'Title',
    campoSnippet: 'Description',
    campoImagen: 'Image_url',
    campoMedio: 'Paper',
    campoUrl: 'url',
    campoPeligro: 'Peligro_reputacional',
    filtros: [{ campo: 'titularidad', valor: 'Privado' }],
  },
  instagram: null,
  twitter: null,
  tiktok: null,
  facebook: null,
  linkedin: null,
  mybusiness: null,
};

/** Configuración de un canal privado. Mantiene compatibilidad con los wrappers existentes. */
export type PrivadosChannelConfig = {
  key: 'medios' | 'instagram' | 'twitter' | 'tiktok' | 'facebook' | 'linkedin' | 'mybusiness';
  label: string;
  short: string;
  Icon: IconType;
  brandColor: string;
  // Las siguientes ya no se usan pero se mantienen para no romper los wrappers:
  view?: string;
  dateField?: string;
  preclassified?: boolean;
  termField?: string;
  groupField?: string;
  titularityField?: string;
};

interface MvRow {
  canal: string;
  titularidad: string | null;
  grupo_hospitalario: string | null;
  gestion: string | null;
  menciones: number;
  nota_media: number | null;
  fecha_max: string | null;
  influencia?: number | null;
  fiabilidad?: number | null;
  afinidad?: number | null;
  admiracion?: number | null;
  impacto?: number | null;
  compromiso?: number | null;
  rechazo?: number | null;
  preocupacion?: number | null;
  descredito?: number | null;
}

interface FilaGrupo {
  grupo: GrupoPrivado;
  count: number;
  share: number;
  barPct: number;
  notaMedia: number | null;
}

interface ChannelStats {
  filas: FilaGrupo[];
  total: number;
  maxDate: Date;
  notaMediaTotal: number | null;
  qsCount: number;
  qsShare: number;
  qsRank: number;
  bucketTotal: PerfilBucket;
  bucketQS: PerfilBucket;
  bucketResto: PerfilBucket;
}

function fmt(n: number): string {
  return (n ?? 0).toLocaleString('es-ES');
}
function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}
function fmtFecha(d: Date): string {
  return format(d, "d 'de' LLL yyyy", { locale: es });
}

async function fetchChannelStats(cfg: PrivadosChannelConfig): Promise<ChannelStats> {
  const { data, error } = await externalSupabase
    .from('mv_dashboard_resumen_30d')
    .select('*')
    .eq('canal', cfg.key)
    .eq('titularidad', 'Privado');

  const emptyBucket = (label: string): PerfilBucket => ({ label, menciones: 0, promedios: {} });
  const empty: ChannelStats = {
    filas: NOMBRES_GRUPOS_PRIVADOS.map(g => ({ grupo: g, count: 0, share: 0, barPct: 0, notaMedia: null })),
    total: 0,
    maxDate: new Date(),
    notaMediaTotal: null,
    qsCount: 0,
    qsShare: 0,
    qsRank: 0,
    bucketTotal: emptyBucket('Total privados'),
    bucketQS: emptyBucket('Quirónsalud'),
    bucketResto: emptyBucket('Privados sin QS'),
  };

  if (error) {
    console.error(`[${cfg.key}] error mv_dashboard_resumen_30d:`, error);
    return empty;
  }

  const rows = (data ?? []) as MvRow[];

  const counts = new Map<GrupoPrivado, { menciones: number; notaWeighted: number; notaCount: number }>();
  NOMBRES_GRUPOS_PRIVADOS.forEach(g => counts.set(g, { menciones: 0, notaWeighted: 0, notaCount: 0 }));

  let total = 0;
  let totalNotaWeighted = 0;
  let totalNotaCount = 0;
  let maxDate = new Date(0);

  for (const r of rows) {
    if (!r.grupo_hospitalario) continue;
    const g = r.grupo_hospitalario as GrupoPrivado;
    if (!NOMBRES_GRUPOS_PRIVADOS.includes(g)) continue;
    const cur = counts.get(g)!;
    const m = Number(r.menciones) || 0;
    cur.menciones += m;
    if (r.nota_media != null) {
      cur.notaWeighted += r.nota_media * m;
      cur.notaCount += m;
      totalNotaWeighted += r.nota_media * m;
      totalNotaCount += m;
    }
    counts.set(g, cur);
    total += m;
    if (r.fecha_max) {
      const d = new Date(r.fecha_max);
      if (!isNaN(d.getTime()) && d > maxDate) maxDate = d;
    }
  }

  const max = Math.max(...Array.from(counts.values()).map(v => v.menciones), 1);
  const filas: FilaGrupo[] = NOMBRES_GRUPOS_PRIVADOS
    .map(grupo => {
      const c = counts.get(grupo)!;
      return {
        grupo,
        count: c.menciones,
        share: total > 0 ? (c.menciones / total) * 100 : 0,
        barPct: (c.menciones / max) * 100,
        notaMedia: c.notaCount > 0 ? c.notaWeighted / c.notaCount : null,
      };
    })
    .sort((a, b) => b.count - a.count);

  const qsRow = filas.find(f => f.grupo === 'Quirónsalud');
  const qsRank = filas.findIndex(f => f.grupo === 'Quirónsalud') + 1;

  // Buckets para el scorecard reputacional IA
  function aggregateBucket(label: string, rowsBucket: MvRow[]): PerfilBucket {
    const METRIC_KEYS = ['influencia','fiabilidad','afinidad','admiracion','impacto','compromiso','rechazo','preocupacion','descredito'];
    const sums: Record<string, { weighted: number; count: number }> = {};
    METRIC_KEYS.forEach(k => sums[k] = { weighted: 0, count: 0 });
    let menciones = 0;
    for (const r of rowsBucket) {
      const m = Number(r.menciones) || 0;
      menciones += m;
      METRIC_KEYS.forEach(k => {
        const v = (r as any)[k] as number | null | undefined;
        if (v != null) {
          sums[k].weighted += v * m;
          sums[k].count += m;
        }
      });
    }
    const promedios: Record<string, number | null> = {};
    METRIC_KEYS.forEach(k => {
      promedios[k] = sums[k].count > 0 ? sums[k].weighted / sums[k].count : null;
    });
    return { label, menciones, promedios };
  }

  const validas = rows.filter(r => r.grupo_hospitalario && NOMBRES_GRUPOS_PRIVADOS.includes(r.grupo_hospitalario as GrupoPrivado));
  const bucketTotal = aggregateBucket('Total privados', validas);
  const bucketQS = aggregateBucket('Quirónsalud', validas.filter(r => r.grupo_hospitalario === 'Quirónsalud'));
  const bucketResto = aggregateBucket('Privados sin QS', validas.filter(r => r.grupo_hospitalario !== 'Quirónsalud'));

  return {
    filas,
    total,
    maxDate: maxDate.getTime() === 0 ? new Date() : maxDate,
    notaMediaTotal: totalNotaCount > 0 ? totalNotaWeighted / totalNotaCount : null,
    qsCount: qsRow?.count ?? 0,
    qsShare: qsRow?.share ?? 0,
    qsRank,
    bucketTotal,
    bucketQS,
    bucketResto,
  };
}

/** Helper externo para que DashboardLayout pueda hacer prefetch en background. */
export async function prefetchPrivadosChannel(queryClient: QueryClient, cfg: PrivadosChannelConfig) {
  return queryClient.prefetchQuery({
    queryKey: ['privados_channel', cfg.key],
    queryFn: () => fetchChannelStats(cfg),
    staleTime: 30 * 60 * 1000,
  });
}

export default function PrivadosChannelPage({ cfg }: { cfg: PrivadosChannelConfig }) {
  const queryClient = useQueryClient();
  const { data: stats, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['privados_channel', cfg.key],
    queryFn: () => fetchChannelStats(cfg),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: 10 * 60 * 1000,
    refetchIntervalInBackground: true,
  });

  const Icon = cfg.Icon;
  const isEmpty = !!stats && stats.total === 0;

  const cutoff30 = useMemo(() => {
    const d = stats?.maxDate ?? new Date();
    const c = new Date(d);
    c.setDate(c.getDate() - 30);
    return c;
  }, [stats?.maxDate]);
  const rangoActual = stats ? `${fmtFecha(cutoff30)} — ${fmtFecha(stats.maxDate)}` : '—';

  return (
    <div className="space-y-6 p-6">
      {/* Hero */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" style={{ color: cfg.brandColor }} />
              Sanidad privada · {cfg.short}
            </span>
            <span>·</span>
            <span>{rangoActual}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4 text-[10px] uppercase tracking-wider">
              {isFetching ? (
                <span className="text-[#3b82f6] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
                  Actualizando
                </span>
              ) : (
                <span className="text-[#6b7280]">
                  Auto-refresh 10 min · última: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['privados_channel', cfg.key] });
              }}
              className="text-[10px] uppercase tracking-wider text-[#6b7280] hover:text-foreground"
            >
              🔄 Recargar
            </button>
          </div>
        </div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Icon className="h-6 w-6" style={{ color: cfg.brandColor }} />
          Menciones en {cfg.label}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {stats && stats.total > 0 && stats.qsCount > 0 ? (
            <>
              Quirónsalud {stats.qsRank === 1 ? 'lidera' : `está en #${stats.qsRank}`} con{' '}
              {fmt(stats.qsCount)} menciones ({fmtPct(stats.qsShare)} del total).
            </>
          ) : isLoading ? (
            'Cargando análisis comparativo de los 8 grupos hospitalarios privados.'
          ) : (
            'Sin datos en la ventana actual.'
          )}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Kpi
          label="Total menciones"
          value={stats ? fmt(stats.total) : '—'}
          sub="últimos 30 días"
        />
        <Kpi
          label="Quirónsalud"
          value={stats ? fmt(stats.qsCount) : '—'}
          sub={stats ? `${fmtPct(stats.qsShare)} del total` : undefined}
          highlight
        />
        <Kpi
          label="Posición"
          value={stats?.qsRank ? `#${stats.qsRank}` : '—'}
          sub="de 8 grupos privados"
        />
      </div>

      {/* League table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="grid grid-cols-[3rem_1fr_6rem_5rem] items-center gap-4 border-b border-border px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span>#</span>
          <span>Grupo hospitalario</span>
          <span className="text-right">Menciones</span>
          <span className="text-right">Cuota</span>
        </div>

        {isLoading || !stats ? (
          <div className="space-y-2 p-4">
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {stats.filas.map((f, i) => {
              const isQS = f.grupo === 'Quirónsalud';
              return (
                <li
                  key={f.grupo}
                  className={`grid grid-cols-[3rem_1fr_6rem_5rem] items-center gap-4 px-4 py-3 text-sm ${
                    isQS ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-foreground">{f.grupo}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${f.barPct}%`,
                          backgroundColor: COLOR_POR_GRUPO_PRIVADO[f.grupo],
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-right font-mono text-sm font-semibold text-foreground">
                    {fmt(f.count)}
                  </span>
                  <span className="text-right font-mono text-xs text-muted-foreground">
                    {fmtPct(f.share)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {isEmpty && !isLoading && (
          <div className="flex items-center gap-2 border-t border-border px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span>Scraper en mantenimiento — pendiente de arreglo</span>
          </div>
        )}
      </div>

      {/* Perfil reputacional IA */}
      {stats && (
        <PerfilReputacionalIA
          contextLabel={`en ${cfg.label}`}
          highlightLabel="Quirónsalud"
          total={stats.bucketTotal}
          highlight={stats.bucketQS}
          resto={stats.bucketResto}
          highlightColor={cfg.brandColor}
        />
      )}

      {/* Menciones recientes (lazy-load) */}
      {stats && MENCIONES_BY_CHANNEL[cfg.key] && (
        <MencionesRecientes
          cfg={MENCIONES_BY_CHANNEL[cfg.key] as MencionesConfig}
          contextLabel={cfg.label}
        />
      )}

      {/* Footer */}
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground md:grid-cols-2">
        <div>
          <p className="font-semibold uppercase tracking-wider">Período</p>
          <p className="mt-1 text-foreground">{rangoActual}</p>
        </div>
        <div>
          <p>Fuente: MySQL · Make · Supabase · Vista: mv_dashboard_resumen_30d</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── subcomponentes ─────────────── */

function Kpi({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
