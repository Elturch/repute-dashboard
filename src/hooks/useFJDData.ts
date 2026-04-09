import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';

interface RawRow {
  [key: string]: any;
}

function normalize(r: RawRow) {
  return {
    nota: r.Nota_media_Ponderada ?? r.nota_media_ponderada ?? null,
    preocupacion: r.Preocupacion ?? r.preocupacion ?? null,
    rechazo: r.Rechazo ?? r.rechazo ?? null,
    descredito: r.Descredito ?? r.descredito ?? null,
    afinidad: r.Afinidad ?? r.afinidad ?? null,
    fiabilidad: r.Fiabilidad ?? r.fiabilidad ?? null,
    admiracion: r.Admiracion ?? r.admiracion ?? null,
    impacto: r.Impacto ?? r.impacto ?? null,
    influencia: r.Influencia ?? r.influencia ?? null,
    peligro: (r.Peligro_reputacional ?? r.peligro_reputacional ?? '').toLowerCase(),
    date: r.Date ?? r.date_posted ?? r.iso_date ?? r.timestamp ?? null,
    rating: r.rating ?? null,
  };
}

function avg(arr: (number | null)[]): number {
  const v = arr.filter((x): x is number => x != null && !isNaN(x));
  return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : 0;
}

export interface ChannelAgg {
  channel: string;
  label: string;
  count: number;
  nota: number;
  fortaleza: number;
  riesgo: number;
  potencia: number;
  peligroAltoPct: number;
  avgRating: number | null;
}

function aggregateChannel(channel: string, label: string, rows: RawRow[]): ChannelAgg {
  const n = rows.map(normalize);
  const nota = avg(n.map(r => r.nota));
  const afinidad = avg(n.map(r => r.afinidad));
  const fiabilidad = avg(n.map(r => r.fiabilidad));
  const admiracion = avg(n.map(r => r.admiracion));
  const preocupacion = avg(n.map(r => r.preocupacion));
  const rechazo = avg(n.map(r => r.rechazo));
  const descredito = avg(n.map(r => r.descredito));
  const impacto = avg(n.map(r => r.impacto));
  const influencia = avg(n.map(r => r.influencia));
  const peligroAlto = n.filter(r => r.peligro.includes('alto') || r.peligro.includes('criti')).length;
  const ratings = n.map(r => r.rating).filter((x): x is number => x != null);

  return {
    channel, label, count: rows.length,
    nota,
    fortaleza: +((nota + afinidad + fiabilidad + admiracion) / 4).toFixed(2),
    riesgo: +((preocupacion + descredito + rechazo) / 3).toFixed(2),
    potencia: +((influencia + impacto) / 2).toFixed(2),
    peligroAltoPct: rows.length ? +((peligroAlto / rows.length) * 100).toFixed(1) : 0,
    avgRating: ratings.length ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null,
  };
}

const FJD_CHANNELS = [
  { key: 'noticias', label: 'Noticias', view: 'noticias_fjd_fundacion' },
  { key: 'facebook', label: 'Facebook', view: 'fb_posts_fundacion_jimenez_diaz' },
  { key: 'instagram', label: 'Instagram', view: 'ig_posts_fjd_' },
  { key: 'tiktok', label: 'TikTok', view: 'tiktok_posts_fundacion_jimenez_diaz' },
  { key: 'twitter', label: 'X / Twitter', view: 'x_twitter_posts_fundacion_jimenez_diaz' },
  { key: 'mybusiness', label: 'My Business', view: 'my_business_fdj' },
];

export function useFJDChannels() {
  return useQuery({
    queryKey: ['fjd_channels'],
    queryFn: async () => {
      const results = await Promise.all(
        FJD_CHANNELS.map(async (ch) => {
          try {
            const { data, error } = await externalSupabase.from(ch.view).select('*').limit(500);
            if (error) throw error;
            return aggregateChannel(ch.key, ch.label, data ?? []);
          } catch {
            return aggregateChannel(ch.key, ch.label, []);
          }
        })
      );
      return results;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Compare FJD vs other public hospitals managed privately
export function useFJDvsPublicos() {
  return useQuery({
    queryKey: ['fjd_vs_publicos'],
    queryFn: async () => {
      const [fjdRes, pubRes] = await Promise.all([
        externalSupabase.from('noticias_fjd_fundacion').select('*').limit(500),
        externalSupabase.from('noticias_sermas_gestion_quironsalud').select('*').limit(500),
      ]);
      return {
        fjd: aggregateChannel('fjd', 'Fundación Jiménez Díaz', fjdRes.data ?? []),
        publicos: aggregateChannel('publicos', 'Públicos gestión QS', pubRes.data ?? []),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// FJD alerts from cascades
export function useFJDAlerts() {
  return useQuery({
    queryKey: ['fjd_alerts'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alert_cascades')
        .select('topic_key, topic_description, alert_count, max_riesgo, last_alert_at, status')
        .or('topic_key.ilike.%fjd%,topic_key.ilike.%jimenez%,topic_description.ilike.%jiménez%,topic_description.ilike.%fundación%')
        .order('last_alert_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
