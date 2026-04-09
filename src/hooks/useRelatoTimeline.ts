import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';

export interface RelatoEntry {
  id: number;
  semana: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  total_escaneadas: number | null;
  total_relevantes: number | null;
  pct_peligrosas: number | null;
  riesgo_puntual: string | null;
  riesgo_agregado: string | null;
  nota_media_ponderada: number | null;
  temas_principales: string[] | null;
  nuevos_angulos: string | null;
  nuevos_medios: string | null;
  recomendacion_accion: string | null;
  resumen_narrativo: string | null;
  created_at: string | null;
}

export interface RelatoFilters {
  riesgo?: string;
  search?: string;
}

export function useRelatoTimeline(filters?: RelatoFilters) {
  return useQuery({
    queryKey: ['relato_timeline', filters],
    queryFn: async () => {
      let q = externalSupabase
        .from('relato_acumulado')
        .select('*')
        .order('fecha_inicio', { ascending: false });

      if (filters?.riesgo && filters.riesgo !== 'todos') {
        q = q.ilike('riesgo_agregado', `%${filters.riesgo}%`);
      }
      if (filters?.search) {
        q = q.or(`resumen_narrativo.ilike.%${filters.search}%,nuevos_angulos.ilike.%${filters.search}%,recomendacion_accion.ilike.%${filters.search}%`);
      }

      const { data, error } = await q.limit(50);
      if (error) throw error;
      return (data ?? []) as RelatoEntry[];
    },
  });
}
