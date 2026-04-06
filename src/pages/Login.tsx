import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield } from "lucide-react";

const SUPERADMIN_EMAIL = "datos@hablamosde.com";

const Login = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (email.toLowerCase() === SUPERADMIN_EMAIL) {
      localStorage.setItem("mr_user_email", email.toLowerCase());
      localStorage.setItem("mr_is_superadmin", "true");
      navigate("/dashboard");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);

    if (error) {
      toast.error("Error al enviar el enlace: " + error.message);
    } else {
      toast.success("Enlace de acceso enviado a tu email");
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-card border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Acceder"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Introduce tu email para recibir un enlace de acceso seguro
        </p>
      </div>
    </div>
  );
};

export default Login;
