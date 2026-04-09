import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CalendarIcon, X, ExternalLink, List, Clock, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Milestone {
  id: number;
  fecha: string;
  semana: string;
  tipo_hito: string;
  titulo: string;
  descripcion: string;
  impacto: string;
  medios_que_cubrieron: string[] | null;
  urls_referencia: string[] | null;
  detonante: string | null;
}

const TIPO_COLORS: Record<string, string> = {
  judicial: "bg-red-600/20 text-red-400 border-red-600/30",
  publicación: "bg-primary/20 text-primary border-primary/30",
  publicacion: "bg-primary/20 text-primary border-primary/30",
  político: "bg-orange-600/20 text-orange-400 border-orange-600/30",
  politico: "bg-orange-600/20 text-orange-400 border-orange-600/30",
  social: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
  empresarial: "bg-purple-600/20 text-purple-400 border-purple-600/30",
  financiero: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
};

function tipoBadge(t: string) {
  const cls = TIPO_COLORS[t.toLowerCase()] ?? "bg-muted text-muted-foreground border-border";
  return <Badge className={cn(cls, "text-xs")}>{t}</Badge>;
}

function impactoBadge(i: string) {
  const il = (i ?? "").toLowerCase();
  if (il === "alto") return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">Alto</Badge>;
  if (il === "medio") return <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-xs">Medio</Badge>;
  return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">Bajo</Badge>;
}

function impactoDotColor(i: string): string {
  const il = (i ?? "").toLowerCase();
  if (il === "alto") return "bg-red-500 shadow-red-500/40";
  if (il === "medio") return "bg-orange-500 shadow-orange-500/40";
  return "bg-emerald-500 shadow-emerald-500/40";
}

function impactoBorderColor(i: string): string {
  const il = (i ?? "").toLowerCase();
  if (il === "alto") return "border-red-500/50 border-2";
  if (il === "medio") return "border-orange-500/30";
  return "border-border/50";
}

type SortKey = "fecha" | "semana" | "tipo_hito" | "titulo" | "impacto";

const Hitos = () => {
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [impactoFilter, setImpactoFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [sortKey, setSortKey] = useState<SortKey>("fecha");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ["narrative_milestones"],
    queryFn: async () => {
      const { data, error } = await externalSupabase
        .from("narrative_milestones")
        .select("*")
        .eq("scenario_id", "quironsalud_ayuso")
        .order("fecha", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Milestone[];
    },
  });

  const tipos = useMemo(() => [...new Set(milestones.map((m) => m.tipo_hito).filter(Boolean))].sort(), [milestones]);

  const filtered = useMemo(() => {
    let result = [...milestones];
    if (tipoFilter !== "all") result = result.filter((m) => m.tipo_hito === tipoFilter);
    if (impactoFilter !== "all") result = result.filter((m) => (m.impacto ?? "").toLowerCase() === impactoFilter.toLowerCase());
    if (dateFrom) result = result.filter((m) => new Date(m.fecha) >= dateFrom);
    if (dateTo) {
      const end = new Date(dateTo); end.setHours(23, 59, 59);
      result = result.filter((m) => new Date(m.fecha) <= end);
    }
    if (viewMode === "table") {
      result.sort((a, b) => {
        let va: any = a[sortKey]; let vb: any = b[sortKey];
        if (typeof va === "string") { va = va.toLowerCase(); vb = (vb ?? "").toLowerCase(); }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [milestones, tipoFilter, impactoFilter, dateFrom, dateTo, viewMode, sortKey, sortDir]);

  // Type summary
  const typeSummary = useMemo(() => {
    const map: Record<string, { total: number; alto: number }> = {};
    milestones.forEach((m) => {
      if (!map[m.tipo_hito]) map[m.tipo_hito] = { total: 0, alto: 0 };
      map[m.tipo_hito].total++;
      if ((m.impacto ?? "").toLowerCase() === "alto") map[m.tipo_hito].alto++;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [milestones]);

  const clearFilters = () => { setTipoFilter("all"); setImpactoFilter("all"); setDateFrom(undefined); setDateTo(undefined); };
  const hasFilters = tipoFilter !== "all" || impactoFilter !== "all" || dateFrom || dateTo;

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Hitos Narrativos</h1>
        <div className="flex gap-2">
          <Button variant={viewMode === "timeline" ? "default" : "outline"} size="sm" onClick={() => setViewMode("timeline")}>
            <Clock className="h-4 w-4 mr-1" /> Timeline
          </Button>
          <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
            <List className="h-4 w-4 mr-1" /> Tabla
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {tipos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={impactoFilter} onValueChange={setImpactoFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Impacto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
              <SelectItem value="medio">Medio</SelectItem>
              <SelectItem value="bajo">Bajo</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[130px] justify-start text-left text-xs", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="mr-1 h-3 w-3" />{dateFrom ? format(dateFrom, "dd/MM/yy") : "Desde"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[130px] justify-start text-left text-xs", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="mr-1 h-3 w-3" />{dateTo ? format(dateTo, "dd/MM/yy") : "Hasta"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" /> Limpiar
            </Button>
          )}
          <span className="text-sm text-muted-foreground ml-auto">{filtered.length} hitos encontrados</span>
        </div>
      </Card>

      {/* Type summary */}
      {typeSummary.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {typeSummary.map(([tipo, v]) => (
            <Card key={tipo} className="border-border/50 flex-1 min-w-[140px]">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between mb-1">{tipoBadge(tipo)}</div>
                <p className="text-2xl font-bold text-foreground">{v.total}</p>
                {v.alto > 0 && <p className="text-xs text-red-400">{v.alto} de impacto alto</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? <Skeleton className="h-96 w-full" /> : viewMode === "timeline" ? (
        /* Timeline */
        <div className="relative">
          {/* Central line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 hidden md:block" />
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border md:hidden" />

          <div className="space-y-8">
            {filtered.map((m, i) => {
              const isLeft = i % 2 === 0;
              const isAlto = (m.impacto ?? "").toLowerCase() === "alto";
              return (
                <div key={m.id} className="relative">
                  {/* Dot */}
                  <div className={cn(
                    "absolute w-4 h-4 rounded-full shadow-lg z-10",
                    impactoDotColor(m.impacto),
                    "left-[18px] md:left-1/2 md:-translate-x-1/2 top-6"
                  )} />

                  {/* Date badge on line */}
                  <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0">
                    <Badge variant="outline" className="text-xs bg-background">{(() => { try { const d = new Date(m.fecha); return isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy"); } catch { return "—"; } })()}</Badge>
                  </div>

                  {/* Card */}
                  <div className={cn(
                    "ml-12 md:ml-0 md:w-[calc(50%-40px)]",
                    isLeft ? "md:mr-auto md:pr-0" : "md:ml-auto md:pl-0"
                  )}>
                    <Card className={cn("border-border/50", impactoBorderColor(m.impacto), isAlto && "shadow-md")}>
                      <CardContent className={cn("pt-4 pb-4 space-y-2", isAlto ? "px-5" : "px-4")}>
                        {/* Mobile date */}
                        <div className="flex items-center gap-2 md:hidden">
                          <Badge variant="outline" className="text-xs">{(() => { try { const d = new Date(m.fecha); return isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy"); } catch { return "—"; } })()}</Badge>
                          <span className="text-xs text-muted-foreground">{m.semana}</span>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <h3 className={cn("font-semibold text-foreground leading-snug", isAlto ? "text-base" : "text-sm")}>{m.titulo}</h3>
                          <div className="flex gap-1 flex-shrink-0">
                            {tipoBadge(m.tipo_hito)}
                            {impactoBadge(m.impacto)}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground hidden md:block">{m.semana}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{m.descripcion}</p>

                        {m.detonante && (
                          <p className="text-sm text-foreground/80 italic">
                            <span className="text-muted-foreground not-italic text-xs font-medium">Detonante: </span>{m.detonante}
                          </p>
                        )}

                        {(m.medios_que_cubrieron ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {m.medios_que_cubrieron!.map((medio, j) => (
                              <Badge key={j} variant="outline" className="text-[10px]">{medio}</Badge>
                            ))}
                          </div>
                        )}

                        {(m.urls_referencia ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {m.urls_referencia!.map((url, j) => (
                              <a key={j} href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs inline-flex items-center gap-0.5">
                                Ver fuente {j + 1} <ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table view */
        <Card className="border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {([["Fecha", "fecha"], ["Semana", "semana"], ["Tipo", "tipo_hito"], ["Título", "titulo"], ["Impacto", "impacto"]] as [string, SortKey][]).map(([label, k]) => (
                    <TableHead key={k} className="text-xs cursor-pointer select-none" onClick={() => toggleSort(k)}>
                      <span className="inline-flex items-center gap-1">{label} <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                    </TableHead>
                  ))}
                  <TableHead className="text-xs">Medios</TableHead>
                  <TableHead className="text-xs">Detonante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs whitespace-nowrap">{(() => { try { const d = new Date(m.fecha); return isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy"); } catch { return "—"; } })()}</TableCell>
                    <TableCell className="text-xs">{m.semana}</TableCell>
                    <TableCell>{tipoBadge(m.tipo_hito)}</TableCell>
                    <TableCell className="text-sm font-medium max-w-[300px]">{m.titulo}</TableCell>
                    <TableCell>{impactoBadge(m.impacto)}</TableCell>
                    <TableCell className="text-xs">{(m.medios_que_cubrieron ?? []).length}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{m.detonante ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Hitos;
