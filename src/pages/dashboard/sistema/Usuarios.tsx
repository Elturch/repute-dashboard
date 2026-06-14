import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSession, isSuperadmin, SUPERADMIN_EMAIL } from "@/lib/auth";
import { Navigate } from "react-router-dom";

type AppUser = {
  id: string;
  email: string;
  role: "lector" | "superadmin";
  created_at: string;
  last_login_at: string | null;
  created_by: string | null;
};

async function callAdmin(body: any, method: "GET" | "POST" = "POST") {
  const session = getSession();
  const headers: Record<string, string> = {};
  if (session?.bypass) headers["X-Superadmin-Email"] = SUPERADMIN_EMAIL;
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: method === "POST" ? body : undefined,
    method,
    headers,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

const Usuarios = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"lector" | "superadmin">("lector");
  const [saving, setSaving] = useState(false);

  if (!isSuperadmin()) return <Navigate to="/dashboard" replace />;

  const load = async () => {
    setLoading(true);
    try {
      const data = await callAdmin({ op: "list" }, "POST");
      setUsers(data.users ?? []);
    } catch (e: any) {
      toast.error("Error cargando usuarios: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await callAdmin({ op: "create", email: newEmail, role: newRole });
      toast.success("Usuario añadido");
      setOpen(false);
      setNewEmail("");
      setNewRole("lector");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: AppUser) => {
    if (!confirm(`¿Eliminar a ${u.email}?`)) return;
    try {
      await callAdmin({ op: "delete", id: u.id });
      toast.success("Usuario eliminado");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRoleChange = async (u: AppUser, role: "lector" | "superadmin") => {
    try {
      await callAdmin({ op: "update_role", id: u.id, role });
      toast.success("Rol actualizado");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Da de alta los emails autorizados. Recibirán un código de 6 dígitos para entrar.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="h-4 w-4" /> Añadir usuario</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo usuario</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="usuario@dominio.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol</label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lector">Lector</SelectItem>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Crear usuario"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Usuarios autorizados ({users.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sin usuarios</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Alta</TableHead>
                  <TableHead>Último acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isPrincipal = u.email === SUPERADMIN_EMAIL;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.email}{" "}
                        {isPrincipal && <Badge variant="secondary" className="ml-2">Principal</Badge>}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(v) => handleRoleChange(u, v as any)}
                          disabled={isPrincipal}
                        >
                          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lector">Lector</SelectItem>
                            <SelectItem value="superadmin">Superadmin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString("es-ES") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(u)}
                          disabled={isPrincipal}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Usuarios;
