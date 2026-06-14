import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPERADMIN_BYPASS = "datos@hablamosde.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // Identify caller: either Supabase JWT (regular user) or X-Superadmin-Email header (bypass)
    let callerEmail: string | null = null;
    const auth = req.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice(7);
      const { data } = await admin.auth.getUser(token);
      callerEmail = data.user?.email?.toLowerCase() ?? null;
    }
    if (!callerEmail) {
      const bypass = req.headers.get("X-Superadmin-Email")?.toLowerCase();
      if (bypass === SUPERADMIN_BYPASS) callerEmail = bypass;
    }
    if (!callerEmail) {
      return json({ error: "unauthorized" }, 401);
    }

    const { data: me } = await admin
      .from("app_users")
      .select("role")
      .eq("email", callerEmail)
      .maybeSingle();
    if (me?.role !== "superadmin") {
      return json({ error: "forbidden" }, 403);
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "list";

    if (req.method === "GET" || action === "list") {
      const { data, error } = await admin
        .from("app_users")
        .select("id, email, role, created_at, last_login_at, created_by")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ users: data });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const op = body.op as string;

      if (op === "create") {
        const email = String(body.email || "").trim().toLowerCase();
        const role = body.role === "superadmin" ? "superadmin" : "lector";
        if (!email || !email.includes("@")) return json({ error: "invalid email" }, 400);
        const { data, error } = await admin
          .from("app_users")
          .insert({ email, role, created_by: callerEmail })
          .select()
          .single();
        if (error) {
          if (String(error.message).includes("duplicate")) {
            return json({ error: "Ese email ya está dado de alta" }, 409);
          }
          throw error;
        }
        return json({ user: data });
      }

      if (op === "delete") {
        const id = String(body.id);
        const { data: target } = await admin
          .from("app_users").select("email").eq("id", id).maybeSingle();
        if (target?.email === callerEmail) {
          return json({ error: "No puedes eliminarte a ti mismo" }, 400);
        }
        if (target?.email === SUPERADMIN_BYPASS) {
          return json({ error: "No se puede eliminar el superadmin principal" }, 400);
        }
        const { error } = await admin.from("app_users").delete().eq("id", id);
        if (error) throw error;
        return json({ ok: true });
      }

      if (op === "update_role") {
        const id = String(body.id);
        const role = body.role === "superadmin" ? "superadmin" : "lector";
        const { data: target } = await admin
          .from("app_users").select("email").eq("id", id).maybeSingle();
        if (target?.email === SUPERADMIN_BYPASS && role !== "superadmin") {
          return json({ error: "No se puede degradar el superadmin principal" }, 400);
        }
        const { error } = await admin.from("app_users").update({ role }).eq("id", id);
        if (error) throw error;
        return json({ ok: true });
      }

      return json({ error: "unknown op" }, 400);
    }

    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}