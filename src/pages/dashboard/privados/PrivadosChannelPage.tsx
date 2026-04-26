import { useMemo } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { IconType } from 'react-icons';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { useKeywordsClassification } from '@/hooks/useKeywordsClassification';
import {
  NOMBRES_GRUPOS_PRIVADOS,
  COLOR_POR_GRUPO_PRIVADO,
  type GrupoPrivado,
} from '@/lib/clasificacion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

/** Configuración de un canal privado: indica qué vista leer y cómo clasificar. */
export type PrivadosChannelConfig = {
  key: 'medios' | 'instagram' | 'twitter' | 'tiktok' | 'facebook' | 'linkedin' | 'mybusiness';
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
};

function fmt(n: number): string {
  return n.toLocaleString('es-ES');
}
function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}
function deltaPct(actual: number, previo: number): number | null {
  if (previo === 0) return actual > 0 ? null : 0;
  return ((actual - previo) / previo) * 100;
}
function fmtFecha(d: Date): string {
  return format(d, "d 'de' LLL yyyy", { locale: es });
}

type KwData = ReturnType<typeof useKeywordsClassification>['data'];

async function fetchMaxDate(cfg: PrivadosChannelConfig): Promise<Date> {
  try {
    let q = externalSupabase
      .from(cfg.view)
      .select(cfg.dateField)
      .order(cfg.dateField, { ascending: false, nullsFirst: false })
      .limit(1);
    if (cfg.preclassified && cfg.titularityField) {
      q = q.eq(cfg.titularityField, 'Privado');
    }
    const { data, error } = await q;
    if (error) {
      console.error('[PrivadosChannelPage] error max date', error);
      return new Date();
    }
    const row = ((data ?? []) as unknown as Array<Record<string, unknown>>)[0];
    const raw = row?.[cfg.dateField];
    if (typeof raw === 'string' && raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  } catch (e) {
    console.error('[PrivadosChannelPage] exception max date', e);
    return new Date();
  }
}

async function countTotal(
  cfg: PrivadosChannelConfig,
  fromISO: string,
  toISO: string,
  exclusiveTop: boolean,
): Promise<number> {
  let q = externalSupabase
    .from(cfg.view)
    .select('*', { count: 'exact', head: true })
    .gte(cfg.dateField, fromISO);
  q = exclusiveTop ? q.lt(cfg.dateField, toISO) : q.lte(cfg.dateField, toISO);
  if (cfg.preclassified && cfg.titularityField) q = q.eq(cfg.titularityField, 'Privado');
  const { count, error } = await q;
  if (error) {
    console.error(`[${cfg.key}] countTotal error:`, error);
    return 0;
  }
  return count ?? 0;
}

async function countByGroupPreclassified(
  cfg: PrivadosChannelConfig,
  grupo: GrupoPrivado,
  fromISO: string,
  toISO: string,
  exclusiveTop: boolean,
): Promise<number> {
  if (!cfg.groupField) return 0;
  let q = externalSupabase
    .from(cfg.view)
    .select('*', { count: 'exact', head: true })
    .eq(cfg.groupField, grupo)
    .gte(cfg.dateField, fromISO);
  q = exclusiveTop ? q.lt(cfg.dateField, toISO) : q.lte(cfg.dateField, toISO);
  if (cfg.titularityField) q = q.eq(cfg.titularityField, 'Privado');
  const { count, error } = await q;
  if (error) {
    console.error(`[${cfg.key}/${grupo}] count error:`, error);
    return 0;
  }
  return count ?? 0;
}

async function fetchAllRowsParallel<T extends Record<string, unknown>>(
  cfg: PrivadosChannelConfig,
  fields: string,
  fromISO: string,
  toISO: string,
  exclusiveTop: boolean,
  concurrency = 5,
): Promise<T[]> {
  let countQ = externalSupabase
    .from(cfg.view)
    .select('*', { count: 'exact', head: true })
    .gte(cfg.dateField, fromISO);
  countQ = exclusiveTop ? countQ.lt(cfg.dateField, toISO) : countQ.lte(cfg.dateField, toISO);
  if (cfg.preclassified && cfg.titularityField) countQ = countQ.eq(cfg.titularityField, 'Privado');
  const { count: totalCount, error: countErr } = await countQ;
  if (countErr) {
    console.error(`[${cfg.key}] count error:`, countErr);
    return [];
  }
  if (!totalCount) return [];

  console.log(`[${cfg.key}] fetchAllRowsParallel count: ${totalCount} (range ${fromISO} → ${toISO}, exclusiveTop=${exclusiveTop})`);

  const PAGE_SIZE = 1000;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const allRows: T[] = [];

  for (let i = 0; i < totalPages; i += concurrency) {
    const batch = await Promise.all(
      Array.from({ length: Math.min(concurrency, totalPages - i) }, (_, j) => {
        const page = i + j;
        const start = page * PAGE_SIZE;
        const end = start + PAGE_SIZE - 1;
        let q = externalSupabase
          .from(cfg.view)
          .select(fields)
          .gte(cfg.dateField, fromISO)
          .order(cfg.dateField, { ascending: false })
          .range(start, end);
        q = exclusiveTop ? q.lt(cfg.dateField, toISO) : q.lte(cfg.dateField, toISO);
        if (cfg.preclassified && cfg.titularityField) q = q.eq(cfg.titularityField, 'Privado');
        return q;
      }),
    );
    const batchRows = batch.flatMap(b => (b.data ?? []) as unknown as T[]);
    console.log(`[${cfg.key}] fetchAllRowsParallel batch ${i}-${i + concurrency}: ${batchRows.length} rows`);
    for (const { data, error } of batch) {
      if (error) {
        console.error(`[${cfg.key}] page error:`, error);
        continue;
      }
      if (data) allRows.push(...(data as unknown as T[]));
    }
  }
  return allRows;
}

interface ChannelStats {
  filas: Array<{
    grupo: GrupoPrivado;
    actual: number;
    previo: number;
    delta: number | null;
    share: number;
    barPct: number;
  }>;
  totalAct: number;
  totalPrev: number;
  totalDelta: number | null;
  qsCount: number;
  qsShare: number;
  qsDelta: number | null;
  qsRank: number;
  maxDate: Date;
  cutoff30: Date;
  cutoff60: Date;
}

async function fetchChannelStats(cfg: PrivadosChannelConfig, kw: KwData): Promise<ChannelStats> {
  console.log(`[${cfg.key}] ▶ fetchChannelStats START`, {
    view: cfg.view,
    dateField: cfg.dateField,
    preclassified: cfg.preclassified,
    termField: cfg.termField,
    kwLoaded: !!kw,
    hasPatterns: !!kw?.patternsByGrupo,
    patternsForQS: kw?.patternsByGrupo?.['Quirónsalud']?.length ?? 0,
  });
  const maxDate = await fetchMaxDate(cfg);
  const cutoff30 = subDays(maxDate, 30);
  const cutoff60 = subDays(maxDate, 60);
  console.log(`[${cfg.key}] maxDate result:`, {
    maxDate: maxDate.toISOString(),
    cutoff30: cutoff30.toISOString(),
    cutoff60: cutoff60.toISOString(),
  });

  let totalAct = 0;
  let totalPrev = 0;
  const currentByGroup: Record<GrupoPrivado, number> = {} as Record<GrupoPrivado, number>;
  const previousByGroup: Record<GrupoPrivado, number> = {} as Record<GrupoPrivado, number>;
  for (const g of NOMBRES_GRUPOS_PRIVADOS) {
    currentByGroup[g] = 0;
    previousByGroup[g] = 0;
  }

  if (cfg.preclassified) {
    console.log(`[${cfg.key}] branch=preclassified · counts por grupo via .eq(${cfg.groupField})`);
    const tasks: Promise<void>[] = [];
    tasks.push(
      countTotal(cfg, cutoff30.toISOString(), maxDate.toISOString(), false).then(n => {
        totalAct = n;
      }),
    );
    tasks.push(
      countTotal(cfg, cutoff60.toISOString(), cutoff30.toISOString(), true).then(n => {
        totalPrev = n;
      }),
    );
    for (const g of NOMBRES_GRUPOS_PRIVADOS) {
      tasks.push(
        countByGroupPreclassified(cfg, g, cutoff30.toISOString(), maxDate.toISOString(), false).then(
          n => {
            currentByGroup[g] = n;
          },
        ),
      );
      tasks.push(
        countByGroupPreclassified(cfg, g, cutoff60.toISOString(), cutoff30.toISOString(), true).then(
          n => {
            previousByGroup[g] = n;
          },
        ),
      );
    }
    await Promise.all(tasks);
  } else {
    console.log(`[${cfg.key}] branch=NO preclassified · descargando filas y clasificando en JS`);
    if (!cfg.termField) {
      console.warn(`[${cfg.key}] no termField configurado para canal no preclasificado.`);
    }
    const fields = cfg.termField ? `${cfg.termField},${cfg.dateField}` : cfg.dateField;
    const [rowsActual, rowsPrevio] = await Promise.all([
      fetchAllRowsParallel<Record<string, unknown>>(
        cfg,
        fields,
        cutoff30.toISOString(),
        maxDate.toISOString(),
        false,
      ),
      fetchAllRowsParallel<Record<string, unknown>>(
        cfg,
        fields,
        cutoff60.toISOString(),
        cutoff30.toISOString(),
        true,
      ),
    ]);
    totalAct = rowsActual.length;
    totalPrev = rowsPrevio.length;
    if (kw?.clasificar && cfg.termField) {
      const validos = new Set<string>(NOMBRES_GRUPOS_PRIVADOS as readonly string[]);
      for (const r of rowsActual) {
        const txt = r[cfg.termField] as string | null | undefined;
        const c = kw.clasificar(txt);
        if (c?.bloque === 'privados' && c.grupoHospitalario && validos.has(c.grupoHospitalario)) {
          const g = c.grupoHospitalario as GrupoPrivado;
          currentByGroup[g] = (currentByGroup[g] ?? 0) + 1;
        }
      }
      for (const r of rowsPrevio) {
        const txt = r[cfg.termField] as string | null | undefined;
        const c = kw.clasificar(txt);
        if (c?.bloque === 'privados' && c.grupoHospitalario && validos.has(c.grupoHospitalario)) {
          const g = c.grupoHospitalario as GrupoPrivado;
          previousByGroup[g] = (previousByGroup[g] ?? 0) + 1;
        }
      }
    }
  }

  const currentCounts = NOMBRES_GRUPOS_PRIVADOS.map(g => currentByGroup[g]);
  const previousCounts = NOMBRES_GRUPOS_PRIVADOS.map(g => previousByGroup[g]);
  const max = Math.max(...currentCounts, 1);

  const filas = NOMBRES_GRUPOS_PRIVADOS
    .map((grupo, i) => {
      const act = currentCounts[i];
      const prev = previousCounts[i];
      return {
        grupo,
        actual: act,
        previo: prev,
        delta: deltaPct(act, prev),
        share: totalAct > 0 ? (act / totalAct) * 100 : 0,
        barPct: (act / max) * 100,
      };
    })
    .sort((a, b) => b.actual - a.actual);

  const qs = filas.find(f => f.grupo === 'Quirónsalud');
  const qsRank = filas.findIndex(f => f.grupo === 'Quirónsalud') + 1;

  console.log(`[${cfg.key}] ✅ END`, {
    totalAct,
    totalPrev,
    currentByGroup,
    previousByGroup,
  });

  return {
    filas,
    totalAct,
    totalPrev,
    totalDelta: deltaPct(totalAct, totalPrev),
    qsCount: qs?.actual ?? 0,
    qsShare: qs?.share ?? 0,
    qsDelta: qs?.delta ?? null,
    qsRank,
    maxDate,
    cutoff30,
    cutoff60,
  };
}

/**
 * Prefetch helper para precarga al montar el dashboard.
 * Asegura primero que las keywords estén en cache, y luego dispara la query del canal.
 */
export async function prefetchPrivadosChannel(
  queryClient: QueryClient,
  cfg: PrivadosChannelConfig,
): Promise<void> {
  // 1) Asegurar keywords (compartidas por todos los canales)
  let kw: KwData = queryClient.getQueryData(['keywords_classification']) as KwData;
  if (!kw && !cfg.preclassified) {
    try {
      kw = (await queryClient.fetchQuery({
        queryKey: ['keywords_classification'],
      })) as KwData;
    } catch {
      // si no hay queryFn registrada todavía, dejamos kw undefined
    }
  }
  // 2) Prefetch del canal
  await queryClient.prefetchQuery({
    queryKey: ['privados_channel', cfg.key],
    queryFn: () => fetchChannelStats(cfg, kw),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export default function PrivadosChannelPage({ cfg }: { cfg: PrivadosChannelConfig }) {
  const { data: kw, isLoading: loadingKw } = useKeywordsClassification();
  const queryClient = useQueryClient();

  const ready = cfg.preclassified || !!kw;

  const channel = useQuery({
    queryKey: ['privados_channel', cfg.key],
    enabled: ready,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    queryFn: () => fetchChannelStats(cfg, kw),
  });

  const stats = channel.data ?? null;
  const maxDate = useMemo(() => stats?.maxDate ?? new Date(), [stats?.maxDate]);
  const cutoff30 = useMemo(
    () => stats?.cutoff30 ?? subDays(maxDate, 30),
    [stats?.cutoff30, maxDate],
  );
  const cutoff60 = useMemo(
    () => stats?.cutoff60 ?? subDays(maxDate, 60),
    [stats?.cutoff60, maxDate],
  );

  const isLoading = (cfg.preclassified ? false : loadingKw) || channel.isLoading;

  const rangoActual = `${fmtFecha(cutoff30)} — ${fmtFecha(maxDate)}`;
  const rangoPrevio = `${fmtFecha(cutoff60)} — ${fmtFecha(cutoff30)}`;

  const ahora = useMemo(() => new Date(), []);
  const diasDesdeMax = (ahora.getTime() - maxDate.getTime()) / (1000 * 60 * 60 * 24);
  const showStaleHint = stats != null && diasDesdeMax > 2;

  const Icon = cfg.Icon;

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
          <button
            type="button"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['privados_channel', cfg.key] });
              queryClient.invalidateQueries({ queryKey: ['keywords_classification'] });
            }}
            className="text-[10px] uppercase tracking-wider text-[#6b7280] hover:text-foreground"
          >
            🔄 Recargar
          </button>
        </div>
        {showStaleHint && (
          <div className="text-[#6b7280] text-[10px] uppercase tracking-wider">
            Última actualización: {fmtFecha(maxDate)}
          </div>
        )}
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Icon className="h-6 w-6" style={{ color: cfg.brandColor }} />
          Menciones en {cfg.label}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {stats && stats.qsCount > 0 ? (
            <>
              Quirónsalud lidera con {fmt(stats.qsCount)} menciones{' '}
              ({fmtPct(stats.qsShare)} del total)
              {stats.qsDelta != null && (
                <> <DeltaInline value={stats.qsDelta} /> vs los 30 días anteriores</>
              )}
              .
            </>
          ) : (
            <>Cargando análisis comparativo de los 8 grupos hospitalarios privados.</>
          )}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi
          label="Total menciones"
          value={stats ? fmt(stats.totalAct) : '—'}
          delta={stats?.totalDelta ?? null}
          sub="últimos 30 días"
        />
        <Kpi
          label="Quirónsalud"
          value={stats ? fmt(stats.qsCount) : '—'}
          delta={stats?.qsDelta ?? null}
          sub={stats ? `${fmtPct(stats.qsShare)} del total` : undefined}
          highlight
        />
        <Kpi
          label="Posición"
          value={stats?.qsRank ? `#${stats.qsRank}` : '—'}
          sub="de 8 grupos privados"
        />
        <Kpi
          label="Período comparado"
          value={stats ? fmt(stats.totalPrev) : '—'}
          sub="30 días anteriores"
        />
      </div>

      {/* League table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="grid grid-cols-[3rem_1fr_6rem_5rem_5rem] items-center gap-4 border-b border-border px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span>#</span>
          <span>Grupo hospitalario</span>
          <span className="text-right">Menciones</span>
          <span className="text-right">Cuota</span>
          <span className="text-right">Δ 30d</span>
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
                  className={`grid grid-cols-[3rem_1fr_6rem_5rem_5rem] items-center gap-4 px-4 py-3 text-sm ${
                    isQS ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-foreground">{f.grupo}</span>
                      {isQS && (
                        <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                          Cliente
                        </span>
                      )}
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
                    {fmt(f.actual)}
                  </span>
                  <span className="text-right font-mono text-xs text-muted-foreground">
                    {fmtPct(f.share)}
                  </span>
                  <span className="text-right">
                    <DeltaInline value={f.delta} />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground md:grid-cols-3">
        <div>
          <p className="font-semibold uppercase tracking-wider">Período actual</p>
          <p className="mt-1 text-foreground">{rangoActual}</p>
        </div>
        <div>
          <p className="font-semibold uppercase tracking-wider">Período comparado</p>
          <p className="mt-1 text-foreground">{rangoPrevio}</p>
        </div>
        <div className="space-y-1">
          <p>
            Fuente: MySQL · Make · Supabase · {cfg.titularityField ? `Filtrado por ${cfg.titularityField} = Privado · ` : ''}
            Vista: {cfg.view}
          </p>
          {stats && (
            <p>
              {fmt(stats.totalAct + stats.totalPrev)} menciones clasificadas en privados (servidor)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── subcomponentes ─────────────── */

function Kpi({
  label,
  value,
  delta,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  delta?: number | null;
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
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta != null && <DeltaInline value={delta} />}
        {sub && <span className="text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

function DeltaInline({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  if (Math.abs(value) < 0.5) {
    return (
      <span className="inline-flex items-center gap-0.5 font-mono text-muted-foreground">
        <Minus className="h-3 w-3" />
        {fmtPct(Math.abs(value))}
      </span>
    );
  }
  const positive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono ${
        positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
      }`}
    >
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {fmtPct(Math.abs(value))}
    </span>
  );
}