// src/lib/clasificacion.ts
// Tipos canónicos de clasificación de menciones según public.keywords (Tasklet-managed).
// Esta tabla es la fuente de verdad — lo que pongamos aquí debe coincidir con sus valores.

export type Titularidad =
  | 'Privado'
  | 'Sanidad Pública AC'   // Alta Complejidad
  | 'Sanidad Pública MC'   // Media Complejidad
  | 'Sanidad Pública BC'   // Básica Complejidad
  | 'Sanidad Pública Cataluña';

export type GestionHospitalaria =
  // Privados puros
  | 'Quirónsalud'
  | 'HM Hospitales'
  | 'Sanitas'
  | 'Vithas'
  | 'Ribera Salud'
  | 'Viamed'
  | 'Hospiten'
  | 'HLA Hospitales'
  // Públicos puros
  | 'SERMAS'
  | 'CATSALUT'
  // Gestión privada de hospital público (oro narrativo para Quirónsalud)
  | 'SERMAS - Quirónsalud (gestión)'
  | 'SERMAS - Ribera Salud (gestión)'
  | 'CATSALUT - Quirónsalud (concierto)';

/** 8 grupos hospitalarios privados que comparamos en el dashboard de privados. */
export type GrupoPrivado =
  | 'Quirónsalud'
  | 'HM Hospitales'
  | 'Sanitas'
  | 'Vithas'
  | 'Ribera Salud'
  | 'Viamed'
  | 'Hospiten'
  | 'HLA Hospitales';

export const NOMBRES_GRUPOS_PRIVADOS: GrupoPrivado[] = [
  'Quirónsalud',
  'HM Hospitales',
  'Sanitas',
  'Vithas',
  'Ribera Salud',
  'Viamed',
  'Hospiten',
  'HLA Hospitales',
];

/** Color de marca por grupo privado. Quirónsalud destacado, resto neutros con personalidad. */
export const COLOR_POR_GRUPO_PRIVADO: Record<GrupoPrivado, string> = {
  'Quirónsalud':    'hsl(217, 91%, 60%)', // azul corporativo Quirónsalud
  'HM Hospitales':  'hsl(0, 0%, 55%)',
  'Sanitas':        'hsl(170, 50%, 50%)',
  'Vithas':         'hsl(40, 70%, 55%)',
  'Ribera Salud':   'hsl(280, 40%, 55%)',
  'Viamed':         'hsl(140, 40%, 50%)',
  'Hospiten':       'hsl(15, 60%, 55%)',
  'HLA Hospitales': 'hsl(195, 50%, 55%)',
};

/** Bloque narrativo del dashboard al que pertenece una mención. */
export type BloqueDashboard =
  | 'privados'                  // 8 grupos privados puros
  | 'gestion_privada_publica'   // SERMAS/CATSALUT gestionados por una empresa privada
  | 'sermas_puro'               // SERMAS de gestión 100% pública
  | 'catsalut_puro';            // CATSALUT de gestión 100% pública

export function bloqueDashboardFromGestion(g: GestionHospitalaria | null | undefined): BloqueDashboard | null {
  if (!g) return null;
  if (g === 'SERMAS') return 'sermas_puro';
  if (g === 'CATSALUT') return 'catsalut_puro';
  if (g.includes('(gestión)') || g.includes('(concierto)')) return 'gestion_privada_publica';
  return 'privados';
}

/** Resultado de clasificar un texto contra `keywords`. */
export interface Clasificacion {
  termino: string;
  titularidad: Titularidad | null;
  grupoHospitalario: string | null; // p.ej. "Quirónsalud", "H. U. La Paz" o nombre individual
  gestionHospitalaria: GestionHospitalaria | null;
  ghAgrupado: boolean;
  ccaa: string | null;
  localidad: string | null;
  bloque: BloqueDashboard | null;
}