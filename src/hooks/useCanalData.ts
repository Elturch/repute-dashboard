import { useQuery } from '@tanstack/react-query';
import { externalSupabase } from '@/integrations/external-supabase/client';

export type Canal = 'medios' | 'instagram' | 'tiktok' | 'facebook' | 'linkedin' | 'twitter' | 'mybusiness';

export interface VCanalRow {
  canal: Canal;
  id: string;
  fecha: string;
  titularidad: string | null;
  grupo_hospitalario: string | null;
  gestion_hospitalaria: string | null;
  gh_agrupado: string | null;
  titulo: string | null;
  texto: string | null;
  fuente: string | null;
  autor: string | null;
  imagen: string | null;
  url: string | null;
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
  idioma: string | null;
  pais: string | null;
}

export interface SegmentoFiltro {
  /** Igualdad o IN (array) sobre titularidad */
  titularidad?: string | string[];
  /** ILIKE pattern, p.ej. 'SERMAS%' */
  gestionLike?: string;
  /** Igualdad estricta sobre gestion_hospitalaria */
  gestionExacta?: string;
  /** Igualdad estricta sobre grupo_hospitalario */
  grupoHospitalario?: string;
}

export const VIEW_BY_CANAL: Record<Canal, string> = {
  medios:     'v_canal_medios',
  instagram:  'v_canal_instagram',
  tiktok:     'v_canal_tiktok',
  facebook:   'v_canal_facebook',
  linkedin:   'v_canal_linkedin',
  twitter:    'v_canal_twitter',
  mybusiness: 'v_canal_mybusiness',
};

export const ALL_CANALES: Canal[] = ['medios','instagram','tiktok','facebook','linkedin','twitter','mybusiness'];

/**
 * Hook genérico que lee una vista helper v_canal_<canal>.
 * Las vistas YA traen el filtro de 30d incorporado, así que NO añadimos gte de fecha.
 */
export function useCanalData(canal: Canal, segmento: SegmentoFiltro = {}) {
  return useQuery({
    queryKey: ['canal', canal, segmento],
    queryFn: async (): Promise<VCanalRow[]> => {
      let q = externalSupabase.from(VIEW_BY_CANAL[canal]).select('*');

      if (segmento.titularidad) {
        if (Array.isArray(segmento.titularidad)) {
          q = q.in('titularidad', segmento.titularidad);
        } else {
          q = q.eq('titularidad', segmento.titularidad);
        }
      }
      if (segmento.gestionLike) {
        q = q.ilike('gestion_hospitalaria', segmento.gestionLike);
      }
      if (segmento.gestionExacta) {
        q = q.eq('gestion_hospitalaria', segmento.gestionExacta);
      }
      if (segmento.grupoHospitalario) {
        q = q.eq('grupo_hospitalario', segmento.grupoHospitalario);
      }

      q = q.order('fecha', { ascending: false }).limit(2000);

      const { data, error } = await q;
      if (error) {
        console.error(`[useCanalData] ${canal}:`, error);
        throw error;
      }
      return (data ?? []) as VCanalRow[];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: 10 * 60 * 1000,
    refetchIntervalInBackground: true,
  });
}