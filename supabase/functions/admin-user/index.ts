import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("Missing env", { hasUrl: !!supabaseUrl, hasAnon: !!anonKey, hasService: !!serviceRoleKey });
      return json({ error: "Configuration serveur incomplète" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Non connecté" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      console.error("Auth error", userError);
      return json({ error: "Session invalide" }, 401);
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      return json({ error: "Body JSON invalide" }, 400);
    }

    const action = String(body.action || "");
    const currentUserId = userData.user.id;

    const deleteProfileRows = async (targetUserId: string) => {
      await adminClient.from("user_roles").delete().eq("user_id", targetUserId);
      await adminClient.from("favorites").delete().eq("user_id", targetUserId);
      await adminClient.from("reservations").delete().eq("buyer_id", targetUserId);
      await adminClient.from("contest_votes").delete().eq("voter_id", targetUserId);
      await adminClient.from("contest_photos").delete().eq("user_id", targetUserId);
      await adminClient.from("listings").delete().eq("seller_id", targetUserId);
      await adminClient.from("profiles").delete().eq("id", targetUserId);
    };

    if (action === "delete-self") {
      await deleteProfileRows(currentUserId);
      const { error } = await adminClient.auth.admin.deleteUser(currentUserId);
      if (error && !error.message.toLowerCase().includes("not found")) {
        console.error("delete-self error", error);
        throw error;
      }
      return json({ ok: true });
    }

    // From here, must be super_admin
    const { data: roleRow, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUserId)
      .eq("role", "super_admin")
      .maybeSingle();

    if (roleError) {
      console.error("Role check error", roleError);
      return json({ error: "Erreur vérification rôle" }, 500);
    }
    if (!roleRow) return json({ error: "Réservé aux super admins" }, 403);

    if (action === "cleanup-deleted") {
      const { data: profiles, error: pErr } = await adminClient.from("profiles").select("id");
      if (pErr) {
        console.error("Cleanup fetch profiles error", pErr);
        return json({ error: pErr.message }, 500);
      }
      let deletedCount = 0;
      for (const profile of profiles || []) {
        try {
          const { data, error } = await adminClient.auth.admin.getUserById(profile.id);
          if (error || !data?.user) {
            await deleteProfileRows(profile.id);
            deletedCount += 1;
          }
        } catch (e) {
          console.error("Cleanup loop error for", profile.id, e);
        }
      }
      return json({ ok: true, deletedCount });
    }

    const targetUserId = String(body.targetUserId || "");
    if (!targetUserId) return json({ error: "Utilisateur manquant" }, 400);

    if (action === "delete-user") {
      await deleteProfileRows(targetUserId);
      const { error } = await adminClient.auth.admin.deleteUser(targetUserId);
      if (error && !error.message.toLowerCase().includes("not found")) {
        console.error("delete-user error", error);
        throw error;
      }
      return json({ ok: true });
    }

    if (action === "update-password") {
      const password = String(body.password || "");
      if (password.length < 6) return json({ error: "Mot de passe trop court (min 6)" }, 400);
      const { error } = await adminClient.auth.admin.updateUserById(targetUserId, { password });
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "update-email") {
      const email = String(body.email || "").trim().toLowerCase();
      if (!email.includes("@")) return json({ error: "Email invalide" }, 400);
      const { error } = await adminClient.auth.admin.updateUserById(targetUserId, {
        email,
        email_confirm: true,
      });
      if (error) throw error;
      await adminClient.from("profiles").update({ email }).eq("id", targetUserId);
      return json({ ok: true });
    }

    if (action === "reset-password") {
      // Generate a temporary password and return it to the admin
      const temp = `Tmp-${Math.random().toString(36).slice(2, 10)}!`;
      const { error } = await adminClient.auth.admin.updateUserById(targetUserId, { password: temp });
      if (error) throw error;
      return json({ ok: true, tempPassword: temp });
    }

    return json({ error: `Action inconnue: ${action}` }, 400);
  } catch (error) {
    console.error("Edge function fatal", error);
    return json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      500,
    );
  }
});
