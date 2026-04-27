import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";

export type FJDCanal =
  | "medios"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "mybusiness";

export interface FJDMencion {
  canal: FJDCanal;
  id: string;
  titulo: string | null;
  texto: string | null;
  fuente: string | null;
  autor: string | null;
  imagen: string | null;
  url: string | null;
  fecha: string;
  peligro: string | null;
  nota_media: number | null;
  preocupacion: number | null;
  rechazo: number | null;
  descredito: number | null;
  afinidad: number | null;
  fiabilidad: number | null;
  admiracion: number | null;
  impacto: number | null;
  influencia: number | null;
  rating?: number | null;
}

export function useFJDMenciones() {
  return useQuery({
    queryKey: ["fjd-menciones"],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from("v_fjd_menciones")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FJDMencion[];
    },
    staleTime: 5 * 60 * 1000,
  });
}