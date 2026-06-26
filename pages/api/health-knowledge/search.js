import { createClient } from "@supabase/supabase-js";
import { embedHealthText } from "../../../lib/health-ai-provider";

export const config = {
  runtime: "nodejs",
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
const ADMIN_EMAIL = "gautammaddyson@gmail.com";

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

    if (error) throw error;

    const { data: documentResults, error: documentError } = await supabaseAdmin.rpc(
      "match_health_document_chunks",
      {
        query_embedding: queryEmbedding,
        match_threshold: Math.min(threshold, 0.65),
        match_count: limit,
        include_admin_only: user.email?.toLowerCase() === ADMIN_EMAIL,
      },
    );

    if (documentError) throw documentError;

    return res.status(200).json({
      results: [
        ...(results || []),
        ...(documentResults || []).map((item) => ({
          ...item,
          content_type: "document_chunk",
          metadata: {
            title: item.title,
            author: item.author,
            page_start: item.page_start,
            page_end: item.page_end,
            chapter: item.chapter,
          },
        })),
      ],
      count: (results?.length || 0) + (documentResults?.length || 0),
    });

  } catch (error) {
    console.error("Knowledge base search error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
