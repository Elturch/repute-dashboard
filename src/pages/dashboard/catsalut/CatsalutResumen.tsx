import { useQuery, useQueryClient } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SiInstagram, SiTiktok, SiFacebook, SiGoogle } from 'react-icons/si';
import { FaXTwitter, FaLinkedin } from 'react-icons/fa6';
import { BiNews } from 'react-icons/bi';
import type { IconType } from 'react-icons';
import { VIEW_BY_CANAL, type Canal } from '@/hooks/useCanalData';

type ChannelKey = 'noticias' | 'instagram' | 'x_twitter' | 'tiktok' | 'facebook' | 'linkedin' | 'mybusiness';

interface ChannelConfig {
  key: ChannelKey;
  canal: Canal;
  label: string;
  Icon: IconType;
  brandColor: string;
}

const CHANNELS: ChannelConfig[] = [
  { key: 'noticias',   canal: 'medios',     label: 'Medios',         Icon: BiNews,      brandColor: '#9CA3AF' },
  { key: 'instagram',  canal: 'instagram',  label: 'Instagram',      Icon: SiInstagram, brandColor: '#E4405F' },
  { key: 'x_twitter',  canal: 'twitter',    label: 'X (Twitter)',    Icon: FaXTwitter,  brandColor: '#FFFFFF' },
  { key: 'tiktok',     canal: 'tiktok',     label: 'TikTok',         Icon: SiTiktok,    brandColor: '#FF0050' },
  { key: 'facebook',   canal: 'facebook',   label: 'Facebook',       Icon: SiFacebook,  brandColor: '#1877F2' },
  { key: 'linkedin',   canal: 'linkedin',   label: 'LinkedIn',       Icon: FaLinkedin,  brandColor: '#0A66C2' },
  { key: 'mybusiness', canal: 'mybusiness', label: 'Reseñas Google', Icon: SiGoogle,    brandColor: '#4285F4' },
];

interface ChannelStats {
  total: number;
  qs: number;
  sinQs: number;
  maxDate: Date | null;
}

function fmt(n: number) { return (n ?? 0).toLocaleString('es-ES'); }
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }
function fmtFecha(d: Date) { return format(d, 'd MMM yyyy', { locale: es }); }

async function fetchCanal(cfg: ChannelConfig): Promise<ChannelStats> {
  const view = VIEW_BY_CANAL[cfg.canal];
  const { data, error } = await externalSupabase
    .from(view)
    .select('gestion_hospitalaria, fecha')
    .ilike('gestion_hospitalaria', 'CATSALUT%')
    .order('fecha', { ascending: false })
    .limit(5000);

  if (error) {
    console.error(`[resumen catsalut/${cfg.key}] error:`, error);
    return { total: 0, qs: 0, sinQs: 0, maxDate: null };
  }

  let total = 0, qs = 0, sinQs = 0;
  let maxDate: Date | null = null;
  for (const r of (data ?? [])) {
    total++;
    if (r.gestion_hospitalaria === 'CATSALUT - Quirónsalud (concierto)') qs++;
    if (r.gestion_hospitalaria === 'CATSALUT') sinQs++;
    if (r.fecha) {
      const d = new Date(r.fecha);
      if (!isNaN(d.getTime()) && (!maxDate || d > maxDate)) maxDate = d;
    }
  }
  return { total, qs, sinQs, maxDate };
}

async function fetchResumen(): Promise<Record<ChannelKey, ChannelStats>> {
  const result = {} as Record<ChannelKey, ChannelStats>;
  await Promise.all(CHANNELS.map(async c => { result[c.key] = await fetchCanal(c); }));
  return result;
}

export default function CatsalutResumen() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['catsalut_resumen'],
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
  const canalesActivos = stats ? CHANNELS.filter(cfg => stats[cfg.key].total > 0).length : 0;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <header className="px-8 py-6 border-b border-white/5 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#6b7280] mb-2">
            Servicio Catalán de la Salud · Total vs Concierto QS vs Sin QS · Últimos 30 días
          </p>
          <h1 className="text-3xl font-bold tracking-tight">CATSALUT — Resumen por canal</h1>
          <p className="text-sm text-[#9ca3af] mt-2 max-w-3xl">
            {stats && totalGlobal > 0 ? (
              <>
                Quirónsalud opera en concierto con <span className="text-emerald-400 font-medium">{fmt(qsGlobal)}</span> de las{' '}
                <span className="text-white font-medium">{fmt(totalGlobal)}</span> menciones CATSALUT
                {' '}(<span className="text-emerald-400 font-medium">{fmtPct((qsGlobal/totalGlobal)*100)}</span>) en{' '}
                <span className="text-white font-medium">{canalesActivos}</span> canales activos.
              </>
            ) : 'Cargando comparativa CATSALUT...'}
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['catsalut_resumen'] })}
            className="text-[10px] uppercase tracking-wider text-[#6b7280] hover:text-white"
          >
            🔄 Recargar
          </button>
        </div>
      </header>

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
                </div>
              )}
            </div>
          );
        })}
      </section>

      <div className="px-8 py-8 space-y-6">
        {CHANNELS.map(cfg => (
          <ChannelSection key={cfg.key} cfg={cfg} stats={stats?.[cfg.key]} isLoading={isLoading} />
        ))}
      </div>

      <footer className="px-8 py-6 border-t border-white/5 text-[10px] uppercase tracking-widest text-[#6b7280] flex justify-between flex-wrap gap-2">
        <span>Fuente: Supabase · Vistas: v_canal_*</span>
        <span>Filtrado: gestion_hospitalaria ILIKE 'CATSALUT%'</span>
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

      <div className="p-6 relative grid grid-cols-1 md:grid-cols-3 gap-3">
        <SegBox label="CATSALUT Total" value={stats?.total} tone="neutral" loading={isLoading} />
        <SegBox label="Concierto QS"   value={stats?.qs}    tone="emerald" loading={isLoading} share={stats && stats.total > 0 ? (stats.qs / stats.total) * 100 : undefined} />
        <SegBox label="Sin QS"         value={stats?.sinQs} tone="blue"    loading={isLoading} share={stats && stats.total > 0 ? (stats.sinQs / stats.total) * 100 : undefined} />

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
};

function SegBox({ label, value, tone, loading, share }: {
  label: string;
  value?: number;
  tone: 'neutral' | 'emerald' | 'blue';
  loading: boolean;
  share?: number;
}) {
  const c = TONE_CLASSES[tone];
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-3`}>
      <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] font-semibold">{label}</p>
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
