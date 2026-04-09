import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import { FileText, ArrowRight, AlertTriangle, Clock, Archive } from "lucide-react";

interface Especial {
  id: string;
  titulo: string;
  descripcion: string;
  estado: "activo" | "reforzado" | "archivado";
  prioridad: "alta" | "media" | "baja";
  ultimaActualizacion: string;
  url: string;
  modulos: string[];
}

const especiales: Especial[] = [
  {
    id: "ayuso",
    titulo: "Especial Ayuso / Quirónsalud",
    descripcion: "Monitorización reputacional del caso Ayuso y su impacto en Quirónsalud. Incluye análisis de eventos, métricas emocionales, cobertura mediática, cascadas, señales sociales, hitos narrativos y evolución semanal.",
    estado: "activo",
    prioridad: "alta",
    ultimaActualizacion: "Actualización continua",
    url: "/dashboard/especiales/ayuso",
    modulos: ["Resumen", "Eventos", "Métricas", "Medios", "Cascadas", "Social", "Hitos", "Evolución"],
  },
];

const estadoBadge = (estado: Especial["estado"]) => {
  switch (estado) {
    case "activo":
      return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Activo</Badge>;
    case "reforzado":
      return <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 text-xs gap-1"><AlertTriangle className="h-3 w-3" /> Reforzado</Badge>;
    case "archivado":
      return <Badge className="bg-muted text-muted-foreground border-border text-xs gap-1"><Archive className="h-3 w-3" /> Archivado</Badge>;
  }
};

const prioridadBadge = (p: Especial["prioridad"]) => {
  switch (p) {
    case "alta": return <Badge variant="outline" className="text-xs text-red-400 border-red-600/30">Prioridad alta</Badge>;
    case "media": return <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-600/30">Prioridad media</Badge>;
    case "baja": return <Badge variant="outline" className="text-xs text-muted-foreground">Prioridad baja</Badge>;
  }
};

const EspecialesIndex = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Especiales</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Estudios monográficos de monitorización reputacional · {especiales.length} especial{especiales.length !== 1 ? "es" : ""}
      </p>
    </div>

    {/* Summary bar */}
    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        {especiales.filter(e => e.estado === "activo").length} activo{especiales.filter(e => e.estado === "activo").length !== 1 ? "s" : ""}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-orange-400" />
        {especiales.filter(e => e.estado === "reforzado").length} reforzado{especiales.filter(e => e.estado === "reforzado").length !== 1 ? "s" : ""}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
        {especiales.filter(e => e.estado === "archivado").length} archivado{especiales.filter(e => e.estado === "archivado").length !== 1 ? "s" : ""}
      </span>
    </div>

    {/* Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {especiales.map((e) => (
        <NavLink key={e.id} to={e.url} className="block group">
          <Card className={`border-border/50 hover:border-primary/40 transition-all h-full ${e.estado === "archivado" ? "opacity-60" : ""}`}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <h3 className="font-semibold text-foreground">{e.titulo}</h3>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {estadoBadge(e.estado)}
                  {prioridadBadge(e.prioridad)}
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{e.descripcion}</p>

              {/* Modules */}
              <div className="flex flex-wrap gap-1.5">
                {e.modulos.map(m => (
                  <span key={m} className="text-xs px-2 py-0.5 rounded bg-accent/50 text-muted-foreground">{m}</span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {e.ultimaActualizacion}
                </span>
                <span className="flex items-center gap-1 text-primary text-sm group-hover:underline">
                  Abrir <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </CardContent>
          </Card>
        </NavLink>
      ))}
    </div>

    {/* Placeholder for future specials */}
    {especiales.length < 3 && (
      <Card className="border-dashed border-border/40">
        <CardContent className="flex items-center justify-center py-12 text-center">
          <div>
            <p className="text-muted-foreground text-sm">Preparado para añadir nuevos especiales</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Los especiales se configuran desde Sistema → Configuración</p>
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);

export default EspecialesIndex;
