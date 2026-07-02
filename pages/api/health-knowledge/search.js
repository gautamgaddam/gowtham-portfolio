import { createClient } from "@supabase/supabase-js";
import { embedHealthText } from "../../../lib/health-ai-provider";
import bookKnowledge from "../../../lib/health-book-knowledge.cjs";

export const config = {
  runtime: "nodejs",
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
const ADMIN_EMAIL = "gautammaddyson@gmail.com";

function isMissingSearchFunction(error) {
  return (
    error?.code === "PGRST202" ||
    error?.code === "42883" ||
    error?.message?.includes("Could not find the function")
  );
}

// Helper to extract user from JWT token
async function getUserFromToken(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !supabaseAdmin) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return user;
}

export default async function handler(req, res) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Database not configured" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Authenticate user
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { query, limit = 5, threshold = 0.7 } = req.body;

    // Validate inputs
    if (!query) {
      return res.status(400).json({ error: "Missing required field: query" });
    }

    const queryEmbedding = await embedHealthText(query);

    // Call the RPC function to search user conversation knowledge
    const { data: results, error } = await supabaseAdmin.rpc(
      "match_health_knowledge",
      {
        query_embedding: queryEmbedding,
        match_user_id: user.id,
        match_threshold: threshold,
        match_count: limit,
      }
    );

    if (isMissingSearchFunction(error)) {
      return res.status(200).json({ results: [], count: 0 });
    }

    if (error) throw error;

    const documentLimit = Math.max(limit * 2, limit);
    const { data: documentResults, error: documentError } = await supabaseAdmin.rpc(
      "match_health_document_chunks",
      {
        query_embedding: queryEmbedding,
        match_threshold: Math.min(threshold, 0.65),
        match_count: documentLimit,
        include_admin_only: user.email?.toLowerCase() === ADMIN_EMAIL,
      },
    );

    if (isMissingSearchFunction(documentError)) {
      return res.status(200).json({
        results: results || [],
        count: results?.length || 0,
      });
    }

    if (documentError) throw documentError;

    const rankedDocumentResults = bookKnowledge
      .rankHealthBookResults(documentResults || [], query)
      .slice(0, limit);

    return res.status(200).json({
      results: [
        ...(results || []),
        ...rankedDocumentResults.map((item) => ({
          ...item,
          content_type: "document_chunk",
          metadata: {
            ...(item.metadata || {}),
            title: item.title,
            author: item.author,
            category: item.metadata?.category || bookKnowledge.inferBookCategory(
              item.title,
              item.author,
              item.content,
            ),
            page_start: item.page_start,
            page_end: item.page_end,
            chapter: item.chapter,
          },
        })),
      ],
      count: (results?.length || 0) + rankedDocumentResults.length,
    });

  } catch (error) {
    console.error("Knowledge base search error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
