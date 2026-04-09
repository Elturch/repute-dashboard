import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

const MediosGlobal = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Medios</h1>
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-24 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">Panorámica global de medios</p>
        <p className="text-sm text-muted-foreground mt-1">Próximamente: Cobertura mediática del ecosistema completo Quirónsalud</p>
      </CardContent>
    </Card>
  </div>
);

export default MediosGlobal;
