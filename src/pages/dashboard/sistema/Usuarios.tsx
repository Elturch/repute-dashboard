import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

const Usuarios = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-24 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">Gestión de usuarios</p>
        <p className="text-sm text-muted-foreground mt-1">Próximamente: Roles, permisos y accesos por estudio</p>
      </CardContent>
    </Card>
  </div>
);

export default Usuarios;
