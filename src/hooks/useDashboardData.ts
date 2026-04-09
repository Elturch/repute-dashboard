import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';

export function useRelatoAcumulado() {
  return useQuery({
    queryKey: ['relato_acumulado'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('relato_acumulado')
        .select('nota_media_ponderada, riesgo_agregado, recomendacion_accion, resumen_narrativo')
        .order('fecha_inicio', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useContadoresSemanales() {
  return useQuery({
    queryKey: ['contadores_semanales'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('contadores_semanales')
        .select('*')
        .order('semana', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCascadasActivas() {
  return useQuery({
    queryKey: ['cascadas_activas'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alert_cascades')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
  });
}

export function useCascadasActivasDetalle() {
  return useQuery({
    queryKey: ['cascadas_activas_detalle'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alert_cascades')
        .select('topic_key, topic_description, alert_count, max_riesgo, last_alert_at, first_source, status')
        .eq('status', 'active')
        .order('last_alert_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useContadoresSemanalesTrend() {
  return useQuery({
    queryKey: ['contadores_semanales_trend'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('contadores_semanales')
        .select('semana, total_escaneadas, total_relevantes, total_riesgo_alto, total_riesgo_medio, total_riesgo_bajo')
        .order('semana', { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data ?? []).reverse();
    },
  });
}

export function useUltimosEventos() {
  return useQuery({
    queryKey: ['ultimos_eventos'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('monitor_reputacional_events')
        .select('fecha, medio_plataforma, titular_o_texto, riesgo_reputacional, m_nota_ponderada, url')
        .order('fecha', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCascadasRecientes() {
  return useQuery({
    queryKey: ['cascadas_recientes'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('alert_cascades')
        .select('topic_key, topic_description, alert_count, first_source, last_alert_at, max_riesgo, status')
        .order('last_alert_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useWeeklySnapshots() {
  return useQuery({
    queryKey: ['weekly_snapshots'],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from('weekly_snapshots')
        .select('semana, n_menciones, n_alertas, variacion_vs_semana_anterior')
        .eq('scenario_id', 'quironsalud_ayuso')
        .order('fecha_inicio', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
