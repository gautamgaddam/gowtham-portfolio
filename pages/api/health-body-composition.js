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

async function getUserFromToken(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !supabaseAdmin) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return user;
}

async function updateLatestProfileSnapshot(userId) {
  const { data: latest, error } = await supabaseAdmin
    .from("health_body_composition_readings")
    .select("*")
    .eq("user_id", userId)
    .order("body_composition_measured_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const latestFields = latest
    ? {
        height_cm: latest.height_cm,
        weight_kg: latest.weight_kg,
        body_fat_percent: latest.body_fat_percent,
        muscle_mass_kg: latest.muscle_mass_kg,
        body_water_percent: latest.body_water_percent,
        bone_mass_kg: latest.bone_mass_kg,
        visceral_fat_rating: latest.visceral_fat_rating,
        body_composition_method: latest.body_composition_method,
        body_composition_measured_at: latest.body_composition_measured_at,
        body_composition_notes: latest.body_composition_notes,
        bmi: latest.bmi,
        fat_mass_kg: latest.fat_mass_kg,
        lean_mass_kg: latest.lean_mass_kg,
        body_fat_category: latest.body_fat_category,
        bmi_category: latest.bmi_category,
        weight_to_muscle_context: latest.weight_to_muscle_context,
      }
    : {
        height_cm: null,
        weight_kg: null,
        body_fat_percent: null,
        muscle_mass_kg: null,
        body_water_percent: null,
        bone_mass_kg: null,
        visceral_fat_rating: null,
        body_composition_method: "",
        body_composition_measured_at: null,
        body_composition_notes: "",
        bmi: null,
        fat_mass_kg: null,
        lean_mass_kg: null,
        body_fat_category: "",
        bmi_category: "",
        weight_to_muscle_context: "",
      };

  const { error: updateError } = await supabaseAdmin
    .from("health_profiles")
    .update(latestFields)
    .eq("user_id", userId);

  if (updateError) throw updateError;
}

export default async function handler(req, res) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Database not configured" });
  }

  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("health_body_composition_readings")
        .select("*")
        .eq("user_id", user.id)
        .order("body_composition_measured_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === "POST") {
      const fields = toBodyCompositionDbFields(req.body);

      if (!fields.weight_kg && !fields.body_fat_percent && !fields.muscle_mass_kg) {
        return res.status(400).json({
          error: "Add at least weight, body fat, or muscle mass to save a reading.",
        });
      }

      const { data: reading, error } = await supabaseAdmin
        .from("health_body_composition_readings")
        .insert({
          user_id: user.id,
          ...fields,
        })
        .select()
        .single();

      if (error) throw error;

      await supabaseAdmin
        .from("health_profiles")
        .upsert({
          user_id: user.id,
          ...fields,
        }, { onConflict: "user_id" });

      return res.status(201).json({ reading });
    }

    if (req.method === "PATCH") {
      const id = req.query.id || req.body.id;
      if (!id) {
        return res.status(400).json({ error: "Missing reading id" });
      }

      const fields = toBodyCompositionDbFields(req.body);
      if (!fields.weight_kg && !fields.body_fat_percent && !fields.muscle_mass_kg) {
        return res.status(400).json({
          error: "Add at least weight, body fat, or muscle mass to save a reading.",
        });
      }

      const { data: reading, error } = await supabaseAdmin
        .from("health_body_composition_readings")
        .update(fields)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      await updateLatestProfileSnapshot(user.id);
      return res.status(200).json({ reading });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "Missing reading id" });
      }

      const { error } = await supabaseAdmin
        .from("health_body_composition_readings")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await updateLatestProfileSnapshot(user.id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Body composition API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
