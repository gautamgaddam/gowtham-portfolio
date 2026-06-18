import { createClient } from "@supabase/supabase-js";

export const HEALTH_ADMIN_EMAIL = "gautammaddyson@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const healthSupabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function getHealthUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !healthSupabaseAdmin) return null;

  const {
    data: { user },
    error,
  } = await healthSupabaseAdmin.auth.getUser(token);

  if (error) return null;
  return user;
}

export function isHealthAdmin(user) {
  return user?.email?.toLowerCase() === HEALTH_ADMIN_EMAIL;
}

export function requireHealthDatabase(res) {
  if (healthSupabaseAdmin) return false;
  res.status(500).json({ error: "Database not configured" });
  return true;
}
