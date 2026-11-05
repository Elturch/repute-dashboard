import { describe, it, expect } from 'vitest';
import { pctRiesgoReal, contarLiderazgo, notaIAPonderada, fmtNotaIA, radarDomain } from './metricas';

describe('métricas unificadas', () => {
  it('radar redondea el mínimo hacia abajo y el máximo hacia arriba', () => {
    expect(radarDomain([4.8, 6.6, 6.7, 8.9])).toEqual([4, 9]);
    expect(radarDomain([5.2, 8.1])).toEqual([5, 9]);
  });

  it('radar nunca baja de 3 ni supera 10', () => {
    expect(radarDomain([1.2, 10.3])).toEqual([3, 10]);
  });

  it('radar garantiza amplitud mínima de 2 incluso cerca del techo', () => {
    expect(radarDomain([6.6, 6.7])).toEqual([6, 8]);
    expect(radarDomain([9.8, 9.9])).toEqual([8, 10]);
  });

  it('radar ignora datos ausentes y no finitos', () => {
    expect(radarDomain([null, undefined, NaN, Infinity, 5.2, 8.9])).toEqual([5, 9]);
    expect(radarDomain([])).toEqual([3, 9]);
  });
  it('riesgo real es porcentaje sobre menciones del mismo grupo', () => {
    expect(pctRiesgoReal(99, 100)).toBe(99);
    expect(pctRiesgoReal(2, 272)).toBeCloseTo(0.735, 2);
    expect(pctRiesgoReal(5, 0)).toBe(0);
  });

  it('QS lidera: positivas más alto, negativas más bajo', () => {
    const qs  = { afinidad: 8, fiabilidad: 7, admiracion: 6, impacto: 5, influencia: 4, preocupacion: 1, rechazo: 1, descredito: 3 };
    const ref = { afinidad: 7, fiabilidad: 6, admiracion: 7, impacto: 6, influencia: 5, preocupacion: 2, rechazo: 2, descredito: 2 };
    expect(contarLiderazgo(qs, ref)).toBe(4);
  });

  it('Nota IA ponderada por menciones con 1 decimal', () => {
    expect(notaIAPonderada([{ menciones: 300, notaMedia: 7 }, { menciones: 100, notaMedia: 5 }])).toBe(6.5);
    expect(fmtNotaIA(6.6666)).toBe('6.7');
  });
});
