import {
  getHealthUser,
  healthSupabaseAdmin,
  requireHealthDatabase,
} from "../../lib/health-api-auth";

export const config = {
  runtime: "nodejs",
};

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function payload(body = {}) {
  return {
    log_date: body.logDate || body.log_date || todayIso(),
    meal_type: body.mealType || body.meal_type || "snack",
    food_name: body.foodName || body.food_name || "",
    quantity: body.quantity || "",
    calories: body.calories === "" ? null : body.calories ?? null,
    protein_g: body.proteinG === "" ? null : body.proteinG ?? body.protein_g ?? null,
    carbs_g: body.carbsG === "" ? null : body.carbsG ?? body.carbs_g ?? null,
    fat_g: body.fatG === "" ? null : body.fatG ?? body.fat_g ?? null,
    fiber_g: body.fiberG === "" ? null : body.fiberG ?? body.fiber_g ?? null,
    notes: body.notes || "",
  };
}

function isMissingTrackerSchema(error) {
  return (
    error?.code === "PGRST205" ||
    error?.code === "42P01" ||
    error?.message?.includes("health_food_entries")
  );
}

export default async function handler(req, res) {
  if (requireHealthDatabase(res)) return;

  try {
    const user = await getHealthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "POST") {
      const entry = payload(req.body);
      if (!entry.food_name) {
        return res.status(400).json({ error: "Food name is required" });
      }

      const { data, error } = await healthSupabaseAdmin
        .from("health_food_entries")
        .insert({ user_id: user.id, ...entry })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === "PATCH") {
      const id = req.query.id || req.body.id;
      if (!id) return res.status(400).json({ error: "Missing entry id" });

      const entry = payload(req.body);
      const { data, error } = await healthSupabaseAdmin
        .from("health_food_entries")
        .update(entry)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === "DELETE") {
      const id = req.query.id || req.body.id;
      if (!id) return res.status(400).json({ error: "Missing entry id" });

      const { error } = await healthSupabaseAdmin
        .from("health_food_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    if (isMissingTrackerSchema(error)) {
      return res.status(200).json({
        ...payload(req.body),
        schemaPending: true,
        notPersisted: true,
        message: "Health food tracker table is not available yet. Run supabase/health-bot-migration.sql if this persists.",
      });
    }
    console.error("Food entry API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
