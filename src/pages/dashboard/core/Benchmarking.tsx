import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const Benchmarking = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Benchmarking</h1>
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-24 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">Comparativa entre grupos hospitalarios</p>
        <p className="text-sm text-muted-foreground mt-1">Próximamente: Quirónsalud vs competidores en métricas clave</p>
      </CardContent>
    </Card>
  </div>
);

export default Benchmarking;
