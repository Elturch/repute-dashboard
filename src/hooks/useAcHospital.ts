import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";

export interface AcHospitalRow {
  grupo_hospitalario: string;
  gestion_hospitalaria: string | null;
  es_qs_gestion: boolean | null;
  canal: string | null;
  menciones: number | null;
  nota_media: number | null;
  afinidad: number | null;
  fiabilidad: number | null;
  preocupacion: number | null;
  peligro_alto_pct: number | null;
}

export function useAcHospital() {
  return useQuery({
    queryKey: ["ac-hospital"],
    queryFn: async (): Promise<AcHospitalRow[]> => {
      const { data, error } = await externalSupabase
        .from("v_ac_hospital")
        .select("*");
      if (error) throw error;
      return (data ?? []) as AcHospitalRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
