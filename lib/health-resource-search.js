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

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function parseViewCount(value) {
  const text = String(value || "").toLowerCase().replace(/,/g, "");
  const match = text.match(/([\d.]+)\s*([kmb])?/);
  if (!match) return 0;
  const base = Number.parseFloat(match[1]);
  if (!Number.isFinite(base)) return 0;
  const multiplier = match[2] === "b" ? 1_000_000_000 : match[2] === "m" ? 1_000_000 : match[2] === "k" ? 1_000 : 1;
  return Math.round(base * multiplier);
}

function parseDurationSeconds(value) {
  const parts = String(value || "")
    .split(":")
    .map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => !Number.isFinite(part))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function scoreVideo(video, query, intent = "general") {
  const queryTokens = new Set(tokenize(query));
  const text = tokenize(`${video.title} ${video.description} ${video.channel}`);
  const textSet = new Set(text);
  const relevance = [...queryTokens].reduce((score, token) => score + (textSet.has(token) ? 3 : 0), 0);
  const popularity = Math.min(Math.log10(parseViewCount(video.viewCount) + 1), 7);
  const durationSeconds = parseDurationSeconds(video.duration);
  const shortPenalty = durationSeconds != null && durationSeconds < 90 ? -8 : 0;
  const intentBonus =
    intent === "exercise" && /(workout|exercise|mobility|stretch|strength|fitness|physical therapy)/i.test(`${video.title} ${video.description}`)
      ? 5
      : 0;

  return relevance + popularity + intentBonus + shortPenalty;
}

export async function searchYouTubeVideos(query, options = {}) {
  const limit = Math.min(Number.parseInt(options.limit || "8", 10) || 8, 20);
  const intent = options.intent || "general";
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

  return collectVideos(initialData)
    .filter((video, index, list) => list.findIndex((item) => item.id === video.id) === index)
    .map((video) => ({
      ...video,
      popularityScore: parseViewCount(video.viewCount),
      relevanceScore: scoreVideo(video, query, intent),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)
    .map(({ popularityScore, relevanceScore, ...video }) => video);
}

function normalizeWebResult(item, provider) {
  if (provider === "brave") {
    return {
      title: item.title || "Web result",
      url: item.url,
      snippet: item.description || "",
      source: item.profile?.name || new URL(item.url).hostname,
    };
  }

  if (provider === "tavily") {
    return {
      title: item.title || "Web result",
      url: item.url,
      snippet: item.content || "",
      source: item.source || (item.url ? new URL(item.url).hostname : ""),
    };
  }

  return null;
}

export async function searchHealthWeb(query, options = {}) {
  const provider = String(process.env.HEALTH_WEB_SEARCH_PROVIDER || "").toLowerCase();
  const limit = Math.min(Number.parseInt(options.limit || "5", 10) || 5, 10);

  if (!provider || provider === "none") {
    return { configured: false, provider: "", results: [] };
  }

  if (provider === "brave") {
    if (!process.env.BRAVE_SEARCH_API_KEY) {
      return { configured: false, provider, results: [] };
    }

    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(limit));
    url.searchParams.set("safesearch", "strict");
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY,
      },
    });
    if (!response.ok) throw new Error(`Brave search failed (${response.status})`);
    const data = await response.json();
    return {
      configured: true,
      provider,
      results: (data.web?.results || []).map((item) => normalizeWebResult(item, provider)).filter(Boolean),
    };
  }

  if (provider === "tavily") {
    if (!process.env.TAVILY_API_KEY) {
      return { configured: false, provider, results: [] };
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: limit,
        search_depth: "basic",
        include_answer: false,
      }),
    });
    if (!response.ok) throw new Error(`Tavily search failed (${response.status})`);
    const data = await response.json();
    return {
      configured: true,
      provider,
      results: (data.results || []).map((item) => normalizeWebResult(item, provider)).filter(Boolean),
    };
  }

  return { configured: false, provider, results: [] };
}
