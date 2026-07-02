import {
  getHealthUser,
  healthSupabaseAdmin,
  isHealthAdmin,
  requireHealthDatabase,
} from "../../../lib/health-api-auth";
import bookKnowledge from "../../../lib/health-book-knowledge.cjs";

export const config = {
  runtime: "nodejs",
};

function metadataPayload(body = {}) {
  const title = body.title || "";
  const author = body.author || "";
  const category = body.category || body.metadata?.category || "";
  const bookMetadata = bookKnowledge.buildBookMetadata({
    title,
    author,
    category,
    tags: body.tags,
    source: body.metadata?.source || "dashboard-upload",
    existingMetadata: body.metadata || {},
  });

  return {
    title,
    author,
    source_kind: body.sourceKind || body.source_kind || "book",
    visibility: body.visibility || "shared",
    tags: bookMetadata.tags,
    metadata: bookMetadata.metadata,
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
      const payload = metadataPayload(req.body);
      const { data, error } = await healthSupabaseAdmin
        .from("health_documents")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      const { error: chunkUpdateError } = await healthSupabaseAdmin
        .from("health_document_chunks")
        .update({
          topics: payload.tags,
          metadata: {
            ...payload.metadata,
            title: payload.title,
            author: payload.author,
            tags: payload.tags,
          },
        })
        .eq("document_id", id);

      if (chunkUpdateError) throw chunkUpdateError;

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
