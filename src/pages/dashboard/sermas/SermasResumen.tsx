import { useQuery, useQueryClient } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SiInstagram, SiTiktok, SiFacebook, SiGoogle } from 'react-icons/si';
import { FaXTwitter, FaLinkedin } from 'react-icons/fa6';
import { BiNews } from 'react-icons/bi';
import type { IconType } from 'react-icons';

type ChannelKey = 'noticias' | 'instagram' | 'x_twitter' | 'tiktok' | 'facebook' | 'linkedin' | 'mybusiness';

interface ChannelConfig {
  key: ChannelKey;
  label: string;
  Icon: IconType;
  brandColor: string;
}

const CHANNELS: ChannelConfig[] = [
  { key: 'noticias',   label: 'Medios',         Icon: BiNews,      brandColor: '#9CA3AF' },
  { key: 'instagram',  label: 'Instagram',      Icon: SiInstagram, brandColor: '#E4405F' },
  { key: 'x_twitter',  label: 'X (Twitter)',    Icon: FaXTwitter,  brandColor: '#FFFFFF' },
  { key: 'tiktok',     label: 'TikTok',         Icon: SiTiktok,    brandColor: '#FF0050' },
  { key: 'facebook',   label: 'Facebook',       Icon: SiFacebook,  brandColor: '#1877F2' },
  { key: 'linkedin',   label: 'LinkedIn',       Icon: FaLinkedin,  brandColor: '#0A66C2' },
  { key: 'mybusiness', label: 'Reseñas Google', Icon: SiGoogle,    brandColor: '#4285F4' },
];

interface MvRow {
  canal: string;
  gestion: string | null;
  grupo_hospitalario: string | null;
  menciones: number;
  fecha_max: string | null;
}

interface ChannelStats {
  total: number;
  qs: number;
  sinQs: number;
  fjd: number;
  maxDate: Date | null;
}

function fmt(n: number) { return (n ?? 0).toLocaleString('es-ES'); }
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }
function fmtFecha(d: Date) { return format(d, 'd MMM yyyy', { locale: es }); }

async function fetchResumen(): Promise<Record<ChannelKey, ChannelStats>> {
  const result = {} as Record<ChannelKey, ChannelStats>;
  for (const cfg of CHANNELS) result[cfg.key] = { total: 0, qs: 0, sinQs: 0, fjd: 0, maxDate: null };

  const { data, error } = await externalSupabase
    .from('mv_dashboard_resumen_30d')
    .select('canal, gestion, grupo_hospitalario, menciones, fecha_max')
    .ilike('gestion', 'SERMAS%');

  if (error) {
    console.error('[resumen sermas] error:', error);
    return result;
  }

  const rows = (data ?? []) as MvRow[];

  for (const cfg of CHANNELS) {
    let total = 0, qs = 0, fjd = 0;
    let maxDate: Date | null = null;
    for (const r of rows) {
      if (r.canal !== cfg.key) continue;
      const m = Number(r.menciones) || 0;
      total += m;
      if (r.gestion === 'SERMAS Gestión QS') qs += m;
      if (r.grupo_hospitalario === 'Fundación Jiménez Díaz') fjd += m;
      if (r.fecha_max) {
        const d = new Date(r.fecha_max);
        if (!isNaN(d.getTime()) && (!maxDate || d > maxDate)) maxDate = d;
      }
    }
    result[cfg.key] = { total, qs, sinQs: total - qs, fjd, maxDate };
  }
  return result;
}

export default function SermasResumen() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['sermas_resumen'],
    queryFn: fetchResumen,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: 10 * 60 * 1000,
    refetchIntervalInBackground: true,
  });

  const totalGlobal = stats ? Object.values(stats).reduce((s, c) => s + c.total, 0) : 0;
  const qsGlobal    = stats ? Object.values(stats).reduce((s, c) => s + c.qs, 0) : 0;
  const fjdGlobal   = stats ? Object.values(stats).reduce((s, c) => s + c.fjd, 0) : 0;
  const canalesActivos = stats ? CHANNELS.filter(cfg => stats[cfg.key].total > 0).length : 0;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Hero */}
      <header className="px-8 py-6 border-b border-white/5 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#6b7280] mb-2">
            Sistema Madrileño de Salud · Total vs Gestión QS vs Sin QS · Últimos 30 días
          </p>
          <h1 className="text-3xl font-bold tracking-tight">SERMAS — Resumen por canal</h1>
          <p className="text-sm text-[#9ca3af] mt-2 max-w-3xl">
            {stats && totalGlobal > 0 ? (
              <>
                Quirónsalud gestiona <span className="text-emerald-400 font-medium">{fmt(qsGlobal)}</span> de las{' '}
                <span className="text-white font-medium">{fmt(totalGlobal)}</span> menciones SERMAS
                {' '}(<span className="text-emerald-400 font-medium">{fmtPct((qsGlobal/totalGlobal)*100)}</span>) en{' '}
                <span className="text-white font-medium">{canalesActivos}</span> canales activos · FJD destaca con{' '}
                <span className="text-amber-400 font-medium">{fmt(fjdGlobal)}</span>.
              </>
            ) : 'Cargando comparativa SERMAS...'}
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
              <span className="text-[#6b7280]">
                Auto-refresh 10 min · última: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            )}
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['sermas_resumen'] })}
            className="text-[10px] uppercase tracking-wider text-[#6b7280] hover:text-white"
          >
            🔄 Recargar
          </button>
        </div>
      </header>

      {/* Tira de KPI cards por canal */}
      <section className="px-8 py-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 border-b border-white/5">
        {CHANNELS.map((cfg) => {
          const c = stats?.[cfg.key];
          const isEmpty = !!c && c.total === 0;
          const { Icon } = cfg;
          return (
            <div key={cfg.key} className="bg-[#0f1420] border border-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#9ca3af]">
                <Icon style={{ color: cfg.brandColor }} className="h-3.5 w-3.5" />
                {cfg.label}
              </div>
              {isLoading ? (
                <div className="h-7 w-16 bg-white/5 rounded mt-2 animate-pulse" />
              ) : (
                <p className="text-2xl font-bold mt-1 tabular-nums">{fmt(c?.total ?? 0)}</p>
              )}
              {isEmpty ? (
                <p className="text-[10px] text-[#6b7280] mt-1">Sin datos</p>
              ) : (
                <div className="text-[10px] text-[#9ca3af] mt-1 flex items-center gap-1">
                  <span className="text-emerald-400 tabular-nums font-medium">{fmt(c?.qs ?? 0)}</span>
                  <span>QS</span>
                  <span className="ml-auto text-amber-400 tabular-nums">{fmt(c?.fjd ?? 0)} FJD</span>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Secciones por canal con split de los 3 segmentos + FJD */}
      <div className="px-8 py-8 space-y-6">
        {CHANNELS.map(cfg => (
          <ChannelSection key={cfg.key} cfg={cfg} stats={stats?.[cfg.key]} isLoading={isLoading} />
        ))}
      </div>

      <footer className="px-8 py-6 border-t border-white/5 text-[10px] uppercase tracking-widest text-[#6b7280] flex justify-between flex-wrap gap-2">
        <span>Fuente: MySQL · Make · Supabase · Vista: mv_dashboard_resumen_30d</span>
        <span>Filtrado: gestion ILIKE 'SERMAS%'</span>
      </footer>
    </div>
  );
}

function ChannelSection({ cfg, stats, isLoading }: { cfg: ChannelConfig; stats?: ChannelStats; isLoading: boolean }) {
  const { Icon } = cfg;
  const isEmpty = !!stats && stats.total === 0;

  return (
    <section className="bg-[#0f1420] border border-white/5 rounded-xl overflow-hidden">
      <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center">
            <Icon style={{ color: cfg.brandColor }} className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold">{cfg.label}</h2>
          {stats?.maxDate && (
            <span className="text-[10px] uppercase tracking-wider text-[#6b7280]">hasta {fmtFecha(stats.maxDate)}</span>
          )}
          {isLoading && <span className="text-[10px] text-[#6b7280]">Cargando...</span>}
        </div>
      </header>

      <div className="p-6 relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <SegBox label="SERMAS Total" value={stats?.total} tone="neutral" loading={isLoading} />
        <SegBox label="Gestión QS"   value={stats?.qs}    tone="emerald" loading={isLoading} share={stats && stats.total > 0 ? (stats.qs / stats.total) * 100 : undefined} />
        <SegBox label="Sin QS"       value={stats?.sinQs} tone="blue"    loading={isLoading} share={stats && stats.total > 0 ? (stats.sinQs / stats.total) * 100 : undefined} />
        <SegBox label="FJD"          value={stats?.fjd}   tone="amber"   loading={isLoading} share={stats && stats.total > 0 ? (stats.fjd / stats.total) * 100 : undefined} sub="joya de la corona" />

        {isEmpty && (
          <div className="absolute inset-0 bg-[#0f1420]/85 backdrop-blur-[1px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-[#6b7280]">Sin datos</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const TONE_CLASSES: Record<string, { border: string; bg: string; text: string }> = {
  neutral: { border: 'border-white/10',          bg: 'bg-white/[0.02]',           text: 'text-white' },
  emerald: { border: 'border-emerald-500/30',    bg: 'bg-emerald-500/[0.06]',     text: 'text-emerald-400' },
  blue:    { border: 'border-blue-500/30',       bg: 'bg-blue-500/[0.06]',        text: 'text-blue-400' },
  amber:   { border: 'border-amber-500/30',      bg: 'bg-amber-500/[0.06]',       text: 'text-amber-400' },
};

function SegBox({ label, value, tone, loading, share, sub }: {
  label: string;
  value?: number;
  tone: 'neutral' | 'emerald' | 'blue' | 'amber';
  loading: boolean;
  share?: number;
  sub?: string;
}) {
  const c = TONE_CLASSES[tone];
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-3`}>
      <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] font-semibold">{label}</p>
      {sub && <p className="text-[9px] text-[#6b7280] mt-0.5">{sub}</p>}
      {loading ? (
        <div className="h-7 w-16 bg-white/5 rounded mt-2 animate-pulse" />
      ) : (
        <p className={`text-2xl font-bold mt-1 tabular-nums ${c.text}`}>{fmt(value ?? 0)}</p>
      )}
      {share != null && (
        <p className="text-[10px] text-[#9ca3af] mt-1 tabular-nums">{fmtPct(share)} del total</p>
      )}
    </div>
  );
}