import { createClient } from "@supabase/supabase-js";
import { generateHealthChatText } from "../../lib/health-ai-provider";
import { searchHealthWeb, searchYouTubeVideos } from "../../lib/health-resource-search";

export const config = {
  runtime: "nodejs",
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
let requireAuth = process.env.HEALTH_CHAT_REQUIRE_AUTH !== "false";

if (requireAuth && !supabaseAdmin) {
  requireAuth = false;
}

const BLOCK_PATTERNS = [
  /emergency alert|call 911|call or text 988|suicide|self-harm|medical emergency/i,
  /chest pain|can't breathe|cannot breathe|stroke symptoms|worst headache/i,
  /stopped? (my|taking) (blood pressure|diabetes|heart|psychiatric|antidepressant|statin|insulin|metformin)/i,
  /replaced? (my|taking) (medicine|medication|drug|prescription) with (supplement|herb|natural)/i,
  /(warfarin|eliquis|xarelto|plavix|anticoagulant|blood thinner).*(supplement|herb|fish oil|vitamin k)/i,
  /(pregnant|pregnancy|breastfeeding).*supplement/i,
  /(blood sugar|glucose).*(over 300|above 300|very high|under 70|below 70)/i,
  /prompt injection|jailbreak|ignore previous instructions/i,
];

const DEFAULT_FOLLOW_UPS = {
  exercise: [
    "Can you make this a beginner-friendly weekly workout plan?",
    "What warning signs should make me stop exercising?",
    "How can I track progress safely over the next month?",
  ],
  nutrition: [
    "Can you turn this into a simple meal plan?",
    "What grocery list would fit this advice?",
    "What should I ask my clinician or dietitian about this?",
  ],
  stress_sleep: [
    "Can you make a 7-day sleep and stress plan?",
    "What is one small habit I can start tonight?",
    "How should I track whether this is helping?",
  ],
  condition_education: [
    "What lifestyle steps have the strongest evidence here?",
    "What red flags should prompt medical care?",
    "Can you summarize questions for my clinician?",
  ],
  general: [
    "Can you make this into a practical weekly plan?",
    "What should I track to know if this is helping?",
    "What safety cautions should I keep in mind?",
  ],
};

async function getUserFromToken(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !supabaseAdmin) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return user;
}

function shouldBlockSuggestions(...values) {
  const text = values.filter(Boolean).join("\n").slice(0, 9000);
  return BLOCK_PATTERNS.some((pattern) => pattern.test(text));
}

function extractJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (nestedError) {
      return null;
    }
  }
}

function inferIntent(text) {
  const value = String(text || "").toLowerCase();
  if (/(workout|exercise|mobility|stretch|strength|cardio|walk|running|yoga|physical therapy)/.test(value)) return "exercise";
  if (/(meal|diet|nutrition|food|recipe|grocery|protein|carb|sodium|calorie)/.test(value)) return "nutrition";
  if (/(sleep|stress|anxiety|breathing|meditation|insomnia|mindful)/.test(value)) return "stress_sleep";
  if (/(diabetes|hypertension|cholesterol|heart|lupus|arthritis|pain|condition)/.test(value)) return "condition_education";
  return "general";
}

function cleanPrompt(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text || text.length > 120) return "";
  if (shouldBlockSuggestions(text)) return "";
  return text.endsWith("?") ? text : `${text}?`;
}

function cleanQuery(value, intent) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text || text.length > 120 || shouldBlockSuggestions(text)) return "";
  const suffix = intent === "exercise"
    ? "safe beginner exercise education"
    : "evidence based health education";
  return `${text} ${suffix}`;
}

function normalizePlan(plan, userPrompt, assistantResponse) {
  const inferredIntent = inferIntent(`${userPrompt} ${assistantResponse}`);
  const intent = ["exercise", "nutrition", "condition_education", "stress_sleep", "general"].includes(plan?.intent)
    ? plan.intent
    : inferredIntent;
  const followUpPrompts = Array.from(
    new Set([
      ...(Array.isArray(plan?.followUpPrompts) ? plan.followUpPrompts.map(cleanPrompt) : []),
      ...DEFAULT_FOLLOW_UPS[intent],
    ].filter(Boolean)),
  ).slice(0, 3);
  const searchQueries = Array.from(
    new Set([
      ...(Array.isArray(plan?.searchQueries) ? plan.searchQueries.map((query) => cleanQuery(query, intent)) : []),
      cleanQuery(userPrompt, intent),
    ].filter(Boolean)),
  ).slice(0, 3);

  return {
    intent,
    safetyBlocked: Boolean(plan?.safetyBlocked),
    followUpPrompts,
    searchQueries,
  };
}

async function buildSuggestionPlan({ userPrompt, assistantResponse, profileContext, recentMessages }) {
  const messages = [
    {
      role: "system",
      content:
        "You create safe post-response suggestions for an educational health coaching app. Return only valid JSON with keys: followUpPrompts (3 short user questions), searchQueries (1-3 concise health-safe video/web search queries), intent (exercise, nutrition, condition_education, stress_sleep, or general), safetyBlocked (boolean). Do not recommend diagnosis, emergency self-care, medication changes, or supplement use for high-risk situations.",
    },
    {
      role: "user",
      content: JSON.stringify({
        userPrompt: String(userPrompt || "").slice(0, 1000),
        assistantResponse: String(assistantResponse || "").slice(0, 2500),
        profileContext: String(profileContext || "").slice(0, 700),
        recentMessages: Array.isArray(recentMessages)
          ? recentMessages
              .filter((message) => ["user", "assistant"].includes(message.role))
              .slice(-4)
              .map((message) => ({
                role: message.role,
                content: String(message.content || "").slice(0, 500),
              }))
          : [],
      }),
    },
  ];

  try {
    const content = await generateHealthChatText(messages, {
      temperature: 0.1,
      maxTokens: 500,
      format: "json",
      responseFormat: { type: "json_object" },
    });
    return extractJson(content) || {};
  } catch (error) {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (requireAuth && !supabaseAdmin) {
    return res.status(500).json({ error: "Authentication database is not configured" });
  }

  if (requireAuth) {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Please sign in to use health chat suggestions." });
    }
  }

  const {
    userPrompt,
    assistantResponse,
    profileContext = "",
    recentMessages = [],
  } = req.body || {};

  if (
    typeof userPrompt !== "string" ||
    typeof assistantResponse !== "string" ||
    !userPrompt.trim() ||
    !assistantResponse.trim()
  ) {
    return res.status(400).json({ error: "Missing required fields: userPrompt and assistantResponse" });
  }

  if (shouldBlockSuggestions(userPrompt, assistantResponse)) {
    return res.status(200).json({
      safetyBlocked: true,
      intent: inferIntent(`${userPrompt} ${assistantResponse}`),
      followUpPrompts: [],
      searchQueries: [],
      videos: [],
      webResults: [],
      webSearchConfigured: false,
    });
  }

  const aiPlan = await buildSuggestionPlan({
    userPrompt,
    assistantResponse,
    profileContext,
    recentMessages,
  });
  const plan = normalizePlan(aiPlan, userPrompt, assistantResponse);

  if (plan.safetyBlocked) {
    return res.status(200).json({
      ...plan,
      followUpPrompts: [],
      searchQueries: [],
      videos: [],
      webResults: [],
      webSearchConfigured: false,
    });
  }

  const primaryQuery = plan.searchQueries[0] || cleanQuery(userPrompt, plan.intent);
  let videos = [];
  let webResults = [];
  let webSearchConfigured = false;
  let resourceError = "";

  try {
    videos = primaryQuery
      ? await searchYouTubeVideos(primaryQuery, { limit: 4, intent: plan.intent })
      : [];
  } catch (error) {
    resourceError = "Could not load related videos.";
  }

  try {
    const webSearch = primaryQuery
      ? await searchHealthWeb(primaryQuery, { limit: 4 })
      : { configured: false, results: [] };
    webSearchConfigured = webSearch.configured;
    webResults = webSearch.results || [];
  } catch (error) {
    resourceError = resourceError || "Could not load related web results.";
  }

  return res.status(200).json({
    ...plan,
    videos,
    webResults,
    webSearchConfigured,
    resourceError,
  });
}
