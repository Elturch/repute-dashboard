import { useMemo } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { IconType } from 'react-icons';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { AlertTriangle } from 'lucide-react';
import PerfilReputacionalIA, { type PerfilBucket } from '@/components/PerfilReputacionalIA';
import MencionesRecientes, { type MencionesConfig } from '@/components/MencionesRecientes';

/**
 * MENCIONES por canal SERMAS.
 * Filtramos por titularidad pública (Sanidad Pública AC y variantes) usando ILIKE.
 * Para canales sociales no hay campo titularidad poblado de forma fiable, así que no se filtra.
 * Para Medios y MyBusiness sí filtramos por sector público.
 */
const MENCIONES_BY_CHANNEL: Record<string, MencionesConfig | null> = {
  noticias: {
    tabla: 'noticias_general_filtradas',
    campoFecha: 'Date',
    campoTitulo: 'Title',
    campoSnippet: 'Description',
    campoImagen: 'Image_url',
    campoMedio: 'Paper',
    campoUrl: 'url',
    campoPeligro: 'Peligro_reputacional',
    campoPresenciaMarca: 'Presencia_de_marca',
    filtros: [{ campo: 'titularidad', valor: 'Sanidad Pública AC' }],
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
  x_twitter: {
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
    filtros: [{ campo: 'titularidad', valor: 'Sanidad Pública AC' }],
  },
};

/** Configuración de un canal SERMAS. */
export type SermasChannelConfig = {
  canal: 'noticias' | 'instagram' | 'x_twitter' | 'tiktok' | 'facebook' | 'linkedin' | 'mybusiness';
  titulo: string;
  Icon: IconType;
  brandColor: string;
  /** Etiqueta corta para el contexto (ej: "Instagram", "Medios"). */
  short: string;
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
  peligro_reputacional?: number | null;
}

interface SegmentStats {
  menciones: number;
  notaMedia: number | null;
  peligro: number | null;
}

interface ChannelStats {
  total: SegmentStats;
  qs: SegmentStats;
  sinQs: SegmentStats;
  fjd: SegmentStats;
  maxDate: Date;
  bucketTotal: PerfilBucket;
  bucketQS: PerfilBucket;
  bucketSinQS: PerfilBucket;
}

function fmt(n: number): string {
  return (n ?? 0).toLocaleString('es-ES');
}
function fmtNum(n: number | null, d = 2): string {
  return n == null ? '—' : n.toFixed(d);
}
function fmtFecha(d: Date): string {
  return format(d, "d 'de' LLL yyyy", { locale: es });
}

function aggregateSegment(rows: MvRow[]): SegmentStats {
  let menciones = 0;
  let notaW = 0, notaC = 0;
  let pelW = 0, pelC = 0;
  for (const r of rows) {
    const m = Number(r.menciones) || 0;
    menciones += m;
    if (r.nota_media != null) { notaW += r.nota_media * m; notaC += m; }
    if (r.peligro_reputacional != null) { pelW += r.peligro_reputacional * m; pelC += m; }
  }
  return {
    menciones,
    notaMedia: notaC > 0 ? notaW / notaC : null,
    peligro: pelC > 0 ? pelW / pelC : null,
  };
}

function aggregateBucket(label: string, rows: MvRow[]): PerfilBucket {
  const KEYS = ['influencia','fiabilidad','afinidad','admiracion','impacto','compromiso','rechazo','preocupacion','descredito'];
  const sums: Record<string, { w: number; c: number }> = {};
  KEYS.forEach(k => sums[k] = { w: 0, c: 0 });
  let menciones = 0;
  for (const r of rows) {
    const m = Number(r.menciones) || 0;
    menciones += m;
    KEYS.forEach(k => {
      const v = (r as any)[k] as number | null | undefined;
      if (v != null) { sums[k].w += v * m; sums[k].c += m; }
    });
  }
  const promedios: Record<string, number | null> = {};
  KEYS.forEach(k => { promedios[k] = sums[k].c > 0 ? sums[k].w / sums[k].c : null; });
  return { label, menciones, promedios };
}

async function fetchChannelStats(cfg: SermasChannelConfig): Promise<ChannelStats> {
  const empty: ChannelStats = {
    total: { menciones: 0, notaMedia: null, peligro: null },
    qs: { menciones: 0, notaMedia: null, peligro: null },
    sinQs: { menciones: 0, notaMedia: null, peligro: null },
    fjd: { menciones: 0, notaMedia: null, peligro: null },
    maxDate: new Date(),
    bucketTotal: { label: 'SERMAS Total', menciones: 0, promedios: {} },
    bucketQS: { label: 'Gestión QS', menciones: 0, promedios: {} },
    bucketSinQS: { label: 'Sin QS', menciones: 0, promedios: {} },
  };

  const { data, error } = await externalSupabase
    .from('mv_dashboard_resumen_30d')
    .select('*')
    .eq('canal', cfg.canal)
    .ilike('gestion', 'SERMAS%');

  if (error) {
    console.error(`[sermas/${cfg.canal}] error mv_dashboard_resumen_30d:`, error);
    return empty;
  }

  const rows = (data ?? []) as MvRow[];
  if (rows.length === 0) return empty;

  const qsRows   = rows.filter(r => r.gestion === 'SERMAS Gestión QS');
  const sinQsRows = rows.filter(r => r.gestion !== 'SERMAS Gestión QS');
  const fjdRows  = rows.filter(r => r.grupo_hospitalario === 'Fundación Jiménez Díaz');

  let maxDate = new Date(0);
  for (const r of rows) {
    if (r.fecha_max) {
      const d = new Date(r.fecha_max);
      if (!isNaN(d.getTime()) && d > maxDate) maxDate = d;
    }
  }

  return {
    total: aggregateSegment(rows),
    qs:    aggregateSegment(qsRows),
    sinQs: aggregateSegment(sinQsRows),
    fjd:   aggregateSegment(fjdRows),
    maxDate: maxDate.getTime() === 0 ? new Date() : maxDate,
    bucketTotal: aggregateBucket('SERMAS Total', rows),
    bucketQS:    aggregateBucket('Gestión QS',   qsRows),
    bucketSinQS: aggregateBucket('Sin QS',       sinQsRows),
  };
}

/** Helper para prefetch en background. */
export async function prefetchSermasChannel(queryClient: QueryClient, cfg: SermasChannelConfig) {
  return queryClient.prefetchQuery({
    queryKey: ['sermas_channel', cfg.canal],
    queryFn: () => fetchChannelStats(cfg),
    staleTime: 30 * 60 * 1000,
  });
}

export default function SermasChannelPage({ cfg }: { cfg: SermasChannelConfig }) {
  const queryClient = useQueryClient();
  const { data: stats, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['sermas_channel', cfg.canal],
    queryFn: () => fetchChannelStats(cfg),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: 10 * 60 * 1000,
    refetchIntervalInBackground: true,
  });

  const Icon = cfg.Icon;
  const isEmpty = !!stats && stats.total.menciones === 0;

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
              SERMAS · {cfg.short}
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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['sermas_channel', cfg.canal] })}
              className="text-[10px] uppercase tracking-wider text-[#6b7280] hover:text-foreground"
            >
              🔄 Recargar
            </button>
          </div>
        </div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Icon className="h-6 w-6" style={{ color: cfg.brandColor }} />
          {cfg.titulo}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {stats && stats.total.menciones > 0 ? (
            <>
              Sistema Madrileño de Salud · Quirónsalud gestiona{' '}
              <span className="text-foreground font-medium">{fmt(stats.qs.menciones)}</span> menciones
              {stats.total.menciones > 0 && (
                <> ({((stats.qs.menciones / stats.total.menciones) * 100).toFixed(1)}% del total SERMAS)</>
              )}
              {stats.fjd.menciones > 0 && (
                <> · FJD destaca con <span className="text-amber-500 font-medium">{fmt(stats.fjd.menciones)}</span></>
              )}.
            </>
          ) : isLoading ? (
            'Cargando comparativa SERMAS Total · Gestión QS · Sin QS · FJD.'
          ) : (
            'Sin datos en la ventana actual.'
          )}
        </p>
      </div>

      {/* 4 KPI cards: Total / QS / Sin QS / FJD */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SegmentCard
          label="SERMAS Total"
          sub="todos los hospitales"
          stats={stats?.total}
          loading={isLoading}
          tone="neutral"
        />
        <SegmentCard
          label="Gestión QS"
          sub="FJD, Rey Juan Carlos, Infanta Elena, Villalba"
          stats={stats?.qs}
          loading={isLoading}
          tone="emerald"
        />
        <SegmentCard
          label="Sin QS"
          sub="resto de SERMAS"
          stats={stats?.sinQs}
          loading={isLoading}
          tone="blue"
        />
        <SegmentCard
          label="FJD"
          sub="Fundación Jiménez Díaz · joya de la corona"
          stats={stats?.fjd}
          loading={isLoading}
          tone="amber"
        />
      </div>

      {isEmpty && !isLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          <span>Sin datos para SERMAS en este canal · scraper en mantenimiento o sin cobertura</span>
        </div>
      )}

      {/* Perfil reputacional IA — comparativa Gestión QS vs Sin QS (con SERMAS Total como referencia) */}
      {stats && stats.total.menciones > 0 && (
        <PerfilReputacionalIA
          contextLabel={`SERMAS · ${cfg.short}`}
          highlightLabel="Gestión QS"
          total={stats.bucketTotal}
          highlight={stats.bucketQS}
          resto={stats.bucketSinQS}
          highlightColor="#10b981"
        />
      )}

      {/* Menciones recientes */}
      {stats && MENCIONES_BY_CHANNEL[cfg.canal] && (
        <MencionesRecientes
          cfg={MENCIONES_BY_CHANNEL[cfg.canal] as MencionesConfig}
          contextLabel={cfg.short}
        />
      )}

      {/* Footer */}
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground md:grid-cols-2">
        <div>
          <p className="font-semibold uppercase tracking-wider">Período</p>
          <p className="mt-1 text-foreground">{rangoActual}</p>
        </div>
        <div>
          <p>Fuente: MySQL · Make · Supabase · Vista: mv_dashboard_resumen_30d · Filtro: gestion ILIKE 'SERMAS%'</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── subcomponentes ─────────────── */

const TONE_CLASSES: Record<string, { border: string; bg: string; text: string; accent: string }> = {
  neutral: { border: 'border-border', bg: 'bg-card', text: 'text-foreground', accent: 'text-muted-foreground' },
  emerald: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/5', text: 'text-emerald-600 dark:text-emerald-400', accent: 'text-emerald-700 dark:text-emerald-300' },
  blue:    { border: 'border-blue-500/40',    bg: 'bg-blue-500/5',    text: 'text-blue-600 dark:text-blue-400',       accent: 'text-blue-700 dark:text-blue-300' },
  amber:   { border: 'border-amber-500/40',   bg: 'bg-amber-500/5',   text: 'text-amber-600 dark:text-amber-400',     accent: 'text-amber-700 dark:text-amber-300' },
};

function SegmentCard({
  label, sub, stats, loading, tone,
}: {
  label: string;
  sub?: string;
  stats?: SegmentStats;
  loading: boolean;
  tone: 'neutral' | 'emerald' | 'blue' | 'amber';
}) {
  const c = TONE_CLASSES[tone];
  return (
    <div className={`rounded-lg border p-4 ${c.border} ${c.bg}`}>
      <p className={`text-xs uppercase tracking-wider font-semibold ${c.accent}`}>{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
      {loading ? (
        <div className="mt-3 h-9 w-20 animate-pulse rounded bg-muted" />
      ) : (
        <p className={`mt-2 text-3xl font-bold tabular-nums ${c.text}`}>
          {stats ? fmt(stats.menciones) : '—'}
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="uppercase tracking-wider text-muted-foreground">Nota IA</p>
          <p className="mt-0.5 tabular-nums text-foreground">{stats ? fmtNum(stats.notaMedia) : '—'}</p>
        </div>
        <div>
          <p className="uppercase tracking-wider text-muted-foreground">Peligro</p>
          <p className="mt-0.5 tabular-nums text-foreground">{stats ? fmtNum(stats.peligro) : '—'}</p>
        </div>
      </div>
    </div>
  );
}