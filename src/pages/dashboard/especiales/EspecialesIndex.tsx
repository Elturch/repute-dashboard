import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import { FileText, ArrowRight } from "lucide-react";

const especiales = [
  {
    id: "ayuso",
    titulo: "Especial Ayuso / Quirónsalud",
    descripcion: "Monitorización reputacional del caso Ayuso y su impacto en Quirónsalud. Incluye eventos, métricas emocionales, medios, cascadas mediáticas, señales sociales, hitos narrativos y evolución semanal.",
    estado: "activo",
    url: "/dashboard/especiales/ayuso",
  },
];

const EspecialesIndex = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Especiales</h1>
    <p className="text-sm text-muted-foreground">Estudios monográficos de monitorización reputacional</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {especiales.map((e) => (
        <NavLink key={e.id} to={e.url} className="block group">
          <Card className="border-border/50 hover:border-primary/40 transition-colors h-full">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{e.titulo}</h3>
                </div>
                <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">{e.estado}</Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{e.descripcion}</p>
              <div className="flex items-center gap-1 text-primary text-sm group-hover:underline">
                Abrir especial <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
        </NavLink>
      ))}
    </div>
  </div>
);

export default EspecialesIndex;
