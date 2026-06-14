import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Shield, ArrowLeft } from "lucide-react";
import { SUPERADMIN_EMAIL, setSession } from "@/lib/auth";

const Login = () => {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;

    // Superadmin bypass: entrar directo, sin código
    if (normalized === SUPERADMIN_EMAIL) {
      setSession({ email: normalized, role: "superadmin", bypass: true });
      navigate("/dashboard");
      return;
    }

    setLoading(true);
    try {
      // 1) Comprobar allowlist
      const { data: check, error: checkErr } = await supabase.functions.invoke(
        "check-user-allowlist",
        { body: { email: normalized } },
      );
      if (checkErr) throw checkErr;
      if (!check?.allowed) {
        toast.error("Tu email no tiene acceso a este panel");
        setLoading(false);
        return;
      }

      // 2) Pedir OTP por email (Supabase Auth envía código de 6 dígitos)
      const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;

      toast.success("Te hemos enviado un código de 6 dígitos");
      setStep("code");
    } catch (err: any) {
      toast.error("Error: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    const normalized = email.trim().toLowerCase();
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: normalized,
        token: code,
        type: "email",
      });
      if (error) throw error;

      // Obtener rol vía edge function
      const { data, error: roleErr } = await supabase.functions.invoke("post-login-role");
      if (roleErr) throw roleErr;
      if (!data?.role) {
        toast.error("Tu email no tiene acceso a este panel");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      setSession({ email: normalized, role: data.role });
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Código incorrecto o caducado");
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
          <form onSubmit={requestCode} className="space-y-4">
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-card border-border text-foreground placeholder:text-muted-foreground"
              required
            />
            <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
              {loading ? "Enviando..." : "Enviar código"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Recibirás un código numérico de 6 dígitos por email
            </p>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Introduce el código enviado a <span className="font-medium text-foreground">{email}</span>
            </p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading || code.length !== 6}>
              {loading ? "Validando..." : "Entrar"}
            </Button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); }}
              className="flex items-center gap-1 mx-auto text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Cambiar email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
