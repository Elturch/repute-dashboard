import { supabase } from "@/integrations/supabase/client";

export const SUPERADMIN_EMAIL = "datos@hablamosde.com";

export type AppRole = "lector" | "superadmin";

export type Session = {
  email: string;
  role: AppRole;
  bypass?: boolean;
};

export function getSession(): Session | null {
  const email = localStorage.getItem("mr_user_email");
  const role = localStorage.getItem("mr_user_role") as AppRole | null;
  const isBypass = localStorage.getItem("mr_is_superadmin") === "true";
  if (!email) return null;
  if (isBypass) return { email, role: "superadmin", bypass: true };
  if (!role) return null;
  return { email, role };
}

export function setSession(s: Session) {
  localStorage.setItem("mr_user_email", s.email.toLowerCase());
  localStorage.setItem("mr_user_role", s.role);
  if (s.bypass) localStorage.setItem("mr_is_superadmin", "true");
  else localStorage.removeItem("mr_is_superadmin");
}

export async function clearSession() {
  localStorage.removeItem("mr_user_email");
  localStorage.removeItem("mr_user_role");
  localStorage.removeItem("mr_is_superadmin");
  try { await supabase.auth.signOut(); } catch { /* noop */ }
}

export function isSuperadmin(): boolean {
  return getSession()?.role === "superadmin";
}