import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

const Explorador = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Explorador Analítico</h1>
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-24 text-center">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">Exploración libre de datos</p>
        <p className="text-sm text-muted-foreground mt-1">Próximamente: Consultas cruzadas sobre noticias, redes y métricas del ecosistema</p>
      </CardContent>
    </Card>
  </div>
);

export default Explorador;
