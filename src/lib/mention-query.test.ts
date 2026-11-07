import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpc, query } = vi.hoisted(() => {
  const query = { select: vi.fn(), eq: vi.fn(), in: vi.fn(), ilike: vi.fn() };
  return { rpc: vi.fn(), query };
});
vi.mock('@/integrations/external-supabase/client', () => ({ externalSupabase: { rpc } }));
import { cleanMentionQuery } from './mention-query';

beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockReturnValue(query);
  Object.values(query).forEach(method => method.mockReturnValue(query));
});

describe('menciones limpias y segmento', () => {
  it('usa canal_items con las fechas seleccionadas, no una tabla cruda', () => {
    cleanMentionQuery('medios', '2026-11-01', '2026-11-07');
    expect(rpc).toHaveBeenCalledWith('canal_items', { p_canal: 'medios', p_desde: '2026-11-01', p_hasta: '2026-11-07' }, { count: 'exact' });
    expect(query.eq).not.toHaveBeenCalled();
    expect(query.ilike).not.toHaveBeenCalled();
  });
  it('privados mantiene la titularidad del KPI', () => {
    cleanMentionQuery('instagram', '2026-11-01', '2026-11-07', { titularidad: 'Privado' });
    expect(query.eq).toHaveBeenCalledWith('titularidad', 'Privado');
  });
  it.each(['Sanidad Pública AC', 'Sanidad Pública MC', 'Sanidad Pública BC'])('SERMAS respeta el nivel %s', titularidad => {
    cleanMentionQuery('medios', '2026-11-01', '2026-11-07', { titularidad });
    expect(query.eq).toHaveBeenCalledWith('titularidad', titularidad);
  });
  it('CATSALUT mantiene su segmento de gestión', () => {
    cleanMentionQuery('facebook', '2026-11-01', '2026-11-07', { gestionLike: 'CATSALUT%' });
    expect(query.ilike).toHaveBeenCalledWith('gestion_hospitalaria', 'CATSALUT%');
  });
  it('el hospital mantiene sus aliases dentro de su titularidad', () => {
    cleanMentionQuery('mybusiness', '2026-11-01', '2026-11-07', { titularidad: 'Sanidad Pública BC', grupos: ['Hospital Infanta Elena', 'Quirónsalud'] });
    expect(query.eq).toHaveBeenCalledWith('titularidad', 'Sanidad Pública BC');
    expect(query.in).toHaveBeenCalledWith('grupo_hospitalario', ['Hospital Infanta Elena', 'Quirónsalud']);
  });
});