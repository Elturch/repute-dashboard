import type { KpiRow } from '@/hooks/useKpiCanal';

export type NivelId = 'alta' | 'media' | 'baja';

export interface HospitalDestacado {
  /** Nombre canónico mostrado (y usado como grupo tras normalizar). */
  nombre: string;
  short: string;
  slug: string;
  /** Valores de grupo_hospitalario en la base que corresponden a este hospital. */
  aliases: string[];
}

export interface NivelConfig {
  id: NivelId;
  titularidad: string;
  label: string;        // "Alta complejidad"
  menu: string;         // "Hospitales alta complejidad"
  destacados: HospitalDestacado[];
}

export const NIVELES: Record<NivelId, NivelConfig> = {
  alta: {
    id: 'alta', titularidad: 'Sanidad Pública AC', label: 'Alta complejidad', menu: 'Hospitales alta complejidad',
    destacados: [{ nombre: 'Hospital Fundación Jiménez Díaz', short: 'FJD', slug: 'fjd', aliases: ['Hospital Fundación Jiménez Díaz', 'Fundación Jiménez Díaz'] }],
  },
  media: {
    id: 'media', titularidad: 'Sanidad Pública MC', label: 'Media complejidad', menu: 'Hospitales media complejidad',
    destacados: [
      { nombre: 'H. Rey Juan Carlos', short: 'HURJC', slug: 'hurjc', aliases: ['H. Rey Juan Carlos', 'Hospital Rey Juan Carlos'] },
      { nombre: 'Hospital General de Villalba', short: 'HUGV', slug: 'hugv', aliases: ['Hospital General de Villalba', 'H. General de Villalba'] },
    ],
  },
  baja: {
    id: 'baja', titularidad: 'Sanidad Pública BC', label: 'Baja complejidad', menu: 'Hospitales baja complejidad',
    // En BC la base etiqueta las menciones de Infanta Elena como grupo 'Quirónsalud'.
    destacados: [{ nombre: 'Hospital Infanta Elena', short: 'HUIE', slug: 'huie', aliases: ['Hospital Infanta Elena', 'H. Infanta Elena', 'H.U. Infanta Elena', 'Quirónsalud'] }],
  },
};

export function isNivelId(x: string | undefined): x is NivelId {
  return x === 'alta' || x === 'media' || x === 'baja';
}

/** Nombre canónico de un grupo_hospitalario dentro del nivel. */
export function canonGrupo(nivel: NivelConfig, grupo: string | null): string | null {
  if (!grupo) return grupo;
  const d = nivel.destacados.find(h => h.aliases.includes(grupo));
  if (d) return d.nombre;
  if (grupo === 'Quirónsalud') return 'Quirónsalud (gestión, sin hospital asignado)';
  return grupo;
}

/** Filas del nivel (titularidad) con grupo normalizado. */
export function rowsNivel(rows: KpiRow[], nivel: NivelConfig): KpiRow[] {
  return rows
    .filter(r => r.titularidad === nivel.titularidad)
    .map(r => ({ ...r, grupo_hospitalario: canonGrupo(nivel, r.grupo_hospitalario) }));
}

/** Hospitales presentes en las filas, ordenados por menciones (desc). */
export function hospitalesOrdenados(rows: KpiRow[], incluir: string[] = []): string[] {
  const m = new Map<string, number>();
  incluir.forEach(n => m.set(n, 0));
  for (const r of rows) if (r.grupo_hospitalario) m.set(r.grupo_hospitalario, (m.get(r.grupo_hospitalario) ?? 0) + (r.menciones ?? 0));
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([g]) => g);
}
