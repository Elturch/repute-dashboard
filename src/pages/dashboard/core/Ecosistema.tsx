import { Card, CardContent } from "@/components/ui/card";
import { Network } from "lucide-react";

const Ecosistema = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Ecosistema Hospitalario</h1>
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-24 text-center">
        <Network className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">Mapa del ecosistema hospitalario</p>
        <p className="text-sm text-muted-foreground mt-1">Próximamente: Visualización de la red de hospitales Quirónsalud, SERMAS, CatSalut y competidores</p>
      </CardContent>
    </Card>
  </div>
);

export default Ecosistema;
