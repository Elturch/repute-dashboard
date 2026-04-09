import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';

export function useCrossAmplification() {
  return useQuery({
    queryKey: ['cross_amplification'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('cross_amplification')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useKeywords() {
  return useQuery({
    queryKey: ['keywords'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('keywords')
        .select('*')
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useAlertCascades(limit = 20) {
  return useQuery({
    queryKey: ['alert_cascades_full', limit],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alert_cascades')
        .select('*')
        .order('last_alert_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useWeeklySnapshots() {
  return useQuery({
    queryKey: ['weekly_snapshots_all'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('weekly_snapshots')
        .select('*')
        .order('fecha_inicio', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useNoticiasGeneralFiltradas(limit = 500) {
  return useQuery({
    queryKey: ['noticias_general_filtradas', limit],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('noticias_general_filtradas')
        .select('*')
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
