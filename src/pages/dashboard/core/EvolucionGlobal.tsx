import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const EvolucionGlobal = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Evolución Histórica</h1>
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-24 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">Evolución histórica del ecosistema</p>
        <p className="text-sm text-muted-foreground mt-1">Próximamente: Series temporales globales de reputación Quirónsalud</p>
      </CardContent>
    </Card>
  </div>
);

export default EvolucionGlobal;
