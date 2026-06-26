import {
  getHealthUser,
  healthSupabaseAdmin,
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

    if (req.method === "GET") {
      const { data, error } = await healthSupabaseAdmin
        .from("health_user_files")
        .select("id, file_name, file_size_bytes, mime_type, status, summary, error_message, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.status(200).json({ files: data || [] });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Missing file id" });

      const { data: file, error: fetchError } = await healthSupabaseAdmin
        .from("health_user_files")
        .select("id, storage_path")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      if (file?.storage_path) {
        await healthSupabaseAdmin.storage
          .from("health-user-files")
          .remove([file.storage_path])
          .catch(() => {});
      }

      const { error } = await healthSupabaseAdmin
        .from("health_user_files")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Health user files API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
