import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { toast } from "sonner";
import { Shield, Plus, Pencil, Trash2, Download, Users, BookOpen, BarChart3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const SUPERADMIN_EMAIL = "datos@hablamosde.com";

interface DashboardUser {
  id: string;
  email: string;
  nombre: string | null;
  rol: string;
  scenarios_asignados: string[] | null;
  created_at: string;
}

interface Scenario {
  id: string;
  empresa_persona: string | null;
  contexto: string | null;
  descripcion: string | null;
  queries: any;
  alert_email: string | null;
  activo: boolean | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const isSuperadmin = localStorage.getItem("mr_is_superadmin") === "true";
  const userEmail = localStorage.getItem("mr_user_email");

  useEffect(() => {
    if (!isSuperadmin || userEmail !== SUPERADMIN_EMAIL) {
      navigate("/dashboard", { replace: true });
    }
  }, [isSuperadmin, userEmail, navigate]);

  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [stats, setStats] = useState({
    totalEventos: 0,
    totalSocial: 0,
    totalSnapshots: 0,
    totalHitos: 0,
    totalCascadas: 0,
    ultimoEvento: null as string | null,
  });
  const [loading, setLoading] = useState(true);

  // User dialog state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DashboardUser | null>(null);
  const [userForm, setUserForm] = useState({ email: "", nombre: "", rol: "cliente", scenarios_asignados: [] as string[] });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Scenario dialog state
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [scenarioForm, setScenarioForm] = useState({
    id: "", empresa_persona: "", contexto: "", descripcion: "", queries: "[]", alert_email: "", activo: true,
  });

  const fetchAll = async () => {
    setLoading(true);
    const [usersRes, scenariosRes, evtCount, socialCount, snapCount, hitoCount, cascCount, lastEvt] = await Promise.all([
      externalSupabase.from("dashboard_users").select("*").order("rol", { ascending: false }).order("created_at"),
      externalSupabase.from("scenarios").select("*").order("created_at", { ascending: false }),
      externalSupabase.from("monitor_reputacional_events").select("*", { count: "exact", head: true }),
      externalSupabase.from("social_signals").select("*", { count: "exact", head: true }),
      externalSupabase.from("weekly_snapshots").select("*", { count: "exact", head: true }),
      externalSupabase.from("narrative_milestones").select("*", { count: "exact", head: true }),
      externalSupabase.from("alert_cascades").select("*", { count: "exact", head: true }),
      externalSupabase.from("monitor_reputacional_events").select("created_at").order("created_at", { ascending: false }).limit(1),
    ]);

    if (usersRes.data) setUsers(usersRes.data);
    if (scenariosRes.data) setScenarios(scenariosRes.data as any);
    setStats({
      totalEventos: evtCount.count ?? 0,
      totalSocial: socialCount.count ?? 0,
      totalSnapshots: snapCount.count ?? 0,
      totalHitos: hitoCount.count ?? 0,
      totalCascadas: cascCount.count ?? 0,
      ultimoEvento: lastEvt.data?.[0]?.created_at ?? null,
    });
    setLoading(false);
  };

  useEffect(() => {
    if (isSuperadmin) fetchAll();
  }, [isSuperadmin]);

  // ---- User CRUD ----
  const openNewUser = () => {
    setEditingUser(null);
    setUserForm({ email: "", nombre: "", rol: "cliente", scenarios_asignados: [] });
    setUserDialogOpen(true);
  };

  const openEditUser = (u: DashboardUser) => {
    setEditingUser(u);
    setUserForm({
      email: u.email,
      nombre: u.nombre || "",
      rol: u.rol,
      scenarios_asignados: u.scenarios_asignados || [],
    });
    setUserDialogOpen(true);
  };

  const saveUser = async () => {
    if (!userForm.email) { toast.error("Email obligatorio"); return; }
    if (editingUser) {
      const { error } = await externalSupabase.from("dashboard_users").update({
        nombre: userForm.nombre || null,
        rol: userForm.rol,
        scenarios_asignados: userForm.scenarios_asignados,
      }).eq("id", editingUser.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Usuario actualizado");
    } else {
      const { error } = await externalSupabase.from("dashboard_users").insert({
        email: userForm.email.toLowerCase(),
        nombre: userForm.nombre || null,
        rol: userForm.rol,
        scenarios_asignados: userForm.scenarios_asignados,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Usuario creado");
    }
    setUserDialogOpen(false);
    fetchAll();
  };

  const deleteUser = async (id: string) => {
    const u = users.find(u => u.id === id);
    if (u?.email === SUPERADMIN_EMAIL) { toast.error("No se puede eliminar el superadmin"); return; }
    const { error } = await externalSupabase.from("dashboard_users").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Usuario eliminado");
    setDeleteConfirm(null);
    fetchAll();
  };

  // ---- Scenario CRUD ----
  const openNewScenario = () => {
    setEditingScenario(null);
    setScenarioForm({ id: "", empresa_persona: "", contexto: "", descripcion: "", queries: "[]", alert_email: "", activo: true });
    setScenarioDialogOpen(true);
  };

  const openEditScenario = (s: Scenario) => {
    setEditingScenario(s);
    setScenarioForm({
      id: s.id,
      empresa_persona: s.empresa_persona || "",
      contexto: s.contexto || "",
      descripcion: s.descripcion || "",
      queries: JSON.stringify(s.queries || [], null, 2),
      alert_email: s.alert_email || "",
      activo: s.activo ?? true,
    });
    setScenarioDialogOpen(true);
  };

  const saveScenario = async () => {
    if (!scenarioForm.id) { toast.error("ID obligatorio"); return; }
    let parsedQueries: any;
    try { parsedQueries = JSON.parse(scenarioForm.queries); } catch { toast.error("Queries no es JSON válido"); return; }

    const payload = {
      empresa_persona: scenarioForm.empresa_persona || null,
      contexto: scenarioForm.contexto || null,
      descripcion: scenarioForm.descripcion || null,
      queries: parsedQueries,
      alert_email: scenarioForm.alert_email || null,
      activo: scenarioForm.activo,
    };

    if (editingScenario) {
      const { error } = await externalSupabase.from("scenarios").update(payload).eq("id", editingScenario.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Estudio actualizado");
    } else {
      const { error } = await externalSupabase.from("scenarios").insert({ id: scenarioForm.id, ...payload });
      if (error) { toast.error(error.message); return; }
      toast.success("Estudio creado");
    }
    setScenarioDialogOpen(false);
    fetchAll();
  };

  const deleteScenario = async (id: string) => {
    const { error } = await externalSupabase.from("scenarios").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Estudio eliminado");
    fetchAll();
  };

  // ---- Export ----
  const downloadCSV = (data: any[], filename: string) => {
    if (!data.length) { toast.error("Sin datos"); return; }
    const headers = Object.keys(data[0]);
    const csv = [headers.join(","), ...data.map(r => headers.map(h => {
      const v = r[h];
      const str = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    }).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportEvents = async () => {
    const { data } = await externalSupabase.from("monitor_reputacional_events").select("*");
    if (data) downloadCSV(data, "eventos.csv");
  };

  const exportSnapshots = async () => {
    const { data } = await externalSupabase.from("weekly_snapshots").select("*");
    if (data) downloadCSV(data, "snapshots.csv");
  };

  const exportAllJSON = async () => {
    const [evt, ss, ws, nm, ac, sc] = await Promise.all([
      externalSupabase.from("monitor_reputacional_events").select("*"),
      externalSupabase.from("social_signals").select("*"),
      externalSupabase.from("weekly_snapshots").select("*"),
      externalSupabase.from("narrative_milestones").select("*"),
      externalSupabase.from("alert_cascades").select("*"),
      externalSupabase.from("scenarios").select("*"),
    ]);
    const all = {
      eventos: evt.data, social_signals: ss.data, weekly_snapshots: ws.data,
      narrative_milestones: nm.data, alert_cascades: ac.data, scenarios: sc.data,
    };
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "export_completo.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleScenarioCheckbox = (scenarioId: string) => {
    setUserForm(prev => ({
      ...prev,
      scenarios_asignados: prev.scenarios_asignados.includes(scenarioId)
        ? prev.scenarios_asignados.filter(s => s !== scenarioId)
        : [...prev.scenarios_asignados, scenarioId],
    }));
  };

  if (!isSuperadmin) return null;

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-6 py-4">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
          <p className="text-sm text-muted-foreground">Gestión de usuarios, estudios y exportación de datos</p>
        </div>
      </div>

      {/* Bloque 3 — Stats KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Eventos", value: stats.totalEventos, icon: BarChart3 },
          { label: "Señales Sociales", value: stats.totalSocial, icon: BarChart3 },
          { label: "Snapshots", value: stats.totalSnapshots, icon: BarChart3 },
          { label: "Hitos", value: stats.totalHitos, icon: BarChart3 },
          { label: "Cascadas", value: stats.totalCascadas, icon: BarChart3 },
          {
            label: "Último Evento",
            value: (() => {
              if (!stats.ultimoEvento) return "—";
              try { const d = new Date(stats.ultimoEvento); return isNaN(d.getTime()) ? "—" : formatDistanceToNow(d, { locale: es, addSuffix: true }); } catch { return "—"; }
            })(),
            icon: BarChart3,
            isText: true,
          },
        ].map((s, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`font-bold ${(s as any).isText ? "text-sm" : "text-2xl"} text-foreground`}>
                {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bloque 1 — Users */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5" /> Gestión de Usuarios
          </CardTitle>
          <Button size="sm" onClick={openNewUser}><Plus className="h-4 w-4 mr-1" /> Nuevo Usuario</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estudios Asignados</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-sm">{u.email}</TableCell>
                  <TableCell>{u.nombre || "—"}</TableCell>
                  <TableCell>
                    <Badge className={u.rol === "superadmin"
                      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      : "bg-primary/20 text-primary border-primary/30"
                    }>{u.rol}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(u.scenarios_asignados || []).map(s => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {(() => { try { const d = new Date(u.created_at); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-ES"); } catch { return "—"; } })()}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditUser(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {u.email !== SUPERADMIN_EMAIL && (
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteConfirm(u.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {loading ? "Cargando..." : "No hay usuarios"}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bloque 2 — Scenarios */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <BookOpen className="h-5 w-5" /> Gestión de Estudios
          </CardTitle>
          <Button size="sm" onClick={openNewScenario}><Plus className="h-4 w-4 mr-1" /> Nuevo Estudio</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Empresa/Persona</TableHead>
                <TableHead>Contexto</TableHead>
                <TableHead>Email Alertas</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarios.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.id}</TableCell>
                  <TableCell>{s.empresa_persona || "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{s.contexto || "—"}</TableCell>
                  <TableCell className="text-sm">{s.alert_email || "—"}</TableCell>
                  <TableCell>
                    <Badge className={s.activo ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-muted text-muted-foreground"}>
                      {s.activo ? "Sí" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {(() => { try { const d = new Date(s.created_at); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-ES"); } catch { return "—"; } })()}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditScenario(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteScenario(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {scenarios.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {loading ? "Cargando..." : "No hay estudios"}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bloque 4 — Export */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Download className="h-5 w-5" /> Exportar Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportEvents}>
            <Download className="h-4 w-4 mr-2" /> Exportar Eventos CSV
          </Button>
          <Button variant="outline" onClick={exportSnapshots}>
            <Download className="h-4 w-4 mr-2" /> Exportar Snapshots CSV
          </Button>
          <Button variant="outline" onClick={exportAllJSON}>
            <Download className="h-4 w-4 mr-2" /> Exportar Todo JSON
          </Button>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Modifica los datos del usuario." : "Añade un nuevo usuario al dashboard."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email *</Label>
              <Input
                value={userForm.email}
                onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                disabled={!!editingUser}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={userForm.nombre} onChange={e => setUserForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={userForm.rol} onValueChange={v => setUserForm(p => ({ ...p, rol: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estudios Asignados</Label>
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                {scenarios.map(s => (
                  <div key={s.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={userForm.scenarios_asignados.includes(s.id)}
                      onCheckedChange={() => toggleScenarioCheckbox(s.id)}
                    />
                    <span className="text-sm">{s.id} — {s.empresa_persona || s.contexto || ""}</span>
                  </div>
                ))}
                {scenarios.length === 0 && <p className="text-sm text-muted-foreground">Sin estudios disponibles</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveUser}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scenario Dialog */}
      <Dialog open={scenarioDialogOpen} onOpenChange={setScenarioDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingScenario ? "Editar Estudio" : "Nuevo Estudio"}</DialogTitle>
            <DialogDescription>
              {editingScenario ? "Modifica la configuración del estudio." : "Crea un nuevo estudio de monitorización."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>ID (slug) *</Label>
              <Input
                value={scenarioForm.id}
                onChange={e => setScenarioForm(p => ({ ...p, id: e.target.value }))}
                disabled={!!editingScenario}
                placeholder="empresa_caso"
              />
            </div>
            <div>
              <Label>Empresa/Persona</Label>
              <Input value={scenarioForm.empresa_persona} onChange={e => setScenarioForm(p => ({ ...p, empresa_persona: e.target.value }))} />
            </div>
            <div>
              <Label>Contexto</Label>
              <Input value={scenarioForm.contexto} onChange={e => setScenarioForm(p => ({ ...p, contexto: e.target.value }))} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={scenarioForm.descripcion} onChange={e => setScenarioForm(p => ({ ...p, descripcion: e.target.value }))} rows={3} />
            </div>
            <div>
              <Label>Queries (JSON array)</Label>
              <Textarea value={scenarioForm.queries} onChange={e => setScenarioForm(p => ({ ...p, queries: e.target.value }))} rows={4} className="font-mono text-xs" />
            </div>
            <div>
              <Label>Email de Alertas</Label>
              <Input value={scenarioForm.alert_email} onChange={e => setScenarioForm(p => ({ ...p, alert_email: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={scenarioForm.activo} onCheckedChange={v => setScenarioForm(p => ({ ...p, activo: v }))} />
              <Label>Activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScenarioDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveScenario}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar usuario?</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteUser(deleteConfirm)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
