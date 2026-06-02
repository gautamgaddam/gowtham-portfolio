import { createClient } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { hasFullAccess } from "./access";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Server-side Supabase client (null if not configured)
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Server-side with service role (for admin operations)
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Client-side Supabase client (for use in components)
export function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClientComponentClient();
}

// Helper function to get current user server-side
export async function getUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error) return null;

  return user;
}

// Helper function to get user profile
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

// Helper function to check subscription access
export async function checkSubscriptionAccess(userId, requiredTier = "free") {
  const profile = await getUserProfile(userId);

  if (!profile) return false;
  if (hasFullAccess(null, profile)) return true;

  const tierLevels = { free: 0, pro: 1, premium: 2 };
  const userLevel = tierLevels[profile.subscription_tier] || 0;
  const requiredLevel = tierLevels[requiredTier] || 0;

  return profile.subscription_status === "active" && userLevel >= requiredLevel;
}
