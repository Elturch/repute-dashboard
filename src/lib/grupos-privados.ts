// src/lib/grupos-privados.ts
// Lista canónica de los 8 grupos hospitalarios privados que comparamos en el dashboard,
// y función para clasificar una mención (por su `termino`, `header` o `Tema`) en uno de ellos.

export type GrupoPrivado =
  | 'Quirónsalud'
  | 'HM Hospitales'
  | 'Sanitas'
  | 'Vithas'
  | 'Ribera Salud'
  | 'Viamed'
  | 'Hospiten'
  | 'HLA Hospitales';

export interface GrupoPrivadoConfig {
  nombre: GrupoPrivado;
  /** Color HSL para gráficas. Quirónsalud destacado, resto neutros. */
  color: string;
  /** Patrones (lowercase, sin acentos) que identifican al grupo en termino/header/Tema. */
  patrones: string[];
}

export const GRUPOS_PRIVADOS_8: GrupoPrivadoConfig[] = [
  {
    nombre: 'Quirónsalud',
    color: 'hsl(217, 91%, 60%)', // azul marca Quirónsalud
    patrones: [
      'quironsalud',
      'quirónsalud',
      'hospital la luz',
      'ruber internacional',
      'hospital dexeus',
      'centro teknon',
      'teknon',
      'hospital quironsalud',
      'hospital quirónsalud',
      'hospital sagrat cor',
      'hospital la zarzuela',
      'hospital la moraleja',
      'hospital virgen del mar',
      'hospital 9 de octubre',
      'xanit',
      'imske',
      'hospital cima',
      'clinica la milagrosa',
    ],
  },
  {
    nombre: 'HM Hospitales',
    color: 'hsl(0, 0%, 60%)',
    patrones: [
      'hm hospitales',
      'hm madrid',
      'hm sanchinarro',
      'hm montep',
      'hm nen',
      'hm nou delfos',
      'hm sant jordi',
      'hm malaga',
      'hm málaga',
      'hm santa elena',
    ],
  },
  {
    nombre: 'Sanitas',
    color: 'hsl(170, 50%, 50%)',
    patrones: ['sanitas'],
  },
  {
    nombre: 'Vithas',
    color: 'hsl(40, 70%, 55%)',
    patrones: [
      'vithas',
      'hospital universitario vithas aravaca',
      'hospital universitario vithas arturo soria',
      'hospital vithas sevilla',
      'hospital vithas barcelona',
    ],
  },
  {
    nombre: 'Ribera Salud',
    color: 'hsl(280, 40%, 55%)',
    patrones: ['ribera salud'],
  },
  {
    nombre: 'Viamed',
    color: 'hsl(140, 40%, 50%)',
    patrones: [
      'viamed',
      'hospital viamed fuensanta',
      'hospital viamed santa elena',
      'hospital viamed monegal',
      'hospital viamed fatima',
      'hospital viamed santa angela',
      'hospital fuensanta',
    ],
  },
  {
    nombre: 'Hospiten',
    color: 'hsl(15, 60%, 55%)',
    patrones: ['hospiten'],
  },
  {
    nombre: 'HLA Hospitales',
    color: 'hsl(195, 50%, 55%)',
    patrones: [
      'hla hospitales',
      'hla clinica',
      'hla hospital universitario moncloa',
      'hla clinica internacional barcelona',
      'hla clinica santa isabel',
      'hla hospital universitario el angel',
      'hla',
    ],
  },
];

/** Devuelve el `GrupoPrivado` que corresponde al texto, o null si ninguno matchea. */
export function getGrupoPrivadoFromTexto(texto: string | null | undefined): GrupoPrivado | null {
  if (!texto) return null;
  const t = texto.toLowerCase();
  for (const g of GRUPOS_PRIVADOS_8) {
    if (g.patrones.some(p => t.includes(p))) {
      return g.nombre;
    }
  }
  return null;
}

/** Mapa rápido nombre → color, útil para Recharts y demás. */
export const COLOR_POR_GRUPO: Record<GrupoPrivado, string> = GRUPOS_PRIVADOS_8.reduce(
  (acc, g) => ({ ...acc, [g.nombre]: g.color }),
  {} as Record<GrupoPrivado, string>,
);

/** Lista de los 8 nombres en orden canónico, útil para iterar en gráficas. */
export const NOMBRES_GRUPOS_PRIVADOS: GrupoPrivado[] = GRUPOS_PRIVADOS_8.map(g => g.nombre);