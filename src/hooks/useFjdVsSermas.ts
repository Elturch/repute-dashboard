import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";

export interface FjdVsSermasRow {
  segmento: string;
  canal: string;
  menciones: number | null;
  nota_media: number | null;
  afinidad: number | null;
  fiabilidad: number | null;
  admiracion: number | null;
  preocupacion: number | null;
  rechazo: number | null;
  peligro_real: number | null;
}

export function useFjdVsSermas() {
  return useQuery({
    queryKey: ["fjd-vs-sermas"],
    queryFn: async (): Promise<FjdVsSermasRow[]> => {
      const { data, error } = await externalSupabase
        .from("v_fjd_vs_sermas")
        .select("*");
      if (error) throw error;
      return (data ?? []) as FjdVsSermasRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
