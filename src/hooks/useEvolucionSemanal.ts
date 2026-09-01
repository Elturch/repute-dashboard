import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";

export interface EvolucionSemanalRow {
  fecha_inicio: string | null;
  fecha_fin: string | null;
  semana: string | null;
  n_menciones: number | null;
  n_alertas: number | null;
  nota_media: number | null;
  variacion_vs_semana_anterior: number | null;
}

export function useEvolucionSemanal() {
  return useQuery({
    queryKey: ["evolucion-semanal"],
    queryFn: async (): Promise<EvolucionSemanalRow[]> => {
      const { data, error } = await externalSupabase
        .from("v_evolucion_semanal")
        .select("*")
        .order("fecha_inicio", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EvolucionSemanalRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
