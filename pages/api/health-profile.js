import { createClient } from "@supabase/supabase-js";
import { toBodyCompositionDbFields } from "../../lib/body-composition";

export const config = {
  runtime: "nodejs",
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const BODY_COMPOSITION_KEYS = [
  "heightCm",
  "height_cm",
  "weightKg",
  "weight_kg",
  "bodyFatPercent",
  "body_fat_percent",
  "muscleMassKg",
  "muscle_mass_kg",
  "bodyWaterPercent",
  "body_water_percent",
  "boneMassKg",
  "bone_mass_kg",
  "visceralFatRating",
  "visceral_fat_rating",
  "bodyCompositionMethod",
  "body_composition_method",
  "bodyCompositionMeasuredAt",
  "body_composition_measured_at",
  "bodyCompositionNotes",
  "body_composition_notes",
];

const hasBodyCompositionPayload = (body = {}) =>
  BODY_COMPOSITION_KEYS.some((key) => Object.prototype.hasOwnProperty.call(body, key));

// Helper to extract user from JWT token
async function getUserFromToken(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !supabaseAdmin) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return user;
}

export default async function handler(req, res) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Database not configured" });
  }

  try {
    // Authenticate user
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      // Get user's health profile
      const { data: profile, error } = await supabaseAdmin
        .from("health_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return res.status(200).json(profile || null);

    } else if (req.method === "POST") {
      // Upsert health profile
      const {
        ageBand,
        conditions,
        medications,
        allergies,
        dietaryPattern,
        cuisinePreference,
        budgetLevel,
        pregnancyStatus,
        goals,
      } = req.body;

      const bodyCompositionFields = hasBodyCompositionPayload(req.body)
        ? toBodyCompositionDbFields(req.body)
        : {};

      const { data: profile, error } = await supabaseAdmin
        .from("health_profiles")
        .upsert({
          user_id: user.id,
          age_band: ageBand,
          conditions: conditions || [],
          medications: medications || "",
          allergies: allergies || "",
          dietary_pattern: dietaryPattern || "",
          cuisine_preference: cuisinePreference || "",
          budget_level: budgetLevel || "",
          pregnancy_status: pregnancyStatus || "Not pregnant",
          goals: goals || [],
          ...bodyCompositionFields,
        }, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json(profile);

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (error) {
    console.error("Health profile API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
