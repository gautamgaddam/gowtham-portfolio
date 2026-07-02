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
    body_zone: body.bodyZone || body.body_zone || "general",
    symptom: body.symptom || "",
    severity: body.severity === "" ? null : body.severity ?? null,
    notes: body.notes || "",
  };
}

function isMissingTrackerSchema(error) {
  return (
    error?.code === "PGRST205" ||
    error?.code === "42P01" ||
    error?.message?.includes("health_symptom_entries")
  );
}

export default async function handler(req, res) {
  if (requireHealthDatabase(res)) return;

  try {
    const user = await getHealthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "POST") {
      const entry = payload(req.body);
      if (!entry.symptom) {
        return res.status(400).json({ error: "Symptom is required" });
      }

      const { data, error } = await healthSupabaseAdmin
        .from("health_symptom_entries")
        .insert({ user_id: user.id, ...entry })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === "PATCH") {
      const id = req.query.id || req.body.id;
      if (!id) return res.status(400).json({ error: "Missing entry id" });

      const { data, error } = await healthSupabaseAdmin
        .from("health_symptom_entries")
        .update(payload(req.body))
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
        .from("health_symptom_entries")
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
        message: "Health symptom tracker table is not available yet. Run supabase/health-bot-migration.sql if this persists.",
      });
    }
    console.error("Symptom entry API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
