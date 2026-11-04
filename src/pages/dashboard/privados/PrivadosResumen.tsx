import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { NOMBRES_GRUPOS_PRIVADOS, type GrupoPrivado } from '@/lib/clasificacion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SiInstagram, SiTiktok, SiFacebook, SiGoogle } from 'react-icons/si';
import { FaXTwitter, FaLinkedin } from 'react-icons/fa6';
import { BiNews } from 'react-icons/bi';
import type { IconType } from 'react-icons';
import { type Canal } from '@/hooks/useCanalData';
import { useKpiCanalGlobal, filterByTitularidad, filterByCanal, aggregateKpi, type KpiRow } from '@/hooks/useKpiCanal';

interface ChannelConfig {
  key: Canal;
  label: string;
  Icon: IconType;
  brandColor: string;
}

const CHANNELS: ChannelConfig[] = [
  { key: 'medios', label: 'Medios', Icon: BiNews, brandColor: '#E5E7EB' },
  { key: 'instagram', label: 'Instagram', Icon: SiInstagram, brandColor: '#E4405F' },
  { key: 'twitter', label: 'X (Twitter)', Icon: FaXTwitter, brandColor: '#FFFFFF' },
  { key: 'tiktok', label: 'TikTok', Icon: SiTiktok, brandColor: '#FFFFFF' },
  { key: 'facebook', label: 'Facebook', Icon: SiFacebook, brandColor: '#1877F2' },
  { key: 'linkedin', label: 'LinkedIn', Icon: FaLinkedin, brandColor: '#0A66C2' },
  { key: 'mybusiness', label: 'My Business', Icon: SiGoogle, brandColor: '#4285F4' },
];

interface ChannelStats {
  total: number;
  filas: { grupo: GrupoPrivado; count: number; share: number; barPct: number }[];
  maxDate: Date | null;
}

function fmt(n: number) { return (n ?? 0).toLocaleString('es-ES'); }
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }
function fmtFecha(d: Date) { return format(d, 'd MMM yyyy', { locale: es }); }

function buildChannelStats(rowsCanal: KpiRow[]): ChannelStats {
  const counts = new Map<GrupoPrivado, number>();
  NOMBRES_GRUPOS_PRIVADOS.forEach(g => counts.set(g, 0));
  let total = 0;
  let maxDate: Date | null = null;

  for (const r of rowsCanal) {
    if (!r.grupo_hospitalario) continue;
    const g = r.grupo_hospitalario as GrupoPrivado;
    if (!NOMBRES_GRUPOS_PRIVADOS.includes(g)) continue;
    counts.set(g, (counts.get(g) ?? 0) + (r.menciones ?? 0));
    total += r.menciones ?? 0;
    if (r.fecha_max) {
      const d = new Date(r.fecha_max);
      if (!isNaN(d.getTime()) && (!maxDate || d > maxDate)) maxDate = d;
    }
  }

  const max = Math.max(...Array.from(counts.values()), 1);
  const filas = NOMBRES_GRUPOS_PRIVADOS
    .map(grupo => {
      const c = counts.get(grupo) ?? 0;
      return {
        grupo,
        count: c,
        share: total > 0 ? (c / total) * 100 : 0,
        barPct: (c / max) * 100,
      };
    })
    .sort((a, b) => b.count - a.count);

  return { total, filas, maxDate };
}

export default function PrivadosResumen() {
  const queryClient = useQueryClient();
  const { data: kpiRows, isLoading, isFetching, dataUpdatedAt } = useKpiCanalGlobal();

  const stats = useMemo(() => {
    if (!kpiRows) return undefined;
    const privados = filterByTitularidad(kpiRows, 'Privado');
    const out = {} as Record<Canal, ChannelStats>;
    CHANNELS.forEach(c => { out[c.key] = buildChannelStats(filterByCanal(privados, c.key)); });
    return out;
  }, [kpiRows]);

  const totalGlobal = stats ? Object.values(stats).reduce((s, c) => s + c.total, 0) : 0;
  const qsTotalGlobal = stats ? Object.values(stats).reduce((s, c) => {
    const qs = c.filas.find(f => f.grupo === 'Quirónsalud');
    return s + (qs?.count ?? 0);
  }, 0) : 0;
  const qsLideraEn = stats ? CHANNELS.filter(cfg => {
    const c = stats[cfg.key];
    return c.total > 0 && c.filas[0]?.grupo === 'Quirónsalud';
  }).length : 0;
  const canalesActivos = stats ? CHANNELS.filter(cfg => stats[cfg.key].total > 0).length : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-8 py-6 border-b border-border flex items-start justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Sanidad privada · Comparativa global · Últimos 30 días
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Resumen por canal</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
            {stats && qsTotalGlobal > 0 && totalGlobal > 0 ? (
              <>Quirónsalud lidera en <span className="text-foreground font-medium">{qsLideraEn}</span> de <span className="text-foreground font-medium">{canalesActivos}</span> canales activos con <span className="text-foreground font-medium">{fmt(qsTotalGlobal)}</span> menciones agregadas (<span className="text-foreground font-medium">{fmtPct((qsTotalGlobal/totalGlobal)*100)}</span> del total privados).</>
            ) : 'Cargando comparativa...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4 text-[10px] uppercase tracking-wider">
            {isFetching ? (
              <span className="text-[#3b82f6] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
                Actualizando
              </span>
            ) : (
              <span className="text-muted-foreground">
                Auto-refresh 10 min · última: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            )}
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['kpi_canal_global'] })}
            className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            🔄 Recargar
          </button>
        </div>
      </header>

      <section className="px-8 py-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 border-b border-border">
        {CHANNELS.map((cfg) => {
          const c = stats?.[cfg.key];
          const qs = c?.filas.find(f => f.grupo === 'Quirónsalud');
          const qsRank = c ? c.filas.findIndex(f => f.grupo === 'Quirónsalud') + 1 : 0;
          const isEmpty = !!c && c.total === 0;
          const { Icon } = cfg;
          return (
            <div key={cfg.key} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Icon style={{ color: cfg.brandColor }} className="h-3.5 w-3.5" />
                {cfg.label}
              </div>
              {isLoading ? (
                <div className="h-7 w-16 bg-foreground/5 rounded mt-2 animate-pulse" />
              ) : (
                <p className="text-2xl font-bold mt-1 tabular-nums">{fmt(c?.total ?? 0)}</p>
              )}
              {isEmpty ? (
                <p className="text-[10px] text-muted-foreground mt-1">Sin datos</p>
              ) : (
                <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <span className="text-foreground tabular-nums">{qs ? fmt(qs.count) : '—'}</span>
                  <span>QS</span>
                  <span className="ml-auto text-muted-foreground">{c && c.total > 0 ? `#${qsRank}` : ''}</span>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <div className="px-8 py-8 space-y-10">
        {CHANNELS.map(cfg => (
          <ChannelSection key={cfg.key} cfg={cfg} stats={stats?.[cfg.key]} isLoading={isLoading} />
        ))}
      </div>

      <footer className="px-8 py-6 border-t border-border text-[10px] uppercase tracking-widest text-muted-foreground flex justify-between">
        <span>Fuente: Supabase · Vistas: v_canal_*</span>
        <span>Filtrado: titularidad = Privado</span>
      </footer>
    </div>
  );
}

function ChannelSection({ cfg, stats, isLoading }: { cfg: ChannelConfig; stats?: ChannelStats; isLoading: boolean }) {
  const { Icon } = cfg;
  const isEmpty = !!stats && stats.total === 0;
  const qsRow = stats?.filas.find(f => f.grupo === 'Quirónsalud');
  const qsRank = stats ? stats.filas.findIndex(f => f.grupo === 'Quirónsalud') + 1 : 0;

  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
      <header className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-foreground/5 flex items-center justify-center">
            <Icon style={{ color: cfg.brandColor }} className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold">{cfg.label}</h2>
          {stats?.maxDate && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">hasta {fmtFecha(stats.maxDate)}</span>
          )}
          {isLoading && <span className="text-[10px] text-muted-foreground">Cargando...</span>}
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-xl font-bold tabular-nums">{stats ? fmt(stats.total) : '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">QS</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: 'hsl(217, 91%, 60%)' }}>{qsRow ? fmt(qsRow.count) : '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Posición</p>
            <p className="text-xl font-bold tabular-nums">{stats && stats.total > 0 ? `#${qsRank}` : '—'}</p>
          </div>
        </div>
      </header>

      <div className="p-6 relative">
        <div className="space-y-2">
          {(stats?.filas ?? NOMBRES_GRUPOS_PRIVADOS.map(g => ({ grupo: g, count: 0, share: 0, barPct: 0 })))
            .map((f, i) => {
              const isQS = f.grupo === 'Quirónsalud';
              return (
                <div key={f.grupo} className={`grid grid-cols-[2rem_10rem_1fr_5rem_4rem] items-center gap-3 px-2 py-2 rounded ${isQS ? 'bg-blue-500/5 border border-blue-500/20' : ''}`}>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{String(i+1).padStart(2,'0')}</span>
                  <span className={`text-sm ${isQS ? 'text-foreground font-medium' : 'text-foreground'}`}>{f.grupo}</span>
                  <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${f.barPct}%`, background: isQS ? 'hsl(217, 91%, 60%)' : 'rgba(255,255,255,0.25)' }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-right tabular-nums">{fmt(f.count)}</span>
                  <span className="text-xs text-muted-foreground text-right tabular-nums">{fmtPct(f.share)}</span>
                </div>
              );
            })}
        </div>

        {isEmpty && (
          <div className="absolute inset-0 bg-card/85 backdrop-blur-[1px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Scraper en mantenimiento</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
