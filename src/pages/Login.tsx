import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { externalSupabase } from "@/integrations/external-supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, ArrowLeft } from "lucide-react";
import { SUPERADMIN_EMAIL, ACCESO_ABIERTO, setSession } from "@/lib/auth";

const Login = () => {
  const [step, setStep] = useState<"email" | "link">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (ACCESO_ABIERTO) navigate("/dashboard", { replace: true });
  }, [navigate]);

  useEffect(() => {
    let subscriptionCancelled = false;

    const handleSession = async (session: any) => {
      if (!session?.user?.email || subscriptionCancelled) return;
      const normalized = session.user.email.trim().toLowerCase();
      try {
        const { data: rows, error: roleErr } = await externalSupabase.rpc(
          "email_autorizado",
          { p_email: normalized }
        );
        if (roleErr) throw roleErr;
        const rol = Array.isArray(rows) && rows.length > 0 ? rows[0].rol : null;
        if (!rol) {
          toast.error("Tu email no tiene acceso a este panel");
          await supabase.auth.signOut();
          return;
        }
        setSession({ email: normalized, role: rol });
        navigate("/dashboard");
      } catch (err: any) {
        toast.error("Error al validar la sesión: " + (err?.message ?? String(err)));
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) handleSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      subscriptionCancelled = true;
      listener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  const requestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;

    if (normalized === SUPERADMIN_EMAIL) {
      setSession({ email: normalized, role: "superadmin", bypass: true });
      navigate("/dashboard");
      return;
    }

    setLoading(true);
    try {
      const { data: rows, error: checkErr } = await externalSupabase.rpc(
        "email_autorizado",
        { p_email: normalized }
      );
      if (checkErr) throw checkErr;
      const allowed = Array.isArray(rows) && rows.length > 0 && rows[0].allowed === true;
      if (!allowed) {
        toast.error("Tu email no tiene acceso a este panel");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin + "/login",
        },
      });
      if (error) throw error;

      toast.success("Te hemos enviado un enlace de acceso");
      setStep("link");
    } catch (err: any) {
      toast.error("Error: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Monitor Reputacional
          </h1>
          <p className="text-muted-foreground text-sm">Panel de Control</p>
        </div>

        {step === "email" ? (
          <form onSubmit={requestMagicLink} className="space-y-4" autoComplete="off">
            <input type="text" name="fakeuser" autoComplete="username" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
            <input type="password" name="fakepass" autoComplete="new-password" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
            <Input
              type="email"
              name="login_email_no_autofill"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-card border-border text-foreground placeholder:text-muted-foreground"
              required
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="email"
              data-lpignore="true"
              data-form-type="other"
              data-1p-ignore
            />
            <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
              {loading ? "Enviando..." : "Enviar enlace de acceso"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Recibirás un enlace mágico por email para entrar sin contraseña
            </p>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-foreground text-base font-medium">Revisa tu correo</p>
              <p className="text-muted-foreground text-sm">
                Te hemos enviado un enlace de acceso a{" "}
                <span className="font-medium text-foreground">{email}</span>.<br />
                Ábrelo en este navegador para entrar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setStep("email"); setEmail(""); }}
              className="flex items-center gap-1 mx-auto text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Cambiar email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
