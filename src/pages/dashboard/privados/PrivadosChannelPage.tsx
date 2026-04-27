import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { IconType } from 'react-icons';
import {
  NOMBRES_GRUPOS_PRIVADOS,
  COLOR_POR_GRUPO_PRIVADO,
  type GrupoPrivado,
} from '@/lib/clasificacion';
import { AlertTriangle } from 'lucide-react';
import PerfilReputacionalIA, { type PerfilBucket } from '@/components/PerfilReputacionalIA';
import MencionesRecientes, { type MencionesConfig } from '@/components/MencionesRecientes';
import { type Canal } from '@/hooks/useCanalData';
import {
  useKpiCanalGlobal, filterByTitularidad, filterByCanal, filterByGrupo,
  aggregateKpi, toPerfilBucket, type KpiRow,
} from '@/hooks/useKpiCanal';

/* ─────────────── MENCIONES por canal (sin tocar — siguen sus tablas rápidas) ─────────────── */
const MENCIONES_BY_CHANNEL: Record<string, MencionesConfig | null> = {
  medios: {
    tabla: 'noticias_general_filtradas',
    campoFecha: 'Date',
    campoTitulo: 'Title',
    campoSnippet: 'Description',
    campoImagen: 'Image_url',
    campoMedio: 'Paper',
    campoUrl: 'url',
    campoPeligro: 'Peligro_reputacional',
    campoPresenciaMarca: 'Presencia_de_marca',
    filtros: [{ campo: 'titularidad', valor: 'Privado' }],
  },
  instagram: {
    tabla: 'ig_posts_general_filtrada',
    campoFecha: 'date_posted',
    campoTitulo: 'asunto',
    campoSnippet: 'post_content',
    campoMedio: 'user_posted',
    campoUrl: 'imput_url',
    campoPeligro: 'peligro_reputacional',
    campoPresenciaMarca: 'presencia_marca',
  },
  twitter: {
    tabla: 'x_twitter_posts_general_filtrado',
    campoFecha: 'date_posted',
    campoTitulo: 'asunto',
    campoSnippet: 'description',
    campoMedio: 'user_name',
    campoUrl: 'url',
    campoPeligro: 'peligro_reputacional',
    campoPresenciaMarca: 'presencia_marca',
  },
  tiktok: {
    tabla: 'tiktok_posts_general_filtradas',
    campoFecha: 'created_time',
    campoTitulo: 'asunto',
    campoSnippet: 'description',
    campoMedio: 'user_name',
    campoUrl: 'url',
    campoPeligro: 'peligro_reputacional',
    campoPresenciaMarca: 'presencia_marca',
  },
  facebook: {
    tabla: 'fb_posts_general_filtradas',
    campoFecha: 'date_posted',
    campoTitulo: 'ia-asunto',
    campoSnippet: 'content',
    campoMedio: 'user_name',
    campoUrl: 'url',
    campoPeligro: 'peligro_reputacional',
    campoPresenciaMarca: 'presencia_marca',
  },
  linkedin: {
    tabla: 'linkedin_gh_filtradas',
    campoFecha: 'posted_date',
    campoTitulo: 'asunto_ia',
    campoSnippet: 'texto',
    campoMedio: 'termino',
    campoUrl: 'url',
    campoPeligro: 'peligro_reputacional',
    campoPresenciaMarca: 'presencia_marca',
  },
  mybusiness: {
    tabla: 'my_business_reviews',
    campoFecha: 'iso_date',
    campoTitulo: 'tipo_review',
    campoSnippet: 'snipet',
    campoMedio: 'user_name',
    campoUrl: 'link_url',
    campoPeligro: 'peligro_reputacional',
    campoPresenciaMarca: 'presencia_marca',
    filtros: [{ campo: 'titularidad', valor: 'Privado' }],
  },
};

/** Configuración de un canal privado. Mantiene compatibilidad con los wrappers existentes. */
export type PrivadosChannelConfig = {
  key: 'medios' | 'instagram' | 'twitter' | 'tiktok' | 'facebook' | 'linkedin' | 'mybusiness';
  label: string;
  short: string;
  Icon: IconType;
  brandColor: string;
  // Compat — ya no se usan:
  view?: string;
  dateField?: string;
  preclassified?: boolean;
  termField?: string;
  groupField?: string;
  titularityField?: string;
};

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
  pctRiesgoReal: number;
  bucketTotal: PerfilBucket;
  bucketQS: PerfilBucket;
  bucketResto: PerfilBucket;
}

function fmt(n: number): string { return (n ?? 0).toLocaleString('es-ES'); }
function fmtPct(n: number, digits = 1): string { return `${n.toFixed(digits)}%`; }
function fmtFecha(d: Date): string { return format(d, "d 'de' LLL yyyy", { locale: es }); }

function buildChannelStats(rowsCanal: KpiRow[]): ChannelStats {
  const emptyBucket = (label: string): PerfilBucket => ({ label, menciones: 0, promedios: {} });
  const empty: ChannelStats = {
    filas: NOMBRES_GRUPOS_PRIVADOS.map(g => ({ grupo: g, count: 0, share: 0, barPct: 0, notaMedia: null })),
    total: 0,
    maxDate: new Date(),
    notaMediaTotal: null,
    qsCount: 0,
    qsShare: 0,
    qsRank: 0,
    pctRiesgoReal: 0,
    bucketTotal: emptyBucket('Total privados'),
    bucketQS: emptyBucket('Quirónsalud'),
    bucketResto: emptyBucket('Privados sin QS'),
  };

  const validas = rowsCanal.filter(r =>
    r.grupo_hospitalario != null &&
    NOMBRES_GRUPOS_PRIVADOS.includes(r.grupo_hospitalario as GrupoPrivado)
  );
  if (validas.length === 0) return empty;

  // Agrupar por grupo_hospitalario y agregar
  const byGrupo = new Map<GrupoPrivado, KpiRow[]>();
  NOMBRES_GRUPOS_PRIVADOS.forEach(g => byGrupo.set(g, []));
  for (const r of validas) byGrupo.get(r.grupo_hospitalario as GrupoPrivado)!.push(r);

  const aggTotal = aggregateKpi(validas);
  const total = aggTotal.menciones;
  const aggQS = aggregateKpi(byGrupo.get('Quirónsalud') ?? []);
  const aggResto = aggregateKpi(validas.filter(r => r.grupo_hospitalario !== 'Quirónsalud'));

  const aggregadosPorGrupo = new Map<GrupoPrivado, ReturnType<typeof aggregateKpi>>();
  byGrupo.forEach((rs, g) => aggregadosPorGrupo.set(g, aggregateKpi(rs)));

  const max = Math.max(...Array.from(aggregadosPorGrupo.values()).map(a => a.menciones), 1);
  const filas: FilaGrupo[] = NOMBRES_GRUPOS_PRIVADOS
    .map(grupo => {
      const a = aggregadosPorGrupo.get(grupo)!;
      return {
        grupo,
        count: a.menciones,
        share: total > 0 ? (a.menciones / total) * 100 : 0,
        barPct: (a.menciones / max) * 100,
        notaMedia: a.notaMedia,
      };
    })
    .sort((a, b) => b.count - a.count);

  const qsRow = filas.find(f => f.grupo === 'Quirónsalud');
  const qsRank = filas.findIndex(f => f.grupo === 'Quirónsalud') + 1;

  return {
    filas,
    total,
    maxDate: aggTotal.fechaMax ?? new Date(),
    notaMediaTotal: aggTotal.notaMedia,
    qsCount: qsRow?.count ?? 0,
    qsShare: qsRow?.share ?? 0,
    qsRank,
    pctRiesgoReal: aggTotal.pctRiesgoReal,
    bucketTotal: toPerfilBucket('Total privados', aggTotal),
    bucketQS:    toPerfilBucket('Quirónsalud',     aggQS),
    bucketResto: toPerfilBucket('Privados sin QS', aggResto),
  };
}

export default function PrivadosChannelPage({ cfg }: { cfg: PrivadosChannelConfig }) {
  const queryClient = useQueryClient();
  const { data: kpiRows, isLoading, isFetching, dataUpdatedAt } = useKpiCanalGlobal();

  const stats = useMemo<ChannelStats | undefined>(() => {
    if (!kpiRows) return undefined;
    const privadosCanal = filterByCanal(filterByTitularidad(kpiRows, 'Privado'), cfg.key as Canal);
    return buildChannelStats(privadosCanal);
  }, [kpiRows, cfg.key]);

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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['kpi_canal_global'] })}
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total menciones" value={stats ? fmt(stats.total) : '—'} sub="últimos 30 días" />
        <Kpi label="Quirónsalud" value={stats ? fmt(stats.qsCount) : '—'} sub={stats ? `${fmtPct(stats.qsShare)} del total` : undefined} highlight />
        <Kpi label="Posición" value={stats?.qsRank ? `#${stats.qsRank}` : '—'} sub="de 8 grupos privados" />
        <Kpi label="Riesgo real" value={stats ? fmtPct(stats.pctRiesgoReal) : '—'} sub="alto + crítico + medio-alto" />
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
                  className={`grid grid-cols-[3rem_1fr_6rem_5rem] items-center gap-4 px-4 py-3 text-sm ${isQS ? 'bg-primary/5' : ''}`}
                >
                  <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-foreground">{f.grupo}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${f.barPct}%`, backgroundColor: COLOR_POR_GRUPO_PRIVADO[f.grupo] }}
                      />
                    </div>
                  </div>
                  <span className="text-right font-mono text-sm font-semibold text-foreground">{fmt(f.count)}</span>
                  <span className="text-right font-mono text-xs text-muted-foreground">{fmtPct(f.share)}</span>
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
        <MencionesRecientes cfg={MENCIONES_BY_CHANNEL[cfg.key] as MencionesConfig} contextLabel={cfg.label} />
      )}

      {/* Footer */}
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground md:grid-cols-2">
        <div>
          <p className="font-semibold uppercase tracking-wider">Período</p>
          <p className="mt-1 text-foreground">{rangoActual}</p>
        </div>
        <div>
          <p>Fuente: Supabase · Vista materializada: v_kpi_canal_30d · Filtro: titularidad = Privado · canal = {cfg.key}</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── subcomponentes ─────────────── */

function Kpi({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
