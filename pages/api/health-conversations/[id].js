import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "nodejs",
};

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

  try {
    // Authenticate user
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.query;

    if (req.method === "GET") {
      // Get single conversation with full messages
      const { data: conversation, error } = await supabaseAdmin
        .from("health_conversations")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Conversation not found" });
        }
        throw error;
      }

      return res.status(200).json(conversation);

    } else if (req.method === "PATCH") {
      // Update conversation
      const { messages, title, summary, message_count } = req.body;

      // Verify ownership
      const { data: existing } = await supabaseAdmin
        .from("health_conversations")
        .select("user_id")
        .eq("id", id)
        .single();

      if (!existing || existing.user_id !== user.id) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const updateData = {};
      if (messages !== undefined) updateData.messages = messages;
      if (title !== undefined) updateData.title = title;
      if (summary !== undefined) updateData.summary = summary;
      if (message_count !== undefined) updateData.message_count = message_count;

      let { data: conversation, error } = await supabaseAdmin
        .from("health_conversations")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error?.code === "42703") {
        const compatibleUpdateData = {};
        if (messages !== undefined) compatibleUpdateData.messages = messages;
        if (title !== undefined) compatibleUpdateData.title = title;

        const retry = await supabaseAdmin
          .from("health_conversations")
          .update(compatibleUpdateData)
          .eq("id", id)
          .select()
          .single();

        conversation = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      return res.status(200).json(conversation);

    } else if (req.method === "DELETE") {
      // Delete conversation
      const { data: existing } = await supabaseAdmin
        .from("health_conversations")
        .select("user_id")
        .eq("id", id)
        .single();

      if (!existing || existing.user_id !== user.id) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const { error } = await supabaseAdmin
        .from("health_conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return res.status(200).json({ success: true });

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (error) {
    console.error("Health conversation API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
