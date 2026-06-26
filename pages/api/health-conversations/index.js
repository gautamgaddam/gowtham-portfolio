import { createClient } from "@supabase/supabase-js";
import { getEffectiveSubscriptionTier, hasFullAccess } from "../../../lib/access";

export const config = {
  runtime: "nodejs",
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
const FULL_ACCESS_MONTHLY_LIMIT = 999999;

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

    if (req.method === "GET") {
      // Get paginated list of conversations
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const offset = Math.max(parseInt(req.query.offset) || 0, 0);

      // Get total count
      const { count, error: countError } = await supabaseAdmin
        .from("health_conversations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (countError) throw countError;

      // Get paginated conversations
      const { data: conversationRows, error } = await supabaseAdmin
        .from("health_conversations")
        .select("id, title, messages, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      const conversations = (conversationRows || []).map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        summary: "",
        message_count: Array.isArray(conversation.messages)
          ? conversation.messages.length
          : 0,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
      }));

      // Get current usage stats for this user
      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const { data: usage } = await supabaseAdmin
        .from("usage_tracking")
        .select("usage_count")
        .eq("user_id", user.id)
        .eq("feature", "health_chat")
        .gte("reset_date", firstOfMonth.toISOString().split("T")[0])
        .single();

      // Get user profile for tier limits
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, subscription_tier")
        .eq("id", user.id)
        .single();

      const tier = getEffectiveSubscriptionTier(null, profile);
      const limits = { free: 25, pro: 100, premium: 500 };
      const monthlyLimit = hasFullAccess(null, profile)
        ? FULL_ACCESS_MONTHLY_LIMIT
        : limits[tier];
      
      return res.status(200).json({
        conversations: conversations || [],
        total: count || 0,
        hasMore: offset + conversations.length < (count || 0),
        usage: {
          count: usage?.usage_count || 0,
          limit: monthlyLimit,
          tier,
        },
      });

    } else if (req.method === "POST") {
      // Create new conversation
      const { title } = req.body;

      let { data: conversation, error } = await supabaseAdmin
        .from("health_conversations")
        .insert({
          user_id: user.id,
          title: title || "New Conversation",
          messages: [],
          message_count: 0,
        })
        .select()
        .single();

      if (error?.code === "42703") {
        const retry = await supabaseAdmin
          .from("health_conversations")
          .insert({
            user_id: user.id,
            title: title || "New Conversation",
            messages: [],
          })
          .select()
          .single();

        conversation = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      return res.status(201).json(conversation);

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (error) {
    console.error("Health conversations API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
