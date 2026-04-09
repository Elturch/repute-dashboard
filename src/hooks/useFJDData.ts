import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { normalize, avg, aggregateChannel, type RawRow, type ChannelAgg } from '@/lib/data-aggregation';

export type { ChannelAgg };

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
