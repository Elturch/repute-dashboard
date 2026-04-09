import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

const Integridad = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Integridad</h1>
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">Integridad de datos</p>
        <p className="text-sm text-muted-foreground mt-1">Próximamente: Validaciones, auditoría de datos y estado de las integraciones</p>
      </CardContent>
    </Card>
  </div>
);

export default Integridad;
