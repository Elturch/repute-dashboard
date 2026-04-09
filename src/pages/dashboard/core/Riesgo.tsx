import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

const Riesgo = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Riesgo y Alertas</h1>
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">Panel de riesgo reputacional</p>
        <p className="text-sm text-muted-foreground mt-1">Próximamente: Alertas activas, cascadas, niveles de riesgo en tiempo real</p>
      </CardContent>
    </Card>
  </div>
);

export default Riesgo;
