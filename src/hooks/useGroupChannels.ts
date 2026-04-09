import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { aggregateChannel, aggregateGroup, type ChannelAgg, type GroupAgg, type RawRow } from '@/lib/data-aggregation';

interface ViewDef {
  key: string;
  label: string;
  view: string;
}

const GROUP_VIEWS: Record<string, { label: string; views: ViewDef[] }> = {
  quironsalud: {
    label: 'Quirónsalud (propios)',
    views: [
      { key: 'noticias', label: 'Noticias', view: 'noticias_quironsalud' },
      { key: 'facebook', label: 'Facebook', view: 'fb_posts_quironsalud_agrupados' },
      { key: 'instagram', label: 'Instagram', view: 'ig_posts_quironsalud_agrupados' },
      { key: 'tiktok', label: 'TikTok', view: 'tiktok_posts_quironsalud_agrupados' },
      { key: 'twitter', label: 'X / Twitter', view: 'x_twitter_posts_quironsalud_agrupados' },
    ],
  },
  gh_privados: {
    label: 'Grupos Privados',
    views: [
      { key: 'noticias', label: 'Noticias', view: 'noticias_grupos_hospitalarios_privados' },
      { key: 'facebook', label: 'Facebook', view: 'fb_posts_gh_agrupados' },
      { key: 'instagram', label: 'Instagram', view: 'ig_posts_gh_agrupados' },
      { key: 'tiktok', label: 'TikTok', view: 'tiktok_posts_gh_agrupados' },
      { key: 'twitter', label: 'X / Twitter', view: 'x_twitter_posts_gh_agrupados' },
    ],
  },
  sermas: {
    label: 'SERMAS',
    views: [
      { key: 'noticias', label: 'Noticias', view: 'noticias_sermas' },
      { key: 'facebook', label: 'Facebook', view: 'fb_posts_sermas' },
      { key: 'instagram', label: 'Instagram', view: 'ig_posts_sermas' },
      { key: 'tiktok', label: 'TikTok', view: 'tiktok_posts_sermas' },
      { key: 'twitter', label: 'X / Twitter', view: 'x_twitter_posts_sermas' },
      { key: 'linkedin', label: 'LinkedIn', view: 'linkedin_posts_sermas' },
      { key: 'mybusiness', label: 'My Business', view: 'my_business_sermas' },
    ],
  },
  gestion_qs: {
    label: 'Públicos gestión QS',
    views: [
      { key: 'noticias', label: 'Noticias', view: 'noticias_sermas_gestion_quironsalud' },
      { key: 'facebook', label: 'Facebook', view: 'fb_posts_sermas_gestion_qs' },
      { key: 'instagram', label: 'Instagram', view: 'ig_posts_sermas_gestion_qs' },
      { key: 'tiktok', label: 'TikTok', view: 'tiktok_posts_sermas_gestion_qs' },
      { key: 'twitter', label: 'X / Twitter', view: 'x_twitter_posts_sermas_gestion_qs' },
    ],
  },
  catsalut: {
    label: 'CATSALUT',
    views: [
      { key: 'noticias', label: 'Noticias', view: 'noticias_catsalut' },
      { key: 'facebook', label: 'Facebook', view: 'fb_catsalut' },
      { key: 'instagram', label: 'Instagram', view: 'ig_posts_catsalut' },
      { key: 'tiktok', label: 'TikTok', view: 'tiktok_posts_catsalut' },
      { key: 'twitter', label: 'X / Twitter', view: 'x_twitter_posts_catsalut' },
    ],
  },
  catsalut_qs: {
    label: 'CATSALUT concierto QS',
    views: [
      { key: 'noticias', label: 'Noticias', view: 'noticias_catsalut_solo_qs' },
      { key: 'facebook', label: 'Facebook', view: 'fb_catsalut_QS' },
      { key: 'instagram', label: 'Instagram', view: 'ig_posts_catsalut_qs' },
      { key: 'tiktok', label: 'TikTok', view: 'tiktok_posts_catsalut_qs' },
      { key: 'twitter', label: 'X / Twitter', view: 'x_twitter_posts_catsalut_qs' },
    ],
  },
  fjd: {
    label: 'Fundación Jiménez Díaz',
    views: [
      { key: 'noticias', label: 'Noticias', view: 'noticias_fjd_fundacion' },
      { key: 'facebook', label: 'Facebook', view: 'fb_posts_fundacion_jimenez_diaz' },
      { key: 'instagram', label: 'Instagram', view: 'ig_posts_fjd_' },
      { key: 'tiktok', label: 'TikTok', view: 'tiktok_posts_fundacion_jimenez_diaz' },
      { key: 'twitter', label: 'X / Twitter', view: 'x_twitter_posts_fundacion_jimenez_diaz' },
      { key: 'mybusiness', label: 'My Business', view: 'my_business_fdj' },
    ],
  },
  general: {
    label: 'Panorámica General',
    views: [
      { key: 'noticias', label: 'Noticias', view: 'noticias_general_filtradas' },
      { key: 'facebook', label: 'Facebook', view: 'fb_posts_general_filtradas' },
      { key: 'instagram', label: 'Instagram', view: 'ig_posts_general_filtradas' },
      { key: 'tiktok', label: 'TikTok', view: 'tiktok_posts_general_filtradas' },
      { key: 'twitter', label: 'X / Twitter', view: 'x_twitter_posts_general_filtradas' },
      { key: 'linkedin', label: 'LinkedIn', view: 'linkedin_gh' },
    ],
  },
  alta_complejidad: {
    label: 'Alta Complejidad',
    views: [
      { key: 'noticias', label: 'Noticias', view: 'noticias_grupo_alta_complejidad' },
    ],
  },
};

async function fetchView(view: string, limit = 500): Promise<RawRow[]> {
  try {
    const { data, error } = await externalSupabase.from(view).select('*').limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export function useGroupChannels(groupKey: string) {
  const config = GROUP_VIEWS[groupKey];
  return useQuery<GroupAgg>({
    queryKey: ['group_channels', groupKey],
    queryFn: async () => {
      if (!config) return aggregateGroup(groupKey, groupKey, []);
      const channels = await Promise.all(
        config.views.map(async (v) => {
          const rows = await fetchView(v.view);
          return aggregateChannel(v.key, v.label, rows);
        })
      );
      return aggregateGroup(groupKey, config.label, channels);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!config,
  });
}

export function useAllGroups() {
  const groupKeys = Object.keys(GROUP_VIEWS);
  return useQuery<GroupAgg[]>({
    queryKey: ['all_groups'],
    queryFn: async () => {
      const results = await Promise.all(
        groupKeys.map(async (gk) => {
          const config = GROUP_VIEWS[gk];
          const channels = await Promise.all(
            config.views.map(async (v) => {
              const rows = await fetchView(v.view);
              return aggregateChannel(v.key, v.label, rows);
            })
          );
          return aggregateGroup(gk, config.label, channels);
        })
      );
      return results;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export const ALL_GROUP_KEYS = Object.keys(GROUP_VIEWS);
export { GROUP_VIEWS };
