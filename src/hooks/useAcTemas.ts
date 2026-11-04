import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";

export type AcTemaRow = {
  grupo_hospitalario: string;
  es_qs_gestion: boolean;
  tema: string;
  menciones: number;
  nota: number;
  peligro_alto: number;
};

export function useAcTemas() {
  return useQuery({
    queryKey: ["ac_temas"],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from("v_ac_temas")
        .select("*")
        .order("menciones", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AcTemaRow[];
    },
    staleTime: 10 * 60 * 1000,
  });
}
