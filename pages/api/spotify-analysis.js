import SpotifyWebApi from "spotify-web-api-node";

export const config = {
  runtime: "nodejs",
};

// Spotify API client with credentials flow (no user login required)
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Token cache (in-memory, resets on serverless function restart)
let tokenCache = {
  accessToken: null,
  expiresAt: null,
};

// Get access token with caching
async function getAccessToken() {
  const now = Date.now();

  // Return cached token if still valid (with 60s buffer)
  if (tokenCache.accessToken && tokenCache.expiresAt > now + 60000) {
    spotifyApi.setAccessToken(tokenCache.accessToken);
    return tokenCache.accessToken;
  }

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    const error = new Error("Spotify API credentials are not configured.");
    error.statusCode = 500;
    throw error;
  }

  try {
    const data = await spotifyApi.clientCredentialsGrant();
    tokenCache.accessToken = data.body.access_token;
    tokenCache.expiresAt = now + data.body.expires_in * 1000;

    spotifyApi.setAccessToken(tokenCache.accessToken);
    return tokenCache.accessToken;
  } catch (error) {
    console.error("Error getting Spotify access token:", error);
    console.error("Error details:", error.body);
    throw new Error("Failed to authenticate with Spotify");
  }
}

// Input validation
function validateInput(artistName) {
  if (!artistName || typeof artistName !== "string") {
    return { valid: false, error: "Artist name must be a string" };
  }

  if (artistName.length === 0 || artistName.length > 100) {
    return {
      valid: false,
      error: "Artist name must be between 1 and 100 characters",
    };
  }

  return { valid: true };
}

function normalizeFeatureAverages(averages) {
  if (!averages || typeof averages !== "object") return null;

  const numericFields = [
    "tempo",
    "energy",
    "valence",
    "danceability",
    "acousticness",
    "instrumentalness",
    "speechiness",
    "liveness",
  ];

  return numericFields.reduce((acc, field) => {
    const value = Number(averages[field]);
    acc[field] = Number.isFinite(value) ? value : null;
    return acc;
  }, {});
}

async function getExternalFeatureAnalysis(artistName, artist) {
  if (!process.env.MUSIC_FEATURES_API_URL) {
    return {
      source: "none",
      status: "unavailable",
      message:
        "Spotify no longer provides reliable top-track audio features for this app. Configure MUSIC_FEATURES_API_URL to enrich artist analysis.",
    };
  }

  try {
    const response = await fetch(process.env.MUSIC_FEATURES_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.MUSIC_FEATURES_API_KEY
          ? { Authorization: `Bearer ${process.env.MUSIC_FEATURES_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        artistName,
        spotifyArtist: {
          id: artist.id,
          name: artist.name,
          genres: artist.genres,
          popularity: artist.popularity,
          followers: artist.followers?.total || 0,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`External feature API returned ${response.status}`);
    }

    const data = await response.json();
    const averages = normalizeFeatureAverages(data.averages);

    return {
      source: data.source || "external",
      status: averages ? "ready" : "unavailable",
      message: data.message || null,
      averages,
      tracks: Array.isArray(data.tracks) ? data.tracks : [],
    };
  } catch (error) {
    console.error("External music feature analysis failed:", error);
    return {
      source: "external",
      status: "failed",
      message:
        "External feature analysis failed. Artist metadata is still available.",
    };
  }
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { artistName } = req.body;

    // Validate input
    const validation = validateInput(artistName);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Get access token
    await getAccessToken();

    // Search for artist
    const searchResult = await spotifyApi.searchArtists(`artist:${artistName}`, {
      limit: 1,
    });

    if (searchResult.body.artists.items.length === 0) {
      return res.status(404).json({ error: "Artist not found" });
    }

    const artist = searchResult.body.artists.items[0];
    const featureAnalysis = await getExternalFeatureAnalysis(artistName, artist);

    // Return comprehensive data
    return res.status(200).json({
      artist: {
        id: artist.id,
        name: artist.name,
        image: artist.images[0]?.url,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers?.total || 0,
      },
      tracks: featureAnalysis.tracks || [],
      averages: featureAnalysis.averages || null,
      analysis: {
        source: featureAnalysis.source,
        status: featureAnalysis.status,
        message: featureAnalysis.message,
      },
    });
  } catch (error) {
    console.error("Spotify analysis API error:", error);
    console.error("Error status code:", error.statusCode);
    console.error("Error body:", error.body);

    if (error.statusCode === 401 || error.statusCode === 403) {
      return res.status(500).json({
        error:
          "Spotify authentication failed. Please check your API credentials in the Spotify Developer Dashboard.",
        details: error.body?.error?.message || "Forbidden or Unauthorized",
      });
    }

    if (error.statusCode === 500) {
      return res.status(500).json({
        error: error.message,
      });
    }

    if (error.statusCode === 429) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please try again in a moment.",
      });
    }

    return res.status(500).json({
      error: "An error occurred analyzing the artist",
      details: error.message,
    });
  }
}
