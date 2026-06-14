import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return json({ error: "unauthorized" }, 401);
    }
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: u } = await admin.auth.getUser(auth.slice(7));
    const email = u.user?.email?.toLowerCase();
    if (!email) return json({ error: "no email" }, 401);

    const { data: row } = await admin
      .from("app_users")
      .select("role")
      .eq("email", email)
      .maybeSingle();

    if (!row) return json({ error: "not allowed" }, 403);

    await admin.from("app_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("email", email);

    return json({ email, role: row.role });
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