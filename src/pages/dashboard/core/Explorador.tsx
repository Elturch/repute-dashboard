import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ExternalLink, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { riesgoBadgeVariant } from "@/lib/data-aggregation";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { safeFormat } from "@/lib/safe-format";

const PAGE_SIZE = 50;

interface ExplorerRow {
  id: number | string;
  fecha: string | null;
  canal: string | null;
  grupo_hospitalario: string | null;
  gestion_hospitalaria: string | null;
  titularidad: string | null;
  termino: string | null;
  texto: string | null;
  url: string | null;
  nota_media: number | null;
  peligro_reputacional: string | null;
  afinidad: number | null;
}

const CHANNEL_LABELS: Record<string, string> = {
  medios: "Medios", noticias: "Noticias", facebook: "Facebook", instagram: "Instagram",
  tiktok: "TikTok", twitter: "X / Twitter", linkedin: "LinkedIn", mybusiness: "Reseñas Google",
};

const CHANNEL_OPTIONS = ["medios", "tiktok", "instagram", "twitter", "facebook", "linkedin", "mybusiness"];

const TITULARIDAD_OPTIONS = [
  "Privado",
  "Sanidad Pública AC",
  "Sanidad Pública MC",
  "Sanidad Pública BC",
  "Sanidad Pública Cataluña",
];

/** Escapa caracteres que rompen la sintaxis del filtro `or` de PostgREST. */
function sanitizeQuery(q: string): string {
  return q.replace(/[,()*\\]/g, " ").trim();
}

interface Filters {
  search: string;
  canal: string;
  titularidad: string;
  peligro: string;
  from?: string;
  to?: string;
}

function buildQuery(f: Filters) {
  let query = externalSupabase
    .from("v_explorador")
    .select("*", { count: "exact" })
    .order("fecha", { ascending: false });

  const q = sanitizeQuery(f.search);
  if (q) query = query.or(`texto.ilike.%${q}%,termino.ilike.%${q}%`);
  if (f.canal !== "all") query = query.eq("canal", f.canal);
  if (f.titularidad !== "all") query = query.eq("titularidad", f.titularidad);
  if (f.peligro === "alto") query = query.or("peligro_reputacional.ilike.%alto%,peligro_reputacional.ilike.%crit%");
  else if (f.peligro === "medio") query = query.ilike("peligro_reputacional", "%medio%");
  else if (f.peligro === "bajo") query = query.ilike("peligro_reputacional", "%bajo%");
  if (f.from) query = query.gte("fecha", f.from);
  if (f.to) query = query.lte("fecha", f.to);

  return query;
}

function useExplorerPage(filters: Filters, page: number) {
  return useQuery<{ rows: ExplorerRow[]; count: number }>({
    queryKey: ["explorador", filters, page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const { data, error, count } = await buildQuery(filters).range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { rows: (data ?? []) as ExplorerRow[], count: count ?? 0 };
    },
    staleTime: 60 * 1000,
  });
}

/** Rango de fechas del corpus completo (min y max). */
function useCorpusRange() {
  return useQuery<{ min: string | null; max: string | null }>({
    queryKey: ["explorador_corpus_range"],
    queryFn: async () => {
      const [maxRes, minRes] = await Promise.all([
        externalSupabase.from("v_explorador").select("fecha").order("fecha", { ascending: false }).limit(1),
        externalSupabase.from("v_explorador").select("fecha").order("fecha", { ascending: true }).limit(1),
      ]);
      return {
        max: (maxRes.data?.[0] as { fecha: string } | undefined)?.fecha ?? null,
        min: (minRes.data?.[0] as { fecha: string } | undefined)?.fecha ?? null,
      };
    },
    staleTime: 30 * 60 * 1000,
  });
}

const Explorador = () => {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [canal, setCanal] = useState("all");
  const [titularidad, setTitularidad] = useState("all");
  const [peligro, setPeligro] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const [page, setPage] = useState(0);
  const [accumulated, setAccumulated] = useState<ExplorerRow[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const filters: Filters = useMemo(() => ({
    search: debounced,
    canal,
    titularidad,
    peligro,
    from: dateFrom ? dateFrom.toISOString() : undefined,
    to: dateTo ? new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() : undefined,
  }), [debounced, canal, titularidad, peligro, dateFrom, dateTo]);

  // Reset de paginación al cambiar cualquier filtro
  useEffect(() => {
    setPage(0);
    setAccumulated([]);
  }, [filters]);

  const { data, isLoading, isFetching } = useExplorerPage(filters, page);
  const { data: corpus } = useCorpusRange();

  useEffect(() => {
    if (!data) return;
    setAccumulated(prev => (page === 0 ? data.rows : [...prev, ...data.rows]));
  }, [data, page]);

  const total = data?.count ?? 0;
  const rows = page === 0 && accumulated.length === 0 ? (data?.rows ?? []) : accumulated;
  const hasMore = rows.length < total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Explorador de menciones · {isLoading ? "…" : total.toLocaleString("es-ES")} resultados
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Corpus completo{corpus?.min && corpus?.max
            ? ` · ${safeFormat(corpus.min, "dd MMM yyyy")} – ${safeFormat(corpus.max, "dd MMM yyyy")}`
            : ""} · filtrado en servidor, paginación real de {PAGE_SIZE} en {PAGE_SIZE}
        </p>
      </div>

      {/* Filtros */}
      <Card className="border-border/50">
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en el texto o el término..."
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={canal} onValueChange={setCanal}>
              <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Canal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los canales</SelectItem>
                {CHANNEL_OPTIONS.map(ch => (
                  <SelectItem key={ch} value={ch}>{CHANNEL_LABELS[ch] ?? ch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={titularidad} onValueChange={setTitularidad}>
              <SelectTrigger className="w-[200px] h-9 text-xs"><SelectValue placeholder="Titularidad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda titularidad</SelectItem>
                {TITULARIDAD_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={peligro} onValueChange={setPeligro}>
              <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Peligro" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo peligro</SelectItem>
                <SelectItem value="alto">Alto / Crítico</SelectItem>
                <SelectItem value="medio">Medio</SelectItem>
                <SelectItem value="bajo">Bajo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DateRangeFilter from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Mostrando {rows.length.toLocaleString("es-ES")} de {total.toLocaleString("es-ES")} coincidencias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && rows.length === 0 ? (
            <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Sin coincidencias para estos filtros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-2 text-muted-foreground">Fecha</th>
                    <th className="text-left py-2 px-2 text-muted-foreground">Texto</th>
                    <th className="text-left py-2 px-2 text-muted-foreground">Canal</th>
                    <th className="text-left py-2 px-2 text-muted-foreground">Grupo</th>
                    <th className="text-left py-2 px-2 text-muted-foreground">Término</th>
                    <th className="text-right py-2 px-2 text-muted-foreground">Nota</th>
                    <th className="text-center py-2 px-2 text-muted-foreground">Peligro</th>
                    <th className="text-center py-2 px-2 text-muted-foreground">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m, i) => (
                    <tr key={`${m.id}-${i}`} className="border-b border-border/10 hover:bg-muted/20">
                      <td className="py-1.5 px-2 text-muted-foreground whitespace-nowrap">{safeFormat(m.fecha, "dd/MM/yy")}</td>
                      <td className="py-1.5 px-2 text-foreground max-w-[420px]" title={m.texto ?? ""}>
                        {m.texto ? (m.texto.length > 80 ? m.texto.slice(0, 80) + "…" : m.texto) : "—"}
                      </td>
                      <td className="py-1.5 px-2">
                        <Badge variant="outline" className="text-[9px]">{CHANNEL_LABELS[m.canal ?? ""] ?? m.canal ?? "—"}</Badge>
                      </td>
                      <td className="py-1.5 px-2 text-muted-foreground max-w-[140px] truncate" title={m.grupo_hospitalario ?? ""}>
                        {m.grupo_hospitalario ?? "—"}
                      </td>
                      <td className="py-1.5 px-2 text-muted-foreground max-w-[120px] truncate" title={m.termino ?? ""}>
                        {m.termino ?? "—"}
                      </td>
                      <td className={`text-right py-1.5 px-2 font-mono ${(m.nota_media ?? 0) >= 7 ? "text-green-400" : (m.nota_media ?? 0) >= 5 ? "text-yellow-400" : "text-red-400"}`}>
                        {m.nota_media != null ? Number(m.nota_media).toFixed(1) : "—"}
                      </td>
                      <td className="text-center py-1.5 px-2">
                        {m.peligro_reputacional ? (
                          <Badge variant={riesgoBadgeVariant(m.peligro_reputacional)} className="text-[9px]">
                            {m.peligro_reputacional}
                          </Badge>
                        ) : "—"}
                      </td>
                      <td className="text-center py-1.5 px-2">
                        {m.url ? (
                          <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                            <ExternalLink className="h-3.5 w-3.5 inline" />
                          </a>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" size="sm" disabled={isFetching} onClick={() => setPage(p => p + 1)}>
                    {isFetching ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : null}
                    Cargar más ({(total - rows.length).toLocaleString("es-ES")} restantes)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Explorador;
