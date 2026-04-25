import { useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { useKeywordsClassification } from '@/hooks/useKeywordsClassification';
import { NOMBRES_GRUPOS_PRIVADOS, COLOR_POR_GRUPO_PRIVADO, type GrupoPrivado } from '@/lib/clasificacion';
import { AlertTriangle, Wrench } from 'lucide-react';
import { SiInstagram, SiTiktok, SiFacebook, SiLinkedin, SiGoogle } from 'react-icons/si';
import { FaXTwitter } from 'react-icons/fa6';
import { BiNews } from 'react-icons/bi';
import type { IconType } from 'react-icons';

const PAGE_SIZE = 1000;
const MAX_PAGES = 8;

type ChannelKey = 'medios' | 'instagram' | 'twitter' | 'tiktok' | 'facebook' | 'linkedin' | 'mybusiness';

interface ChannelConfig {
  key: ChannelKey;
  label: string;
  short: string;
  Icon: IconType;
  brandColor: string;
  view: string;
  dateField: string;
  preclassified: boolean;
  termField?: string;
  groupField?: string;
  titularityField?: string;
}

const CHANNELS: ChannelConfig[] = [
  { key: 'medios', label: 'Medios de comunicación', short: 'Medios',
    Icon: BiNews, brandColor: '#E5E7EB',
    view: 'noticias_general_filtradas', dateField: 'Date',
    preclassified: true, groupField: 'Grupo_hospitalario', titularityField: 'titularidad' },
  { key: 'instagram', label: 'Instagram', short: 'Instagram',
    Icon: SiInstagram, brandColor: '#E4405F',
    view: 'ig_posts_general_filtrada', dateField: 'date_posted',
    preclassified: false, termField: 'termino' },
  { key: 'twitter', label: 'X (Twitter)', short: 'X',
    Icon: FaXTwitter, brandColor: '#FFFFFF',
    view: 'x_twitter_posts_general_filtrado', dateField: 'date_posted',
    preclassified: false, termField: 'header' },
  { key: 'tiktok', label: 'TikTok', short: 'TikTok',
    Icon: SiTiktok, brandColor: '#FFFFFF',
    view: 'tiktok_posts_general_filtradas', dateField: 'created_time',
    preclassified: false, termField: 'termino' },
  { key: 'facebook', label: 'Facebook', short: 'Facebook',
    Icon: SiFacebook, brandColor: '#1877F2',
    view: 'fb_posts_general_filtradas', dateField: 'date_posted',
    preclassified: false, termField: 'termino' },
  { key: 'linkedin', label: 'LinkedIn', short: 'LinkedIn',
    Icon: SiLinkedin, brandColor: '#0A66C2',
    view: 'linkedin_gh_filtradas', dateField: 'posted_date',
    preclassified: false, termField: 'termino' },
  { key: 'mybusiness', label: 'Google My Business', short: 'My Business',
    Icon: SiGoogle, brandColor: '#4285F4',
    view: 'my_business_reviews', dateField: 'iso_date',
    preclassified: true, groupField: 'grupo_hospitalario', titularityField: 'titularidad' },
];

function fmt(n: number): string { return n.toLocaleString('es-ES'); }
function fmtPct(n: number, d = 1): string { return `${n.toFixed(d)}%`; }
function fmtFecha(d: Date): string { return format(d, "d MMM yyyy", { locale: es }); }

interface ChannelStats {
  filas: { grupo: GrupoPrivado; count: number; share: number; barPct: number }[];
  total: number;
  truncated: boolean;
  rowsLeidas: number;
}

async function fetchChannelStats(
  cfg: ChannelConfig,
  fromISO: string,
  clasificar: ((t: string | null | undefined) => any) | undefined,
): Promise<ChannelStats> {
  const counts = new Map<GrupoPrivado, number>();
  NOMBRES_GRUPOS_PRIVADOS.forEach(g => counts.set(g, 0));
  let total = 0;
  let totalRowsLeidas = 0;
  let truncated = false;

  const selectFields = cfg.preclassified
    ? [cfg.groupField!, cfg.dateField, cfg.titularityField].filter(Boolean).join(', ')
    : [cfg.termField!, cfg.dateField].join(', ');

  for (let page = 0; page < MAX_PAGES; page++) {
    let q: any = externalSupabase.from(cfg.view).select(selectFields).gte(cfg.dateField, fromISO);
    if (cfg.preclassified && cfg.titularityField) q = q.eq(cfg.titularityField, 'Privado');
    q = q.order(cfg.dateField, { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    const { data, error } = await q;
    if (error) {
      console.error(`[${cfg.key}] error página ${page}:`, error);
      break;
    }
    const chunk = (data ?? []) as Record<string, any>[];
    totalRowsLeidas += chunk.length;
    for (const row of chunk) {
      let grupo: GrupoPrivado | null = null;
      if (cfg.preclassified) {
        const raw = row[cfg.groupField!];
        if (raw && NOMBRES_GRUPOS_PRIVADOS.includes(raw as GrupoPrivado)) grupo = raw as GrupoPrivado;
      } else if (clasificar) {
        const c = clasificar(row[cfg.termField!]);
        if (c && c.bloque === 'privados' && c.grupoHospitalario) {
          const g = c.grupoHospitalario as GrupoPrivado;
          if (NOMBRES_GRUPOS_PRIVADOS.includes(g)) grupo = g;
        }
      }
      if (grupo) {
        counts.set(grupo, (counts.get(grupo) ?? 0) + 1);
        total++;
      }
    }
    if (chunk.length < PAGE_SIZE)
      return { filas: buildFilas(counts, total), total, truncated: false, rowsLeidas: totalRowsLeidas };
    if (page === MAX_PAGES - 1) truncated = true;
  }
  return { filas: buildFilas(counts, total), total, truncated, rowsLeidas: totalRowsLeidas };
}

function buildFilas(counts: Map<GrupoPrivado, number>, total: number) {
  const max = Math.max(...Array.from(counts.values()), 1);
  return NOMBRES_GRUPOS_PRIVADOS
    .map(grupo => {
      const count = counts.get(grupo) ?? 0;
      return { grupo, count, share: total > 0 ? (count / total) * 100 : 0, barPct: (count / max) * 100 };
    })
    .sort((a, b) => b.count - a.count);
}

function useChannelStats(cfg: ChannelConfig, fromISO: string, clasificar?: any) {
  return useQuery({
    queryKey: ['privados_channel', cfg.key, fromISO],
    staleTime: 5 * 60 * 1000,
    enabled: cfg.preclassified || !!clasificar,
    queryFn: () => fetchChannelStats(cfg, fromISO, clasificar),
  });
}

/* ─────────────── Page ─────────────── */

export default function PrivadosNoticias() {
  const { data: kw } = useKeywordsClassification();
  const now = useMemo(() => new Date(), []);
  const cutoff30 = useMemo(() => subDays(now, 30), [now]);
  const fromISO = cutoff30.toISOString();
  const rangoActual = `${fmtFecha(cutoff30)} — ${fmtFecha(now)}`;

  const q0 = useChannelStats(CHANNELS[0], fromISO, kw?.clasificar);
  const q1 = useChannelStats(CHANNELS[1], fromISO, kw?.clasificar);
  const q2 = useChannelStats(CHANNELS[2], fromISO, kw?.clasificar);
  const q3 = useChannelStats(CHANNELS[3], fromISO, kw?.clasificar);
  const q4 = useChannelStats(CHANNELS[4], fromISO, kw?.clasificar);
  const q5 = useChannelStats(CHANNELS[5], fromISO, kw?.clasificar);
  const q6 = useChannelStats(CHANNELS[6], fromISO, kw?.clasificar);
  const queries: UseQueryResult<ChannelStats>[] = [q0, q1, q2, q3, q4, q5, q6];

  return (
    <div className="space-y-6 p-6">
      {/* Hero */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span>Sanidad privada · 8 grupos</span>
          <span>·</span>
          <span>{rangoActual}</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Comparativa por canal</h1>
      </div>

      {/* KPI strip: 7 canales */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {CHANNELS.map((cfg, i) => (
          <KpiCell
            key={cfg.key}
            cfg={cfg}
            stats={queries[i].data}
            isLoading={queries[i].isLoading}
            isLast={i === CHANNELS.length - 1}
          />
        ))}
      </div>

      {/* Secciones por canal */}
      <div className="space-y-6">
        {CHANNELS.map((cfg, i) => (
          <ChannelSection
            key={cfg.key}
            cfg={cfg}
            stats={queries[i].data}
            isLoading={queries[i].isLoading}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <span>Fuente: MySQL · Make · Supabase · Filtrado: titularidad = Privado</span>
        <span>{rangoActual}</span>
      </div>
    </div>
  );
}

/* ─────────────── KpiCell ─────────────── */

function KpiCell({ cfg, stats, isLoading }: {
  cfg: ChannelConfig; stats?: ChannelStats; isLoading: boolean; isLast: boolean;
}) {
  const { Icon } = cfg;
  const qs = stats?.filas.find(f => f.grupo === 'Quirónsalud');
  const qsRank = stats ? stats.filas.findIndex(f => f.grupo === 'Quirónsalud') + 1 : 0;
  const isEmpty = !!stats && stats.total === 0;

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4" style={{ color: cfg.brandColor }} aria-hidden />
        <span className="truncate">{cfg.short}</span>
      </div>
      {isLoading ? (
        <div className="mt-2 h-7 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-2 text-2xl font-bold text-foreground">{fmt(stats?.total ?? 0)}</p>
      )}
      {isEmpty ? (
        <div className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
          <Wrench className="h-3 w-3" /> Mantenim.
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-1 text-xs">
          <span className="font-mono font-semibold text-primary">{qs ? fmt(qs.count) : '—'}</span>
          <span className="text-muted-foreground">QS</span>
          <span className="ml-auto font-mono text-muted-foreground">
            {stats && stats.total > 0 ? `#${qsRank}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─────────────── ChannelSection ─────────────── */

function ChannelSection({ cfg, stats, isLoading }: {
  cfg: ChannelConfig; stats?: ChannelStats; isLoading: boolean;
}) {
  const { Icon } = cfg;
  const isEmpty = !!stats && stats.total === 0;
  const qsRow = stats?.filas.find(f => f.grupo === 'Quirónsalud');
  const qsRank = stats ? stats.filas.findIndex(f => f.grupo === 'Quirónsalud') + 1 : 0;

  return (
    <section className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
            <Icon className="h-5 w-5" style={{ color: cfg.brandColor }} aria-hidden />
          </div>
          <h2 className="text-base font-semibold text-foreground">{cfg.label}</h2>
          {isLoading && <span className="text-xs text-muted-foreground">Cargando...</span>}
          {stats?.truncated && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="h-3 w-3" /> Truncado
            </span>
          )}
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div className="text-right">
            <p className="uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="font-mono text-sm font-semibold text-foreground">{stats ? fmt(stats.total) : '—'}</p>
          </div>
          <div className="text-right">
            <p className="uppercase tracking-wider text-muted-foreground">QS</p>
            <p className="font-mono text-sm font-semibold text-primary">
              {qsRow ? fmt(qsRow.count) : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="uppercase tracking-wider text-muted-foreground">Posición</p>
            <p className="font-mono text-sm font-semibold text-foreground">
              {stats && stats.total > 0 ? `#${qsRank}` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <ul className="space-y-2">
          {(stats?.filas ?? NOMBRES_GRUPOS_PRIVADOS.map(g => ({ grupo: g, count: 0, share: 0, barPct: 0 })))
            .map((f, i) => {
              const isQS = f.grupo === 'Quirónsalud';
              return (
                <li
                  key={f.grupo}
                  className={`grid grid-cols-[2rem_minmax(0,9rem)_1fr_4rem_3.5rem] items-center gap-3 text-sm ${
                    isQS ? 'rounded bg-primary/5 px-2 py-1' : ''
                  }`}
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={`truncate ${isQS ? 'font-semibold text-primary' : 'text-foreground'}`}>
                    {f.grupo}
                  </span>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${f.barPct}%`,
                        backgroundColor: COLOR_POR_GRUPO_PRIVADO[f.grupo],
                      }}
                    />
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

        {isEmpty && (
          <div className="mt-4 rounded-md border border-dashed border-amber-400/40 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="inline-flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5" />
              Scraper en mantenimiento — pendiente de arreglo
            </div>
          </div>
        )}
      </div>
    </section>
  );
}