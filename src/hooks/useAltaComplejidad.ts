import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";

export interface AltaComplejidadRow {
  grupo_hospitalario: string;
  canal: string | null;
  menciones: number | null;
  nota_media: number | null;
  afinidad: number | null;
  fiabilidad: number | null;
  admiracion: number | null;
  preocupacion: number | null;
  rechazo: number | null;
  peligro_real: number | null;
}

export function useAltaComplejidad() {
  return useQuery({
    queryKey: ["kpi-alta-complejidad"],
    queryFn: async (): Promise<AltaComplejidadRow[]> => {
      const { data, error } = await externalSupabase
        .from("v_kpi_alta_complejidad")
        .select("*");
      if (error) throw error;
      return (data ?? []) as AltaComplejidadRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
