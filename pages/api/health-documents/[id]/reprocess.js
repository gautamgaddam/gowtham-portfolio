import {
  getHealthUser,
  healthSupabaseAdmin,
  isHealthAdmin,
  requireHealthDatabase,
} from "../../../../lib/health-api-auth";
import { processHealthDocument } from "../../../../lib/health-document-processing";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (requireHealthDatabase(res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getHealthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!isHealthAdmin(user)) return res.status(403).json({ error: "Admin only" });

    const { id } = req.query;
    const { data: document, error } = await healthSupabaseAdmin
      .from("health_documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!document?.storage_path) {
      return res.status(400).json({ error: "Document has no stored PDF path" });
    }

    await healthSupabaseAdmin
      .from("health_documents")
      .update({ status: "processing", error_message: null })
      .eq("id", id);

    const { data: file, error: downloadError } = await healthSupabaseAdmin.storage
      .from("health-documents")
      .download(document.storage_path);

    if (downloadError) throw downloadError;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    try {
      const result = await processHealthDocument({
        supabaseAdmin: healthSupabaseAdmin,
        documentId: id,
        fileBuffer,
      });
      return res.status(200).json(result);
    } catch (processingError) {
      await healthSupabaseAdmin
        .from("health_documents")
        .update({
          status: "failed",
          error_message: processingError.message,
        })
        .eq("id", id);
      throw processingError;
    }
  } catch (error) {
    console.error("Health document reprocess API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
