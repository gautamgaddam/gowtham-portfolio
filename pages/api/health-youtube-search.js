import { searchYouTubeVideos } from "../../lib/health-resource-search";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const query = String(req.query.q || "").trim();
  const limit = Math.min(Number.parseInt(req.query.limit || "8", 10) || 8, 20);
  if (!query) {
    return res.status(400).json({ error: "Missing search query" });
  }

  try {
    const videos = await searchYouTubeVideos(query, {
      limit,
      intent: String(req.query.intent || "general"),
    });

    return res.status(200).json({ query, videos });
  } catch (error) {
    console.error("Health YouTube search error:", error);
    return res.status(500).json({ error: error.message || "Failed to search YouTube" });
  }
}
