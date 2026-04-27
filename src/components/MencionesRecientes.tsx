import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { externalSupabase } from '@/integrations/external-supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalLink, ImageOff } from 'lucide-react';

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

async function fetchPage(cfg: MencionesConfig, pageParam: number) {
  const fields: string[] = [cfg.campoFecha, cfg.campoSnippet, cfg.campoMedio, cfg.campoUrl, cfg.campoPeligro];
  if (cfg.campoTitulo) fields.push(cfg.campoTitulo);
  if (cfg.campoImagen) fields.push(cfg.campoImagen);
  const uniqueFields = [...new Set(fields)].map(f => `"${f}"`).join(', ');

  let q = externalSupabase
    .from(cfg.tabla)
    .select(uniqueFields)
    .order(cfg.campoFecha, { ascending: false, nullsFirst: false })
    .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

  if (cfg.filtros) {
    cfg.filtros.forEach(f => { q = q.eq(f.campo, f.valor); });
  }

  const { data, error } = await q;
  if (error) {
    console.error('[MencionesRecientes]', error);
    return [];
  }
  return (data ?? []) as Record<string, unknown>[];
}

export default function MencionesRecientes({ cfg, contextLabel }: { cfg: MencionesConfig; contextLabel?: string }) {
  const { data, fetchNextPage, hasNextPage, isFetching, isLoading } = useInfiniteQuery({
    queryKey: ['menciones', cfg.tabla, cfg.filtros?.map(f => `${f.campo}=${f.valor}`).join('|') ?? ''],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchPage(cfg, pageParam as number),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const items = data?.pages.flat() ?? [];

  return (
    <section className="space-y-4">
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
        Menciones recientes{contextLabel ? ` · ${contextLabel}` : ''}
      </h2>

      {isLoading ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
          Cargando menciones…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          No hay menciones para mostrar.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((m, i) => (
            <MencionCard key={i} m={m} cfg={cfg} />
          ))}
        </ul>
      )}

      {hasNextPage && (
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
