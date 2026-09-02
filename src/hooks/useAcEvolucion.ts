import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";

export interface AcEvolucionRow {
  fecha_inicio: string | null;
  fecha_fin: string | null;
  grupo_hospitalario: string;
  es_qs_gestion: boolean | null;
  n: number | null;
  nota_media: number | null;
}

export function useAcEvolucion() {
  return useQuery({
    queryKey: ["ac-evolucion"],
    queryFn: async (): Promise<AcEvolucionRow[]> => {
      const { data, error } = await externalSupabase
        .from("v_ac_evolucion")
        .select("*")
        .order("fecha_inicio", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AcEvolucionRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
