import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalLink, ImageOff, Filter, X } from 'lucide-react';

export interface MencionesConfig {
  tabla: string;
  campoFecha: string;
  campoTitulo?: string;
  campoSnippet: string;
  campoImagen?: string;
  campoMedio: string;
  campoUrl: string;
  campoPeligro: string;
  /** Filtros adicionales con .eq */
  filtros?: { campo: string; valor: string }[];
}

const PAGE_SIZE = 20;

const RIESGO_OPCIONES: { label: string; value: string }[] = [
  { label: 'Todos los riesgos', value: '' },
  { label: 'Crítico',           value: 'critico' },
  { label: 'Alto',              value: 'alto' },
  { label: 'Medio',             value: 'medio' },
  { label: 'Bajo',              value: 'bajo' },
  { label: 'Sin riesgo',        value: 'sin riesgo' },
];

function fmtFecha(d: string | null): string {
  if (!d) return '—';
  try { return format(new Date(d), "d MMM yyyy 'a las' HH:mm", { locale: es }); }
  catch { return d; }
}

function peligroColor(p: string | null | undefined): string {
  if (!p) return '#6b7280';
  const x = p.toLowerCase();
  if (x.includes('crit') || x.includes('alto')) return '#ef4444';
  if (x.includes('medio')) return '#f59e0b';
  if (x.includes('bajo')) return '#10b981';
  return '#9ca3af';
}

interface FetchOpts { riesgo: string; medio: string }

async function fetchPage(cfg: MencionesConfig, pageParam: number, opts: FetchOpts) {
  const fields: string[] = [cfg.campoFecha, cfg.campoSnippet, cfg.campoMedio, cfg.campoUrl, cfg.campoPeligro];
  if (cfg.campoTitulo) fields.push(cfg.campoTitulo);
  if (cfg.campoImagen) fields.push(cfg.campoImagen);
  const uniqueFields = [...new Set(fields)].map(f => `"${f}"`).join(', ');

  let q = externalSupabase
    .from(cfg.tabla)
    .select(uniqueFields)
    .order(cfg.campoFecha, { ascending: false, nullsFirst: false })
    .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

  if (cfg.filtros) cfg.filtros.forEach(f => { q = q.eq(f.campo, f.valor); });
  if (opts.riesgo) q = q.ilike(cfg.campoPeligro, `%${opts.riesgo}%`);
  if (opts.medio)  q = q.ilike(cfg.campoMedio,   `%${opts.medio}%`);

  const { data, error } = await q;
  if (error) {
    console.error('[MencionesRecientes]', error);
    return [];
  }
  return ((data ?? []) as unknown) as Record<string, unknown>[];
}

export default function MencionesRecientes({ cfg, contextLabel }: { cfg: MencionesConfig; contextLabel?: string }) {
  const [riesgo, setRiesgo] = useState('');
  const [medioInput, setMedioInput] = useState('');
  const [medio, setMedio] = useState('');

  // Debounce del input de medio (400ms)
  useEffect(() => {
    const t = setTimeout(() => setMedio(medioInput), 400);
    return () => clearTimeout(t);
  }, [medioInput]);

  const { data, fetchNextPage, hasNextPage, isFetching, isLoading } = useInfiniteQuery({
    queryKey: ['menciones', cfg.tabla, JSON.stringify(cfg.filtros ?? []), riesgo, medio],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchPage(cfg, pageParam as number, { riesgo, medio }),
    getNextPageParam: (lastPage, allPages) => lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const items = data?.pages.flat() ?? [];
  const hayFiltros = !!riesgo || !!medio;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
          Menciones recientes{contextLabel ? ` · ${contextLabel}` : ''}
        </h2>
        {hayFiltros && (
          <button
            type="button"
            onClick={() => { setRiesgo(''); setMedioInput(''); setMedio(''); }}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#9ca3af] hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
          <select
            value={riesgo}
            onChange={(e) => setRiesgo(e.target.value)}
            className="appearance-none bg-white/[0.03] border border-white/10 rounded-md pl-9 pr-9 py-2.5 text-sm text-[#e5e7eb] focus:outline-none focus:border-[#3b82f6]/50 cursor-pointer min-w-[180px]"
          >
            {RIESGO_OPCIONES.map(o => (
              <option key={o.value} value={o.value} className="bg-[#0a0a0a] text-[#e5e7eb]">{o.label}</option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none text-xs">▾</span>
        </div>

        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={medioInput}
            onChange={(e) => setMedioInput(e.target.value)}
            placeholder="Filtrar por fuente (medio, usuario…)"
            className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3.5 py-2.5 text-sm text-[#e5e7eb] placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6]/50"
          />
          {medioInput && (
            <button
              type="button"
              onClick={() => { setMedioInput(''); setMedio(''); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isFetching && !isLoading && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
            Filtrando…
          </span>
        )}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
          Cargando menciones…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          {hayFiltros ? 'No hay menciones que cumplan los filtros.' : 'No hay menciones para mostrar.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((m, i) => <MencionCard key={i} m={m} cfg={cfg} />)}
        </ul>
      )}

      {hasNextPage && !isLoading && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetching}
            className="px-6 py-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-sm uppercase tracking-wider text-[#d1d5db] disabled:opacity-40"
          >
            {isFetching ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}
    </section>
  );
}

function MencionCard({ m, cfg }: { m: Record<string, unknown>; cfg: MencionesConfig }) {
  const [imgError, setImgError] = useState(false);
  const titulo = cfg.campoTitulo ? (m[cfg.campoTitulo] as string | null) : null;
  const snippet = m[cfg.campoSnippet] as string | null;
  const imagen = cfg.campoImagen ? (m[cfg.campoImagen] as string | null) : null;
  const medio = m[cfg.campoMedio] as string | null;
  const url = m[cfg.campoUrl] as string | null;
  const peligro = m[cfg.campoPeligro] as string | null;
  const fecha = m[cfg.campoFecha] as string | null;
  const peligroC = peligroColor(peligro);

  return (
    <li className="flex gap-4 rounded-lg border border-border bg-card p-4 hover:bg-white/[0.02] transition-colors">
      {/* Imagen */}
      {cfg.campoImagen && (
        <div className="flex-shrink-0 w-32 h-24 rounded-md overflow-hidden bg-muted flex items-center justify-center">
          {imagen && !imgError ? (
            <img
              src={imagen}
              alt={titulo ?? ''}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <ImageOff className="w-6 h-6 text-muted-foreground/40" />
          )}
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {titulo && (
          <h3 className="font-semibold text-foreground line-clamp-2 leading-snug">{titulo}</h3>
        )}
        {snippet && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">{snippet}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
          {medio && (
            <span className="font-semibold text-foreground/80">{medio}</span>
          )}
          {medio && <span>·</span>}
          <span>{fmtFecha(fecha)}</span>
          {peligro && (
            <>
              <span>·</span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold"
                style={{ backgroundColor: `${peligroC}20`, color: peligroC, border: `1px solid ${peligroC}40` }}
              >
                {peligro}
              </span>
            </>
          )}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
