import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "nodejs",
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

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

    const {
      conversation_id,
      conversationId,
      content,
      content_type,
      contentType,
      metadata,
    } = req.body;

    const conversationIdValue = conversation_id || conversationId || null;
    const contentTypeValue = content_type || contentType;

    // Validate inputs
    if (!content || !contentTypeValue) {
      return res.status(400).json({ error: "Missing required fields: content, content_type" });
    }

    // Content length limit (8000 chars for embedding safety)
    if (content.length > 8000) {
      return res.status(400).json({ error: "Content too long (max 8000 characters)" });
    }

    // Valid content types
    const validTypes = [
      "conversation_summary",
      "meal_plan",
      "clinician_summary",
      "progress_report",
      "supplement_check",
      "other",
    ];
    if (!validTypes.includes(contentTypeValue)) {
      return res.status(400).json({ error: "Invalid content_type" });
    }

    // If conversation_id is provided, verify user owns it
    if (conversationIdValue) {
      const { data: conversation } = await supabaseAdmin
        .from("health_conversations")
        .select("user_id")
        .eq("id", conversationIdValue)
        .single();

      if (!conversation || conversation.user_id !== user.id) {
        return res.status(403).json({ error: "Invalid conversation_id" });
      }
    }

    // Generate embedding using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: content,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Insert into knowledge base
    const { data: kbEntry, error } = await supabaseAdmin
      .from("health_knowledge_base")
      .insert({
        user_id: user.id,
        conversation_id: conversationIdValue,
        content_type: contentTypeValue,
        content,
        embedding,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      id: kbEntry.id,
      content_type: kbEntry.content_type,
      created_at: kbEntry.created_at,
    });

  } catch (error) {
    console.error("Knowledge base embed error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
