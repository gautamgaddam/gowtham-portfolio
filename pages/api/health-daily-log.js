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

function dailyLogPayload(body = {}) {
  return {
    log_date: body.logDate || body.log_date || todayIso(),
    mood: body.mood || "",
    sleep_hours: body.sleepHours === "" ? null : body.sleepHours ?? body.sleep_hours ?? null,
    water_liters: body.waterLiters === "" ? null : body.waterLiters ?? body.water_liters ?? null,
    energy_level: body.energyLevel === "" ? null : body.energyLevel ?? body.energy_level ?? null,
    stress_level: body.stressLevel === "" ? null : body.stressLevel ?? body.stress_level ?? null,
    notes: body.notes || "",
    summary: body.summary || {},
  };
}

function isMissingTrackerSchema(error) {
  return (
    error?.code === "PGRST205" ||
    error?.code === "42P01" ||
    error?.message?.includes("health_daily_logs") ||
    error?.message?.includes("health_food_entries") ||
    error?.message?.includes("health_activity_entries") ||
    error?.message?.includes("health_symptom_entries") ||
    error?.message?.includes("health_goals") ||
    error?.message?.includes("health_goal_checkins")
  );
}

function emptyTrackerResponse(logDate) {
  return {
    log: null,
    food: [],
    activities: [],
    symptoms: [],
    goals: [],
    schemaPending: true,
    message: `Health tracker tables are not available yet for ${logDate}. Run supabase/health-bot-migration.sql if this persists.`,
  };
}

export default async function handler(req, res) {
  if (requireHealthDatabase(res)) return;

  try {
    const user = await getHealthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "GET") {
      const logDate = req.query.date || todayIso();
      const { data, error } = await healthSupabaseAdmin
        .from("health_daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", logDate)
        .maybeSingle();

      if (isMissingTrackerSchema(error)) {
        return res.status(200).json(emptyTrackerResponse(logDate));
      }

      if (error) throw error;

      const [food, activities, symptoms, goals] = await Promise.all([
        healthSupabaseAdmin
          .from("health_food_entries")
          .select("*")
          .eq("user_id", user.id)
          .eq("log_date", logDate)
          .order("created_at", { ascending: true }),
        healthSupabaseAdmin
          .from("health_activity_entries")
          .select("*")
          .eq("user_id", user.id)
          .eq("log_date", logDate)
          .order("created_at", { ascending: true }),
        healthSupabaseAdmin
          .from("health_symptom_entries")
          .select("*")
          .eq("user_id", user.id)
          .eq("log_date", logDate)
          .order("created_at", { ascending: true }),
        healthSupabaseAdmin
          .from("health_goals")
          .select("*, health_goal_checkins(*)")
          .eq("user_id", user.id)
          .in("status", ["active", "paused"])
          .order("created_at", { ascending: false }),
      ]);

      if (food.error) throw food.error;
      if (activities.error) throw activities.error;
      if (symptoms.error) throw symptoms.error;
      if (goals.error) throw goals.error;

      return res.status(200).json({
        log: data || null,
        food: food.data || [],
        activities: activities.data || [],
        symptoms: symptoms.data || [],
        goals: goals.data || [],
      });
    }

    if (req.method === "POST" || req.method === "PATCH") {
      const payload = dailyLogPayload(req.body);
      const { data, error } = await healthSupabaseAdmin
        .from("health_daily_logs")
        .upsert(
          {
            user_id: user.id,
            ...payload,
          },
          { onConflict: "user_id,log_date" },
        )
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    if (isMissingTrackerSchema(error)) {
      if (req.method === "GET") {
        return res.status(200).json(emptyTrackerResponse(req.query.date || todayIso()));
      }

      const payload = dailyLogPayload(req.body);
      return res.status(200).json({
        user_id: user?.id,
        ...payload,
        schemaPending: true,
        notPersisted: true,
        message: "Health tracker tables are not available yet. Run supabase/health-bot-migration.sql if this persists.",
      });
    }
    console.error("Daily log API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
