import { Card, CardContent } from "@/components/ui/card";
import { Radio } from "lucide-react";

const Canales = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Canales</h1>
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-24 text-center">
        <Radio className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">Análisis por canal de comunicación</p>
        <p className="text-sm text-muted-foreground mt-1">Próximamente: Prensa, redes sociales, Google My Business — visión transversal</p>
      </CardContent>
    </Card>
  </div>
);

export default Canales;
