import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { useKeywordsClassification } from '@/hooks/useKeywordsClassification';
import {
  NOMBRES_GRUPOS_PRIVADOS,
  COLOR_POR_GRUPO_PRIVADO,
  type GrupoPrivado,
} from '@/lib/clasificacion';
import { ArrowUpRight, ArrowDownRight, Minus, AlertTriangle } from 'lucide-react';
import { BiNews } from 'react-icons/bi';
import { SiInstagram, SiTiktok, SiFacebook, SiGoogle } from 'react-icons/si';
import { FaXTwitter, FaLinkedin } from 'react-icons/fa6';

/** Configuración de canales con su logo oficial y color corporativo. */
export const CHANNEL_CFG = {
  medios:    { label: 'Medios',      Icon: BiNews,       brandColor: '#1F2937' },
  instagram: { label: 'Instagram',   Icon: SiInstagram,  brandColor: '#E4405F' },
  twitter:   { label: 'X',           Icon: FaXTwitter,   brandColor: '#000000' },
  tiktok:    { label: 'TikTok',      Icon: SiTiktok,     brandColor: '#000000' },
  facebook:  { label: 'Facebook',    Icon: SiFacebook,   brandColor: '#1877F2' },
  linkedin:  { label: 'LinkedIn',    Icon: FaLinkedin,   brandColor: '#0A66C2' },
  mybusiness:{ label: 'My Business', Icon: SiGoogle,     brandColor: '#4285F4' },
} as const;

interface Row {
  Tema: string | null;
  Date: string | null;
}

const PAGE_SIZE = 1000;
const MAX_PAGES = 3;

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

async function fetchAllRows(fromISO: string): Promise<{ rows: Row[]; truncated: boolean }> {
  const all: Row[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;
    const { data, error } = await externalSupabase
      .from('noticias_general_filtradas')
      .select('Tema, Date')
      .eq('titularidad', 'Privado')
      .gte('Date', fromISO)
      .order('Date', { ascending: false })
      .range(start, end);
    if (error) {
      console.error('[PrivadosNoticias] error página', page, error);
      break;
    }
    const chunk = (data ?? []) as Row[];
    all.push(...chunk);
    if (chunk.length < PAGE_SIZE) {
      return { rows: all, truncated: false };
    }
  }
  return { rows: all, truncated: true };
}

export default function PrivadosNoticias() {
  const { data: kw, isLoading: loadingKw } = useKeywordsClassification();

  const now = useMemo(() => new Date(), []);
  const cutoff30 = useMemo(() => subDays(now, 30), [now]);
  const cutoff60 = useMemo(() => subDays(now, 60), [now]);

  const noticias = useQuery({
    queryKey: ['privados_noticias_60d_paginado'],
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchAllRows(cutoff60.toISOString()),
  });

  const stats = useMemo(() => {
    if (!kw?.clasificar || !noticias.data) return null;

    const actual = new Map<GrupoPrivado, number>();
    const previo = new Map<GrupoPrivado, number>();
    NOMBRES_GRUPOS_PRIVADOS.forEach(g => {
      actual.set(g, 0);
      previo.set(g, 0);
    });
    let totalAct = 0;
    let totalPrev = 0;

    for (const row of noticias.data.rows) {
      if (!row.Date || !row.Tema) continue;
      const c = kw.clasificar(row.Tema);
      if (!c || c.bloque !== 'privados' || !c.grupoHospitalario) continue;
      const g = c.grupoHospitalario as GrupoPrivado;
      if (!NOMBRES_GRUPOS_PRIVADOS.includes(g)) continue;
      const fecha = new Date(row.Date);
      if (fecha >= cutoff30) {
        actual.set(g, (actual.get(g) ?? 0) + 1);
        totalAct++;
      } else {
        previo.set(g, (previo.get(g) ?? 0) + 1);
        totalPrev++;
      }
    }

    const max = Math.max(...Array.from(actual.values()), 1);
    const filas = NOMBRES_GRUPOS_PRIVADOS
      .map(grupo => {
        const act = actual.get(grupo) ?? 0;
        const prev = previo.get(grupo) ?? 0;
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
    const totalDelta = deltaPct(totalAct, totalPrev);

    return {
      filas,
      totalAct,
      totalPrev,
      totalDelta,
      qsCount: qs?.actual ?? 0,
      qsShare: qs?.share ?? 0,
      qsDelta: qs?.delta ?? null,
      qsRank,
      truncated: noticias.data.truncated,
      rowsLeidas: noticias.data.rows.length,
    };
  }, [kw, noticias.data, cutoff30]);

  const isLoading = loadingKw || noticias.isLoading;

  const rangoActual = `${fmtFecha(cutoff30)} — ${fmtFecha(now)}`;
  const rangoPrevio = `${fmtFecha(cutoff60)} — ${fmtFecha(cutoff30)}`;

  return (
    <div className="space-y-6 p-6">
      {/* Hero */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CHANNEL_CFG.medios.Icon
              className="h-3.5 w-3.5"
              style={{ color: CHANNEL_CFG.medios.brandColor }}
            />
            Sanidad privada · {CHANNEL_CFG.medios.label}
          </span>
          <span>·</span>
          <span>{rangoActual}</span>
        </div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <CHANNEL_CFG.medios.Icon
            className="h-6 w-6"
            style={{ color: CHANNEL_CFG.medios.brandColor }}
          />
          Menciones en medios
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

        {stats?.truncated && (
          <div className="flex items-start gap-2 border-t border-border bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              Se alcanzó el límite de seguridad de {fmt(MAX_PAGES * PAGE_SIZE)} filas leídas. Las cifras pueden estar
              recortadas si el volumen real fue mayor.
            </span>
          </div>
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
            Fuente: MySQL · Make · Supabase · Filtrado por titularidad = Privado · Vista: noticias_general_filtradas
          </p>
          {stats && (
            <p>
              {fmt(stats.rowsLeidas)} filas leídas · {fmt(stats.totalAct + stats.totalPrev)} clasificadas en privados
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