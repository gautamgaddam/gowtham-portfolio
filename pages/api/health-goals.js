import {
  getHealthUser,
  healthSupabaseAdmin,
  requireHealthDatabase,
} from "../../lib/health-api-auth";

export const config = {
  runtime: "nodejs",
};

function goalPayload(body = {}) {
  return {
    goal_type: body.goalType || body.goal_type || "general",
    title: body.title || "",
    target: body.target || "",
    cadence: body.cadence || "daily",
    status: body.status || "active",
    start_date: body.startDate || body.start_date || new Date().toISOString().split("T")[0],
    target_date: body.targetDate || body.target_date || null,
    notes: body.notes || "",
  };
}

function checkinPayload(body = {}) {
  return {
    checkin_date: body.checkinDate || body.checkin_date || new Date().toISOString().split("T")[0],
    value: body.value === "" ? null : body.value ?? null,
    completed: Boolean(body.completed),
    notes: body.notes || "",
  };
}

export default async function handler(req, res) {
  if (requireHealthDatabase(res)) return;

  try {
    const user = await getHealthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "GET") {
      const { data, error } = await healthSupabaseAdmin
        .from("health_goals")
        .select("*, health_goal_checkins(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === "POST") {
      if (req.body.checkin || req.body.goalId || req.body.goal_id) {
        const goalId = req.body.goalId || req.body.goal_id;
        if (!goalId) return res.status(400).json({ error: "Missing goal id" });

        const { data: goal } = await healthSupabaseAdmin
          .from("health_goals")
          .select("id")
          .eq("id", goalId)
          .eq("user_id", user.id)
          .single();

        if (!goal) return res.status(403).json({ error: "Invalid goal" });

        const { data, error } = await healthSupabaseAdmin
          .from("health_goal_checkins")
          .upsert(
            {
              goal_id: goalId,
              user_id: user.id,
              ...checkinPayload(req.body),
            },
            { onConflict: "goal_id,checkin_date" },
          )
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json(data);
      }

      const goal = goalPayload(req.body);
      if (!goal.title) return res.status(400).json({ error: "Goal title is required" });

      const { data, error } = await healthSupabaseAdmin
        .from("health_goals")
        .insert({ user_id: user.id, ...goal })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === "PATCH") {
      const id = req.query.id || req.body.id;
      if (!id) return res.status(400).json({ error: "Missing goal id" });

      const { data, error } = await healthSupabaseAdmin
        .from("health_goals")
        .update(goalPayload(req.body))
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === "DELETE") {
      const id = req.query.id || req.body.id;
      if (!id) return res.status(400).json({ error: "Missing goal id" });

      const { error } = await healthSupabaseAdmin
        .from("health_goals")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Goals API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
