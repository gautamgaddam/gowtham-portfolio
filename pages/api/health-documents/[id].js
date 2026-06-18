import {
  getHealthUser,
  healthSupabaseAdmin,
  isHealthAdmin,
  requireHealthDatabase,
} from "../../../lib/health-api-auth";

export const config = {
  runtime: "nodejs",
};

function metadataPayload(body = {}) {
  return {
    title: body.title || "",
    author: body.author || "",
    source_kind: body.sourceKind || body.source_kind || "book",
    visibility: body.visibility || "shared",
    tags: Array.isArray(body.tags)
      ? body.tags
      : String(body.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
  };
}

export default async function handler(req, res) {
  if (requireHealthDatabase(res)) return;

  try {
    const user = await getHealthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing document id" });

    if (req.method === "GET") {
      const { data: document, error } = await healthSupabaseAdmin
        .from("health_documents")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!document) return res.status(404).json({ error: "Document not found" });
      if (!isHealthAdmin(user) && document.visibility !== "shared") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { data: chunks, error: chunksError } = await healthSupabaseAdmin
        .from("health_document_chunks")
        .select("id, chunk_index, content, page_start, page_end, chapter, topics, conditions")
        .eq("document_id", id)
        .order("chunk_index", { ascending: true })
        .limit(50);

      if (chunksError) throw chunksError;
      return res.status(200).json({ document, chunks: chunks || [] });
    }

    if (!isHealthAdmin(user)) return res.status(403).json({ error: "Admin only" });

    if (req.method === "PATCH") {
      const { data, error } = await healthSupabaseAdmin
        .from("health_documents")
        .update(metadataPayload(req.body))
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === "DELETE") {
      const { data: document } = await healthSupabaseAdmin
        .from("health_documents")
        .select("storage_path")
        .eq("id", id)
        .single();

      if (document?.storage_path) {
        await healthSupabaseAdmin.storage
          .from("health-documents")
          .remove([document.storage_path])
          .catch(() => {});
      }

      const { error } = await healthSupabaseAdmin
        .from("health_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Health document detail API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
