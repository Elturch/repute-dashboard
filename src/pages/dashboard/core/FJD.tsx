import { Card, CardContent } from "@/components/ui/card";
import { Hospital } from "lucide-react";

const FJD = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Fundación Jiménez Díaz</h1>
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-24 text-center">
        <Hospital className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">Activo estratégico de Quirónsalud</p>
        <p className="text-sm text-muted-foreground mt-1">Próximamente: Monitorización específica de la FJD — noticias, reseñas y redes sociales</p>
      </CardContent>
    </Card>
  </div>
);

export default FJD;
