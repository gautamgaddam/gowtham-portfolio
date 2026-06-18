import {
  getHealthUser,
  healthSupabaseAdmin,
  isHealthAdmin,
  requireHealthDatabase,
} from "../../../lib/health-api-auth";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (requireHealthDatabase(res)) return;

  try {
    const user = await getHealthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const query = healthSupabaseAdmin
      .from("health_documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isHealthAdmin(user)) {
      query.eq("visibility", "shared").eq("status", "ready");
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({
      documents: data || [],
      isAdmin: isHealthAdmin(user),
    });
  } catch (error) {
    console.error("Health documents API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
