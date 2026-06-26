export const config = {
  runtime: "nodejs",
};

function extractInitialData(html) {
  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  if (start === -1) return null;

  const jsonStart = start + marker.length;
  const end = html.indexOf(";</script>", jsonStart);
  if (end === -1) return null;

  try {
    return JSON.parse(html.slice(jsonStart, end));
  } catch (error) {
    return null;
  }
}

function collectVideos(node, results = []) {
  if (!node || typeof node !== "object") return results;

  if (node.videoRenderer?.videoId) {
    const video = node.videoRenderer;
    const title = video.title?.runs?.map((run) => run.text).join("") || "YouTube video";
    const channel =
      video.ownerText?.runs?.map((run) => run.text).join("") ||
      video.longBylineText?.runs?.map((run) => run.text).join("") ||
      "";
    const description =
      video.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((run) => run.text).join("") ||
      video.descriptionSnippet?.runs?.map((run) => run.text).join("") ||
      "";
    const duration = video.lengthText?.simpleText || "";
    const published = video.publishedTimeText?.simpleText || "";
    const viewCount = video.viewCountText?.simpleText || "";

    results.push({
      id: video.videoId,
      title,
      channel,
      description,
      duration,
      published,
      viewCount,
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
      thumbnail: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
    });
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      value.forEach((item) => collectVideos(item, results));
    } else if (value && typeof value === "object") {
      collectVideos(value, results);
    }
  }

  return results;
}

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
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`YouTube search failed (${response.status})`);
    }

    const html = await response.text();
    const initialData = extractInitialData(html);
    if (!initialData) {
      throw new Error("Could not parse YouTube search results");
    }

    const videos = collectVideos(initialData)
      .filter((video, index, list) => list.findIndex((item) => item.id === video.id) === index)
      .slice(0, limit);

    return res.status(200).json({ query, videos });
  } catch (error) {
    console.error("Health YouTube search error:", error);
    return res.status(500).json({ error: error.message || "Failed to search YouTube" });
  }
}
